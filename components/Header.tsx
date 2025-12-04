import React from 'react';
import { BrainCircuit, GitFork } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-center items-center py-6">
      <div className="bg-white rounded-lg shadow-sm p-1 flex space-x-1 border border-gray-200">
        <button className="flex items-center px-4 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors rounded-md">
          <GitFork className="w-4 h-4 mr-2" />
          Topic Path
        </button>
        <button className="flex items-center px-4 py-2 bg-green-600 text-white font-medium text-sm rounded-md shadow-sm">
          <BrainCircuit className="w-4 h-4 mr-2" />
          AI Engine
        </button>
      </div>
    </header>
  );
};

export default Header;