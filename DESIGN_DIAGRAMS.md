# Visual Design Diagrams for Task Implementation

## Task 2: Camera Distance Calculation

### Current Problem
```
Asteroid at 24 LD distance
Camera position calculation:
  - viewDir (perpendicular + up)
  - idealDist = 8 (FIXED)
  ❌ Result: Camera at viewDir * 8 = TOO CLOSE for distant asteroid

Visual:
  [Camera at 8 units away]
        ↓
    [Asteroid at 24 LD]  ← Asteroid appears too small/far to see well
```

### Fixed Solution
```
Asteroid at 24 LD distance
Camera position calculation:
  - viewDir (perpendicular + up)
  - idealDist = Math.max(8, 24 * 1.2) = 28.8
  ✓ Result: Camera at viewDir * 28.8 = PERFECT VIEWING ANGLE

Visual:
                           [Camera at 28.8 units away]
                                    ↓
                               [Asteroid at 24 LD]  ← Clear, good viewing distance
```

### Formula Breakdown
```
idealDist = Math.max(8, asteroid.distanceLD * 1.2)
             ↑        ↑                        ↑
             │        │                        └─ 1.2x multiplier for "breathing room"
             │        └─ Ensure minimum 8 units (prevents too-close zooming)
             └─ Use whichever is larger

Examples:
  LD = 1:   idealDist = Math.max(8, 1.2)   = 8      ✓ near asteroids stay at min
  LD = 8:   idealDist = Math.max(8, 9.6)   = 9.6    ✓ medium asteroids
  LD = 24:  idealDist = Math.max(8, 28.8)  = 28.8   ✓ far asteroids (2026DG7)
  LD = 50:  idealDist = Math.max(8, 60)    = 60     ✓ very far asteroids
```

---

## Task 3: APOD Image + Clickable Implementation

### Current State
```
┌─────────────────────────────────┐
│ 📷 Astronomska Slika Dana  [i]  │
├─────────────────────────────────┤
│ "Hubble Ultra Deep Field"       │
│ "The image shows thousands of   │
│ galaxies over billions of light │
│ years away..."                  │
└─────────────────────────────────┘
         ❌ No image, not clickable
```

### Fixed State
```
┌────────────────────────────────────────────────┐
│ 📷 Astronomska Slika Dana          [i] [Dnevno]│
├────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │  [Image loaded from NASA APOD]           │  │  ← Clickable
│  │  [Hover: border turns pink]              │  │     Opens in new tab
│  └──────────────────────────────────────────┘  │
│                                                 │
│ "Hubble Ultra Deep Field"  ← Clickable text   │
│ "The image shows thousands of                 │
│ galaxies over billions of light              │
│ years away..." (max 3 lines)                 │
│                                                 │
│  [External link behavior on click]             │
└────────────────────────────────────────────────┘
         ✓ Image visible, fully clickable
```

### Data Flow
```
SpaceProData (polling)
    ↓
data.apod = {
  title: "Hubble Ultra Deep Field",
  explanation: "The image shows...",
  url: "https://apod.nasa.gov/apod/image/...",
  media_type: "image"
}
    ↓
Conditional Rendering:
  if media_type === "image"
    ↓
  <img src={url} />  + <a href={url} target="_blank" />
    ↓
User clicks
    ↓
Opens NASA full resolution in new tab ✓
```

---

## Task 4a: Rotation Speed Reduction

### Speed Comparison
```
EARTH ROTATION:
Before: 0.08 rad/frame
After:  0.04 rad/frame
        ↓ 50% slower

Timeline:
Before: Complete rotation in ~80 frames (1.3 seconds @ 60fps)
After:  Complete rotation in ~160 frames (2.6 seconds @ 60fps)
        ↑ Much less distracting

ASTEROID WOBBLE:
Before: 0.12 rad/frame (base)
After:  0.06 rad/frame (base)
        ↓ 50% slower wobble
```

### Visual Effect
```
Before (too fast):           After (reduced):
┌───────────────┐           ┌───────────────┐
│ Earth ⭐⭐⭐  │  Spinning  │ Earth ⭐⭐⭐  │  Gently rotating
│ Asteroids *** │  rapidly   │ Asteroids *** │  smoothly
└───────────────┘           └───────────────┘
❌ Distracting               ✓ Calming, readable
```

---

