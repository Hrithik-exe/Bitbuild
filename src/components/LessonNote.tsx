import React from 'react';
import { BookOpen } from 'lucide-react';
import type { LessonNote as LessonNoteType } from '../types/lesson';

interface LessonNoteProps {
  note: LessonNoteType;
}

export const LessonNote: React.FC<LessonNoteProps> = ({ note }) => {
  return (
    <div className="lesson-note">
      <div className="title">
        <BookOpen size={16} className="title-icon" />
        <span>{note.title}</span>
      </div>

      <div className="note-body">
        {note.body.map((paragraph, idx) => {
          // Parse <code class="inline">...</code> strings into React elements
          const parts = paragraph.split(/(<code class="inline">.*?<\/code>)/g);
          return (
            <p key={idx}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('<code class="inline">') && part.endsWith('</code>')) {
                  const content = part.replace('<code class="inline">', '').replace('</code>', '');
                  return (
                    <code key={pIdx} className="inline">
                      {content}
                    </code>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
};
