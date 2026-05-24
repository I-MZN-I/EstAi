"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@/firebase";
import { db } from "@/firebase/config";
import { collection, doc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePostedProperties } from "@/context/posted-properties-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PostedProperty } from "@/lib/types";
import {
  Upload,
  MapPin,
  X,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Home,
  Building2,
  TreePine,
  Store,
  Warehouse,
  ParkingSquare,
  Loader2,
  Navigation,
  Search,
} from "lucide-react";
import { estimatePropertyPrice, type PriceEstimation } from "@/ai/flows/ai-price-estimation-flow";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "Residential House", label: "Residential House", icon: Home },
  { value: "Apartment/Flat", label: "Apartment / Flat", icon: Building2 },
  { value: "Land", label: "Land / Plot", icon: TreePine },
  { value: "Commercial Building", label: "Commercial Building", icon: Warehouse },
  { value: "Shop / Other", label: "Shop / Other", icon: Store },
  { value: "Parking Land", label: "Parking Land", icon: ParkingSquare },
];

const ROAD_OPTIONS = [
  { value: "1", label: "Kutcha / Mud road" },
  { value: "2", label: "Paved / WBM road" },
  { value: "3", label: "Tarred road" },
  { value: "4", label: "National / State Highway" },
];

const FURNISHED_OPTIONS = [
  { value: 0, label: "Unfurnished" },
  { value: 1, label: "Semi-furnished" },
  { value: 2, label: "Fully Furnished" },
];

const isLandType = (t: string) => /land|parking/i.test(t);

// ─── Map dark-mode style (matching map page) ─────────────────────────────────

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

