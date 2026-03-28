"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Lock } from "lucide-react";

interface UnlockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnlockModal({ isOpen, onOpenChange }: UnlockModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/30 backdrop-blur-xl border-primary/20 text-foreground">
        <DialogHeader>
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                <Lock className="w-8 h-8 text-primary" />
             </div>
          </div>
          <DialogTitle className="text-center font-headline text-3xl">
            Unlock EstAi
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground pt-2">
            Create an account to estimate prices, save listings, and post your own properties.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0 pt-4">
          <Button asChild size="lg">
            <Link href="/login">Sign In / Create Account</Link>
          </Button>
          <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
