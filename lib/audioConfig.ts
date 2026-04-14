/**
 * 🎧 CENTRAL AUDIO CONFIGURATION
 * Master sound map for all UI, ambient, and feedback sounds
 * One source of truth for audio behavior across the app
 */

export type SoundCategory = "ui" | "ambient" | "feedback" | "transition" | "space";
export type SoundId =
  | "click" | "hover" | "select" | "tab"
  | "glitch" | "transition" | "whoosh"
  | "boot" | "success"
  | "ping" | "dataStream" | "alert"
  | "ambient" | "ambientLayer2" | "ambientLayer3"
  | "quizCorrect" | "quizWrong";

export interface SoundConfig {
  /** Audio file path in /public/audio/ */
  file: string;

  /** Master volume multiplier (0-1) */
  volume: number;

  /** Sound category for grouping/control */
  category: SoundCategory;

  /** Duration in milliseconds */
  duration: number;

  /** Can multiple instances play simultaneously? */
  overlap: boolean;

  /** If true, sound loops infinitely */
  loop: boolean;

  /** Fade-in time (ms) - for smooth start */
  fadeIn?: number;

  /** Fade-out time (ms) - for smooth end */
  fadeOut?: number;

  /** Priority for interruption (higher = more important) */
  priority: number;

  /** Mobile volume reduction factor (0.3 = 30% volume on mobile) */
  mobileVolume?: number;

  /** If true, won't play if another sound in same category is playing */
  exclusive?: boolean;

  /** Description for debugging/documentation */
  description: string;
}

/**
 * MASTER SOUND MAP
 * Every sound the app uses, defined here
 * Format: Sound ID → Configuration
 */
export const AUDIO_MAP: Record<SoundId, SoundConfig> = {
  // ═══════════════════════════════════════════════════════════════
  // UI INTERACTION SOUNDS (Click, Hover, Selection)
  // ═══════════════════════════════════════════════════════════════

  click: {
    file: "/audio/click.wav",
    volume: 0.42,
    category: "ui",
    duration: 110,
    overlap: true, // Rapid clicks allowed
    loop: false,
    priority: 8,
    mobileVolume: 0.3,
    description: "Sharp console keypress - primary click feedback (most frequent)"
  },

  hover: {
    file: "/audio/hover.wav",
    volume: 0.2,
    category: "ui",
    duration: 90,
    overlap: true, // Multiple hovers in quick succession
    loop: false,
    priority: 5,
    mobileVolume: 0.15,
    description: "Subtle subspace blip - hover over links/cards (avoid spam)"
  },

  select: {
    file: "/audio/select.wav",
    volume: 0.28,
    category: "ui",
    duration: 110,
    overlap: false, // Discrete mode change
    loop: false,
    priority: 7,
    mobileVolume: 0.2,
    description: "Two-tone selection chime - mode/tab selection (Space Tracker)"
  },

  tab: {
    file: "/audio/tab.wav",
    volume: 0.2,
    category: "ui",
    duration: 55,
    overlap: false, // Tab switches are discrete
    loop: false,
    priority: 4,
    mobileVolume: 0.1,
    description: "Quick tick - sidebar tab changes (minimal)"
  },

  // ═══════════════════════════════════════════════════════════════
  // TRANSITION SOUNDS (Page Changes, Navigation)
  // ═══════════════════════════════════════════════════════════════

  glitch: {
    file: "/audio/glitch.wav",
    volume: 0.6,
    category: "transition",
    duration: 144,
    overlap: false, // Transitions are discrete
    loop: false,
    priority: 9,
    mobileVolume: 0.4,
    description: "Digital scramble - page transitions (high impact)"
  },

  transition: {
    file: "/audio/transition.wav",
    volume: 0.5,
    category: "transition",
    duration: 420,
    overlap: false, // Major transitions only
    loop: false,
    fadeIn: 50,
    fadeOut: 100,
    priority: 10,
    exclusive: true, // Only one major transition at a time
    mobileVolume: 0.35,
    description: "Glitch → whoosh → confirm - major state change (epic)"
  },

  whoosh: {
    file: "/audio/whoosh.wav",
    volume: 0.5,
    category: "transition",
    duration: 250,
    overlap: false,
    loop: false,
    priority: 8,
    mobileVolume: 0.3,
    description: "Smooth directional sweep - modal open/close"
  },

  // ═══════════════════════════════════════════════════════════════
  // SYSTEM EVENTS (Boot, Success, Alerts)
  // ═══════════════════════════════════════════════════════════════

  boot: {
    file: "/audio/boot.wav",
    volume: 0.7,
    category: "feedback",
    duration: 1300,
    overlap: false,
    loop: false,
    fadeIn: 100,
    priority: 10,
    exclusive: true,
    description: "CRT power-on - Terminal/SpaceTracker boot sequence (cinematic)"
  },

  success: {
    file: "/audio/success.wav",
    volume: 0.7,
    category: "feedback",
    duration: 340,
    overlap: false,
    loop: false,
    fadeOut: 100,
    priority: 8,
    mobileVolume: 0.5,
    description: "Dual-tone confirmation - boot complete / operation success"
  },

  alert: {
    file: "/audio/alert.wav",
    volume: 0.5,
    category: "feedback",
    duration: 200,
    overlap: false,
    loop: false,
    priority: 9,
    mobileVolume: 0.35,
    description: "Warning/error feedback - soft negative alert (not annoying)"
  },

  // ═══════════════════════════════════════════════════════════════
  // SPACE MODE SOUNDS (Sonar, Telemetry)
  // ═══════════════════════════════════════════════════════════════

  ping: {
    file: "/audio/ping.wav",
    volume: 0.5,
    category: "space",
    duration: 420,
    overlap: true, // Multiple pings from different celestial bodies
    loop: false,
    priority: 6,
    mobileVolume: 0.3,
    description: "Deep-space sonar - focus on celestial body (Space Tracker)"
  },

  dataStream: {
    file: "/audio/dataStream.wav",
    volume: 0.15,
    category: "space",
    duration: 120,
    overlap: true, // Multiple data packets
    loop: false,
    priority: 3,
    mobileVolume: 0.08,
    description: "Digital packet burst - telemetry/data updates (subtle background)"
  },

  // ═══════════════════════════════════════════════════════════════
  // GAMIFICATION SOUNDS (Quiz Feedback)
  // ═══════════════════════════════════════════════════════════════

  quizCorrect: {
    file: "/audio/quizCorrect.wav",
    volume: 0.6,
    category: "feedback",
    duration: 280,
    overlap: false,
    loop: false,
    fadeOut: 80,
    priority: 9,
    mobileVolume: 0.4,
    description: "Satisfying reward tone - correct quiz answer"
  },

  quizWrong: {
    file: "/audio/quizWrong.wav",
    volume: 0.4,
    category: "feedback",
    duration: 180,
    overlap: false,
    loop: false,
    priority: 8,
    mobileVolume: 0.25,
    description: "Soft negative tone - incorrect quiz answer (not harsh)"
  },

  // ═══════════════════════════════════════════════════════════════
  // AMBIENT SOUNDS (Background Atmosphere - Multi-Layer)
  // ═══════════════════════════════════════════════════════════════

  ambient: {
    file: "/audio/ambient_layer1.wav",
    volume: 0.15,
    category: "ambient",
    duration: 45000, // 45 seconds loop
    overlap: false,
    loop: true,
    fadeIn: 3000, // Slow fade-in (3s)
    fadeOut: 3000, // Smooth fade-out
    priority: 2, // Low priority (background)
    mobileVolume: 0.08,
    description: "Layer 1: Deep sub-bass hum (40-60Hz) - foundation"
  },

  ambientLayer2: {
    file: "/audio/ambient_layer2.wav",
    volume: 0.12,
    category: "ambient",
    duration: 60000, // 60 seconds (different from layer1 for variation)
    overlap: false,
    loop: true,
    fadeIn: 4000,
    fadeOut: 3000,
    priority: 2,
    mobileVolume: 0.06,
    description: "Layer 2: Mid-range shimmer (1-3kHz) - evolving texture"
  },

  ambientLayer3: {
    file: "/audio/ambient_layer3.wav",
    volume: 0.08,
    category: "ambient",
    duration: 75000, // 75 seconds (unique cycle)
    overlap: false,
    loop: true,
    fadeIn: 5000,
    fadeOut: 3000,
    priority: 2,
    mobileVolume: 0.04,
    description: "Layer 3: High shimmer/modulation (5-8kHz) - subtle movement"
  },
};

