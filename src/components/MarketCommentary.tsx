'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SparklesIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CurrencyPoundIcon
} from '@heroicons/react/24/outline';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

// Simple markdown parser for Claude's formatting
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim();
      if (content) {
        elements.push(
          <p key={key++} className="text-gray-900 leading-relaxed mb-4 text-base">
            {parseInlineMarkdown(content)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Handle main headings (# Heading)
    if (trimmedLine.startsWith('# ') && !trimmedLine.startsWith('## ')) {
      flushParagraph();
      const headingText = trimmedLine.substring(2).trim();
      elements.push(
        <h2 key={key++} className="text-2xl font-bold text-gray-900 mt-8 mb-4 font-serif">
          {parseInlineMarkdown(headingText)}
        </h2>
      );
    }
    // Handle secondary headings (## Heading)
    else if (trimmedLine.startsWith('## ')) {
      flushParagraph();
      const headingText = trimmedLine.substring(3).trim();
      elements.push(
        <h3 key={key++} className="text-xl font-bold text-gray-900 mt-6 mb-3 font-serif">
          {parseInlineMarkdown(headingText)}
        </h3>
      );
    }
    // Handle bullet points (• or -)
    else if (trimmedLine.startsWith('• ') || trimmedLine.startsWith('- ')) {
      flushParagraph();
      const bulletText = trimmedLine.substring(2).trim();
      elements.push(
        <div key={key++} className="flex items-start mb-2">
          <span className="text-emerald-600 mr-2 mt-1">•</span>
          <span className="text-gray-900 leading-relaxed text-base">
            {parseInlineMarkdown(bulletText)}
          </span>
        </div>
      );
    }
    // Handle empty lines (paragraph breaks)
    else if (trimmedLine === '') {
      flushParagraph();
    }
    // Regular content lines
    else if (trimmedLine) {
      currentParagraph.push(trimmedLine);
    }
  });

  flushParagraph(); // Don't forget the last paragraph
  return elements;
}

// Parse inline markdown (bold text)
function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let currentText = '';
  let i = 0;
  let key = 0;

  while (i < text.length) {
    if (text.substring(i, i + 2) === '**') {
      // Found start or end of bold
      if (currentText) {
        parts.push(currentText);
        currentText = '';
      }
      
      // Find the closing **
      const closeIndex = text.indexOf('**', i + 2);
      if (closeIndex !== -1) {
        const boldText = text.substring(i + 2, closeIndex);
        parts.push(
          <strong key={key++} className="font-bold text-gray-900">
            {boldText}
          </strong>
        );
        i = closeIndex + 2;
      } else {
        // No closing **, treat as regular text
        currentText += text[i];
        i++;
      }
    } else {
      currentText += text[i];
      i++;
    }
  }

  if (currentText) {
    parts.push(currentText);
  }

  return parts.length > 0 ? parts : [text];
}

interface MarketCommentaryProps {
  triggerGeneration?: boolean;
  onGenerate?: () => void;
}

export function MarketCommentary({ triggerGeneration = false, onGenerate }: MarketCommentaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasBeenTriggered, setHasBeenTriggered] = useState(false);

  const { data: commentary, isLoading, error, refetch } = useQuery({
    queryKey: ['market-commentary'],
    queryFn: api.getMarketCommentary,
    enabled: triggerGeneration || hasBeenTriggered, // Only run when triggered
    staleTime: 30 * 60 * 1000, // Consider fresh for 30 minutes
  });

  // Show coming soon state if not triggered yet
  if (!triggerGeneration && !hasBeenTriggered && !commentary) {
    return (
      <div className="relative overflow-hidden bg-black rounded-3xl shadow-2xl border border-gray-800">
        {/* AI Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-emerald-600/5 pointer-events-none"></div>
        
        <div className="relative px-6 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>AI Market Commentary</h3>
                <p className="text-sm text-gray-600">Advanced market analysis powered by Claude 4</p>
              </div>
            </div>
          </div>

          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-900 to-green-900 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Market Commentary Available</h4>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Generate comprehensive AI-powered market analysis including competitive positioning, 
              behavioral risk insights, and strategic outlook for UK deposit rates.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setHasBeenTriggered(true);
                  onGenerate?.();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Generate Market Commentary</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-400">
              <div className="flex items-center space-x-2">
                <span>Powered by</span>
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span className="font-medium">Claude 4</span>
                </div>
                <span>by Anthropic</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>AI Market Commentary</h3>
            <p className="text-sm text-gray-600">Claude analysis of current market conditions</p>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 bg-red-50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
            <InformationCircleIcon className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">Commentary Unavailable</h3>
            <p className="text-sm text-red-600">Unable to generate market analysis</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>
    );
  }

  if (!commentary) return null;

  // Parse the entire commentary with markdown
  const fullCommentaryElements = parseMarkdown(commentary.commentary);
  const previewElements = isExpanded ? fullCommentaryElements : fullCommentaryElements.slice(0, 3); // Show first 3 elements (could be heading + paragraph + bullet points)

  return (
    <div className="card relative overflow-hidden">
      {/* AI Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-emerald-600/5 pointer-events-none"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>AI Market Commentary</h3>
              <p className="text-sm text-gray-600">
                Analysis updated {commentary.lastUpdated ? formatDistanceToNow(new Date(commentary.lastUpdated)) : 'recently'} ago
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Key Metrics */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <ChartBarIcon className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">
                  {commentary.dataSnapshot.marketOverview.totalProducts} products
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CurrencyPoundIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {commentary.dataSnapshot.marketOverview.averageRate}% avg
                </span>
              </div>
            </div>
            
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh commentary"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Commentary Content */}
        <div className="prose prose-gray max-w-none px-6">
          {previewElements}
          
          {fullCommentaryElements.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium text-sm transition-colors mt-2"
            >
              {isExpanded ? 'Show less' : 'Read full analysis'}
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Data Attribution */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Data from {commentary.extractionDate}</span>
              <span>•</span>
              <span>{commentary.dataSnapshot.marketOverview.totalBanks} banks monitored</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by</span>
              <div className="flex items-center space-x-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="font-medium">Claude 4</span>
              </div>
              <span>by Anthropic</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-600 to-transparent"></div>
    </div>
  );
}