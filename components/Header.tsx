
import React from 'react';
import { BrainCircuit, FileText, Moon, Sun, Cpu } from 'lucide-react';

interface HeaderProps {
  activeView: 'summary' | 'solver';
  onViewChange: (view: 'summary' | 'solver') => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, isDark, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#0b0f1a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">UniSpace <span className="text-primary">AI</span></span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex space-x-1 border border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => onViewChange('summary')}
              className={`flex items-center px-4 py-2 font-medium text-sm transition-all rounded-md whitespace-nowrap ${
                activeView === 'summary' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </button>
            <button 
              onClick={() => onViewChange('solver')}
              className={`flex items-center px-4 py-2 font-medium text-sm rounded-md transition-all whitespace-nowrap ${
                activeView === 'solver'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Cpu className="w-4 h-4 mr-2" />
              AI Engine
            </button>
          </div>

          <button 
            onClick={toggleTheme}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary transition-colors border border-gray-200 dark:border-gray-700"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
