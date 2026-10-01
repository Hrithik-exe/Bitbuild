import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/Editor/CodeEditor';
import { GameCanvas } from './components/Canvas/GameCanvas';
import { LessonNote } from './components/LessonNote';
import { MentorBox } from './components/Mentor/MentorBox';
import { SkillTree } from './components/SkillTree';
import { BugExplainModal } from './components/BugExplainModal';
import { lessons, chapters } from './data/lessons';
import type { Language, Lesson } from './types/lesson';
import { blipAudio } from './services/BlipAudio';
import { pythonRunner } from './services/PythonRunner';

export function App() {
  const [currentLesson, setCurrentLesson] = useState<Lesson>(lessons[0]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [currentXp, setCurrentXp] = useState(0);
  const [activeView, setActiveView] = useState<'sandbox' | 'skilltree'>('sandbox');
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState<string>(lessons[0].code.javascript);
  const [isMuted, setIsMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Click the canvas, then Run ▶');
  const [isError, setIsError] = useState(false);
  const [currentErrorText, setCurrentErrorText] = useState<string | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [updateFn, setUpdateFn] = useState<((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null>(null);

  // Unified compile and run pipeline
  const compileCode = useCallback((sourceCode: string, lang: Language) => {
    try {
      if (lang === 'python' || lang === 'cpp') {
        const result = pythonRunner.compilePython(sourceCode, lang === 'cpp');
        if (!result.success || !result.updateFn) {
          setIsError(true);
          const errText = result.error || 'Compilation Error';
          setStatusMessage(errText);
          setCurrentErrorText(errText);
          setUpdateFn(null);
          blipAudio.playErrorTone();
          return false;
        }
        setUpdateFn(() => result.updateFn);
        setIsError(false);
        setCurrentErrorText(null);
        setStatusMessage('Running simulation — use arrow keys or WASD / Space');
        return true;
      }

      // JavaScript execution engine
      const fn = new Function('state', 'keys', 'dt', 'world', `${sourceCode}\nreturn state;`) as (
        state: Record<string, unknown>,
        keys: Record<string, boolean>,
        dt: number,
        world: Record<string, unknown>
      ) => void;

      // Comprehensive sanity test call with all platform, goal, and coins entities
      fn(
        {
          x: 40,
          y: 40,
          vx: 0,
          vy: 0,
          width: 22,
          height: 22,
          onGround: false,
          enemyX: 400,
          enemyY: 60,
          score: 0,
          coins: [
            { x: 320, y: 110, collected: false },
            { x: 200, y: 190, collected: false },
            { x: 410, y: 200, collected: false }
          ]
        },
        { left: false, right: false, up: false, down: false },
        0.016,
        {
          width: 480,
          height: 280,
          groundY: 240,
          platform: { x: 280, y: 145, w: 100, h: 18 },
          goal: { x: 416, y: 180, w: 38, h: 60 }
        }
      );

      setUpdateFn(() => fn);
      setIsError(false);
      setCurrentErrorText(null);
      setStatusMessage('Running — use arrow keys or WASD / Space');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUpdateFn(null);
      setIsError(true);
      setCurrentErrorText(msg);
      setStatusMessage(`Error: ${msg}`);
      blipAudio.playErrorTone();
      return false;
    }
  }, []);

  // Compile and run current editor code (invoked by Run button)
  const compileAndRun = useCallback(() => {
    compileCode(code, language);
  }, [code, language, compileCode]);

  // Synchronize starter code & auto-start simulation when lesson or language changes
  useEffect(() => {
    const starter = currentLesson.code[language] || currentLesson.code.javascript;
    setCode(starter);
    compileCode(starter, language);
  }, [currentLesson, language, compileCode]);

  // Handle lesson reset
  const handleReset = () => {
    const defaultCode = currentLesson.code[language] || currentLesson.code.javascript;
    setCode(defaultCode);
    compileCode(defaultCode, language);
    setStatusMessage('Lesson code reset & running.');
  };

  // Handle capstone or lesson pass success
  const handleLessonSuccess = () => {
    if (!completedLessonIds.includes(currentLesson.id)) {
      setCompletedLessonIds(prev => [...prev, currentLesson.id]);
      setCurrentXp(prev => prev + currentLesson.xp);
      blipAudio.playSuccessTone();
      setStatusMessage(`🎉 Level Completed! +${currentLesson.xp} XP Earned!`);
    }
  };

  // Switch active lesson
  const loadLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setActiveView('sandbox');
  };

  // Navigation for Next and Prev piece-by-piece lessons
  const currentIdx = lessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  const goToNextLesson = useCallback(() => {
    if (nextLesson) {
      if (!completedLessonIds.includes(currentLesson.id)) {
        setCompletedLessonIds(prev => [...prev, currentLesson.id]);
        setCurrentXp(prev => prev + currentLesson.xp);
        blipAudio.playSuccessTone();
      }
      setCurrentLesson(nextLesson);
      setActiveView('sandbox');
    }
  }, [nextLesson, currentLesson, completedLessonIds]);

  const goToPrevLesson = useCallback(() => {
    if (prevLesson) {
      setCurrentLesson(prevLesson);
      setActiveView('sandbox');
    }
  }, [prevLesson]);

  return (
    <div className="app-container">
      <Header
        currentXp={currentXp}
        activeView={activeView}
        setActiveView={setActiveView}
        language={language}
        setLanguage={setLanguage}
        isMuted={isMuted}
        toggleMute={() => setIsMuted(blipAudio.toggleMute())}
        onExplainBug={() => setIsExplainModalOpen(true)}
      />

      {activeView === 'skilltree' ? (
        <SkillTree
          chapters={chapters}
          lessons={lessons}
          completedLessonIds={completedLessonIds}
          currentLessonId={currentLesson.id}
          onSelectLesson={(lessonId) => {
            const found = lessons.find(l => l.id === lessonId);
            if (found) loadLesson(found);
          }}
        />
      ) : (
        <>
          {/* Lesson Tabs Navigation */}
          <div className="tabs">
            {lessons.map(l => {
              const isCompleted = completedLessonIds.includes(l.id);
              const isActive = l.id === currentLesson.id;
              return (
                <button
                  key={l.id}
                  className={`tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed-tab' : ''}`}
                  onClick={() => loadLesson(l)}
                >
                  <span className="num">{l.num}</span> {l.label}
                  {isCompleted && ' ✓'}
                </button>
              );
            })}
          </div>

          {/* 2-Panel Split Grid Workspace */}
          <div className="grid">
            <CodeEditor
              code={code}
              onChange={setCode}
              onRun={compileAndRun}
              onReset={handleReset}
              language={language}
              filename={language === 'python' ? 'update.py' : language === 'cpp' ? 'update.cpp' : 'update.js'}
              hasError={isError}
            />

            <GameCanvas
              updateFn={updateFn}
              statusMessage={statusMessage}
              isError={isError}
              lessonId={currentLesson.id}
              onSuccess={handleLessonSuccess}
            />
          </div>

          {/* Undertale-style Procedural Mentor Voice Dialogue with Step Navigation */}
          <MentorBox
            dialogueLines={currentLesson.mentorLines}
            onNextLesson={goToNextLesson}
            onPrevLesson={goToPrevLesson}
            hasNextLesson={Boolean(nextLesson)}
            hasPrevLesson={Boolean(prevLesson)}
            nextLessonLabel={nextLesson ? `${nextLesson.num} ${nextLesson.label}` : ''}
            prevLessonLabel={prevLesson ? `${prevLesson.num} ${prevLesson.label}` : ''}
          />

          {/* Detailed Lesson Instructions & Notes */}
          <LessonNote note={currentLesson.note} />
        </>
      )}

      {/* "Explain My Bug" AI Diagnostics Modal Drawer */}
      <BugExplainModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        currentError={currentErrorText}
        lesson={currentLesson}
        code={code}
        language={language}
        onApplyFix={(fixedCode) => {
          setCode(fixedCode);
          compileAndRun();
        }}
      />
    </div>
  );
}
