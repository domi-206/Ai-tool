
import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, CheckCircle2, Bookmark } from 'lucide-react';
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
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  // Enhanced line-by-line formatting
  const renderFormattedLines = () => {
    const lines = result.text.split('\n');
    
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;

      // 1. Detect "TOPIC:" identifier
      if (trimmed.startsWith('TOPIC:')) {
        return (
          <div key={idx} className="mt-8 mb-4">
            <div className="inline-flex items-center bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary font-black text-xs md:text-sm tracking-widest uppercase">
              <Bookmark className="w-4 h-4 mr-2" />
              {trimmed}
            </div>
          </div>
        );
      }

      // 2. Detect Hierarchical Numbered Subheadings (e.g., 1.0, 2.1.2)
      const subheadingRegex = /^(\d+(\.\d+)+)/;
      if (subheadingRegex.test(trimmed)) {
        return (
          <div key={idx} className="mt-6 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-primary">
            <h3 className="text-base md:text-lg font-extrabold text-primary flex items-center">
              {formatInlineBold(trimmed)}
            </h3>
          </div>
        );
      }

      // 3. Standard paragraphs with inline bolding
      return (
        <p key={idx} className="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed text-[13px] md:text-base">
          {formatInlineBold(line)}
        </p>
      );
    });
  };

  const formatInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-primary font-extrabold transition-colors">
            {part.slice(2, -2)}
          </strong>
        );
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
    const lineHeight = 8;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(7, 188, 12); 
    doc.text("UniSpace AI: Knowledge Synthesis", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Author: ${userName || 'Academic User'} | Source: ${sourceFileName}`, margin, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 34);
    
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, 38, pageWidth - margin, 38);

    let cursorY = 48;
    const paragraphs = result.text.replace(/#/g, '').split('\n');

    paragraphs.forEach(p => {
      if (!p.trim()) { cursorY += 4; return; }

      // Custom header styling in PDF
      if (p.startsWith('TOPIC:') || /^(\d+(\.\d+)+)/.test(p.trim())) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(7, 188, 12);
        doc.setFontSize(12);
        cursorY += 2;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(10);
      }

      const cleanText = p.replace(/\*\*/g, ''); // PDF lib doesn't support nested markdown bolding easily this way
      const lines = doc.splitTextToSize(cleanText, pageWidth - margin * 2);
      
      lines.forEach((line: string) => {
        if (cursorY > pageHeight - footerMargin) { 
          doc.addPage(); 
          cursorY = 25; 
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
      });

      if (p.startsWith('TOPIC:')) cursorY += 2;
    });

    doc.save(`${sourceFileName.split('.')[0]}_StudyGuide.pdf`);
  };

  return (
    <div className="relative flex flex-col space-y-4 animate-unfold-up">
      {showNotification && (
        <div className="flex items-center justify-between bg-primary text-white px-5 py-3 rounded-2xl shadow-xl z-20 transition-all transform animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs md:text-sm">Academic Guide Synthesized with High Detail.</span>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white/80 hover:text-white text-[10px] font-bold tracking-widest">OK</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[75vh] md:h-[800px]">
        {/* Header Section */}
        <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={onReset} className="group p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-primary border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {result.mode === ResultMode.REVIEW ? 'FlashDoc Study Pack' : result.mode === ResultMode.SUMMARY ? 'Detailed Summary' : 'Intelligent Solution'}
              </h2>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">Source: {sourceFileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <input 
                type="text"
                placeholder="Author name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full md:w-44 pl-3 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] md:text-sm outline-none dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <button 
              onClick={handleDownload}
              disabled={isStreaming}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-black text-white bg-primary hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/30"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT PDF</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0b0f1a]/30">
          <div className="max-w-4xl mx-auto">
            {renderFormattedLines()}
            {isStreaming && (
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-block w-2.5 h-6 bg-primary animate-pulse rounded-full"></span>
                <span className="text-xs text-primary font-bold animate-pulse">AI is thinking...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
