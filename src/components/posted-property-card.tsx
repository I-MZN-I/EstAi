"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PostedProperty } from "@/lib/types";
import { BedDouble, Bath, Ruler, Heart, MapPin } from "lucide-react";
import { useSavedProperties } from "@/context/saved-properties-context";
import { motion } from "framer-motion";
import { useUser } from "@/firebase";

interface PostedPropertyCardProps {
  posted: PostedProperty;
  index?: number;
}

export function PostedPropertyCard({ posted, index = 0 }: PostedPropertyCardProps) {
  const { isSaved, toggleSave } = useSavedProperties();
  const { user } = useUser();
  const saved = isSaved(posted.id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(posted.id);
  };

  // Luxury staggered layout micro-variations
  const isEven = index % 2 === 0;
  const cardOffsetClass = isEven ? "mt-0" : "md:mt-8";
  const imageAspectClass = isEven ? "aspect-[4/3]" : "aspect-[16/10]";

  return (
    <Link href={`/listings/${posted.id}`} className={cardOffsetClass}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="h-full"
      >
        <Card className="relative overflow-hidden h-full flex flex-col group bg-zinc-900/40 backdrop-blur-md border border-zinc-800/30 rounded-2xl hover:border-zinc-700/40 transition-all duration-500 card-glow">
          <div className="p-4 pb-0 relative">
            <button
              onClick={handleSaveClick}
              className="absolute top-7 right-7 z-20 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-colors duration-200 border border-white/10"
              aria-label={saved ? "Unsave property" : "Save property"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform hover:scale-110 active:scale-90 ${saved ? "fill-red-500 text-red-500" : "text-white"}`}
              />
            </button>
            {posted.images?.[0] ? (
              <div className={`overflow-hidden rounded-xl ${imageAspectClass}`}>
                <img
                  src={posted.images[0]}
                  alt={posted.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className={`rounded-xl ${imageAspectClass} bg-gradient-to-br from-emerald-950/20 to-zinc-950 flex items-center justify-center relative overflow-hidden`}>
                <MapPin className="w-9 h-9 text-emerald-500/30 group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}
          </div>
          <CardContent className="pt-6 pb-6 px-6 flex-grow flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-editorial font-light text-foreground group-hover:text-emerald-400 transition-colors duration-300">
                {posted.title}
              </h3>
              <p className="text-xs text-muted-foreground font-sans">
                {posted.state || "Kerala"}{posted.distanceFromTown > 0 ? ` · ${posted.distanceFromTown.toLocaleString()}m to ${posted.nearestTownName}` : ""}
              </p>
            </div>
            <div>
              <p className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mt-4">
                {posted.city}
              </p>
              <p className="text-2xl font-light tracking-widest text-[#F4F4F5] mt-1 font-sans">
                <span className="rupee text-base font-normal mr-0.5 text-zinc-400">₹</span>{posted.totalPrice?.toLocaleString()}
                {posted.mode === "rent" && <span className="text-[9px] uppercase tracking-sans-wide text-zinc-400 ml-1">/ month</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
