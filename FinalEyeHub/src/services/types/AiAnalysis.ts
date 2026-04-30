export interface AiAnalysisIssue {
  severity: string;
  category: string;
  description: string;
  location: string;
  suggestion: string;
}

export interface AiAnalysisReportItem {
  targetFile: string;
  matchedReferenceFile: string;
  similarityScore: number;
  overallAssessment: string;
  issues: AiAnalysisIssue[];
}

export interface AiAnalysisResponse {
  success: boolean;
  error: string | null;
  referenceFileCount: number;
  targetFileCount: number;
  reports: AiAnalysisReportItem[];
}

export interface AiAnalysisRequest {
  referenceFolderPath: string;
  targetFolderPath: string;
  additionalInstructions: string;
}
