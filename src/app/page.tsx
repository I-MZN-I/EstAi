import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function WelcomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="text-center max-w-2xl mx-auto">
        <Logo className="text-6xl md:text-7xl justify-center mb-4" />
        
        <p className="font-headline text-2xl text-muted-foreground mb-12">
          Luxury listings, smarter prices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Button
            asChild
            variant="outline"
            className="w-full h-auto py-6 text-left flex flex-col items-start bg-white/5 border-white/10 hover:bg-white/10"
          >
            <Link href="/discover">
              <span className="text-lg font-bold text-foreground">Continue as Guest</span>
              <span className="text-sm text-muted-foreground">Browse-only access to listings</span>
            </Link>
          </Button>
          <Button
            asChild
            className="w-full h-auto py-6 text-left flex flex-col items-start bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/login">
              <span className="text-lg font-bold">Sign In / Create Account</span>
              <span className="text-sm opacity-80">Unlock all features</span>
            </Link>
          </Button>
        </div>
      </div>
       <footer className="absolute bottom-8 text-center text-sm text-muted-foreground/50">
          <p>EstAi &copy; {new Date().getFullYear()}</p>
        </footer>
    </main>
  );
}
