import React from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle, Code } from 'lucide-react';
import type { Lesson, Language } from '../types/lesson';

interface BugExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentError: string | null;
  lesson: Lesson;
  code: string;
  language: Language;
  onApplyFix?: (fixedCode: string) => void;
}

export const BugExplainModal: React.FC<BugExplainModalProps> = ({
  isOpen,
  onClose,
  currentError,
  lesson,
  code,
  onApplyFix
}) => {
  if (!isOpen) return null;

  // Generate intelligent diagnostic explanation based on code & error context
  const getDiagnostic = () => {
    if (currentError) {
      return {
        issue: 'Syntax or Runtime Exception Detected',
        explanation: `The execution engine encountered an error: "${currentError}". This usually occurs when a variable is referenced before definition, or a bracket/colon is missing.`,
        recommendation: 'Check line numbers in the editor where the red indicator appears and verify your parameter syntax.',
        suggestedCode: lesson.code.javascript
      };
    }

    if (!code.includes('dt')) {
      return {
        issue: 'Frame-Rate Coupling Bug',
        explanation: 'Your code updates state without multiplying by deltaTime (dt). On high refresh rate monitors (e.g. 120Hz/144Hz), the simulation will run twice as fast!',
        recommendation: 'Multiply velocity and position increments by dt: e.g. state.x += speed * dt;',
        suggestedCode: lesson.code.javascript
      };
    }

    return {
      issue: 'Code Check & Performance Optimization',
      explanation: 'Your code structure looks correct! Remember to keep collision boundaries clamped within world boundaries to prevent sprite clipping.',
      recommendation: 'Use Math.max(0, Math.min(world.width - state.width, state.x)) to keep the sprite strictly on screen.',
      suggestedCode: lesson.code.javascript
    };
  };

  const diag = getDiagnostic();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} className="text-amber" />
            <span>"Explain My Bug" — AI Mentor Diagnostic</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="diag-card issue-card">
            <div className="diag-title">
              <AlertTriangle size={16} className="text-error" />
              <span>{diag.issue}</span>
            </div>
            <p>{diag.explanation}</p>
          </div>

          <div className="diag-card rec-card">
            <div className="diag-title">
              <CheckCircle size={16} className="text-teal" />
              <span>Recommended Fix</span>
            </div>
            <p>{diag.recommendation}</p>
          </div>

          <div className="code-diff-preview">
            <div className="diff-header">
              <Code size={14} />
              <span>Reference Starter Implementation</span>
            </div>
            <pre className="code-block">{diag.suggestedCode}</pre>
          </div>
        </div>

        <div className="modal-footer">
          {onApplyFix && (
            <button
              className="btn-apply-fix"
              onClick={() => {
                onApplyFix(diag.suggestedCode);
                onClose();
              }}
            >
              Apply Reference Code Fix
            </button>
          )}
          <button className="btn-close-modal" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
