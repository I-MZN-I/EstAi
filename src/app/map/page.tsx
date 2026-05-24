
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { properties } from "@/lib/placeholder-data";
import { usePostedProperties } from "@/context/posted-properties-context";
import { MapPin, Navigation, Search, Filter, X, BedDouble, Bath, Ruler, ArrowRight, Zap, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";

// Dark mode style for Google Maps to match the EstAi lavender/black theme
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#09090b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#09090b" }, { weight: 2 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#78716c" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#1e1e24" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a8a29e" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#16161a" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#242427" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#52525b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#1f1f23" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d2d30" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#16161a" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0b0f19" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3f3f46" }],
  },
];

export default function MapPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPosted, setSelectedPosted] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const { postedProperties } = usePostedProperties();

  useEffect(() => {
    // API Key loaded from environment configuration
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    if (!apiKey) {
      setMapError("Google Maps API Key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.");
      return;
    }

    // Check if the script is already loaded to avoid duplicates
    if (!(window as any).google?.maps) {
      ((g: Record<string, string>) => { var h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window as any; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f: any, n: any) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), (g as any)[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f: any, ...n: any) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: apiKey,
        v: "weekly"
      });
    }

    const initMap = async () => {
      const google = (window as any).google;
      if (!google || !mapRef.current) return;

      try {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        // Double check ref is still valid after async import
        if (!mapRef.current) return;

        // Center on Kerala
        const center = { lat: 10.8505, lng: 76.2711 };

        googleMap.current = new Map(mapRef.current, {
          center,
          zoom: 7,
          mapId: 'DEMO_MAP_ID',
          styles: mapStyle,
          disableDefaultUI: true,
          backgroundColor: '#09090b',
        });

        // Placeholder property markers
        properties.forEach((property) => {
          const pinContainer = document.createElement('div');
          pinContainer.className = "cursor-pointer scale-90 hover:scale-105 transition-transform duration-300";
          pinContainer.innerHTML = `
            <div class="bg-zinc-950/90 text-primary text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full border border-primary/30 shadow-lg shadow-black/80 whitespace-nowrap">
              ₹${(property.price || property.rentMonthly)?.toLocaleString()}
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map: googleMap.current,
            position: { lat: property.location.lat, lng: property.location.lng },
            title: property.title,
            content: pinContainer
          });

          marker.addListener('click', () => {
            setSelectedProperty(property);
            setSelectedPosted(null);
            googleMap.current.panTo({ lat: property.location.lat, lng: property.location.lng });
          });
        });

        // User-posted property markers
        postedProperties.forEach((posted) => {
          const pLat = Number(posted.lat || (posted as any).latitude || 0);
          const pLng = Number(posted.lng || (posted as any).longitude || 0);
          if (!pLat || !pLng) return;

          const pinContainer = document.createElement('div');
          pinContainer.className = "cursor-pointer scale-90 hover:scale-105 transition-transform duration-300";
          pinContainer.innerHTML = `
            <div class="bg-zinc-950/90 text-emerald-400 text-[11px] font-sans font-semibold px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg shadow-black/80 whitespace-nowrap">
              ₹${posted.totalPrice?.toLocaleString()}
            </div>
          `;

          const marker = new AdvancedMarkerElement({
            map: googleMap.current,
            position: { lat: pLat, lng: pLng },
            title: posted.title,
            content: pinContainer,
          });

          marker.addListener('click', () => {
            setSelectedPosted(posted);
            setSelectedProperty(null);
            googleMap.current.panTo({ lat: pLat, lng: pLng });
          });
        });
      } catch (err: any) {
        console.error("Failed to initialize Google Maps:", err);
        setMapError(err.message || "Failed to load Google Maps. Please check your API key and permissions.");
      }
    };

    // Poll until Google Maps loader is ready
    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps?.importLibrary) {
        initMap();
        clearInterval(checkInterval);
      }
    }, 200);

    return () => clearInterval(checkInterval);
  }, [postedProperties]);

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-zinc-950 mt-16">
        {/* Search Overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search properties in Kerala..."
              className="pl-10 h-12 bg-black/60 backdrop-blur-xl border-primary/20 text-white rounded-full shadow-2xl focus:ring-primary placeholder:text-muted-foreground/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full hover:bg-primary/10 text-primary">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map UI Elements */}
        <div className="absolute right-4 top-20 z-20 flex flex-col gap-2">
          <Button
            size="icon"
            className="rounded-full bg-black/60 backdrop-blur-xl border border-primary/20 shadow-lg text-primary hover:bg-primary/10"
            onClick={() => {
              if (googleMap.current) {
                googleMap.current.panTo({ lat: 10.8505, lng: 76.2711 });
                googleMap.current.setZoom(7);
              }
            }}
          >
            <Navigation className="h-5 w-5" />
          </Button>
        </div>

        {/* Error State Overlay */}
        {mapError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center">
            <Alert variant="destructive" className="max-w-md border-primary/50 bg-black/40 text-primary">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary font-headline text-lg">Map Error</AlertTitle>
              <AlertDescription className="text-muted-foreground mt-2">
                <p className="mb-4">{mapError}</p>
                <div className="text-left bg-white/5 p-4 rounded-lg border border-white/10 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Troubleshooting:</p>
                  <ol className="text-[11px] list-decimal list-inside space-y-2">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" className="text-primary underline flex inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-2 w-2" /></a></li>
                    <li>Ensure <strong>Maps JavaScript API</strong> is enabled.</li>
                    <li>Ensure there are no restrictions on the key preventing it from running on this domain.</li>
                  </ol>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6 border-primary/30 text-primary hover:bg-primary/10 w-full"
                  onClick={() => window.location.reload()}
                >
                  Retry Loading
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Google Map Container */}
        <div ref={mapRef} className="absolute inset-0 z-0 bg-zinc-900" />

        {/* Property Detail Popup */}
        <AnimatePresence>
          {selectedProperty && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-24 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none"
            >
              <Card className="w-full max-w-sm bg-black/80 backdrop-blur-2xl border-primary/20 shadow-2xl pointer-events-auto overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={selectedProperty.media.coverUrl}
                        alt={selectedProperty.title}
                        fill
                        className="object-cover"
                        data-ai-hint={selectedProperty.media.imageHint}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-wider bg-primary/20 text-primary border-0 font-bold">
                          {selectedProperty.type}
                        </Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProperty(null); }}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <h3 className="font-headline font-bold text-base text-white truncate">{selectedProperty.title}</h3>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {selectedProperty.location.locality}, {selectedProperty.location.city}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary">
                        <Zap className="h-3 w-3 fill-primary" />
                        AI ESTIMATE: <span className="rupee font-normal mr-0.5 text-zinc-400">₹</span>{((selectedProperty.price || selectedProperty.rentMonthly)! * 1.05).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-t border-primary/10 py-2.5 px-4 bg-primary/5">
                    <div className="flex flex-col items-center gap-0.5 border-r border-primary/10">
                      <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-white">{selectedProperty.bedrooms} Beds</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 border-r border-primary/10">
                      <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-white">{selectedProperty.bathrooms} Baths</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold text-white">{selectedProperty.areaSqft} sqft</span>
                    </div>
                  </div>

                  <div className="p-3 bg-primary hover:bg-primary/90 transition-colors">
                    <Link href={`/listings/${selectedProperty.id}`} className="flex items-center justify-between font-bold text-primary-foreground text-sm">
                      <span>View Full Listing</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posted Property Detail Popup */}
        <AnimatePresence>
          {selectedPosted && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-24 left-0 right-0 z-30 px-4 flex justify-center pointer-events-none"
            >
              <Card className="w-full max-w-sm bg-black/80 backdrop-blur-2xl border-emerald-500/20 shadow-2xl pointer-events-auto overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Badge className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border-0 font-bold">
                          User Posted
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] uppercase tracking-wider border-0 font-bold">
                          {selectedPosted.propertyType}
                        </Badge>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedPosted(null); }}
                        className="text-muted-foreground hover:text-emerald-400 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="font-headline font-bold text-base text-white truncate">{selectedPosted.title}</h3>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {selectedPosted.city}
                    </p>
                    <p className="text-xl font-bold text-emerald-400">
                      <span className="rupee">₹</span>{selectedPosted.totalPrice?.toLocaleString()}
                    </p>
                    {selectedPosted.distanceFromTown > 0 && (
                      <p className="text-[10px] font-semibold text-emerald-400 mt-1">
                        📍 {selectedPosted.distanceFromTown.toLocaleString()}m from {selectedPosted.nearestTownName}
                      </p>
                    )}
                  </div>

                  {selectedPosted.bedrooms > 0 && (
                    <div className="grid grid-cols-3 border-t border-emerald-500/10 py-2.5 px-4 bg-emerald-500/5">
                      <div className="flex flex-col items-center gap-0.5 border-r border-emerald-500/10">
                        <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-white">{selectedPosted.bedrooms} Beds</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 border-r border-emerald-500/10">
                        <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-white">{selectedPosted.bathrooms} Baths</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-white">{selectedPosted.sqft} sqft</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-600 hover:bg-emerald-500 transition-colors">
                    <Link href={`/listings/${selectedPosted.id}`} className="flex items-center justify-between font-bold text-white text-sm">
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="absolute bottom-24 left-4 z-20 hidden md:block">
          <div className="p-3 rounded-xl bg-black/60 backdrop-blur-xl border border-primary/20 text-[10px] text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" /> Active EstAi Listing
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> User Posted
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
