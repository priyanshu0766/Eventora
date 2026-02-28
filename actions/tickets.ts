"use server";

import connectToDatabase from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";
import { User } from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { stripe } from "@/lib/stripe";

// tierName and tierPrice are passed from the frontend to avoid relying on
// potentially missing/legacy DB fields for old events.
export async function registerForEvent(
    eventId: string,
    tierId: string,
    tierName: string,
    tierPrice: number
) {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            throw new Error("Unauthorized: You must be logged in to register.");
        }

        await connectToDatabase();

        // 1. Ensure user profile exists
        const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
        let mongoUser = await User.findOne({ clerkId: clerkUser.id });

        if (!mongoUser) {
            mongoUser = await User.findOne({ email: userEmail });
            if (mongoUser) {
                mongoUser.clerkId = clerkUser.id;
                await mongoUser.save();
            } else {
                mongoUser = await User.create({
                    clerkId: clerkUser.id,
                    email: userEmail,
                    name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : clerkUser.username || "Unknown",
                    imageUrl: clerkUser.imageUrl,
                });
            }
        }

        // 2. Fetch the event to ensure it exists (just for title/image, not pricing)
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error("Event not found.");
        }

        const isFree = tierPrice === 0;

        // 3. Handle Free Events: Directly create ticket
        if (isFree) {
            await Ticket.create({
                eventId: event._id,
                userId: mongoUser._id,
                clerkUserId: clerkUser.id,
                tierId,
                tierName,
            });

            revalidatePath(`/events/${eventId}`);
            revalidatePath("/dashboard/tickets");

            return { success: true, url: "/dashboard/tickets" };
        }

        // 4. Handle Paid Events: Create Stripe Checkout Session
        const currentHost = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");

        if (!currentHost) {
            throw new Error("Cannot determine host URL for Stripe Checkout redirect.");
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${currentHost}/dashboard/tickets?success=true`,
            cancel_url: `${currentHost}/events/${eventId}?canceled=true`,
            customer_email: userEmail,
            client_reference_id: clerkUser.id,
            metadata: {
                eventId: eventId,
                clerkUserId: clerkUser.id,
                mongoUserId: mongoUser._id.toString(),
                tierId,
                tierName,
            },
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `${event.title} - ${tierName}`,
                            images: event.imageUrls?.length > 0 ? [event.imageUrls[0]] : [],
                        },
                        unit_amount: Math.round(tierPrice * 100), // Stripe expects amounts in cents
                    },
                    quantity: 1,
                },
            ],
        });

        if (!session.url) {
            throw new Error("Failed to generate Stripe checkout URL.");
        }

        return { success: true, url: session.url };
    } catch (error: any) {
        console.error("Registration block error:", error);
        return { success: false, error: error.message || "Failed to register for the event." };
    }
}

export async function getUserTickets() {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        // Find tickets and populate the event details
        const tickets = await Ticket.find({ clerkUserId: clerkUser.id, status: "active" })
            .populate({
                path: "eventId",
                model: Event,
                populate: {
                    path: "organizerId",
                    model: User,
                    select: "name imageUrl",
                }
            })
            .sort({ purchaseDate: -1 })
            .lean();

        return { success: true, tickets: JSON.parse(JSON.stringify(tickets)) };
    } catch (error: any) {
        console.error("Failed to fetch user tickets:", error);
        return { success: false, error: "Failed to fetch tickets." };
    }
}