// ─── Section title component ─────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
        {children}
      </span>
      <div className="flex-1 h-px bg-zinc-800/30" />
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            {/* Active expansion ring */}
            {i === currentStep && (
              <motion.div
                layoutId="step-expansion-ring"
                className="absolute -inset-1.5 rounded-full border border-primary/45"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold font-sans transition-all duration-500 relative z-10",
                i < currentStep
                  ? "bg-primary text-primary-foreground"
                  : i === currentStep
                    ? "bg-primary/10 text-primary border border-primary"
                    : "bg-white/5 text-muted-foreground border border-white/5"
              )}
            >
              {i < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
          </div>
          <span
            className={cn(
              "text-[9px] font-sans font-bold tracking-widest uppercase hidden md:block",
              i === currentStep ? "text-primary text-glow" : i < currentStep ? "text-zinc-300" : "text-muted-foreground/30"
            )}
          >
            {labels[i]}
          </span>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                "w-12 h-[1px]",
                i < currentStep ? "bg-primary" : "bg-white/5"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PostPropertyPage() {
  const { addProperty, updateProperty, postedProperties } = usePostedProperties();
  const { toast } = useToast();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const editingProperty = editId ? postedProperties.find((p) => p.id === editId) : null;
  const isEditMode = !!editingProperty;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Default form values
  const defaultForm = {
    propertyType: "Residential House",
    mode: "sale" as "sale" | "rent",
    title: "",
    description: "",
    bedrooms: 0,
    bathrooms: 0,
    rooms: 0,
    cent: 0,
    sqft: 0,
    totalFloors: 1,
    furnished: 0,
    nearestLandmark: "",
    roadFacility: "3",
    totalPrice: 0,
    pricePerCent: 0,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    images: [] as string[],
    lat: 0,
    lng: 0,
    city: "",
    state: "",
    distanceFromTown: 0,
    nearestTownName: "",
  };

  // Form state — pre-fill if editing
  const [form, setForm] = useState(() => {
    if (editingProperty) {
      return {
        propertyType: editingProperty.propertyType || defaultForm.propertyType,
        mode: editingProperty.mode || defaultForm.mode,
        title: editingProperty.title || "",
        description: editingProperty.description || "",
        bedrooms: editingProperty.bedrooms || 0,
        bathrooms: editingProperty.bathrooms || 0,
        rooms: editingProperty.rooms || 0,
        cent: editingProperty.cent || 0,
        sqft: editingProperty.sqft || 0,
        totalFloors: editingProperty.totalFloors || 1,
        furnished: editingProperty.furnished || 0,
        nearestLandmark: editingProperty.nearestLandmark || "",
        roadFacility: editingProperty.roadFacility || "3",
        totalPrice: editingProperty.totalPrice || 0,
        pricePerCent: editingProperty.pricePerCent || 0,
        contactName: editingProperty.contactName || "",
        contactPhone: editingProperty.contactPhone || "",
        contactEmail: editingProperty.contactEmail || "",
        images: editingProperty.images || [],
        lat: editingProperty.lat || 0,
        lng: editingProperty.lng || 0,
        city: editingProperty.city || "",
        state: editingProperty.state || "",
        distanceFromTown: editingProperty.distanceFromTown || 0,
        nearestTownName: editingProperty.nearestTownName || "",
      };
    }
    return defaultForm;
  });

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ─── AI Estimation state ──────────────────────────────────────────
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<PriceEstimation | null>(null);

  // ─── AI Estimation Handler ────────────────────────────────────────
  const handleEstimate = async () => {
    setIsEstimating(true);
    setEstimationResult(null);
    try {
      const result = await estimatePropertyPrice({
        propertyType: form.propertyType,
        city: form.city || "Unknown",
        cent: form.cent || undefined,
        sqft: form.sqft || undefined,
        totalFloors: form.totalFloors || undefined,
        bedroom: form.bedrooms || undefined,
        bathroom: form.bathrooms || undefined,
        furnished: (form.furnished as 0 | 1 | 2) || 0,
        distanceFromTown: form.distanceFromTown || 1000, // Fallback if no map pin
        roadFacility: form.roadFacility || "3",
        nearestLandmarkType: undefined,
      });
      setEstimationResult(result);
    } catch (err) {
      console.error("AI Estimation failed:", err);
      // Fallback UI could be handled here
    } finally {
      setIsEstimating(false);
    }
  };

  // ─── Image upload ──────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Image too large", description: "Max 5MB per image." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, base64],
        }));
      };
      reader.readAsDataURL(file);
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // ─── Google Maps init ──────────────────────────────────────────────

  // Load the Google Maps script once (doesn't depend on step)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!apiKey) return;
    if (!(window as any).google?.maps) {
      ((g: Record<string, string>) => { var h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window as any; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f: any, n: any) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), (g as any)[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = (m.querySelector("script[nonce]") as any)?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f: any, ...n: any) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: apiKey,
        v: "weekly"
      });
    }
  }, []);

  // Callback ref — fires every time the map div mounts into the DOM
  const mapCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      mapRef.current = node;

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      if (!apiKey) {
        toast({ variant: "destructive", title: "Map Error", description: "Google Maps API Key is missing." });
        return;
      }

      const initMap = async () => {
        const google = (window as any).google;
        if (!google || !mapRef.current) return;

        try {
          const { Map } = await google.maps.importLibrary("maps");
          const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
          await google.maps.importLibrary("places");

          if (!mapRef.current) return;

          // Center on Kerala (or previously pinned location)
          const center = form.lat && form.lng
            ? { lat: form.lat, lng: form.lng }
            : { lat: 10.8505, lng: 76.2711 };

          googleMap.current = new Map(mapRef.current, {
            center,
            zoom: form.lat ? 15 : 8,
            mapId: "DEMO_MAP_ID",
            styles: mapStyle,
            disableDefaultUI: false,
            backgroundColor: "#000000",
          });

          // Set up Places Autocomplete on the search input
          if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(
              searchInputRef.current,
              {
                fields: ["geometry", "name", "formatted_address"],
              }
            );
            autocomplete.bindTo("bounds", googleMap.current);
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              if (!place.geometry?.location) return;
              const loc = place.geometry.location;
              googleMap.current.panTo(loc);
              googleMap.current.setZoom(15);
            });
          }

          // If already pinned, show marker
          if (form.lat && form.lng) {
            placeMarker({ lat: form.lat, lng: form.lng }, AdvancedMarkerElement);
          }

          // Click to pin
          googleMap.current.addListener("click", (e: any) => {
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            placeMarker(pos, AdvancedMarkerElement);
            set("lat", pos.lat);
            set("lng", pos.lng);
            calculateDistanceFromTown(pos);
          });

          setMapReady(true);
        } catch (err) {
          console.error("Map init failed:", err);
        }
      };

      // Poll until Google Maps API is ready, then init
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps?.importLibrary) {
          initMap();
          clearInterval(checkInterval);
        }
      }, 200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step]
  );

  const placeMarker = (pos: { lat: number; lng: number }, AdvancedMarkerElement: any) => {
    if (markerRef.current) {
      markerRef.current.map = null;
    }

    const pinContainer = document.createElement("div");
    pinContainer.className = "flex flex-col items-center";
    pinContainer.innerHTML = `
      <div class="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-full mb-1 shadow-lg animate-bounce">
        📍 Your Property
      </div>
      <div class="bg-primary p-2.5 rounded-full shadow-primary/40 shadow-lg border-2 border-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
    `;

    markerRef.current = new AdvancedMarkerElement({
      map: googleMap.current,
      position: pos,
      content: pinContainer,
    });
  };

  // ─── Distance calculation ──────────────────────────────────────────

  const calculateDistanceFromTown = useCallback(async (pos: { lat: number; lng: number }) => {
    setCalculatingDistance(true);
    try {
      const google = (window as any).google;
      if (!google) return;

      const geocoder = new google.maps.Geocoder();

      // First, get address info from the pinned location
      const geoResult = await new Promise<any>((resolve, reject) => {
        geocoder.geocode({ location: pos }, (results: any, status: any) => {
          if (status === "OK" && results?.[0]) resolve(results);
          else reject(new Error("Geocoding failed"));
        });
      });

      // Find city/town/locality and state from address components
      let city = "";
      let state = "";
      let townLocation: { lat: number; lng: number } | null = null;

      for (const result of geoResult) {
        for (const comp of result.address_components) {
          if (
            comp.types.includes("locality") ||
            comp.types.includes("sublocality") ||
            comp.types.includes("administrative_area_level_2")
          ) {
            if (!city) city = comp.long_name;
          }
          if (comp.types.includes("administrative_area_level_1")) {
            if (!state) state = comp.long_name;
          }
        }
      }

      set("city", city || "Unknown");
      if (state) set("state", state);

      // Now geocode the town name to find its center
      if (city) {
        const townResult = await new Promise<any>((resolve, reject) => {
          geocoder.geocode({ address: city + ", Kerala, India" }, (results: any, status: any) => {
            if (status === "OK" && results?.[0]) resolve(results[0]);
            else reject(new Error("Town geocoding failed"));
          });
        });

        townLocation = {
          lat: townResult.geometry.location.lat(),
          lng: townResult.geometry.location.lng(),
        };
      }

      if (townLocation) {
        // Calculate distance using Haversine formula
        const R = 6371000; // Earth's radius in metres
        const dLat = ((townLocation.lat - pos.lat) * Math.PI) / 180;
        const dLng = ((townLocation.lng - pos.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((pos.lat * Math.PI) / 180) *
          Math.cos((townLocation.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = Math.round(R * c);

        set("distanceFromTown", distance);
        set("nearestTownName", city);
      }
    } catch (err) {
      console.error("Distance calculation failed:", err);
      toast({
        variant: "destructive",
        title: "Distance Calculation",
        description: "Could not calculate distance. You can enter it manually.",
      });
    } finally {
      setCalculatingDistance(false);
    }
  }, [toast]);

  // ─── Submit ────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formAny = form as any;
      const editingPropertyAny = editingProperty as any;

      // Build the data payload matching our Excel-extracted snake_case features
      const propertyData = {
        userId: isEditMode ? (editingProperty?.userId || user?.uid || "") : (user?.uid || ""),
        property_type: form.propertyType || formAny.property_type || "",
        city: form.city || "",
        cent: Number(form.cent) || 0,
        sqft: Number(form.sqft) || 0,
        total_floor: Number(form.totalFloors || formAny.total_floor) || 1,
        bedroom: Number(form.bedrooms || formAny.bedroom) || 0,
        bathroom: Number(form.bathrooms || formAny.bathroom) || 0,
        rooms: Number(form.rooms) || 0,
        furnished: Number(form.furnished) || 0,
        distance_from_town: Number(form.distanceFromTown || formAny.distance_from_town) || 0,
        nearest_town: form.nearestTownName || formAny.nearest_town || "",
        road_facility: form.roadFacility || formAny.road_facility || "3",
        nearest_landmark: form.nearestLandmark || formAny.nearest_landmark || "",
        total_price: Number(form.totalPrice || formAny.total_price) || 0,
        price_per_cent: Number(form.pricePerCent || formAny.price_per_cent) || 0,
        latitude: Number(form.lat || formAny.latitude) || 0,
        longitude: Number(form.lng || formAny.longitude) || 0,
        mode: form.mode || "sale",
        title: form.title || "",
        description: form.description || "",
        contact_name: form.contactName || formAny.contact_name || "",
        contact_phone: form.contactPhone || formAny.contact_phone || "",
        contact_email: form.contactEmail || formAny.contact_email || "",
        images: form.images || [],
        currency: isEditMode ? (editingProperty?.currency || "₹") : "₹",
        updatedAt: serverTimestamp(), 
      };

      let targetId = "";

      if (isEditMode && editingProperty?.id) {
        targetId = editingProperty.id;
        const docRef = doc(db, "properties", targetId);
        await setDoc(docRef, propertyData, { merge: true });
      } else {
        const collectionRef = collection(db, "properties");
        const docRef = await addDoc(collectionRef, {
          ...propertyData,
          server_posted_date: serverTimestamp(),
        });
        targetId = docRef.id;
      }

      const localSyncData: PostedProperty = {
        ...propertyData,
        id: targetId,
        createdAt: isEditMode ? editingProperty!.createdAt : new Date().toISOString(),
        posted_date: isEditMode ? editingPropertyAny.posted_date : new Date().toISOString(),
        // Map camelCase fields to satisfy PostedProperty typescript model
        propertyType: form.propertyType || "",
        totalFloors: Number(form.totalFloors) || 1,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        distanceFromTown: Number(form.distanceFromTown) || 0,
        nearestTownName: form.nearestTownName || "",
        roadFacility: form.roadFacility || "3",
        nearestLandmark: form.nearestLandmark || "",
        totalPrice: Number(form.totalPrice) || 0,
        pricePerCent: Number(form.pricePerCent) || 0,
        contactName: form.contactName || "",
        contactPhone: form.contactPhone || "",
        contactEmail: form.contactEmail || "",
        lat: Number(form.lat) || 0,
        lng: Number(form.lng) || 0,
      } as any;

      if (isEditMode) {
        updateProperty(localSyncData);
      } else {
        addProperty(localSyncData);
      }

      setSuccess(true);
      toast({
        title: isEditMode ? "Property Updated! ✅" : "Property Posted! 🎉",
        description: isEditMode ? "Your changes have been saved to Cloud Firestore." : "Your property is now live on EstAi.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save property.";
      toast({ variant: "destructive", title: isEditMode ? "Update Failed" : "Post Failed", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const landType = isLandType(form.propertyType);
  const STEP_LABELS = ["Details", "Features", "Location", "Media", "Review"];
  const totalSteps = STEP_LABELS.length;

  const canGoNext = () => {
    switch (step) {
      case 0:
        return !!form.propertyType && !!form.title.trim();
      case 1:
        return form.totalPrice > 0;
      case 2:
        return form.lat !== 0 && form.lng !== 0;
      case 3:
        return true;
      default:
        return true;
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────

  if (success) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="inline-flex p-6 rounded-full bg-primary/10 mb-6">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-headline font-bold text-foreground mb-4">
            Property Posted Successfully!
          </h1>
          <p className="text-muted-foreground mb-3">
            Your property <strong className="text-primary">{form.title}</strong> is now live.
          </p>
          {form.distanceFromTown > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {form.distanceFromTown.toLocaleString()}m from {form.nearestTownName}
              </span>
            </div>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <Button
              onClick={() => {
                setSuccess(false);
                setStep(0);
                setForm({
                  propertyType: "Residential House",
                  mode: "sale",
                  title: "",
                  description: "",
                  bedrooms: 0,
                  bathrooms: 0,
                  rooms: 0,
                  cent: 0,
                  sqft: 0,
                  totalFloors: 1,
                  furnished: 0,
                  nearestLandmark: "",
                  roadFacility: "3",
                  totalPrice: 0,
                  pricePerCent: 0,
                  contactName: "",
                  contactPhone: "",
                  contactEmail: "",
                  images: [],
                  lat: 0,
                  lng: 0,
                  city: "",
                  state: "",
                  distanceFromTown: 0,
                  nearestTownName: "",
                });
              }}
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              Post Another
            </Button>
            <Button asChild>
              <a href="/map">View on Map</a>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="container mx-auto px-6 pt-24 pb-24 max-w-2xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-5 border border-primary/25 shadow-lg shadow-primary/5">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-light tracking-wide text-zinc-100 text-glow">
            {isEditMode ? "Edit" : "Post"} <span className="italic text-primary">Property</span>
          </h1>
          <p className="text-muted-foreground text-sm font-sans mt-2">
            {isEditMode ? "Update your property details" : "List your property for sale or rent on EstAi"}
          </p>
        </header>

        <StepIndicator currentStep={step} totalSteps={totalSteps} labels={STEP_LABELS} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="bg-zinc-900/20 backdrop-blur-xl border border-zinc-800/25 rounded-2xl shadow-2xl mb-8">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-3xl font-light text-zinc-100 tracking-wide">{STEP_LABELS[step]}</CardTitle>
                <CardDescription className="font-sans text-xs">
                  {step === 0 && "Basic property information"}
                  {step === 1 && "Property features, pricing & contact"}
                  {step === 2 && "Pin your property on the map"}
                  {step === 3 && "Upload property images"}
                  {step === 4 && "Review everything before posting"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* ── Step 0: Property Details ── */}
                {step === 0 && (
                  <>
                    <div>
                      <SectionTitle>Listing Type</SectionTitle>
                      <div className="flex gap-2 mb-6">
                        {(["sale", "rent"] as const).map((m) => (
                          <Button
                            key={m}
                            type="button"
                            variant={form.mode === m ? "default" : "secondary"}
                            className={cn(
                              "flex-1 capitalize",
                              form.mode === m && "shadow-lg shadow-primary/20"
                            )}
                            onClick={() => set("mode", m)}
                          >
                            For {m}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Property Type</SectionTitle>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => set("propertyType", value)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                              form.propertyType === value
                                ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-bold text-center">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Basic Info</SectionTitle>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Property Title *</Label>
                          <Input
                            placeholder="e.g. Beautiful 3BHK House in Thrissur"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Description</Label>
                          <textarea
                            className="w-full min-h-[100px] input-editorial-underline resize-none text-foreground py-2 text-sm"
                            placeholder="Describe your property..."
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 1: Features, Pricing & Contact ── */}
                {step === 1 && (
                  <>
                    {!landType && (
                      <div>
                        <SectionTitle>Building Features</SectionTitle>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Bedrooms</Label>
                            <Input
                              type="number"
                              min={0}
                              max={50}
                              value={form.bedrooms || ""}
                              onChange={(e) => set("bedrooms", Number(e.target.value))}
                              placeholder="3"
                              className="input-editorial-underline h-11 text-foreground"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Bathrooms</Label>
                            <Input
                              type="number"
                              min={0}
                              max={50}
                              value={form.bathrooms || ""}
                              onChange={(e) => set("bathrooms", Number(e.target.value))}
                              placeholder="2"
                              className="input-editorial-underline h-11 text-foreground"
                            />
                          </div>
                          {/commercial/i.test(form.propertyType) && (
                            <div className="space-y-2">
                              <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Rooms</Label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={form.rooms || ""}
                                onChange={(e) => set("rooms", Number(e.target.value))}
                                placeholder="8"
                                className="input-editorial-underline h-11 text-foreground"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Total Floors</Label>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={form.totalFloors || ""}
                              onChange={(e) => set("totalFloors", Number(e.target.value))}
                              placeholder="2"
                              className="input-editorial-underline h-11 text-foreground"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Furnished Status</Label>
                          <div className="flex gap-2">
                            {FURNISHED_OPTIONS.map((o) => (
                              <Button
                                key={o.value}
                                type="button"
                                variant={form.furnished === o.value ? "default" : "secondary"}
                                className={cn(
                                  "flex-1",
                                  form.furnished === o.value && "shadow-lg shadow-primary/20"
                                )}
                                onClick={() => set("furnished", o.value)}
                              >
                                {o.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <SectionTitle>Size</SectionTitle>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Property Area (cents)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={form.cent || ""}
                            onChange={(e) => set("cent", Number(e.target.value))}
                            placeholder="8"
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        {!landType && (
                          <div className="space-y-2">
                            <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Built-up Area (sqft)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={form.sqft || ""}
                              onChange={(e) => set("sqft", Number(e.target.value))}
                              placeholder="1500"
                              className="input-editorial-underline h-11 text-foreground"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Location Details</SectionTitle>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">City</Label>
                          <Input
                            placeholder="e.g. Thrissur"
                            value={form.city}
                            onChange={(e) => set("city", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">State</Label>
                          <Input
                            placeholder="e.g. Kerala"
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Nearest Landmark</Label>
                          <Input
                            placeholder="e.g. St. Mary's Church"
                            value={form.nearestLandmark}
                            onChange={(e) => set("nearestLandmark", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Road Facility</Label>
                          <Select
                            value={form.roadFacility}
                            onValueChange={(v) => set("roadFacility", v)}
                          >
                            <SelectTrigger className="input-editorial-underline h-11 text-foreground border-b border-white/8">
                              <SelectValue placeholder="Select road type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROAD_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Pricing *</SectionTitle>

                      {/* --- AI Estimation Section --- */}
                      <div className="mb-6 bg-zinc-900 border border-primary/20 rounded-xl p-5 shadow-lg">
                        <div className="flex flex-col sm:flex-row items-baseline gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="font-serif text-2xl font-light tracking-wide text-zinc-100">AI Price Recommendation</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Get a data-driven price estimate based on your property details and market trends.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={handleEstimate}
                            disabled={isEstimating || !form.city}
                            className={`whitespace-nowrap ${
                              isEstimating ? "bg-primary/20 cursor-wait" : ""
                            }`}
                          >
                            {isEstimating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                              </>
                            ) : (
                              "Estimate Price with AI"
                            )}
                          </Button>
                        </div>

                        {estimationResult && (
                          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center justify-between mb-2">
                              {/* Use explicit styling to handle the confidence level */}
                              <Badge className={`border-0 uppercase text-[10px] bg-emerald-500/20 text-emerald-400`}>
                                {estimationResult.confidence} CONFIDENCE
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                Based on {estimationResult.datasetSize} market records
                              </span>
                            </div>

                            <p className="text-3xl font-bold text-foreground font-headline mb-1">
                              <span className="rupee">₹</span>{estimationResult.midPrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-primary mb-3">
                              Suggested Range: <span className="rupee">₹</span>{estimationResult.minPrice.toLocaleString()} - <span className="rupee">₹</span>{estimationResult.maxPrice.toLocaleString()}
                            </p>

                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                              "{estimationResult.reasoning}"
                            </p>
                          </div>
                        )}
                        {!form.city && !estimationResult && (
                          <p className="text-[10px] text-muted-foreground mt-2 inline-block">
                            * Please enter a City above to enable AI estimation.
                          </p>
                        )}
                      </div>
                      {/* ----------------------------- */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Total Asking Price (<span className="rupee">₹</span>)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={form.totalPrice || ""}
                            onChange={(e) => set("totalPrice", Number(e.target.value))}
                            placeholder="5000000"
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Price per Cent (<span className="rupee">₹</span>)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={form.pricePerCent || ""}
                            onChange={(e) => set("pricePerCent", Number(e.target.value))}
                            placeholder="600000"
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <SectionTitle>Contact Details</SectionTitle>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Seller Name</Label>
                          <Input
                            placeholder="Full name"
                            value={form.contactName}
                            onChange={(e) => set("contactName", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Phone Number</Label>
                          <Input
                            type="tel"
                            placeholder="+91 XXXXX XXXXX"
                            value={form.contactPhone}
                            onChange={(e) => set("contactPhone", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Email</Label>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={form.contactEmail}
                            onChange={(e) => set("contactEmail", e.target.value)}
                            className="input-editorial-underline h-11 text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Step 2: Map Pin ── */}
                {step === 2 && (
                  <div>
                    <SectionTitle>Pin Property Location</SectionTitle>
                    <p className="text-sm text-muted-foreground mb-4">
                      Search for a location to navigate the map, then click to place your property pin.
                    </p>

                    {/* Location search bar */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for a place or address..."
                        className="w-full h-11 pl-10 pr-4 input-editorial-underline text-foreground text-sm focus:border-b-violet-500/70"
                      />
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-primary/20">
                      <div ref={mapCallbackRef} className="w-full h-[400px] bg-zinc-900" />

                      {/* Pin info overlay */}
                      {form.lat !== 0 && form.lng !== 0 && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xl border border-primary/20 rounded-xl p-4 z-10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Pinned Location</span>
                              </div>
                              <p className="text-sm text-white font-semibold">
                                {form.city || "Detecting location..."}{form.state ? `, ${form.state}` : ''}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                              </p>
                            </div>
                            <div className="text-right">
                              {calculatingDistance ? (
                                <div className="flex items-center gap-2 text-primary">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-xs">Calculating...</span>
                                </div>
                              ) : form.distanceFromTown > 0 ? (
                                <div>
                                  <p className="text-lg font-bold text-primary">
                                    {form.distanceFromTown.toLocaleString()}m
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    from {form.nearestTownName}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step 3: Images ── */}
                {step === 3 && (
                  <div>
                    <SectionTitle>Property Images</SectionTitle>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload photos of your property. Max 5MB per image.
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {form.images.map((img, i) => (
                        <div
                          key={i}
                          className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group"
                        >
                          <img
                            src={img}
                            alt={`Property ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-video rounded-xl border border-dashed border-primary/30 bg-white/5 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                      >
                        <ImagePlus className="w-8 h-8" />
                        <span className="text-xs font-sans font-bold tracking-sans-wide uppercase">Add Photos</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 4: Review ── */}
                {step === 4 && (
                  <div>
                    <SectionTitle>Review Your Listing</SectionTitle>
                    <div className="space-y-4">
                      {/* Property overview */}
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase">
                            {form.mode === "sale" ? "For Sale" : "For Rent"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground text-[10px] font-bold">
                            {form.propertyType}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-headline">{form.title}</h3>
                        {form.description && (
                          <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
                        )}
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {!landType && (
                          <>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                              <p className="text-lg font-bold text-white">{form.bedrooms}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bedrooms</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                              <p className="text-lg font-bold text-white">{form.bathrooms}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bathrooms</p>
                            </div>
                          </>
                        )}
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <p className="text-lg font-bold text-white">{form.cent}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cents</p>
                        </div>
                        {!landType && (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <p className="text-lg font-bold text-white">{form.sqft}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sqft</p>
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Price</p>
                            <p className="text-2xl font-bold text-primary">
                              <span className="rupee">₹</span>{form.totalPrice.toLocaleString()}
                            </p>
                          </div>
                          {form.pricePerCent > 0 && (
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price/Cent</p>
                              <p className="text-lg font-bold text-white">
                                <span className="rupee">₹</span>{form.pricePerCent.toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {form.lat !== 0 && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-white">{form.city}{form.state ? `, ${form.state}` : ''}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Coordinates: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                          </p>
                          {form.distanceFromTown > 0 && (
                            <p className="text-xs font-semibold text-primary mt-1">
                              📍 {form.distanceFromTown.toLocaleString()}m from {form.nearestTownName}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Images preview */}
                      {form.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {form.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Preview ${i + 1}`}
                              className="w-24 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ))}
                        </div>
                      )}

                      {/* Contact */}
                      {(form.contactName || form.contactPhone) && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Contact</p>
                          {form.contactName && <p className="text-sm text-white font-semibold">{form.contactName}</p>}
                          {form.contactPhone && <p className="text-xs text-muted-foreground">{form.contactPhone}</p>}
                          {form.contactEmail && <p className="text-xs text-muted-foreground">{form.contactEmail}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
              disabled={!canGoNext()}
              className="shadow-lg shadow-primary/20"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || form.totalPrice <= 0}
              className="shadow-lg shadow-primary/20 font-bold uppercase tracking-wider"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </span>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Post Property
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
