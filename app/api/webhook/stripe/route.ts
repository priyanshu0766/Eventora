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

    await connectToDatabase();

    // ─── checkout.session.completed ────────────────────────────────────
    // Primary fulfillment: activate the pending ticket
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const { ticketId, eventId, clerkUserId, tierId, tierName } = session.metadata || {};

        if (!ticketId || !eventId || !clerkUserId) {
            console.error("Missing metadata in Stripe session:", session.metadata);
            return new NextResponse("Webhook: Missing metadata.", { status: 400 });
        }

        try {
            // Activate the pending ticket
            const ticket = await Ticket.findById(ticketId);

            if (ticket) {
                if (ticket.status === "pending") {
                    ticket.status = "active";
                    ticket.paymentId = session.payment_intent;
                    await ticket.save();
                    console.log(`[Webhook] Activated ticket ${ticketId} for event ${eventId}`);
                } else {
                    console.log(`[Webhook] Ticket ${ticketId} already has status: ${ticket.status} (idempotent)`);
                }
            } else {
                // Fallback: ticket was deleted (e.g. user retried). Create a new active one.
                console.log(`[Webhook] Ticket ${ticketId} not found — creating new active ticket`);
                const { mongoUserId } = session.metadata || {};
                await Ticket.create({
                    eventId,
                    userId: mongoUserId,
                    clerkUserId,
                    tierId: tierId || "unknown",
                    tierName: tierName || "General",
                    amount: (session.amount_total || 0) / 100,
                    paymentId: session.payment_intent,
                    status: "active",
                });
            }
        } catch (error) {
            console.error("[Webhook] Error activating ticket:", error);
            return new NextResponse("Webhook: Failed to activate ticket.", { status: 500 });
        }
    }

    // ─── checkout.session.expired ──────────────────────────────────────
    // Cleanup: delete the pending ticket that was never paid
    if (event.type === "checkout.session.expired") {
        const session = event.data.object as any;
        const { ticketId } = session.metadata || {};

        if (ticketId) {
            try {
                const result = await Ticket.deleteOne({ _id: ticketId, status: "pending" });
                if (result.deletedCount > 0) {
                    console.log(`[Webhook] Cleaned up expired pending ticket ${ticketId}`);
                }
            } catch (error) {
                console.error("[Webhook] Error cleaning up expired ticket:", error);
            }
        }
    }

    return new NextResponse("OK", { status: 200 });
}
