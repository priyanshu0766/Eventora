"use server";

import connectToDatabase from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createEvent(dataRaw: any) {
    try {
        const data = typeof dataRaw === "string" ? JSON.parse(dataRaw) : dataRaw;
        const clerkUser = await currentUser();

        if (!clerkUser) {
            throw new Error("Unauthorized: You must be logged in to create an event.");
        }

        await connectToDatabase();

        // The user should have been synced via the hook, so we know they exist in MongoDB
        // To be perfectly safe, we could query them here, or just trust the Clerk ID.
        const { User } = await import("@/models/User");
        let mongoUser = await User.findOne({ clerkId: clerkUser.id });

        if (!mongoUser) {
            const userEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
            // Check if user exists with the same email (e.g. from a previous Clerk instance)
            mongoUser = await User.findOne({ email: userEmail });

            if (mongoUser) {
                // Update the clerkId to the new one
                mongoUser.clerkId = clerkUser.id;
                await mongoUser.save();
            } else {
                // Auto-create user document if it truly doesn't exist
                mongoUser = await User.create({
                    clerkId: clerkUser.id,
                    email: userEmail,
                    name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : clerkUser.username || "Unknown",
                    imageUrl: clerkUser.imageUrl,
                });
            }
        }

        const newEvent = await Event.create({
            ...data,
            organizerId: mongoUser._id,
            clerkOrganizerId: clerkUser.id,
        });

        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/dashboard");

        return { success: true, event: JSON.parse(JSON.stringify(newEvent)) };
    } catch (error: any) {
        console.error("Failed to create event:", error);
        return { success: false, error: error.message || "Failed to create event" };
    }
}

export async function getEventsByUser() {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return { success: false, error: "Unauthorized" };
        }

        await connectToDatabase();

        const events = await Event.find({ clerkOrganizerId: clerkUser.id }).sort({ createdAt: -1 }).lean();

        return { success: true, events: JSON.parse(JSON.stringify(events)) };
    } catch (error: any) {
        console.error("Failed to fetch user events:", error);
        return { success: false, error: "Failed to fetch events." };
    }
}

export async function updateEvent(eventId: string, dataRaw: any) {
    try {
        const data = typeof dataRaw === "string" ? JSON.parse(dataRaw) : dataRaw;
        const clerkUser = await currentUser();

        if (!clerkUser) {
            throw new Error("Unauthorized: You must be logged in to update an event.");
        }

        await connectToDatabase();

        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found.");
        }

        if (event.clerkOrganizerId !== clerkUser.id) {
            throw new Error("Unauthorized: You do not have permission to edit this event.");
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { ...data },
            { new: true, runValidators: true }
        );

        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/dashboard/events");
        revalidatePath(`/events/${eventId}`);

        return { success: true, event: JSON.parse(JSON.stringify(updatedEvent)) };
    } catch (error: any) {
        console.error("Failed to update event:", error);
        return { success: false, error: error.message || "Failed to update event." };
    }
}

export async function deleteEvent(eventId: string) {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            throw new Error("Unauthorized: You must be logged in to delete an event.");
        }

        await connectToDatabase();

        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found.");
        }

        if (event.clerkOrganizerId !== clerkUser.id) {
            throw new Error("Unauthorized: You do not have permission to delete this event.");
        }

        // Clean up associated tickets
        const { Ticket } = await import("@/models/Ticket");
        await Ticket.deleteMany({ eventId: event._id });

        await Event.findByIdAndDelete(eventId);

        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/dashboard/events");

        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete event:", error);
        return { success: false, error: error.message || "Failed to delete event." };
    }
}
