import type { Lesson, Chapter } from '../types/lesson';

export const chapters: Chapter[] = [
  {
    id: 'ch1',
    title: 'Chapter 1: Movement & Vectors',
    description: 'Master basic user input processing, deltaTime frame scaling, and coordinate clipping.',
    lessons: ['move'],
    capstoneId: 'capstone'
  },
  {
    id: 'ch2',
    title: 'Chapter 2: Physics Engine Fundamentals',
    description: 'Implement realistic gravity acceleration, jump impulses, and ground collision state step-by-step.',
    lessons: ['gravity'],
    capstoneId: 'capstone'
  },
  {
    id: 'ch3',
    title: 'Chapter 3: Spatial Collision Detection',
    description: 'Learn 2D AABB bounding box collision algorithms and collision response.',
    lessons: ['collision'],
    capstoneId: 'capstone'
  },
  {
    id: 'ch4',
    title: 'Chapter 4: Autonomous Steering & AI',
    description: 'Vector math, normalization, and enemy chase algorithms.',
    lessons: ['chase', 'capstone'],
    capstoneId: 'capstone'
  }
];

export const lessons: Lesson[] = [
  {
    id: 'move',
    num: '01',
    label: 'Movement',
    chapter: 'ch1',
    xp: 50,
    note: {
      title: 'Mission 1: Move, collect, escape',
      body: [
        'Your goal: collect all 3 stars, then reach the EXIT. The checklist along the bottom of the canvas ticks off as you go. Each task is one line of code that you write in the editor.',
        'The engine calls your update(state, keys, dt, world) function every frame. <code class="inline">keys</code> tells you which arrow keys are held, <code class="inline">state</code> is your player, and <code class="inline">dt</code> is the time since the last frame in seconds. Multiply speed by dt so the game runs the same on every screen.',
        'Task 1 is written for you: read it, then press Run and move right to grab star 1. Tasks 2, 3 and 4 are yours. Use the mentor tips if you get stuck.',
        'Remember: on a game screen, (0,0) is the top-left corner and y grows DOWNWARD. That matters for Task 2 and Task 4.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Welcome to BitBuild! I'm Pixel. Let's start with basic sprite controls.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Your mission: collect the 3 stars, then reach the EXIT. Each task is one line of code, and Task 1 is already done for you.', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Task 2 hint: on screen, y grows DOWNWARD. So moving down means adding to state.y.' },
      { speaker: 'mentorA', text: 'Task 3 hint: left is the opposite of right. Subtract from state.x instead of adding to it.' },
      { speaker: 'mentorB', text: 'Task 4 hint: up is the opposite of down. Subtract from state.y, and check keys.up.' },
      { speaker: 'mentorA', text: "Always multiply by dt. If something misbehaves, press 'Explain My Bug' at the top and I'll help you read the error." }
    ],
    code: {
      javascript: `// Goal: Collect 3 stars, reach EXIT
const speed = 150;

// Task 1: Move right (done)
if (keys.right) state.x += speed * dt;

// Task 2: Move down (+y)


// Task 3: Move left (-x)


// Task 4: Move up (-y)


// Clamp to canvas (done)
state.x = Math.max(0, Math.min(world.width - state.width, state.x));
state.y = Math.max(0, Math.min(world.height - state.height, state.y));`,
      python: `# Goal: Collect 3 stars, reach EXIT
speed = 150.0

# Task 1: Move right (done)
if keys.right:
    state['x'] += speed * dt

# Task 2: Move down (+y)


# Task 3: Move left (-x)


# Task 4: Move up (-y)


# Clamp to canvas (done)
state['x'] = max(0, min(world['width'] - state['width'], state['x']))
state['y'] = max(0, min(world['height'] - state['height'], state['y']))`,
      cpp: `// Goal: Collect 3 stars, reach EXIT
float speed = 150.0f;

// Task 1: Move right (done)
if (keys.right) state.x += speed * dt;

// Task 2: Move down (+y)


// Task 3: Move left (-x)


// Task 4: Move up (-y)


// Clamp to canvas (done)
state.x = std::clamp(state.x, 0.0f, world.width - state.width);
state.y = std::clamp(state.y, 0.0f, world.height - state.height);`
    }
  },
  {
    id: 'gravity',
    num: '02',
    label: 'Gravity & Jump',
    chapter: 'ch2',
    xp: 75,
    note: {
      title: 'Physics Engine Fundamentals',
      body: [
        'Real motion is built from velocity and acceleration. Instead of one daunting physics script, you will complete four short missions: free fall, the floor, the jump, and running. Each one has tasks for you to write.',
        'Win a mission to earn its XP, then use the Next button in the mentor box to move on.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Welcome to Level 2! We've broken down physics into bite-sized pieces so you can build it step by step.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: "Work through each piece at your own pace. Press 'Next Piece →' whenever you're ready!", trigger: 'onEnter' }
    ],
    code: {
      javascript: `// Piece 1: Free Fall (Downward Acceleration)
const gravity = 800; // pixels per second squared

state.vy += gravity * dt;
state.y += state.vy * dt;

// Stop at canvas bottom
if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0;
}`,
      python: `# Piece 1: Free Fall (Downward Acceleration)
gravity = 800.0

state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

if state['y'] > world['height'] - state['height']:
    state['y'] = world['height'] - state['height']
    state['vy'] = 0.0`,
      cpp: `// Piece 1: Free Fall (Downward Acceleration)
float gravity = 800.0f;

state.vy += gravity * dt;
state.y += state.vy * dt;

if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0.0f;
}`
    },
    pieces: [
      {
        id: 'gravity-1',
        num: 'Piece 1',
        label: 'Free Fall',
        note: {
          title: 'Mission 2.1: Free Fall',
          body: [
            'Your goal: make the player fall and land on the LAND HERE pad at the bottom. The checklist at the top of the canvas ticks off as your code works.',
            'Gravity is an acceleration, so it changes velocity, and velocity changes position. Every frame: <code class="inline">state.vy += gravity * dt</code>, then <code class="inline">state.y += state.vy * dt</code>.',
            'On a game screen y grows DOWNWARD, so a positive vy means falling. The code that stops the player at the bottom is done for you.'
          ]
        },
        mentorLines: [
          { speaker: 'mentorA', text: 'Piece 1: Free Fall! Your mission: make the player fall onto the LAND HERE pad.', trigger: 'onEnter' },
          { speaker: 'mentorB', text: "Gravity doesn't move you directly. It changes your velocity. Which variable holds vertical velocity?", trigger: 'onEnter' },
          { speaker: 'mentorA', text: 'Task 1: add gravity * dt to state.vy. Task 2: add state.vy * dt to state.y. Always multiply by dt!' },
          { speaker: 'mentorB', text: "Nothing happens? Check the status bar under the canvas for errors, or press 'Explain My Bug' at the top." }
        ],
        code: {
          javascript: `// Goal: Accelerate downward onto pad
const gravity = 800;

// Task 1: state.vy += gravity * dt


// Task 2: state.y += state.vy * dt


// Stop at floor (done)
if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0;
}`,
          python: `# Goal: Accelerate downward onto pad
gravity = 800.0

# Task 1: state['vy'] += gravity * dt


# Task 2: state['y'] += state['vy'] * dt


# Stop at floor (done)
if state['y'] > world['height'] - state['height']:
    state['y'] = world['height'] - state['height']
    state['vy'] = 0.0`,
          cpp: `// Goal: Accelerate downward onto pad
float gravity = 800.0f;

// Task 1: state.vy += gravity * dt


// Task 2: state.y += state.vy * dt


// Stop at floor (done)
if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0.0f;
}`
        }
      },
      {
        id: 'gravity-2',
        num: 'Piece 2',
        label: 'The Floor',
        note: {
          title: 'Mission 2.2: Build the Floor',
          body: [
            'Your goal: land on the floor and stay there for half a second. Right now there is no floor in your code, so the player falls straight out of the world!',
            'A player\'s position is its TOP edge. So the spot where it should stop is the floor line minus the player\'s height: <code class="inline">world.groundY - state.height</code>.',
            'When you land: put the player on that spot, stop its fall (vy = 0), and set <code class="inline">state.onGround = true</code>. Piece 3 will use onGround to decide when you may jump.'
          ]
        },
        mentorLines: [
          { speaker: 'mentorA', text: 'Piece 2: The Floor! Right now the player falls straight through the ground. Your mission: build the floor.', trigger: 'onEnter' },
          { speaker: 'mentorB', text: "On screen, the player's position is its top edge. So the floor line minus the player's height tells us where it should stop." },
          { speaker: 'mentorA', text: "That's floorY = world.groundY - state.height. When state.y reaches floorY, snap y to floorY and set vy to 0." },
          { speaker: 'mentorB', text: 'Last task: set state.onGround = true when you land, and false when you are in the air.' }
        ],
        code: {
          javascript: `// Goal: Land on floor (world.groundY - state.height)
const gravity = 800;
state.vy += gravity * dt;
state.y += state.vy * dt;

// Task 1: const floorY = world.groundY - state.height;


// Task 2: if (state.y >= floorY) { state.y = floorY; state.vy = 0; }


// Task 3: Set state.onGround (true on floor, false in air)
`,
          python: `# Goal: Land on floor (world['groundY'] - state['height'])
gravity = 800.0
state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

# Task 1: floor_y = world['groundY'] - state['height']


# Task 2: if state['y'] >= floor_y: state['y'] = floor_y; state['vy'] = 0.0


# Task 3: Set state['onGround'] (True on floor, False in air)
`,
          cpp: `// Goal: Land on floor (world.groundY - state.height)
float gravity = 800.0f;
state.vy += gravity * dt;
state.y += state.vy * dt;

// Task 1: float floorY = world.groundY - state.height;


// Task 2: if (state.y >= floorY) { state.y = floorY; state.vy = 0.0f; }


// Task 3: Set state.onGround (true on floor, false in air)
`
        }
      },
      {
        id: 'gravity-3',
        num: 'Piece 3',
        label: 'The Jump',
        note: {
          title: 'Mission 2.3: The Jump',
          body: [
            'Your goal: jump high enough to grab the star above you. Press the Up arrow, W or Space to jump (click the canvas area first if keys do nothing).',
            'A jump is just an instant upward velocity. On screen up is NEGATIVE y, so you set <code class="inline">state.vy = -jumpPower</code>. Gravity then slows it, stops it at the top, and pulls you back down.',
            'Only jump when standing on the floor: check <code class="inline">state.onGround</code>, otherwise you could jump again in mid-air. Then tune jumpPower until the star is in reach: a bigger number jumps higher.'
          ]
        },
        mentorLines: [
          { speaker: 'mentorA', text: 'Piece 3: The Jump! The star is above you. Can you reach it?', trigger: 'onEnter' },
          { speaker: 'mentorB', text: 'Your jumpPower starts at 300. That is not enough. Try bigger numbers and watch how high you go.' },
          { speaker: 'mentorA', text: 'Task 2: if keys.up and state.onGround, set state.vy = -jumpPower. Negative y is UP.' },
          { speaker: 'mentorB', text: 'Also set state.onGround = false right after you jump, or you could jump again in mid-air!' }
        ],
        code: {
          javascript: `// Goal: Jump to collect high star
const gravity = 800;
const jumpPower = 300; // Task 1: Tune jumpPower (e.g. 380)

// Task 2: if (keys.up && state.onGround) launch upward (-jumpPower)


// Gravity & floor (done)
state.vy += gravity * dt;
state.y += state.vy * dt;

const floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0;
  state.onGround = true;
} else {
  state.onGround = false;
}`,
          python: `# Goal: Jump to collect high star
gravity = 800.0
jump_power = 300.0  # Task 1: Tune jump_power (e.g. 380.0)

# Task 2: if keys.up and state['onGround'] launch upward (-jump_power)


# Gravity & floor (done)
state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

floor_y = world['groundY'] - state['height']
if state['y'] >= floor_y:
    state['y'] = floor_y
    state['vy'] = 0.0
    state['onGround'] = True
else:
    state['onGround'] = False`,
          cpp: `// Goal: Jump to collect high star
float gravity = 800.0f;
float jumpPower = 300.0f; // Task 1: Tune jumpPower (e.g. 380.0f)

// Task 2: if (keys.up && state.onGround) launch upward (-jumpPower)


// Gravity & floor (done)
state.vy += gravity * dt;
state.y += state.vy * dt;

float floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0.0f;
  state.onGround = true;
} else {
  state.onGround = false;
}`
        }
      },
      {
        id: 'gravity-4',
        num: 'Piece 4',
        label: 'Run & Jump',
        note: {
          title: 'Mission 2.4: Run & Jump',
          body: [
            'Your goal: collect both stars, then reach the EXIT on the right. Jumping, gravity and the floor are done for you. You write the running.',
            'Running is velocity too, just sideways: set <code class="inline">state.vx</code> from the keys (negative is left, positive is right, 0 when no key is pressed), then move with <code class="inline">state.x += state.vx * dt</code>.',
            'Because vx and vy are separate, you can run and jump at the same time. That is how you reach the high stars: jump early and let the arc carry you sideways. You just built a platformer engine piece by piece!'
          ]
        },
        mentorLines: [
          { speaker: 'mentorA', text: 'Piece 4: Run & Jump! Collect both stars, then reach the EXIT. Jumping, gravity and the floor are done for you.', trigger: 'onEnter' },
          { speaker: 'mentorB', text: 'Task 1: set state.vx to -moveSpeed for left, moveSpeed for right, and 0 when no key is pressed.' },
          { speaker: 'mentorA', text: 'Task 2: state.x += state.vx * dt, just like y uses vy. Then run and jump together to reach the high stars.' },
          { speaker: 'mentorB', text: 'Stars too high? Jump while running: the arc carries you sideways. Time your jump early.' }
        ],
        code: {
          javascript: `// Goal: Run & jump to collect 2 stars and reach EXIT
const moveSpeed = 160;
const gravity = 800;
const jumpPower = 380;

// Task 1: state.vx = keys.left ? -moveSpeed : (keys.right ? moveSpeed : 0);


// Task 2: state.x += state.vx * dt;


// Jump, gravity & floor (done)
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.vy += gravity * dt;
state.y += state.vy * dt;

const floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0;
  state.onGround = true;
} else {
  state.onGround = false;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));`,
          python: `# Goal: Run & jump to collect 2 stars and reach EXIT
move_speed = 160.0
gravity = 800.0
jump_power = 380.0

# Task 1: state['vx'] = -move_speed if keys.left else (move_speed if keys.right else 0.0)


# Task 2: state['x'] += state['vx'] * dt


# Jump, gravity & floor (done)
if keys.up and state['onGround']:
    state['vy'] = -jump_power
    state['onGround'] = False

state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

floor_y = world['groundY'] - state['height']
if state['y'] >= floor_y:
    state['y'] = floor_y
    state['vy'] = 0.0
    state['onGround'] = True
else:
    state['onGround'] = False

state['x'] = max(0, min(world['width'] - state['width'], state['x']))`,
          cpp: `// Goal: Run & jump to collect 2 stars and reach EXIT
float moveSpeed = 160.0f;
float gravity = 800.0f;
float jumpPower = 380.0f;

// Task 1: if (keys.left) state.vx = -moveSpeed; else if (keys.right) state.vx = moveSpeed; else state.vx = 0.0f;


// Task 2: state.x += state.vx * dt;


// Jump, gravity & floor (done)
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.vy += gravity * dt;
state.y += state.vy * dt;

float floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0.0f;
  state.onGround = true;
} else {
  state.onGround = false;
}

state.x = std::clamp(state.x, 0.0f, world.width - state.width);`
        }
      }

    ]
  },
  {
    id: 'collision',
    num: '03',
    label: 'Collision',
    chapter: 'ch3',
    xp: 100,
    note: {
      title: 'AABB collision detection',
      body: [
        'The floating block is an axis-aligned bounding box (AABB): world.platform = {x, y, w, h}. You define and shape this collision box right in your code! Adjust the numbers in world.platform to reposition or resize the box, and watch it immediately update in the emulator.',
        'This code checks horizontal (x) and vertical (y) movement independently before committing, fully stopping the player flush against the platform edges instead of casually clipping through.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: 'You control the game world! Look at world.platform in your code — change x, y, w, or h to reshape the platform!', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'AABB collision tests horizontal and vertical axes independently to stop movement dead against the box.', trigger: 'onEnter' }
    ],
    code: {
      javascript: `// Platform box [x, y, w, h] and floor
world.platform = { x: 250, y: 170, w: 120, h: 20 };
world.groundY = 240;

const speed = 160;
const gravity = 800;
const jumpPower = 360;

if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

const p = world.platform;

// 2. Resolve X movement (fully stops horizontal movement against the box)
let nextX = state.x + state.vx * dt;
const hitsX =
  nextX < p.x + p.w && nextX + state.width > p.x &&
  state.y < p.y + p.h && state.y + state.height > p.y;

if (!hitsX) {
  state.x = nextX;
} else {
  if (state.vx > 0) state.x = p.x - state.width;
  else if (state.vx < 0) state.x = p.x + p.w;
  state.vx = 0;
}

// 3. Resolve Y movement (fully stops vertical movement against the box)
let nextY = state.y + state.vy * dt;
const hitsY =
  state.x < p.x + p.w && state.x + state.width > p.x &&
  nextY < p.y + p.h && nextY + state.height > p.y;

if (!hitsY) {
  state.y = nextY;
} else {
  if (state.vy > 0) {
    state.y = p.y - state.height;
    state.vy = 0;
    state.onGround = true;
  } else if (state.vy < 0) {
    state.y = p.y + p.h;
    state.vy = 0;
  }
}

// 4. Ground landing (floor y is 240 - 22 = 218)
const groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0;
  state.onGround = true;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));`,
      python: `# Platform box [x, y, w, h] and floor
world['platform'] = {'x': 250, 'y': 170, 'w': 120, 'h': 20}
world['groundY'] = 240

speed = 160.0
gravity = 800.0
jump_power = 360.0

if keys.left:
    state['vx'] = -speed
elif keys.right:
    state['vx'] = speed
else:
    state['vx'] = 0.0

state['vy'] += gravity * dt
if keys.up and state['onGround']:
    state['vy'] = -jump_power
    state['onGround'] = False

p = world['platform']

# 2. Resolve X movement against collision box
next_x = state['x'] + state['vx'] * dt
hits_x = (next_x < p['x'] + p['w'] and next_x + state['width'] > p['x'] and
          state['y'] < p['y'] + p['h'] and state['y'] + state['height'] > p['y'])

if not hits_x:
    state['x'] = next_x
else:
    if state['vx'] > 0:
        state['x'] = p['x'] - state['width']
    elif state['vx'] < 0:
        state['x'] = p['x'] + p['w']
    state['vx'] = 0.0

# 3. Resolve Y movement against collision box
next_y = state['y'] + state['vy'] * dt
hits_y = (state['x'] < p['x'] + p['w'] and state['x'] + state['width'] > p['x'] and
          next_y < p['y'] + p['h'] and next_y + state['height'] > p['y'])

if not hits_y:
    state['y'] = next_y
else:
    if state['vy'] > 0:
        state['y'] = p['y'] - state['height']
        state['vy'] = 0.0
        state['onGround'] = True
    elif state['vy'] < 0:
        state['y'] = p['y'] + p['h']
        state['vy'] = 0.0

# 4. Ground landing (floor y is 240 - 22 = 218)
ground_y = world['groundY'] - state['height']
if state['y'] >= ground_y:
    state['y'] = ground_y
    state['vy'] = 0.0
    state['onGround'] = True`,
      cpp: `// Platform box [x, y, w, h] and floor
world.platform = { x: 250.0f, y: 170.0f, w: 120.0f, h: 20.0f };
world.groundY = 240.0f;

float speed = 160.0f;
float gravity = 800.0f;
float jumpPower = 360.0f;

if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0.0f;

state.vy += gravity * dt;
if (keys.up && state.onGround) state.vy = -jumpPower;

auto p = world.platform;

// 2. Resolve X movement
float nextX = state.x + state.vx * dt;
bool hitsX = nextX < p.x + p.w && nextX + state.width > p.x &&
             state.y < p.y + p.h && state.y + state.height > p.y;

if (!hitsX) {
  state.x = nextX;
} else {
  if (state.vx > 0.0f) state.x = p.x - state.width;
  else if (state.vx < 0.0f) state.x = p.x + p.w;
  state.vx = 0.0f;
}

// 3. Resolve Y movement
float nextY = state.y + state.vy * dt;
bool hitsY = state.x < p.x + p.w && state.x + state.width > p.x &&
             nextY < p.y + p.h && nextY + state.height > p.y;

if (!hitsY) {
  state.y = nextY;
} else {
  if (state.vy > 0.0f) {
    state.y = p.y - state.height;
    state.vy = 0.0f;
    state.onGround = true;
  } else if (state.vy < 0.0f) {
    state.y = p.y + p.h;
    state.vy = 0.0f;
  }
}`
    }
  },
  {
    id: 'chase',
    num: '04',
    label: 'Chase AI',
    chapter: 'ch4',
    xp: 120,
    note: {
      title: 'A one-line "AI"',
      body: [
        'Most simple enemy AI is just steering: find the direction vector from enemy to target, normalize it (make its length exactly 1), and move along it. That\'s dx, dy, dist below.',
        'Try setting enemySpeed higher than your own speed, or add a "give up" range so the enemy only chases when you\'re close.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: 'Red orb detected! It uses vector normalization to track your coordinates.', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Tip: You can change enemySpeed or initial position in your code to tune the challenge!', trigger: 'onEnter' }
    ],
    code: {
      javascript: `// Setup arena & enemy AI
world.width = 480;
world.height = 280;

if (state.enemyX === undefined) {
  state.enemyX = 400;
  state.enemyY = 70;
}

const speed = 170;
const enemySpeed = 95;

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

state.x = Math.max(0, Math.min(world.width - state.width, state.x));
state.y = Math.max(0, Math.min(world.height - state.height, state.y));

// Steer red orb toward player
const dx = state.x - state.enemyX;
const dy = state.y - state.enemyY;
const dist = Math.sqrt(dx * dx + dy * dy) || 1;

state.enemyX += (dx / dist) * enemySpeed * dt;
state.enemyY += (dy / dist) * enemySpeed * dt;`,
      python: `# Setup arena & enemy AI
world['width'] = 480
world['height'] = 280

if state.get('enemyX') is None:
    state['enemyX'] = 400.0
    state['enemyY'] = 70.0

speed = 170.0
enemy_speed = 95.0

if keys.left:
    state['x'] -= speed * dt
if keys.right:
    state['x'] += speed * dt
if keys.up:
    state['y'] -= speed * dt
if keys.down:
    state['y'] += speed * dt

state['x'] = max(0, min(world['width'] - state['width'], state['x']))
state['y'] = max(0, min(world['height'] - state['height'], state['y']))

# Steer red orb toward player
dx = state['x'] - state['enemyX']
dy = state['y'] - state['enemyY']
dist = (dx * dx + dy * dy) ** 0.5 or 1.0

state['enemyX'] += (dx / dist) * enemy_speed * dt
state['enemyY'] += (dy / dist) * enemy_speed * dt`,
      cpp: `// Setup arena & enemy AI
world.width = 480.0f;
world.height = 280.0f;

if (state.enemyX <= 0.0f) {
  state.enemyX = 400.0f;
  state.enemyY = 70.0f;
}

float speed = 170.0f;
float enemySpeed = 95.0f;

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

state.x = std::clamp(state.x, 0.0f, world.width - state.width);
state.y = std::clamp(state.y, 0.0f, world.height - state.height);

// Steer red orb toward player
float dx = state.x - state.enemyX;
float dy = state.y - state.enemyY;
float dist = std::sqrt(dx * dx + dy * dy);
if (dist > 0.001f) {
  state.enemyX += (dx / dist) * enemySpeed * dt;
  state.enemyY += (dy / dist) * enemySpeed * dt;
}`
    }
  },
  {
    id: 'capstone',
    num: '05',
    label: 'Boss Capstone: Arena Escape',
    chapter: 'ch4',
    xp: 250,
    note: {
      title: 'Capstone Boss Challenge: Building a Full Game',
      body: [
        'You are building a complete arcade game from scratch! In your code, you now define the entire level layout: the floating platform collision box (world.platform), the floor line (world.groundY), the green portal exit (world.goal), the energy gems (state.coins), and the chasing AI enemy (state.enemyX, enemySpeed).',
        'Try adjusting any number in the code — make the platform wider, reposition the energy gems, or tune the enemy speed to see how game designers craft gameplay mechanics!'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: 'THIS IS IT! You have full code control over the entire game world: platform, ground, gems, AI, and portal!', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Change the numbers in Section 1 of your code to customize your level layout and test your design in real-time!', trigger: 'onEnter' }
    ],
    code: {
      javascript: `// ========================================================
// 1. GAME WORLD & LEVEL SETUP (Adjust anything to design!)
// ========================================================
world.groundY = 240;                                // Floor line height
world.platform = { x: 240, y: 170, w: 120, h: 20 }; // Floating platform collision box [x, y, w, h]
world.goal = { x: 416, y: 175, w: 38, h: 65 };       // Green portal exit [x, y, w, h]

// Initialize the 3 energy gems across the arena
if (!state.coins || state.coins.length === 0) {
  state.coins = [
    { x: 300, y: 115, collected: false },
    { x: 160, y: 185, collected: false },
    { x: 360, y: 215, collected: false }
  ];
}

// Initialize enemy pursuer spawn position
if (state.enemyX === undefined) {
  state.enemyX = 420;
  state.enemyY = 60;
}

// ========================================================
// 2. PLAYER & ENEMY SPEED/PHYSICS CONSTANTS
// ========================================================
const speed = 170;
const gravity = 820;
const jumpPower = 370;
const enemySpeed = 80;

// ========================================================
// 3. PLAYER MOVEMENT & JUMPING
// ========================================================
if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

// ========================================================
// 4. PLATFORM COLLISION (Solid Stopping)
// ========================================================
const p = world.platform;

let nextX = state.x + state.vx * dt;
const hitsX =
  nextX < p.x + p.w && nextX + state.width > p.x &&
  state.y < p.y + p.h && state.y + state.height > p.y;

if (!hitsX) {
  state.x = nextX;
} else {
  if (state.vx > 0) state.x = p.x - state.width;
  else if (state.vx < 0) state.x = p.x + p.w;
  state.vx = 0;
}

let nextY = state.y + state.vy * dt;
const hitsY =
  state.x < p.x + p.w && state.x + state.width > p.x &&
  nextY < p.y + p.h && nextY + state.height > p.y;

if (!hitsY) {
  state.y = nextY;
} else {
  if (state.vy > 0) {
    state.y = p.y - state.height;
    state.vy = 0;
    state.onGround = true;
  } else if (state.vy < 0) {
    state.y = p.y + p.h;
    state.vy = 0;
  }
}

// ========================================================
// 5. GROUND LANDING & BOUNDARIES
// ========================================================
const groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0;
  state.onGround = true;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));

// ========================================================
// 6. ENEMY VECTOR CHASE AI (Steers Around Platform)
// ========================================================
const edx = state.x - state.enemyX;
const edy = state.y - state.enemyY;
const edist = Math.sqrt(edx * edx + edy * edy) || 1;
let evx = (edx / edist) * enemySpeed;
let evy = (edy / edist) * enemySpeed;

const er = 12;
const p = world.platform;
if (p) {
  const nextX = state.enemyX + evx * dt;
  const nextY = state.enemyY + evy * dt;
  const bx1 = p.x - er, bx2 = p.x + p.w + er;
  const by1 = p.y - er, by2 = p.y + p.h + er;

  if (nextX > bx1 && nextX < bx2 && nextY > by1 && nextY < by2) {
    if (state.enemyY <= by1) {
      evy = 0;
      evx = (state.x < p.x + p.w / 2) ? -enemySpeed : enemySpeed;
    } else if (state.enemyY >= by2) {
      evy = 0;
      evx = (state.x < p.x + p.w / 2) ? -enemySpeed : enemySpeed;
    } else if (state.enemyX <= bx1) {
      evx = 0;
      evy = (state.y < p.y + p.h / 2) ? -enemySpeed : enemySpeed;
    } else {
      evx = 0;
      evy = (state.y < p.y + p.h / 2) ? -enemySpeed : enemySpeed;
    }
  }
}

state.enemyX += evx * dt;
state.enemyY += evy * dt;

// ========================================================
// 7. GEM PICKUP RADIUS CHECK
// ========================================================
if (state.coins) {
  state.coins.forEach(coin => {
    if (!coin.collected) {
      const cdx = state.x + 11 - coin.x;
      const cdy = state.y + 11 - coin.y;
      if (Math.sqrt(cdx * cdx + cdy * cdy) < 28) {
        coin.collected = true;
        state.score = (state.score || 0) + 100;
      }
    }
  });
}`,
      python: `# Python Boss Capstone Script
# ========================================================
# 1. GAME WORLD & LEVEL SETUP (Adjust anything to design!)
# ========================================================
world['groundY'] = 240
world['platform'] = {'x': 240, 'y': 170, 'w': 120, 'h': 20}
world['goal'] = {'x': 416, 'y': 175, 'w': 38, 'h': 65}

if not state.get('coins'):
    state['coins'] = [
        {'x': 300, 'y': 115, 'collected': False},
        {'x': 160, 'y': 185, 'collected': False},
        {'x': 360, 'y': 215, 'collected': False}
    ]

if state.get('enemyX') is None:
    state['enemyX'] = 420.0
    state['enemyY'] = 60.0

# ========================================================
# 2. PLAYER & ENEMY SPEED/PHYSICS CONSTANTS
# ========================================================
speed = 170.0
gravity = 820.0
jump_power = 370.0
enemy_speed = 80.0

# ========================================================
# 3. PLAYER MOVEMENT & JUMPING
# ========================================================
if keys.left:
    state['vx'] = -speed
elif keys.right:
    state['vx'] = speed
else:
    state['vx'] = 0.0

state['vy'] += gravity * dt
if keys.up and state['onGround']:
    state['vy'] = -jump_power
    state['onGround'] = False

# ========================================================
# 4. PLATFORM COLLISION (Solid Stopping)
# ========================================================
p = world['platform']

next_x = state['x'] + state['vx'] * dt
hits_x = (next_x < p['x'] + p['w'] and next_x + state['width'] > p['x'] and
          state['y'] < p['y'] + p['h'] and state['y'] + state['height'] > p['y'])

if not hits_x:
    state['x'] = next_x
else:
    if state['vx'] > 0:
        state['x'] = p['x'] - state['width']
    elif state['vx'] < 0:
        state['x'] = p['x'] + p['w']
    state['vx'] = 0.0

next_y = state['y'] + state['vy'] * dt
hits_y = (state['x'] < p['x'] + p['w'] and state['x'] + state['width'] > p['x'] and
          next_y < p['y'] + p['h'] and next_y + state['height'] > p['y'])

if not hits_y:
    state['y'] = next_y
else:
    if state['vy'] > 0:
        state['y'] = p['y'] - state['height']
        state['vy'] = 0.0
        state['onGround'] = True
    elif state['vy'] < 0:
        state['y'] = p['y'] + p['h']
        state['vy'] = 0.0

# ========================================================
# 5. GROUND LANDING & BOUNDARIES
# ========================================================
ground_y = world['groundY'] - state['height']
if state['y'] >= ground_y:
    state['y'] = ground_y
    state['vy'] = 0.0
    state['onGround'] = True

state['x'] = max(0, min(world['width'] - state['width'], state['x']))

# ========================================================
# 6. ENEMY CHASE AI (Steers Around Platform)
# ========================================================
edx = state['x'] - state['enemyX']
edy = state['y'] - state['enemyY']
edist = (edx * edx + edy * edy) ** 0.5 or 1.0
evx = (edx / edist) * enemy_speed
evy = (edy / edist) * enemy_speed

er = 12.0
if world.get('platform'):
    p = world['platform']
    next_x = state['enemyX'] + evx * dt
    next_y = state['enemyY'] + evy * dt
    bx1 = p['x'] - er
    bx2 = p['x'] + p['w'] + er
    by1 = p['y'] - er
    by2 = p['y'] + p['h'] + er
    if next_x > bx1 and next_x < bx2 and next_y > by1 and next_y < by2:
        if state['enemyY'] <= by1:
            evy = 0.0
            if state['x'] < p['x'] + p['w'] / 2.0:
                evx = -enemy_speed
            else:
                evx = enemy_speed
        elif state['enemyY'] >= by2:
            evy = 0.0
            if state['x'] < p['x'] + p['w'] / 2.0:
                evx = -enemy_speed
            else:
                evx = enemy_speed
        elif state['enemyX'] <= bx1:
            evx = 0.0
            if state['y'] < p['y'] + p['h'] / 2.0:
                evy = -enemy_speed
            else:
                evy = enemy_speed
        else:
            evx = 0.0
            if state['y'] < p['y'] + p['h'] / 2.0:
                evy = -enemy_speed
            else:
                evy = enemy_speed

state['enemyX'] += evx * dt
state['enemyY'] += evy * dt

# ========================================================
# 7. GEM PICKUP RADIUS CHECK
# ========================================================
if state.get('coins'):
    for coin in state['coins']:
        if not coin.get('collected'):
            cdx = state['x'] + 11 - coin['x']
            cdy = state['y'] + 11 - coin['y']
            if (cdx * cdx + cdy * cdy) ** 0.5 < 28:
                coin['collected'] = True
                state['score'] = (state.get('score') or 0) + 100`,
      cpp: `// C++ Boss Capstone
// ========================================================
// 1. GAME WORLD & LEVEL SETUP (Adjust anything to design!)
// ========================================================
world.groundY = 240.0f;
world.platform = { x: 240.0f, y: 170.0f, w: 120.0f, h: 20.0f };
world.goal = { x: 416.0f, y: 175.0f, w: 38.0f, h: 65.0f };

if (state.enemyX <= 0.0f) {
  state.enemyX = 420.0f;
  state.enemyY = 60.0f;
}

// ========================================================
// 2. PLAYER & ENEMY SPEED/PHYSICS CONSTANTS
// ========================================================
float speed = 170.0f;
float gravity = 820.0f;
float jumpPower = 370.0f;
float enemySpeed = 80.0f;

// ========================================================
// 3. PLAYER MOVEMENT & JUMPING
// ========================================================
if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0.0f;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

// ========================================================
// 4. PLATFORM COLLISION (Solid Stopping)
// ========================================================
auto p = world.platform;

float nextX = state.x + state.vx * dt;
bool hitsX = nextX < p.x + p.w && nextX + state.width > p.x &&
             state.y < p.y + p.h && state.y + state.height > p.y;

if (!hitsX) {
  state.x = nextX;
} else {
  if (state.vx > 0.0f) state.x = p.x - state.width;
  else if (state.vx < 0.0f) state.x = p.x + p.w;
  state.vx = 0.0f;
}

float nextY = state.y + state.vy * dt;
bool hitsY = state.x < p.x + p.w && state.x + state.width > p.x &&
             nextY < p.y + p.h && nextY + state.height > p.y;

if (!hitsY) {
  state.y = nextY;
} else {
  if (state.vy > 0.0f) {
    state.y = p.y - state.height;
    state.vy = 0.0f;
    state.onGround = true;
  } else if (state.vy < 0.0f) {
    state.y = p.y + p.h;
    state.vy = 0.0f;
  }
}

// ========================================================
// 5. GROUND LANDING & BOUNDARIES
// ========================================================
float groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0.0f;
  state.onGround = true;
}

state.x = Math.max(0.0f, Math.min(world.width - state.width, state.x));

// ========================================================
// 6. ENEMY CHASE AI (Steers Around Platform)
// ========================================================
float edx = state.x - state.enemyX;
float edy = state.y - state.enemyY;
float edist = std::sqrt(edx * edx + edy * edy);
if (edist < 1.0f) edist = 1.0f;
float evx = (edx / edist) * enemySpeed;
float evy = (edy / edist) * enemySpeed;

float er = 12.0f;
auto p = world.platform;
float nextX = state.enemyX + evx * dt;
float nextY = state.enemyY + evy * dt;
float bx1 = p.x - er, bx2 = p.x + p.w + er;
float by1 = p.y - er, by2 = p.y + p.h + er;

if (nextX > bx1 && nextX < bx2 && nextY > by1 && nextY < by2) {
  if (state.enemyY <= by1) {
    evy = 0.0f;
    evx = (state.x < p.x + p.w / 2.0f) ? -enemySpeed : enemySpeed;
  } else if (state.enemyY >= by2) {
    evy = 0.0f;
    evx = (state.x < p.x + p.w / 2.0f) ? -enemySpeed : enemySpeed;
  } else if (state.enemyX <= bx1) {
    evx = 0.0f;
    evy = (state.y < p.y + p.h / 2.0f) ? -enemySpeed : enemySpeed;
  } else {
    evx = 0.0f;
    evy = (state.y < p.y + p.h / 2.0f) ? -enemySpeed : enemySpeed;
  }
}

state.enemyX += evx * dt;
state.enemyY += evy * dt;

// ========================================================
// 7. GEM PICKUP RADIUS CHECK
// ========================================================
if (state.coins) {
  state.coins.forEach(coin => {
    if (!coin.collected) {
      float cdx = state.x + 11 - coin.x;
      float cdy = state.y + 11 - coin.y;
      if (std::sqrt(cdx * cdx + cdy * cdy) < 28.0f) {
        coin.collected = true;
        state.score = (state.score || 0) + 100;
      }
    }
  });
}`
    }
  }
];
