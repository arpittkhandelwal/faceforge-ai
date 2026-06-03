"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-red-600 selection:text-white">
      {/* Editorial Hero Section */}
      <section ref={containerRef} className="relative min-h-[100svh] flex items-end pb-12 overflow-hidden">
        {/* Parallax Background */}
        <motion.div 
          style={{ y, opacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2069&auto=format&fit=crop"
            alt="Kabaddi Action"
            fill
            className="object-cover opacity-40 mix-blend-luminosity grayscale contrast-125"
            priority
          />
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        </motion.div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 w-full pt-40">
          <div className="flex flex-col md:flex-row justify-between items-end gap-12">
            <div className="w-full md:w-2/3">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden mb-6"
              >
                <p className="text-red-600 font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-4">
                  // Forging Elite Athletes
                </p>
                <h1 className="text-6xl md:text-[8vw] leading-[0.85] font-black uppercase tracking-tighter">
                  Raw Power. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500">
                    Tactical Mind.
                  </span>
                </h1>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-gray-400 text-lg md:text-xl max-w-xl font-light leading-relaxed border-l-2 border-red-600 pl-6"
              >
                RK Academy isn't just a training ground. It's a crucible where raw talent is forged into professional legacy through discipline and world-class methodology.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="w-full md:w-auto flex flex-col gap-4"
            >
              <Link href="/admission" className="group relative bg-white text-black p-8 md:p-10 flex items-center justify-between w-full md:w-72 overflow-hidden">
                <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
                <span className="relative z-10 text-xl font-bold uppercase tracking-wide group-hover:text-white transition-colors duration-500">
                  Admissions
                </span>
                <ArrowUpRight className="relative z-10 w-8 h-8 group-hover:text-white transition-colors duration-500 group-hover:rotate-45" />
              </Link>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/10 p-6 flex flex-col justify-between h-32">
                  <span className="text-3xl font-black text-white">12+</span>
                  <span className="text-xs uppercase text-gray-500 tracking-widest">Pro Signings</span>
                </div>
                <div className="bg-[#111] border border-white/5 p-6 flex flex-col justify-between h-32">
                  <span className="text-3xl font-black text-red-500">#1</span>
                  <span className="text-xs uppercase text-gray-500 tracking-widest">National Rank</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy / About Section (Brutalist layout) */}
      <section className="py-32 relative border-t border-white/10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="col-span-1 md:col-span-4">
              <h2 className="text-sm font-bold tracking-[0.2em] text-red-600 uppercase sticky top-32">
                Our Philosophy
              </h2>
            </div>
            
            <div className="col-span-1 md:col-span-8">
              <div className="text-3xl md:text-5xl font-medium leading-tight text-gray-300">
                <span className="text-white font-bold">We don't do basic.</span> The modern game of Kabaddi demands absolute physical dominance paired with split-second cognitive precision. Our curriculum is engineered for athletes who refuse to settle for average.
              </div>
              
              <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="group">
                  <div className="w-full aspect-[4/3] relative mb-6 overflow-hidden bg-[#111]">
                    <Image 
                      src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop"
                      alt="Training"
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Biomechanics & Strength</h3>
                  <p className="text-gray-400 font-light text-sm">Advanced sports science methodology applied to Kabaddi specific movements.</p>
                </div>
                
                <div className="group md:mt-24">
                  <div className="w-full aspect-[4/3] relative mb-6 overflow-hidden bg-[#111]">
                    <Image 
                      src="https://images.unsplash.com/photo-1526676037777-05a232554f77?q=80&w=2070&auto=format&fit=crop"
                      alt="Tactics"
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Tactical Supremacy</h3>
                  <p className="text-gray-400 font-light text-sm">Mat awareness, raid strategy, and defensive chain coordination masterclasses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-12 bg-red-600 overflow-hidden flex items-center">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-8 text-black"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <span className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Blood, Sweat, Glory</span>
              <span className="w-4 h-4 rounded-full bg-black"></span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 border-t border-white/10 text-sm text-gray-500 text-center font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} RK Academy. All Rights Reserved.
      </footer>
    </div>
  );
}
