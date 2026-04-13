# 🎧 AUDIO SYSTEM MIGRATION GUIDE

## Overview

The audio system has been upgraded from **direct Web Audio API calls** to a **centralized audio engine** with configuration management.

### Key Changes
- ✅ All sounds defined in `/lib/audioConfig.ts`
- ✅ All playback managed by `/lib/audioEngine.ts`
- ✅ No more direct `Audio()` or `AudioContext` in components
- ✅ Simple API: `playSound("click")`

---

## OLD WAY (Don't do this anymore)

```tsx
// ❌ OLD: Direct Web Audio in component
const playSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  // ... complex setup ...
  oscillator.start();
};

// ❌ OLD: HTML Audio element
<audio src="/sounds/click.mp3" autoPlay />

// ❌ OLD: playSound() from lib/sounds.ts (removed)
import { playSound } from "@/lib/sounds";
playSound("click");
```

---

## NEW WAY (Do this now)

### 1. Simple Sound Play

```tsx
import { playSound } from "@/lib/audioEngine";

// Just call it!
<button onClick={() => playSound("click")}>
  Click Me
</button>
```

### 2. In Event Handlers

```tsx
const handleHover = () => {
  playSound("hover");
};

const handleTabChange = (tab: string) => {
  playSound("tab");
  setActiveTab(tab);
};
```

### 3. In Effects

```tsx
useEffect(() => {
  // Play boot sound when component mounts
  playSound("boot");
}, []);
```

### 4. With Conditional Logic

```tsx
const handleQuizAnswer = (isCorrect: boolean) => {
  if (isCorrect) {
    playSound("quizCorrect");
  } else {
    playSound("quizWrong");
  }
};
```

---

## REFACTORING CHECKLIST

### Phase 1: Remove Old Audio System
- [ ] Delete `/lib/sounds.ts` (old procedural sound definitions)
- [ ] Delete any component-level audio files
- [ ] Remove direct `AudioContext` usage from components

### Phase 2: Wrap App with AudioProvider

**File:** `/opt/openclaw/workspace/tech-pulse-css/app/layout.tsx`

```tsx
import { AudioProvider } from "@/components/AudioProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body>
        <AudioProvider>
          {/* Your app content */}
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
```

### Phase 3: Refactor Components

For each component that uses sound:

**BEFORE:**
```tsx
import { playSound } from "@/lib/sounds";

export function MyButton() {
  const handleClick = () => {
    playSound("click");
    // ... do stuff
  };

  return <button onClick={handleClick}>Click</button>;
}
```

**AFTER:**
```tsx
import { playSound } from "@/lib/audioEngine";

export function MyButton() {
  const handleClick = async () => {
    await playSound("click");
    // ... do stuff
  };

  return <button onClick={handleClick}>Click</button>;
}
```

### Phase 4: Add Audio Controls to UI

Add to settings or header:

```tsx
import { AudioControls } from "@/components/AudioControls";

export function Settings() {
  return (
    <div>
      <h2>Audio Settings</h2>
      <AudioControls variant="full" showCategories={true} />
    </div>
  );
}
```

---

## COMPONENT-BY-COMPONENT MIGRATION

### Header.tsx

**What to change:**
- `onMouseEnter` on nav links → `playSound("hover")`
- `onClick` on buttons → `playSound("click")`

**Example:**
```tsx
<li
  onMouseEnter={() => playSound("hover")}
  onClick={() => playSound("click")}
>
  <Link href="/category">Tech</Link>
</li>
```

---

### ArticleCard.tsx

**What to change:**
- Card hover effects → `playSound("hover")`
- Card click → `playSound("click")`

**Example:**
```tsx
<article
  onMouseEnter={() => playSound("hover")}
  onClick={() => playSound("click")}
>
  {/* Card content */}
</article>
```

---

### SpaceTrackerModal.tsx

**What to change:**
- Mode toggle (CIN/SCI) → `playSound("select")`
- Timescale buttons → `playSound("select")`
- Tab switches → `playSound("tab")`
- Focus celestial body → `playSound("ping")`
- Modal open → `playSound("boot")`

**Example:**
```tsx
const handleModeToggle = () => {
  playSound("select");
  setMode(mode === "CIN" ? "SCI" : "CIN");
};

const handleTimescale = (scale: number) => {
  playSound("select");
  setTimeScale(scale);
};
```

---

### ArticleQuizButton.tsx

**What to change:**
- Quiz answer (correct) → `playSound("quizCorrect")`
- Quiz answer (wrong) → `playSound("quizWrong")`

**Example:**
```tsx
const handleAnswer = async (answer: string) => {
  const isCorrect = answer === correctAnswer;
  
  if (isCorrect) {
    await playSound("quizCorrect");
  } else {
    await playSound("quizWrong");
  }
  
  // Update UI
  setShowResult(true);
};
```

---

### PageTransition.tsx

**What to change:**
- Page transitions → `playSound("glitch")`
- Route changes → `playSound("glitch")`

**Example:**
```tsx
useEffect(() => {
  playSound("glitch");
}, [pathname]);
```

---

