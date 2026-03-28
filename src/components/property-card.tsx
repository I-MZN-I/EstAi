"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/lib/types";
import { BedDouble, Bath, Ruler, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { useSavedProperties } from "@/context/saved-properties-context";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { isSaved, toggleSave } = useSavedProperties();
  const saved = isSaved(property.id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(property.id);
  };

  return (
    <Link href={`/listings/${property.id}`}>
      <Card className="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-primary/20 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="p-0 relative">
          <Badge className="absolute top-3 left-3 z-10 capitalize" variant={property.mode === 'sale' ? 'default' : 'secondary'}>
            For {property.mode}
          </Badge>
          <button
            onClick={handleSaveClick}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-colors duration-200 border border-white/20`}
            aria-label={saved ? "Unsave property" : "Save property"}
          >
            <Heart
              className={`w-5 h-5 transition-transform hover:scale-110 active:scale-90 ${saved ? "fill-red-500 text-red-500" : "text-white"}`}
            />
          </button>
          <div className="overflow-hidden aspect-video">
            <Image
              src={property.media.coverUrl}
              alt={property.title}
              width={400}
              height={225}
              data-ai-hint={property.media.imageHint}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex-grow">
          <p className="text-sm font-semibold text-primary">{property.location.locality}, {property.location.city}</p>
          <h3 className="text-lg font-bold font-headline text-foreground truncate mt-1">{property.title}</h3>
          <p className="text-2xl font-bold text-foreground mt-2">
            ${(property.price || property.rentMonthly)?.toLocaleString()}
            {property.mode === 'rent' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
          </p>
        </CardContent>
        <CardFooter className="grid grid-cols-3 gap-2 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-primary" />
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-primary" />
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ruler className="w-4 h-4 text-primary" />
            <span>{property.areaSqft} sqft</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
