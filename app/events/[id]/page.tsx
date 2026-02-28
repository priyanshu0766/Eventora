import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock, Share, User, ArrowLeft } from "lucide-react";
import { getEventById } from "@/actions/queries";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { RegisterButton } from "@/components/register-button";

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
        notFound();
    }

    const mapEventId = event._id.toString();

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="container mx-auto px-4 pt-12 max-w-5xl">
                {/* Back button */}
                <Link href="/explore" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to events
                </Link>

                <div className="flex flex-col gap-10">
                    {/* Header Details */}
                    <div className="space-y-6">
                        <Badge variant="secondary" className="bg-muted">{event.category}</Badge>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                            {event.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                            <div className="flex items-center gap-3">
                                {event.organizerId?.imageUrl ? (
                                    <Image src={event.organizerId.imageUrl} alt={event.organizerId.name} width={32} height={32} className="rounded-full border border-border/50" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border/50"><User size={16} /></div>
                                )}
                                <span className="text-sm font-medium text-foreground">{event.organizerId?.name || "Unknown Organizer"}</span>
                            </div>
                            <div className="hidden sm:block w-px h-4 bg-border"></div>
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}</span>
                            </div>
                            <div className="hidden sm:block w-px h-4 bg-border"></div>
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Primary Image */}
                    {event.imageUrls && event.imageUrls.length > 0 && (
                        <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 bg-muted/20">
                            <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover" priority />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-4">
                        <div className="md:col-span-2 space-y-10">
                            {/* Description */}
                            <section className="space-y-4">
                                <h2 className="text-2xl font-semibold tracking-tight">About</h2>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-h2:mt-6 prose-h2:mb-4 prose-h2:text-2xl text-muted-foreground leading-relaxed text-base"
                                    dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                            </section>

                            {/* Gallery */}
                            {event.imageUrls && event.imageUrls.length > 1 && (
                                <section className="space-y-4 pt-6 border-t border-border/50">
                                    <h3 className="text-xl font-semibold tracking-tight">Gallery</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {event.imageUrls.slice(1).map((img: string, idx: number) => (
                                            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                                                <Image src={img} alt={`Gallery image ${idx + 2}`} fill className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar info */}
                        <div className="md:col-span-1">
                            <div className="sticky top-24 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-semibold tracking-tight">Tickets</h3>
                                    {event.tickets && event.tickets.length > 0 ? (
                                        <div className="flex flex-col gap-4">
                                            {event.tickets.map((tier: any) => (
                                                <div key={tier.id} className="p-4 rounded-xl border border-border/50 bg-muted/10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="font-medium text-foreground">{tier.name}</p>
                                                            <p className="text-2xl font-bold tracking-tight text-foreground mt-1">
                                                                {tier.price === 0 ? "Free" : `₹${tier.price.toFixed(2)}`}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground bg-background border border-border/50 px-2 py-1 rounded-md">
                                                            {tier.capacity} left
                                                        </span>
                                                    </div>
                                                    <RegisterButton eventId={mapEventId} tierId={tier.id} tierName={tier.name} tierPrice={tier.price} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-border/50 bg-muted/10 text-center text-sm text-muted-foreground">
                                            Tickets are unavailable.
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 text-sm py-4 border-y border-border/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</span>
                                        <span className="font-medium text-right text-foreground">{format(new Date(event.startDate), "MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Time</span>
                                        <span className="font-medium text-right text-foreground">{format(new Date(event.startDate), "h:mm a")}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue</span>
                                        <span className="font-medium text-right text-foreground truncate max-w-[120px]" title={event.location}>{event.location}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Total Capacity</span>
                                        <span className="font-medium text-right text-foreground">
                                            {event.tickets?.reduce((acc: number, tier: any) => acc + (tier.capacity || 0), 0) || 0} seats
                                        </span>
                                    </div>
                                </div>

                                <Button variant="secondary" className="w-full text-muted-foreground hover:text-foreground"><Share className="w-4 h-4 mr-2" /> Share Event</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
