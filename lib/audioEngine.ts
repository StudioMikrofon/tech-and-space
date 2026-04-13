/**
 * 🎧 AUDIO ENGINE
 * Web Audio API backend for managing all sounds in the application
 * Handles: playback, volume, overlap rules, mobile optimization, preloading
 */

import { AUDIO_MAP, AUDIO_SETTINGS, CATEGORY_VOLUMES, SoundId, SoundCategory } from "./audioConfig";

interface PlayingSound {
  id: SoundId;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  startTime: number;
  pauseTime?: number;
  isPaused: boolean;
}

/**
 * AUDIO ENGINE CLASS
 * Singleton instance manages all audio playback
 */
class AudioEngine {
  private audioContext: AudioContext | null = null;
  private buffers: Map<SoundId, AudioBuffer> = new Map();
  private playingSounds: Map<string, PlayingSound> = new Map();
  private masterGainNode: GainNode | null = null;
  private categoryGainNodes: Map<SoundCategory, GainNode> = new Map();
  private soundsEnabled: boolean = true;
  private isMobile: boolean = false;
  private initialized: boolean = false;
  private instanceCounter: number = 0;

  /**
   * Initialize audio engine on first user interaction
   * (Required by browsers for autoplay policies)
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      // Detect mobile
      this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master volume control
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = AUDIO_SETTINGS.masterVolume;
      this.masterGainNode.connect(this.audioContext.destination);

      // Create category gain nodes
      for (const category of Object.keys(CATEGORY_VOLUMES) as SoundCategory[]) {
        const categoryGain = this.audioContext.createGain();
        categoryGain.gain.value = CATEGORY_VOLUMES[category];
        categoryGain.connect(this.masterGainNode);
        this.categoryGainNodes.set(category, categoryGain);
      }

      // Load user preferences
      this.loadPreferences();

      // Preload all sounds if configured
      if (AUDIO_SETTINGS.preloadOnStart) {
        await this.preloadAllSounds();
      }

      this.initialized = true;
      this.log("✓ Audio Engine initialized");
    } catch (error) {
      console.error("Failed to initialize Audio Engine:", error);
    }
  }

  /**
   * Preload all sound files into memory
   * Faster playback, no loading lag
   */
  private async preloadAllSounds(): Promise<void> {
    const soundIds = Object.keys(AUDIO_MAP) as SoundId[];

    for (const id of soundIds) {
      // Skip duplicate layers (ambientLayer2/3)
      if (this.buffers.has(id)) continue;

      try {
        const buffer = await this.loadAudioFile(id);
        this.buffers.set(id, buffer);
        this.log(`Preloaded: ${id}`);
      } catch (error) {
        console.warn(`Failed to preload ${id}:`, error);
      }
    }
  }

  /**
   * Load audio file and decode to AudioBuffer
   */
  private async loadAudioFile(soundId: SoundId): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error("Audio context not initialized");

    const config = AUDIO_MAP[soundId];
    const response = await fetch(config.file);

