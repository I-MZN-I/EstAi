"use client";

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
} from "lucide-react";
import { useSavedProperties } from "@/context/saved-properties-context";
import { useToast } from "@/hooks/use-toast";

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
  const { postedProperties, removeProperty } = usePostedProperties();
  const { user } = useUser();
  const { isSaved, toggleSave } = useSavedProperties();
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Look up property in both placeholder and posted
  const placeholderProperty = properties.find((p) => p.id === id);
  const postedProperty = postedProperties.find((p) => p.id === id);

  const property = placeholderProperty || null;
  const posted = postedProperty || null;

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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Discover
            </Link>
          </div>
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">{property.title}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              {property.location.locality}, {property.location.city}
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
              <section className="mb-8">
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed">{property.description}</p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Key Facts</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {keyFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3">
                      <fact.icon className="w-6 h-6 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{fact.label}</p>
                        <p className={`text-muted-foreground ${fact.capitalize ? "capitalize" : ""}`}>{fact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-base py-1 px-3">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Location</h2>
                <div className="rounded-xl overflow-hidden border border-primary/20">
                  <div ref={mapCallbackRef} className="w-full h-[350px] bg-zinc-900" />
                </div>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  {property.location.locality}, {property.location.city}, {property.location.state}
                </p>
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-8 lg:sticky top-24 self-start">
              <div className="p-6 bg-card border rounded-lg space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    ${(property.price || property.rentMonthly)?.toLocaleString()}
                    {property.mode === "rent" && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                  </p>
                  <p className="text-primary capitalize">For {property.mode}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="lg">Contact Seller</Button>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => toggleSave(property.id)}
                    >
                      <Heart className={`mr-2 ${saved ? "fill-red-500 text-red-500" : ""}`} /> {saved ? "Saved" : "Save"}
                    </Button>
                    <Button variant="secondary" className="w-full">
                      <Share2 className="mr-2" /> Share
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

    const handleDeleteProperty = () => {
      removeProperty(posted.id);
      toast({ title: "Property deleted", description: `"${posted.title}" has been removed.` });
      router.push("/profile");
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
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <Link href="/discover" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
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

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-bold uppercase tracking-wider">
                User Posted
              </Badge>
              <Badge variant="secondary" className="text-xs uppercase tracking-wider capitalize">
                {posted.propertyType}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-foreground">{posted.title}</h1>
            <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {posted.state ? `${posted.state}, ${posted.city}` : ""}
              {posted.distanceFromTown > 0 && (
                <span className="text-sm">
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
                <section className="mb-8">
                  <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">{posted.description}</p>
                </section>
              )}

              <section className="mb-8">
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Key Facts</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {keyFacts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3">
                      <fact.icon className="w-6 h-6 text-emerald-500 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{fact.label}</p>
                        <p className="text-muted-foreground">{fact.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-headline font-semibold mb-4 border-b pb-2">Location</h2>
                <div className="rounded-xl overflow-hidden border border-emerald-500/20">
                  <div ref={mapCallbackRef} className="w-full h-[350px] bg-zinc-900" />
                </div>
                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {posted.state ? `${posted.state}, ${posted.city}` : ""}
                  {posted.distanceFromTown > 0 && <span> · {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}</span>}
                </p>
              </section>
            </div>

            <aside className="lg:col-span-1 space-y-8 lg:sticky top-24 self-start">
              <div className="p-6 bg-card border border-emerald-500/20 rounded-lg space-y-4">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    <span className="rupee">₹</span>{posted.totalPrice?.toLocaleString()}
                  </p>
                  {posted.pricePerCent > 0 && (
                    <p className="text-sm text-muted-foreground"><span className="rupee">₹</span>{posted.pricePerCent.toLocaleString()} per cent</p>
                  )}
                  <p className="text-emerald-400 capitalize mt-1">For {posted.mode}</p>
                </div>

                {/* Contact details */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  {posted.contactName && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span className="text-foreground font-semibold">{posted.contactName}</span>
                    </div>
                  )}
                  {posted.contactPhone && (
                    <a href={`tel:${posted.contactPhone}`} className="flex items-center gap-3 text-sm hover:text-emerald-400 transition-colors">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>{posted.contactPhone}</span>
                    </a>
                  )}
                  {posted.contactEmail && (
                    <a href={`mailto:${posted.contactEmail}`} className="flex items-center gap-3 text-sm hover:text-emerald-400 transition-colors">
                      <Mail className="w-4 h-4 text-emerald-500" />
                      <span>{posted.contactEmail}</span>
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {posted.contactPhone && (
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 w-full" asChild>
                      <a href={`tel:${posted.contactPhone}`}>
                        <Phone className="mr-2 w-4 h-4" /> Call Seller
                      </a>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => toggleSave(posted.id)}
                    >
                      <Heart className={`mr-2 ${isSaved(posted.id) ? "fill-red-500 text-red-500" : ""}`} />
                      {isSaved(posted.id) ? "Saved" : "Save"}
                    </Button>
                    <Button variant="secondary" className="w-full">
                      <Share2 className="mr-2" /> Share
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
