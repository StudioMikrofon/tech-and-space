# 🎵 AUDIO GENERATION SPECIFICATION

**For:** Suno / ElevenLabs / Stable Audio / Claude Audio
**Purpose:** Generate professional sci-fi sound design (NASA + Jarvis aesthetic)
**Status:** Ready for AI Audio Generation
**Date:** 2026-04-13

---

# 📋 AUDIO SPECIFICATIONS BY SOUND

Each specification includes:
- Exact duration and frequency
- Waveform/envelope characteristics
- Sonic characteristics
- Use case context
- Replacement guidelines

---

## 1. CLICK (110ms) — Primary Button Feedback
**Category:** UI Interaction  
**Frequency:** Most played sound (every button click)  
**File:** `click.wav`

### Sonic Specification
```
Duration: 110ms
Attack: 5ms sharp transient
Decay: 105ms total

Waveform Analysis:
- Primary: Triangle oscillator 720Hz → 540Hz (downward pitch)
- Attack Transient: Narrow bandpass noise burst at 4200Hz (50ms)
- Tail: Sine wave 1320Hz → 1140Hz (resonant finish)

Envelope:
- 0–5ms: Sharp rise (0 → peak at 0.42 amplitude)
- 5–50ms: Fast decay to transient release
- 50–110ms: Sine tail fade (smooth exit)

Style: Sharp mechanical keypress from NASA console
Aesthetic: Professional, satisfying, non-synthetic
Feel: Metal contact, clean digital signature
```

### Generation Prompt
```
Create a 110ms sharp button click sound for a sci-fi interface.
Think: NASA mission control console, mechanical keypress, clean digital.
Attack: Immediate and present (5ms transient)
Character: Triangle wave attack (bright) → noise burst → smooth sine tail
Volume: Medium-present (0.42 amplitude)
Quality: Professional electronics lab, not video game
Color: Bright, crisp, satisfying
No: Beeps, musical tones, synthesizer vibes
Similar reference: Classic mechanical computer keypress, clean and professional
```

---

## 2. HOVER (90ms) — Subtle Link/Card Feedback
**Category:** UI Interaction  
**Frequency:** Very frequent (prevent spam on mobile)  
**File:** `hover.wav`

### Sonic Specification
```
Duration: 90ms
Attack: 2ms very subtle
Decay: 88ms total

Waveform Analysis:
- Primary: Dual-partial sine
  - Part 1: 980Hz → 1120Hz (rising sweep)
  - Part 2: 5200Hz bandpass noise burst (white noise filtered)
- Combined: Creates a "blip" sensation

Envelope:
- 0–2ms: Almost imperceptible rise
- 2–30ms: Combined wave peak (sine + noise overlap)
- 30–90ms: Fast fade (disappears completely)

Style: Subspace frequency blip (sci-fi)
Aesthetic: Very subtle, non-intrusive, elegant
Feel: Electrical feedback, hover acknowledgment
```

### Generation Prompt
```
Create a 90ms subtle hover feedback sound for UI navigation.
Think: Sci-fi starship navigation console, barely noticeable, elegant
Attack: Extremely subtle (2ms)
Character: Sine wave 980→1120Hz combined with high-frequency shimmer
Volume: Very low (0.2 amplitude, will be even quieter on mobile)
Quality: Smooth, sophisticated, professional
Color: Ethereal, high-frequency presence
No: Intrusive beeps, video game sound, loud effects
Reference: Star Trek TNG navigation UI feedback, barely there but present
```

---

## 3. SELECT (110ms) — Mode/Option Selection
**Category:** UI Interaction  
**Frequency:** Occasional (mode changes in Space Tracker)  
**File:** `select.wav`

### Sonic Specification
```
Duration: 110ms
Attack: 5ms rise
Decay: 105ms total

Waveform Analysis:
- Dual-tone chime:
  - Primary: Sine 820Hz → 980Hz (80ms, rising)
  - Secondary: Triangle 1640Hz → 1820Hz (100ms, harmonic overtone)
- Creates a musical "selection confirmation"

Envelope:
- 0–5ms: Rise from silence
- 5–80ms: Primary tone sustained
- 5–100ms: Secondary harmonic overlay
- 80–110ms: Both fade together

Style: Two-tone selection chime (musical but clear)
Aesthetic: Melodic without being "gamey"
Feel: Confirmation of state change, digital musical
```

