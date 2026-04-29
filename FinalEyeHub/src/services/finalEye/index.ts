import axios, { type AxiosInstance } from 'axios';

export interface SubmissionDetailInfo {
  name?: string;
  projectName?: string;
  instructions?: string;
  sourceLanguage?: string;
  targetLanguages?: string[];
  fileCount?: number;
  batchInfos?: Array<{
    name?: string;
    workflowName?: string;
  }>;
}

export interface SubmissionFileInfo {
  name: string;
  path: string;
  contentType?: string;
}

export interface SubmissionFolderInfo {
  name: string;
  type: string;
  folders: SubmissionFolderInfo[];
  files: SubmissionFileInfo[];
}

export interface SubmissionFullResponse {
  submissionDetails?: SubmissionDetailInfo;
  folderDetails?: SubmissionFolderInfo;
}

export interface TranscheckAnalysisRow {
  columnValues?: Record<string, string>;
  source?: string;
  target?: string;
  message?: string;
  notes?: string;
  priority?: string;
  isEmptyNote?: boolean;
  hasMultipleNotes?: boolean;
  tags?: string[];
}

export interface TranscheckAnalysisSection {
  key: string;
  displayName: string;
  detectedHeaders?: string[];
  rows: TranscheckAnalysisRow[];
}

export interface TranscheckAnalysisResponse {
  sections: TranscheckAnalysisSection[];
}

class FinalEyeService {
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = (import.meta.env.VITE_FINALEYE_BASE_URL || 'http://localhost:5001').trim();
    this.client = axios.create({
      baseURL: baseURL.replace(/\/$/, ''),
      timeout: 30000
    });
  }

  async getSubmissionInfo(submissionId: string): Promise<SubmissionFullResponse> {
    const response = await this.client.get<SubmissionFullResponse>('/TransCheck/submission/full', {
      params: {
        submissionId,
        'api-version': 1
      }
    });

    return response.data;
  }

  async getTranscheckAnalysis(reportPath: string): Promise<TranscheckAnalysisResponse> {
    const normalizedPath = reportPath.trim();
    if (!normalizedPath) {
      return { sections: [] };
    }

    const response = await this.client.get<TranscheckAnalysisResponse | { data?: TranscheckAnalysisResponse }>(
      '/TransCheck/report/sections',
      {
        params: {
          filePath: normalizedPath,
          'api-version': 1
        }
      }
    );

    const payload = (response.data as { data?: TranscheckAnalysisResponse })?.data ?? response.data;
    if (payload && Array.isArray((payload as TranscheckAnalysisResponse).sections)) {
      return payload as TranscheckAnalysisResponse;
    }

    return { sections: [] };
  }
}

export const finalEyeService = new FinalEyeService();
