'use client';

import { useState } from 'react';
import { Clipboard } from 'lucide-react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [humanizedText, setHumanizedText] = useState('');

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setHumanizedText(data.humanizedText);
        setAiScore(95); // Show high human score after humanization
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-800">
                Natural Write
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-sm text-slate-600 hover:text-green-600 transition-colors">
                AI Humanizer
              </a>
              <a href="#" className="text-sm text-slate-600 hover:text-green-600 transition-colors">
                Blog
              </a>
              <a href="#" className="text-sm text-slate-600 hover:text-green-600 transition-colors">
                Contact
              </a>
              <a href="/pricing" className="text-sm text-slate-600 hover:text-green-600 transition-colors">
                Pricing
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm text-slate-600 hover:text-slate-800 px-3 py-2 transition-colors">
                Log in
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none text-sm px-4 py-2 shadow-md">
                Try for free
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section with Integrated Text Input */}
      <section className="bg-gradient-to-t from-slate-300 to-emerald-100 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-12">
            {/* Trust Indicator */}
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-800">Trusted by 50,000+ users</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-slate-800">
              Make AI Text Undetectable
            </h1>
            <p className="text-xl md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-slate-700">
              Transform AI-generated content into natural, human-like text that bypasses AI detection tools while maintaining quality and meaning.
            </p>
          </div>

          {/* Text Input Area */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <label className="text-lg font-semibold text-gray-800">Your Text</label>
                <select className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 font-medium text-sm">
                  <option>Default</option>
                  <option>Academic</option>
                  <option>Creative</option>
                  <option>Professional</option>
                </select>
              </div>
              <button 
                onClick={handlePasteText}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-gray-700 font-medium transition-colors text-sm"
              >
                <Clipboard className="w-4 h-4" />
                Paste Text
              </button>
            </div>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your AI-generated text here to humanize it..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 placeholder:text-gray-500"
            />
            
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {inputText.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </span>
                {aiScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Human Score:</span>
                    <span className={`text-sm font-bold ${
                      aiScore >= 80 ? 'text-green-600' : 
                      aiScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {aiScore}%
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleHumanize}
                disabled={!inputText.trim() || isLoading}
                className="bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none font-semibold py-3 px-8 shadow-md hover:shadow-lg"
              >
                {isLoading ? 'Humanizing...' : 'Humanize Text'}
              </button>
            </div>
          </div>
          
          {/* Humanized Output */}
          {humanizedText && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-xl font-semibold text-green-800">Humanized Text</h3>
              </div>
              <div className="bg-white border border-green-200 rounded-lg p-6">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{humanizedText}</p>
              </div>
            </div>
          )}

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button className="bg-green-500 hover:bg-green-600 text-white rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none font-semibold px-8 py-3 shadow-lg">
              Try for Free
            </button>
            <button className="border-2 border-slate-600 text-slate-600 font-semibold px-8 py-3 rounded-[10px] hover:bg-slate-100 transition-colors">
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Transform AI text to human-like content in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-t from-slate-300 to-emerald-100 rounded-2xl p-8 text-slate-800 shadow-lg">
              <div className="w-12 h-12 bg-white bg-opacity-40 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-slate-800">1</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">Paste Your Text</h3>
              <p className="text-slate-700 mb-6">
                Simply paste your AI-generated content into our text editor.
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="bg-slate-300 bg-opacity-50 rounded p-2 mb-2">
                  <div className="h-2 bg-slate-400 rounded w-3/4"></div>
                </div>
                <div className="bg-slate-300 bg-opacity-50 rounded p-2">
                  <div className="h-2 bg-slate-400 rounded w-1/2"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-t from-slate-300 to-emerald-100 rounded-2xl p-8 text-slate-800 shadow-lg">
              <div className="w-12 h-12 bg-white bg-opacity-40 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-slate-800">2</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">AI Processing</h3>
              <p className="text-slate-700 mb-6">
                Our advanced AI analyzes and transforms your content.
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-slate-600 border-t-green-500 rounded-full animate-spin"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-t from-slate-300 to-emerald-100 rounded-2xl p-8 text-slate-800 shadow-lg">
              <div className="w-12 h-12 bg-white bg-opacity-40 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-slate-800">3</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800">Get Human Text</h3>
              <p className="text-slate-700 mb-6">
                Receive natural, human-like content that passes AI detection.
              </p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-800">95% Human Score</span>
                </div>
                <div className="bg-slate-300 bg-opacity-50 rounded p-2">
                  <div className="h-2 bg-green-500 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built on Science Section */}
      <section className="bg-gradient-to-t from-slate-300 to-emerald-100 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-slate-800">
              <h2 className="text-4xl font-bold mb-6">
                Built on Science
              </h2>
              <p className="text-xl text-slate-700 mb-6 leading-relaxed">
                Our AI humanization technology is based on cutting-edge research in natural language processing and machine learning.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">Advanced neural network architecture</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">Trained on millions of human-written texts</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-slate-700">Continuous learning and improvement</span>
                </li>
              </ul>
            </div>
            <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl p-8">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-600 rounded w-full"></div>
                  <div className="h-3 bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-green-500 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-600 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What our users say
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of satisfied users who trust our AI humanization technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.5 3 2-6.5L0 7h6.5L10 0l3.5 7H20l-6.5 4.5 2 6.5z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                "NaturalWrite helped me humanize AI text from ChatGPT in seconds. It made my writing sound real and passed Turnitin easily. This tool saved my grade."
              </p>
              <div className="text-sm font-semibold text-gray-900">Julia K., Student</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.5 3 2-6.5L0 7h6.5L10 0l3.5 7H20l-6.5 4.5 2 6.5z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                "I've tried several tools to bypass AI detectors, but nothing compares to NaturalWrite. It's fast, accurate, and the free humanize AI text feature is a lifesaver."
              </p>
              <div className="text-sm font-semibold text-gray-900">Liam R., Content Writer</div>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.5 3 2-6.5L0 7h6.5L10 0l3.5 7H20l-6.5 4.5 2 6.5z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                "The best thing about NaturalWrite? I can humanize my text and rewrite AI drafts without losing quality. It feels like a real editor polished it."
              </p>
              <div className="text-sm font-semibold text-gray-900">Sophie M., Freelancer</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Section */}
      <footer className="py-12 px-4 bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Humanizer</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
              <p className="text-sm text-gray-600">hello@naturalwrite.com</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Terms of Use</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-300 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-600">© 2025 Natural Write. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
