"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { X, Globe2 } from "lucide-react";
import Globe from "./Globe";
import GlobeQuiz from "./GlobeQuiz";
import type { GlobeHandle } from "./GlobeWrapper";
import type { GeoLocation } from "@/lib/types";
import { playSound } from "@/lib/sounds";

interface GlobeWithQuizProps {
  geo: GeoLocation;
  categoryColor: string;
}

export default function GlobeWithQuiz({ geo, categoryColor }: GlobeWithQuizProps) {
  const globeRef = useRef<GlobeHandle>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [pins, setPins] = useState([
    { lat: geo.lat, lng: geo.lon, label: geo.name, color: categoryColor, id: "article-location" },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      globeRef.current?.focusOn(geo);
    }, 1500);
    return () => clearTimeout(timer);
  }, [geo]);

  const handleFlyTo = useCallback((lat: number, lon: number) => {
    globeRef.current?.focusOn({ lat, lon, name: "", countryCode: "" });
    setPins([{ lat, lng: lon, label: "", color: "#00e5ff", id: "quiz-location" }]);
  }, []);

  const handleCloseQuiz = useCallback(() => {
    setQuizOpen(false);
    // Restore article pin
    setPins([{ lat: geo.lat, lng: geo.lon, label: geo.name, color: categoryColor, id: "article-location" }]);
    setTimeout(() => globeRef.current?.focusOn(geo), 100);
  }, [geo, categoryColor]);

  return (
    <div>
      <div className="glass-card p-4 !hover:transform-none">
        <h3 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wider">
          Location
        </h3>
        <div className="flex justify-center">
          <Globe
            ref={globeRef}
            pins={pins}
            width={280}
            height={280}
            autoRotate={false}
          />
        </div>
        <p className="text-center text-sm text-text-secondary mt-2">{geo.name}</p>
      </div>

      {quizOpen ? (
        <div className="mt-3 relative">
          <button
            onClick={handleCloseQuiz}
            className="absolute top-2 right-2 z-10 p-1 rounded text-text-secondary/60 hover:text-text-secondary transition-colors"
            aria-label="Close quiz"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <GlobeQuiz onClose={handleCloseQuiz} onFlyTo={handleFlyTo} />
        </div>
      ) : (
        <button
          onClick={() => { playSound("click"); setQuizOpen(true); }}
          className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm font-mono hover:bg-accent-cyan/20 transition-colors cursor-pointer"
        >
          <Globe2 className="w-4 h-4" />
          Start Quiz
        </button>
      )}
    </div>
  );
}
