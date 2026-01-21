
import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, CheckCircle2, Bookmark, FileCheck } from 'lucide-react';
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

  const handleDownload = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const footerMargin = 25;
    const lineHeight = 7;
    const bodyFontSize = 10;
    
    const addBrandedFooter = (targetDoc: any) => {
      const footerY = pageHeight - 10;
      targetDoc.setFont("helvetica", "italic");
      targetDoc.setFontSize(7);
      targetDoc.setTextColor(180, 180, 180);
      const nameInCaps = userName.trim().toUpperCase() || "VALUED SCHOLAR";
      const footerText = `A Product Of UniSpace. Document Prepared for ${nameInCaps}`;
      const textWidth = targetDoc.getTextWidth(footerText);
      targetDoc.text(footerText, (pageWidth - textWidth) / 2, footerY);
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(7, 188, 12); 
    doc.text("UniSpace AI: Detailed Academic Synthesis", margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Author: ${userName.toUpperCase() || 'STUDENT'} | Source: ${sourceFileName}`, margin, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
    
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, 36, pageWidth - margin, 36);

    let cursorY = 45;
    const paragraphs = result.text.split('\n');

    paragraphs.forEach(p => {
      if (!p.trim()) { cursorY += 5; return; }

      const isTopic = p.startsWith('TOPIC:');
      const isSubheading = /^(\d+(\.\d+)+)/.test(p.trim());
      
      if (cursorY > pageHeight - footerMargin) {
        addBrandedFooter(doc);
        doc.addPage();
        cursorY = 25;
      }

      if (isTopic) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(7, 188, 12);
        doc.setFontSize(12);
        doc.text(p.replace(/\*\*/g, '').replace(/\*/g, ''), margin, cursorY);
        cursorY += 10;
      } else if (isSubheading) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.text(p.replace(/\*\*/g, '').replace(/\*/g, ''), margin, cursorY);
        cursorY += 8;
      } else {
        doc.setFontSize(bodyFontSize);
        
        // Split by markers while keeping them
        const segments = p.split(/(\*\*.*?\*\*|==.*?==)/g).filter(s => s !== '');
        let currentX = margin;

        segments.forEach(segment => {
          let style: 'normal' | 'bold' | 'highlight' = 'normal';
          let segmentContent = segment;

          if (segment.startsWith('**') && segment.endsWith('**')) {
            style = 'bold';
            segmentContent = segment.slice(2, -2);
          } else if (segment.startsWith('==') && segment.endsWith('==')) {
            style = 'highlight';
            segmentContent = segment.slice(2, -2);
          }

          const cleanContent = segmentContent.replace(/\*/g, '');
          const words = cleanContent.split(/(\s+)/);
          
          words.forEach(word => {
            doc.setFont("helvetica", style === 'normal' ? "normal" : "bold");
            
            if (style === 'highlight') {
              doc.setTextColor(7, 188, 12); 
            } else if (style === 'bold') {
              doc.setTextColor(0, 0, 0); // Strict black for bold terms
            } else {
              doc.setTextColor(40, 40, 40);
            }

            const wordWidth = doc.getTextWidth(word);

            if (currentX + wordWidth > pageWidth - margin) {
              cursorY += lineHeight;
              currentX = margin;
              
              if (cursorY > pageHeight - footerMargin) {
                addBrandedFooter(doc);
                doc.addPage();
                cursorY = 25;
              }
            }

            if (style === 'highlight' && word.trim()) {
              doc.setFillColor(235, 255, 235);
              doc.rect(currentX, cursorY - 4, wordWidth, 5.5, 'F');
            }

            doc.text(word, currentX, cursorY);
            currentX += wordWidth;
          });
        });
        cursorY += lineHeight;
      }
    });

    addBrandedFooter(doc);
    const toolName = result.mode === ResultMode.SUMMARY ? 'DetailedSummary' : result.mode === ResultMode.REVIEW ? 'FlashDoc' : 'AIEngine';
    const fileNameBase = (sourceFileName.split('.')[0] || "Synthesis").replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${fileNameBase}_UniSpace_${toolName}.pdf`);
  };

  const formatRichText = (text: string) => {
    const highlightParts = text.split(/(==.*?==)/g);
    return highlightParts.map((hPart, hIdx) => {
      if (hPart.startsWith('==') && hPart.endsWith('==')) {
        return (
          <span key={`h-${hIdx}`} className="bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-light font-bold px-1.5 py-0.5 rounded-md border border-primary/10 mx-0.5">
            {formatBoldOnly(hPart.slice(2, -2))}
          </span>
        );
      }
      return formatBoldOnly(hPart);
    });
  };

  const formatBoldOnly = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-gray-950 dark:text-white font-extrabold">
            {part.slice(2, -2).replace(/\*/g, '')}
          </strong>
        );
      }
      return part.replace(/[*#]/g, ''); 
    });
  };

  const renderFormattedLines = () => {
    const lines = result.text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-4" />;
      if (trimmed.startsWith('TOPIC:')) {
        return (
          <div key={idx} className="mt-8 mb-4">
            <div className="inline-flex items-center bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary font-black text-xs md:text-sm tracking-widest uppercase shadow-sm">
              <Bookmark className="w-4 h-4 mr-2" />
              {trimmed.replace(/\*/g, '')}
            </div>
          </div>
        );
      }
      const subheadingRegex = /^(\d+(\.\d+)+)/;
      if (subheadingRegex.test(trimmed)) {
        return (
          <div key={idx} className="mt-6 mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-l-4 border-primary shadow-sm">
            <h3 className="text-base md:text-lg font-extrabold text-gray-950 dark:text-white">
              {formatRichText(trimmed)}
            </h3>
          </div>
        );
      }
      return (
        <p key={idx} className="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed text-[13px] md:text-base text-justify">
          {formatRichText(line)}
        </p>
      );
    });
  };

  return (
    <div className="relative flex flex-col space-y-4 animate-unfold-up">
      {showNotification && (
        <div className="flex items-center justify-between bg-primary text-white px-5 py-3 rounded-2xl shadow-xl z-20 transition-all transform animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
            <span className="font-bold text-xs md:text-sm">Academic Synthesis Ready.</span>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white/80 hover:text-white text-[10px] font-bold tracking-widest uppercase">OK</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[75vh] md:h-[800px]">
        <div className="px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row md:justify-between md:items-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm gap-4">
          <div className="flex items-center space-x-4">
            <button onClick={onReset} className="group p-2 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-400 hover:text-primary border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  {result.mode === ResultMode.REVIEW ? 'FlashDoc' : result.mode === ResultMode.SUMMARY ? 'Detailed Summary' : 'AI Analysis'}
                </h2>
                {!isStreaming && (
                  <span className="flex items-center bg-primary/10 text-primary text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/20 animate-fade-in">
                    <FileCheck className="w-2.5 h-2.5 mr-1" />
                    DEEP ANALYSIS COMPLETE
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-gray-400 font-medium">UniSpace Synthesis v3.6</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <input 
                type="text"
                placeholder="Author Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full md:w-44 pl-3 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] md:text-sm outline-none dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-400"
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

        <div className="flex-1 p-4 md:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0b0f1a]/30">
          <div className="max-w-4xl mx-auto">
            {!isStreaming && (
              <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Visual & Mathematical Interpretation Success</p>
                    <p className="text-[10px] text-gray-500">Summary includes detailed guides for all diagrams and step-by-step logic.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mb-6 flex gap-2">
               <span className="flex items-center text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                 <div className="w-2 h-2 bg-primary rounded-full mr-2" /> HIGHLIGHTS = KEY RECALL
               </span>
               <span className="flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                 <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" /> BOLD = TERMS & HEADINGS
               </span>
            </div>
            {renderFormattedLines()}
            {isStreaming && (
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-block w-2.5 h-6 bg-primary animate-pulse rounded-full"></span>
                <span className="text-xs text-primary font-bold animate-pulse">Deconstructing visuals and complex data...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
