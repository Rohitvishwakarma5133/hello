import React from 'react';

const FooterCTASection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Heading */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Human-Like Writing in Seconds
        </h2>
        
        {/* Paragraph */}
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 max-w-3xl mx-auto">
          Transform flat, AI-sounding text into smooth, authentic language that feels naturally written. 
          No matter if it comes from ChatGPT or any other AI, our tool refines your content to pass AI 
          detection and read with genuine clarity — all in a single click.
        </p>
        
        {/* CTA Button */}
        <div className="mb-4">
          <button className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 text-lg">
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            Get Started Free
          </button>
        </div>
        
        {/* Small text */}
        <p className="text-sm text-slate-500">
          Try it now! 500 words free, no credit card required.
        </p>
        
        {/* Decorative elements */}
        <div className="mt-12 flex justify-center items-center space-x-8 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-slate-400 font-medium">Fast Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <span className="text-xs text-slate-400 font-medium">No Registration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
            <span className="text-xs text-slate-400 font-medium">100% Secure</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FooterCTASection;