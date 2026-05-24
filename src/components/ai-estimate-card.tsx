"use client";

import { useState } from "react";
import { Wand2, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  estimatePropertyPrice,
  type PropertyInput,
  type PriceEstimation,
} from "@/ai/flows/ai-price-estimation-flow";
import { PropertyEstimationResults } from "@/components/property-estimation-results";
import { Property } from "@/lib/types";
import { UnlockModal } from "./unlock-modal";
import { useUser } from "@/firebase";

interface AIEstimateCardProps {
  property: Property;
}

/**
 * Maps the existing Property type to the new PropertyInput for the
 * Kerala real-estate estimation model. Fields that don't exist on
 * Property get reasonable defaults.
 */
function mapPropertyToInput(property: Property): PropertyInput {
  return {
    propertyType:
      property.type === "apartment" ? "Apartment/Flat" :
      property.type === "villa"     ? "Residential House" :
      property.type === "plot"      ? "Land" :
      property.type === "commercial" ? "Commercial Building" :
      "Residential House",
    city: property.location.city,
    sqft: property.areaSqft,
    bedroom: property.bedrooms,
    bathroom: property.bathrooms,
    furnished:
      property.furnishing === "furnished"      ? 2 :
      property.furnishing === "semi-furnished" ? 1 : 0,
    distanceFromTown: 500, // sensible default for listed properties
    roadFacility: "3",     // default to tarred road
    monthlyIncome: property.rentMonthly ?? 0,
  };
}

export function AIEstimateCard({ property }: AIEstimateCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PriceEstimation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { user: isSignedIn } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEstimation = async () => {
    if (!isSignedIn) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const input = mapPropertyToInput(property);
      const estimationResult = await estimatePropertyPrice(input);
      setResult(estimationResult);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Estimation Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <PropertyEstimationResults
        result={result}
        onClose={() => setResult(null)}
      />
    );
  }

  return (
    <>
      <Card className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/30 rounded-2xl card-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-editorial font-light text-2xl text-gold">
            <Zap className="h-6 w-6 text-primary" />
            AI Price Estimation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2 pt-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          ) : error ? (
            <div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm mb-3">
                {error}
              </div>
              <Button onClick={handleEstimation} className="w-full">
                <Wand2 className="mr-2 h-4 w-4" /> Retry Estimate
              </Button>
            </div>
          ) : (
            <>
              <CardDescription>
                Use our data-driven AI to get an estimated market value based on real Kerala property transactions.
              </CardDescription>
              <Button onClick={handleEstimation} className="w-full mt-4">
                <Wand2 className="mr-2 h-4 w-4" /> Get AI Estimate
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <UnlockModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
