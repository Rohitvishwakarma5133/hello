'use client';

import { diffWords, diffSentences } from 'diff';

interface DiffViewerProps {
  originalText: string;
  modifiedText: string;
  type?: 'words' | 'sentences';
  className?: string;
}

export default function DiffViewer({ 
  originalText, 
  modifiedText, 
  type = 'words',
  className = '' 
}: DiffViewerProps) {
  if (!originalText && !modifiedText) {
    return null;
  }

  const diff = type === 'sentences' 
    ? diffSentences(originalText, modifiedText)
    : diffWords(originalText, modifiedText);

  return (
    <div className={`p-4 border border-gray-300 rounded-lg bg-white ${className}`}>
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
        <span className="font-medium">Changes:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-200 border border-red-300 rounded-sm"></span>
            <span className="text-xs">Removed</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></span>
            <span className="text-xs">Added</span>
          </span>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span
                key={index}
                className="bg-green-200 text-green-800 px-1 rounded border border-green-300"
              >
                {part.value}
              </span>
            );
          } else if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 text-red-800 px-1 rounded border border-red-300 line-through"
              >
                {part.value}
              </span>
            );
          } else {
            return (
              <span key={index} className="text-gray-900">
                {part.value}
              </span>
            );
          }
        })}
      </div>
    </div>
  );
}