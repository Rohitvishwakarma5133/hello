import React from 'react';

const FeaturePills = () => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      {/* Essay-Ready Pill */}
      <div className="inline-flex items-center gap-2 bg-white bg-opacity-90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-green-600"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
        <span className="text-sm font-medium text-slate-700">Essay-Ready</span>
      </div>

      {/* Natural Tone Pill */}
      <div className="inline-flex items-center gap-2 bg-white bg-opacity-90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-blue-600"
        >
          <path d="M8 12h.01"/>
          <path d="M12 12h.01"/>
          <path d="M16 12h.01"/>
          <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <span className="text-sm font-medium text-slate-700">Natural Tone</span>
      </div>

      {/* Plagiarism-Safe Pill */}
      <div className="inline-flex items-center gap-2 bg-white bg-opacity-90 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-all duration-200">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-emerald-600"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <span className="text-sm font-medium text-slate-700">Plagiarism-Safe</span>
      </div>
    </div>
  );
};

export default FeaturePills;