### Generation Prompt
```
Create a 110ms two-tone selection sound for mode switching.
Think: Space observation mode toggle, musical but professional
Attack: Quick rise (5ms)
Character: Two ascending tones (820→980Hz primary, 1640→1820Hz harmonic)
Volume: Medium (0.28 amplitude)
Quality: Musical, clear, confirmatory
Color: Bright, harmonic, resonant
No: Cheap game sounds, excessive reverb, robotic
Reference: High-end app interface selection tone, like premium spacecraft UI
```

---

## 4. TAB (55ms) — Sidebar Tab Switch
**Category:** UI Navigation  
**Frequency:** Occasional (sidebar tab clicks)  
**File:** `tab.wav`

### Sonic Specification
```
Duration: 55ms
Attack: Immediate (1ms)
Decay: 54ms total

Waveform Analysis:
- Single element: Triangle oscillator sweep 1500Hz → 1280Hz
- Descending pitch (opposite of typical "rise" sounds)
- Creates a "tick" sensation

Envelope:
- 0–1ms: Immediate peak (0.2 amplitude)
- 1–55ms: Smooth fade to silence (linear decay)

Style: Quick tick/snap (minimal, discrete)
Aesthetic: Minimal, quick, snappy
Feel: Tab confirmation, navigation acknowledgment
```

### Generation Prompt
```
Create a 55ms quick tick sound for sidebar tab navigation.
Think: Fast, minimal, professional acknowledgment of tab switch
Attack: Immediate snap (1ms)
Character: Single downward pitch sweep (1500→1280Hz)
Volume: Low (0.2 amplitude)
Quality: Very brief, crisp, minimal
Color: Clear, neutral, functional
No: Long tails, complex harmonics, gamey
Reference: Digital metronome tick, professional but swift
```

---

## 5. GLITCH (144ms) — Page Transition
**Category:** Navigation Transition  
**Frequency:** Infrequent (only on page changes)  
**File:** `glitch.wav`

### Sonic Specification
```
Duration: 144ms
Attack: Immediate (complex multi-step pattern)

Waveform Analysis:
- 8-step digital scramble pattern:
  Step 1: Noise burst (2400Hz) 10ms
  Step 2: Pitch drop (800Hz) 8ms
  Step 3: Noise burst (3200Hz) 10ms
  Step 4: Pitch drop (600Hz) 8ms
  Step 5: Noise burst (2800Hz) 10ms
  Step 6: Pitch drop (1200Hz) 8ms
  Step 7: Noise burst (3600Hz) 10ms
  Step 8: Pitch drop (400Hz) 8ms
  
- Volume decreases across steps (falling amplitude envelope)
- Creates a "digital disintegration" effect

Style: Digital scramble, interference pattern
Aesthetic: Sci-fi digital effect, dramatic
Feel: Transition boundary, digital portal crossing
```

### Generation Prompt
```
Create a 144ms digital glitch/scramble sound for page transitions.
Think: Digital disruption, sci-fi portal effect, data stream interruption
Attack: Immediate digital chaos (alternating noise and pitch drops)
Character: 8-step pattern of noise bursts and pitch drops in descending order
Frequencies: Chaos pattern (2400, 800, 3200, 600, 2800, 1200, 3600, 400 Hz)
Volume: Decreasing across steps (starts present, fades away)
Quality: Intentional glitch, not error (controlled chaos)
Color: Digital, harsh, intentional
No: Natural sounds, smooth transitions, organic
Reference: The Matrix digital effect, controlled but chaotic
```

---

## 6. TRANSITION (420ms) — Major State Change
**Category:** Navigation Transition  
**Frequency:** Rare (major transitions, exclusive)  
**File:** `transition.wav`

### Sonic Specification
```
Duration: 420ms total
Attack: 0ms (immediate, complex)

Waveform Analysis - 3-layer composition:

LAYER 1: Rise Glitch (0–100ms)
- Triangle wave scramble 240Hz → 960Hz (rapid pitch rise)
- Creates "digital breaking through" sensation

LAYER 2: Space Whoosh (100–280ms)
- Noise sweep filtered through bandpass (700Hz → 5200Hz)
- Broadband noise that sweeps upward in frequency
- Creates a "spacious" transition sound

LAYER 3: Clean Confirm (280–420ms)
- Clean sine wave 1280Hz → 1520Hz (rising confirmation tone)
- Smooth fade out at end
- Provides resolution after chaos

Combined Envelope:
- 0–100ms: Glitch scramble (aggressive, high energy)
- 100–280ms: Smooth whoosh sweep (continuous motion)
- 280–420ms: Clean resolution tone (conclusive, calm)

Style: Chaos → Clarity transition (glitch → whoosh → confirm)
Aesthetic: Cinematic, dramatic, professional
Feel: Breaking through interference to clear signal
```

