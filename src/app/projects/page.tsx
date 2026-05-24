"use client";

import { useSavedProperties } from "@/context/saved-properties-context";
import { usePostedProperties } from "@/context/posted-properties-context";
import { properties } from "@/lib/placeholder-data";
import { PropertyCard } from "@/components/property-card";
import { PostedPropertyCard } from "@/components/posted-property-card";
import { AppLayout } from "@/components/layout/app-layout";
import { Heart, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProjectsPage() {
    const { savedPropertyIds, toggleSave, isSaved } = useSavedProperties();
    const { postedProperties } = usePostedProperties();

    // Filter the static properties based on the saved IDs
    const savedPlaceholder = properties.filter(property =>
        savedPropertyIds.includes(property.id)
    );

    // Filter the posted properties based on the saved IDs
    const savedPosted = postedProperties.filter(posted =>
        savedPropertyIds.includes(posted.id)
    );

    const totalSaved = savedPlaceholder.length + savedPosted.length;

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
                        Total Saved: {totalSaved} propert{totalSaved === 1 ? 'y' : 'ies'}
                    </p>
                </div>

                {/* Content */}
                {totalSaved > 0 ? (
                    <div className="space-y-16">
                        {/* Saved placeholder properties */}
                        {savedPlaceholder.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-y-12">
                                {savedPlaceholder.map((property, index) => (
                                    <PropertyCard key={property.id} property={property} index={index} />
                                ))}
                            </div>
                        )}

                        {/* Saved posted properties */}
                        {savedPosted.length > 0 && (
                            <>
                                <div className="flex items-center gap-3 py-6">
                                    <Badge className="bg-primary/25 text-primary border border-primary/30 text-[10px] font-sans tracking-widest uppercase">
                                        User Listings
                                    </Badge>
                                    <div className="flex-1 h-[1px] bg-white/5" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-y-12">
                                    {savedPosted.map((posted, index) => (
                                        <PostedPropertyCard key={posted.id} posted={posted} index={index} />
                                    ))}
                                </div>
                            </>
                        )}
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
