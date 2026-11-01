import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Code, Gauge, ShieldAlert, Cpu } from 'lucide-react';
import type { Lesson, Language, BenchmarkResult } from '../types/lesson';
import { BenchmarkRunner } from '../services/BenchmarkRunner';

interface BugExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentError: string | null;
  lesson: Lesson;
  code: string;
  language: Language;
  updateFn?: ((state: Record<string, unknown>, keys: Record<string, boolean>, dt: number, world: Record<string, unknown>) => void) | null;
  onApplyFix?: (fixedCode: string) => void;
}

export const BugExplainModal: React.FC<BugExplainModalProps> = ({
  isOpen,
  onClose,
  currentError,
  lesson,
  code,
  language,
  updateFn = null,
  onApplyFix
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'benchmark'>('ai');
  const [diagResult, setDiagResult] = useState<{
    issue: string;
    explanation: string;
    recommendation: string;
    suggestedCode: string;
    isAiGenerated: boolean;
    mode: string;
  }>({
    issue: 'Analyzing code...',
    explanation: 'Checking syntax, runtime context, and frame-rate parameters...',
    recommendation: 'Please wait...',
    suggestedCode: lesson.code[language] || lesson.code.javascript,
    isAiGenerated: false,
    mode: 'Local Heuristic Analysis'
  });
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

  // Fetch AI or Heuristic diagnostic from backend
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingAi(true);

    // Run dynamic frame rate benchmark
    const bench = BenchmarkRunner.runFrameRateBenchmark(updateFn, code);
    setBenchmarkResult(bench);

    // Call server AI diagnostic endpoint with heuristic fallback
    fetch('/api/ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        error: currentError,
        language,
        lessonTitle: lesson.label,
        lessonNote: lesson.note
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setDiagResult({
          issue: data.issue || 'Diagnostic Complete',
          explanation: data.explanation || '',
          recommendation: data.recommendation || '',
          suggestedCode: data.suggestedCode || lesson.code[language] || lesson.code.javascript,
          isAiGenerated: Boolean(data.isAiGenerated),
          mode: data.mode || (data.isAiGenerated ? 'AI-Powered (Gemini API)' : 'Heuristic Fallback (No API Key Configured)')
        });
      })
      .catch(() => {
        if (!isMounted) return;
        // Offline / client fallback
        const fallbackCode = lesson.code[language] || lesson.code.javascript;
        if (currentError) {
          setDiagResult({
            issue: 'Syntax or Runtime Exception Detected',
            explanation: `The execution engine encountered an error: "${currentError}". Check line numbers in the editor where red indicator appears.`,
            recommendation: 'Verify syntax, spelling, and function signatures against the lesson guide.',
            suggestedCode: fallbackCode,
            isAiGenerated: false,
            mode: 'Heuristic Fallback (Local Engine)'
          });
        } else if (!code.includes('dt')) {
          setDiagResult({
            issue: 'Frame-Rate Coupling Bug',
            explanation: 'Your code updates state without multiplying by deltaTime (dt). On high refresh rate monitors (120Hz/144Hz), the simulation will run twice as fast!',
            recommendation: 'Multiply velocity and position increments by dt: e.g. state.x += speed * dt;',
            suggestedCode: fallbackCode,
            isAiGenerated: false,
            mode: 'Heuristic Fallback (Local Engine)'
          });
        } else {
          setDiagResult({
            issue: 'Code Check & Boundary Validation',
            explanation: 'Your code compiles! Ensure your coordinates stay clamped within world boundaries.',
            recommendation: 'Use Math.max and Math.min boundary clamps to prevent sprites clipping out of view.',
            suggestedCode: fallbackCode,
            isAiGenerated: false,
            mode: 'Heuristic Fallback (Local Engine)'
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, code, currentError, language, lesson, updateFn]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} className="text-amber" />
            <span>"Explain My Bug" — AI & Frame-Rate Diagnostics</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Diagnostic Tabs */}
        <div className="diag-nav-tabs">
          <button
            type="button"
            className={`diag-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <ShieldAlert size={14} />
            <span>AI Code Diagnosis</span>
          </button>
          <button
            type="button"
            className={`diag-tab-btn ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => setActiveTab('benchmark')}
          >
            <Gauge size={14} />
            <span>Frame-Rate Benchmark</span>
            {benchmarkResult && !benchmarkResult.passed && (
              <span className="tab-warn-badge">Coupled</span>
            )}
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'ai' ? (
            <>
              {/* Engine Source Badge */}
              <div className="engine-badge-bar">
                <span className={`engine-badge ${diagResult.isAiGenerated ? 'badge-ai' : 'badge-heuristic'}`}>
                  {diagResult.isAiGenerated ? <Sparkles size={13} /> : <Cpu size={13} />}
                  <span>Engine: {diagResult.mode}</span>
                </span>
                {isLoadingAi && <span className="analyzing-spinner">Analyzing code...</span>}
              </div>

              <div className="diag-card issue-card">
                <div className="diag-title">
                  <AlertTriangle size={16} className="text-error" />
                  <span>{diagResult.issue}</span>
                </div>
                <p>{diagResult.explanation}</p>
              </div>

              <div className="diag-card rec-card">
                <div className="diag-title">
                  <CheckCircle size={16} className="text-teal" />
                  <span>Recommended Correction</span>
                </div>
                <p>{diagResult.recommendation}</p>
              </div>

              <div className="code-diff-preview">
                <div className="diff-header">
                  <Code size={14} />
                  <span>Reference {language.toUpperCase()} Solution</span>
                </div>
                <pre className="code-block">{diagResult.suggestedCode}</pre>
              </div>
            </>
          ) : (
            <div className="benchmark-panel">
              <div className="benchmark-header-row">
                <div className="benchmark-title">
                  <Gauge size={16} className="text-amber" />
                  <span>Empirical Multi-Rate Physics Benchmark</span>
                </div>
                {benchmarkResult && (
                  <span className={`benchmark-status-badge ${benchmarkResult.passed ? 'status-pass' : 'status-fail'}`}>
                    {benchmarkResult.passed ? '✓ Frame-Rate Independent' : '⚠ Frame-Rate Coupled'}
                  </span>
                )}
              </div>

              <p className="benchmark-desc">
                Tests code simulation at simulated <strong>30 FPS</strong>, <strong>60 FPS</strong>, and <strong>120 FPS</strong> over 1.0 second of simulation time to verify physics delta-time scaling.
              </p>

              {benchmarkResult && (
                <>
                  <div className="benchmark-metrics-grid">
                    {benchmarkResult.rates.map(rate => (
                      <div key={rate.fps} className="rate-card">
                        <div className="rate-fps">{rate.fps} FPS</div>
                        <div className="rate-dt">dt = {rate.dt.toFixed(4)}s</div>
                        <div className="rate-displacement">
                          Displacement: <b className="text-teal">{rate.displacement}px</b>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`diag-card ${benchmarkResult.passed ? 'rec-card' : 'issue-card'}`}>
                    <div className="diag-title">
                      {benchmarkResult.passed ? <CheckCircle size={16} className="text-teal" /> : <AlertTriangle size={16} className="text-error" />}
                      <span>{benchmarkResult.summary}</span>
                    </div>
                    <p>{benchmarkResult.recommendation}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {onApplyFix && (
            <button
              className="btn-apply-fix"
              onClick={() => {
                onApplyFix(diagResult.suggestedCode);
                onClose();
              }}
            >
              Apply Reference Code Fix
            </button>
          )}
          <button className="btn-close-modal" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
