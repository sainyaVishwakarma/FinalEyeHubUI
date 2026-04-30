<script setup lang="ts">
import type { ViewerDocument } from '@/services/types/ViewerDocument';
import { computed, ref, watch } from 'vue';
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';

interface FileOption {
  key: string;
  label: string;
  fileName: string;
  filePath: string;
  language?: string;
  reports?: {
    transcheckPaths: readonly string[];
    segmentReviewPaths: readonly string[];
    transiqPaths: readonly string[];
    glossaryPaths: readonly string[];
    referencePaths: readonly string[];
  };
}

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

const emit = defineEmits<{
  close: [];
  'submit-selection': [payload: SubmitSelectionPayload];
}>();

const { state: submissionState } = useFinalEyeSubmissionStore();
const { state: selectionState } = useOnlyOfficeSelectionStore();

const selectedSource = ref(selectionState.sourceFilePath || '');
const selectedTarget = ref(selectionState.targetFilePath || '');

const sourceFiles = computed<FileOption[]>(() =>
  submissionState.sourceFiles.map((file, index) => ({
    key: `source-${index}-${file.path}`,
    label: file.name,
    fileName: file.name,
    filePath: file.path
  }))
);

const sourceFileByPath = computed<Record<string, FileOption>>(() =>
  sourceFiles.value.reduce<Record<string, FileOption>>((acc, item) => {
    acc[item.filePath] = item;
    return acc;
  }, {})
);

const selectedSourceOption = computed(() =>
  sourceFileByPath.value[selectedSource.value] ?? null
);

const targetFiles = computed<FileOption[]>(() => {
  const sourceName = selectedSourceOption.value?.fileName;
  if (!sourceName) return [];

  const targets = submissionState.targetFilesBySource[sourceName] ?? [];
  return targets.map((target, index) => ({
    key: `target-${index}-${target.path}`,
    label: target.language ? `${target.name} (${target.language})` : target.name,
    fileName: target.name,
    filePath: target.path,
    language: target.language,
    reports: target.reports
  }));
});

const targetFileByPath = computed<Record<string, FileOption>>(() =>
  targetFiles.value.reduce<Record<string, FileOption>>((acc, item) => {
    acc[item.filePath] = item;
    return acc;
  }, {})
);

const selectedTargetOption = computed(() =>
  targetFileByPath.value[selectedTarget.value] ?? null
);

function toViewerDocument(file: FileOption | null): ViewerDocument | null {
  if (!file) return null;
  return {
    // Using absolute file path as lookup key for backend file serving.
    downloadId: file.filePath,
    name: file.fileName
  };
}

function onSourceChanged() {
  selectedTarget.value = '';
}

watch(
  targetFiles,
  (nextTargets) => {
    if (!selectedTarget.value) return;
    const exists = nextTargets.some((item) => item.filePath === selectedTarget.value);
    if (!exists) selectedTarget.value = '';
  },
  { immediate: true }
);

function submitSelection() {
  const source = selectedSourceOption.value;
  const target = selectedTargetOption.value;
  const latestTranscheckPath = target?.reports?.transcheckPaths?.[0];
  const latestSegmentReviewPath = target?.reports?.segmentReviewPaths?.[0];
  const latestTransiqPath = target?.reports?.transiqPaths?.[0];
  const latestGlossaryPath = target?.reports?.glossaryPaths?.[0];
  const referencePaths = target?.reports?.referencePaths ?? [];

  emit('submit-selection', {
    currentDocument: source?.fileName ?? '',
    sourceDocument: toViewerDocument(source),
    targetDocument: toViewerDocument(target),
    sourceFilePath: source?.filePath ?? '',
    targetFilePath: target?.filePath ?? '',
    transcheckReportPaths: latestTranscheckPath ? [latestTranscheckPath] : [],
    segmentReviewReportPaths: latestSegmentReviewPath ? [latestSegmentReviewPath] : [],
    transiqReportPaths: latestTransiqPath ? [latestTransiqPath] : [],
    glossaryPaths: latestGlossaryPath ? [latestGlossaryPath] : [],
    referenceFilePaths: [...referencePaths]
  });
}
</script>

<template>
  <div class="modal-overlay">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="file-selection-title">
      <h3 id="file-selection-title" class="modal__title">Select Files</h3>
      <p v-if="submissionState.loading" class="status-note">Loading submission files...</p>
      <p v-else-if="submissionState.error" class="status-error">{{ submissionState.error }}</p>
      <p v-else-if="sourceFiles.length === 0" class="status-note">
        No source files found for this submission.
      </p>

      <div class="field">
        <label>Source File</label>
        <select v-model="selectedSource" @change="onSourceChanged">
          <option value="">Select source file</option>
          <option
            v-for="file in sourceFiles"
            :key="file.key"
            :value="file.filePath"
          >
            {{ file.label }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Target File</label>
        <select v-model="selectedTarget">
          <option value="">Select target file</option>
          <option
            v-for="file in targetFiles"
            :key="file.key"
            :value="file.filePath"
          >
            {{ file.label }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button class="btn btn--secondary" type="button" @click="$emit('close')">Cancel</button>
        <button
          class="btn btn--primary"
          type="button"
          :disabled="!selectedSourceOption || !selectedTargetOption"
          @click="submitSelection"
        >
          Submit
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

@use '../assets/styles/main.scss' as *;
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 110000;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.modal {
  width: min(500px, 100%);
  background: #fff;
  padding: 1.4rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 24px 48px rgba(15, 23, 42, 0.24),
    0 8px 16px rgba(15, 23, 42, 0.12);
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  margin-bottom: 0.45rem;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
}

.field select {
  width: 100%;
  height: 2.5rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 0 0.75rem;
  color: #0f172a;
  background-color: #fff;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.modal__title {
  margin: 0 0 0.65rem;
  color: #0f172a;
  font-size: 1.125rem;
  font-weight: 700;
}

.status-note {
  margin: 0 0 0.75rem;
  color: #4b5563;
  font-size: 0.8125rem;
}

.status-error {
  margin: 0 0 0.75rem;
  color: #b91c1c;
  font-size: 0.8125rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.btn {
  min-width: 96px;
  height: 2.4rem;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--secondary {
  background: #f8fafc;
  color: #334155;
  border-color: #cbd5e1;
}

.btn--secondary:hover {
  background: #f1f5f9;
}

.btn--primary {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
}

.btn--primary:hover {
  background: #1d4ed8;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>