import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';
import { generateExamSolution } from './services/geminiService';
import { UploadedFile, ProcessingState, ResultMode } from './types';
import { FileText, HelpCircle, Brain, Layers, AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [courseFiles, setCourseFiles] = useState<UploadedFile[]>([]);
  const [questionFiles, setQuestionFiles] = useState<UploadedFile[]>([]);
  
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    error: null,
    result: null
  });

  const handleProcess = async (mode: ResultMode) => {
    if (courseFiles.length === 0 || questionFiles.length === 0) {
      setProcessingState(prev => ({ ...prev, error: "Please upload both Course Material and Past Questions." }));
      return;
    }

    setProcessingState({ isLoading: true, error: null, result: null });

    try {
      const textResult = await generateExamSolution(courseFiles, questionFiles, mode);
      
      setProcessingState({
        isLoading: false,
        error: null,
        result: {
          text: textResult,
          mode: mode,
          timestamp: Date.now()
        }
      });
    } catch (err: any) {
      setProcessingState({
        isLoading: false,
        error: err.message || "An unexpected error occurred.",
        result: null
      });
    }
  };

  const resetApp = () => {
    setProcessingState({ isLoading: false, error: null, result: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        
        {/* Title Section */}
        {!processingState.result && (
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Intelligent Exam Solver
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
              Upload Course Material AND Past Questions. The AI will extract and solve questions strictly based on the material.
            </p>
          </div>
        )}

        {/* Processing Loading Overlay */}
        {processingState.isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-green-600 animate-spin mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">Analyzing Materials & Solving Questions...</h3>
            <p className="text-gray-500 mt-2">This relies on large context processing, please wait.</p>
          </div>
        )}

        {/* Error Message */}
        {processingState.error && (
          <div className="mb-6 mx-auto max-w-3xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{processingState.error}</p>
          </div>
        )}

        {/* Main Content Switcher */}
        {processingState.result ? (
          <ResultDisplay result={processingState.result} onReset={resetApp} />
        ) : (
          <div className="space-y-8">
            {/* Upload Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Course Material */}
              <FileUpload
                title="1. Course Material"
                subtitle="Textbooks, Notes, Slides"
                files={courseFiles}
                onFilesAdded={(newFiles) => setCourseFiles(prev => [...prev, ...newFiles])}
                onFileRemove={(id) => setCourseFiles(prev => prev.filter(f => f.id !== id))}
                icon={<FileText className="w-12 h-12" />}
              />

              {/* Right: Past Questions */}
              <FileUpload
                title="2. Past Questions"
                subtitle="Exam papers to solve"
                files={questionFiles}
                onFilesAdded={(newFiles) => setQuestionFiles(prev => [...prev, ...newFiles])}
                onFileRemove={(id) => setQuestionFiles(prev => prev.filter(f => f.id !== id))}
                icon={<HelpCircle className="w-12 h-12" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <button
                onClick={() => handleProcess(ResultMode.SOLVE)}
                disabled={courseFiles.length === 0 || questionFiles.length === 0}
                className="group relative flex items-center justify-center py-4 px-6 border border-transparent text-lg font-medium rounded-xl text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Brain className="w-6 h-6 mr-3 text-white/90 group-hover:scale-110 transition-transform" />
                Solve Past Questions
              </button>

              <button
                onClick={() => handleProcess(ResultMode.REVIEW)}
                disabled={courseFiles.length === 0 || questionFiles.length === 0}
                className="group relative flex items-center justify-center py-4 px-6 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Layers className="w-6 h-6 mr-3 text-white/90 group-hover:scale-110 transition-transform" />
                Quick Review
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;