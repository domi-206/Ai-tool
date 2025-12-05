import React from 'react';
import { BrainCircuit, FileText } from 'lucide-react';

interface HeaderProps {
  activeView: 'summary' | 'solver';
  onViewChange: (view: 'summary' | 'solver') => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, onViewChange }) => {
  return (
    <header className="flex justify-center items-center py-6">
      <div className="bg-white rounded-lg shadow-sm p-1 flex space-x-1 border border-gray-200">
        <button 
          onClick={() => onViewChange('summary')}
          className={`flex items-center px-4 py-2 font-medium text-sm transition-all rounded-md ${
            activeView === 'summary' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Smart Summary
        </button>
        <button 
          onClick={() => onViewChange('solver')}
          className={`flex items-center px-4 py-2 font-medium text-sm rounded-md transition-all ${
            activeView === 'solver'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BrainCircuit className="w-4 h-4 mr-2" />
          AI Exam Solver
        </button>
      </div>
    </header>
  );
};

export default Header;