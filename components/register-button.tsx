"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { registerForEvent } from "@/actions/tickets";
import { Loader2 } from "lucide-react";

interface RegisterButtonProps {
    eventId: string;
    tierId: string;
    tierName: string;
    tierPrice: number;
}

export function RegisterButton({ eventId, tierId, tierName, tierPrice }: RegisterButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleRegister() {
        try {
            setIsLoading(true);
            const res = await registerForEvent(eventId, tierId, tierName, tierPrice);

            if (res.success && res.url) {
                // Use window.location.href for Stripe's external checkout URL
                // (router.push doesn't work for external URLs)
                window.location.href = res.url;
            } else if (!res.success) {
                alert(res.error || "Something went wrong.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("An unexpected error occurred.");
            setIsLoading(false);
        }
    }

    return (
        <Button
            size="lg"
            className="w-full h-12 rounded-xl text-base"
            onClick={handleRegister}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                </>
            ) : (
                tierPrice === 0 ? "Register for Free" : `Buy — ₹${tierPrice.toFixed(2)}`
            )}
        </Button>
    );
}
