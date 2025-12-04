import React, { useRef } from 'react';
import { Upload, FileText, X, FileImage } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploadProps {
  title: string;
  subtitle: string;
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemove: (id: string) => void;
  icon: React.ReactNode;
}

const FileUpload: React.FC<FileUploadProps> = ({ title, subtitle, files, onFilesAdded, onFileRemove, icon }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // Simple base64 converter
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });

        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          data: base64
        });
      }
      onFilesAdded(newFiles);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full">
      <div 
        className="flex-1 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer min-h-[300px]"
        onClick={triggerUpload}
      >
        <div className="text-gray-400 mb-4">
          {icon}
        </div>
        <h3 className="text-gray-900 font-bold text-lg mb-1">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{subtitle}</p>
        
        <button 
          className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-6 rounded-lg shadow-sm text-sm transition-all"
          onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
        >
          Select Files
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
          accept=".pdf,.txt,image/*"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-3 overflow-hidden">
                {file.type.includes('image') ? (
                   <FileImage className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                   <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
              </div>
              <button 
                onClick={() => onFileRemove(file.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;