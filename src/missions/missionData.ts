/* ─────────────────────────────────────────────────────────────────────────
   BitBuild missions
   - Definitions for every simulation id used by <GameCanvas lessonId=...>
   - MissionTracker: watches the live game state and reports which tasks are done
   Everything is plain TypeScript with no UI, so it can be unit tested and reused.
   ───────────────────────────────────────────────────────────────────────── */
import type { PlayerState, WorldConfig } from '../types/lesson';

export interface MissionTask {
  id: string;
  title: string;
  /** one short instruction, shown on the active task */
  detail: string;
  /** the nudge (or answer) revealed when the learner presses "Need a hint?" */
  hint: string;
}

export interface MissionDef {
  /** simulation id, same as GameCanvas lessonId */
  id: string;
  /** short badge, for example "01" or "02·3" */
  code: string;
  world: string;
  title: string;
  story: string;
  tasks: MissionTask[];
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'move',
    code: '01',
    world: 'MOVEMENT',
    title: 'Collect and Escape',
    story: 'Three stars are hiding in the arena. Grab them in order, then reach the EXIT.',
    tasks: [
      { id: 'right', title: 'Grab star 1', detail: 'Move RIGHT. This line is already written for you.', hint: 'if (keys.right) state.x += speed * dt;' },
      { id: 'down', title: 'Grab star 2', detail: 'Write the code that moves you DOWN.', hint: 'On screen y grows downward:\nif (keys.down) state.y += speed * dt;' },
      { id: 'left', title: 'Grab star 3', detail: 'Write the code that moves you LEFT.', hint: 'Left is the opposite of right:\nif (keys.left) state.x -= speed * dt;' },
      { id: 'exit', title: 'Reach the EXIT', detail: 'Write the code that moves you UP.', hint: 'Up is the opposite of down:\nif (keys.up) state.y -= speed * dt;' }
    ]
  },
  {
    id: 'gravity-1',
    code: '02·1',
    world: 'GRAVITY',
    title: 'Free Fall',
    story: 'There is no gravity in this world yet. Build it and drop onto the landing pad.',
    tasks: [
      { id: 'speed', title: 'Pull yourself faster', detail: 'Gravity changes your velocity. Add gravity * dt to state.vy.', hint: 'state.vy += gravity * dt;' },
      { id: 'fall', title: 'Start falling', detail: 'Velocity moves you. Add state.vy * dt to state.y.', hint: 'state.y += state.vy * dt;' },
      { id: 'land', title: 'Land on the pad', detail: 'Fall all the way down onto LAND HERE.', hint: 'Both lines above must run every frame, and both must use dt.' }
    ]
  },
  {
    id: 'gravity-2',
    code: '02·2',
    world: 'GRAVITY',
    title: 'Build the Floor',
    story: 'Right now the player falls out of the world. Build a floor and stand on it.',
    tasks: [
      { id: 'fall', title: 'Feel the pull', detail: 'Gravity is done for you. Press Run and watch the player fall.', hint: 'Press the Run button at the bottom of the editor.' },
      { id: 'land', title: 'Land on the floor', detail: 'Make a floorY and snap the player to it, then stop the fall.', hint: 'const floorY = world.groundY - state.height;\nif (state.y >= floorY) { state.y = floorY; state.vy = 0; }' },
      { id: 'stay', title: 'Stand still for a moment', detail: 'Set state.onGround = true when landed, otherwise false.', hint: 'Inside the if: state.onGround = true;\nOtherwise: state.onGround = false;' }
    ]
  },
  {
    id: 'gravity-3',
    code: '02·3',
    world: 'GRAVITY',
    title: 'The Jump',
    story: 'A star floats above you. Write a jump that is strong enough to reach it.',
    tasks: [
      { id: 'jump', title: 'Leave the ground', detail: 'When keys.up is pressed on the ground, launch upward. Up is negative y.', hint: 'if (keys.up && state.onGround) {\n  state.vy = -jumpPower;\n  state.onGround = false;\n}' },
      { id: 'star', title: 'Grab the star', detail: 'Tune jumpPower until you can reach it. Bigger jumps higher.', hint: '300 is too weak. Try 400.' }
    ]
  },
  {
    id: 'gravity-4',
    code: '02·4',
    world: 'GRAVITY',
    title: 'Run and Jump',
    story: 'Two high stars and an exit. Combine running and jumping to get them all.',
    tasks: [
      { id: 'run', title: 'Start running', detail: 'Set state.vx from the left and right keys, then move with it.', hint: 'if (keys.left) state.vx = -moveSpeed;\nelse if (keys.right) state.vx = moveSpeed;\nelse state.vx = 0;\nstate.x += state.vx * dt;' },
      { id: 'star1', title: 'Grab star 1', detail: 'Jump while running so the arc carries you to it.', hint: 'Start the jump a little before you are under the star.' },
      { id: 'star2', title: 'Grab star 2', detail: 'The second star is higher. Time the top of your jump.', hint: 'Jump from flat ground, hold right the whole time.' },
      { id: 'exit', title: 'Reach the EXIT', detail: 'Run to the right edge of the arena.', hint: 'You need both stars before the exit opens.' }
    ]
  },
  {
    id: 'collision',
    code: '03',
    world: 'COLLISION',
    title: 'Solid Ground',
    story: 'The floating block is solid. Test every side of it, then reshape it with code.',
    tasks: [
      { id: 'jump', title: 'Take off', detail: 'Press Up, W or Space to jump.', hint: 'Click the canvas first if keys do nothing.' },
      { id: 'bonk', title: 'Bonk the underside', detail: 'Jump up under the block and hit your head on it.', hint: 'Stand directly below the block, then jump.' },
      { id: 'wall', title: 'Hit the wall', detail: 'Run into the side of the block while in the air.', hint: 'Jump up to block height first, then hold left or right.' },
      { id: 'top', title: 'Land on top', detail: 'Stand on top of the block.', hint: 'Jump from beside it and steer over the top edge.' },
      { id: 'reshape', title: 'Reshape the block', detail: 'Change a number in world.platform and press Run.', hint: 'world.platform = { x: 250, y: 170, w: 200, h: 20 };' }
    ]
  },
  {
    id: 'chase',
    code: '04',
    world: 'CHASE AI',
    title: 'Outrun the Orb',
    story: 'A red orb hunts you with vector steering. Survive, then make it harder.',
    tasks: [
      { id: 'run', title: 'Get moving', detail: 'Move around with the arrow keys or WASD.', hint: 'Click the canvas first if keys do nothing.' },
      { id: 'survive', title: 'Survive 10 seconds', detail: 'Stay alive while the orb chases you.', hint: 'The orb is slower than you. Keep moving, never corner yourself.' },
      { id: 'tune', title: 'Tune the AI', detail: 'Make the orb fast: raise enemySpeed to 130 or more and press Run.', hint: 'const enemySpeed = 140;' },
      { id: 'survive-fast', title: 'Survive the fast orb', detail: 'Stay alive for 10 seconds against your faster orb.', hint: 'Run in wide circles. Use the whole arena.' }
    ]
  },
  {
    id: 'capstone',
    code: '05',
    world: 'BOSS',
    title: 'Arena Escape',
    story: 'Everything you learned, in one level. Collect the gems, dodge the hunter, escape.',
    tasks: [
      { id: 'gem1', title: 'Collect gem 1', detail: 'Grab the first energy gem.', hint: 'The gems sit on the floating platform and above the floor.' },
      { id: 'gem2', title: 'Collect gem 2', detail: 'Grab the second energy gem.', hint: 'Jump from the floor onto the platform.' },
      { id: 'gem3', title: 'Collect gem 3', detail: 'Grab the third energy gem.', hint: 'Keep moving. The hunter never stops.' },
      { id: 'escape', title: 'Escape through the portal', detail: 'Reach the green portal with all gems.', hint: 'The portal opens when all 3 gems are collected.' }
    ]
  }
];

