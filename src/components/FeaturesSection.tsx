import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      id: 1,
      title: "Advanced AI Detection Bypass",
      description: "Our cutting-edge algorithms are specifically designed to transform AI-generated content into naturally flowing human text that seamlessly passes through even the most sophisticated AI detection systems.",
      icon: (
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      image: "/api/placeholder/600/400"
    },
    {
      id: 2,
      title: "Preserve Original Meaning",
      description: "While transforming your text to bypass AI detectors, our intelligent system maintains the core message, facts, and context of your original content without any loss of information or accuracy.",
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      image: "/api/placeholder/600/400"
    },
    {
      id: 3,
      title: "Natural Language Flow",
      description: "Experience the power of our advanced natural language processing that adds human-like variations, contractions, and conversational elements to make your content sound genuinely authentic.",
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
        </svg>
      ),
      image: "/api/placeholder/600/400"
    },
    {
      id: 4,
      title: "Lightning-Fast Processing",
      description: "Get your humanized content in seconds, not minutes. Our optimized AI engine processes your text instantly while maintaining the highest quality standards, so you can meet tight deadlines without compromising on authenticity.",
      icon: (
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      image: "/api/placeholder/600/400"
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Why Choose Our AI Humanizer?
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Discover the powerful features that make our AI humanization technology the most trusted choice for students, researchers, and content creators worldwide.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div key={feature.id} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-16`}>
              {/* Content Side */}
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div className="w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {feature.id === 1 && (
                    <div className="flex items-center gap-2 pt-4">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-700">
                        Trusted by 50,000+ users
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Side */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-3xl transform rotate-3"></div>
                  <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 h-64 flex items-center justify-center">
                      {/* Placeholder for feature illustration */}
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center">
                          {React.cloneElement(feature.icon, { className: "w-10 h-10 text-white" })}
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-300 rounded w-3/4 mx-auto"></div>
                          <div className="h-3 bg-slate-300 rounded w-1/2 mx-auto"></div>
                          <div className="h-3 bg-emerald-400 rounded w-5/6 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-6 py-3 mb-4">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-emerald-700 font-medium">Ready to get started?</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Transform Your AI Content Today
          </h3>
          <p className="text-slate-600">
            Join thousands of satisfied users who trust our AI humanization technology
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;