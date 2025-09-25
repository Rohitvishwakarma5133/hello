'use client';

import { TextStats as TextStatsType } from '@/types';

interface TextStatsProps {
  stats: TextStatsType;
  title: string;
  className?: string;
}

export default function TextStats({ stats, title, className = '' }: TextStatsProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.characters}</div>
          <div className="text-xs text-gray-500">Characters</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.words}</div>
          <div className="text-xs text-gray-500">Words</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.sentences}</div>
          <div className="text-xs text-gray-500">Sentences</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.paragraphs}</div>
          <div className="text-xs text-gray-500">Paragraphs</div>
        </div>
      </div>
    </div>
  );
}