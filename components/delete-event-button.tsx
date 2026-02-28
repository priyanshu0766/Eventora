"use client";

import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/actions/event";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteEventButton({ eventId }: { eventId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

        try {
            setIsLoading(true);
            const res = await deleteEvent(eventId);
            if (res.success) {
                router.refresh(); // Refresh the page to reflect deletion
            } else {
                alert(res.error || "Failed to delete the event.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the event.");
            setIsLoading(false);
        }
    }

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full sm:w-auto"
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {isLoading ? "Deleting..." : "Delete Event"}
        </Button>
    );
}
