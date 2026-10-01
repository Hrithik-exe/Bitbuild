import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { Play, RotateCcw, FileCode } from 'lucide-react';
import type { Language } from '../../types/lesson';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  language: Language;
  filename?: string;
  hasError?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onReset,
  language,
  filename = 'update.js',
  hasError = false
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

  return (
    <div className={`panel editor-panel ${hasError ? 'border-error' : ''}`}>
      <div className="panel-head">
        <div className="label">
          <FileCode size={14} className="accent-icon" />
          <span>{filename}</span>
        </div>
      </div>

      <div className="editor-wrapper" ref={editorContainerRef} />

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
