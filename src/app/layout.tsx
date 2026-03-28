"use client";

import { useState, useEffect } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SplashScreen } from "@/components/splash-screen";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { SavedPropertiesProvider } from "@/context/saved-properties-context";
import { PostedPropertiesProvider } from "@/context/posted-properties-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "EstAi - Luxury listings, smarter prices.";
    const timer = setTimeout(() => setLoading(false), 2500); // 2.5 seconds for splash screen
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="description" content="Estimate. Explore. Elevate." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <SavedPropertiesProvider>
            <PostedPropertiesProvider>
              {loading ? <SplashScreen /> : children}
              <Toaster />
            </PostedPropertiesProvider>
          </SavedPropertiesProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
