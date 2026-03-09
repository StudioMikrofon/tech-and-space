# Task Design Document: Remaining Implementation Tasks

## Task 2: Space Tracker NEO 2026DG7 Camera Positioning

**File**: `/opt/openclaw/workspace/tech-pulse-css/components/NEOTracker.tsx`
**Current Issue**: When clicking asteroid 2026DG7, camera doesn't move far enough/properly
**Problem Line**: Line 339 (`const idealDist = 8;`)

### Root Cause
The current implementation (lines 330-343) uses a fixed `idealDist = 8` and a simplified camera positioning that relies on perpendicular + upward offset. For distant asteroids like 2026DG7 with large distanceLD values, this creates insufficient viewing distance.

### Minimal Implementation Strategy
1. **Dynamic Distance Calculation** (line 339):
   - Replace `const idealDist = 8;` with:
     ```typescript
     const asteroid = selectedMesh?.userData?.asteroid as NEOAsteroid;
     const scaledDist = asteroid?.distanceLD || 1;
     const idealDist = Math.max(8, scaledDist * 1.2); // Scale with asteroid distance
     ```

2. **Improved Camera Path** (line 340-341):
   - Current: `const idealPos = flyTarget.clone().add(viewDir.multiplyScalar(idealDist));`
   - This is correct but needs to scale the entire viewDir offset
   - No change needed if dynamic distance is applied

3. **Faster Interpolation for Immediate Feedback** (optional):
   - Increase lerp speed from 0.08 to 0.12 for quicker response to distant asteroids
   - Keep target lerp at 0.12 (already good)

### Code Change
```typescript
// Line 330-343 modification
if (flyTarget && selectedMesh) {
  controls.target.lerp(flyTarget, 0.12);
  const asteroidDir = flyTarget.clone().normalize();
  const perpDir = new THREE.Vector3(-asteroidDir.z, 0, asteroidDir.x).normalize();
  const upDir = new THREE.Vector3(0, 1, 0);
  const viewDir = perpDir.multiplyScalar(0.8).add(upDir.multiplyScalar(0.5)).normalize();

  // Dynamic distance based on asteroid's LD distance
  const asteroid = selectedMesh.userData.asteroid as NEOAsteroid;
  const idealDist = Math.max(8, asteroid.distanceLD * 1.2);

  const idealPos = flyTarget.clone().add(viewDir.multiplyScalar(idealDist));
  camera.position.lerp(idealPos, 0.12);
  if (controls.target.distanceTo(flyTarget) < 0.2) flyTarget = null;
}
```

---

## Task 3: Picture of the Day (APOD) Clickable with Image Display

**File**: `/opt/openclaw/workspace/tech-pulse-css/components/SpaceProDrawer.tsx`
**Current Section**: Lines 459-480 (APOD card)
**APODData Interface**: `title`, `explanation`, `date`, `url`, `media_type`

### Root Cause
Current implementation only shows title and explanation text. No image display and no clickable link to view full resolution.

### Minimal Implementation Strategy
1. **Add Image Preview** (before title, lines 471-475):
   - Check `media_type` - only display if "image" (not video)
   - Use `url` as image source
   - Responsive sizing with border and rounded corners
   - Height: auto, max-height: 200px on card

2. **Make Title/Explanation Clickable** (lines 473-478):
   - Wrap APOD content in a button/link
   - `onClick` or `href` opens `url` in new tab
   - Add visual indicator (cursor pointer, hover effect)
   - Use `data.apod?.url` as target

3. **Visual Feedback**:
   - Add subtle hover effect (opacity/border change)
   - Show icon indicating it's clickable (e.g., external link icon)

