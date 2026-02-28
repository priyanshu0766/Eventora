import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Navbar() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-bold text-xl tracking-tighter">Eventora<span className="text-primary"></span></span>
                </Link>

                {/* Center: Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground mr-8">
                    <Link href="/explore" className="hover:text-foreground transition-colors">Discover</Link>
                    <Link href="/create" className="hover:text-foreground transition-colors">Create Event</Link>
                    <SignedIn>
                        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
                        <Link href="/dashboard/tickets" className="hover:text-foreground transition-colors">My Tickets</Link>
                    </SignedIn>
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <ModeToggle />

                    <SignedIn>
                        <UserButton afterSignOutUrl="/" appearance={{
                            elements: {
                                avatarBox: "h-8 w-8 rounded-full border border-border/50",
                            }
                        }} />
                    </SignedIn>

                    <SignedOut>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <SignInButton>
                                <Button variant="ghost" size="sm">Sign In</Button>
                            </SignInButton>
                            <SignUpButton>
                                <Button size="sm" className="rounded-full hidden sm:flex">Get Started</Button>
                            </SignUpButton>
                        </div>
                    </SignedOut>
                </div>
            </div>
        </header>
    );
}
