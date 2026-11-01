import React, { useEffect, useRef } from 'react';
import { EditorState, StateField, StateEffect, RangeSet } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, Decoration, type DecorationSet, gutter, GutterMarker } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, RotateCcw, FileCode, AlertCircle, Cpu } from 'lucide-react';
import type { Language, ErrorLineInfo } from '../../types/lesson';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  language: Language;
  filename?: string;
  hasError?: boolean;
  errorInfo?: ErrorLineInfo | null;
  engineStatus?: string;
}

// CodeMirror 6 Line Error Highlight & Gutter Indicator Extension
const setErrorEffect = StateEffect.define<ErrorLineInfo | null>();

class ErrorGutterMarker extends GutterMarker {
  message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-error-gutter-marker';
    el.title = this.message;
    el.textContent = '●';
    return el;
  }
}

const errorField = StateField.define<{ lineDeco: DecorationSet; errorInfo: ErrorLineInfo | null }>({
  create() {
    return { lineDeco: Decoration.none, errorInfo: null };
  },
  update(value, tr) {
    let lineDeco = value.lineDeco.map(tr.changes);
    let errorInfo = value.errorInfo;

    for (const effect of tr.effects) {
      if (effect.is(setErrorEffect)) {
        errorInfo = effect.value;
        if (!effect.value) {
          return { lineDeco: Decoration.none, errorInfo: null };
        }
        const { line, message } = effect.value;
        const doc = tr.state.doc;
        if (line >= 1 && line <= doc.lines) {
          const lineObj = doc.line(line);
          const deco = Decoration.line({
            attributes: {
              class: 'cm-error-line',
              title: message
            }
          }).range(lineObj.from);
          return { lineDeco: Decoration.set([deco]), errorInfo };
        }
      }
    }

    // Automatically clear line error decorations when user types
    if (tr.docChanged) {
      return { lineDeco: Decoration.none, errorInfo: null };
    }

    return { lineDeco, errorInfo };
  },
  provide: (f) => EditorView.decorations.from(f, (val) => val.lineDeco)
});

const errorGutter = gutter({
  class: 'cm-error-gutter',
  markers(view) {
    const state = view.state.field(errorField);
    if (!state.errorInfo || state.errorInfo.line < 1 || state.errorInfo.line > view.state.doc.lines) {
      return RangeSet.empty;
    }
    const line = view.state.doc.line(state.errorInfo.line);
    return RangeSet.of([new ErrorGutterMarker(state.errorInfo.message).range(line.from)]);
  }
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onReset,
  language,
  filename = 'update.js',
  hasError = false,
  errorInfo = null,
  engineStatus = ''
}) => {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    // Get language extension
    const getLangExtension = () => {
      switch (language) {
        case 'python':
          return python();
        case 'cpp':
          return cpp();
        default:
          return javascript();
      }
    };

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        oneDark,
        getLangExtension(),
        errorField,
        errorGutter,
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: '#12151F'
          },
          '.cm-gutters': {
            backgroundColor: '#181C29',
            color: '#525B70',
            borderRight: '1px solid #252B3B'
          },
          '.cm-activeLine': {
            backgroundColor: 'rgba(240, 169, 78, 0.06)'
          },
          '.cm-activeLineGutter': {
            backgroundColor: '#252B3B',
            color: '#F0A94E'
          },
          '.cm-error-gutter': {
            width: '18px'
          },
          '.cm-error-gutter-marker': {
            color: '#F0616B',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'inline-block',
            textAlign: 'center',
            width: '100%',
            cursor: 'pointer'
          },
          '.cm-error-line': {
            backgroundColor: 'rgba(240, 97, 107, 0.18) !important',
            borderLeft: '3px solid #F0616B',
            textDecoration: 'underline wavy #F0616B'
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language]); // Reconfigure on language change

  // Synchronize document external changes (e.g. lesson reset)
  useEffect(() => {
    if (viewRef.current) {
      const currentDoc = viewRef.current.state.doc.toString();
      if (currentDoc !== code) {
        viewRef.current.dispatch({
          changes: { from: 0, to: currentDoc.length, insert: code }
        });
      }
    }
  }, [code]);

  // Dispatch line error decorations to CodeMirror
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: setErrorEffect.of(errorInfo || null)
      });
      if (errorInfo && errorInfo.line >= 1 && errorInfo.line <= viewRef.current.state.doc.lines) {
        const line = viewRef.current.state.doc.line(errorInfo.line);
        viewRef.current.dispatch({
          selection: { anchor: line.from },
          scrollIntoView: true
        });
      }
    }
  }, [errorInfo]);

  const jumpToErrorLine = (lineNum: number) => {
    if (viewRef.current && lineNum >= 1 && lineNum <= viewRef.current.state.doc.lines) {
      const line = viewRef.current.state.doc.line(lineNum);
      viewRef.current.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true
      });
      viewRef.current.focus();
    }
  };

  return (
    <div className={`panel editor-panel ${hasError ? 'border-error' : ''}`}>
      <div className="panel-head">
        <div className="label">
          <FileCode size={14} className="accent-icon" />
          <span>{filename}</span>
        </div>
        {engineStatus && (
          <div className="engine-status-pill" title="Execution Engine">
            <Cpu size={12} />
            <span>{engineStatus}</span>
          </div>
        )}
      </div>

      <div className="editor-wrapper" ref={editorContainerRef} />

      {errorInfo && (
        <div className="editor-error-banner" onClick={() => jumpToErrorLine(errorInfo.line)} title="Click to scroll to error line">
          <AlertCircle size={14} className="text-error" />
          <span className="error-loc">Line {errorInfo.line}:</span>
          <span className="error-msg">{errorInfo.message}</span>
          <span className="error-jump">Click to jump ↵</span>
        </div>
      )}

      <div className="btn-row">
        <button className="btn-run" onClick={onRun}>
          <Play size={14} fill="currentColor" />
          <span>Run ▶</span>
        </button>

        <button className="btn-reset" onClick={onReset}>
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
