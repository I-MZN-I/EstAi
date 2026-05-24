"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { PropertyCard } from "@/components/property-card";
import { PostedPropertyCard } from "@/components/posted-property-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, X, Navigation } from "lucide-react";
import { properties, projects } from "@/lib/placeholder-data";
import { usePostedProperties } from "@/context/posted-properties-context";
import { useUser } from "@/firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function DiscoverPage() {
  const trendingProperties = properties.slice(0, 5);
  const mostViewedProperties = properties.slice(5, 11);
  const { postedProperties } = usePostedProperties();
  const { user } = useUser();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [queryText, setQueryText] = useState("");
  const [filterMode, setFilterMode] = useState<'all' | 'sale' | 'rent'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter to only properties posted within the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentlyPosted = postedProperties.filter(
    (p) => new Date(p.createdAt) >= sevenDaysAgo
  );

  // Apply search/filters
  const recentlyPostedFiltered = recentlyPosted.filter((posted) => {
    const matchesQuery = queryText
      ? posted.title.toLowerCase().includes(queryText.toLowerCase()) ||
        posted.city.toLowerCase().includes(queryText.toLowerCase()) ||
        posted.propertyType.toLowerCase().includes(queryText.toLowerCase())
      : true;
    const matchesMode = filterMode === 'all' ? true : posted.mode === filterMode;
    return matchesQuery && matchesMode;
  });

  const activePropertiesFiltered = properties.filter((p) => {
    if (p.status !== 'active') return false;
    const matchesQuery = queryText
      ? p.title.toLowerCase().includes(queryText.toLowerCase()) ||
        p.location.city.toLowerCase().includes(queryText.toLowerCase()) ||
        p.location.locality.toLowerCase().includes(queryText.toLowerCase())
      : true;
    const matchesMode = filterMode === 'all' ? true : p.mode === filterMode;
    return matchesQuery && matchesMode;
  });

  const postedPropertiesFiltered = postedProperties.filter((posted) => {
    const matchesQuery = queryText
      ? posted.title.toLowerCase().includes(queryText.toLowerCase()) ||
        posted.city.toLowerCase().includes(queryText.toLowerCase()) ||
        posted.propertyType.toLowerCase().includes(queryText.toLowerCase())
      : true;
    const matchesMode = filterMode === 'all' ? true : posted.mode === filterMode;
    return matchesQuery && matchesMode;
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-6 pt-24 pb-12 max-w-7xl">
        
        {/* Luxury Editorial Hero Title */}
        <div className="text-center max-w-4xl mx-auto mb-16 pt-12">
          <span className="block font-sans text-[10px] tracking-[0.25em] uppercase text-violet-400/80 font-medium mb-3">CURATED RESIDENTIAL ARCHITECTURE</span>
          <p className="font-serif text-lg italic text-zinc-400 font-light max-w-xl mx-auto text-center mt-2">
            The definitive matrix for architectural valuation and spatial acquisition.
          </p>
        </div>

        {/* Floating Command Capsule search overlay */}
        <div className="max-w-2xl mx-auto mb-24">
          <motion.div 
            onClick={() => setIsSearchOpen(true)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-3 px-6 h-14 rounded-full bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 shadow-xl cursor-pointer transition-all duration-300 group"
          >
            <Search className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-zinc-400 flex-grow font-sans font-light">
              {queryText || filterMode !== 'all' ? (
                <span className="text-primary font-medium">
                  Filtered: {queryText ? `"${queryText}"` : ""} {filterMode !== 'all' ? `[For ${filterMode}]` : ""}
                </span>
              ) : (
                "Search by locality, city, project..."
              )}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/5 text-[10px] text-muted-foreground/60 border border-white/5 font-sans">
              <span>⌘</span>
              <span>K</span>
            </div>
          </motion.div>
        </div>

        {/* User Posted Properties */}
        {recentlyPostedFiltered.length > 0 && (
          <section className="mb-28 bg-editorial-glow rounded-3xl p-8 border border-zinc-800/10">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="font-sans text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Verified User Contributions</span>
                <h2 className="font-serif text-4xl font-light tracking-wide text-zinc-100 mt-1">Recently <span className="italic">Curated</span> Listings</h2>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-sans uppercase tracking-widest text-[9px]">
                Active Now
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentlyPostedFiltered.map((posted, index) => (
                <PostedPropertyCard key={posted.id} posted={posted} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Listed Properties */}
        <section className="mb-28">
          <div className="mb-12">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-violet-400/80 font-semibold block mb-1">Premier Market Selection</span>
            <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mt-2 mb-6">
              Properties <span className="italic text-zinc-300 font-normal">in</span> Focus
            </h2>
          </div>
          {activePropertiesFiltered.length === 0 && postedPropertiesFiltered.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl border-white/5">
              <p className="text-muted-foreground text-sm font-sans font-light">No properties match your current search selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-y-12">
              {activePropertiesFiltered.map((property, index) => (
                <PropertyCard key={property.id} property={property} index={index} />
              ))}
              {postedPropertiesFiltered.map((posted, index) => (
                <PostedPropertyCard 
                  key={`listed-${posted.id}`} 
                  posted={posted} 
                  index={activePropertiesFiltered.length + index} 
                />
              ))}
            </div>
          )}
        </section>

        {/* Trending Properties */}
        <section className="mb-28">
          <div className="mb-12">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-violet-400/80 font-semibold block mb-1">Market Desirability Tracking</span>
            <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mt-2 mb-6">
              Trending <span className="italic text-zinc-300 font-normal">Living</span> Spaces
            </h2>
          </div>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {trendingProperties.map((property, index) => (
                <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-2">
                    <PropertyCard property={property} index={index} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex border-white/10 bg-zinc-950/80 text-foreground hover:bg-zinc-900" />
            <CarouselNext className="hidden sm:flex border-white/10 bg-zinc-950/80 text-foreground hover:bg-zinc-900" />
          </Carousel>
        </section>

        {/* Most Viewed Properties */}
        <section className="mb-28">
          <div className="mb-12">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-violet-400/80 font-semibold block mb-1">Popular Architectures</span>
            <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mt-2 mb-6">
              Most <span className="italic text-zinc-300 font-normal">Exquisite</span> Listings
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-y-12">
            {mostViewedProperties.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        </section>

        {/* Upcoming Projects */}
        <section className="mb-16">
          <div className="mb-12">
            <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-violet-400/80 font-semibold block mb-1">Development Pipeline</span>
            <h2 className="font-serif text-3xl font-light text-zinc-100 tracking-wide mt-2 mb-6">
              Upcoming <span className="italic text-zinc-300 font-normal">Architectural</span> Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {projects.map((project) => (
              <motion.div 
                key={project.id} 
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-2xl shadow-xl aspect-[16/10] border border-zinc-800/30 bg-zinc-900/40 backdrop-blur-md"
              >
                <Image
                  src={project.media.coverUrl}
                  alt={project.name}
                  width={600}
                  height={400}
                  data-ai-hint={project.media.imageHint}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-editorial font-light text-white leading-tight">{project.name}</h3>
                    <p className="text-[10px] text-zinc-400 font-sans tracking-sans-wide uppercase mt-1">{project.builder} · {project.locality}, {project.city}</p>
                  </div>
                  <Badge className="bg-primary/20 backdrop-blur-md text-primary border border-primary/30 font-sans text-[9px] tracking-widest uppercase px-3 py-1">
                    Upcoming
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Spotlight Command Modal Dialog */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-xl glass-panel rounded-2xl overflow-hidden p-6 border-white/10"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold font-headline text-foreground">Search Listings</h3>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  autoFocus
                  placeholder="Enter city, locality..." 
                  className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl focus:border-primary/50 text-foreground font-sans"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant={filterMode === 'all' ? 'default' : 'outline'} 
                    onClick={() => setFilterMode('all')} 
                    className="flex-1 rounded-lg border-white/5 hover:bg-white/5 text-sm"
                  >
                    All Modes
                  </Button>
                  <Button 
                    variant={filterMode === 'sale' ? 'default' : 'outline'} 
                    onClick={() => setFilterMode('sale')} 
                    className="flex-1 rounded-lg border-white/5 hover:bg-white/5 text-sm"
                  >
                    For Sale
                  </Button>
                  <Button 
                    variant={filterMode === 'rent' ? 'default' : 'outline'} 
                    onClick={() => setFilterMode('rent')} 
                    className="flex-1 rounded-lg border-white/5 hover:bg-white/5 text-sm"
                  >
                    For Rent
                  </Button>
                </div>
                <div className="flex gap-3 pt-2">
                  {(searchVal || queryText || filterMode !== 'all') && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchVal("");
                        setQueryText("");
                        setFilterMode("all");
                        setIsSearchOpen(false);
                      }}
                      className="flex-1 h-12 rounded-xl border-white/5 hover:bg-white/5 text-sm"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      setQueryText(searchVal);
                      setIsSearchOpen(false);
                    }}
                    className="flex-grow h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
