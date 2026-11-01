import { useCallback, useEffect, useState } from 'react';
import { CodeEditor } from '../components/Editor/CodeEditor';
import { GameCanvas } from '../components/Canvas/GameCanvas';
import { PythonRunnerService } from '../services/PythonRunner';
import { lessons } from '../data/lessons';
import type { ErrorLineInfo } from '../types/lesson';

type UpdateFn = (state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void;

/**
 * The actual BitBuild editor + simulation canvas, wired the same way App.tsx
 * wires them for JavaScript (same compile + sanity-check pipeline). It is only
 * mounted while on screen because GameCanvas listens for arrow keys / space on
 * window and would otherwise block normal page scrolling with the keyboard.
 */
export default function LiveLab() {
  const lesson = lessons[0];
  const [code, setCode] = useState(lesson.code.javascript);
  const [updateFn, setUpdateFn] = useState<UpdateFn | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorLineInfo | null>(null);
  const [isError, setIsError] = useState(false);
  const [status, setStatus] = useState('Press Run, then use arrow keys or WASD');

  const compile = useCallback((src: string) => {
    try {
      const fn = new Function('state', 'keys', 'dt', 'world', `${src}\nreturn state;`) as UpdateFn;
      fn(
        { x: 40, y: 40, vx: 0, vy: 0, width: 22, height: 22, onGround: false, enemyX: 400, enemyY: 60, score: 0, coins: [] },
        { left: false, right: false, up: false, down: false },
        0.016,
        { width: 480, height: 280, groundY: 240, platform: null, goal: null },
      );
      setUpdateFn(() => fn);
      setIsError(false);
      setErrorInfo(null);
      setStatus('Running (V8 JavaScript). Arrow keys or WASD to move.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUpdateFn(null);
      setIsError(true);
      setErrorInfo(PythonRunnerService.parseErrorLine(msg, src));
      setStatus(`Error: ${msg}`);
    }
  }, []);

  useEffect(() => {
    compile(lesson.code.javascript);
  }, [compile, lesson]);

  return (
    <div className="grid">
      <CodeEditor
        code={code}
        onChange={(c) => {
          setCode(c);
          if (errorInfo) setErrorInfo(null);
        }}
        onRun={() => compile(code)}
        onReset={() => {
          setCode(lesson.code.javascript);
          compile(lesson.code.javascript);
        }}
        language="javascript"
        filename="update.js"
        hasError={isError}
        errorInfo={errorInfo}
        engineStatus="V8 JavaScript"
      />
      <GameCanvas updateFn={updateFn} statusMessage={status} isError={isError} lessonId={lesson.id} />
    </div>
  );
}
