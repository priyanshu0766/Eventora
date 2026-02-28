import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
    return (
        <div className="animate-in fade-in zoom-in-95 duration-500">
            <SignIn
                appearance={{
                    baseTheme: dark,
                    elements: {
                        card: "bg-card/50 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl",
                        headerTitle: "text-foreground font-semibold tracking-tight text-2xl",
                        headerSubtitle: "text-muted-foreground",
                        socialButtonsBlockButton: "bg-background hover:bg-muted border border-border/50 text-foreground transition-all rounded-lg",
                        socialButtonsBlockButtonText: "font-semibold",
                        dividerLine: "bg-border/50",
                        dividerText: "text-muted-foreground",
                        formFieldLabel: "text-foreground font-medium",
                        formFieldInput: "bg-background border border-border/50 focus:ring-2 focus:ring-primary/50 text-foreground rounded-md",
                        formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-lg h-10 font-medium",
                        footerActionText: "text-muted-foreground",
                        footerActionLink: "text-primary hover:text-primary/80 transition-colors"
                    }
                }}
            />
        </div>
    );
}