## Task 4b: SpaceTrackerModal i18n

### Component Hierarchy
```
SpaceProDrawer
  │
  ├─ state: lang = "en" or "hr" (from parent)
  │
  └─ SpaceTrackerModal (renders TABS)
     │
     ├─ TABS_LABELS
     │  ├─ en: {iss: "ISS", asteroids: "NEO", dsn: "DSN", launches: "Launch", radiojove: "JOVE"}
     │  └─ hr: {iss: "ISS", asteroids: "NEO", dsn: "DSN", launches: "Lansiranje", radiojove: "JOVE"}
     │
     └─ TABS array (dynamic labels)
        ├─ tab.label = TABS_LABELS[lang || "en"][tab.key]
        └─ Renders with correct language
```

### Label Map
```
Key          English          Croatian
───────────────────────────────────────
iss          "ISS"            "ISS"
asteroids    "NEO"            "NEO"
dsn          "DSN"            "DSN"
launches     "Launch"         "Lansiranje"
radiojove    "JOVE"           "JOVE"
             (mostly same)    (Launch = Lansiranje)
```

---

## Task 5: Zoom & Click Detection

### Zoom Speed Graph
```
Mouse Wheel Input (units)    Camera Distance Change
        2                    4 units (zoomSpeed=2.0) ❌ Too aggressive
        ↑
        │                    2 units (zoomSpeed=1.0) ✓ Just right
        1
        │                    1 unit  (zoomSpeed=0.5)
        0
        ├─────────────────────────────────────────
        Very responsive      Responsive              Slow

Current: 2.0 (too jumpy)
Fixed:   1.0 (smooth, controllable)
```

### Click Detection Threshold
```
RAYCASTER THRESHOLD: Determines "click target area"

Before: threshold = 0.1
  ┌─────────────────┐
  │   Small asteroid│   ← Hard to click (tiny target area)
  │      ●          │
  └─────────────────┘
  Click radius: 0.1 units
  Result: ❌ Often miss small asteroids

After: threshold = 0.15
  ┌──────────────────────┐
  │    Small asteroid    │  ← Easier to click (bigger target area)
  │         ●            │
  └──────────────────────┘
  Click radius: 0.15 units
  Result: ✓ More reliable click detection
```

### Debounce Logic
```
User clicks asteroid
  ↓
Check: now - lastClickTime < 100ms?
  ├─ YES: Ignore (debounce) → Return early
  └─ NO:  Process click
       ↓
   Update lastClickTime = now
       ↓
   Raycaster intersection check
       ↓
   Select asteroid ✓

This prevents accidental double-selections when user clicks rapidly
```

---

## Task 6: Globe Pin Colors & Categories

### Before: Color Duplication Problem
```
Article 1 (AI)         Article 2 (Gaming)      Article 3 (Space)
│                      │                       │
└─ #00cfff (cyan)      └─ #00b8e6 (dark cyan) └─ #00cfff (cyan)
           │                     │                      │
           Too similar colors! Can't distinguish categories

   AI              Gaming              Space
    ●              ●                   ●
   (cyan)         (dark cyan)         (cyan)

   ❌ Visually indistinguishable
```

### After: Distinct Color Palette
```
Article 1 (AI)         Article 2 (Gaming)      Article 3 (Space)
│                      │                       │
└─ #00F0FF (bright cyan) └─ #FF00FF (magenta)  └─ #00D4FF (space blue)

   AI              Gaming              Space
    ●              ●                   ●
   (cyan)        (magenta)            (blue)

   ✓ Clearly distinguishable, each has unique color
```

### Full Palette
```
┌─────────────────────────────────────────────────────┐
│ Category Colors (Color Hex - English - Croatian)    │
├─────────────────────────────────────────────────────┤
│ AI         #00F0FF ■ Bright Cyan                    │
│ Gaming     #FF00FF ■ Bright Magenta                │
│ Space      #00D4FF ■ Space Blue                    │
│ Technology #00FFA0 ■ Green Cyan                    │
│ Medicine   #FF6B6B ■ Coral Red                     │
│ Society    #FFD700 ■ Gold                          │
│ Robotics   #00FFFF ■ Pure Cyan                     │
└─────────────────────────────────────────────────────┘
```

### Globe Pin HTML Label
```
Before:
  ●
  Article title...

After:
  ● (with glow)
  Article title... [CATEGORY]

Example:
  ● (magenta with glow)
  SpaceX Starship Launch... [GAMING]
```

