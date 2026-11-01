// Headless Dynamic Multi-Rate Physics Benchmark for BitBuild
// Rigorously tests simulation code at 30 FPS, 60 FPS, and 120 FPS to detect frame-rate coupling
import type { BenchmarkResult, FrameRateRateResult } from '../types/lesson';

export class BenchmarkRunner {
  public static runFrameRateBenchmark(
    updateFn: ((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null,
    sourceCode: string
  ): BenchmarkResult {
    // 1. Static Code Analysis Check
    const hasDtStatic = sourceCode.includes('dt');
    const hasCoupledIncrement = /(\bstate\.(?:x|y|vx|vy)\s*\+=\s*(?![^;\n]*\bdt\b)[0-9a-zA-Z_.]+)/.test(sourceCode);

    if (!updateFn) {
      return {
        passed: false,
        rates: [],
        divergencePercent: 100,
        summary: 'Cannot run benchmark: Code failed compilation or updateFn is null.',
        recommendation: 'Fix syntax and compilation errors first before evaluating frame-rate independence.'
      };
    }

    // 2. Dynamic Runtime Simulation Harness
    const testRates = [
      { fps: 30, dt: 1 / 30, steps: 30 },   // Exactly 1.0 second simulation
      { fps: 60, dt: 1 / 60, steps: 60 },   // Exactly 1.0 second simulation
      { fps: 120, dt: 1 / 120, steps: 120 } // Exactly 1.0 second simulation
    ];

    const rateResults: FrameRateRateResult[] = [];

    for (const rate of testRates) {
      // Cloned clean initial sandbox state for each trial
      const testState: Record<string, unknown> = {
        x: 40,
        y: 200,
        vx: 0,
        vy: 0,
        width: 22,
        height: 22,
        onGround: true,
        enemyX: 400,
        enemyY: 60,
        score: 0,
        coins: []
      };

      const testKeys: Record<string, boolean> = {
        left: false,
        right: true, // Simulate moving right
        up: false,
        down: false
      };

      const testWorld: Record<string, unknown> = {
        width: 480,
        height: 280,
        groundY: 240
      };

      try {
        for (let i = 0; i < rate.steps; i++) {
          updateFn(testState, testKeys, rate.dt, testWorld);
        }
      } catch (err) {
        return {
          passed: false,
          rates: [],
          divergencePercent: 100,
          summary: `Simulation exception during dynamic benchmark: ${err instanceof Error ? err.message : String(err)}`,
          recommendation: 'Check variable definitions and bounds clamping.'
        };
      }

      const finalX = typeof testState.x === 'number' ? testState.x : 40;
      const displacement = Math.round((finalX - 40) * 100) / 100;
      rateResults.push({
        fps: rate.fps,
        dt: rate.dt,
        displacement
      });
    }

    // 3. Mathematical Divergence Calculation
    const d30 = rateResults.find(r => r.fps === 30)?.displacement || 0;
    const d60 = rateResults.find(r => r.fps === 60)?.displacement || 0;
    const d120 = rateResults.find(r => r.fps === 120)?.displacement || 0;

    const base = Math.max(Math.abs(d60), 1.0);
    const maxDiff = Math.max(Math.abs(d120 - d60), Math.abs(d60 - d30), Math.abs(d120 - d30));
    const divergencePercent = Math.round((maxDiff / base) * 100);

    // If divergence is within 5%, the physics are mathematically frame-rate independent!
    const passed = divergencePercent < 6 && (hasDtStatic || d60 === 0);

    let summary = '';
    let recommendation = '';

    if (passed) {
      summary = `PASSED — Frame-Rate Independent (Divergence: ${divergencePercent}% across 30, 60, and 120 FPS).`;
      recommendation = 'Excellent! Your movement scales linearly with delta-time (dt). The simulation speed will be identical across 60Hz and 144Hz monitors.';
    } else {
      summary = `FAILED — Frame-Rate Coupling Detected! Physics moved ${d30}px @ 30 FPS vs ${d120}px @ 120 FPS (${divergencePercent}% divergence).`;
      recommendation = hasCoupledIncrement
        ? 'Suspicious non-scaled state increment detected. Replace state.x += speed with state.x += speed * dt.'
        : 'Ensure all velocity and position additions are multiplied by deltaTime (dt).';
    }

    return {
      passed,
      rates: rateResults,
      divergencePercent,
      summary,
      recommendation
    };
  }
}