### Generation Prompt
```
Create a 420ms cinematic transition sound with three phases:

PHASE 1 (0–100ms): Digital breakup/glitch
- Triangle wave rapidly rising from 240Hz to 960Hz
- Sounds like digital systems breaking through interference
- High energy, chaotic but controlled

PHASE 2 (100–280ms): Whoosh/sweep effect
- Broadband noise sweep rising from 700Hz to 5200Hz
- Creates a sense of motion and space opening
- Smooth, continuous motion
- Like a spacecraft engaging hyperspace drive

PHASE 3 (280–420ms): Clean confirmation tone
- Pure sine wave rising from 1280Hz to 1520Hz
- Smooth finish, almost musical
- Represents "clarity achieved" / "destination locked"

Overall: Glitch → Whoosh → Confirm
Tone: Epic but professional, sci-fi but believable
Quality: High-end cinematic, not video game
Reference: Inception BRAAAM but minimalist, Tron portal effect
```

---

## 7. BOOT (1300ms) — System Startup
**Category:** System Event  
**Frequency:** Infrequent (startup, modal open)  
**File:** `boot.wav`

### Sonic Specification
```
Duration: 1300ms (1.3 seconds) — longest sound
Attack: 0ms (immediate, complex layered)

Waveform Analysis - 4-layer composition:

LAYER 1: Sub Rumble (0–400ms)
- Sine wave sweeping 46Hz → 62Hz (very low frequency)
- Creates deep, felt vibration (like system powering up)
- Physical presence

LAYER 2: Pitch Lift (100–500ms, overlaps with Layer 1)
- Triangle wave rising 120Hz → 1480Hz (rapid pitch elevation)
- Represents digital systems initializing
- Creates a "whoosh up" sensation

LAYER 3: Digital Handshake (500–800ms)
- Three distinct tones: 780Hz, 1040Hz, 1320Hz
- Each tone 80ms with 10ms gaps
- Represents "system confirmation tones"
- Like digital communication protocol

LAYER 4: Confirm Tone (800–1300ms)
- Sine wave rising 1760Hz → 1960Hz
- Long, sustained, confident finish
- Smooth fade out at end
- Represents "system ready"

Combined Envelope:
- 0–100ms: Sub rumble begins (felt presence)
- 100–500ms: Pitch lift acceleration (systems waking up)
- 500–800ms: Handshake protocol (confirmation sequence)
- 800–1300ms: Sustained confirm tone with fade
- Overall: Crescendo → peak → resolution

Style: CRT/spacecraft power-on simulator
Aesthetic: Vintage but professional, NASA aesthetic
Feel: Epic system activation, technological power-up
```

### Generation Prompt
```
Create a 1300ms epic system boot sound.
Think: NASA control room powering up, old spacecraft startup, CRT monitor activation

SECTION 1 (0–400ms): Deep sub rumble
- Sine wave sweeping from 46Hz to 62Hz
- Very low frequency, felt more than heard
- Like massive systems coming online

SECTION 2 (100–500ms overlapping): Pitch ascension
- Triangle wave rapidly rising from 120Hz to 1480Hz
- Represents digital acceleration, waking up
- Creates forward energy and momentum

SECTION 3 (500–800ms): Digital handshake
- Three successive tones: 780Hz, 1040Hz, 1320Hz
- Each tone 80ms with 10ms separation
- Like automated system confirmation protocol
- Reassuring, technical, precise

SECTION 4 (800–1300ms): Sustained confirm
- Sine wave rising from 1760Hz to 1960Hz
- Long sustained tone (500ms hold)
- Smooth 200ms fade out
- Represents "systems online, ready for operation"

Overall character:
- Epic but believable (not Hollywood explosion)
- Professional NASA aesthetic
- Vintage sci-fi but modern quality
- Confidence and power without aggression

Reference: HAL 9000 wake-up, Tron legacy system startup, NASA launch sequence
No: Video game power-ups, dubstep drops, anything harsh
```

---

## 8. SUCCESS (340ms) — Operation Success
**Category:** Positive Feedback  
**Frequency:** Rare (after boot, success events)  
**File:** `success.wav`

### Sonic Specification
```
Duration: 340ms
Attack: 0ms (immediate)

Waveform Analysis - Dual-tone comms confirm:

TONE 1 (0–80ms):
- Sine wave at 880Hz
- Clean, sustained tone
- Professional radio aesthetic

TONE 2 (80–180ms):
- Sine wave at 1320Hz (3:2 frequency ratio = harmonic)
- Starts immediately after Tone 1
- Creates harmonic relationship

Envelope:
- 0–80ms: 880Hz (peak volume ~0.7)
- 80–180ms: 1320Hz overlapping (fade out of first)
- 180–340ms: Both tones fade smoothly to silence

Style: Professional radio/comms confirmation
Aesthetic: Clean, professional, reassuring
Feel: Mission control confirmation, "go for launch"
```