### Data Flow
```
getGlobePins()
  ↓
article object
  ├─ geo.lat, geo.lon
  ├─ title
  ├─ category ← NEW
  └─ date
  ↓
Return object
  ├─ lat, lng
  ├─ label (title)
  ├─ color (from CATEGORY_COLORS[category]) ← NEW
  ├─ category ← NEW
  └─ id
  ↓
GlobeWrapper renders:
  ├─ Point (colored dot)
  ├─ Label + Category [CATEGORY]
  └─ Tooltip on hover
```

---

## Task Dependency Graph

```
Task 2: Camera
    ↓
    (independent)

Task 3: APOD
    ↓
    (independent)

Task 4a: Rotation Speed
    ↓
    (independent)

Task 4b: i18n Labels
    ↓
    Requires: lang prop to be passed through component tree
    (independent from 4a)

Task 5: Zoom/Click
    ├─ Part A (zoom): independent
    └─ Part B (click): independent from Part A

Task 6: Globe Colors
    ├─ Part A (colors): independent
    ├─ Part B (add category field): independent
    ├─ Part C (type updates): depends on Part B
    └─ Part D (render category): depends on Parts B & C
```

**Key**: All tasks can be implemented independently, in any order!

---

## File Modification Map

```
components/
├── NEOTracker.tsx
│   ├─ Line 79:      zoomSpeed (Task 5)
│   ├─ Line 260:     raycaster threshold (Task 5)
│   ├─ Line 262:     add lastClickTime (Task 5)
│   ├─ Line 266:     debounce check (Task 5)
│   ├─ Line 316:     rotation speed (Task 4a)
│   ├─ Lines 320-321: rotation speed (Task 4a)
│   └─ Lines 330-343: camera distance (Task 2)
│
├── SpaceProDrawer.tsx
│   └─ Lines 459-480: APOD image + clickable (Task 3)
│
├── SpaceTrackerModal.tsx
│   ├─ Props interface: add lang (Task 4b)
│   ├─ Top of component: TABS_LABELS object (Task 4b)
│   └─ Lines 70-76: TABS with dynamic labels (Task 4b)
│
├── HeroSection.tsx
│   └─ Line 28-29: articlePins state type (Task 6)
│
└── GlobeWrapper.tsx
    ├─ Lines 14-21: GlobePin interface (Task 6)
    └─ Lines 143-165: htmlElement function (Task 6)

lib/
├── types.ts
│   └─ Lines 33-41: CATEGORY_COLORS (Task 6)
│
└── content.ts
    └─ Lines 170-194: getGlobePins() function (Task 6)
```

---

## Testing Scenarios

### Task 2 Testing
```
Scenario 1: Click nearby asteroid (LD < 5)
  Expected: Camera zooms in to 8 units (stays at minimum)

Scenario 2: Click medium asteroid (LD = 8-15)
  Expected: Camera positions at 10-18 units

Scenario 3: Click far asteroid (LD = 20+, like 2026DG7)
  Expected: Camera positions at 24-30+ units (clearly visible)
```

### Task 3 Testing
```
Scenario 1: No APOD data available
  Expected: No image shown, title shows "—"

Scenario 2: APOD is video (media_type = "video")
  Expected: No image, only text shown

Scenario 3: APOD is image (media_type = "image")
  Expected: Image thumbnail shown, clickable, opens NASA page
```

### Task 4 Testing
```
Scenario 1: Compare rotation speeds
  Expected: Earth rotates noticeably slower (50% reduction)

Scenario 2: Switch language to HR
  Expected: "Launch" tab becomes "Lansiranje"
```

### Task 5 Testing
```
Scenario 1: Scroll wheel on canvas
  Expected: Zoom responds smoothly, not jumpy

Scenario 2: Click small asteroid
  Expected: Selection registers even with small size

Scenario 3: Rapid clicks
  Expected: Only first click registers (debounce prevents double-selection)
```

### Task 6 Testing
```
Scenario 1: Look at globe pins
  Expected: Different colors for different categories (distinct from each other)

Scenario 2: Hover over pin
  Expected: Tooltip shows title + [CATEGORY]

Scenario 3: Check colors match categories
  Expected: All AI articles same color, all Gaming articles same color, etc.
```

