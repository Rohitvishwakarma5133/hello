'use client';

import { useState } from 'react';
import { HumanizeResponse } from '@/types';
import { copyToClipboard, getTextStats } from '@/lib/textUtils';
import TextStats from './TextStats';
import InputDiffViewer from './InputDiffViewer';
import OutputDiffViewer from './OutputDiffViewer';

export default function TextHumanizer() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [improvements, setImprovements] = useState<string[]>([]);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'strong'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<HumanizeResponse | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          options: {
            intensity,
            preserveFormatting: true,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to humanize text');
      }

      const data: HumanizeResponse = await res.json();
      setResponse(data);
      setOutputText(data.humanizedText);
      setImprovements(data.improvements);
      setShowDiff(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to humanize text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (outputText) {
      const success = await copyToClipboard(outputText);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setImprovements([]);
    setResponse(null);
    setCopySuccess(false);
    setShowDiff(false);
  };

  const inputStats = inputText ? getTextStats(inputText) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Transform AI-Generated Text into Human-Like Content
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Paste your AI-generated text below and we&apos;ll make it sound more natural, 
          conversational, and human-like by reducing formality and adding natural language patterns.
        </p>
        {outputText && (
          <div className={`mt-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-all ${
            showDiff 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {showDiff ? '✏️ Edit' : '🔍 Diff'}
          </div>
        )}
      </div>

      {/* Central Toggle Button */}
      {outputText && (
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              showDiff 
                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg ring-2 ring-orange-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {showDiff ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            <span>{showDiff ? '✏️ Edit Mode' : '🔍 Show Changes'}</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Original Text</h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-black">
                Intensity:
              </label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as 'light' | 'medium' | 'strong')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </select>
            </div>
          </div>
          
          {showDiff && inputText && outputText ? (
            <InputDiffViewer 
              originalText={inputText}
              modifiedText={outputText}
              className="min-h-64 max-h-96 overflow-auto"
            />
          ) : (
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={showDiff && outputText ? "✏️ Edit mode: Modify your original text here..." : "Paste your AI-generated text here..."}
              className={`w-full h-64 p-4 rounded-lg resize-none text-gray-900 transition-all ${
                showDiff && outputText 
                  ? 'border-2 border-orange-400 bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-inner' 
                  : 'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
          )}
          
          {inputStats && (
            <TextStats stats={inputStats} title="Input Statistics" />
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleHumanize}
              disabled={!inputText.trim() || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Humanizing...' : 'Humanize Text'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Humanized Text</h3>
            <div className="flex items-center space-x-2">
              {outputText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>
          
          {showDiff && inputText && outputText ? (
            <OutputDiffViewer 
              originalText={inputText}
              modifiedText={outputText}
              className="min-h-64 max-h-96 overflow-auto"
            />
          ) : (
            <textarea
              value={outputText}
              readOnly
              placeholder={showDiff && outputText ? "✏️ Edit mode: Plain text view" : "Humanized text will appear here..."}
              className={`w-full h-64 p-4 rounded-lg resize-none transition-all ${
                showDiff && outputText 
                  ? 'border-2 border-orange-400 bg-orange-50 text-gray-900 shadow-inner' 
                  : 'border border-gray-300 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              }`}
            />
          )}
          
          {response && (
            <TextStats stats={response.stats.humanized} title="Output Statistics" />
          )}
          
          {improvements.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Improvements Made:</h4>
              <ul className="space-y-1">
                {improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <div className="mt-16 bg-gray-50 rounded-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          What Our Humanizer Does
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Add Contractions</h4>
            <p className="text-sm text-gray-600">Converts formal phrases like &quot;do not&quot; to &quot;don&apos;t&quot;</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Simplify Language</h4>
            <p className="text-sm text-gray-600">Replaces complex phrases with simpler alternatives</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Natural Flow</h4>
            <p className="text-sm text-gray-600">Adds casual starters and transition words</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Active Voice</h4>
            <p className="text-sm text-gray-600">Converts passive voice to more engaging active voice</p>
          </div>
        </div>
      </div>
    </div>
  );
}