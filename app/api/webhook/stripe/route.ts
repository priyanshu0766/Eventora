import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import connectToDatabase from "@/lib/mongodb";
import { Ticket } from "@/models/Ticket";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        const { eventId, clerkUserId, mongoUserId, tierId, tierName } = session.metadata || {};

        if (!eventId || !clerkUserId || !mongoUserId || !tierId || !tierName) {
            console.error("Missing metadata in Stripe session.");
            return new NextResponse("Webhook handler failed: Missing metadata.", { status: 400 });
        }

        try {
            await connectToDatabase();

            // Fulfill the ticket
            await Ticket.create({
                eventId,
                userId: mongoUserId,
                clerkUserId,
                tierId,
                tierName,
                status: "active",
            });

            console.log(`Successfully fulfilled ticket for event ${eventId} and user ${clerkUserId}`);
        } catch (error) {
            console.error("Error creating ticket during webhook processing:", error);
            return new NextResponse("Webhook handler failed to create ticket.", { status: 500 });
        }
    }

    return new NextResponse("", { status: 200 });
}
