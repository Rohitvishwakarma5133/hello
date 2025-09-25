'use client';

import { useState } from 'react';
import { HumanizeResponse } from '@/types';
import { copyToClipboard, getTextStats } from '@/lib/textUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Transform AI-Generated Text into Human-Like Content
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Paste your AI-generated text below and we&apos;ll make it sound more natural, 
          conversational, and human-like by reducing formality and adding natural language patterns.
        </p>
      </div>

      {/* Central Toggle Button */}
      {outputText && (
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setShowDiff(!showDiff)}
            variant="outline"
            size="sm"
            className="text-xs border-muted-foreground/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            {showDiff ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            <span>{showDiff ? 'Edit Mode' : 'Show Changes'}</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Original Text</h3>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-foreground">
                Intensity:
              </label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as 'light' | 'medium' | 'strong')}
                className="px-3 py-1 border border-border rounded-md text-sm text-foreground bg-background focus:ring-2 focus:ring-primary focus:border-primary"
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
              placeholder={showDiff && outputText ? "Edit mode: Modify your original text here..." : "Paste your AI-generated text here..."}
              className={`w-full h-64 p-4 rounded-lg resize-none text-foreground transition-all ${
                showDiff && outputText 
                  ? 'border-2 border-buttercup bg-buttercup/10 focus:ring-2 focus:ring-buttercup focus:border-buttercup shadow-inner' 
                  : 'border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary'
              }`}
            />
          )}
          
          {inputStats && (
            <TextStats stats={inputStats} title="Input Statistics" />
          )}
          
          <div className="flex space-x-3">
            <Button
              onClick={handleHumanize}
              disabled={!inputText.trim() || isLoading}
              variant="caribbean-green"
              className="flex-1 py-6"
            >
              {isLoading ? 'Humanizing...' : 'Humanize Text'}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="py-6 px-6"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Humanized Text</h3>
            <div className="flex items-center space-x-2">
              {outputText && (
                <Button
                  onClick={handleCopy}
                  variant="caribbean-green"
                  size="sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
                </Button>
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
              placeholder={showDiff && outputText ? "Edit mode: Plain text view" : "Humanized text will appear here..."}
              className={`w-full h-64 p-4 rounded-lg resize-none transition-all text-foreground ${
                showDiff && outputText 
                  ? 'border-2 border-buttercup bg-buttercup/10 shadow-inner' 
                  : 'border border-border bg-muted/50 focus:ring-2 focus:ring-primary focus:border-primary'
              }`}
            />
          )}
          
          {response && (
            <TextStats stats={response.stats.humanized} title="Output Statistics" />
          )}
          
          {improvements.length > 0 && (
            <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">Improvements Made:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-primary/90 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Features Section */}
      <Card className="mt-16 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            What Our Humanizer Does
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-caribbean-green/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-caribbean-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="font-medium text-foreground mb-2">Add Contractions</h4>
              <p className="text-sm text-muted-foreground">Converts formal phrases like &quot;do not&quot; to &quot;don&apos;t&quot;</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-dodger-blue/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-dodger-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-foreground mb-2">Simplify Language</h4>
              <p className="text-sm text-muted-foreground">Replaces complex phrases with simpler alternatives</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-royal-purple/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-royal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                </svg>
              </div>
              <h4 className="font-medium text-foreground mb-2">Natural Flow</h4>
              <p className="text-sm text-muted-foreground">Adds casual starters and transition words</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-buttercup/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-buttercup" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h4 className="font-medium text-foreground mb-2">Active Voice</h4>
              <p className="text-sm text-muted-foreground">Converts passive voice to more engaging active voice</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}