/**
 * CATEGORY VOLUME CONTROLS
 * Independent master volume for each sound category
 * Users can mute/reduce specific categories
 */
export const CATEGORY_VOLUMES: Record<SoundCategory, number> = {
  ui: 1.0,        // Full volume by default
  ambient: 0.6,   // Ambient quieter by default
  feedback: 1.0,
  transition: 1.0,
  space: 0.8,
};

/**
 * GLOBAL SETTINGS
 */
export const AUDIO_SETTINGS = {
  /** Master volume multiplier (0-1) */
  masterVolume: 0.06,

  /** Whether sounds are enabled globally */
  soundsEnabled: true,

  /** Whether to reduce sounds on mobile */
  mobileOptimized: true,

  /** Preload all sounds on app start */
  preloadOnStart: false, // Audio files missing in /public/audio/ - disable preload to prevent 404 loops

  /** Log audio events to console (debug) */
  debug: false,

  /** LocalStorage key for user audio preferences */
  storageKey: "tp-audio-prefs",

  /** Prevent click spam: min ms between clicks */
  clickDebounce: 50,

  /** Prevent hover spam: min ms between hover sounds */
  hoverDebounce: 100,
};

/**
 * SOUND GROUPS (for batch control)
 * Useful for muting categories
 */
export const SOUND_GROUPS = {
  allUI: ["click", "hover", "select", "tab"],
  allTransitions: ["glitch", "transition", "whoosh"],
  allFeedback: ["boot", "success", "alert", "quizCorrect", "quizWrong"],
  allAmbient: ["ambient", "ambientLayer2", "ambientLayer3"],
  allSpace: ["ping", "dataStream"],
  all: [
    "click", "hover", "select", "tab",
    "glitch", "transition", "whoosh",
    "boot", "success", "alert",
    "ping", "dataStream",
    "ambient", "ambientLayer2", "ambientLayer3",
    "quizCorrect", "quizWrong",
  ] as SoundId[],
};

/**
 * VALIDATION HELPERS
 */
export function isValidSoundId(id: string): id is SoundId {
  return Object.keys(AUDIO_MAP).includes(id);
}

export function getSoundConfig(id: SoundId): SoundConfig {
  return AUDIO_MAP[id];
}

export function getCategoryVolume(category: SoundCategory): number {
  return CATEGORY_VOLUMES[category];
}

/**
 * SOUND TYPE DETECTION
 */
export function getSoundType(id: SoundId): SoundCategory {
  return AUDIO_MAP[id].category;
}

export function isLooping(id: SoundId): boolean {
  return AUDIO_MAP[id].loop;
}

export function allowsOverlap(id: SoundId): boolean {
  return AUDIO_MAP[id].overlap;
}
