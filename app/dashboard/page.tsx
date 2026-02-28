import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Ticket as TicketIcon } from "lucide-react";
import { getMyEvents } from "@/actions/queries";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import connectToDatabase from "@/lib/mongodb";
import { Ticket } from "@/models/Ticket";

export default async function DashboardPage() {
    const events = await getMyEvents();

    await connectToDatabase();
    const eventIds = events.map((e: any) => e._id);
    const ticketsSold = await Ticket.countDocuments({ eventId: { $in: eventIds }, status: "active" });

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
            <div className="flex-1 space-y-8 p-8 pt-12 container mx-auto max-w-5xl animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-border/40 pb-6">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your events and track ticket sales.</p>
                    </div>
                    <Button asChild className="h-10 px-6 font-medium rounded-md">
                        <Link href="/create">Create Event</Link>
                    </Button>
                </div>

                {/* Stat Cards */}
                <div className="grid gap-6 md:grid-cols-2 mt-8">
                    <Card className="bg-transparent border border-border/40 shadow-sm rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pl-6 pr-6 pt-6 pb-2">
                            <CardTitle className="text-sm font-medium text-foreground">Total Events</CardTitle>
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-2">
                            <div className="text-3xl font-semibold">{events.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Events hosted by you</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-transparent border border-border/40 shadow-sm rounded-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pl-6 pr-6 pt-6 pb-2">
                            <CardTitle className="text-sm font-medium text-foreground">Tickets Sold</CardTitle>
                            <TicketIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-2">
                            <div className="text-3xl font-semibold">{ticketsSold > 0 ? `+${ticketsSold}` : "0"}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total RSVPs across all events</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium">Manage Events</h3>
                    </div>
                    <div className="border border-border/40 rounded-xl overflow-hidden bg-transparent">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/40 hover:bg-transparent bg-muted/20">
                                    <TableHead className="w-[45%] font-medium text-xs uppercase tracking-wider">Event</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wider">Location</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wider">Status</TableHead>
                                    <TableHead className="font-medium text-xs uppercase tracking-wider text-right">Date</TableHead>
                                    <TableHead className="w-[140px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <CalendarRange className="w-8 h-8 opacity-20" />
                                                <p>No events created yet.</p>
                                                <Button variant="link" asChild className="text-primary p-0 h-auto">
                                                    <Link href="/create">Create your first event &rarr;</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    events.map((event: any) => (
                                        <TableRow key={event._id} className="border-border/40 hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-foreground text-sm">{event.title}</span>
                                                    <span className="text-xs text-muted-foreground">{event.category}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{event.location}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={event.isPublished ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/40"}>
                                                    {event.isPublished ? "Live" : "Draft"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                {format(new Date(event.startDate), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/events/${event._id}/scan`}>Scan</Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                                        <Link href={`/events/${event._id}/edit`}>Edit</Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
