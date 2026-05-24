"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { User as UserIcon, LogOut } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { motion } from "framer-motion";

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  return (
    <header className="w-full h-16 fixed top-0 inset-x-0 z-50 border-b border-zinc-900/30 bg-[#060608]/40 backdrop-blur-xl px-8 flex items-center justify-between transition-all">
      {/* Left Section */}
      <div className="flex items-center">
        <Logo />
      </div>

      {/* Center Section */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/about" className="font-sans text-[10px] tracking-[0.2em] text-zinc-400 hover:text-violet-400 font-medium transition-colors uppercase">
          THE STUDIO
        </Link>
        <Link href="/contact" className="font-sans text-[10px] tracking-[0.2em] text-zinc-400 hover:text-violet-400 font-medium transition-colors uppercase">
          CONCIERGE
        </Link>
        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/20 border border-zinc-800/40 text-zinc-500 font-sans text-[11px] tracking-wide cursor-pointer hover:bg-zinc-900/40 transition-all">
          <span>Search ecosystem...</span>
          <kbd className="text-[9px] font-mono opacity-60 bg-zinc-800 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="hidden xl:flex flex-col items-end font-mono text-[9px] tracking-widest text-zinc-500 uppercase border-r border-zinc-800/60 pr-4 mr-2">
          <span className="text-zinc-400">KERALA, IN</span>
          <span className="text-[8px] opacity-70">Cloud Sync Active</span>
        </div>
        {isUserLoading ? (
          <Skeleton className="h-8 w-20 rounded-full" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full border border-white/10 hover:border-white/20 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoURL || undefined}
                    alt={user.displayName || user.email || ""}
                  />
                  <AvatarFallback>
                    {user.email?.[0]?.toUpperCase() || (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-panel border-white/10 text-foreground" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-sans tracking-tight font-medium leading-none">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white/5 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button size="sm" asChild className="rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-medium">
              <Link href="/login">Sign In</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </header>
  );
}
