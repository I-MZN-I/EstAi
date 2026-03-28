"use client";

import { useSavedProperties } from "@/context/saved-properties-context";
import { usePostedProperties } from "@/context/posted-properties-context";
import { properties } from "@/lib/placeholder-data";
import { PropertyCard } from "@/components/property-card";
import { AppLayout } from "@/components/layout/app-layout";
import { Heart, Home, MapPin, BedDouble, Bath, Ruler, Navigation } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
            <div className="container mx-auto px-4 py-8">
                <h1 className="font-headline text-3xl font-bold mb-8 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    Saved Properties
                </h1>
                {/* Statistics / Summary */}
                <div className="mb-8 flex items-center justify-between">
                    <p className="text-muted-foreground">
                        You have {totalSaved} saved propert{totalSaved === 1 ? 'y' : 'ies'}.
                    </p>
                    <Link href="/discover">
                        <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            <span>Back to Discover</span>
                        </Button>
                    </Link>
                </div>

                {/* Content */}
                {totalSaved > 0 ? (
                    <div className="space-y-10">
                        {/* Saved placeholder properties */}
                        {savedPlaceholder.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {savedPlaceholder.map((property) => (
                                    <PropertyCard key={property.id} property={property} />
                                ))}
                            </div>
                        )}

                        {/* Saved posted properties */}
                        {savedPosted.length > 0 && (
                            <>
                                {savedPlaceholder.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-bold">
                                            User Listings
                                        </Badge>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {savedPosted.map((posted) => (
                                        <Link key={posted.id} href={`/listings/${posted.id}`}>
                                            <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-1 border-emerald-500/10 cursor-pointer relative">
                                                {/* Save button */}
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(posted.id); }}
                                                    className="absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-colors duration-200 border border-white/20"
                                                    aria-label="Unsave property"
                                                >
                                                    <Heart className="w-5 h-5 fill-red-500 text-red-500 transition-transform hover:scale-110 active:scale-90" />
                                                </button>

                                                {posted.images?.[0] ? (
                                                    <div className="relative overflow-hidden aspect-video">
                                                        <img
                                                            src={posted.images[0]}
                                                            alt={posted.title}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                                                            <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                                                                {posted.mode === "sale" ? "For Sale" : "For Rent"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-gradient-to-br from-emerald-900/20 to-zinc-900 flex items-center justify-center relative">
                                                        <MapPin className="w-12 h-12 text-emerald-500/30" />
                                                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                                                            <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                                                                {posted.mode === "sale" ? "For Sale" : "For Rent"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                )}

                                                <CardContent className="pt-4 flex-grow">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-sm font-semibold text-emerald-400">{posted.city}</span>
                                                        {posted.distanceFromTown > 0 && (
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                                                                <Navigation className="w-3 h-3" />
                                                                {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold font-headline text-foreground truncate mt-1">
                                                        {posted.title}
                                                    </h3>
                                                    <p className="text-2xl font-bold text-foreground mt-2">
                                                        ₹{posted.totalPrice?.toLocaleString()}
                                                    </p>
                                                </CardContent>

                                                {posted.bedrooms > 0 && (
                                                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground border-t pt-4 pb-4 px-6">
                                                        <div className="flex items-center gap-1.5">
                                                            <BedDouble className="w-4 h-4 text-emerald-500" />
                                                            <span>{posted.bedrooms} Beds</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Bath className="w-4 h-4 text-emerald-500" />
                                                            <span>{posted.bathrooms} Baths</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Ruler className="w-4 h-4 text-emerald-500" />
                                                            <span>{posted.sqft} sqft</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4 border rounded-xl border-dashed bg-card/50 mt-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <Heart className="w-8 h-8 text-primary opacity-50" />
                        </div>
                        <h2 className="text-2xl font-headline font-bold mb-3">No saved properties yet</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            Start exploring our curated list of luxury properties and click the heart icon on any property to save it to your projects.
                        </p>
                        <Link href="/discover">
                            <Button size="lg" className="rounded-full">
                                Explore Properties
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
