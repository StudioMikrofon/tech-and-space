"use client";

/**
 * 🎧 AUDIO PROVIDER
 * Initialize audio engine on first user interaction
 * Wrap entire app with this to enable sounds
 */

import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audioEngine";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;

    const initAudio = async () => {
      // Initialize on first interaction (browser autoplay policy)
      const events = ["click", "touchstart", "keydown"];

      const handleInteraction = async () => {
        if (!initRef.current) {
          await audioEngine.init();
          initRef.current = true;
          console.log("✓ Audio Engine initialized on user interaction");

          // Remove listeners after init
          events.forEach((event) => {
            document.removeEventListener(event, handleInteraction);
          });
        }
      };

      events.forEach((event) => {
        document.addEventListener(event, handleInteraction, { once: true });
      });
    };

    initAudio();
  }, []);

  return <>{children}</>;
}
