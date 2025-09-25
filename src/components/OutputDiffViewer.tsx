'use client';

import { diffWords } from 'diff';

interface OutputDiffViewerProps {
  originalText: string;
  modifiedText: string;
  className?: string;
}

export default function OutputDiffViewer({ 
  originalText, 
  modifiedText, 
  className = '' 
}: OutputDiffViewerProps) {
  if (!modifiedText) {
    return null;
  }

  const diff = diffWords(originalText, modifiedText);

  return (
    <div className={`p-4 border border-gray-300 rounded-lg bg-white ${className}`}>
      <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
        <span className="font-medium">Humanized Text:</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></span>
            <span className="text-xs">Newly added/changed</span>
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
          } else if (!part.removed) {
            // Show unchanged text normally
            return (
              <span key={index} className="text-gray-900">
                {part.value}
              </span>
            );
          }
          // Don't show removed parts in output view
          return null;
        })}
      </div>
    </div>
  );
}