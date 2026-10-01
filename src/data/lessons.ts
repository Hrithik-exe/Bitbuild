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
    description: 'Implement realistic gravity acceleration, jump impulses, and ground collision state.',
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
      title: 'Reading input & moving a sprite',
      body: [
        'The engine calls your update(state, keys, dt, world) function every animation frame. keys tells you which arrow keys are currently held down, and dt is the time in seconds since the last frame — multiply by dt so movement speed doesn\'t depend on frame rate.',
        'Try changing speed, or make the player move diagonally faster than it should (a classic bug — fix it by normalizing the vector).'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: "Welcome to BitBuild! I'm Pixel. Let's start with basic sprite controls.", trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Remember: Always scale movement speed by dt! Or else 144Hz monitors will fly away.', trigger: 'onEnter' }
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
    id: 'gravity',
    num: '02',
    label: 'Gravity & Jump',
    chapter: 'ch2',
    xp: 75,
    note: {
      title: 'Velocity, acceleration, and a jump',
      body: [
        'Real motion is built from velocity (speed + direction) and acceleration (how velocity changes over time). Gravity is just a constant downward acceleration applied every frame: state.vy += gravity * dt.',
        'A jump sets a negative vertical velocity instantly, then gravity pulls it back down. state.onGround is there so you can only jump when standing on something — try removing that check and see what happens.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: 'Newton would be proud! Gravity constantly pulls velocity downward.', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'Press UP arrow to jump! Watch out for infinite mid-air jumps if onGround is ignored.', trigger: 'onEnter' }
    ],
    code: {
      javascript: `const gravity = 800;    // downward acceleration (px/s^2)
const jumpPower = 380;  // initial upward impulse
const moveSpeed = 160;

if (keys.left) state.vx = -moveSpeed;
else if (keys.right) state.vx = moveSpeed;
else state.vx = 0;

// Apply constant gravitational acceleration
state.vy += gravity * dt;

// Trigger jump only when grounded
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.x += state.vx * dt;
state.y += state.vy * dt;

// Ground landing check
const groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0;
  state.onGround = true;
} else {
  state.onGround = false;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));`,
      python: `# Python Gravity & Jump Implementation
gravity = 800.0
jump_power = 380.0
move_speed = 160.0

if keys.left:
    state['vx'] = -move_speed
elif keys.right:
    state['vx'] = move_speed
else:
    state['vx'] = 0.0

state['vy'] += gravity * dt

if keys.up and state['onGround']:
    state['vy'] = -jump_power
    state['onGround'] = False

state['x'] += state['vx'] * dt
state['y'] += state['vy'] * dt

ground_y = world['groundY'] - state['height']
if state['y'] >= ground_y:
    state['y'] = ground_y
    state['vy'] = 0.0
    state['onGround'] = True
else:
    state['onGround'] = False

state['x'] = max(0, min(world['width'] - state['width'], state['x']))`,
      cpp: `// C++ Physics Sandbox
float gravity = 800.0f;
float jumpPower = 380.0f;
float moveSpeed = 160.0f;

if (keys.left) state.vx = -moveSpeed;
else if (keys.right) state.vx = moveSpeed;
else state.vx = 0.0f;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

state.x += state.vx * dt;
state.y += state.vy * dt;

float groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0.0f;
  state.onGround = true;
}`
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
        'The floating block is an axis-aligned bounding box (AABB): world.platform = {x, y, w, h}. Two boxes overlap when they overlap on both the x-axis AND the y-axis at the same time — that\'s the four-condition check in the code.',
        'This code checks the next position before committing to it, so the player stops at the edge instead of clipping through. Try deleting the check and watch the player pass straight through the block.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorB', text: 'AABB stands for Axis-Aligned Bounding Box. No rotated boxes allowed today!', trigger: 'onEnter' },
      { speaker: 'mentorA', text: 'Jump onto the teal platform to test landing mechanics.', trigger: 'onEnter' }
    ],
    code: {
      javascript: `const speed = 160;
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

// 1. Resolve X movement (fully stops horizontal movement against the box)
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

// 2. Resolve Y movement (fully stops vertical movement against the box)
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

const groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0;
  state.onGround = true;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));`,
      python: `# Python Solid AABB Platform Collision
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

# 1. Resolve X movement against collision box
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

# 2. Resolve Y movement against collision box
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

ground_y = world['groundY'] - state['height']
if state['y'] >= ground_y:
    state['y'] = ground_y
    state['vy'] = 0.0
    state['onGround'] = True`,
      cpp: `// C++ Solid AABB Collision Resolution
float speed = 160.0f;
float gravity = 800.0f;
float jumpPower = 360.0f;

if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0.0f;

state.vy += gravity * dt;
if (keys.up && state.onGround) state.vy = -jumpPower;

auto p = world.platform;

// 1. Resolve X movement
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

// 2. Resolve Y movement
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
      { speaker: 'mentorB', text: 'Tip: Add a proximity check if (dist < 180) to make stealth gameplay possible!', trigger: 'onEnter' }
    ],
    code: {
      javascript: `const speed = 170;
const enemySpeed = 95;

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

state.x = Math.max(0, Math.min(world.width - state.width, state.x));
state.y = Math.max(0, Math.min(world.height - state.height, state.y));

// Steer the red enemy orb toward the player position
const dx = state.x - state.enemyX;
const dy = state.y - state.enemyY;
const dist = Math.sqrt(dx * dx + dy * dy) || 1;

state.enemyX += (dx / dist) * enemySpeed * dt;
state.enemyY += (dy / dist) * enemySpeed * dt;`,
      python: `# Python Chase AI Vector Steering
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

dx = state['x'] - state['enemyX']
dy = state['y'] - state['enemyY']
dist = (dx * dx + dy * dy) ** 0.5 or 1.0

state['enemyX'] += (dx / dist) * enemy_speed * dt
state['enemyY'] += (dy / dist) * enemy_speed * dt`,
      cpp: `// C++ Vector Chase AI
float speed = 170.0f;
float enemySpeed = 95.0f;

if (keys.left)  state.x -= speed * dt;
if (keys.right) state.x += speed * dt;
if (keys.up)    state.y -= speed * dt;
if (keys.down)  state.y += speed * dt;

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
      title: 'Capstone Boss Challenge',
      body: [
        'Combine all previous mechanics! Jump across the floating platform, dodge the chasing red AI, collect the 3 glowing energy gems, and reach the glowing green portal to win!',
        'This capstone requires integrating input, gravity jumping, platform collision, and enemy steering into one cohesive script.'
      ]
    },
    mentorLines: [
      { speaker: 'mentorA', text: 'THIS IS IT! The final Capstone level. Collect all gems and touch the portal!', trigger: 'onEnter' },
      { speaker: 'mentorB', text: 'You need to combine jumping, platform landing, and AI evasion. Good luck, Dev!', trigger: 'onEnter' }
    ],
    code: {
      javascript: `// Capstone: Escape the Arena!
const speed = 170;
const gravity = 820;
const jumpPower = 370;
const enemySpeed = 80;

// Movement
if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

// Platform collision (fully stops user movement)
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

// Ground landing
const groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0;
  state.onGround = true;
}

state.x = Math.max(0, Math.min(world.width - state.width, state.x));

// Enemy Chase AI
const dx = state.x - state.enemyX;
const dy = state.y - state.enemyY;
const dist = Math.sqrt(dx * dx + dy * dy) || 1;
state.enemyX += (dx / dist) * enemySpeed * dt;
state.enemyY += (dy / dist) * enemySpeed * dt;

// Check gem collection
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
speed = 170.0
gravity = 820.0
jump_power = 370.0
enemy_speed = 80.0

# Movement
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

# Platform collision (fully stops user movement)
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

# Ground landing
ground_y = world['groundY'] - state['height']
if state['y'] >= ground_y:
    state['y'] = ground_y
    state['vy'] = 0.0
    state['onGround'] = True

state['x'] = max(0, min(world['width'] - state['width'], state['x']))

# Enemy Chase AI
dx = state['x'] - state['enemyX']
dy = state['y'] - state['enemyY']
dist = (dx * dx + dy * dy) ** 0.5 or 1.0
state['enemyX'] += (dx / dist) * enemy_speed * dt
state['enemyY'] += (dy / dist) * enemy_speed * dt

# Collect gems
if state.get('coins'):
    for coin in state['coins']:
        if not coin.get('collected'):
            cdx = state['x'] + 11 - coin['x']
            cdy = state['y'] + 11 - coin['y']
            if (cdx * cdx + cdy * cdy) ** 0.5 < 28:
                coin['collected'] = True
                state['score'] = (state.get('score') or 0) + 100`,
      cpp: `// C++ Boss Capstone
float speed = 170.0f;
float gravity = 820.0f;
float jumpPower = 370.0f;
float enemySpeed = 80.0f;

if (keys.left) state.vx = -speed;
else if (keys.right) state.vx = speed;
else state.vx = 0.0f;

state.vy += gravity * dt;
if (keys.up && state.onGround) {
  state.vy = -jumpPower;
  state.onGround = false;
}

// Platform collision (fully stops user movement)
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

float groundY = world.groundY - state.height;
if (state.y >= groundY) {
  state.y = groundY;
  state.vy = 0.0f;
  state.onGround = true;
}

state.x = Math.max(0.0f, Math.min(world.width - state.width, state.x));

float dx = state.x - state.enemyX;
float dy = state.y - state.enemyY;
float dist = std::sqrt(dx * dx + dy * dy);
if (dist > 0.001f) {
  state.enemyX += (dx / dist) * enemySpeed * dt;
  state.enemyY += (dy / dist) * enemySpeed * dt;
}

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
