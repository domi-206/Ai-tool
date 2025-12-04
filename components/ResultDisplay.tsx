import React from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { ProcessingResult, ResultMode } from '../types';

interface ResultDisplayProps {
  result: ProcessingResult;
  onReset: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset }) => {
  
  const handleDownload = () => {
    const blob = new Blob([result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Exam_${result.mode === ResultMode.SOLVE ? 'Solutions' : 'QuickReview'}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isReviewMode = result.mode === ResultMode.REVIEW;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[800px]">
      {/* Header */}
      <div className={`px-6 py-4 flex justify-between items-center border-b ${isReviewMode ? 'bg-indigo-50 border-indigo-100' : 'bg-green-50 border-green-100'}`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onReset}
            className="p-2 rounded-full hover:bg-white/50 transition-colors text-gray-600"
            title="Back to Upload"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className={`text-xl font-bold ${isReviewMode ? 'text-indigo-900' : 'text-green-900'}`}>
              {isReviewMode ? 'Quick Review Flashcards' : 'Exam Solutions'}
            </h2>
            <p className="text-sm text-gray-500">Generated from your uploaded materials</p>
          </div>
        </div>
        <button 
          onClick={handleDownload}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm
            ${isReviewMode 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          <Download className="w-4 h-4" />
          <span>Download .txt</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
        {isReviewMode ? (
          /* Q&A Style Format */
          <div className="font-mono text-sm space-y-4 text-gray-800 whitespace-pre-wrap">
             {result.text}
          </div>
        ) : (
          /* Detailed Solution Format */
          <div className="prose prose-green max-w-none text-gray-800 whitespace-pre-wrap">
            {result.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;