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
  referenceFilePaths: string[];
}

const showModal = ref(false);
const { state, updateSelection } = useOnlyOfficeSelectionStore();
const { state: submissionState } = useFinalEyeSubmissionStore();

const selectedSource = computed(() => state.sourceDocument?.name ?? 'No source selected');
const selectedTarget = computed(() => state.targetDocument?.name ?? 'No target selected');
const submissionId = computed(() => submissionState.submissionId || 'N/A');
const submissionName = computed(
  () =>
    submissionState.submissionInfo?.submissionDetails?.name ||
    submissionState.submissionInfo?.submissionDetails?.projectName ||
    state.currentDocument ||
    'N/A'
);

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
    <div class="file-info" role="status" aria-live="polite">
      <div class="meta-chip">
        <span class="meta-chip__label">Submission ID</span>
        <span class="meta-chip__value">{{ submissionId }}</span>
      </div>
      <div class="meta-chip meta-chip--wide">
        <span class="meta-chip__label">Submission Name</span>
        <span class="meta-chip__value">{{ submissionName }}</span>
      </div>
      <div class="meta-chip meta-chip--wide">
        <span class="meta-chip__label">Source File</span>
        <span class="meta-chip__value">{{ selectedSource }}</span>
      </div>
      <div class="meta-chip meta-chip--wide">
        <span class="meta-chip__label">Target File</span>
        <span class="meta-chip__value">{{ selectedTarget }}</span>
      </div>
    </div>

    <button class="select-btn" type="button" @click="showModal = true">
      Select File
    </button>

    <FileSelectionModal
      v-if="showModal"
      @close="showModal = false"
      @submit-selection="onSelectionSubmit"
    />
  </div>
</template>

<style scoped lang="scss">
.file-ribbon {
  min-height: 44px;
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 6px 14px;
  box-sizing: border-box;

  border-bottom: 1px solid #dbe4f0;
  background:
    linear-gradient(180deg, #f9fbff 0%, #f3f7fd 100%);
  color: #1f2937;
  font-size: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  min-width: fit-content;
  max-width: 330px;
  padding: 0 10px;
  border: 1px solid #d8e2ef;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.meta-chip--wide {
  min-width: 220px;
}

.meta-chip__label {
  color: #64748b;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.meta-chip__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #0f172a;
  font-weight: 600;
}

.select-btn {
  height: 32px;
  min-width: 112px;
  padding: 0 14px;
  border: 1px solid #1d4ed8;
  border-radius: 8px;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.25);
  transition:
    transform 0.16s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.select-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.02);
}

.select-btn:active {
  transform: translateY(0);
}

@media (max-width: 980px) {
  .file-ribbon {
    padding-right: 10px;
    padding-left: 10px;
  }

  .meta-chip {
    max-width: 240px;
  }
}
</style>