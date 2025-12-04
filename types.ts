export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 string
}

export enum ResultMode {
  SOLVE = 'SOLVE',
  REVIEW = 'REVIEW',
}

export interface ProcessingResult {
  text: string;
  mode: ResultMode;
  timestamp: number;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  result: ProcessingResult | null;
}
