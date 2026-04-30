import axios from 'axios';
import type { AiAnalysisRequest, AiAnalysisResponse } from '@/services/types/AiAnalysis';

const baseUrl = (import.meta.env.VITE_AI_ANALYSIS_API_HOST ?? 'http://localhost:5001').replace(
  /\/$/,
  ''
);

export async function analyzeGuidelinesFile(payload: AiAnalysisRequest): Promise<AiAnalysisResponse> {
  const { data } = await axios.post<AiAnalysisResponse>(
    `${baseUrl}/AiAnalysis/analyze`,
    payload,
    {
      params: { 'api-version': '1' },
      headers: {
        Accept: 'text/plain',
        'Content-Type': 'application/json'
      },
      timeout: 600_000
    }
  );
  return data;
}
