"use client";

export const dynamic = 'force-dynamic';

import type { PostedProperty } from "@/lib/types";
import { useEffect, useRef, useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { properties } from "@/lib/placeholder-data";
import { usePostedProperties } from "@/context/posted-properties-context";
import { useUser } from "@/firebase";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { AIEstimateCard } from "@/components/ai-estimate-card";
import {
  BedDouble,
  Bath,
  Ruler,
  Building,
  Calendar,
  Compass,
  Heart,
  Share2,
  MapPin,
  Phone,
  Mail,
  User,
  Navigation,
  TreePine,
  Landmark,
  ArrowLeft,
  Trash2,
  Edit3,
  Shield,
  Loader2,
} from "lucide-react";
import { useSavedProperties } from "@/context/saved-properties-context";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase/config";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { cn } from "@/lib/utils";

// Dark-mode style for inline map
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#a78bfa" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c4b5fd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a78bfa" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#111111" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d2d2d" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4c1d95" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
];

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { removeProperty } = usePostedProperties();
  const { user } = useUser();
  const { isSaved, toggleSave } = useSavedProperties();
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Look up property in both placeholder and posted
  const placeholderProperty = properties.find((p) => p.id === id);
  const [liveProperty, setLiveProperty] = useState<PostedProperty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    if (placeholderProperty) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, "properties", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveProperty({
          id: docSnap.id,
          userId: data.userId || "",
          propertyType: data.propertyType || data.property_type || "",
          mode: data.mode || "sale",
          title: data.title || "",
          description: data.description || "",
          bedrooms: Number(data.bedrooms || data.bedroom) || 0,
          bathrooms: Number(data.bathrooms || data.bathroom) || 0,
          rooms: Number(data.rooms) || 0,
          cent: Number(data.cent) || 0,
          sqft: Number(data.sqft) || 0,
          totalFloors: Number(data.totalFloors || data.total_floor) || 1,
          nearestLandmark: data.nearestLandmark || data.nearest_landmark || "",
          roadFacility: data.roadFacility || data.road_facility || "3",
          totalPrice: Number(data.totalPrice || data.total_price) || 0,
          pricePerCent: Number(data.pricePerCent || data.price_per_cent) || 0,
          contactName: data.contactName || data.contact_name || "",
          contactPhone: data.contactPhone || data.contact_phone || "",
          contactEmail: data.contactEmail || data.contact_email || "",
          images: data.images || [],
          lat: Number(data.lat || data.latitude) || 0,
          lng: Number(data.lng || data.longitude) || 0,
          city: data.city || "",
          state: data.state || "",
          distanceFromTown: Number(data.distanceFromTown || data.distance_from_town) || 0,
          nearestTownName: data.nearestTownName || data.nearest_town || "",
          furnished: Number(data.furnished) || 0,
          currency: data.currency || "₹",
          createdAt: data.createdAt?.toDate 
            ? data.createdAt.toDate().toISOString() 
            : (data.createdAt || data.server_posted_date?.toDate 
               ? data.server_posted_date.toDate().toISOString() 
               : new Date().toISOString()),
        } as PostedProperty);
        setLoading(false);
      } else {
        setLiveProperty(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching live property:", error);
      setLiveProperty(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, placeholderProperty]);

  const property = placeholderProperty || null;
  const posted = liveProperty;

  // Determine shared values
  const title = property?.title || posted?.title || "";
  const description = property?.description || posted?.description || "";
  const lat = property?.location?.lat || posted?.lat || 0;
  const lng = property?.location?.lng || posted?.lng || 0;
  const mode = property?.mode || posted?.mode || "sale";
  const price = property?.price || property?.rentMonthly || posted?.totalPrice || 0;
  const city = property?.location
    ? `${property.location.locality}, ${property.location.city}`
    : posted ? (posted.state ? `${posted.state}, ${posted.city}` : "") : "";

  // ─── Google Maps for location section ──────────────────────────────

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) return;
    if (!(window as any).google?.maps) {
      ((g: Record<string, string>) => {
        var h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window as any;
        b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams,
          u = () => h || (h = new Promise(async (f: any, n: any) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), (g as any)[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || "";
            m.head.append(a);
          }));
        d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f: any, ...n: any) => r.add(f) && u().then(() => d[l](f, ...n));
      })({ key: apiKey, v: "weekly" });
    }
  }, []);

  // Callback ref — initialise inline map when the div mounts
  const mapCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !lat || !lng) return;
      mapContainerRef.current = node;

      const initMap = async () => {
        const google = (window as any).google;
        if (!google || !mapContainerRef.current) return;

        try {
          const { Map } = await google.maps.importLibrary("maps");
          const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
          if (!mapContainerRef.current) return;

          const map = new Map(mapContainerRef.current, {
            center: { lat, lng },
            zoom: 15,
            mapId: "DEMO_MAP_ID",
            styles: mapStyle,
            disableDefaultUI: true,
            backgroundColor: "#000000",
          });

          // Pin marker
          const pinDiv = document.createElement("div");
          pinDiv.className = "flex flex-col items-center";
          pinDiv.innerHTML = `
            <div class="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full mb-1 shadow-lg">
              📍 Property Location
            </div>
            <div class="bg-primary p-2.5 rounded-full shadow-primary/40 shadow-lg border-2 border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          `;

          new AdvancedMarkerElement({ map, position: { lat, lng }, content: pinDiv });
          setMapLoaded(true);
        } catch (err) {
          console.error("Map init failed:", err);
        }
      };

      const interval = setInterval(() => {
        if ((window as any).google?.maps?.importLibrary) {
          initMap();
          clearInterval(interval);
        }
      }, 200);
    },
    [lat, lng]
  );

  // ─── Loading Transition ────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen w-full flex items-center justify-center bg-[#060608]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // ─── 404 ───────────────────────────────────────────────────────────

  if (!property && !posted) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex p-6 rounded-full bg-primary/10 mb-6">
            <MapPin className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-headline font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The property you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/discover">Browse Properties</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ─── Placeholder property view ─────────────────────────────────────

  if (property) {
    const saved = isSaved(property.id);
    const keyFacts = [
      { icon: BedDouble, label: "Bedrooms", value: property.bedrooms },
      { icon: Bath, label: "Bathrooms", value: property.bathrooms },
      { icon: Ruler, label: "Area", value: `${property.areaSqft.toLocaleString()} sqft` },
      { icon: Building, label: "Type", value: property.type, capitalize: true },
      { icon: Calendar, label: "Age", value: `${property.ageYears} years` },
      { icon: Compass, label: "Facing", value: property.facing },
    ];

    return (
      <AppLayout>
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-6xl relative bg-editorial-glow">
          <div className="mb-4">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-sans">
              <ArrowLeft className="w-4 h-4" /> Back to Discover
            </Link>
          </div>
          <header className="mb-8 relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
            <h1 className="font-serif text-4xl font-light tracking-wide text-zinc-100 mb-2">{property.title}</h1>
            <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-2 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" />
              {property.location.locality}, <span className="text-gold">{property.location.city}</span>
            </p>
          </header>

          <Carousel className="w-full mb-8" opts={{ loop: true }}>
            <CarouselContent>
              {property.media.urls.map((url, index) => (
                <CarouselItem key={index}>
                  <div className="aspect-video relative overflow-hidden rounded-lg">
                    <Image src={url} alt={`${property.title} - image ${index + 1}`} fill className="object-cover" data-ai-hint={property.media.imageHint} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed font-sans text-sm md:text-base">{property.description}</p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Key Facts</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {keyFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3 p-4 rounded-xl glass-panel border-zinc-800/20 card-glow">
                      <fact.icon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{fact.label}</p>
                        <p className={`text-sm font-medium text-platinum mt-1 ${fact.capitalize ? "capitalize" : ""}`}>{fact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Amenities</h2>
                <div className="flex flex-wrap gap-2.5">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="bg-white/5 border border-white/5 text-zinc-300 font-sans text-xs tracking-wider uppercase py-1.5 px-4 rounded-full">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Location</h2>
                <div className="rounded-2xl overflow-hidden border border-zinc-800/30 shadow-2xl">
                  <div ref={mapCallbackRef} className="w-full h-[350px] bg-zinc-900" />
                </div>
                <p className="text-[11px] font-sans tracking-wide text-zinc-400 mt-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {property.location.locality}, <span className="text-gold">{property.location.city}</span>, {property.location.state}
                </p>
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-8 lg:sticky top-24 self-start">
              <div className="p-6 glass-panel border-zinc-800/30 rounded-2xl space-y-6 card-glow">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Asking Price</p>
                  <p className="text-4xl font-light font-sans tracking-tight text-platinum mt-1">
                    <span className="rupee font-normal mr-0.5 text-zinc-400">₹</span>{(property.price || property.rentMonthly)?.toLocaleString()}
                    {property.mode === "rent" && <span className="text-sm font-normal text-zinc-400">/month</span>}
                  </p>
                  <p className="text-xs text-primary font-sans font-bold tracking-widest uppercase mt-2">For {property.mode}</p>
                </div>
                <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                  <Button size="lg" className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium">Contact Seller</Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 hover:bg-white/5 rounded-xl"
                      onClick={() => toggleSave(property.id)}
                    >
                      <Heart className={cn("mr-2 h-4 w-4", saved ? "fill-red-500 text-red-500" : "")} /> {saved ? "Saved" : "Save"}
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 rounded-xl">
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </div>
                </div>
              </div>

              <AIEstimateCard property={property} />
            </aside>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── Posted property view ──────────────────────────────────────────

  if (posted) {
    const isOwner = user && posted.userId && user.uid === posted.userId;
    const furnishedLabel = posted.furnished === 2 ? "Fully Furnished" : posted.furnished === 1 ? "Semi-furnished" : "Unfurnished";
    const roadLabel = ({ "1": "Kutcha / Mud road", "2": "Paved road", "3": "Tarred road", "4": "Highway" } as Record<string, string>)[posted.roadFacility] || posted.roadFacility;

    const handleDeleteProperty = async () => {
      try {
        const docRef = doc(db, "properties", posted.id);
        await deleteDoc(docRef);

        removeProperty(posted.id);
        toast({ title: "Property deleted", description: `"${posted.title}" has been removed.` });
        router.push("/profile");
      } catch (error) {
        console.error("Error deleting document: ", error);
        toast({ variant: "destructive", title: "Delete Failed", description: "Could not complete request." });
      }
    };

    const keyFacts = [
      ...(posted.bedrooms > 0 ? [{ icon: BedDouble, label: "Bedrooms", value: String(posted.bedrooms) }] : []),
      ...(posted.bathrooms > 0 ? [{ icon: Bath, label: "Bathrooms", value: String(posted.bathrooms) }] : []),
      ...(posted.sqft > 0 ? [{ icon: Ruler, label: "Built-up Area", value: `${posted.sqft.toLocaleString()} sqft` }] : []),
      ...(posted.cent > 0 ? [{ icon: TreePine, label: "Land Area", value: `${posted.cent} cents` }] : []),
      ...(posted.totalFloors > 0 ? [{ icon: Building, label: "Floors", value: String(posted.totalFloors) }] : []),
      { icon: Compass, label: "Furnished", value: furnishedLabel },
      ...(posted.nearestLandmark ? [{ icon: Landmark, label: "Landmark", value: posted.nearestLandmark }] : []),
      { icon: Navigation, label: "Road", value: roadLabel },
    ];

    return (
      <AppLayout>
        <div className="container mx-auto px-4 pt-24 pb-8 max-w-6xl relative bg-editorial-glow">
          <div className="mb-4">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-sans">
              <ArrowLeft className="w-4 h-4" /> Back to Discover
            </Link>
          </div>

          {/* Owner management bar */}
          {isOwner && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">You own this property</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={() => router.push(`/post?edit=${posted.id}`)}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={handleDeleteProperty}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          <header className="mb-8 relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-sans font-bold tracking-widest uppercase py-1 rounded-full">
                User Posted
              </Badge>
              <Badge variant="secondary" className="bg-white/5 border border-white/5 text-zinc-300 text-[9px] font-sans font-bold tracking-widest uppercase py-1 rounded-full capitalize">
                {posted.propertyType}
              </Badge>
            </div>
            <h1 className="font-serif text-4xl font-light tracking-wide text-zinc-100 mb-2">{posted.title}</h1>
            <p className="text-sm font-sans tracking-sans-wide uppercase text-zinc-400 mt-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {posted.state ? `${posted.state}, ${posted.city}` : ""}
              {posted.distanceFromTown > 0 && (
                <span className="text-[11px] text-primary tracking-normal font-sans font-bold uppercase">
                  · {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}
                </span>
              )}
            </p>
          </header>

          {/* Image carousel for posted properties */}
          {posted.images && posted.images.length > 0 ? (
            <Carousel className="w-full mb-8" opts={{ loop: true }}>
              <CarouselContent>
                {posted.images.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative overflow-hidden rounded-lg">
                      <img src={url} alt={`${posted.title} - image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-emerald-900/20 to-zinc-900 rounded-lg flex items-center justify-center mb-8">
              <MapPin className="w-16 h-16 text-emerald-500/30" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {posted.description && (
                <section className="mb-12">
                  <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Description</h2>
                  <p className="text-muted-foreground leading-relaxed font-sans text-sm md:text-base">{posted.description}</p>
                </section>
              )}

              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Key Facts</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {keyFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3 p-4 rounded-xl glass-panel border-zinc-800/20 card-glow">
                      <fact.icon className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{fact.label}</p>
                        <p className="text-sm font-medium text-platinum mt-1">{fact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-editorial font-light text-gold mb-4 border-b border-zinc-800/30 pb-2">Location</h2>
                <div className="rounded-2xl overflow-hidden border border-zinc-800/30 shadow-2xl">
                  <div ref={mapCallbackRef} className="w-full h-[350px] bg-zinc-900" />
                </div>
                <p className="text-[11px] font-sans tracking-wide text-zinc-400 mt-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {posted.state ? `${posted.state}, ${posted.city}` : ""}
                  {posted.distanceFromTown > 0 && <span> · {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}</span>}
                </p>
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-8 lg:sticky top-24 self-start">
              <div className="p-6 glass-panel border-zinc-800/30 rounded-2xl space-y-6 card-glow">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Total Price</p>
                  <p className="text-4xl font-light font-sans tracking-tight text-platinum mt-1">
                    <span className="rupee">₹</span>{posted.totalPrice?.toLocaleString()}
                  </p>
                  {posted.pricePerCent > 0 && (
                    <p className="text-xs text-zinc-400 font-sans mt-1">
                      <span className="rupee">₹</span>{posted.pricePerCent.toLocaleString()} per cent
                    </p>
                  )}
                  <p className="text-xs text-primary font-sans font-bold tracking-widest uppercase mt-2">For {posted.mode}</p>
                </div>
 
                {/* Contact details */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  {posted.contactName && (
                    <div className="flex items-center gap-3 text-xs tracking-wide">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span className="text-zinc-300 font-medium">{posted.contactName}</span>
                    </div>
                  )}
                  {posted.contactPhone && (
                    <a href={`tel:${posted.contactPhone}`} className="flex items-center gap-3 text-xs tracking-wide text-zinc-400 hover:text-primary transition-colors">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>{posted.contactPhone}</span>
                    </a>
                  )}
                  {posted.contactEmail && (
                    <a href={`mailto:${posted.contactEmail}`} className="flex items-center gap-3 text-xs tracking-wide text-zinc-400 hover:text-primary transition-colors">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{posted.contactEmail}</span>
                    </a>
                  )}
                </div>
 
                <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                  {posted.contactPhone && (
                    <Button size="lg" className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium" asChild>
                      <a href={`tel:${posted.contactPhone}`}>
                        <Phone className="mr-2 w-4 h-4" /> Call Seller
                      </a>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-white/10 hover:bg-white/5 rounded-xl"
                      onClick={() => toggleSave(posted.id)}
                    >
                      <Heart className={cn("mr-2 h-4 w-4", isSaved(posted.id) ? "fill-red-500 text-red-500" : "")} />
                      {isSaved(posted.id) ? "Saved" : "Save"}
                    </Button>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 rounded-xl">
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </AppLayout>
    );
  }

  return null;
}
