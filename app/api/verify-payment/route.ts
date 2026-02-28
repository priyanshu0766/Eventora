import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import connectToDatabase from "@/lib/mongodb";
import { Ticket } from "@/models/Ticket";
import { currentUser } from "@clerk/nextjs/server";

// POST /api/verify-payment
// Secondary fallback: called by the success page to activate the ticket
// in case the webhook hasn't fired yet or was delayed.
export async function POST(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ success: false, error: "Missing session ID" }, { status: 400 });
        }

        // 1. Retrieve the Stripe Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (!session || session.payment_status !== "paid") {
            return NextResponse.json({ success: false, error: "Payment not completed" }, { status: 400 });
        }

        const { ticketId, eventId, clerkUserId, mongoUserId, tierId, tierName, tierPrice } = session.metadata || {};

        // Security: verify the session belongs to the requesting user
        if (clerkUserId !== clerkUser.id) {
            return NextResponse.json({ success: false, error: "Session does not belong to you" }, { status: 403 });
        }

        await connectToDatabase();

        // 2. Try to activate existing pending ticket
        if (ticketId) {
            const ticket = await Ticket.findById(ticketId);

            if (ticket) {
                if (ticket.status === "active") {
                    // Already activated (idempotent) — possibly by webhook
                    return NextResponse.json({ success: true, ticket: JSON.parse(JSON.stringify(ticket)) });
                }

                if (ticket.status === "pending") {
                    ticket.status = "active";
                    ticket.paymentId = session.payment_intent as string;
                    await ticket.save();
                    return NextResponse.json({ success: true, ticket: JSON.parse(JSON.stringify(ticket)) });
                }
            }
        }

        // 3. Fallback: create a new active ticket if the pending one was lost
        const newTicket = await Ticket.create({
            eventId,
            userId: mongoUserId,
            clerkUserId,
            tierId: tierId || "unknown",
            tierName: tierName || "General",
            amount: tierPrice ? parseFloat(tierPrice) : (session.amount_total || 0) / 100,
            paymentId: session.payment_intent as string,
            status: "active",
        });

        return NextResponse.json({ success: true, ticket: JSON.parse(JSON.stringify(newTicket)) });
    } catch (error: any) {
        console.error("[verify-payment] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Verification failed" },
            { status: 500 }
        );
    }
}
