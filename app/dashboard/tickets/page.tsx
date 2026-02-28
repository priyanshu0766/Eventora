import { getUserTickets } from "@/actions/tickets";
import { format } from "date-fns";
import { Calendar, MapPin, Clock, Ticket, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

export default async function MyTicketsPage() {
    const res = await getUserTickets();
    const tickets = res.success ? res.tickets : [];

    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">My Tickets</h1>
                <p className="text-muted-foreground text-lg">Manage your event registrations and upcoming attendances.</p>
            </div>

            {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/60 bg-muted/10">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Ticket className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2">No tickets yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">You haven't registered for any events yet. Explore upcoming events to secure your spot.</p>
                    <Button asChild>
                        <Link href="/explore">Explore Events <ArrowRight className="ml-2 w-4 h-4" /></Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket: any) => {
                        const event = ticket.eventId;
                        return (
                            <div key={ticket._id} className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-md">
                                {event?.imageUrls?.[0] ? (
                                    <div className="relative w-full h-40 overflow-hidden bg-muted/20">
                                        <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-semibold tracking-wide uppercase">Confirmed</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex flex-col items-center justify-center p-6 text-center border-b border-border/50">
                                        <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-xs font-semibold tracking-wide uppercase">Confirmed</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col flex-1 p-5 gap-4">
                                    <div className="space-y-1 flex-1">
                                        <Badge variant="outline" className="text-[10px] w-fit font-medium text-muted-foreground bg-muted/50 border-0 mb-2">{event?.category || "Event"}</Badge>
                                        <h3 className="font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                            <Link href={`/events/${event?._id}`} className="before:absolute before:inset-0">
                                                {event?.title || "Unknown Event"}
                                            </Link>
                                        </h3>
                                    </div>

                                    <div className="space-y-2.5 text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border border-border/50">
                                        <div className="flex items-center gap-2.5 bg-background/50 rounded-md">
                                            <Calendar className="w-4 h-4 shrink-0 text-foreground/60" />
                                            <span className="truncate">{event?.startDate ? format(new Date(event.startDate), "MMMM d, yyyy") : "TBA"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-background/50 rounded-md">
                                            <Clock className="w-4 h-4 shrink-0 text-foreground/60" />
                                            <span className="truncate">{event?.startDate ? format(new Date(event.startDate), "h:mm a") : "TBA"}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-background/50 rounded-md">
                                            <MapPin className="w-4 h-4 shrink-0 text-foreground/60" />
                                            <span className="truncate">{event?.location || "TBA"}</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-dashed border-border flex items-center justify-between">
                                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
                                            ID: {ticket._id.toString().slice(-8)}
                                        </div>
                                        <div className="bg-white p-1 rounded-sm">
                                            <QRCode value={ticket._id.toString()} size={48} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
