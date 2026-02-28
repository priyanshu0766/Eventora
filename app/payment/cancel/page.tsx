import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl border border-border/50 bg-card shadow-lg">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
                    <p className="text-muted-foreground">
                        No worries — you haven't been charged. Your pending reservation will be released automatically.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Button asChild className="w-full rounded-xl" size="lg">
                        <Link href="/explore">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Events
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
