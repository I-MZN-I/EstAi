import { Logo } from "@/components/logo";

const ShimmerLogo = () => (
  <h1 className="text-7xl md:text-8xl font-headline text-center bg-gradient-to-r from-background via-primary to-background bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
    EstAi
  </h1>
);

export function SplashScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background fixed inset-0 z-[100]">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-ring rounded-lg blur-xl opacity-20"></div>
        <ShimmerLogo />
      </div>
    </div>
  );
}
