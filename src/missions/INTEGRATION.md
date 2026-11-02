# Mission UI: integration guide

A quest-log side panel for every level (move, gravity-1..4, collision, chase, capstone):
task cards, an animated tick when a task is done, a 3D progress cube, a spinning reward coin.
No new dependencies. Pure React + CSS 3D.

## Files (all new, under `src/missions/`)
| file | what it is |
|---|---|
| `missionData.ts` | mission and task text for all 8 simulation ids, plus `MissionTracker` (detects task completion from game state) |
| `MissionPanel.tsx` | the side panel component |
| `missions.css` | styles, all prefixed `ms-` (plus `.mission-layout`) |

## Wiring (3 edits)

### 1. `GameCanvas.tsx`
```ts
import { MissionTracker } from '../../missions/missionData';

// props: add
onMissionProgress?: (doneIds: string[]) => void;

// refs
const trackerRef = useRef(new MissionTracker());
const progressCbRef = useRef(onMissionProgress);
progressCbRef.current = onMissionProgress;

// inside respawn():
trackerRef.current.reset(lessonIdRef.current);
progressCbRef.current?.([]);

// in the game loop, in the alive branch after the win check:
const changed = trackerRef.current.update(dt, state, world, isWon);
if (changed) progressCbRef.current?.(changed);
```
Remove the old canvas "pills" checklist and `seenRef` if present (the panel replaces them).

### 2. `App.tsx`
```tsx
import { MissionPanel } from './missions/MissionPanel';
import { getMission } from './missions/missionData';

const [missionDone, setMissionDone] = useState<string[]>([]);

// collision and chase have no engine win, so finish them when all tasks are done
const handleMissionProgress = useCallback((ids: string[]) => {
  setMissionDone(ids);
  const m = getMission(activeSimId);
  if (m && ids.length === m.tasks.length && ['collision', 'chase'].includes(activeSimId)) handleLessonSuccess();
}, [activeSimId, completedLessonIds, currentXp, currentLesson]);

<div className="mission-layout">
  <MissionPanel lessonId={activeSimId} doneIds={missionDone}
    rewardXp={...} hasNext={hasNext} nextLabel={nextLabel} onNext={goToNextStep} />
  <div className="grid"> ...editor + <GameCanvas onMissionProgress={handleMissionProgress} .../> </div>
</div>
```
`missions.css` is imported by `MissionPanel.tsx`, so nothing else to import.

### 3. Homepage demo (optional) `src/home/LiveLab.tsx`
Same pattern: wrap in `.mission-layout`, render `<MissionPanel lessonId={lesson.id} doneIds=... />`,
pass `onMissionProgress`. In `home.css` give `.bb-lab .mission-layout` a fixed height.

## Adding or editing a mission
Edit `MISSIONS` in `missionData.ts`: `id` must equal the id you pass to `<GameCanvas lessonId>`.
Each task has `id`, `title`, `detail`, `hint`. Task completion is decided in `MissionTracker.update`
(`switch (this.id)`), keep task ids in sync there.

## Theming
Uses `--panel --border --teal --amber --text --text-muted` from `index.css` with fallbacks.
`prefers-reduced-motion` disables all animation (ticks still show).
Below 1100px wide the panel stacks above the editor.

## Not verified in a browser build
Written without being able to run `npm install`/`vite`. Type-checked standalone, the tracker was simulated in Node,
and the CSS was rendered in a static preview. Run `npm run build` once after merging.