### Generation Prompt
```
Create a 340ms professional confirmation tone.
Think: NASA mission control "go for launch", clean radio confirmation

TWO-TONE CONFIRMATION:

Tone 1 (0–80ms): 880Hz sine wave
- Clean, pure, professional
- Like old NASA comms systems
- Sustained and clear

Tone 2 (80–180ms): 1320Hz sine wave
- Enters while first tone still present
- Creates harmonic double-tone effect
- Second tone slightly quieter than first
- Both fade together

Overall:
- Very clean, no noise, no distortion
- Professional radio aesthetic (think NASA, not sci-fi)
- Reassuring and conclusive
- Not a beep, but a genuine "mission control confirms" tone

Reference: NASA Capcom voice, Mission Control confirmation tones
No: Robotic beeps, video game success, anything cute or playful
```

---

## 9. PING (420ms) — Space Sonar / Celestial Focus
**Category:** Space-Specific  
**Frequency:** Occasional (space tracker interactions)  
**File:** `ping.wav`

### Sonic Specification
```
Duration: 420ms
Attack: 0ms (immediate)

Waveform Analysis - Deep Space Sonar:

CORE TONE (0–420ms):
- Primary sine: 1080Hz → 900Hz (descending, 420ms sweep)
- Creates a "sonar ping" sensation

OVERTONE (0–420ms, overlapping):
- Secondary sine: 2160Hz → 1800Hz (2x primary frequency ratio)
- Adds harmonic richness

ECHO LAYER (100–420ms delay):
- Tertiary sine: 980Hz → 820Hz (slightly delayed, lower amplitude)
- Creates a sense of echo in space

Envelope:
- 0–50ms: Sharp attack (onset of ping)
- 50–380ms: Sustained (descending pitch across full duration)
- 380–420ms: Fade to silence

Style: Deep-space sonar, celestial measurement
Aesthetic: Scientific, mysterious, cosmic
Feel: Detection and measurement in space
```

### Generation Prompt
```
Create a 420ms deep-space sonar ping sound.
Think: Spacecraft scanning for celestial bodies, space sonar, detection ping

CORE STRUCTURE: Three-part harmonic composition

Part 1 (0–420ms): Primary descending tone
- Sine wave from 1080Hz down to 900Hz
- Long, sustained descent (like sonar ping returning from distance)
- Creates the main "sonar" feeling

Part 2 (0–420ms): Harmonic overtone
- Sine wave from 2160Hz down to 1800Hz
- Exactly 2x the primary frequency (harmonic)
- Adds richness and depth
- Slightly lower amplitude than primary

Part 3 (100–420ms): Echo reflection
- Sine wave from 980Hz down to 820Hz
- Starts 100ms after ping begins (represents sound traveling and returning)
- Lowest amplitude of three
- Creates sense of space and distance

Overall:
- Not harsh or electronic (smooth sines)
- Scientific and measuring (not destructive)
- Cosmic and distant (lots of descending motion)
- Professional space exploration aesthetic

Reference: Sonar ping from submarines, sci-fi space scanning, cosmic detection
No: Beeps, harsh electronics, aggressive tones
```

---

## 10. AMBIENT (45000ms = 45s loop) — Background Atmosphere
**Category:** Ambient (looping)  
**Frequency:** Continuous (background throughout app)  
**File:** `ambient_layer1.wav`

### Sonic Specification
```
Duration: 45 seconds (loops infinitely)
Design: NOT a simple loop - evolving texture

Waveform Analysis:

FOUNDATION: Sub-bass hum (0–45s throughout)
- Sine wave: 40–60Hz range (very low)
- Barely audible but felt
- Creates physical presence of "system running"
- Slight tremolo (volume modulation) at 0.5Hz

MID-LAYER (rotating every 10s):
- Combination of sine waves at: 120Hz, 240Hz, 480Hz
- Slow panning (left to right) across 45s cycle
- Each frequency fades in/out in staggered pattern
- Creates sense of "evolving machinery"

HIGH-FREQUENCY SHIMMER (scattered throughout):
- Noise filtered to 1-3kHz range
- Very low amplitude
- Provides brightness and detail
- Creates "life" and movement

Envelope:
- Fade-in: First 3 seconds (from silence to full presence)
- Sustain: 39 seconds (evolving but consistent)
- Fade-out: Last 3 seconds (into next loop smoothly)

Style: Ambient sci-fi machinery hum
Aesthetic: Immersive, unobtrusive, evolving
Feel: Spacecraft computer systems running, technological ecosystem
NOT: Repetitive, boring, droning
```

