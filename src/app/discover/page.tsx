"use client";

import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { PropertyCard } from "@/components/property-card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, MapPin, BedDouble, Bath, Ruler, Navigation, Heart } from "lucide-react";
import { useSavedProperties } from "@/context/saved-properties-context";
import { properties, projects } from "@/lib/placeholder-data";
import { usePostedProperties } from "@/context/posted-properties-context";
import { useUser } from "@/firebase";

export default function DiscoverPage() {
  const trendingProperties = properties.slice(0, 5);
  const mostViewedProperties = properties.slice(5, 11);
  const { postedProperties } = usePostedProperties();
  const { isSaved, toggleSave } = useSavedProperties();
  const { user } = useUser();

  // Filter to only properties posted within the last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentlyPosted = postedProperties.filter(
    (p) => new Date(p.createdAt) >= sevenDaysAgo
  );

  // All available properties for the "Listed Properties" section
  const activeProperties = properties.filter((p) => p.status === 'active');

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">

        <div className="mb-8 p-4 rounded-lg bg-card border flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by locality, city, or project..." className="pl-10 h-12 text-base" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="secondary" className="h-12 flex-1 md:flex-initial">Filters</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-12 w-[180px] justify-between">
                  Sort by: Newest
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem>Newest</DropdownMenuItem>
                <DropdownMenuItem>Price: Low to High</DropdownMenuItem>
                <DropdownMenuItem>Price: High to Low</DropdownMenuItem>
                <DropdownMenuItem>Most Viewed</DropdownMenuItem>
                <DropdownMenuItem>Trending</DropdownMenuItem>
                <DropdownMenuItem>AI Best Value (Sign-in)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="h-12 flex-1 md:flex-initial">Search</Button>
          </div>
        </div>

        {/* User Posted Properties – only those from the last 7 days */}
        {recentlyPosted.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-headline font-semibold">Recently Posted</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentlyPosted.map((posted) => (
                <Link key={posted.id} href={`/listings/${posted.id}`}>
                <Card
                  className="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-1 border-emerald-500/10 cursor-pointer relative"
                >
                  {/* Save button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(posted.id); }}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-colors duration-200 border border-white/20"
                    aria-label={isSaved(posted.id) ? "Unsave property" : "Save property"}
                  >
                    <Heart className={`w-5 h-5 transition-transform hover:scale-110 active:scale-90 ${isSaved(posted.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                  </button>
                  {posted.images?.[0] ? (
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={posted.images[0]}
                        alt={posted.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                          {posted.mode === "sale" ? "For Sale" : "For Rent"}
                        </Badge>
                        {user && posted.userId === user.uid && (
                          <Badge className="bg-black/60 backdrop-blur-sm text-emerald-400 border-0 text-[10px]">
                            User Posted
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-emerald-900/20 to-zinc-900 flex items-center justify-center relative">
                      <MapPin className="w-12 h-12 text-emerald-500/30" />
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                          {posted.mode === "sale" ? "For Sale" : "For Rent"}
                        </Badge>
                        {user && posted.userId === user.uid && (
                          <Badge className="bg-black/60 backdrop-blur-sm text-emerald-400 border-0 text-[10px]">
                            User Posted
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <CardContent className="pt-4 flex-grow">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm font-semibold text-emerald-400">{posted.state ? `${posted.state}, ${posted.city}` : ""}</span>
                      {posted.distanceFromTown > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                          <Navigation className="w-3 h-3" />
                          {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold font-headline text-foreground truncate mt-1">
                      {posted.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 capitalize">{posted.propertyType}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      <span className="rupee">₹</span>{posted.totalPrice?.toLocaleString()}
                      {posted.pricePerCent > 0 && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (<span className="rupee">₹</span>{posted.pricePerCent.toLocaleString()}/cent)
                        </span>
                      )}
                    </p>
                  </CardContent>

                  {posted.bedrooms > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground border-t pt-4 pb-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-emerald-500" />
                        <span>{posted.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-emerald-500" />
                        <span>{posted.bathrooms} Baths</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-emerald-500" />
                        <span>{posted.sqft} sqft</span>
                      </div>
                    </div>
                  )}
                </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Listed Properties – all available properties */}
        <section className="mb-16">
          <h2 className="text-3xl font-headline font-semibold mb-6">Listed Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Demo / placeholder properties */}
            {activeProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {/* User-posted properties */}
            {postedProperties.map((posted) => (
              <Link key={`listed-${posted.id}`} href={`/listings/${posted.id}`}>
                <Card
                  className="overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-1 border-emerald-500/10 cursor-pointer relative"
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(posted.id); }}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md bg-black/20 hover:bg-black/40 transition-colors duration-200 border border-white/20"
                    aria-label={isSaved(posted.id) ? "Unsave property" : "Save property"}
                  >
                    <Heart className={`w-5 h-5 transition-transform hover:scale-110 active:scale-90 ${isSaved(posted.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                  </button>
                  {posted.images?.[0] ? (
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={posted.images[0]}
                        alt={posted.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                          {posted.mode === "sale" ? "For Sale" : "For Rent"}
                        </Badge>
                        {user && posted.userId === user.uid && (
                          <Badge className="bg-black/60 backdrop-blur-sm text-emerald-400 border-0 text-[10px]">
                            User Posted
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-emerald-900/20 to-zinc-900 flex items-center justify-center relative">
                      <MapPin className="w-12 h-12 text-emerald-500/30" />
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <Badge className="bg-emerald-500/90 text-white border-0 capitalize text-[10px]">
                          {posted.mode === "sale" ? "For Sale" : "For Rent"}
                        </Badge>
                        {user && posted.userId === user.uid && (
                          <Badge className="bg-black/60 backdrop-blur-sm text-emerald-400 border-0 text-[10px]">
                            User Posted
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <CardContent className="pt-4 flex-grow">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm font-semibold text-emerald-400">{posted.state ? `${posted.state}, ${posted.city}` : ""}</span>
                      {posted.distanceFromTown > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                          <Navigation className="w-3 h-3" />
                          {posted.distanceFromTown.toLocaleString()}m from {posted.nearestTownName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold font-headline text-foreground truncate mt-1">
                      {posted.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2 capitalize">{posted.propertyType}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">
                      <span className="rupee">₹</span>{posted.totalPrice?.toLocaleString()}
                      {posted.pricePerCent > 0 && (
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          (<span className="rupee">₹</span>{posted.pricePerCent.toLocaleString()}/cent)
                        </span>
                      )}
                    </p>
                  </CardContent>
                  {posted.bedrooms > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground border-t pt-4 pb-4 px-6">
                      <div className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-emerald-500" />
                        <span>{posted.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-emerald-500" />
                        <span>{posted.bathrooms} Baths</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-emerald-500" />
                        <span>{posted.sqft} sqft</span>
                      </div>
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-headline font-semibold mb-6">Trending Properties</h2>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {trendingProperties.map((property) => (
                <CarouselItem key={property.id} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <PropertyCard property={property} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-headline font-semibold mb-6">Most Viewed Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostViewedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-headline font-semibold mb-6">Upcoming Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project) => (
               <div key={project.id} className="group relative overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={project.media.coverUrl}
                  alt={project.name}
                  width={600}
                  height={400}
                  data-ai-hint={project.media.imageHint}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                  <h3 className="text-2xl font-headline font-bold text-white">{project.name}</h3>
                  <p className="text-sm text-muted-foreground text-white/80">{project.builder} in {project.locality}, {project.city}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
