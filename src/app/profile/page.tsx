"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { usePostedProperties } from "@/context/posted-properties-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    User,
    Mail,
    Phone,
    LogOut,
    Edit3,
    Save,
    X,
    Home,
    MapPin,
    Trash2,
    Building2,
    ChevronRight,
    Shield,
    BarChart3,
    Clock,
} from "lucide-react";

export default function ProfilePage() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const { postedProperties, removeProperty } = usePostedProperties();

    // Filter properties to only show those belonging to the current user
    const myProperties = useMemo(() => {
        if (!user) return [];
        return postedProperties.filter((p) => p.userId === user.uid);
    }, [postedProperties, user]);

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [expandedProperties, setExpandedProperties] = useState(false);

    // Loading state
    if (isUserLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-muted-foreground text-sm">Loading profile...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Not signed in — redirect to login
    if (!user) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Card className="mx-auto max-w-sm w-full bg-card border-white/10 text-center">
                        <CardHeader>
                            <Logo className="text-4xl justify-center mb-4" />
                            <CardTitle className="text-xl font-headline">Sign In Required</CardTitle>
                            <CardDescription>
                                Please sign in to view your profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={() => router.push("/login")}>
                                Sign In / Create Account
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const handleStartEdit = () => {
        setEditName(user.displayName || "");
        setEditPhone("");
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            if (editName.trim() && editName !== user.displayName) {
                await updateProfile(user, { displayName: editName.trim() });
            }
            toast({ title: "Profile updated!", description: "Your changes have been saved." });
            setIsEditing(false);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update failed",
                description: error.message || "Could not update profile.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut(auth);
            toast({ title: "Signed out", description: "You have been signed out successfully." });
            router.push("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Sign out failed",
                description: error.message || "Could not sign out.",
            });
            setIsLoggingOut(false);
        }
    };

    const handleDeleteProperty = (id: string, title: string) => {
        removeProperty(id);
        toast({ title: "Property removed", description: `"${title}" has been removed from your listings.` });
    };

    const displayProperties = expandedProperties
        ? myProperties
        : myProperties.slice(0, 3);

    const memberSince = user.metadata.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        })
        : "Unknown";

    return (
        <AppLayout>
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-8"
                >
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-10 h-10 text-primary" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 rounded-full border-2 border-background">
                            <Shield className="w-3 h-3 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-headline font-bold text-foreground">
                        {user.displayName || "EstAi User"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Member since {memberSince}
                        </Badge>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="grid grid-cols-3 gap-4 mb-8"
                >
                    <Card className="bg-card border-white/10 text-center">
                        <CardContent className="pt-6 pb-4">
                            <div className="inline-flex p-2.5 rounded-xl bg-primary/10 mb-3">
                                <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{myProperties.length}</p>
                            <p className="text-xs text-muted-foreground mt-1">Properties</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-white/10 text-center">
                        <CardContent className="pt-6 pb-4">
                            <div className="inline-flex p-2.5 rounded-xl bg-emerald-500/10 mb-3">
                                <BarChart3 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {myProperties.filter((p) => p.mode === "sale").length}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">For Sale</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-white/10 text-center">
                        <CardContent className="pt-6 pb-4">
                            <div className="inline-flex p-2.5 rounded-xl bg-amber-500/10 mb-3">
                                <Home className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-2xl font-bold text-foreground">
                                {myProperties.filter((p) => p.mode === "rent").length}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">For Rent</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Profile Details Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Card className="bg-card border-white/10 mb-6">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-lg">Profile Details</CardTitle>
                                <CardDescription>Your account information</CardDescription>
                            </div>
                            {!isEditing ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 border-white/10 hover:bg-white/5"
                                    onClick={handleStartEdit}
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AnimatePresence mode="wait">
                                {isEditing ? (
                                    <motion.div
                                        key="edit"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <Label>Display Name</Label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={editPhone}
                                                onChange={(e) => setEditPhone(e.target.value)}
                                                placeholder="Enter your phone number"
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="view"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <User className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Name</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {user.displayName || "Not set"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Mail className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Email</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {user.email || "Not set"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Phone className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Phone</p>
                                                <p className="text-sm font-medium text-foreground">
                                                    {user.phoneNumber || "Not set"}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Listed Properties */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <Card className="bg-card border-white/10 mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="font-headline text-lg">Your Listed Properties</CardTitle>
                                    <CardDescription>
                                        {myProperties.length === 0
                                            ? "You haven't posted any properties yet"
                                            : `${myProperties.length} propert${myProperties.length === 1 ? "y" : "ies"} listed`}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                    {myProperties.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {myProperties.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                                        <Building2 className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground text-sm mb-4">
                                        Start listing your properties to see them here
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-primary/30 text-primary hover:bg-primary/10"
                                        onClick={() => router.push("/post")}
                                    >
                                        Post a Property
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {displayProperties.map((property) => (
                                        <div
                                            key={property.id}
                                            className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                                                {property.images?.[0] ? (
                                                    <img
                                                        src={property.images[0]}
                                                        alt={property.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <MapPin className="w-6 h-6 text-muted-foreground/30" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-foreground truncate">
                                                    {property.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {property.propertyType} · {property.city || "Unknown"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        className={cn(
                                                            "text-[10px] border-0",
                                                            property.mode === "sale"
                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                : "bg-amber-500/20 text-amber-400"
                                                        )}
                                                    >
                                                        {property.mode === "sale" ? "For Sale" : "For Rent"}
                                                    </Badge>
                                                    <span className="text-xs font-bold text-primary">
                                                        <span className="rupee">₹</span>{property.totalPrice?.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                                                    onClick={() => router.push(`/post?edit=${property.id}`)}
                                                    title="Edit property"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                                                    onClick={() => handleDeleteProperty(property.id, property.title)}
                                                    title="Delete property"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-8 h-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => router.push(`/listings/${property.id}`)}
                                                    title="View property"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {myProperties.length > 3 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full text-primary text-sm hover:bg-primary/5"
                                            onClick={() => setExpandedProperties(!expandedProperties)}
                                        >
                                            {expandedProperties
                                                ? "Show Less"
                                                : `View All ${myProperties.length} Properties`}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logout Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="mb-24"
                >
                    <Button
                        variant="outline"
                        className="w-full h-14 gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 transition-all duration-300"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="w-5 h-5" />
                        {isLoggingOut ? "Signing out..." : "Sign Out"}
                    </Button>
                </motion.div>
            </div>
        </AppLayout>
    );
}
