"use client";

/**
 * 🎛 AUDIO CONTROLS
 * Master volume, mute toggle, category controls
 * Can be placed in settings, header, or anywhere
 */

import { useEffect, useState } from "react";
import { audioEngine } from "@/lib/audioEngine";
import { CATEGORY_VOLUMES, SoundCategory } from "@/lib/audioConfig";

interface AudioControlsProps {
  variant?: "compact" | "full" | "minimal";
  showCategories?: boolean;
  className?: string;
}

export function AudioControls({
  variant = "compact",
  showCategories = false,
  className = "",
}: AudioControlsProps) {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [masterVolume, setMasterVolume] = useState(0.06);
  const [categoryVolumes, setCategoryVolumes] = useState<Record<SoundCategory, number>>({
    ui: 1,
    ambient: 0.6,
    feedback: 1,
    transition: 1,
    space: 0.8,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const status = audioEngine.getStatus();
    setSoundsEnabled(status.soundsEnabled);
    setMasterVolume(status.masterVolume);
    setIsInitialized(true);
  }, []);

  const handleToggleSounds = () => {
    audioEngine.toggleSounds();
    setSoundsEnabled(!soundsEnabled);
  };

  const handleMasterVolumeChange = (value: number) => {
    audioEngine.setMasterVolume(value);
    setMasterVolume(value);
  };

  const handleCategoryVolumeChange = (category: SoundCategory, value: number) => {
    audioEngine.setCategoryVolume(category, value);
    setCategoryVolumes((prev) => ({ ...prev, [category]: value }));
  };

  if (!isInitialized) return null;

  // VARIANT: Minimal (just mute button)
  if (variant === "minimal") {
    return (
      <button
        onClick={handleToggleSounds}
        className={`text-sm px-2 py-1 rounded border transition-colors ${
          soundsEnabled
            ? "border-cyan-500/40 text-cyan-400 hover:border-cyan-500/60"
            : "border-white/20 text-white/40 hover:border-white/40"
        } ${className}`}
        title={soundsEnabled ? "Mute sounds" : "Unmute sounds"}
      >
        {soundsEnabled ? "🔊" : "🔇"}
      </button>
    );
  }

  // VARIANT: Compact (mute + master volume)
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded ${className}`}
      >
        <button
          onClick={handleToggleSounds}
          className={`text-sm transition-colors ${
            soundsEnabled ? "text-cyan-400" : "text-white/40"
          }`}
          title={soundsEnabled ? "Mute" : "Unmute"}
        >
          {soundsEnabled ? "🔊" : "🔇"}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVolume}
          onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
          className="w-24 h-1 bg-white/20 rounded cursor-pointer accent-cyan-500"
          title="Master volume"
        />

        <span className="text-[10px] text-white/50 w-8">
          {Math.round(masterVolume * 100)}%
        </span>
      </div>
    );
  }

  // VARIANT: Full (master + all categories)
  return (
    <div className={`space-y-4 p-4 bg-white/5 border border-white/10 rounded ${className}`}>
      {/* Master Volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-white/80">Master Volume</label>
          <button
            onClick={handleToggleSounds}
            className={`text-lg transition-colors ${
              soundsEnabled ? "text-cyan-400 hover:text-cyan-300" : "text-white/40 hover:text-white/60"
            }`}
            title={soundsEnabled ? "Mute all" : "Unmute all"}
          >
            {soundsEnabled ? "🔊" : "🔇"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={masterVolume}
            onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
            disabled={!soundsEnabled}
            className={`flex-1 h-2 bg-white/20 rounded cursor-pointer accent-cyan-500 ${
              !soundsEnabled ? "opacity-40" : ""
            }`}
          />
          <span className="text-xs text-white/50 w-8">{Math.round(masterVolume * 100)}%</span>
        </div>
      </div>

      {/* Category Controls */}
      {showCategories && (
        <div className="space-y-3 border-t border-white/10 pt-3">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">
            Sound Categories
          </h3>

          {(Object.keys(categoryVolumes) as SoundCategory[]).map((category) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-white/70 capitalize">{category}</label>
                <span className="text-[10px] text-white/50">
                  {Math.round(categoryVolumes[category] * 100)}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={categoryVolumes[category]}
                onChange={(e) =>
                  handleCategoryVolumeChange(category, parseFloat(e.target.value))
                }
                disabled={!soundsEnabled}
                className={`w-full h-1.5 bg-white/20 rounded cursor-pointer accent-blue-500 ${
                  !soundsEnabled ? "opacity-40" : ""
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Debug Info (development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="border-t border-white/10 pt-3 text-[9px] text-white/40 space-y-1">
          <div>Status: {audioEngine.getStatus().initialized ? "✓ Init" : "⏳ Pending"}</div>
          <div>Playing: {audioEngine.getPlayingCount()} sounds</div>
          <div>Mobile: {audioEngine.getStatus().isMobile ? "Yes" : "No"}</div>
        </div>
      )}
    </div>
  );
}
