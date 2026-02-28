import { Event } from "@/models/Event";
import connectToDatabase from "@/lib/mongodb";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { EventEditForm } from "@/components/event-edit-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const eventId = String(id);

    const clerkUser = await currentUser();
    if (!clerkUser) {
        redirect("/sign-in");
    }

    await connectToDatabase();
    const event = await Event.findById(eventId).lean();

    if (!event) {
        notFound();
    }

    if (event.clerkOrganizerId !== clerkUser.id) {
        redirect("/dashboard/events"); // Unauthorized
    }

    // Convert ObjectIds/Dates to strings for the client
    const safeEvent = JSON.parse(JSON.stringify(event));

    return <EventEditForm event={safeEvent} />;
}
