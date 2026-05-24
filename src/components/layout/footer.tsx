
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Sparkles, Heart, PlusSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "framer-motion";
import { useRef, useState } from "react";

const navLinks = [
  { name: "Home", href: "/discover", icon: Home },
  { name: "Map", href: "/map", icon: Map },
  { name: "AI Price Estimation", href: "/ai", icon: Sparkles },
  { name: "Projects", href: "/projects", icon: Heart },
  { name: "Post", href: "/post", icon: PlusSquare },
  { name: "Profile", href: "/profile", icon: User },
];

function DockItem({
  href,
  icon: Icon,
  name,
  mouseX,
  isActive,
}: {
  href: string;
  icon: any;
  name: string;
  mouseX: MotionValue;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [48, 80, 48]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href} className="relative flex flex-col items-center justify-center">
      <motion.div
        ref={ref}
        style={{ width }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center transition-colors duration-200 relative group",
          isActive
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            : "bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
        )}
      >
        <Icon
          className={cn(
            "h-6 w-6 transition-colors duration-200",
            isActive ? "text-primary-foreground" : isHovered ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {name}
        </span>
      </motion.div>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-violet-500"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </Link>
  );
}

export function Footer() {
  const pathname = usePathname();
  const mouseX = useMotionValue(Infinity);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex justify-center pointer-events-none">
      <motion.nav
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "pointer-events-auto flex items-end gap-4 px-4 pb-3 pt-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] bg-zinc-950/70 backdrop-blur-xl border border-white/5 transition-all duration-300",
          "hover:bg-zinc-950/80 hover:border-white/10"
        )}
      >
        {navLinks.map((link) => (
          <DockItem
            key={link.name}
            href={link.href}
            icon={link.icon}
            name={link.name}
            mouseX={mouseX}
            isActive={pathname === link.href}
          />
        ))}
      </motion.nav>
    </div>
  );
}