export function getMission(id: string): MissionDef | null {
  return MISSIONS.find((m) => m.id === id) ?? null;
}

/* ── Tracker ─────────────────────────────────────────────────────────── */

const DEFAULT_PLATFORM = { x: 250, y: 170, w: 120, h: 20 };

export class MissionTracker {
  private id = '';
  private done: string[] = [];
  private x0: number | null = null;
  private f = { vyPos: false, vyNeg: false, dropped: false, grounded: false, bonk: false, wall: false, top: false, reshape: false, tuned: false };
  private alive = 0;
  private fastAlive = 0;
  private enemySpeed = 0;
  private lastEnemy: { x: number; y: number } | null = null;

  reset(id: string) {
    this.id = id;
    this.done = [];
    this.x0 = null;
    this.f = { vyPos: false, vyNeg: false, dropped: false, grounded: false, bonk: false, wall: false, top: false, reshape: false, tuned: false };
    this.alive = 0;
    this.fastAlive = 0;
    this.enemySpeed = 0;
    this.lastEnemy = null;
  }

  getDone(): string[] {
    return this.done;
  }

  /**
   * Call once per frame while the player is alive.
   * Returns the new list of completed task ids if it changed, otherwise null.
   */
  update(dt: number, s: PlayerState, w: WorldConfig, won: boolean): string[] | null {
    const mission = getMission(this.id);
    if (!mission) return null;
    const f = this.f;
    const h = s.height || 22;
    const wd = s.width || 22;
    if (this.x0 === null) this.x0 = s.x;
    const moved = Math.abs((s.x ?? 0) - (this.x0 ?? 0)) > 24 || Math.abs(s.vx || 0) > 1;
    const groundY = typeof w.groundY === 'number' && w.groundY > 0 ? w.groundY : 240;
    const floorTop = groundY - h;
    const onFloor = s.onGround === true && Math.abs(s.y - floorTop) < 1.5;

    if (typeof s.vy === 'number') {
      if (s.vy > 1) f.vyPos = true;
      if (s.vy < -1) f.vyNeg = true;
    }
    if (s.y > 36) f.dropped = true;
    if (onFloor) f.grounded = true;

    const p = w.platform;
    if (p) {
      const xOverlap = s.x + wd > p.x && s.x < p.x + p.w;
      const yOverlap = s.y + h > p.y + 1 && s.y < p.y + p.h - 1;
      if (xOverlap && !s.onGround && Math.abs(s.y - (p.y + p.h)) < 1.5) f.bonk = true;
      if (yOverlap && (Math.abs(s.x + wd - p.x) < 1.5 || Math.abs(s.x - (p.x + p.w)) < 1.5)) f.wall = true;
      if (xOverlap && s.onGround && Math.abs(s.y - (p.y - h)) < 1.5) f.top = true;
      if (
        Math.abs(p.x - DEFAULT_PLATFORM.x) > 0.5 ||
        Math.abs(p.y - DEFAULT_PLATFORM.y) > 0.5 ||
        Math.abs(p.w - DEFAULT_PLATFORM.w) > 0.5 ||
        Math.abs(p.h - DEFAULT_PLATFORM.h) > 0.5
      ) {
        f.reshape = true;
      }
    }

    // chase: time alive, and the measured speed of the enemy orb
    this.alive += dt;
    if (typeof s.enemyX === 'number' && typeof s.enemyY === 'number' && s.enemyX > 0) {
      if (this.lastEnemy && dt > 0) {
        const d = Math.hypot(s.enemyX - this.lastEnemy.x, s.enemyY - this.lastEnemy.y);
        if (d < 60) this.enemySpeed = this.enemySpeed * 0.9 + (d / dt) * 0.1;
      }
      this.lastEnemy = { x: s.enemyX, y: s.enemyY };
    }
    if (this.enemySpeed >= 130) {
      f.tuned = true;
      this.fastAlive += dt;
    }

    const c = s.coins || [];
    const ids: string[] = [];
    const add = (cond: boolean, id: string) => {
      if (cond) ids.push(id);
    };
    switch (this.id) {
      case 'move':
        add(!!c[0]?.collected, 'right');
        add(!!c[1]?.collected, 'down');
        add(!!c[2]?.collected, 'left');
        add(won, 'exit');
        break;
      case 'gravity-1':
        add(f.vyPos, 'speed');
        add(f.dropped, 'fall');
        add(won, 'land');
        break;
      case 'gravity-2':
        add(f.vyPos, 'fall');
        add(f.grounded, 'land');
        add(won, 'stay');
        break;
      case 'gravity-3':
        add(f.vyNeg, 'jump');
        add(won, 'star');
        break;
      case 'gravity-4':
        add(moved, 'run');
        add(!!c[0]?.collected, 'star1');
        add(!!c[1]?.collected, 'star2');
        add(won, 'exit');
        break;
      case 'collision':
        add(f.vyNeg, 'jump');
        add(f.bonk, 'bonk');
        add(f.wall, 'wall');
        add(f.top, 'top');
        add(f.reshape, 'reshape');
        break;
      case 'chase':
        add(moved, 'run');
        add(this.alive >= 10, 'survive');
        add(f.tuned, 'tune');
        add(this.fastAlive >= 10, 'survive-fast');
        break;
      case 'capstone':
        add(!!c[0]?.collected, 'gem1');
        add(!!c[1]?.collected, 'gem2');
        add(!!c[2]?.collected, 'gem3');
        add(won, 'escape');
        break;
      default:
        return null;
    }

    // keep tasks done once they are done (until reset)
    const merged = Array.from(new Set([...this.done, ...ids]));
    const ordered = mission.tasks.map((t) => t.id).filter((tid) => merged.includes(tid));
    if (ordered.length === this.done.length && ordered.every((v, i) => v === this.done[i])) return null;
    this.done = ordered;
    return ordered;
  }
}
