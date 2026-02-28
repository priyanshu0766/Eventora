"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!sessionId) {
            setStatus("error");
            setErrorMessage("No payment session found.");
            return;
        }

        async function verifyPayment() {
            try {
                const res = await fetch("/api/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                });

                const data = await res.json();

                if (data.success) {
                    setStatus("success");
                } else {
                    setStatus("error");
                    setErrorMessage(data.error || "Verification failed.");
                }
            } catch {
                setStatus("error");
                setErrorMessage("Could not verify payment. Don't worry — your ticket will appear shortly.");
            }
        }

        verifyPayment();
    }, [sessionId]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground text-lg">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border/50 bg-card shadow-lg">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-amber-500" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-foreground">Verification Pending</h1>
                        <p className="text-muted-foreground">{errorMessage}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        If you were charged, your ticket will appear in your dashboard shortly.
                    </p>
                    <Button asChild className="w-full rounded-xl">
                        <Link href="/dashboard/tickets">
                            Go to My Tickets <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border/50 bg-card shadow-lg">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center animate-in zoom-in duration-500">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Payment Successful! 🎉</h1>
                    <p className="text-muted-foreground">
                        Your ticket has been confirmed. You're all set for the event!
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button asChild className="w-full rounded-xl" size="lg">
                        <Link href="/dashboard/tickets">
                            View My Tickets <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full rounded-xl" size="lg">
                        <Link href="/explore">
                            Discover More Events
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
