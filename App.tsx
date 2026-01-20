
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import { generateContentStream } from './services/geminiService';
import { UploadedFile, ProcessingState, ResultMode } from './types';
import { HelpCircle, Brain, Layers, AlertCircle, BookOpen, FileText, ScanLine, Loader2, Cpu, StopCircle, XCircle, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'summary' | 'solver'>('solver');
  const [isDark, setIsDark] = useState(false);
  const [courseFiles, setCourseFiles] = useState<UploadedFile[]>([]);
  const [questionFiles, setQuestionFiles] = useState<UploadedFile[]>([]);
  const [summaryFiles, setSummaryFiles] = useState<UploadedFile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing AI...');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadingMessages = [
    "Scanning documents for key terms...",
    "Extracting important names and dates...",
    "Deep-analyzing core concepts...",
    "Formatting for high recall...",
    "Applying bold emphasis to key points...",
    "Synthesizing your academic guide...",
    "Exhaustively mapping all topics...",
    "Creating concise flash-recall points...",
    "Polishing deep academic solutions...",
    "Finalizing document structure..."
  ];

  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    loadingMode: null,
    error: null,
    result: null
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    let interval: any;
    if (processingState.isLoading && progress < 90) {
      interval = setInterval(() => {
        const randomMsg = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        setStatusMsg(randomMsg);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [processingState.isLoading, progress]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    
    if (processingState.isLoading && !processingState.result) {
      resetApp();
    } else {
      setProcessingState(prev => ({
        ...prev,
        isLoading: false,
        loadingMode: null
      }));
    }
  };

  const handleProcess = async (mode: ResultMode) => {
    if (mode === ResultMode.SUMMARY && summaryFiles.length === 0) {
      setProcessingState(prev => ({ ...prev, error: "Upload a document to summarize." }));
      return;
    }
    if (mode === ResultMode.SOLVE && (courseFiles.length === 0 || questionFiles.length === 0)) {
      setProcessingState(prev => ({ ...prev, error: "Course material and past questions are required." }));
      return;
    }
    if (mode === ResultMode.REVIEW && courseFiles.length === 0) {
      setProcessingState(prev => ({ ...prev, error: "Upload course material for FlashDoc." }));
      return;
    }

    setProcessingState({ isLoading: true, loadingMode: mode, error: null, result: null });
    setIsStreaming(true);
    setProgress(5);
    setStatusMsg('Preparing your analysis engine...');

    abortControllerRef.current = new AbortController();

    try {
      const filesA = mode === ResultMode.SUMMARY ? summaryFiles : courseFiles;
      const filesB = (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) ? [] : questionFiles;

      const stream = generateContentStream(filesA, filesB, mode, abortControllerRef.current.signal);
      
      let fullText = '';
      let hasStarted = false;
      let chunkCount = 0;

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        
        fullText += chunk;
        chunkCount++;

        if (!hasStarted) {
          hasStarted = true;
          setProgress(30);
          setProcessingState(prev => ({
            ...prev,
            isLoading: false,
            loadingMode: null, 
            result: { text: fullText, mode: mode, timestamp: Date.now() }
          }));
        } else {
          const newProgress = Math.min(99, 30 + Math.floor(chunkCount / 5));
          setProgress(newProgress);
          setProcessingState(prev => {
            if (!prev.result) return prev; 
            return { ...prev, result: { ...prev.result, text: fullText } };
          });
        }
      }
      setProgress(100);
      setStatusMsg('Knowledge Synthesized Successfully!');
      setTimeout(() => setIsStreaming(false), 1000);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setIsStreaming(false);
      setProcessingState({
        isLoading: false,
        loadingMode: null,
        error: err.message || "An unexpected error occurred.",
        result: null
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const resetApp = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setProcessingState({ isLoading: false, loadingMode: null, error: null, result: null });
    setIsStreaming(false);
    setProgress(0);
  };

  const getSourceFileName = () => {
    if (processingState.result?.mode === ResultMode.SUMMARY) return summaryFiles[0]?.name || "Summary";
    if (processingState.result?.mode === ResultMode.REVIEW) return courseFiles[0]?.name || "FlashDoc";
    return questionFiles[0]?.name || "AIEngine_Output";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] text-gray-900 dark:text-gray-100 pb-4 md:pb-8 font-sans transition-colors">
      <Header 
        activeView={activeView} 
        onViewChange={(view) => { setActiveView(view); resetApp(); }} 
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
      />

      <main className="max-w-6xl mx-auto px-4 mt-4 md:mt-10">
        
        {!processingState.result && !processingState.isLoading && (
          <div className="text-center mb-6 md:mb-12 animate-fade-in">
            <h1 className="text-2xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 md:mb-4">
              {activeView === 'summary' ? 'Deep AI Summarizer' : 'UniSpace AI Engine'}
            </h1>
            <p className="max-w-2xl mx-auto text-xs md:text-lg text-gray-500 dark:text-gray-400 leading-snug">
              Upload your documents below. We'll synthesize every detail with **academic precision**.
            </p>
          </div>
        )}

        {processingState.isLoading && (
          <div className="fixed inset-0 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <div className="relative w-32 h-32 md:w-56 md:h-56 flex items-center justify-center mb-6">
              <div className="absolute z-10 bg-primary/10 p-3 md:p-5 rounded-full animate-pulse-glow">
                <Brain className="w-8 h-8 md:w-14 md:h-14 text-primary" />
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="301.59" strokeDashoffset={301.59 * (1 - progress / 100)} className="text-primary transition-all duration-500" />
              </svg>
            </div>
            <h3 className="text-sm md:text-xl font-bold mb-1 text-gray-900 dark:text-white text-center px-4">{statusMsg}</h3>
            <div className="w-40 md:w-72 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mt-2">
               <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex flex-col items-center mt-6">
              <span className="text-primary text-[10px] md:text-sm font-bold mb-4">{progress}% Complete</span>
              <button 
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-2.5 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/10 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-full font-bold text-sm transition-all active:scale-95 shadow-sm border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Generation</span>
              </button>
            </div>
          </div>
        )}

        {processingState.error && (
          <div className="mb-4 mx-auto max-w-3xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-400 text-xs md:text-sm font-medium">{processingState.error}</p>
          </div>
        )}

        {processingState.result ? (
          <>
            {isStreaming && (
              <div className="mb-3 bg-white dark:bg-gray-800 rounded-xl p-3 border border-primary/20 flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  <span className="text-xs md:text-sm font-bold text-gray-700 dark:text-gray-300 truncate tracking-tight">{statusMsg}</span>
                  <div className="hidden md:block h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
                  <span className="hidden md:inline text-xs text-primary font-bold">{progress}%</span>
                </div>
                <button 
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 text-xs font-bold transition-all active:scale-95 border border-red-100 dark:border-red-900/30"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Stop
                </button>
              </div>
            )}
            <ResultDisplay 
              result={processingState.result} 
              onReset={resetApp} 
              sourceFileName={getSourceFileName()}
              isStreaming={isStreaming}
            />
          </>
        ) : (
          <div className={`space-y-4 md:space-y-8 ${!processingState.isLoading ? 'animate-fade-in' : 'opacity-0'}`}>
            {activeView === 'summary' ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="min-h-[220px] md:min-h-[350px]">
                  <FileUpload
                    title="Upload Academic Material"
                    subtitle="PDF, Text, or Images for deep analysis"
                    files={summaryFiles}
                    onFilesAdded={(newFiles) => setSummaryFiles([...newFiles])}
                    onFileRemove={(id) => setSummaryFiles(prev => prev.filter(f => f.id !== id))}
                    icon={<ScanLine className="w-8 h-8 md:w-12 md:h-12" />}
                  />
                </div>
                {summaryFiles.length > 0 && (
                  <button
                    onClick={() => handleProcess(ResultMode.SUMMARY)}
                    className="w-full group flex items-center justify-center py-3 md:py-5 text-sm md:text-xl font-bold rounded-2xl text-white bg-primary hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-primary/20 animate-unfold-up"
                  >
                    <FileText className="w-5 h-5 mr-3" />
                    Generate Detailed Summary
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="min-h-[200px] md:min-h-[320px]">
                    <FileUpload
                      title="1. Course Material"
                      subtitle="Notes, Slides, and References"
                      files={courseFiles}
                      onFilesAdded={(newFiles) => setCourseFiles(prev => [...prev, ...newFiles])}
                      onFileRemove={(id) => setCourseFiles(prev => prev.filter(f => f.id !== id))}
                      icon={<BookOpen className="w-8 h-8 md:w-12 md:h-12" />}
                    />
                  </div>
                  <div className="min-h-[200px] md:min-h-[320px]">
                    <FileUpload
                      title="2. Past Questions"
                      subtitle="Exams for the AI to solve"
                      files={questionFiles}
                      onFilesAdded={(newFiles) => setQuestionFiles(prev => [...prev, ...newFiles])}
                      onFileRemove={(id) => setQuestionFiles(prev => prev.filter(f => f.id !== id))}
                      icon={<HelpCircle className="w-8 h-8 md:w-12 md:h-12" />}
                    />
                  </div>
                </div>
                
                {(courseFiles.length > 0 || questionFiles.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-unfold-up pt-2">
                    <button
                      onClick={() => handleProcess(ResultMode.SOLVE)}
                      disabled={courseFiles.length === 0 || questionFiles.length === 0}
                      className="group flex items-center justify-center py-4 md:py-6 text-sm md:text-xl font-bold rounded-2xl text-white bg-primary hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/30"
                    >
                      <Cpu className="w-6 h-6 mr-3" />
                      Activate AI Engine
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleProcess(ResultMode.REVIEW)}
                      disabled={courseFiles.length === 0}
                      className="group flex items-center justify-center py-4 md:py-6 text-sm md:text-xl font-bold rounded-2xl text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Layers className="w-5 h-5 mr-3" />
                      Generate FlashDoc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