### Code Change
```typescript
{/* 6. Astronomska Slika Dana */}
<div className="glass-card p-4 space-y-3 !hover:transform-none">
  <div className="flex items-center gap-2">
    <Camera className="w-4 h-4 text-pink-400" />
    <h3 className="text-sm font-semibold text-text-primary">
      Astronomska Slika Dana
    </h3>
    <InfoToggle id="apod" expandedInfo={expandedInfo} setExpandedInfo={setExpandedInfo} />
    <div className="ml-auto">
      <StatusBadge label="Dnevno" color="#A78BFA" />
    </div>
  </div>
  <InfoPanel id="apod" expandedInfo={expandedInfo} />

  {/* NEW: Image display + clickable link */}
  {data.apod?.media_type === "image" && data.apod?.url && (
    <a
      href={data.apod.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group cursor-pointer hover:opacity-80 transition-opacity"
    >
      <img
        src={data.apod.url}
        alt={data.apod.title}
        className="w-full rounded-lg max-h-[200px] object-cover border border-white/10 group-hover:border-pink-400/30 transition-colors"
      />
    </a>
  )}

  <a
    href={data.apod?.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block group text-xs hover:opacity-80 transition-opacity cursor-pointer"
  >
    <p className="font-semibold text-text-primary mb-1 group-hover:text-pink-400">
      {data.apod?.title ?? "—"}
    </p>
    <p className="text-text-secondary line-clamp-3">
      {data.apod?.explanation ?? "—"}
    </p>
  </a>
</div>
```

---

## Task 4: Reduce Rotation Speed + Translate Space Tracker Labels

**File Parts**:
- NEOTracker.tsx (lines 316-321): Earth and asteroid rotation
- SpaceTrackerModal.tsx (lines 70-76): TABS labels

### Root Cause
1. Earth rotation at line 316 is `delta * 0.08` - can be reduced
2. Asteroid rotation at lines 320-321 has no clear user control
3. SpaceTrackerModal TABS array has hardcoded English labels - need i18n support

### Minimal Implementation Strategy

#### Part 1: Reduce Rotation Speed (NEOTracker.tsx)
- Line 316: `earth.rotation.y += delta * 0.08;` → `delta * 0.04;` (50% reduction)
- Lines 320-321: Asteroid rotations `delta * (0.12 + ...)` → `delta * (0.06 + ...)` (50% reduction)

#### Part 2: Add Language Support to SpaceTrackerModal
- Add `lang` prop to SpaceTrackerModal component
- Create TABS_LABELS object with en/hr translations
- Use TABS_LABELS instead of hardcoded labels in TABS array

### Code Changes

**NEOTracker.tsx (lines 315-322)**:
```typescript
// Rotate earth slowly (reduced speed)
earth.rotation.y += delta * 0.04;  // Changed from 0.08

// Wobble asteroids (reduced speed)
asteroidMeshes.forEach((m, i) => {
  m.rotation.x -= delta * (0.06 + i * 0.02);  // Changed from 0.12
  m.rotation.z += delta * (0.04 + i * 0.01);  // Changed from 0.08
});
```

**SpaceTrackerModal.tsx (lines 70-76 and props)**:
```typescript
// Add interface support
interface SpaceTrackerModalProps {
  mode: "iss" | "dsn" | "asteroids" | "overview";
  open: boolean;
  onClose: () => void;
  lang?: "en" | "hr";  // NEW
}

// NEW: Translation labels
const TABS_LABELS = {
  en: {
    iss: "ISS",
    asteroids: "NEO",
    dsn: "DSN",
    launches: "Launch",
    radiojove: "JOVE",
  },
  hr: {
    iss: "ISS",
    asteroids: "NEO",
    dsn: "DSN",
    launches: "Lansiranje",
    radiojove: "JOVE",
  },
};

// Modified TABS array (lines 70-76)
const TABS: { key: SidebarTab; label: string; icon: typeof Satellite }[] = [
  { key: "iss", label: TABS_LABELS[lang || "en"].iss, icon: Satellite },
  { key: "asteroids", label: TABS_LABELS[lang || "en"].asteroids, icon: Zap },
  { key: "dsn", label: TABS_LABELS[lang || "en"].dsn, icon: Radio },
  { key: "launches", label: TABS_LABELS[lang || "en"].launches, icon: Rocket },
  { key: "radiojove", label: TABS_LABELS[lang || "en"].radiojove, icon: Waves },
];
```

