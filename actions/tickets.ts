"use server";

import connectToDatabase from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";
import { User } from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";

// ─── Register for Event ───────────────────────────────────────────────
// Handles both free and paid ticket flows.
// Free: creates ticket with status "active" immediately.
// Paid: creates ticket with status "pending", then creates a Stripe Checkout Session.
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

        // 1. Ensure user profile exists in MongoDB
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
                    name: clerkUser.firstName
                        ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
                        : clerkUser.username || "Unknown",
                    imageUrl: clerkUser.imageUrl,
                });
            }
        }

        // 2. Verify the event exists
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error("Event not found.");
        }

        // 3. Check for duplicate ticket (same user + event + tier)
        const existingTicket = await Ticket.findOne({
            eventId,
            clerkUserId: clerkUser.id,
            tierId,
            status: { $in: ["active", "pending"] },
        });

        if (existingTicket) {
            if (existingTicket.status === "active") {
                return { success: false, error: "You already have a ticket for this event tier." };
            }
            // If pending, they might have abandoned checkout — delete it and let them retry
            await Ticket.deleteOne({ _id: existingTicket._id });
        }

        const isFree = tierPrice === 0;

        // ─── FREE FLOW ────────────────────────────────────────────────────
        if (isFree) {
            await Ticket.create({
                eventId: event._id,
                userId: mongoUser._id,
                clerkUserId: clerkUser.id,
                tierId,
                tierName,
                amount: 0,
                paymentId: `free_${Date.now()}`,
                status: "active",
            });

            revalidatePath(`/events/${eventId}`);
            revalidatePath("/dashboard/tickets");

            return { success: true, url: "/dashboard/tickets" };
        }

        // ─── PAID FLOW ────────────────────────────────────────────────────

        // 4. Create a PENDING ticket in DB
        const pendingTicket = await Ticket.create({
            eventId: event._id,
            userId: mongoUser._id,
            clerkUserId: clerkUser.id,
            tierId,
            tierName,
            amount: tierPrice,
            status: "pending",
        });

        // 5. Create Stripe Checkout Session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/payment/cancel`,
            customer_email: userEmail,
            client_reference_id: clerkUser.id,
            metadata: {
                eventId: eventId,
                clerkUserId: clerkUser.id,
                mongoUserId: mongoUser._id.toString(),
                ticketId: pendingTicket._id.toString(),
                tierId,
                tierName,
                tierPrice: tierPrice.toString(),
            },
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: `${event.title} — ${tierName}`,
                            // Stripe only accepts hosted URLs under 2048 chars (no base64/data URIs)
                            images: (event.imageUrls || []).filter((url: string) => url.startsWith("http") && url.length <= 2048).slice(0, 1),
                        },
                        unit_amount: Math.round(tierPrice * 100),
                    },
                    quantity: 1,
                },
            ],
        });

        if (!session.url) {
            // Cleanup the pending ticket if session creation failed
            await Ticket.deleteOne({ _id: pendingTicket._id });
            throw new Error("Failed to create Stripe checkout session.");
        }

        return { success: true, url: session.url };
    } catch (error: any) {
        console.error("Registration error:", error);
        return {
            success: false,
            error: error.message || "Failed to register for the event.",
        };
    }
}

// ─── Get User Tickets ─────────────────────────────────────────────────
export async function getUserTickets() {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        const tickets = await Ticket.find({
            clerkUserId: clerkUser.id,
            status: { $in: ["active", "scanned"] },
        })
            .populate({
                path: "eventId",
                model: Event,
                populate: {
                    path: "organizerId",
                    model: User,
                    select: "name imageUrl",
                },
            })
            .sort({ purchaseDate: -1 })
            .lean();

        return { success: true, tickets: JSON.parse(JSON.stringify(tickets)) };
    } catch (error: any) {
        console.error("Failed to fetch user tickets:", error);
        return { success: false, error: "Failed to fetch tickets." };
    }
}
