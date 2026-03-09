# Quick Reference: Task Implementation Checklist

## Task 2: Space Tracker NEO 2026DG7 Camera Positioning ✓
**File**: `components/NEOTracker.tsx`
**Status**: Designed for implementation

**Key Changes**:
- [ ] Line 339: Replace `const idealDist = 8;` with dynamic calculation based on `asteroid.distanceLD`
- [ ] Extract asteroid from selectedMesh userData
- [ ] Formula: `const idealDist = Math.max(8, asteroid.distanceLD * 1.2);`

**Why**: Camera needs to zoom out proportionally for distant asteroids (2026DG7 at ~24 LD needs ~30 unit distance)

---

## Task 3: Picture of the Day Clickable with Image ✓
**File**: `components/SpaceProDrawer.tsx`
**Status**: Designed for implementation

**Key Changes**:
- [ ] Lines 459-480: Add image preview before title
- [ ] Check `data.apod?.media_type === "image"`
- [ ] Wrap APOD content in `<a href={data.apod.url} target="_blank">`
- [ ] Image: `<img src={data.apod.url} alt="...">` with max-height: 200px
- [ ] Add hover effects for visual feedback

**Code Template**:
```typescript
{data.apod?.media_type === "image" && data.apod?.url && (
  <a href={data.apod.url} target="_blank" rel="noopener noreferrer">
    <img src={data.apod.url} alt={data.apod.title} className="w-full rounded-lg..." />
  </a>
)}
<a href={data.apod?.url} target="_blank" rel="noopener noreferrer">
  <p>{data.apod?.title}</p>
  <p>{data.apod?.explanation}</p>
</a>
```

---

## Task 4: Reduce Rotation Speed + Translate Space Tracker ✓
**Files**: `components/NEOTracker.tsx`, `components/SpaceTrackerModal.tsx`
**Status**: Designed for implementation

### Part A: Reduce Rotation Speed
**File**: `components/NEOTracker.tsx`
- [ ] Line 316: `0.08` → `0.04` (earth rotation)
- [ ] Lines 320-321: Halve all asteroid rotation multipliers

### Part B: Add i18n Support to SpaceTrackerModal
**File**: `components/SpaceTrackerModal.tsx`
- [ ] Add `lang?: "en" | "hr"` to SpaceTrackerModalProps interface
- [ ] Create TABS_LABELS object with en/hr translations
- [ ] Update TABS array to use TABS_LABELS[lang || "en"]
- [ ] Update SpaceProDrawer to pass lang prop to SpaceTrackerModal

**Translations**:
```
English: ISS, NEO, DSN, Launch, JOVE
Croatian: ISS, NEO, DSN, Lansiranje, JOVE
```

---

## Task 5: Fix Zoom Functionality + Improve Click Detection ✓
**File**: `components/NEOTracker.tsx`
**Status**: Designed for implementation

### Part A: Adjust Zoom Speed
- [ ] Line 79: `controls.zoomSpeed = 2.0;` → `1.0;`

### Part B: Improve Click Detection
- [ ] Line 260: `threshold = 0.1;` → `0.15;`
- [ ] Add `let lastClickTime = 0;` near other state variables
- [ ] Add debounce check at start of onPointerDown:
  ```typescript
  const now = Date.now();
  if (now - lastClickTime < 100) return;
  lastClickTime = now;
  ```
- [ ] Keep rest of click detection unchanged

**Why**:
- Zoom: 1.0 is more responsive and controllable than 2.0
- Threshold: 0.15 improves small asteroid clickability
- Debounce: Prevents accidental double-selections

---

## Task 6: Add Category-Based Pin Colors to Globe ✓
**Files**: `lib/types.ts`, `lib/content.ts`, `components/GlobeWrapper.tsx`, `components/HeroSection.tsx`
**Status**: Designed for implementation

### Part A: Enhance Color Palette
**File**: `lib/types.ts` (lines 33-41)
- [ ] Replace duplicate cyan colors with distinct palette:
  - ai: #00F0FF (bright cyan)
  - gaming: #FF00FF (magenta)
  - space: #00D4FF (space blue)
  - technology: #00FFA0 (green cyan)
  - medicine: #FF6B6B (coral)
  - society: #FFD700 (gold)
  - robotics: #00FFFF (cyan)

### Part B: Add Category Field to Pins
**File**: `lib/content.ts`
- [ ] Return type: Add `category?: string;`
- [ ] Line 191: Add `category: article.category,`

### Part C: Update Type Definitions
**File**: `components/GlobeWrapper.tsx`
- [ ] GlobePin interface: Add `category?: string;`

**File**: `components/HeroSection.tsx`
- [ ] articlePins state type: Add `category?: string;`

### Part D: Show Category in Globe Labels
**File**: `components/GlobeWrapper.tsx` (htmlElement function)
- [ ] Update label creation to include category
- [ ] Show as: `[CATEGORY]` suffix on label
- [ ] Enhance dot with box-shadow using pin color

