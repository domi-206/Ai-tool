import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import { generateContentStream } from './services/geminiService';
import { UploadedFile, ProcessingState, ResultMode } from './types';
import { HelpCircle, Brain, Layers, AlertCircle, BookOpen, FileText, Zap, ScanLine } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'summary' | 'solver'>('solver');
  const [isDark, setIsDark] = useState(false);
  const [courseFiles, setCourseFiles] = useState<UploadedFile[]>([]);
  const [questionFiles, setQuestionFiles] = useState<UploadedFile[]>([]);
  const [summaryFiles, setSummaryFiles] = useState<UploadedFile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
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

  const handleProcess = async (mode: ResultMode) => {
    if (mode === ResultMode.SUMMARY) {
      if (summaryFiles.length === 0) {
        setProcessingState(prev => ({ ...prev, error: "Please upload a document to summarize." }));
        return;
      }
    } else if (mode === ResultMode.REVIEW) {
      if (courseFiles.length === 0) {
        setProcessingState(prev => ({ ...prev, error: "Please upload Course Material." }));
        return;
      }
    } else {
      if (courseFiles.length === 0 || questionFiles.length === 0) {
        setProcessingState(prev => ({ ...prev, error: "Both Course Material and Past Questions are required." }));
        return;
      }
    }

    setProcessingState({ isLoading: true, loadingMode: mode, error: null, result: null });
    setIsStreaming(true);

    try {
      const filesA = mode === ResultMode.SUMMARY ? summaryFiles : courseFiles;
      const filesB = (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) ? [] : questionFiles;

      const stream = generateContentStream(filesA, filesB, mode);
      
      let fullText = '';
      let hasStarted = false;

      for await (const chunk of stream) {
        fullText += chunk;
        if (!hasStarted) {
          hasStarted = true;
          setProcessingState(prev => ({
            ...prev,
            isLoading: false,
            loadingMode: null, 
            result: {
              text: fullText,
              mode: mode,
              timestamp: Date.now()
            }
          }));
        } else {
          setProcessingState(prev => {
            if (!prev.result) return prev; 
            return {
              ...prev,
              result: {
                ...prev.result,
                text: fullText
              }
            };
          });
        }
      }
      setIsStreaming(false);
    } catch (err: any) {
      setIsStreaming(false);
      setProcessingState({
        isLoading: false,
        loadingMode: null,
        error: err.message || "An unexpected error occurred.",
        result: null
      });
    }
  };

  const resetApp = () => {
    setProcessingState({ isLoading: false, loadingMode: null, error: null, result: null });
    setIsStreaming(false);
  };

  const getSourceFileName = () => {
    if (processingState.result?.mode === ResultMode.SUMMARY) return summaryFiles[0]?.name || "Summary";
    if (processingState.result?.mode === ResultMode.REVIEW) return courseFiles[0]?.name || "FlashCards";
    return questionFiles[0]?.name || "Solutions";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f1a] text-gray-900 dark:text-gray-100 pb-20 font-sans transition-colors">
      <Header 
        activeView={activeView} 
        onViewChange={(view) => { setActiveView(view); resetApp(); }} 
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {!processingState.result && !processingState.isLoading && (
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl tracking-tight mb-4">
              {activeView === 'summary' ? 'Smart AI Summarizer' : 'Intelligence Exam Solver'}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
              Fast, accurate, and high-yield study aids generated specifically for your course content.
            </p>
          </div>
        )}

        {processingState.isLoading && (
          <div className="fixed inset-0 bg-white/95 dark:bg-[#0b0f1a]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all duration-500">
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              <div className="absolute z-10 bg-primary/10 p-6 rounded-full animate-pulse-glow shadow-primary/20">
                <Brain className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute inset-0 animate-orbit-1">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-primary/20">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="absolute inset-0 animate-orbit-2">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow" style={{ animationDuration: '4s' }}></div>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Analyzing Data...</h3>
            <p className="text-gray-500 dark:text-gray-400">Processing your documents with UniSpace Intelligence</p>
          </div>
        )}

        {processingState.error && (
          <div className="mb-6 mx-auto max-w-3xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 dark:text-red-400 text-sm">{processingState.error}</p>
          </div>
        )}

        {processingState.result ? (
          <ResultDisplay 
            result={processingState.result} 
            onReset={resetApp} 
            sourceFileName={getSourceFileName()}
            isStreaming={isStreaming}
          />
        ) : (
          <div className={`space-y-8 ${!processingState.isLoading ? 'animate-fade-in' : 'opacity-0'}`}>
            
            {activeView === 'summary' ? (
              <div className="max-w-2xl mx-auto space-y-8">
                <FileUpload
                  title="Upload Document"
                  subtitle="PDFs, Text or Images"
                  files={summaryFiles}
                  onFilesAdded={(newFiles) => setSummaryFiles([...newFiles])}
                  onFileRemove={(id) => setSummaryFiles(prev => prev.filter(f => f.id !== id))}
                  icon={<ScanLine className="w-12 h-12" />}
                />
                
                <button
                  onClick={() => handleProcess(ResultMode.SUMMARY)}
                  disabled={summaryFiles.length === 0}
                  className="w-full flex items-center justify-center py-4 px-12 text-lg font-bold rounded-xl text-white bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 disabled:opacity-50 transition-all hover:-translate-y-1"
                >
                  <FileText className="w-6 h-6 mr-3" />
                  Summarize Now
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUpload
                    title="1. Course Material"
                    subtitle="Course slides, notes, or textbooks"
                    files={courseFiles}
                    onFilesAdded={(newFiles) => setCourseFiles(prev => [...prev, ...newFiles])}
                    onFileRemove={(id) => setCourseFiles(prev => prev.filter(f => f.id !== id))}
                    icon={<BookOpen className="w-12 h-12" />}
                  />

                  <FileUpload
                    title="2. Past Questions"
                    subtitle="Previous exam papers (Optional for FlashCards)"
                    files={questionFiles}
                    onFilesAdded={(newFiles) => setQuestionFiles(prev => [...prev, ...newFiles])}
                    onFileRemove={(id) => setQuestionFiles(prev => prev.filter(f => f.id !== id))}
                    icon={<HelpCircle className="w-12 h-12" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <button
                    onClick={() => handleProcess(ResultMode.SOLVE)}
                    disabled={courseFiles.length === 0 || questionFiles.length === 0}
                    className="group flex items-center justify-center py-5 px-6 text-lg font-bold rounded-2xl text-white bg-primary hover:bg-primary-dark shadow-xl shadow-primary/20 disabled:opacity-50 transition-all hover:-translate-y-1"
                  >
                    <Brain className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    Solve Past Questions
                  </button>

                  <button
                    onClick={() => handleProcess(ResultMode.REVIEW)}
                    disabled={courseFiles.length === 0}
                    className="group flex items-center justify-center py-5 px-6 text-lg font-bold rounded-2xl text-white bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 shadow-xl disabled:opacity-50 transition-all hover:-translate-y-1"
                  >
                    <Layers className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                    FlashCard Doc
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;