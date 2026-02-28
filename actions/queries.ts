"use server";

import connectToDatabase from "@/lib/mongodb";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";

export async function getEvents(query?: string, category?: string) {
    try {
        await connectToDatabase();

        const filter: any = {};
        if (query) {
            filter.title = { $regex: query, $options: "i" };
        }
        if (category && category !== "All") {
            filter.category = category;
        }

        const events = await Event.find(filter)
            .sort({ startDate: 1 })
            .populate({ path: "organizerId", model: User, select: "name imageUrl" })
            .lean();

        const parsedEvents = JSON.parse(JSON.stringify(events));

        // Backwards compatibility for legacy events
        parsedEvents.forEach((ev: any) => {
            if ((!ev.tickets || ev.tickets.length === 0) && ev.price !== undefined) {
                ev.tickets = [{
                    id: "legacy",
                    name: "General Admission",
                    price: ev.price,
                    capacity: ev.capacity || 100
                }];
            }
        });

        return parsedEvents;
    } catch (error) {
        console.error("Failed to fetch events:", error);
        return [];
    }
}

export async function getEventById(id: string) {
    try {
        await connectToDatabase();

        // Validate Mongo ID
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return null;
        }

        const event = await Event.findById(id)
            .populate({ path: "organizerId", model: User, select: "name imageUrl" })
            .lean();

        if (!event) return null;

        const parsedEvent = JSON.parse(JSON.stringify(event));

        // Backwards compatibility for legacy events
        if ((!parsedEvent.tickets || parsedEvent.tickets.length === 0) && parsedEvent.price !== undefined) {
            parsedEvent.tickets = [{
                id: "legacy",
                name: "General Admission",
                price: parsedEvent.price,
                capacity: parsedEvent.capacity || 100
            }];
        }

        return parsedEvent;
    } catch (error) {
        console.error("Failed to fetch event:", error);
        return null;
    }
}

export async function getMyEvents() {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) return [];

        await connectToDatabase();

        // We can query by the clerk ID directly since we added it to the schema
        const events = await Event.find({ clerkOrganizerId: clerkUser.id })
            .sort({ createdAt: -1 })
            .lean();

        const parsedEvents = JSON.parse(JSON.stringify(events));

        // Backwards compatibility for legacy events
        parsedEvents.forEach((ev: any) => {
            if ((!ev.tickets || ev.tickets.length === 0) && ev.price !== undefined) {
                ev.tickets = [{
                    id: "legacy",
                    name: "General Admission",
                    price: ev.price,
                    capacity: ev.capacity || 100
                }];
            }
        });

        return parsedEvents;
    } catch (error) {
        console.error("Failed to fetch my events:", error);
        return [];
    }
}
