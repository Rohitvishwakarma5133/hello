'use client';

import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "How does the AI humanization process work?",
      answer: "Our advanced AI analyzes your text and applies natural language patterns to make it sound more human-like. It adds contractions, varies sentence structure, includes casual transitions, and adjusts formality levels while preserving the original meaning and context."
    },
    {
      question: "Will humanized text pass AI detection tools?",
      answer: "Yes, our humanization technology is designed to significantly reduce AI detection scores. While we can't guarantee 100% bypass rates for all detection tools, most users see their content pass popular AI detectors like Turnitin, GPTZero, and others with high success rates."
    },
    {
      question: "Does humanizing text affect the quality or meaning?",
      answer: "No, our humanization process preserves the core meaning and maintains quality. We focus on stylistic changes like adding natural flow, contractions, and conversational elements without altering the factual content or key messages of your text."
    },
    {
      question: "What types of content can I humanize?",
      answer: "You can humanize any type of AI-generated content including essays, articles, blog posts, reports, emails, academic papers, social media content, and more. Our tool works effectively with content from ChatGPT, Claude, Gemini, and other AI writing tools."
    },
    {
      question: "Is there a word limit for text humanization?",
      answer: "The free version supports up to 500 words per request. For longer content, you can process it in chunks or upgrade to our premium plans which offer higher word limits and batch processing capabilities for extensive documents."
    },
    {
      question: "How long does the humanization process take?",
      answer: "The humanization process typically takes 10-30 seconds depending on the length and complexity of your text. Our advanced AI processes your content in real-time to deliver quick results without compromising quality."
    },
    {
      question: "Is my text data secure and private?",
      answer: "Absolutely. We take privacy seriously and don't store your text content after processing. All data is encrypted during transmission and processing, and we don't use your content to train our models or share it with third parties."
    },
    {
      question: "Can I customize the humanization intensity?",
      answer: "Yes, you can choose from different intensity levels (Light, Medium, Strong) to control how much humanization is applied. Light mode makes subtle changes, while Strong mode applies more comprehensive natural language patterns to achieve higher human-like scores."
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about our AI humanization technology
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:items-start">
          {/* Left Column */}
          <div className="space-y-4">
            {faqs.slice(0, 4).map((faq, index) => (
              <div 
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:bg-gray-100"
                >
                  <span className="font-medium text-slate-900 pr-4 text-sm md:text-base">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-600 transition-transform duration-300 flex-shrink-0 ${
                      activeIndex === index ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  activeIndex === index 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {faqs.slice(4, 8).map((faq, index) => (
              <div 
                key={index + 4}
                className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(index + 4)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:bg-gray-100"
                >
                  <span className="font-medium text-slate-900 pr-4 text-sm md:text-base">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-slate-600 transition-transform duration-300 flex-shrink-0 ${
                      activeIndex === (index + 4) ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  activeIndex === (index + 4) 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;