"use client";

/**
 * PropertyEstimationResults — results panel for AI price estimation
 *
 * Displays the price range, reasoning, comparables, and pricing factors
 * in a tabbed interface using the app's existing shadcn/ui components
 * and Tailwind theme tokens.
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type {
  PriceEstimation,
  ComparableProperty,
  PriceFactor,
} from "@/ai/flows/ai-price-estimation-flow";

// ─── Formatting helpers ───────────────────────────────────────────────────────

const fmtNumber = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n);

const fmt = (n: number) => (
  <><span className="rupee">₹</span>{fmtNumber(n)}</>
);

const fmtCompact = (n: number) => {
  if (n >= 10000000) return <><span className="rupee">₹</span>{(n / 10000000).toFixed(2)} Cr</>;
  if (n >= 100000) return <><span className="rupee">₹</span>{(n / 100000).toFixed(1)} L</>;
  return fmt(n);
};

// ─── Static labels ────────────────────────────────────────────────────────────

const ROAD_LABEL: Record<string, string> = {
  "1": "Kutcha", "2": "Paved", "3": "Tarred", "4": "Highway",
};

const FURNISHED_LABEL: Record<number, string> = {
  0: "Unfurnished", 1: "Semi-furnished", 2: "Fully furnished",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ImpactIcon({ impact }: { impact: PriceFactor["impact"] }) {
  if (impact === "positive") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (impact === "negative") return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function ComparableCard({ c, index }: { c: ComparableProperty; index: number }) {
  return (
    <Card className="bg-card/60 border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-foreground capitalize">{c.type}</span>
            </div>
            <span className="text-xs text-muted-foreground ml-8">{c.city}</span>
          </div>
          {c.price != null && (
            <span className="text-sm font-bold text-primary whitespace-nowrap">
              {fmtCompact(c.price)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          {c.cent != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Land</div>
              <div className="text-foreground/80 font-medium">{c.cent} cents</div>
            </div>
          )}
          {c.sqft != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Area</div>
              <div className="text-foreground/80 font-medium">{c.sqft.toLocaleString()} sqft</div>
            </div>
          )}
          {c.bedroom != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">BHK</div>
              <div className="text-foreground/80 font-medium">{c.bedroom} bed / {c.bathroom ?? "?"} bath</div>
            </div>
          )}
          {c.distFromTown != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Distance</div>
              <div className="text-foreground/80 font-medium">{c.distFromTown}m</div>
            </div>
          )}
          {c.road != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Road</div>
              <div className="text-foreground/80 font-medium">{ROAD_LABEL[c.road] ?? c.road}</div>
            </div>
          )}
          {c.furnished != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Furnished</div>
              <div className="text-foreground/80 font-medium">{FURNISHED_LABEL[c.furnished] ?? c.furnished}</div>
            </div>
          )}
          {c.pricePerCent != null && (
            <div className="bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <div className="text-muted-foreground">Per cent</div>
              <div className="text-foreground/80 font-medium">{fmtCompact(c.pricePerCent)}</div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground italic leading-relaxed border-t border-border/50 pt-2">
          {c.similarityNote}
        </p>
      </CardContent>
    </Card>
  );
}

function FactorRow({ f }: { f: PriceFactor }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      <div className="mt-0.5">
        <ImpactIcon impact={f.impact} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{f.factor}</span>
          <Badge
            variant={f.impact === "positive" ? "default" : f.impact === "negative" ? "destructive" : "secondary"}
            className="text-xs"
          >
            {f.adjustment}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
      </div>
    </div>
  );
}

// ─── Confidence badge color ───────────────────────────────────────────────────

const CONF_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  high: "default",
  medium: "secondary",
  low: "destructive",
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  result: PriceEstimation;
  onClose: () => void;
}

export function PropertyEstimationResults({ result, onClose }: Props) {
  const [tab, setTab] = useState<"overview" | "comparables" | "factors">("overview");

  const TABS = [
    { id: "overview" as const,     label: "Overview" },
    { id: "comparables" as const,  label: `Comparables (${result.comparables.length})` },
    { id: "factors" as const,      label: `Factors (${result.factors.length})` },
  ];

  return (
    <Card className="bg-card border-primary/20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-card px-6 py-5 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold mb-1">
              Estimated Price Range
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-headline font-bold text-foreground">
                {fmtCompact(result.minPrice)}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="text-2xl font-headline font-bold text-primary">
                {fmtCompact(result.maxPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mid estimate:{" "}
              <span className="text-foreground font-semibold">{fmtCompact(result.midPrice)}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={CONF_VARIANT[result.confidence]} className="uppercase tracking-widest text-[10px]">
              {result.confidence} confidence
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {result.datasetSize} records in dataset
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              tab === t.id
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <CardContent className="p-5">
        {tab === "overview" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-card/60 border-border/50 p-4 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Minimum</div>
                <div className="text-base font-bold text-foreground">{fmtCompact(result.minPrice)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(result.minPrice)}</div>
              </Card>
              <Card className="bg-primary/10 border-primary/30 p-4 text-center ring-1 ring-primary/20">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Mid Price</div>
                <div className="text-base font-bold text-primary">{fmtCompact(result.midPrice)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(result.midPrice)}</div>
              </Card>
              <Card className="bg-card/60 border-border/50 p-4 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Maximum</div>
                <div className="text-base font-bold text-foreground">{fmtCompact(result.maxPrice)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{fmt(result.maxPrice)}</div>
              </Card>
            </div>

            {/* Quick factor summary */}
            <Card className="bg-card/60 border-border/50 p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">
                Top Influencing Factors
              </p>
              <div className="space-y-1.5">
                {result.factors.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ImpactIcon impact={f.impact} />
                      <span className="text-muted-foreground">{f.factor}</span>
                    </div>
                    <Badge
                      variant={f.impact === "positive" ? "default" : f.impact === "negative" ? "destructive" : "secondary"}
                      className="text-[10px]"
                    >
                      {f.adjustment}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "comparables" && (
          <div className="space-y-3">
            {result.comparables.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No close comparables found in the dataset.
              </p>
            ) : (
              result.comparables.map((c, i) => (
                <ComparableCard key={i} c={c} index={i} />
              ))
            )}
          </div>
        )}

        {tab === "factors" && (
          <div>
            {result.factors.map((f, i) => (
              <FactorRow key={i} f={f} />
            ))}
          </div>
        )}
      </CardContent>

      {/* Re-estimate CTA */}
      <div className="px-5 pb-5">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tweak inputs &amp; re-estimate
        </Button>
      </div>
    </Card>
  );
}
