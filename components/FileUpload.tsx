
import React, { useRef } from 'react';
import { Upload, FileText, X, FileImage, FileCode, CheckCircle2 } from 'lucide-react';
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col h-full">
      <div 
        className={`relative group border-2 border-dashed rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          files.length > 0 
            ? 'border-primary/40 bg-primary/5 dark:bg-primary/5 h-32 md:h-40' 
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 h-full'
        }`}
        onClick={triggerUpload}
      >
        <div className={`transition-transform duration-300 ${files.length > 0 ? 'scale-75 -translate-y-1' : 'mb-3 scale-100'}`}>
          <div className="text-primary/60 dark:text-primary/40 flex justify-center">
            {icon}
          </div>
        </div>
        
        <div className={`${files.length > 0 ? 'mt-0' : 'mt-2'}`}>
          <h3 className="text-gray-900 dark:text-white font-bold text-sm md:text-base">
            {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''} Ready` : title}
          </h3>
          {!files.length && <p className="text-gray-500 dark:text-gray-400 text-[10px] md:text-xs">{subtitle}</p>}
        </div>

        {files.length === 0 && (
          <button 
            className="mt-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 font-bold py-1.5 px-4 rounded-lg shadow-sm text-xs transition-all"
            onClick={(e) => { e.stopPropagation(); triggerUpload(); }}
          >
            Choose Files
          </button>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          multiple 
          accept=".pdf,.txt,image/*"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 overflow-y-auto max-h-[180px] md:max-h-[300px] custom-scrollbar pr-1 animate-fade-in">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Selected Documents</span>
            <button onClick={triggerUpload} className="text-[10px] text-primary hover:underline font-bold">Add More</button>
          </div>
          {files.map((file) => (
            <div key={file.id} className="group relative flex items-center bg-white dark:bg-gray-800 p-2 md:p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary/50 transition-all">
              <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-700 mr-3">
                {file.type.includes('image') ? (
                  <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type.includes('pdf') ? (
                  <FileText className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                ) : (
                  <FileCode className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate leading-tight">{file.name}</span>
                  <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                </div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onFileRemove(file.id); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
