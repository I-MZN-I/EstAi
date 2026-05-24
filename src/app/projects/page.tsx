"use client";

import { useState, useEffect, useMemo } from "react";
import { useSavedProperties } from "@/context/saved-properties-context";
import { usePostedProperties } from "@/context/posted-properties-context";
import { properties as placeholderProperties } from "@/lib/placeholder-data";
import { PropertyCard } from "@/components/property-card";
import { PostedPropertyCard } from "@/components/posted-property-card";
import { AppLayout } from "@/components/layout/app-layout";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { query, collection, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function ProjectsPage() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toggleSave, isSaved } = useSavedProperties();
    const { postedProperties } = usePostedProperties();

    const [properties, setProperties] = useState<any[]>([]);

    useEffect(() => {
        if (!auth.currentUser) {
            setProperties([]); // Instantly flush old state on sign-out/account switch
            return;
        }

        // Explicitly filter documents by the active account UID
        const q = query(
            collection(db, "saved_properties"),
            where("userId", "==", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProperties(data);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    const savedItems = useMemo(() => {
        const savedIds = properties.map(item => item.propertyId);

        const savedPlaceholder = placeholderProperties
            .filter(p => savedIds.includes(p.id))
            .map(item => ({ ...item, isPosted: false }));

        const savedPosted = postedProperties
            .filter(p => savedIds.includes(p.id))
            .map(item => ({ ...item, isPosted: true }));

        return [...savedPlaceholder, ...savedPosted];
    }, [properties, postedProperties]);

    if (isUserLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-muted-foreground text-sm font-sans">Loading your curations...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!auth.currentUser) {
        return (
            <AppLayout>
                <div className="min-h-screen w-full bg-[#060608] pt-32 pb-12 flex flex-col items-center justify-start px-4 relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-500/5 rounded-full blur-[90px] pointer-events-none" />
                    <div className="w-full max-w-md p-10 bg-zinc-900/10 backdrop-blur-2xl border border-zinc-900/60 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] text-center animate-in fade-in duration-500">
                        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4 border border-primary/20">
                            <Heart className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mb-2 text-glow">Sign In Required</h2>
                        <p className="font-sans text-xs text-zinc-400 mb-6">
                            Please sign in to view and manage your curated architectural curations.
                        </p>
                        <Button
                            className="w-full bg-violet-600/90 text-white hover:bg-violet-600 font-sans text-xs uppercase tracking-wider transition-all duration-300 py-3 rounded-xl font-semibold h-11"
                            onClick={() => router.push("/login")}
                        >
                            Sign In / Register
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="container mx-auto px-6 pt-24 pb-12 max-w-7xl">
                <div className="mb-12">
                    <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Saved Curations</span>
                    <h1 className="font-serif text-4xl font-light tracking-wide text-zinc-100 flex items-center gap-3 text-glow mt-1">
                        Saved Places
                    </h1>
                </div>
                {/* Statistics / Summary */}
                <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                        Total Saved: {savedItems.length} propert{savedItems.length === 1 ? 'y' : 'ies'}
                    </p>
                </div>

                {/* Content */}
                {savedItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                        {savedItems.map((item, index) => (
                            item.isPosted ? (
                                <PostedPropertyCard key={item.id} posted={item as any} index={index} />
                            ) : (
                                <PropertyCard key={item.id} property={item as any} index={index} />
                            )
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-6 bg-zinc-900/20 backdrop-blur-xl border border-zinc-800/25 rounded-2xl shadow-2xl mt-10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                            <Heart className="w-8 h-8 text-primary opacity-50" />
                        </div>
                        <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mb-3 text-glow">No saved properties yet</h2>
                        <p className="text-muted-foreground text-sm font-sans max-w-sm mb-8">
                            Start exploring our curated list of luxury properties and click the heart icon on any property to save it to your projects.
                        </p>
                        <Link href="/discover">
                            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 text-sm font-medium">
                                Explore Properties
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
