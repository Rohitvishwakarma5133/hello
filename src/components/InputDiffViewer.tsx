'use client';

import { diffWords } from 'diff';

interface InputDiffViewerProps {
  originalText: string;
  modifiedText: string;
  className?: string;
}

export default function InputDiffViewer({ 
  originalText, 
  modifiedText, 
  className = '' 
}: InputDiffViewerProps) {
  if (!originalText) {
    return null;
  }

  const diff = diffWords(originalText, modifiedText);

  return (
    <div className={`p-4 border border-gray-300 rounded-lg bg-white ${className}`}>
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
        <span className="font-medium">Original Text:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-200 border border-red-300 rounded-sm"></span>
            <span className="text-xs">Will be removed/changed</span>
          </span>
        </div>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">
        {diff.map((part, index) => {
          if (part.removed) {
            return (
              <span
                key={index}
                className="bg-red-200 text-red-800 px-1 rounded border border-red-300"
              >
                {part.value}
              </span>
            );
          } else if (!part.added) {
            // Show unchanged text normally
            return (
              <span key={index} className="text-gray-900">
                {part.value}
              </span>
            );
          }
          // Don't show added parts in input view
          return null;
        })}
      </div>
    </div>
  );
}