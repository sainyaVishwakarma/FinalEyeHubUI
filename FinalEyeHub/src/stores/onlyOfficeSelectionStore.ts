import type { ViewerDocument } from '@/services/types/ViewerDocument';
import { reactive, readonly } from 'vue';

interface OnlyOfficeSelectionState {
  currentDocument: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
}

const state = reactive<OnlyOfficeSelectionState>({
  currentDocument: '',
  sourceDocument: null,
  targetDocument: null
});

interface UpdateSelectionPayload {
  currentDocument?: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
}

export function useOnlyOfficeSelectionStore() {
  const updateSelection = (payload: UpdateSelectionPayload) => {
    state.currentDocument = payload.currentDocument ?? '';
    state.sourceDocument = payload.sourceDocument;
    state.targetDocument = payload.targetDocument;
  };

  const clearSelection = () => {
    state.currentDocument = '';
    state.sourceDocument = null;
    state.targetDocument = null;
  };

  return {
    state: readonly(state),
    updateSelection,
    clearSelection
  };
}
