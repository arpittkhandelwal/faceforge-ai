"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-2" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-red-700/10 border border-red-600/30 rounded-xl flex items-center justify-center relative overflow-hidden group-hover:border-red-500 transition-colors">
            <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="text-red-500 font-bold text-2xl relative z-10 leading-none">RK</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black uppercase tracking-widest text-white leading-none">
              RK Academy
            </span>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em] mt-1">
              Professional Kabaddi
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex gap-10 items-center">
          {["About", "Programs", "Coaches", "Gallery"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-500 transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden md:block">Log In</Link>
          <Button className="bg-white hover:bg-gray-200 text-black font-bold rounded-none px-8 py-6 uppercase tracking-wider text-xs transition-all hover:scale-105 active:scale-95">
            Join Now
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
