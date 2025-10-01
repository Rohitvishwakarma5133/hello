'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FeaturePills from '@/components/FeaturePills';
import FAQSection from '@/components/FAQSection';
import AICompatibilitySection from '@/components/AICompatibilitySection';
import FeaturesSection from '@/components/FeaturesSection';
import FooterCTASection from '@/components/FooterCTASection';

export default function Home() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [humanizedText, setHumanizedText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Default');
  
  // Mock user state - in a real app, this would come from context/auth provider
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Check user authentication status on mount
  useEffect(() => {
    // In a real app, you would check localStorage, cookies, or make an API call
    // For demo purposes, we'll simulate checking for auth token
    const authToken = localStorage.getItem('authToken');
    const userPlan = localStorage.getItem('userPlan');
    
    setIsLoggedIn(!!authToken);
    setIsPremium(userPlan === 'premium');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleUpgradeClick = () => {
    // If user is not logged in or not premium, redirect to login
    if (!isLoggedIn || !isPremium) {
      router.push('/login');
      return;
    }
    // If user is logged in and premium, allow selection
    setSelectedStyle('Personal Touch');
    setShowDropdown(false);
  };

  // Helper function for testing - simulate user login (for development/demo)
  const simulateLogin = (premium = false) => {
    localStorage.setItem('authToken', 'demo-token-123');
    localStorage.setItem('userPlan', premium ? 'premium' : 'basic');
    setIsLoggedIn(true);
    setIsPremium(premium);
  };

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
      {/* Hero Section with Integrated Text Input */}
      <section className="bg-gradient-to-t from-slate-300 to-emerald-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-8">
            {/* Trust Indicator */}
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-800">Trusted by 50,000+ users</span>
            </div>
            
            <h1 className="hero-heading text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              Make AI Text Undetectable
            </h1>
            <p className="text-lg mb-6 max-w-3xl mx-auto text-slate-700">
              Transform AI-generated content into natural, human-like text that bypasses AI detection tools while maintaining quality and meaning.
            </p>
            
            {/* Feature Pills */}
            <FeaturePills />
          </div>

          {/* Text Input Area - Competitor Style */}
          <section className="container mx-auto px-4 mb-12">
            <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto">
              <div className="bg-white rounded-[16px] shadow-lg overflow-hidden flex flex-col">
                
                {/* Header with title and mode selector */}
                <div className="p-4 flex justify-between items-center">
                  <h2 className="font-semibold">Your Text</h2>
                  <div className="relative dropdown-container">
                    <button 
                      className="justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-10 px-4 py-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-4 w-4">
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                        <path d="M20 3v4" />
                        <path d="M22 5h-4" />
                        <path d="M4 17v2" />
                        <path d="M5 18H3" />
                      </svg>
                      {selectedStyle}
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-down h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <div className="p-3">
                          {/* Default Option */}
                          <div 
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedStyle === 'Default' ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              setSelectedStyle('Default');
                              setShowDropdown(false);
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles">
                                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                <path d="M20 3v4" />
                                <path d="M22 5h-4" />
                                <path d="M4 17v2" />
                                <path d="M5 18H3" />
                              </svg>
                              <span className="font-medium text-slate-900">Default</span>
                            </div>
                            <p className="text-sm text-slate-600">Adapts naturally to the tone of your input.</p>
                          </div>
                          
                          {/* Personal Touch Option */}
                          <div 
                            className={`p-3 rounded-lg transition-colors mt-2 ${
                              selectedStyle === 'Personal Touch' ? 'bg-slate-50 border border-slate-200' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="font-medium text-slate-900">Personal Touch</span>
                              </div>
                              <button 
                                onClick={handleUpgradeClick}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium transition-colors"
                              >
                                Upgrade
                              </button>
                            </div>
                            <p className="text-sm text-slate-600">Unlock advanced humanization with richer tone and vocabulary</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Textarea with centered paste button */}
                <div className="px-4 flex-1 relative">
                  <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="flex rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 w-full border-none outline-none focus:outline-none resize-none min-h-[405px] ms-0 ps-0"
                    style={{ minHeight: '406px', height: '400px' }}
                  />
                  
                  {/* Centered Paste Button - only show when textarea is empty */}
                  {!inputText && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button 
                        onClick={handlePasteText}
                        className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background h-9 flex items-center gap-2 rounded-full px-4 py-2 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 pointer-events-auto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard h-4 w-4">
                          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        </svg>
                        Paste Text
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Footer with word count and buttons */}
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="flex items-center mb-4 md:mb-0">
                    <span className="text-sm text-gray-500">
                      {inputText.trim().split(/\s+/).filter(word => word.length > 0).length} / 500 words
                    </span>
                    {aiScore && (
                      <span className="ml-4 text-sm text-gray-500">
                        Human Score: <span className={`font-medium ${
                          aiScore >= 80 ? 'text-green-600' : 
                          aiScore >= 60 ? 'text-yellow-600' : 'text-red-500'
                        }`}>{aiScore}%</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:text-accent-foreground h-9 rounded-[10px] px-4 w-full sm:w-auto bg-green-100 text-green-600 hover:bg-green-200"
                      disabled={!inputText.trim()}
                    >
                      Check for AI
                    </button>
                    <button
                      onClick={handleHumanize}
                      disabled={!inputText.trim() || isLoading}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 bg-green-500 hover:bg-green-600 text-white rounded-[10px] px-4 w-full sm:w-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles h-4 w-4 mr-2">
                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                        <path d="M20 3v4" />
                        <path d="M22 5h-4" />
                        <path d="M4 17v2" />
                        <path d="M5 18H3" />
                      </svg>
                      {isLoading ? 'Humanizing...' : 'Humanize'}
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </section>
          
          {/* Humanized Output */}
          {humanizedText && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-medium text-green-800">Humanized Text</h3>
              </div>
              <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-base">{humanizedText}</p>
              </div>
              
              {/* Copy button */}
              <div className="mt-3 text-right">
                <button 
                  onClick={() => navigator.clipboard.writeText(humanizedText)}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Copy to clipboard
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* AI Compatibility Section */}
      <AICompatibilitySection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Testimonials Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
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
&ldquo;NaturalWrite helped me humanize AI text from ChatGPT in seconds. It made my writing sound real and passed Turnitin easily. This tool saved my grade.&rdquo;
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
&ldquo;I&rsquo;ve tried several tools to bypass AI detectors, but nothing compares to NaturalWrite. It&rsquo;s fast, accurate, and the free humanize AI text feature is a lifesaver.&rdquo;
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
&ldquo;The best thing about NaturalWrite? I can humanize my text and rewrite AI drafts without losing quality. It feels like a real editor polished it.&rdquo;
              </p>
              <div className="text-sm font-semibold text-gray-900">Sophie M., Freelancer</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Backed by students and researchers worldwide
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Trusted for essays, reports, and publications that sound professional and human.
            </p>
          </div>
          
          {/* University Logos Scrolling Banner */}
          <div className="relative overflow-hidden">
            {/* Gradient overlays for smooth edges */}
            <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10"></div>
            
            <div className="flex animate-scroll space-x-8 md:space-x-12 lg:space-x-16">
              {/* First set of logos */}
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/HarvardMedicalSchool.png" 
                  alt="Harvard Medical School" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/MIT.png" 
                  alt="MIT" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/StanfordUniversity.png" 
                  alt="Stanford University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/Yale.png" 
                  alt="Yale University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/oxford.png" 
                  alt="Oxford University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/cambridge.png" 
                  alt="Cambridge University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/PrincetonUniversity.png" 
                  alt="Princeton University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/Yonsei_University.png" 
                  alt="Yonsei University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              
              {/* Duplicate set for seamless loop */}
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/HarvardMedicalSchool.png" 
                  alt="Harvard Medical School" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/MIT.png" 
                  alt="MIT" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/StanfordUniversity.png" 
                  alt="Stanford University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/Yale.png" 
                  alt="Yale University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/oxford.png" 
                  alt="Oxford University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
              <div className="flex items-center justify-center min-w-[100px] sm:min-w-[120px] md:min-w-[150px] h-12 sm:h-16 md:h-20">
                <img 
                  src="/logos/universities/cambridge.png" 
                  alt="Cambridge University" 
                  className="max-h-8 sm:max-h-10 md:max-h-14 w-auto opacity-50 hover:opacity-80 transition-all duration-300 filter grayscale hover:grayscale-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <FAQSection />
      
      {/* Footer CTA Section */}
      <FooterCTASection />
      
      {/* Footer Section */}
      <footer className="py-8 px-4 bg-gray-100 border-t border-gray-200">
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
