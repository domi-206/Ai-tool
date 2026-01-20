
import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import { jsPDF } from "jspdf";
import { ProcessingResult, ResultMode } from '../types';

interface ResultDisplayProps {
  result: ProcessingResult;
  onReset: () => void;
  sourceFileName: string;
  isStreaming: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset, sourceFileName, isStreaming }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!isStreaming && result.text.length > 0) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  const formatTextForUI = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
      }
      return part.replace(/#/g, ''); 
    });
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const footerMargin = 30;
    const lineHeight = 7;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(7, 188, 12); 
    doc.text("UniSpace AI Report", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`User: ${userName || 'Academic User'} | Date: ${new Date().toLocaleDateString()}`, margin, 27);
    
    let cursorY = 40;
    const paragraphs = result.text.replace(/#/g, '').split('\n');

    paragraphs.forEach(p => {
      if (!p.trim()) { cursorY += 5; return; }
      const lines = doc.splitTextToSize(p, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (cursorY > pageHeight - footerMargin) { doc.addPage(); cursorY = 20; }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });
    });

    doc.save(`${sourceFileName.split('.')[0]}_Report.pdf`);
  };

  return (
    <div className="relative flex flex-col space-y-3 animate-unfold-up">
      {showNotification && (
        <div className="flex items-center justify-between bg-primary text-white px-4 py-2 rounded-xl shadow-lg z-20">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-[10px] md:text-sm">Knowledge synthesized successfully.</span>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white/80 hover:text-white text-[10px] font-bold">DISMISS</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[65vh] md:max-h-[800px]">
        <div className="px-3 md:px-6 py-2 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 dark:border-gray-700 gap-2 md:gap-4">
          <div className="flex items-center space-x-2">
            <button onClick={onReset} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm md:text-xl font-bold text-gray-900 dark:text-white truncate">
              {result.mode === ResultMode.REVIEW ? 'FlashDoc' : result.mode === ResultMode.SUMMARY ? 'Deep Summary' : 'AI Engine Results'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text"
              placeholder="Name for PDF..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="pl-3 pr-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] md:text-sm outline-none dark:text-white focus:border-primary transition-all"
            />
            <button 
              onClick={handleDownload}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        <div className="p-3 md:p-8 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
          <div className="prose prose-slate dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-[11px] md:text-base">
            {formatTextForUI(result.text)}
            {isStreaming && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
