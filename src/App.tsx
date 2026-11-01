import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { CodeEditor } from './components/Editor/CodeEditor';
import { GameCanvas } from './components/Canvas/GameCanvas';
import { LessonNote } from './components/LessonNote';
import { MentorBox } from './components/Mentor/MentorBox';
import { SkillTree } from './components/SkillTree';
import { BugExplainModal } from './components/BugExplainModal';
import { AuthModal } from './components/Auth/AuthModal';
import { lessons, chapters } from './data/lessons';
import type { Language, Lesson, User, ErrorLineInfo } from './types/lesson';
import { blipAudio } from './services/BlipAudio';
import { pythonRunner, PythonRunnerService } from './services/PythonRunner';
import { authService } from './services/AuthService';

export function App() {
  const navigate = useNavigate();
  const [authChecking, setAuthChecking] = useState(true);
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
  const [errorInfo, setErrorInfo] = useState<ErrorLineInfo | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [engineStatus, setEngineStatus] = useState<string>('V8 JavaScript');
  const [updateFn, setUpdateFn] = useState<((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null>(null);

  // Synchronize authentication and persistent progress on mount.
  // Gated route: Users cannot enter without logging in.
  useEffect(() => {
    let active = true;
    authService.getMe().then(existingUser => {
      if (!active) return;
      if (existingUser) {
        setUser(existingUser);
        setAuthChecking(false);
      } else {
        // Not logged in -> redirect to homepage with login modal open
        navigate('/?auth=required', { replace: true });
      }
    }).catch(() => {
      if (!active) return;
      navigate('/?auth=required', { replace: true });
    });

    authService.getProgress().then(savedProgress => {
      if (!active) return;
      if (savedProgress) {
        if (typeof savedProgress.currentXp === 'number') {
          setCurrentXp(savedProgress.currentXp);
        }
        if (Array.isArray(savedProgress.completedLessonIds) && savedProgress.completedLessonIds.length > 0) {
          setCompletedLessonIds(savedProgress.completedLessonIds);
        }
        if (Array.isArray(savedProgress.completedPieceIds) && savedProgress.completedPieceIds.length > 0) {
          setCompletedPieceIds(savedProgress.completedPieceIds);
        }
        if (savedProgress.currentLessonId) {
          const matchingLesson = lessons.find(l => l.id === savedProgress.currentLessonId);
          if (matchingLesson) {
            setCurrentLesson(matchingLesson);
          }
        }
      }
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  // Update engine status when language changes or Pyodide initializes
  useEffect(() => {
    if (language === 'python') {
      setEngineStatus(pythonRunner.getEngineStatus('python'));
      pythonRunner.initPyodide().then(() => {
        setEngineStatus(pythonRunner.getEngineStatus('python'));
      });
    } else if (language === 'cpp') {
      setEngineStatus('C++ AST Engine');
    } else {
      setEngineStatus('V8 JavaScript');
    }
  }, [language]);

  // Unified compile and run pipeline
  const compileCode = useCallback((sourceCode: string, lang: Language) => {
    try {
      if (lang === 'python' || lang === 'cpp') {
        const result = pythonRunner.compilePython(sourceCode, lang === 'cpp');
        setEngineStatus(result.engine);

        if (!result.success || !result.updateFn) {
          setIsError(true);
          const errText = result.error || 'Compilation Error';
          setStatusMessage(errText);
          setCurrentErrorText(errText);
          setErrorInfo(result.errorLine || PythonRunnerService.parseErrorLine(errText, sourceCode));
          setUpdateFn(null);
          blipAudio.playErrorTone();
          return false;
        }

        setUpdateFn(() => result.updateFn);
        setIsError(false);
        setCurrentErrorText(null);
        setErrorInfo(null);
        setStatusMessage(`Running simulation (${result.engine}) — use arrow keys or WASD / Space`);
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
          platform: { x: 280, y: 170, w: 100, h: 18 },
          goal: { x: 416, y: 180, w: 38, h: 60 }
        }
      );

      setUpdateFn(() => fn);
      setIsError(false);
      setCurrentErrorText(null);
      setErrorInfo(null);
      setEngineStatus('V8 JavaScript');
      setStatusMessage('Running simulation (V8 JavaScript) — use arrow keys or WASD / Space');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUpdateFn(null);
      setIsError(true);
      setCurrentErrorText(msg);
      setErrorInfo(PythonRunnerService.parseErrorLine(msg, sourceCode));
      setStatusMessage(`Error: ${msg}`);
      blipAudio.playErrorTone();
      return false;
    }
  }, []);

  // Compile and run current editor code (invoked by Run button)
  const compileAndRun = useCallback(() => {
    compileCode(code, language);
  }, [code, language, compileCode]);

  // Synchronize starter code & auto-start simulation when lesson, piece, or language changes
  const [currentPieceIndex, setCurrentPieceIndex] = useState(0);
  const [completedPieceIds, setCompletedPieceIds] = useState<string[]>([]);

  // Derive active piece if current lesson has pieces (e.g. Level 2)
  const activePiece = currentLesson.pieces && currentLesson.pieces.length > 0
    ? currentLesson.pieces[currentPieceIndex] || currentLesson.pieces[0]
    : null;

  const activeCode = activePiece
    ? activePiece.code[language] || activePiece.code.javascript
    : currentLesson.code[language] || currentLesson.code.javascript;

  const activeNote = activePiece ? activePiece.note : currentLesson.note;
  const activeMentorLines = activePiece ? activePiece.mentorLines : currentLesson.mentorLines;
  const activeSimId = activePiece ? activePiece.id : currentLesson.id;

  useEffect(() => {
    setCode(activeCode);
    compileCode(activeCode, language);
  }, [activeCode, language, compileCode]);

  // Handle lesson reset
  const handleReset = () => {
    setCode(activeCode);
    compileCode(activeCode, language);
    setErrorInfo(null);
    setStatusMessage('Lesson code reset & running.');
  };

  // Helper to persist state to SQLite / local storage
  const persistState = useCallback((newXp: number, newLessonIds: string[], newPieceIds: string[], lessonId: string) => {
    authService.saveProgress({
      currentXp: newXp,
      completedLessonIds: newLessonIds,
      completedPieceIds: newPieceIds,
      currentLessonId: lessonId
    });
  }, []);

  // Handle capstone or lesson pass success
  const handleLessonSuccess = () => {
    if (!completedLessonIds.includes(currentLesson.id)) {
      const updatedLessons = [...completedLessonIds, currentLesson.id];
      const updatedXp = currentXp + currentLesson.xp;
      setCompletedLessonIds(updatedLessons);
      setCurrentXp(updatedXp);
      blipAudio.playSuccessTone();
      setStatusMessage(`🎉 Level Completed! +${currentLesson.xp} XP Earned!`);
      persistState(updatedXp, updatedLessons, completedPieceIds, currentLesson.id);
    }
  };

  // Switch active lesson
  const loadLesson = useCallback((lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentPieceIndex(0);
    setActiveView('sandbox');
    persistState(currentXp, completedLessonIds, completedPieceIds, lesson.id);
  }, [currentXp, completedLessonIds, completedPieceIds, persistState]);

  // Navigation for Next and Prev piece-by-piece lessons
  const currentIdx = lessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  const hasNext = Boolean(
    (currentLesson.pieces && currentPieceIndex < currentLesson.pieces.length - 1) || nextLesson
  );
  const hasPrev = Boolean(
    (currentLesson.pieces && currentPieceIndex > 0) || prevLesson
  );

  let nextLabel = '';
  if (currentLesson.pieces && currentPieceIndex < currentLesson.pieces.length - 1) {
    const np = currentLesson.pieces[currentPieceIndex + 1];
    nextLabel = `${np.num}: ${np.label}`;
  } else if (nextLesson) {
    nextLabel = `${nextLesson.num} ${nextLesson.label}`;
  }

  let prevLabel = '';
  if (currentLesson.pieces && currentPieceIndex > 0) {
    const pp = currentLesson.pieces[currentPieceIndex - 1];
    prevLabel = `${pp.num}: ${pp.label}`;
  } else if (prevLesson) {
    prevLabel = `${prevLesson.num} ${prevLesson.label}`;
  }

  const goToNextStep = useCallback(() => {
    if (currentLesson.pieces && currentPieceIndex < currentLesson.pieces.length - 1) {
      let updatedPieces = completedPieceIds;
      let updatedXp = currentXp;
      if (activePiece && !completedPieceIds.includes(activePiece.id)) {
        updatedPieces = [...completedPieceIds, activePiece.id];
        updatedXp = currentXp + 25;
        setCompletedPieceIds(updatedPieces);
        setCurrentXp(updatedXp);
        blipAudio.playSuccessTone();
      }
      setCurrentPieceIndex(prev => prev + 1);
      persistState(updatedXp, completedLessonIds, updatedPieces, currentLesson.id);
    } else if (nextLesson) {
      let updatedLessons = completedLessonIds;
      let updatedXp = currentXp;
      if (!completedLessonIds.includes(currentLesson.id)) {
        updatedLessons = [...completedLessonIds, currentLesson.id];
        updatedXp = currentXp + currentLesson.xp;
        setCompletedLessonIds(updatedLessons);
        setCurrentXp(updatedXp);
        blipAudio.playSuccessTone();
      }
      loadLesson(nextLesson);
      persistState(updatedXp, updatedLessons, completedPieceIds, nextLesson.id);
    }
  }, [currentLesson, currentPieceIndex, activePiece, completedPieceIds, completedLessonIds, nextLesson, currentXp, persistState, loadLesson]);

  const goToPrevStep = useCallback(() => {
    if (currentLesson.pieces && currentPieceIndex > 0) {
      setCurrentPieceIndex(prev => prev - 1);
    } else if (prevLesson) {
      loadLesson(prevLesson);
    }
  }, [currentLesson, currentPieceIndex, prevLesson, loadLesson]);

  // Handle Authentication Callbacks
  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    authService.getProgress().then(savedProgress => {
      if (savedProgress) {
        if (typeof savedProgress.currentXp === 'number') setCurrentXp(savedProgress.currentXp);
        if (Array.isArray(savedProgress.completedLessonIds)) setCompletedLessonIds(savedProgress.completedLessonIds);
        if (Array.isArray(savedProgress.completedPieceIds)) setCompletedPieceIds(savedProgress.completedPieceIds);
      }
    });
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    navigate('/', { replace: true });
  };

  if (authChecking) {
    return (
      <div className="app-container" style={{ display: 'grid', placeItems: 'center', height: '100vh', background: '#090B10' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4FD1C5', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="live-dot" />
          VERIFYING ACCESS CREDENTIALS...
        </div>
      </div>
    );
  }

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
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
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
        <div className="sandbox-layout">
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

          {/* Sub-step Pieces Bar for Level 2 (and any multi-piece level) */}
          {currentLesson.pieces && currentLesson.pieces.length > 0 && (
            <div className="level-pieces-bar">
              <span className="pieces-bar-title">{currentLesson.label}:</span>
              <div className="pieces-pills">
                {currentLesson.pieces.map((piece, idx) => {
                  const isActive = idx === currentPieceIndex;
                  const isDone = completedPieceIds.includes(piece.id);
                  return (
                    <button
                      key={piece.id}
                      className={`piece-pill ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                      onClick={() => setCurrentPieceIndex(idx)}
                    >
                      <span className="piece-num">{idx + 1}</span>
                      <span className="piece-title">{piece.label}</span>
                      {isDone && <span className="piece-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2-Panel Split Grid Workspace */}
          <div className="grid">
            <CodeEditor
              code={code}
              onChange={(newCode) => {
                setCode(newCode);
                if (errorInfo) setErrorInfo(null);
              }}
              onRun={compileAndRun}
              onReset={handleReset}
              language={language}
              filename={language === 'python' ? 'update.py' : language === 'cpp' ? 'update.cpp' : 'update.js'}
              hasError={isError}
              errorInfo={errorInfo}
              engineStatus={engineStatus}
            />

            <GameCanvas
              updateFn={updateFn}
              statusMessage={statusMessage}
              isError={isError}
              lessonId={activeSimId}
              onSuccess={handleLessonSuccess}
            />
          </div>

          {/* Undertale-style Procedural Mentor Voice Dialogue with Step Navigation */}
          <MentorBox
            dialogueLines={activeMentorLines}
            onNextLesson={goToNextStep}
            onPrevLesson={goToPrevStep}
            hasNextLesson={hasNext}
            hasPrevLesson={hasPrev}
            nextLessonLabel={nextLabel}
            prevLessonLabel={prevLabel}
          />

          {/* Detailed Lesson Instructions & Notes */}
          <LessonNote note={activeNote} />
        </div>
      )}

      {/* "Explain My Bug" AI & Frame-Rate Diagnostics Modal */}
      <BugExplainModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        currentError={currentErrorText}
        lesson={currentLesson}
        code={code}
        language={language}
        updateFn={updateFn}
        onApplyFix={(fixedCode) => {
          setCode(fixedCode);
          compileCode(fixedCode, language);
        }}
      />

      {/* Sign In & Registration Modal with SQLite Local Persistence */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
