import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getEvents } from "@/actions/queries";
import { format } from "date-fns";
import { ComponentExample } from "@/components/component-example";

export default async function Home() {
    const upcomingEvents = await getEvents();
    const featuredEvents = upcomingEvents.slice(0, 9);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center">
            {/* Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

            {/* Hero Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-20 fade-in slide-in-from-bottom-8 duration-1000 animate-in">
                <Badge variant="outline" className="mb-8 py-1.5 px-4 rounded-full border-border/50 bg-background/50 backdrop-blur-sm shadow-sm cursor-pointer hover:bg-muted transition-colors">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Eventora Next-Gen is Live <ChevronRight className="w-3 h-3 ml-1" />
                    </span>
                </Badge>

                <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">
                    Orchestrate events <br className="hidden sm:block" /> with elegant precision.
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10 leading-relaxed">
                    The complete toolkit for builders to plan, manage, and scale exceptional technical events and community gatherings.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" className="rounded-full shadow-lg h-12 px-8 text-base">
                        Start for free
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-border/50">
                        <Link href="/explore">Explore events</Link>
                    </Button>
                </div>
            </div>

            {/* Featured Events Quick View */}
            <div className="mt-16 w-full max-w-7xl mx-auto px-4 z-40 relative flex-1 pb-20">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Upcoming Events</h2>
                        <p className="text-muted-foreground">Don't miss out on these exclusive gatherings.</p>
                    </div>
                    <Button variant="ghost" className="group" asChild>
                        <Link href="/explore">
                            View all <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredEvents.length === 0 ? (
                        <div className="col-span-3 text-center py-12 border border-border/50 rounded-xl bg-card/10 backdrop-blur text-muted-foreground">
                            No upcoming events. Check back soon!
                        </div>
                    ) : (
                        featuredEvents.map((event: any, i: number) => (
                            <Link href={`/events/${event._id}`} key={event._id} className="block group h-full">
                                <div className={`h-full p-[1px] rounded-2xl bg-gradient-to-b from-border/50 to-transparent transition-opacity hover:from-border animate-in fade-in slide-in-from-bottom-8`} style={{ animationDelay: `${(i % 3) * 150}ms`, animationFillMode: 'both' }}>
                                    <div className="bg-card h-full flex flex-col overflow-hidden rounded-[15px]">
                                        {event?.imageUrls?.[0] ? (
                                            <div className="relative w-full h-48 overflow-hidden bg-muted/20 border-b border-border/50">
                                                <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                            </div>
                                        ) : (
                                            <div className="relative w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center border-b border-border/50">
                                            </div>
                                        )}
                                        <div className="p-6 flex flex-col flex-1">
                                            <Badge variant="secondary" className="mb-4 bg-muted/50 w-fit">{event.category}</Badge>
                                            <h3 className="text-xl font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{event.description}</p>
                                            <div className="flex items-center justify-between text-sm font-medium mt-auto pt-4 border-t border-border/50">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span>{format(new Date(event.startDate), "MMM d, yyyy")}</span>
                                                </div>
                                                <div className="text-foreground">
                                                    {event.price === 0 ? "Free" : `$${event.price}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}