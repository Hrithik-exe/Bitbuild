// Automated Test Suite for BitBuild Implementation Features
import { registerUser, loginUser, getUserProgress, saveUserProgress, getUserFromSession } from './server/db.js';
import { PythonRunnerService } from './src/services/PythonRunner.ts';
import { BenchmarkRunner } from './src/services/BenchmarkRunner.ts';

console.log('=== BITBUILD COMPREHENSIVE FEATURE TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}: ${detail}`);
  }
}

// TEST 1: User Authentication & Registration
console.log('--- 1. Authentication & SQLite Database Persistence ---');
const testUsername = 'test_engineer_' + Date.now().toString(36);
const testEmail = `${testUsername}@bitbuild.edu`;
const testPass = 'SecureP@ss123';

try {
  const regResult = registerUser(testUsername, testEmail, testPass);
  assert(regResult.user && regResult.user.username === testUsername, 'User Registration in SQLite Database');
  assert(typeof regResult.token === 'string' && regResult.token.startsWith('tok_'), 'Session Token Generated');

  // Verify session retrieval
  const sessionUser = getUserFromSession(regResult.token);
  assert(sessionUser && sessionUser.username === testUsername, 'Session Token Authenticates Correct User');

  // Verify Login with correct credentials
  const loginResult = loginUser(testUsername, testPass);
  assert(loginResult.user.id === regResult.user.id, 'User Login with Correct Password');

  // Verify Login rejection with wrong password
  let wrongPassCaught = false;
  try {
    loginUser(testUsername, 'WrongPassword!');
  } catch (e) {
    wrongPassCaught = true;
  }
  assert(wrongPassCaught, 'Password Validation Rejects Incorrect Credentials');

  // TEST 2: Persistent User Progress Storage
  console.log('\n--- 2. Persistent User Progress & XP Storage ---');
  const initialProg = getUserProgress(regResult.user.id);
  assert(initialProg.currentXp === 0, 'Initial Progress Starts at 0 XP');

  const updatedProg = saveUserProgress(regResult.user.id, {
    currentXp: 350,
    completedLessonIds: ['move', 'gravity'],
    completedPieceIds: ['gravity-1', 'gravity-2'],
    currentLessonId: 'collision',
    codeDrafts: { move: { javascript: 'state.x += speed * dt;' } }
  });

  assert(updatedProg.currentXp === 350, 'User Progress XP Saved to Database (350 XP)');
  assert(updatedProg.completedLessonIds.length === 2 && updatedProg.completedLessonIds.includes('gravity'), 'Completed Lessons Saved in Database');
  assert(updatedProg.currentLessonId === 'collision', 'Active Level Restored in Database');

  // Verify user isolation: another query retrieves exact saved state
  const reloadedProg = getUserProgress(regResult.user.id);
  assert(reloadedProg.currentXp === 350 && reloadedProg.completedPieceIds.includes('gravity-1'), 'Database Persistence Verified Across Queries');

} catch (err) {
  console.error('Auth/DB Test Error:', err);
}

// TEST 3: Dynamic Multi-Rate Frame-Rate Coupling Benchmark
console.log('\n--- 3. Dynamic Frame-Rate Coupling Benchmark ---');

// A. Code WITH delta-time scaling (Frame-rate independent)
const uncoupledCode = `
const speed = 150.0;
if (keys.right) state.x += speed * dt;
`;
const uncoupledFn = new Function('state', 'keys', 'dt', 'world', `${uncoupledCode}\nreturn state;`);
const uncoupledBench = BenchmarkRunner.runFrameRateBenchmark(uncoupledFn, uncoupledCode);

assert(uncoupledBench.passed, 'Benchmark Passes Frame-Rate Independent Code (dt scaled)');
assert(uncoupledBench.divergencePercent <= 5, `Measured Divergence is Minimal (${uncoupledBench.divergencePercent}%)`);
console.log(`   Rate Displacements: 30 FPS=${uncoupledBench.rates[0]?.displacement}px, 60 FPS=${uncoupledBench.rates[1]?.displacement}px, 120 FPS=${uncoupledBench.rates[2]?.displacement}px`);

// B. Code WITHOUT delta-time scaling (Coupled to frame-rate)
const coupledCode = `
const speed = 5.0; // Hardcoded per-frame movement without dt!
if (keys.right) state.x += speed;
`;
const coupledFn = new Function('state', 'keys', 'dt', 'world', `${coupledCode}\nreturn state;`);
const coupledBench = BenchmarkRunner.runFrameRateBenchmark(coupledFn, coupledCode);

assert(!coupledBench.passed, 'Benchmark Detects and Fails Frame-Rate Coupled Code (missing dt)');
assert(coupledBench.divergencePercent > 50, `Substantial Divergence Detected (${coupledBench.divergencePercent}%)`);
console.log(`   Coupled Displacements: 30 FPS=${coupledBench.rates[0]?.displacement}px, 60 FPS=${coupledBench.rates[1]?.displacement}px, 120 FPS=${coupledBench.rates[2]?.displacement}px`);

// TEST 4: Python & C++ Execution Sandbox
console.log('\n--- 4. Python & C++ Execution Service ---');
const runner = new PythonRunnerService();

// Python valid compilation
const pyCode = `
# Python Movement Update
speed = 150.0
if keys.get('right'):
    state['x'] += speed * dt
`;
const pyResult = runner.compilePython(pyCode, false);
assert(pyResult.success && typeof pyResult.updateFn === 'function', 'Python Compilation to Executable Update Function');

// Test running the compiled Python update function
const pyState = { x: 50, y: 50 };
pyResult.updateFn(pyState, { right: true }, 0.016, { width: 480, height: 280 });
assert(pyState.x > 50, `Python Execution Mutates State Correctly (new x: ${pyState.x})`);

// C++ valid compilation
const cppCode = `
float speed = 150.0f;
if (keys.right) {
    state.x += speed * dt;
}
state.x = std::clamp(state.x, 0.0f, world.width - state.width);
`;
const cppResult = runner.compilePython(cppCode, true);
assert(cppResult.success && typeof cppResult.updateFn === 'function', 'C++ Compilation to Executable Update Function');

// Test running the compiled C++ update function
const cppState = { x: 50, width: 22 };
cppResult.updateFn(cppState, { right: true }, 0.016, { width: 480, height: 280 });
assert(cppState.x > 50, `C++ Execution Mutates State Correctly (new x: ${cppState.x})`);

// TEST 5: Error Line Parsing
console.log('\n--- 5. Error Line Number Detection for Editor Highlighting ---');
const sampleErrorMsg = 'SyntaxError: Unexpected token on line 4 in update.js';
const sampleCode = 'line 1\nline 2\nline 3\nline 4\nline 5';
const parsedError = PythonRunnerService.parseErrorLine(sampleErrorMsg, sampleCode);
assert(parsedError.line === 4, `Error Line Correctly Extracted (Detected Line: ${parsedError.line})`);

console.log(`\n=== RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}

