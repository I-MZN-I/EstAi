"use client";

import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { SplashScreen } from "@/components/splash-screen";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SavedPropertiesProvider } from "@/context/saved-properties-context";
import { PostedPropertiesProvider } from "@/context/posted-properties-context";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "EstAi - Luxury listings, smarter prices.";
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <FirebaseClientProvider>
      <SavedPropertiesProvider>
        <PostedPropertiesProvider>
          {loading ? <SplashScreen /> : children}
          <Toaster />
        </PostedPropertiesProvider>
      </SavedPropertiesProvider>
    </FirebaseClientProvider>
  );
}