### TerminalBoot.tsx

**What to change:**
- Boot sequence start → `playSound("boot")`
- Boot sequence complete → `playSound("success")`

**Example:**
```tsx
useEffect(() => {
  const startBoot = async () => {
    await playSound("boot");
    
    // Simulate boot sequence (1.3s)
    await sleep(1300);
    
    await playSound("success");
    setBootComplete(true);
  };

  startBoot();
}, []);
```

---

### LikeButton.tsx

**What to change:**
- Like click → `playSound("click")`

**Example:**
```tsx
const handleLike = () => {
  playSound("click");
  toggleLike();
};
```

---

## SOUND ID REFERENCE

**Complete list of available sounds:**

| Sound | Duration | Usage |
|-------|----------|-------|
| `click` | 110ms | Button clicks (most frequent) |
| `hover` | 90ms | Link/card hover (use sparingly!) |
| `select` | 110ms | Mode/option selection |
| `tab` | 55ms | Sidebar tab switches |
| `glitch` | 144ms | Page transitions |
| `transition` | 420ms | Major state changes |
| `whoosh` | 250ms | Modal open/close |
| `boot` | 1300ms | Startup sequence |
| `success` | 340ms | Operation success |
| `alert` | 200ms | Error/warning |
| `ping` | 420ms | Celestial body focus |
| `dataStream` | 120ms | Data/telemetry updates |
| `ambient` | 45s loop | Background atmosphere |
| `ambientLayer2` | 60s loop | Layer 2 of ambient |
| `ambientLayer3` | 75s loop | Layer 3 of ambient |
| `quizCorrect` | varies | Quiz correct answer |
| `quizWrong` | varies | Quiz wrong answer |

---

## IMPORTANT RULES

### ✅ DO
- Use `await playSound()` to wait for initialization
- Check audio context is ready before playing
- Use appropriate sounds for actions
- Respect mobile volume settings
- Call from event handlers

### ❌ DON'T
- Create new audio files without updating config
- Play sounds without checking mobile optimization
- Use direct `AudioContext` in components
- Import from old `/lib/sounds.ts`
- Play hover sounds too frequently (causes spam)

---

## TESTING SOUNDS

### In development:
```tsx
import { audioEngine, playSound } from "@/lib/audioEngine";

// Play any sound
await playSound("click");

// Check status
console.log(audioEngine.getStatus());

// Toggle mute
audioEngine.toggleSounds();

// Set master volume
audioEngine.setMasterVolume(0.5);
```

### Enable debug logging:
Edit `/lib/audioConfig.ts`:
```ts
export const AUDIO_SETTINGS = {
  debug: true,  // Set to true
  // ...
};
```

---

## FILE STRUCTURE

```
/opt/openclaw/workspace/tech-pulse-css/
├── lib/
│   ├── audioConfig.ts       ← Sound definitions
│   ├── audioEngine.ts       ← Playback engine
│   └── sounds.ts            ← ❌ DELETE (old system)
├── components/
│   ├── AudioProvider.tsx    ← Wrap app with this
│   ├── AudioControls.tsx    ← User controls
│   └── [other components]   ← Update these to use new system
└── public/audio/
    ├── click.wav
    ├── hover.wav
    ├── ambient_layer1.wav
    └── [all other audio files]
```

---

## AUDIO FILES LOCATION

All audio files should be in:
```
/opt/openclaw/workspace/tech-pulse-css/public/audio/
```

Structure:
```
public/audio/
├── click.wav
├── hover.wav
├── select.wav
├── tab.wav
├── glitch.wav
├── transition.wav
├── whoosh.wav
├── boot.wav
├── success.wav
├── alert.wav
├── ping.wav
├── dataStream.wav
├── quizCorrect.wav
├── quizWrong.wav
├── ambient_layer1.wav
├── ambient_layer2.wav
└── ambient_layer3.wav
```

---

## ROLLOUT PLAN

1. **Week 1**: Add AudioProvider to layout, create audio files
2. **Week 2**: Refactor Header, ArticleCard, high-frequency components
3. **Week 3**: Refactor space-related components
4. **Week 4**: Refactor specialized components (Quiz, Terminal)
5. **Week 5**: Testing, optimization, mobile tuning

---

## TROUBLESHOOTING

**Sounds not playing:**
- Check AudioProvider is wrapping app
- Check audio files exist in `/public/audio/`
- Check browser console for errors
- Try toggling mute: `audioEngine.toggleSounds()`

**Sounds are too loud:**
- Adjust volume in AudioControls
- Check `AUDIO_SETTINGS.masterVolume` in config
- Check category volumes in config

**Mobile sounds are loud:**
- Ensure mobile optimization is enabled
- Check `mobileVolume` setting in sound config

**Hover spam:**
- Implement click debounce in components
- Reduce hover sound frequency

---

## SUPPORT

For issues or questions:
1. Check this guide first
2. Review audioEngine debug logs
3. Check `/lib/audioConfig.ts` for sound definitions
4. Verify audio files exist in `/public/audio/`

---

**Status:** Ready for implementation
**Last Updated:** 2026-04-13
