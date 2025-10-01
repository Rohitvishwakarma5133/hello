'use client';

import { useState } from 'react';

export default function TestPage() {
  const [inputText, setInputText] = useState('Due to the fact that we need to make a decision in regard to the implementation of the system, it is important to note that we cannot proceed. We do not want to take into consideration all factors.');
  const [humanizedText, setHumanizedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) {
      addLog('❌ No input text provided');
      setError('Please enter some text');
      return;
    }

    addLog('🚀 Starting humanization process...');
    setIsLoading(true);
    setError('');
    setHumanizedText('');

    try {
      addLog('📤 Sending POST request to /api/humanize');
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      addLog(`📥 Response received: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        addLog('✅ Successfully parsed JSON response');
        addLog(`📊 Received data: ${JSON.stringify(data).substring(0, 100)}...`);
        setHumanizedText(data.humanizedText);
        addLog('✨ Humanized text set successfully');
      } else {
        const errorText = await response.text();
        addLog(`❌ API Error: ${response.status} - ${errorText}`);
        setError(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error: any) {
      addLog(`❌ Network/Parse Error: ${error.message}`);
      setError(`Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      addLog('🏁 Humanization process completed');
    }
  };

  const testDirectAPI = async () => {
    addLog('🧪 Testing direct API call...');
    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'This is a simple test message.' }),
      });
      
      const data = await response.json();
      addLog(`🧪 Direct API test result: ${JSON.stringify(data)}`);
    } catch (error: any) {
      addLog(`🧪 Direct API test failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">🔧 Humanize API Debug Tool</h1>
          
          <div className="space-y-6">
            {/* Input Section */}
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
              <p className="text-sm text-gray-500 mt-1">
                Characters: {inputText.length} | Words: {inputText.trim().split(/\s+/).filter(w => w.length > 0).length}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap">
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
              
              <button
                onClick={testDirectAPI}
                className="px-6 py-3 rounded-md font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                🧪 Test API Direct
              </button>
              
              <button
                onClick={clearLogs}
                className="px-6 py-3 rounded-md font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                🗑️ Clear Logs
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-700">❌ {error}</p>
              </div>
            )}

            {/* Success Display */}
            {humanizedText && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ✅ Humanized Result:
                </label>
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 whitespace-pre-wrap">{humanizedText}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(humanizedText)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  📋 Copy to Clipboard
                </button>
              </div>
            )}

            {/* Debug Logs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🪵 Debug Logs:
              </label>
              <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-60 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500">No logs yet. Click "Humanize Text" to see debug info.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-semibold text-gray-700 mb-2">🔍 System Info:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server'}</p>
                <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
                <p>Fetch Available: {typeof window !== 'undefined' && window.fetch ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}