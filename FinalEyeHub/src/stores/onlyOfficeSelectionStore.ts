import type { ViewerDocument } from '@/services/types/ViewerDocument';
import { reactive, readonly } from 'vue';

interface OnlyOfficeSelectionState {
  currentDocument: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
  sourceFilePath: string;
  targetFilePath: string;
  transcheckReportPaths: string[];
  segmentReviewReportPaths: string[];
  transiqReportPaths: string[];
  glossaryPaths: string[];
  referenceFilePaths: string[];
}

const state = reactive<OnlyOfficeSelectionState>({
  currentDocument: '',
  sourceDocument: null,
  targetDocument: null,
  sourceFilePath: '',
  targetFilePath: '',
  transcheckReportPaths: [],
  segmentReviewReportPaths: [],
  transiqReportPaths: [],
  glossaryPaths: [],
  referenceFilePaths: []
});

interface UpdateSelectionPayload {
  currentDocument?: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
  sourceFilePath?: string;
  targetFilePath?: string;
  transcheckReportPaths?: string[];
  segmentReviewReportPaths?: string[];
  transiqReportPaths?: string[];
  glossaryPaths?: string[];
  referenceFilePaths?: string[];
}

export function useOnlyOfficeSelectionStore() {
  const updateSelection = (payload: UpdateSelectionPayload) => {
    state.currentDocument = payload.currentDocument ?? '';
    state.sourceDocument = payload.sourceDocument;
    state.targetDocument = payload.targetDocument;
    state.sourceFilePath = payload.sourceFilePath ?? '';
    state.targetFilePath = payload.targetFilePath ?? '';
    state.transcheckReportPaths = payload.transcheckReportPaths ?? [];
    state.segmentReviewReportPaths = payload.segmentReviewReportPaths ?? [];
    state.transiqReportPaths = payload.transiqReportPaths ?? [];
    state.glossaryPaths = payload.glossaryPaths ?? [];
    state.referenceFilePaths = payload.referenceFilePaths ?? [];
  };

  const clearSelection = () => {
    state.currentDocument = '';
    state.sourceDocument = null;
    state.targetDocument = null;
    state.sourceFilePath = '';
    state.targetFilePath = '';
    state.transcheckReportPaths = [];
    state.segmentReviewReportPaths = [];
    state.transiqReportPaths = [];
    state.glossaryPaths = [];
    state.referenceFilePaths = [];
  };

  return {
    state: readonly(state),
    updateSelection,
    clearSelection
  };
}
