
"use client";

import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { UnlockModal } from "@/components/unlock-modal";
import {
  estimatePropertyPrice,
  type PropertyInput,
  type PriceEstimation,
} from "@/ai/flows/ai-price-estimation-flow";
import { PropertyEstimationResults } from "@/components/property-estimation-results";

// ─── Static data ──────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  "Residential House",
  "Apartment/Flat",
  "Land",
  "Commercial Building",
  "Parking Land",
  "Shop / Other",
];

const ROAD_OPTIONS = [
  { value: "1", label: "Kutcha / Mud road" },
  { value: "2", label: "Paved / WBM road" },
  { value: "3", label: "Tarred road" },
  { value: "4", label: "National / State Highway" },
];

const LANDMARK_TYPES = [
  "School", "College", "Temple", "Mosque", "Church",
  "Hospital", "Shopping Mall", "Supermarket", "Hypermarket",
  "Hotel", "Bus Stop", "Auditorium", "Historical Site",
  "Jewellery Store", "Clothing Store", "Petrol Pump", "Fitness Club", "Other",
];

const FURNISHED_OPTIONS = [
  { value: 0, label: "Unfurnished" },
  { value: 1, label: "Semi" },
  { value: 2, label: "Fully" },
];

const isLandType = (t: string) => /land|parking/i.test(t);

// ─── Section title little component ──────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">{children}</span>
      <div className="flex-1 h-px bg-zinc-800/30" />
    </div>
  );
}

