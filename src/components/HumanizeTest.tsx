'use client';

import { useState } from 'react';

export default function HumanizeTest() {
  const [inputText, setInputText] = useState('Due to the fact that we need to make a decision in regard to the implementation of the system, it is important to note that we cannot proceed. We do not want to take into consideration all factors.');
  const [humanizedText, setHumanizedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text');
      return;
    }

    console.log('🚀 Starting humanization...');
    setIsLoading(true);
    setError('');
    setHumanizedText('');

    try {
      console.log('📤 Sending request to /api/humanize');
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Data received:', data);
        setHumanizedText(data.humanizedText);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      setError(`Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      console.log('🏁 Humanization process completed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🧪 Humanize Test Component</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Text:
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter text to humanize..."
          />
        </div>

        <button
          onClick={handleHumanize}
          disabled={!inputText.trim() || isLoading}
          className={`px-6 py-3 rounded-md font-medium text-white ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? '⏳ Humanizing...' : '🚀 Humanize Text'}
        </button>

        {error && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700">❌ {error}</p>
          </div>
        )}

        {humanizedText && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ✅ Humanized Result:
            </label>
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{humanizedText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}