---

## Task 5: Fix Zoom Functionality + Improve Click Detection

**File**: `/opt/openclaw/workspace/tech-pulse-css/components/NEOTracker.tsx`
**Zoom Config**: Lines 74-79 (`zoomSpeed: 2.0`)
**Click Detection**: Lines 265-298 (raycaster)

### Root Cause
1. `zoomSpeed: 2.0` is very aggressive - too fast
2. Raycaster threshold at line 260 is `0.1` - may miss small asteroids
3. No debouncing on rapid clicks

### Minimal Implementation Strategy

#### Part 1: Adjust Zoom Speed (lines 74-79)
- Reduce `zoomSpeed` from 2.0 to 1.0 for more controlled scrolling
- This is the OrbitControls parameter

#### Part 2: Improve Click Detection (lines 265-298)
- Increase raycaster threshold from 0.1 to 0.15 for better clickability
- Add intersection distance check to prefer closer asteroids
- Keep existing behavior but improve reliability

#### Part 3: Debounce Rapid Clicks (optional enhancement)
- Add timestamp tracking to prevent multiple selections within 100ms
- Prevents accidental double-clicks

### Code Changes

**NEOTracker.tsx (lines 74-79)**:
```typescript
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 5;
controls.maxDistance = 60;
controls.zoomSpeed = 1.0;  // Changed from 2.0
```

**NEOTracker.tsx (lines 258-298)**:
```typescript
const raycaster = new THREE.Raycaster();
raycaster.params.Points!.threshold = 0.15;  // Changed from 0.1
const mouseVec = new THREE.Vector2();
let flyTarget: THREE.Vector3 | null = null;
let selectedMesh: THREE.Mesh | null = null;
let lastClickTime = 0;  // NEW: Debounce tracking

function onPointerDown(e: PointerEvent) {
  // NEW: Debounce rapid clicks
  const now = Date.now();
  if (now - lastClickTime < 100) return;
  lastClickTime = now;

  const rect = renderer.domElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

  mouseVec.x = (x / rect.width) * 2 - 1;
  mouseVec.y = -(y / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouseVec, camera);
  const intersects = raycaster.intersectObjects(asteroidMeshes);

  trajectoryLines.forEach((l) => {
    (l.material as THREE.LineDashedMaterial).opacity = 0;
  });

  if (intersects.length > 0) {
    // Prefer closest intersection
    const obj = intersects[0].object as THREE.Mesh;
    const asteroid = obj.userData.asteroid as NEOAsteroid;
    handleSelect(asteroid);
    flyTarget = obj.position.clone();
    selectedMesh = obj;

    const tl = trajectoryLines.find(l => l.userData.asteroidId === asteroid.id);
    if (tl) (tl.material as THREE.LineDashedMaterial).opacity = 0.5;
  } else {
    handleSelect(null);
    flyTarget = null;
    selectedMesh = null;
  }
}
```

---

## Task 6: Add Category-Based Pin Colors to Globe

**File Parts**:
- `/opt/openclaw/workspace/tech-pulse-css/lib/types.ts`: CATEGORY_COLORS (already defined)
- `/opt/openclaw/workspace/tech-pulse-css/lib/content.ts`: getGlobePins() function (lines 170-194)
- `/opt/openclaw/workspace/tech-pulse-css/components/HeroSection.tsx`: Pin display

### Root Cause
Current implementation already uses CATEGORY_COLORS in getGlobePins (line 183). The issue is:
1. The colors might not be visually distinct enough for all categories
2. No category name display in globe (only pin color differentiates)
3. Pins could benefit from tooltips/labels showing category

### Minimal Implementation Strategy

#### Part 1: Verify/Enhance Color Palette (lib/types.ts)
- Current: All colors alternate between `#00cfff` and `#00b8e6` (very similar cyans)
- Recommendation: Add more distinct colors per category