export default function AIPage() {
  const { user: isSignedIn } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceEstimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<Partial<PropertyInput>>({
    propertyType: "Residential House",
    city: "",
    furnished: 0,
    distanceFromTown: 500,
    roadFacility: "3",
    monthlyIncome: 0,
  });

  const set = <K extends keyof PropertyInput>(key: K, val: PropertyInput[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const landType = isLandType(form.propertyType ?? "");

  const canSubmit =
    !loading &&
    !!form.propertyType &&
    !!form.city?.trim() &&
    (form.distanceFromTown ?? -1) >= 0;

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [result]);

  const handleEstimate = async () => {
    if (!isSignedIn) {
      setIsModalOpen(true);
      return;
    }
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const estimate = await estimatePropertyPrice({
        propertyType: form.propertyType!,
        city: form.city!,
        distanceFromTown: form.distanceFromTown!,
        cent: form.cent,
        sqft: landType ? undefined : form.sqft,
        totalFloors: landType ? undefined : form.totalFloors,
        bedroom: landType ? undefined : form.bedroom,
        bathroom: landType ? undefined : form.bathroom,
        furnished: landType ? 0 : (form.furnished ?? 0),
        roadFacility: form.roadFacility,
        nearestLandmarkType: form.nearestLandmarkType,
        monthlyIncome: form.monthlyIncome ?? 0,
      });
      setResult(estimate);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Estimation Failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">

        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl font-light tracking-wide text-zinc-100">
            Est<span className="italic text-primary">Ai</span>{" "}
            <span className="text-muted-foreground font-light text-lg">/ Price Estimator</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-sans">
            Enter property details — AI studies your live dataset to estimate a price range for any location.
          </p>
        </header>

        {/* Form */}
        {(!result || loading) && (
          <Card className="bg-zinc-900/20 backdrop-blur-xl border border-zinc-800/25 rounded-2xl shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="font-serif text-3xl font-light text-zinc-100 tracking-wide">Property Details</CardTitle>
              <CardDescription className="font-sans text-xs text-zinc-400">Provide the specifications for an AI-powered valuation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Property core */}
              <div>
                <SectionTitle>Property</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Type</Label>
                    <Select
                      value={form.propertyType}
                      onValueChange={(v) => set("propertyType", v)}
                    >
                      <SelectTrigger className="input-editorial-underline h-11 text-foreground border-b border-zinc-800/40"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">City / Town</Label>
                    <Input
                      placeholder="Any city or town"
                      value={form.city ?? ""}
                      onChange={(e) => set("city", e.target.value)}
                      className="input-editorial-underline h-11 text-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground/70">
                      Any location — AI finds the nearest comparable market if not in dataset
                    </p>
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <SectionTitle>Size</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Land Area (cents)</Label>
                    <Input
                      type="number" min={0} placeholder="e.g. 8"
                      value={form.cent ?? ""}
                      onChange={(e) => set("cent", e.target.value ? Number(e.target.value) : undefined)}
                      className="input-editorial-underline h-11 text-foreground"
                    />
                  </div>
                  {!landType && (
                    <div className="space-y-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Built-up Area (sqft)</Label>
                      <Input
                        type="number" min={0} placeholder="e.g. 1500"
                        value={form.sqft ?? ""}
                        onChange={(e) => set("sqft", e.target.value ? Number(e.target.value) : undefined)}
                        className="input-editorial-underline h-11 text-foreground"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Building details */}
              {!landType && (
                <div>
                  <SectionTitle>Building Details</SectionTitle>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Bedrooms</Label>
                      <Input type="number" min={1} max={20} placeholder="3"
                        value={form.bedroom ?? ""}
                        onChange={(e) => set("bedroom", e.target.value ? Number(e.target.value) : undefined)}
                        className="input-editorial-underline h-11 text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Bathrooms</Label>
                      <Input type="number" min={1} max={20} placeholder="2"
                        value={form.bathroom ?? ""}
                        onChange={(e) => set("bathroom", e.target.value ? Number(e.target.value) : undefined)}
                        className="input-editorial-underline h-11 text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Floors</Label>
                      <Input type="number" min={1} max={50} placeholder="2"
                        value={form.totalFloors ?? ""}
                        onChange={(e) => set("totalFloors", e.target.value ? Number(e.target.value) : undefined)}
                        className="input-editorial-underline h-11 text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Furnished Status</Label>
                    <div className="flex gap-2 mt-0.5">
                      {FURNISHED_OPTIONS.map((o) => (
                        <Button
                          key={o.value}
                          type="button"
                          variant={form.furnished === o.value ? "default" : "secondary"}
                          className={`flex-1 ${form.furnished === o.value ? "shadow-lg shadow-primary/20" : ""}`}
                          onClick={() => set("furnished", o.value as 0 | 1 | 2)}
                        >
                          {o.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <SectionTitle>Location</SectionTitle>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Distance from Town (metres)</Label>
                    <Input type="number" min={0} placeholder="500"
                      value={form.distanceFromTown ?? ""}
                      onChange={(e) => set("distanceFromTown", Number(e.target.value))}
                      className="input-editorial-underline h-11 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Road Facility</Label>
                    <Select
                      value={form.roadFacility ?? ""}
                      onValueChange={(v) => set("roadFacility", v || undefined)}
                    >
                      <SelectTrigger className="input-editorial-underline h-11 text-foreground border-b border-zinc-800/40"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        {ROAD_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Nearest Landmark Type</Label>
                  <Select
                    value={form.nearestLandmarkType ?? ""}
                    onValueChange={(v) => set("nearestLandmarkType", v || undefined)}
                  >
                    <SelectTrigger className="input-editorial-underline h-11 text-foreground border-b border-zinc-800/40"><SelectValue placeholder="Not specified" /></SelectTrigger>
                    <SelectContent>
                      {LANDMARK_TYPES.map((l) => (
                        <SelectItem key={l} value={l.toLowerCase()}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Income */}
              <div>
                <SectionTitle>Income</SectionTitle>
                <div className="space-y-2">
                  <Label className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Monthly Rental Income (<span className="rupee">₹</span>) — enter 0 if none</Label>
                  <Input type="number" min={0} placeholder="0"
                    value={form.monthlyIncome ?? 0}
                    onChange={(e) => set("monthlyIncome", Number(e.target.value))}
                    className="input-editorial-underline h-11 text-foreground"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                onClick={handleEstimate}
                disabled={!canSubmit}
                className="w-full h-12 font-bold uppercase tracking-widest"
                size="lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Studying dataset…
                  </span>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Estimate Price
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <Card className="bg-card border-primary/20 p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          </Card>
        )}

        {/* Results */}
        {result && !loading && (
          <div ref={resultsRef}>
            <PropertyEstimationResults result={result} onClose={() => setResult(null)} />
          </div>
        )}

      </div>
      <UnlockModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </AppLayout>
  );
}
