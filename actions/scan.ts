"use server";

import connectToDatabase from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { Ticket } from "@/models/Ticket";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function checkInTicket(ticketId: string, eventId: string) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) return { success: false, error: "Unauthorized" };

        await connectToDatabase();

        // Verify the user owns the event
        const event = await Event.findById(eventId);
        if (!event) return { success: false, error: "Event not found" };

        if (event.clerkOrganizerId !== clerkUser.id) {
            return { success: false, error: "You are not authorized to check in tickets for this event." };
        }

        const ticket = await Ticket.findById(ticketId).populate("userId");
        if (!ticket) return { success: false, error: "Invalid ticket ID." };

        if (ticket.eventId.toString() !== eventId) {
            return { success: false, error: "Ticket does not belong to this event." };
        }

        if (ticket.status === "cancelled") {
            return { success: false, error: "Ticket has been cancelled." };
        }

        if (ticket.isScanned) {
            return { success: false, error: "Ticket already checked in previously." };
        }

        // Check them in
        ticket.isScanned = true;
        ticket.scannedAt = new Date();
        ticket.status = "scanned";
        await ticket.save();

        revalidatePath(`/events/${eventId}/scan`);

        return {
            success: true,
            message: "Ticket scanned and checked in successfully!",
            attendeeName: (ticket.userId as any)?.name || "Attendee"
        };
    } catch (err: any) {
        console.error("Scanning error", err);
        return { success: false, error: err.message || "An unexpected error occurred." };
    }
}
