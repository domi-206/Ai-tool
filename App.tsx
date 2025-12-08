import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import { generateContentStream } from './services/geminiService';
import { UploadedFile, ProcessingState, ResultMode } from './types';
import { HelpCircle, Brain, Layers, AlertCircle, BookOpen, FileText, Zap, ScanLine } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'summary' | 'solver'>('solver');
  const [courseFiles, setCourseFiles] = useState<UploadedFile[]>([]);
  const [questionFiles, setQuestionFiles] = useState<UploadedFile[]>([]);
  const [summaryFiles, setSummaryFiles] = useState<UploadedFile[]>([]);
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    loadingMode: null,
    error: null,
    result: null
  });

  const handleProcess = async (mode: ResultMode) => {
    // Validation
    if (mode === ResultMode.SUMMARY) {
      if (summaryFiles.length === 0) {
        setProcessingState(prev => ({ ...prev, error: "Please upload a document to summarize." }));
        return;
      }
    } else {
      if (courseFiles.length === 0 || questionFiles.length === 0) {
        setProcessingState(prev => ({ ...prev, error: "Please upload both Course Material and Past Questions." }));
        return;
      }
    }

    // Start loading state
    setProcessingState({ isLoading: true, loadingMode: mode, error: null, result: null });

    try {
      // For summary, we pass summaryFiles as the first argument, empty array as second
      // For solver/review, we pass courseFiles as first, questionFiles as second
      const filesA = mode === ResultMode.SUMMARY ? summaryFiles : courseFiles;
      const filesB = mode === ResultMode.SUMMARY ? [] : questionFiles;

      const stream = generateContentStream(filesA, filesB, mode);
      
      let fullText = '';
      let hasStarted = false;

      for await (const chunk of stream) {
        fullText += chunk;
        
        if (!hasStarted) {
          hasStarted = true;
          // First chunk received: Stop loading animation and show result container immediately
          setProcessingState(prev => ({
            ...prev,
            isLoading: false,
            loadingMode: null, // Clear loading mode to remove overlay
            result: {
              text: fullText,
              mode: mode,
              timestamp: Date.now()
            }
          }));
        } else {
          // Subsequent chunks: Update text in place
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
    } catch (err: any) {
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
    // Optional: Clear files on reset? Usually better to keep them unless user explicitly removes.
  };

  const getSourceFileName = () => {
    if (processingState.result?.mode === ResultMode.SUMMARY) {
      return summaryFiles.length > 0 ? summaryFiles[0].name : "Summary";
    }
    return questionFiles.length > 0 ? questionFiles[0].name : "Exam_Result";
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans relative">
      <Header activeView={activeView} onViewChange={(view) => {
        setActiveView(view);
        resetApp(); // Reset result when switching views
      }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        {/* Title Section - Only show when not viewing result */}
        {!processingState.result && !processingState.isLoading && (
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl tracking-tight">
              {activeView === 'summary' ? 'Smart Document Summarizer' : 'Intelligent Exam Solver'}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
              {activeView === 'summary' 
                ? 'Upload any document to get a concise, structured summary and key insights instantly.'
                : 'Upload Course Material AND Past Questions. The AI will extract and solve questions strictly based on the material.'}
            </p>
          </div>
        )}

        {/* Custom Creative Loading Overlay */}
        {processingState.isLoading && (
          <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all duration-500">
            
            {/* SOLVE MODE ANIMATION */}
            {processingState.loadingMode === ResultMode.SOLVE && (
              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <div className="absolute z-10 bg-green-100 p-6 rounded-full animate-pulse-glow shadow-green-500/20">
                  <Brain className="w-16 h-16 text-green-600" />
                </div>
                <div className="absolute inset-0 animate-orbit-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="absolute inset-0 animate-orbit-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shadow-md">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-dashed border-green-200 rounded-full animate-spin-slow" style={{ animationDuration: '6s' }}></div>
              </div>
            )}

            {/* REVIEW MODE ANIMATION */}
            {processingState.loadingMode === ResultMode.REVIEW && (
              <div className="relative w-32 h-40 mb-12">
                <div className="absolute inset-0 bg-indigo-200 rounded-xl border-2 border-indigo-300 transform rotate-6 shadow-md"></div>
                <div className="absolute inset-0 bg-indigo-400 rounded-xl border-2 border-indigo-500 transform -rotate-3 shadow-md"></div>
                <div className="absolute inset-0 bg-white rounded-xl border-2 border-indigo-600 flex items-center justify-center shadow-xl animate-card-shuffle">
                  <Zap className="w-10 h-10 text-indigo-600 fill-current" />
                </div>
              </div>
            )}

            {/* SUMMARY MODE ANIMATION */}
            {processingState.loadingMode === ResultMode.SUMMARY && (
              <div className="relative w-40 h-56 mb-8 bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col items-center p-4">
                 <div className="space-y-3 w-full opacity-30">
                    <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-400 rounded w-full"></div>
                    <div className="h-2 bg-gray-400 rounded w-full"></div>
                    <div className="h-2 bg-gray-400 rounded w-5/6"></div>
                    <div className="h-2 bg-gray-400 rounded w-full"></div>
                 </div>
                 {/* Scanning Bar */}
                 <div className="absolute left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
              </div>
            )}

            <h3 className={`text-2xl font-bold mb-2 ${
              processingState.loadingMode === ResultMode.REVIEW ? 'text-indigo-900' : 
              processingState.loadingMode === ResultMode.SUMMARY ? 'text-blue-900' : 'text-green-900'
            }`}>
              {processingState.loadingMode === ResultMode.SOLVE ? 'Constructing Solutions...' : 
               processingState.loadingMode === ResultMode.REVIEW ? 'Distilling Flashcards...' :
               'Analyzing Document...'}
            </h3>
            
            <p className="text-gray-500 max-w-md text-center px-4">
              {processingState.loadingMode === ResultMode.SOLVE 
                ? 'Cross-referencing your course materials with past questions...' 
                : processingState.loadingMode === ResultMode.REVIEW 
                  ? 'Extracting high-yield concepts for rapid memorization...'
                  : 'Identifying key themes and creating a structured summary...'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {processingState.error && (
          <div className="mb-6 mx-auto max-w-3xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{processingState.error}</p>
          </div>
        )}

        {/* Main Content */}
        {processingState.result ? (
          <ResultDisplay 
            result={processingState.result} 
            onReset={resetApp} 
            sourceFileName={getSourceFileName()}
          />
        ) : (
          <div className={`space-y-8 ${!processingState.isLoading ? 'animate-fade-in' : 'opacity-0'}`}>
            
            {activeView === 'summary' ? (
              /* Summary Upload View */
              <div className="max-w-2xl mx-auto">
                <FileUpload
                  title="Upload Document"
                  subtitle="PDFs or Images to Summarize"
                  files={summaryFiles}
                  onFilesAdded={(newFiles) => setSummaryFiles(prev => {
                    // Force single file for summary mode (replace existing)
                    return [...newFiles];
                  })}
                  onFileRemove={(id) => setSummaryFiles(prev => prev.filter(f => f.id !== id))}
                  icon={<ScanLine className="w-12 h-12 text-blue-500" />}
                />
                
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => handleProcess(ResultMode.SUMMARY)}
                    disabled={summaryFiles.length === 0}
                    className="group relative flex items-center justify-center py-4 px-12 border border-transparent text-lg font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 w-full md:w-auto"
                  >
                    <FileText className="w-6 h-6 mr-3 text-white/90" />
                    Summarize Document
                  </button>
                </div>
              </div>
            ) : (
              /* Exam Solver Upload View */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Course Material */}
                  <FileUpload
                    title="1. Course Material"
                    subtitle="Textbooks, Notes, Slides"
                    files={courseFiles}
                    onFilesAdded={(newFiles) => setCourseFiles(prev => [...prev, ...newFiles])}
                    onFileRemove={(id) => setCourseFiles(prev => prev.filter(f => f.id !== id))}
                    icon={<BookOpen className="w-12 h-12 text-blue-500" />}
                  />

                  {/* Right: Past Questions */}
                  <FileUpload
                    title="2. Past Questions"
                    subtitle="Exam papers to solve"
                    files={questionFiles}
                    onFilesAdded={(newFiles) => setQuestionFiles(prev => [...prev, ...newFiles])}
                    onFileRemove={(id) => setQuestionFiles(prev => prev.filter(f => f.id !== id))}
                    icon={<HelpCircle className="w-12 h-12 text-orange-500" />}
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <button
                    onClick={() => handleProcess(ResultMode.SOLVE)}
                    disabled={courseFiles.length === 0 || questionFiles.length === 0}
                    className="group relative flex items-center justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                  >
                    <Brain className="w-6 h-6 mr-3 text-white/90 group-hover:rotate-12 transition-transform" />
                    Solve Past Questions
                  </button>

                  <button
                    onClick={() => handleProcess(ResultMode.REVIEW)}
                    disabled={courseFiles.length === 0 || questionFiles.length === 0}
                    className="group relative flex items-center justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                  >
                    <Layers className="w-6 h-6 mr-3 text-white/90 group-hover:rotate-12 transition-transform" />
                    Flashcards
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;