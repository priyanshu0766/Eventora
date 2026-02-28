"use client";

import { use, useState, useEffect } from "react";
import { checkInTicket } from "@/actions/scan";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Loader2, QrCode, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ScanTicketsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleScan = async (result: any) => {
        if (!result || !result[0] || !result[0].rawValue) return;
        const ticketId = result[0].rawValue;

        // Prevent rapid scanning of the same thing
        if (status === "loading" || scannedResult === ticketId) return;

        setScannedResult(ticketId);
        setStatus("loading");
        setMessage("Verifying ticket...");

        try {
            const res = await checkInTicket(ticketId, id);
            if (res.success) {
                setStatus("success");
                setMessage(res.message + (res.attendeeName ? ` (${res.attendeeName})` : ""));
            } else {
                setStatus("error");
                setMessage(res.error || "Failed to check in.");
            }
        } catch (error: any) {
            setStatus("error");
            setMessage(error.message || "An unexpected error occurred.");
        }

        // Reset the scanner after 3.5 seconds
        setTimeout(() => {
            setStatus("idle");
            setScannedResult(null);
            setMessage("");
        }, 3500);
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-12 container mx-auto max-w-2xl animate-in fade-in duration-500">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>

                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-semibold tracking-tight">Ticket Scanner</h2>
                    <p className="text-muted-foreground text-sm">Scan digital QR codes to check attendees into your event.</p>
                </div>

                <div className="relative w-full aspect-square md:aspect-video bg-muted/20 border border-border/40 rounded-3xl overflow-hidden shadow-sm flex flex-col items-center justify-center">

                    {/* The QR Scanner view */}
                    <div className={cn("w-full h-full transition-opacity duration-300", status === "idle" ? "opacity-100" : "opacity-30 blur-sm pointer-events-none")}>
                        <Scanner
                            onScan={handleScan}
                            components={{
                                audio: false,
                                onOff: false,
                                torch: true,
                                zoom: false,
                                finder: true
                            }}
                        />
                    </div>

                    {/* Status Overlays */}
                    {status !== "idle" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 animate-in zoom-in-95 duration-200">
                            <div className={cn(
                                "flex flex-col justify-center items-center w-full max-w-sm p-8 rounded-2xl shadow-xl border backdrop-blur-md",
                                status === "loading" ? "bg-background/80 border-border/50 text-foreground" :
                                    status === "success" ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" :
                                        "bg-destructive/10 border-destructive/30 text-destructive dark:text-red-400"
                            )}>
                                {status === "loading" && <Loader2 className="w-12 h-12 mb-4 animate-spin text-muted-foreground" />}
                                {status === "success" && <CheckCircle2 className="w-12 h-12 mb-4" />}
                                {status === "error" && <XCircle className="w-12 h-12 mb-4" />}

                                <h3 className="font-semibold text-xl tracking-tight">{
                                    status === "loading" ? "Verifying..." :
                                        status === "success" ? "Valid Ticket" :
                                            "Invalid Ticket"
                                }</h3>
                                <p className={cn("text-sm mt-2 opacity-90", status === "loading" && "text-muted-foreground")}>{message}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-6">
                    <QrCode className="w-4 h-4 opacity-50" />
                    Focus the camera on the attendee's QR ticket
                </div>
            </div>
        </div>
    );
}
