import React from 'react';

const AICompatibilitySection = () => {
  const aiDetectors = [
    { name: 'Turnitin', logo: '/logos/ai-detectors/turnitin.webp' },
    { name: 'GPTZero', logo: '/logos/ai-detectors/gptzero.webp' },
    { name: 'Copyleaks', logo: '/logos/ai-detectors/copyleaks.webp' },
    { name: 'ZeroGPT', logo: '/logos/ai-detectors/zerogpt.webp' },
    { name: 'QuillBot', logo: '/logos/ai-detectors/quillbot.webp' },
    { name: 'Grammarly', logo: '/logos/ai-detectors/grammarly.webp' },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4" style={{ fontSize: '30px' }}>
            Bypass any AI Content Detectors
          </h2>
          <p className="text-slate-600 max-w-3xl mx-auto" style={{ fontSize: '14px' }}>
            Make your writing undetectable and natural, trusted to pass the world&apos;s top AI checkers.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center">
          {aiDetectors.map((detector, index) => (
            <div 
              key={index}
              className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 w-full h-24 group"
            >
              <img 
                src={detector.logo}
                alt={`${detector.name} AI Detector`}
                className="max-h-12 max-w-full w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">98% Success Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AICompatibilitySection;