import { getEventsByUser } from "@/actions/event";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteEventButton } from "@/components/delete-event-button";

export default async function MyEventsPage() {
    const { success, events, error } = await getEventsByUser();

    if (!success) {
        return (
            <div className="min-h-screen bg-background pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center text-red-500 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    {error || "Failed to load your events."}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-32 pb-20 fade-in slide-in-from-bottom-8 duration-1000 animate-in">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">My Events</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Manage the events you have created. Edit details or remove them.
                        </p>
                    </div>
                    <Button size="lg" className="rounded-xl shadow-lg" asChild>
                        <Link href="/create">Create New Event</Link>
                    </Button>
                </div>

                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Ticket className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight mb-2">No events created</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">You haven't hosted any events yet. Start building your community today.</p>
                        <Button asChild>
                            <Link href="/create">Create an Event</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event: any, i: number) => (
                            <div key={event._id} className="group p-[1px] rounded-2xl bg-gradient-to-b from-border/50 to-transparent transition-opacity hover:from-border animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${(i % 3) * 150}ms`, animationFillMode: 'both' }}>
                                <div className="bg-card h-full flex flex-col overflow-hidden rounded-[15px]">

                                    {event?.imageUrls?.[0] ? (
                                        <div className="relative w-full h-48 overflow-hidden bg-muted/20 border-b border-border/50">
                                            <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {event.isVirtual && <Badge variant="secondary" className="bg-background/80 backdrop-blur border-0">Virtual</Badge>}
                                                <Badge variant="default" className="bg-primary/90 backdrop-blur">{event.category}</Badge>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center border-b border-border/50">
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {event.isVirtual && <Badge variant="secondary" className="bg-background/80 backdrop-blur border-0">Virtual</Badge>}
                                                <Badge variant="default" className="bg-primary/90 backdrop-blur">{event.category}</Badge>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-semibold mb-2 line-clamp-1">{event.title}</h3>

                                        <div className="space-y-2 mt-4 map-auto flex-1">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                                                <span>{format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}</span>
                                            </div>
                                            {!event.isVirtual && event.location && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <MapPin className="w-4 h-4 mr-2 text-primary/70" />
                                                    <span className="line-clamp-1">{event.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                                            <div className="font-medium text-lg">
                                                {event.price === 0 ? "Free" : `$${event.price}`}
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <Button size="sm" variant="outline" className="w-full sm:w-auto flex-1" asChild>
                                                    <Link href={`/events/${event._id}/edit`}>
                                                        <Pencil className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <div className="flex-1 w-full sm:w-auto">
                                                    <DeleteEventButton eventId={event._id.toString()} />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
