<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import FileSelectionModal from './FileSelectionModal.vue';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';
import type { ViewerDocument } from '@/services/types/ViewerDocument';
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore';

interface SubmitSelectionPayload {
  currentDocument: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
  sourceFilePath: string;
  targetFilePath: string;
  transcheckReportPaths: string[];
  segmentReviewReportPaths: string[];
  transiqReportPaths: string[];
  glossaryPaths: string[];
}

const showModal = ref(false);
const { state, updateSelection } = useOnlyOfficeSelectionStore();
const { state: submissionState } = useFinalEyeSubmissionStore();

const selectedSource = computed(() => state.sourceDocument?.name ?? 'No source selected');
const selectedTarget = computed(() => state.targetDocument?.name ?? 'No target selected');
const currentDocument = computed(() => state.currentDocument);

const onSelectionSubmit = (payload: SubmitSelectionPayload) => {
  updateSelection(payload);
  showModal.value = false;
};

watch(
  () => ({
    loading: submissionState.loading,
    sourceCount: submissionState.sourceFiles.length,
    submissionId: submissionState.submissionId,
    hasSelection: Boolean(state.sourceDocument && state.targetDocument)
  }),
  ({ loading, sourceCount, submissionId, hasSelection }) => {
    // Auto-open selection modal when redirected submission data is ready.
    if (!loading && submissionId && sourceCount > 0 && !hasSelection) {
      showModal.value = true;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="file-ribbon">
    <div class="file-info">
      <span v-if="currentDocument"><strong>Current:</strong> {{ currentDocument }}</span>
      <span><strong>Source:</strong> {{ selectedSource }}</span>
      <span><strong>Target:</strong> {{ selectedTarget }}</span>
    </div>

    <button class="select-btn" @click="showModal = true">
      Select File
    </button>

    <FileSelectionModal
      v-if="showModal"
      @close="showModal = false"
      @submit-selection="onSelectionSubmit"
    />
  </div>
</template>

<style scoped>
.file-ribbon {
  height: 32px;
  min-height: 32px;
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 16px;
  box-sizing: border-box;

  border-bottom: 1px solid #ddd;
  background-color: #f8f9fa;

  color: #222;
  font-size: 13px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 24px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-btn {
  height: 24px;
  min-width: 90px;

  padding: 0 12px;

  border: 1px solid #ccc;
  border-radius: 4px;

  background: white;
  cursor: pointer;
}
</style>