    if (!response.ok) {
      throw new Error(`Failed to load ${config.file}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    return audioBuffer;
  }

  /**
   * MAIN PLAY SOUND METHOD
   * Entry point for all sound playback
   */
  async play(soundId: SoundId): Promise<void> {
    // Ensure engine is initialized
    if (!this.initialized) {
      await this.init();
    }

    if (!this.soundsEnabled || !this.audioContext) return;

    try {
      const config = AUDIO_MAP[soundId];

      // RULE 1: Exclusive sounds (only one at a time)
      if (config.exclusive) {
        this.stopCategory(config.category);
      }

      // RULE 2: Overlap rules
      if (!config.overlap) {
        const existing = Array.from(this.playingSounds.values()).find(
          (s) => s.id === soundId && !s.isPaused
        );
        if (existing) {
          this.log(`Blocked overlapping: ${soundId}`);
          return;
        }
      }

      // Load buffer (from cache or fetch)
      let buffer = this.buffers.get(soundId);
      if (!buffer) {
        buffer = await this.loadAudioFile(soundId);
        this.buffers.set(soundId, buffer);
      }

      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = config.loop;

      // Create gain node for this sound instance
      const gainNode = this.audioContext.createGain();

      // Calculate volume: master * category * sound config * mobile adjustment
      const mobileMultiplier = this.isMobile && config.mobileVolume ? config.mobileVolume : 1;
      const categoryGain = this.categoryGainNodes.get(config.category)?.gain.value ?? 1;
      const finalVolume = config.volume * categoryGain * mobileMultiplier;

      gainNode.gain.value = 0; // Start silent for fade-in

      // Apply fade-in
      if (config.fadeIn) {
        gainNode.gain.linearRampToValueAtTime(finalVolume, this.audioContext.currentTime + config.fadeIn / 1000);
      } else {
        gainNode.gain.value = finalVolume;
      }

      // Connect: source → gain → category → master → destination
      source.connect(gainNode);
      const categoryNode = this.categoryGainNodes.get(config.category);
      if (categoryNode) {
        gainNode.connect(categoryNode);
      } else {
        gainNode.connect(this.masterGainNode!);
      }

      // Store reference
      const instanceId = `${soundId}-${++this.instanceCounter}`;
      const playingSound: PlayingSound = {
        id: soundId,
        source,
        gainNode,
        startTime: this.audioContext.currentTime,
        isPaused: false,
      };
      this.playingSounds.set(instanceId, playingSound);

      // Play
      source.start(0);

      // Handle end (remove from tracking)
      const duration = (buffer.duration * 1000 + (config.fadeOut ?? 0)) / 1000;
      setTimeout(() => {
        this.playingSounds.delete(instanceId);
      }, duration * 1000);

      this.log(`Playing: ${soundId} (${instanceId})`);
    } catch (error) {
      console.error(`Error playing ${soundId}:`, error);
    }
  }

  /**
   * Stop specific sound by ID
   */
  stop(soundId: SoundId): void {
    if (!this.audioContext) return;

    const toStop = Array.from(this.playingSounds.entries()).filter(([_, s]) => s.id === soundId);

    for (const [key, sound] of toStop) {
      if (sound.source) {
        // Fade out if configured
        const config = AUDIO_MAP[soundId];
        if (config.fadeOut) {
          sound.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + config.fadeOut / 1000);
          setTimeout(() => sound.source?.stop(), config.fadeOut);
        } else {
          sound.source.stop();
        }
      }
      this.playingSounds.delete(key);
    }

    this.log(`Stopped: ${soundId}`);
  }

  /**
   * Stop all sounds in a category
   */
  stopCategory(category: SoundCategory): void {
    const toStop = Array.from(this.playingSounds.values()).filter(
      (s) => AUDIO_MAP[s.id].category === category
    );

    for (const sound of toStop) {
      if (sound.source) sound.source.stop();
    }

    this.log(`Stopped category: ${category}`);
  }

  /**
   * Stop ALL sounds
   */
  stopAll(): void {
    for (const sound of this.playingSounds.values()) {
      if (sound.source) sound.source.stop();
    }
    this.playingSounds.clear();
    this.log("Stopped all sounds");
  }

  /**
   * VOLUME CONTROLS
   */

  setMasterVolume(value: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, value));
      this.savePreferences();
    }
  }

  getMasterVolume(): number {
    return this.masterGainNode?.gain.value ?? 0;
  }

  setCategoryVolume(category: SoundCategory, value: number): void {
    const gainNode = this.categoryGainNodes.get(category);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, value));
      this.savePreferences();
    }
  }

  getCategoryVolume(category: SoundCategory): number {
    return this.categoryGainNodes.get(category)?.gain.value ?? 1;
  }

  /**
   * GLOBAL MUTE / ENABLE
   */

  setSoundsEnabled(enabled: boolean): void {
    this.soundsEnabled = enabled;
    this.savePreferences();
    this.log(`Sounds ${enabled ? "enabled" : "muted"}`);
  }

  areSoundsEnabled(): boolean {
    return this.soundsEnabled;
  }

  toggleSounds(): void {
    this.setSoundsEnabled(!this.soundsEnabled);
  }

  /**
   * PREFERENCES (LocalStorage)
   */

  private savePreferences(): void {
    try {
      const prefs = {
        soundsEnabled: this.soundsEnabled,
        masterVolume: this.masterGainNode?.gain.value ?? 1,
        categoryVolumes: Object.fromEntries(
          Array.from(this.categoryGainNodes.entries()).map(([cat, node]) => [
            cat,
            node.gain.value,
          ])
        ),
      };
      localStorage.setItem(AUDIO_SETTINGS.storageKey, JSON.stringify(prefs));
    } catch (error) {
      console.warn("Failed to save audio preferences:", error);
    }
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem(AUDIO_SETTINGS.storageKey);
      if (!stored) return;

      const prefs = JSON.parse(stored);
      this.soundsEnabled = prefs.soundsEnabled ?? true;

      if (this.masterGainNode && prefs.masterVolume !== undefined) {
        this.masterGainNode.gain.value = prefs.masterVolume;
      }

      if (prefs.categoryVolumes) {
        for (const [cat, vol] of Object.entries(prefs.categoryVolumes)) {
          const gainNode = this.categoryGainNodes.get(cat as SoundCategory);
          if (gainNode && typeof vol === "number") {
            gainNode.gain.value = vol;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load audio preferences:", error);
    }
  }

  /**
   * DEBUG HELPERS
   */

  private log(message: string): void {
    if (AUDIO_SETTINGS.debug) {
      console.log(`[AudioEngine] ${message}`);
    }
  }

  getPlayingCount(): number {
    return this.playingSounds.size;
  }

  getStatus(): {
    initialized: boolean;
    soundsEnabled: boolean;
    playingCount: number;
    masterVolume: number;
    isMobile: boolean;
  } {
    return {
      initialized: this.initialized,
      soundsEnabled: this.soundsEnabled,
      playingCount: this.playingSounds.size,
      masterVolume: this.getMasterVolume(),
      isMobile: this.isMobile,
    };
  }
}

/**
 * SINGLETON INSTANCE
 * Use: audioEngine.play("click")
 */
export const audioEngine = new AudioEngine();

/**
 * CONVENIENCE EXPORTS
 */
export async function playSound(soundId: SoundId): Promise<void> {
  return audioEngine.play(soundId);
}

export function stopSound(soundId: SoundId): void {
  audioEngine.stop(soundId);
}

export function stopAllSounds(): void {
  audioEngine.stopAll();
}

export function setSoundVolume(level: number): void {
  audioEngine.setMasterVolume(level);
}

export function toggleSoundMute(): void {
  audioEngine.toggleSounds();
}
