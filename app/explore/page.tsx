import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getEvents } from "@/actions/queries";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";

export default async function ExplorePage() {
    const events = await getEvents();

    return (
        <div className="min-h-screen bg-background pt-8 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Discover</h1>
                    <p className="text-muted-foreground text-lg">Find the best tech events, meetups, and workshops near you.</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="secondary" className="px-4 py-1.5 cursor-pointer hover:bg-muted">All</Badge>
                    <Badge variant="outline" className="px-4 py-1.5 cursor-pointer hover:bg-muted">Tech</Badge>
                    <Badge variant="outline" className="px-4 py-1.5 cursor-pointer hover:bg-muted">Design</Badge>
                </div>
            </div>

            <Separator className="mb-12" />

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
                {events.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-muted-foreground">
                        No events found. Be the first to create one!
                    </div>
                ) : (
                    events.map((event: any, index: number) => {
                        const spans = [
                            "md:col-span-2 md:row-span-2",
                            "md:col-span-1 md:row-span-1",
                            "md:col-span-1 md:row-span-1",
                            "md:col-span-2 md:row-span-1"
                        ];
                        const span = spans[index % spans.length];

                        const bgGradients = [
                            "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                            "bg-gradient-to-br from-cyan-400 to-blue-500",
                            "bg-gradient-to-br from-orange-400 to-red-500",
                            "bg-gradient-to-br from-emerald-400 to-cyan-500"
                        ];
                        const img = bgGradients[index % bgGradients.length];

                        return (
                            <Link href={`/events/${event._id}`} key={event._id} className={`${span} block group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border hover:shadow-xl hover:shadow-primary/5 cursor-pointer flex flex-col h-full rounded-xl animate-in fade-in slide-in-from-bottom-8`} style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}>
                                {event.imageUrls && event.imageUrls.length > 0 ? (
                                    <div className="absolute inset-0 z-0">
                                        <Image src={event.imageUrls[0]} alt={event.title} fill className="object-cover opacity-30 group-hover:opacity-50 transition-opacity mix-blend-overlay" />
                                    </div>
                                ) : (
                                    <div className={`absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity ${img}`}></div>
                                )}

                                <div className="p-6 relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start">
                                        <Badge className="bg-background/80 backdrop-blur-md text-foreground hover:bg-background border-border/50 shadow-sm">{event.category}</Badge>
                                        <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 text-center border border-border/50 shadow-sm">
                                            <span className="block text-xs text-muted-foreground font-medium uppercase">{format(new Date(event.startDate), "MMM")}</span>
                                            <span className="block text-xl font-bold">{format(new Date(event.startDate), "dd")}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto transition-transform duration-300 group-hover:-translate-y-1">
                                        <h3 className="text-2xl font-semibold tracking-tight mb-2 line-clamp-1">{event.title}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground gap-4">
                                            <span className="flex items-center gap-1">
                                                <svg className="w-4 h-4" flex-shrink="0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                {format(new Date(event.startDate), "h:mm a")}
                                            </span>
                                            <span className="flex items-center gap-1 truncate w-full pr-4">
                                                <svg className="w-4 h-4" flex-shrink="0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                <span className="truncate">{event.location}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    );
}