**Code Template**:
```typescript
htmlElement={(d: any) => {
  const el = document.createElement("div");
  el.style.cssText = `position: relative; cursor: pointer;`;

  const dot = document.createElement("div");
  dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background-color: ${d.color}; box-shadow: 0 0 8px ${d.color};`;

  const label = document.createElement("div");
  const categoryText = d.category ? ` [${d.category.toUpperCase()}]` : "";
  label.textContent = `${d.label}${categoryText}`;
  label.style.cssText = `font-size: 10px; color: white; white-space: nowrap; background: rgba(0,0,0,0.7); padding: 2px 4px; border-radius: 2px; margin-top: 2px;`;

  el.appendChild(dot);
  el.appendChild(label);
  return el;
}}
```

---

## Implementation Order

**Recommended Sequence** (lowest-risk first):

1. **Task 2** - Camera positioning (NEOTracker.tsx line 339)
2. **Task 5a** - Zoom speed (NEOTracker.tsx line 79)
3. **Task 5b** - Click detection (NEOTracker.tsx lines 260-298)
4. **Task 4a** - Rotation speed (NEOTracker.tsx lines 316-321)
5. **Task 3** - APOD display (SpaceProDrawer.tsx lines 459-480)
6. **Task 4b** - i18n labels (SpaceTrackerModal.tsx)
7. **Task 6** - Globe colors (multiple files)

---

## Files Summary

| File | Tasks | Lines |
|------|-------|-------|
| `components/NEOTracker.tsx` | 2, 4a, 5 | 79, 260, 316-321, 330-343 |
| `components/SpaceProDrawer.tsx` | 3 | 459-480 |
| `components/SpaceTrackerModal.tsx` | 4b | Props, 70-76 |
| `lib/types.ts` | 6 | 33-41 |
| `lib/content.ts` | 6 | 170-194 |
| `components/GlobeWrapper.tsx` | 6 | 14-21, 143-165 |
| `components/HeroSection.tsx` | 6 | 28-29 |

---

## Validation Checklist

After implementation, verify:

- [ ] Task 2: Click 2026DG7 (or any far asteroid), verify camera distance is appropriate and you can see the asteroid clearly
- [ ] Task 3: APOD card displays image thumbnail, clicking opens NASA page in new tab
- [ ] Task 4: Earth rotates noticeably slower, asteroids wobble less, switch language to HR and verify labels change
- [ ] Task 5: Mouse wheel zoom feels smoother, asteroids are clickable at any size
- [ ] Task 6: Globe pins show distinct colors, hovering over pins shows category name in tooltip

---

## Notes

- All changes are **backwards compatible** - no breaking changes
- **No new dependencies** required
- **No database schema changes** needed
- All tasks are **optional UI/UX improvements**
- Tasks can be implemented **independently** or **in any order**

---

## Estimated Implementation Time

| Task | Time |
|------|------|
| Task 2 | 5 min |
| Task 3 | 10 min |
| Task 4 | 20 min |
| Task 5 | 10 min |
| Task 6 | 20 min |
| **Total** | **65 min** |

---

## Reference Interfaces

### APODData (already defined in space-pro-data.ts)
```typescript
export interface APODData {
  title: string;
  explanation: string;
  date: string;
  url: string;
  media_type: string;  // "image" or "video"
}
```

### NEOAsteroid (from space-tracker-data.ts)
```typescript
interface NEOAsteroid {
  id: string;
  name: string;
  distanceLD: number;  // Used for Task 2
  distanceKm: number;
  diameterM: number;
  speedKmH: number;
  hazardous: boolean;
  closestApproach: string;
  approachAngle: number;
}
```

### GlobePin (to be updated)
```typescript
interface GlobePin {
  lat: number;
  lng: number;
  label: string;
  color: string;
  id: string;
  size?: number;
  category?: string;  // NEW in Task 6
}
```

---

## Common Issues & Solutions

**Issue**: Task 2 camera still doesn't show asteroid properly
- **Solution**: Increase multiplier from 1.2 to 1.5 (more breathing room)

**Issue**: Task 3 image doesn't load
- **Solution**: Verify APOD data has `media_type === "image"`, not "video"

**Issue**: Task 4 translations don't change in UI
- **Solution**: Verify SpaceProDrawer passes `lang` prop to SpaceTrackerModal

**Issue**: Task 5 asteroids still hard to click
- **Solution**: Further increase threshold from 0.15 to 0.2

**Issue**: Task 6 colors too bright/clashing
- **Solution**: Adjust hex values in CATEGORY_COLORS palette

---

## Debug Tips

1. **Task 2**: Open browser console, click asteroid, check `selectedMesh.userData.asteroid.distanceLD`
2. **Task 3**: Check `data.apod?.url` is not null/undefined
3. **Task 4**: Look at rotation values with `console.log(earth.rotation.y)`
4. **Task 5**: Use browser DevTools to inspect raycaster intersection results
5. **Task 6**: Inspect globe pin element in DevTools to verify color and category text

