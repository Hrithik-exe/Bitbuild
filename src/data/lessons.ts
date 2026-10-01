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
    lessons: ['gravity-1', 'gravity-2', 'gravity-3', 'gravity-4'],
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
      title: 'Reading input & moving a sprite',
      body: [
        'The engine calls your update(state, keys, dt, world) function every animation frame. keys tells you which arrow keys are currently held down, and dt is the time in seconds since the last frame — multiply by dt so movement speed doesn\'t depend on frame rate.',
        'Try changing speed, or make the player move diagonally faster than it should (a classic bug — fix it by normalizing the vector).',
        '📐 Coordinates Notice: In 2D game engines and HTML5 canvas, (0,0) is at the top-left ceiling (roof) and +Y points DOWN. If this feels inverted compared to standard graphing, toggle "📐 Math (+Y Up)" above the canvas to see intuitive altitude from the ground!'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Welcome to BitBuild! I'm Pixel. Let's start with basic sprite controls.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Notice the coordinate mode buttons above the canvas? You can toggle between Math and Screen coordinates anytime!', trigger: 'onEnter' }
    ],
    code: {
      javascript: `// Move the player with the arrow keys
const speed = 150; // pixels per second

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

// Keep the player inside the canvas
state.x = Math.max(0, Math.min(world.width - state.width, state.x));
state.y = Math.max(0, Math.min(world.height - state.height, state.y));`,
      python: `# Move player with arrow keys (Python Pyodide runtime)
speed = 150.0  # pixels per second

if keys.left:
    state['x'] -= speed * dt
if keys.right:
    state['x'] += speed * dt
if keys.up:
    state['y'] -= speed * dt
if keys.down:
    state['y'] += speed * dt

# Keep player inside canvas boundary
state['x'] = max(0, min(world['width'] - state['width'], state['x']))
state['y'] = max(0, min(world['height'] - state['height'], state['y']))`,
      cpp: `// C++ Simulation Sandbox
float speed = 150.0f;

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

state.x = std::clamp(state.x, 0.0f, world.width - state.width);
state.y = std::clamp(state.y, 0.0f, world.height - state.height);`
    }
  },
  {
    id: 'gravity-1',
    num: '02.1',
    label: 'Free Fall',
    chapter: 'ch2',
    xp: 30,
    note: {
      title: 'Piece 1: Downward Acceleration',
      body: [
        'Gravity is a constant acceleration pulling objects downward: every frame, state.vy += gravity * dt.',
        'Watch the player accelerate downward from the air! Notice how short this code is — only 7 lines to simulate realistic free fall.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Welcome to Gravity! Piece 1 is simple: constant downward acceleration.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: "Notice state.vy += gravity * dt? Every second, your vertical speed grows by 800 pixels!", trigger: 'onEnter' }
    ],
    code: {
      javascript: `// 1. Gravity accelerates vertical velocity downward
const gravity = 800; // pixels per second squared

state.vy += gravity * dt;
state.y += state.vy * dt;

// Stop at canvas bottom
if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0;
}`,
      python: `# 1. Downward gravitational acceleration
gravity = 800.0

state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

if state['y'] > world['height'] - state['height']:
    state['y'] = world['height'] - state['height']
    state['vy'] = 0.0`,
      cpp: `// 1. Downward gravitational acceleration
float gravity = 800.0f;

state.vy += gravity * dt;
state.y += state.vy * dt;

if (state.y > world.height - state.height) {
  state.y = world.height - state.height;
  state.vy = 0.0f;
}`
    }
  },
  {
    id: 'gravity-2',
    num: '02.2',
    label: 'The Floor',
    chapter: 'ch2',
    xp: 35,
    note: {
      title: 'Piece 2: Ground Landing',
      body: [
        'Now we introduce the floor: world.groundY = 240. Because player coordinates start at top-left, the player lands when state.y >= groundY - state.height (240 - 22 = 218).',
        'When landing, set state.vy = 0 and state.onGround = true.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Piece 2: The Floor! Look at world.groundY = 240 in your code.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: "When touching the floor, clamp state.y and set onGround = true so we know we landed!", trigger: 'onEnter' }
    ],
    code: {
      javascript: `// 2. Define the floor height and land safely
world.groundY = 240;
const gravity = 800;

state.vy += gravity * dt;
state.y += state.vy * dt;

// Landing check: floor line minus player height (240 - 22 = 218)
const floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0;
  state.onGround = true;
}`,
      python: `# 2. Define floor height and land safely
world['groundY'] = 240
gravity = 800.0

state['vy'] += gravity * dt
state['y'] += state['vy'] * dt

floor_y = world['groundY'] - state['height']
if state['y'] >= floor_y:
    state['y'] = floor_y
    state['vy'] = 0.0
    state['onGround'] = True`,
      cpp: `// 2. Define floor height and land safely
world.groundY = 240.0f;
float gravity = 800.0f;

state.vy += gravity * dt;
state.y += state.vy * dt;

float floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0.0f;
  state.onGround = true;
}`
    }
  },
  {
    id: 'gravity-3',
    num: '02.3',
    label: 'The Jump',
    chapter: 'ch2',
    xp: 40,
    note: {
      title: 'Piece 3: Upward Jump Impulse',
      body: [
        'A jump is an instant upward impulse: state.vy = -jumpPower. In 2D screen coordinates, negative velocity moves UP towards the roof!',
        'The state.onGround check ensures you can only jump when standing on the floor, preventing infinite mid-air flapping.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Piece 3: Time to jump! Press [UP] or [SPACE] to launch into the air.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: "Notice state.vy = -jumpPower? Negative Y moves UP towards the ceiling!", trigger: 'onEnter' }
    ],
    code: {
      javascript: `// 3. Upward jump impulse when standing on the ground
world.groundY = 240;
const gravity = 800;
const jumpPower = 380;

// Jump impulse (negative Y moves UP)
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
}`,
      python: `# 3. Upward jump impulse when on ground
world['groundY'] = 240
gravity = 800.0
jump_power = 380.0

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
    state['onGround'] = False`,
      cpp: `// 3. Upward jump impulse when on ground
world.groundY = 240.0f;
float gravity = 800.0f;
float jumpPower = 380.0f;

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
}`
    }
  },
  {
    id: 'gravity-4',
    num: '02.4',
    label: 'Run & Jump',
    chapter: 'ch2',
    xp: 50,
    note: {
      title: 'Piece 4: Full Platformer Physics',
      body: [
        'Now combine everything: horizontal running (vx) with vertical jumping (vy) and wall boundary clipping.',
        'Congratulations! You just built a full platformer physics engine from scratch, piece by piece!'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Piece 4: Full Platformer Physics! Left, right, jump, gravity, and floor collision all together!", trigger: 'onEnter' },
      { speaker: 'mentorB', text: "You assembled this piece-by-piece without drowning in a huge wall of code. Try running and jumping around!", trigger: 'onEnter' }
    ],
    code: {
      javascript: `// 4. Combine horizontal running with jumping
world.groundY = 240;
const moveSpeed = 160;
const gravity = 800;
const jumpPower = 380;

if (keys.left) state.vx = -moveSpeed;
else if (keys.right) state.vx = moveSpeed;
else state.vx = 0;

if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.vy += gravity * dt;
state.x += state.vx * dt;
state.y += state.vy * dt;

const floorY = world.groundY - state.height;
if (state.y >= floorY) {
  state.y = floorY;
  state.vy = 0;
  state.onGround = true;
} else {
  state.onGround = false;
}

// Keep inside canvas walls
state.x = Math.max(0, Math.min(world.width - state.width, state.x));`,
      python: `# 4. Combine horizontal running with jumping
world['groundY'] = 240
move_speed = 160.0
gravity = 800.0
jump_power = 380.0

if keys.left:
    state['vx'] = -move_speed
elif keys.right:
    state['vx'] = move_speed
else:
    state['vx'] = 0.0

if keys.up and state['onGround']:
    state['vy'] = -jump_power
    state['onGround'] = False

state['vy'] += gravity * dt
state['x'] += state['vx'] * dt
state['y'] += state['vy'] * dt

floor_y = world['groundY'] - state['height']
if state['y'] >= floor_y:
    state['y'] = floor_y
    state['vy'] = 0.0
    state['onGround'] = True
else:
    state['onGround'] = False

state['x'] = max(0, min(world['width'] - state['width'], state['x']))`,
      cpp: `// 4. Combine horizontal running with jumping
world.groundY = 240.0f;
float moveSpeed = 160.0f;
float gravity = 800.0f;
float jumpPower = 380.0f;

if (keys.left) state.vx = -moveSpeed;
else if (keys.right) state.vx = moveSpeed;
else state.vx = 0.0f;

if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.vy += gravity * dt;
state.x += state.vx * dt;
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
      javascript: `// 1. Define the platform collision box: [x, y, width, height]
// You have full control! Adjust these numbers to reposition or resize the platform box.
world.platform = { x: 250, y: 145, w: 120, h: 20 };
// Floor line is at y = 240. With player height = 22, standing on the floor is at y = 240 - 22 = 218.
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
      python: `# Python Solid AABB Platform Collision
# 1. Define the platform collision box: [x, y, width, height]
# You have full control! Adjust these values to reposition or resize the box.
world['platform'] = {'x': 250, 'y': 145, 'w': 120, 'h': 20}
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
      cpp: `// C++ Solid AABB Collision Resolution
// 1. Define the platform collision box: [x, y, width, height]
// You have full control! Adjust these values to reposition or resize the box.
world.platform = { x: 250.0f, y: 145.0f, w: 120.0f, h: 20.0f };
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
      javascript: `// 1. Environment & Enemy AI Configuration
// You have full control! Adjust enemySpeed or coordinates.
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

// 2. Steer the red enemy orb toward the player position
const dx = state.x - state.enemyX;
const dy = state.y - state.enemyY;
const dist = Math.sqrt(dx * dx + dy * dy) || 1;

state.enemyX += (dx / dist) * enemySpeed * dt;
state.enemyY += (dy / dist) * enemySpeed * dt;`,
      python: `# Python Chase AI Vector Steering
# 1. Environment & Enemy Configuration
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

# 2. Vector steering toward player
dx = state['x'] - state['enemyX']
dy = state['y'] - state['enemyY']
dist = (dx * dx + dy * dy) ** 0.5 or 1.0

state['enemyX'] += (dx / dist) * enemy_speed * dt
state['enemyY'] += (dy / dist) * enemy_speed * dt`,
      cpp: `// C++ Vector Chase AI
// 1. Environment & Enemy Configuration
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

// 2. Vector steering toward player
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
world.platform = { x: 240, y: 145, w: 120, h: 20 }; // Floating platform collision box [x, y, w, h]
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
// 6. ENEMY VECTOR CHASE AI
// ========================================================
const dx = state.x - state.enemyX;
const dy = state.y - state.enemyY;
const dist = Math.sqrt(dx * dx + dy * dy) || 1;
state.enemyX += (dx / dist) * enemySpeed * dt;
state.enemyY += (dy / dist) * enemySpeed * dt;

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
world['platform'] = {'x': 240, 'y': 145, 'w': 120, 'h': 20}
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
# 6. ENEMY CHASE AI
# ========================================================
dx = state['x'] - state['enemyX']
dy = state['y'] - state['enemyY']
dist = (dx * dx + dy * dy) ** 0.5 or 1.0
state['enemyX'] += (dx / dist) * enemy_speed * dt
state['enemyY'] += (dy / dist) * enemy_speed * dt

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
world.platform = { x: 240.0f, y: 145.0f, w: 120.0f, h: 20.0f };
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
// 6. ENEMY CHASE AI
// ========================================================
float dx = state.x - state.enemyX;
float dy = state.y - state.enemyY;
float dist = std::sqrt(dx * dx + dy * dy);
if (dist > 0.001f) {
  state.enemyX += (dx / dist) * enemySpeed * dt;
  state.enemyY += (dy / dist) * enemySpeed * dt;
}

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