### Generation Prompt
```
Create a 45-second evolving ambient loop for sci-fi application background.
Think: Spacecraft computer systems running, NASA control room background hum

KEY PRINCIPLES:
- NOT a simple repeating loop (prevent boredom)
- Evolving texture that subtly changes over 45s
- Low frequency provides felt presence
- Mid-range provides musical movement
- High frequency provides texture detail

LAYER 1 - Foundation (throughout): Deep sub-bass hum
- Sine wave between 40–60Hz
- Very low, barely consciously heard
- Slight tremolo/vibrato modulation at 0.5Hz
- Represents "power core" of system

LAYER 2 - Movement (evolving): Mid-range tone cluster
- Combination of 120Hz, 240Hz, 480Hz sine waves
- Each tone fades in and out in different patterns
- Creates sense of machinery components working
- Slight panning (stereo movement) across the 45s loop
- Not stationary - always subtly changing

LAYER 3 - Detail (woven throughout): High-frequency shimmer
- Noise filtered to 1–3kHz (NOT harsh, subtle)
- Very low amplitude
- Scattered throughout the loop
- Provides "aliveness" and organic complexity

DYNAMICS:
- Fade-in: 0–3s (gentle introduction)
- Evolving sustain: 3–42s (continuous transformation)
- Fade-out: 42–45s (smooth exit into next loop)

OVERALL EFFECT:
- Immersive sci-fi atmosphere
- Never boring or repetitive
- Feels like background of living technological system
- NASA/Jarvis aesthetic: professional, sophisticated
- Supports focus/concentration without distraction

Reference: 2001 Space Odyssey ambience, Portal 1 facility hum, Blade Runner background
No: Simple tone loop, boring drone, obvious repetition
Quality: Cinematic, professional, high-fidelity
```

---

# 🎧 ADDITIONAL SOUNDS

## 11. AMBIENTLAYER2 (60s loop)
Same concept as Layer 1, but with different frequency profile:
- Focus on 2–4kHz range (ethereal, mid-high presence)
- Slightly faster evolution (changes every 8s instead of 10s)
- Layer underneath main ambient for texture

## 12. AMBIENTLAYER3 (75s loop)
Slowest, most subtle layer:
- Focus on 5–8kHz (high shimmer, barely audible)
- Very slow evolution (changes every 15s)
- Adds final sparkle and complexity

## 13. QUIZCORRECT (varies, ~280ms)
Uplifting, satisfying tone:
- Like a game success sound but professional
- Ascending pattern (psychological reward)
- Two or three tones that resolve upward

## 14. QUIZWRONG (varies, ~180ms)
Soft negative tone (not punishing):
- Not harsh or annoying
- Descending or "flat" compared to correct
- Gentle feedback, not aggressive

---

# 🎯 GENERATION INSTRUCTIONS

## Platform Recommendations

### For **Suno** (Best for UI sounds):
- Use "Create from description" mode
- Provide exact specifications above
- Set duration precisely
- Quality: Music mode (not sound effects)

### For **ElevenLabs** (Good for variety):
- Use sound effects generation
- Describe tone, duration, context
- Useful for ambient layers (can blend multiple generations)

### For **Stable Audio**:
- Precise technical specs work well
- Good for reproducible, consistent sounds

### For **Claude Audio** (if available):
- Excellent for understanding nuanced descriptions
- Can generate variations easily

---

# 📋 GENERATION CHECKLIST

For each sound:
- [ ] Read full specification
- [ ] Understand sonic characteristics
- [ ] Review generation prompt
- [ ] Consider reference examples
- [ ] Generate 2–3 variations
- [ ] Compare against specification
- [ ] Select best match
- [ ] Export as WAV 44.1kHz mono/stereo
- [ ] Test in audioEngine

---

# 🎵 FINAL DELIVERABLES

**All files export to:**
```
/opt/openclaw/workspace/tech-pulse-css/public/audio/
```

**Format:**
- WAV, 44.1kHz sample rate
- Mono or stereo (as specified)
- Peak level: -3dB (not clipping)
- Duration: Exact as specified (will be normalized in engine)

**Quality:**
- Professional, not compressed
- Clean, no artifacts
- Matches specification precisely

---

**Status:** Ready for audio generation  
**Created:** 2026-04-13  
**Audio Vision:** NASA + Jarvis sci-fi aesthetic, professional and immersive
