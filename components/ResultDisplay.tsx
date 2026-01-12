
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
    const footerMargin = 30; // Extra space for footer
    const maxLineWidth = pageWidth - (margin * 2);
    
    const setNormal = () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
    };

    const setBold = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
    };

    const addFooterToPage = (pageNum: number, totalPages: number) => {
      doc.setPage(pageNum);
      
      // Footer Line Separator
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

      // "A Product of UniSpace" - Bold and Primary-ish color
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(7, 188, 12); // Primary Green
      doc.text("A Product of UniSpace", pageWidth / 2, pageHeight - 18, { align: "center" });
      
      // Personalized section
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const personalizedFooter = `Prepared exclusively for: ${userName || 'Academic User'}`;
      doc.text(personalizedFooter, pageWidth / 2, pageHeight - 12, { align: "center" });
      
      // Page numbering
      doc.setFontSize(8);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: "right" });
    };

    let title = 'Document';
    let toolSuffix = 'UniSpace_Doc';
    switch (result.mode) {
      case ResultMode.SOLVE: 
        title = 'UniSpace AI Engine Solutions'; 
        toolSuffix = 'UniSpace_AIEngine';
        break;
      case ResultMode.REVIEW: 
        title = 'UniSpace FlashDoc'; 
        toolSuffix = 'UniSpace_FlashDoc';
        break;
      case ResultMode.SUMMARY: 
        title = 'UniSpace Deep Summary'; 
        toolSuffix = 'UniSpace_Summary';
        break;
    }
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(7, 188, 12); 
    doc.text(title, margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Official Academic Report | ${new Date().toLocaleDateString()}`, margin, 27);
    
    doc.setDrawColor(7, 188, 12);
    doc.setLineWidth(0.5);
    doc.line(margin, 32, pageWidth - margin, 32);
    
    let cursorY = 45;
    const lineHeight = 7;

    const mainText = result.text.replace(/#/g, '');
    const paragraphs = mainText.split('\n');

    paragraphs.forEach(paragraph => {
      if (!paragraph.trim()) {
        cursorY += lineHeight / 1.5;
        return;
      }

      const segments = paragraph.split(/(\*\*.*?\*\*)/g);
      let currentX = margin;

      segments.forEach(segment => {
        if (!segment) return;
        
        let isBold = false;
        let content = segment;
        
        if (segment.startsWith('**') && segment.endsWith('**')) {
          isBold = true;
          content = segment.slice(2, -2);
        }

        if (isBold) setBold(); else setNormal();

        const words = content.split(/(\s+)/);
        
        words.forEach(word => {
          if (!word) return;
          const wordWidth = doc.getTextWidth(word);
          
          if (currentX + wordWidth > pageWidth - margin) {
            if (currentX > margin) {
              cursorY += lineHeight;
              currentX = margin;
            }

            // check for page overflow with extra footer room
            if (cursorY > pageHeight - footerMargin) { 
              doc.addPage();
              cursorY = margin + 10;
              currentX = margin;
              if (isBold) setBold(); else setNormal();
            }
          }
          
          doc.text(word, currentX, cursorY);
          currentX += wordWidth;
        });
      });
      
      cursorY += lineHeight;
      currentX = margin;
      
      // Check for overflow after paragraph too
      if (cursorY > pageHeight - footerMargin) {
        doc.addPage();
        cursorY = margin + 10;
      }
    });

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      addFooterToPage(i, totalPages);
    }

    const baseName = sourceFileName.replace(/\.[^/.]+$/, "");
    doc.save(`${baseName}_${toolSuffix}.pdf`);
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
            <div className="relative flex-1 group">
              <User className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Enter your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] md:text-sm outline-none dark:text-white focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <button 
              onClick={handleDownload}
              disabled={isStreaming}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
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
