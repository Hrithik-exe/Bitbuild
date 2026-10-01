// Python Execution Sandbox Runner for BitBuild

interface ExecResult {
  success: boolean;
  error?: string;
  updateFn?: (state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void;
}

export class PythonRunnerService {
  private pyodide: unknown = null;
  private isLoading: boolean = false;

  public async initPyodide(): Promise<boolean> {
    if (this.pyodide) return true;
    if (this.isLoading) return false;
    this.isLoading = true;

    try {
      if (typeof window !== 'undefined' && (window as unknown as { loadPyodide?: () => Promise<unknown> }).loadPyodide) {
        this.pyodide = await (window as unknown as { loadPyodide: () => Promise<unknown> }).loadPyodide();
        this.isLoading = false;
        return true;
      }
    } catch {
      // Ignore Pyodide script error, fallback to JS transpiled runner
    }
    this.isLoading = false;
    return false;
  }

  public compilePython(code: string, isCpp: boolean = false): ExecResult {
    try {
      let jsCode = '';

      if (isCpp) {
        jsCode = code
          .replace(/\b(float|double|int|auto|bool)\b/g, 'let')
          .replace(/(\d+\.?\d*)f\b/g, '$1')
          .replace(/std::clamp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g, 'Math.max($2, Math.min($3, $1))')
          .replace(/std::sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
      } else {
        // 1. Strip comments
        let text = code.replace(/#.*$/gm, '');

        // 2. Token replacements
        text = text
          .replace(/\band\b/g, '&&')
          .replace(/\bor\b/g, '||')
          .replace(/\bnot\b/g, '!')
          .replace(/\bTrue\b/g, 'true')
          .replace(/\bFalse\b/g, 'false')
          .replace(/\bNone\b/g, 'null')
          .replace(/state\['(\w+)'\]/g, 'state.$1')
          .replace(/world\['(\w+)'\]/g, 'world.$1')
          .replace(/keys\['(\w+)'\]/g, 'keys.$1')
          .replace(/p\['(\w+)'\]/g, 'p.$1')
          .replace(/\bmax\(/g, 'Math.max(')
          .replace(/\bmin\(/g, 'Math.min(');

        const lines = text.split('\n');
        const resultLines: string[] = [];
        const indentStack: number[] = [];

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i];
          const trimmed = rawLine.trim();

          if (!trimmed) {
            resultLines.push('');
            continue;
          }

          const currentIndent = rawLine.search(/\S/);

          if (trimmed.startsWith('elif ') && trimmed.endsWith(':')) {
            while (indentStack.length > 0 && indentStack[indentStack.length - 1] > currentIndent) {
              indentStack.pop();
            }
            const cond = trimmed.slice(5, -1).trim();
            resultLines.push(' '.repeat(currentIndent) + `} else if (${cond}) {`);
            if (!indentStack.includes(currentIndent)) indentStack.push(currentIndent);
            continue;
          }

          if (trimmed === 'else:') {
            while (indentStack.length > 0 && indentStack[indentStack.length - 1] > currentIndent) {
              indentStack.pop();
            }
            resultLines.push(' '.repeat(currentIndent) + `} else {`);
            if (!indentStack.includes(currentIndent)) indentStack.push(currentIndent);
            continue;
          }

          while (indentStack.length > 0 && indentStack[indentStack.length - 1] >= currentIndent) {
            indentStack.pop();
            resultLines.push(' '.repeat(currentIndent) + '}');
          }

          if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
            const cond = trimmed.slice(3, -1).trim();
            resultLines.push(' '.repeat(currentIndent) + `if (${cond}) {`);
            indentStack.push(currentIndent);
            continue;
          }

          if (trimmed.endsWith(':')) {
            const body = trimmed.slice(0, -1).trim();
            resultLines.push(' '.repeat(currentIndent) + `${body} {`);
            indentStack.push(currentIndent);
            continue;
          }

          resultLines.push(' '.repeat(currentIndent) + trimmed + ';');
        }

        while (indentStack.length > 0) {
          indentStack.pop();
          resultLines.push('}');
        }

        jsCode = resultLines.join('\n');
      }

      const fn = new Function('state', 'keys', 'dt', 'world', `${jsCode}\nreturn state;`) as (
        state: Record<string, unknown>,
        keys: Record<string, boolean>,
        dt: number,
        world: Record<string, unknown>
      ) => void;

      // Sanity dry run check
      fn(
        { x: 40, y: 40, vx: 0, vy: 0, width: 22, height: 22, onGround: false, enemyX: 400, enemyY: 60, score: 0, coins: [] },
        { left: false, right: false, up: false, down: false },
        0.016,
        { width: 480, height: 280, groundY: 240, platform: { x: 280, y: 145, w: 100, h: 18 }, goal: { x: 420, y: 190, w: 32, h: 48 } }
      );

      return {
        success: true,
        updateFn: fn
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `${isCpp ? 'C++' : 'Python'} Syntax/Runtime Error: ${msg}`
      };
    }
  }
}

export const pythonRunner = new PythonRunnerService();