#### Part 2: Update getGlobePins to Include Category Label (lib/content.ts)
- Extend returned object to include `category` field
- This allows GlobeWrapper to access and potentially use category info

#### Part 3: Update GlobeWrapper to Show Category in Tooltip/HTML (GlobeWrapper.tsx)
- Already uses `htmlElementsData` to show labels (lines 139-165)
- Current labels show article title (line 188)
- Could extend to show category alongside title

#### Part 4: Visual Enhancement in Pin Rendering
- GlobeWrapper already maps pins to `pointsData` (line 132)
- Colors are already applied via `pointColor` (line 135)
- Can increase `pointRadius` proportionally to category importance

### Code Changes

**lib/types.ts (lines 33-41)** - Enhanced Colors:
```typescript
export const CATEGORY_COLORS: Record<Category, string> = {
  ai: "#00F0FF",        // Bright cyan
  gaming: "#FF00FF",    // Bright magenta
  space: "#00D4FF",     // Space blue
  technology: "#00FFA0", // Green cyan
  medicine: "#FF6B6B",  // Red/coral
  society: "#FFD700",   // Gold
  robotics: "#00FFFF",  // Cyan
};
```

**lib/content.ts (lines 170-194)** - Add Category Field:
```typescript
export function getGlobePins(): Array<{
  lat: number;
  lng: number;
  label: string;
  color: string;
  id: string;
  size?: number;
  category?: string;  // NEW
}> {
  const geoArticles = getGeoArticles();
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return geoArticles.map((article) => {
    const isRecent = new Date(article.date) > twoDaysAgo;
    const color = CATEGORY_COLORS[article.category] || "#00cfff";

    return {
      lat: article.geo.lat,
      lng: article.geo.lon,
      label: article.title.substring(0, 30),
      color,
      id: article.id,
      size: isRecent ? 6 : 10,
      category: article.category,  // NEW
    };
  });
}
```

**components/GlobeWrapper.tsx (lines 143-165)** - Enhanced HTML Labels:
```typescript
interface GlobePin {
  lat: number;
  lng: number;
  label: string;
  color: string;
  id: string;
  size?: number;
  category?: string;  // NEW
}

// ... In the htmlElement function (around line 143):
htmlElement={(d: any) => {
  const el = document.createElement("div");
  el.style.cssText = `
    position: relative;
    cursor: pointer;
  `;

  // Dot with category indicator
  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${d.color};
    box-shadow: 0 0 8px ${d.color};
  `;

  // Label with category
  const label = document.createElement("div");
  const categoryText = d.category ? ` [${d.category.toUpperCase()}]` : "";
  label.textContent = `${d.label}${categoryText}`;
  label.style.cssText = `
    font-size: 10px;
    color: white;
    white-space: nowrap;
    background: rgba(0,0,0,0.7);
    padding: 2px 4px;
    border-radius: 2px;
    margin-top: 2px;
  `;

  el.appendChild(dot);
  el.appendChild(label);
  return el;
}},
```

**components/HeroSection.tsx** - Update Pin Type:
```typescript
const [articlePins, setArticlePins] = useState<{
  lat: number;
  lng: number;
  label: string;
  color: string;
  id: string;
  size?: number;
  category?: string;  // NEW
}[]>([]);
```

---

## Implementation Priority

1. **Task 2** (Camera positioning): High impact, relatively simple
2. **Task 3** (APOD display): High impact, simple HTML/styling
3. **Task 5** (Zoom/click): Medium impact, improves UX
4. **Task 4** (Rotation/translation): Low impact, cosmetic/i18n
5. **Task 6** (Globe colors): Low impact, enhancement

## Testing Checklist

- [ ] Task 2: Click 2026DG7, verify camera distance is appropriate
- [ ] Task 3: APOD card shows image, clicking opens URL in new tab
- [ ] Task 4: Earth/asteroids rotate slower, labels translate in HR
- [ ] Task 5: Zoom responds smoothly, asteroids are clickable at any size
- [ ] Task 6: Globe pins show distinct colors, category names visible in labels
