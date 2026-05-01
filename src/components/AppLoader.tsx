import React, { useEffect, useState } from "react";

const PHRASES = [
  "Fueling your journey...",
  "Crunching your macros...",
  "Loading your nutrition log...",
  "Prepping your health goals...",
  "Counting those calories...",
  "Your body is a machine. Let's feed it right.",
  "Good things take a moment.",
];

interface AppLoaderProps {
  phrase?: string;
}

export function AppLoader({ phrase }: AppLoaderProps) {
  const [index, setIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(true);

  useEffect(() => {
    if (phrase) return; // static phrase — no cycling
    const id = setInterval(() => {
      setTextVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setTextVisible(true);
      }, 350);
    }, 1900);
    return () => clearInterval(id);
  }, [phrase]);

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-50 font-sans select-none">
      {/* Glow backdrop behind spinner */}
      <div
        className="absolute w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(204,255,0,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Spinner stack */}
      <div className="relative w-28 h-28 mb-10">
        {/* Outer static track */}
        <div className="absolute inset-0 rounded-full border-[3px] border-zinc-800" />

        {/* Outer spinning arc */}
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#CCFF00]"
          style={{ animation: "spin 1s linear infinite" }}
        />

        {/* Inner slow counter-spin accent */}
        <div
          className="absolute inset-[10px] rounded-full border-[2px] border-transparent border-b-[#CCFF00]/30"
          style={{ animation: "spin 2.4s linear infinite reverse" }}
        />

        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-4xl font-black italic tracking-tighter text-[#CCFF00]"
            style={{ animation: "logo-pulse 2s ease-in-out infinite" }}
          >
            J
          </span>
        </div>
      </div>

      {/* Bouncing dot trail */}
      <div className="flex gap-2 mb-7">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#CCFF00]"
            style={{
              animation: `dot-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Cycling phrase */}
      <p
        className="text-zinc-400 text-[11px] font-bold uppercase tracking-[0.18em] text-center px-10 transition-all duration-300"
        style={{ opacity: textVisible ? 1 : 0, transform: textVisible ? "translateY(0)" : "translateY(4px)" }}
      >
        {phrase ?? PHRASES[index]}
      </p>

      {/* Brand wordmark at bottom */}
      <p className="absolute bottom-10 text-zinc-700 text-[10px] font-black uppercase tracking-[0.25em]">
        Journable
      </p>
    </div>
  );
}
