<script setup lang="ts">
import type { ViewerDocument } from '@/services/types/ViewerDocument';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';

type RawFileOption = string | Record<string, unknown>;

interface FileOption {
  key: string;
  label: string;
  requestValue: string;
  document: ViewerDocument | null;
}

interface SubmitSelectionPayload {
  currentDocument: string;
  sourceDocument: ViewerDocument | null;
  targetDocument: ViewerDocument | null;
}

const emit = defineEmits<{
  close: [];
  'submit-selection': [payload: SubmitSelectionPayload];
}>();

const sourceFiles = ref<FileOption[]>([]);
const targetFiles = ref<FileOption[]>([]);

const selectedSource = ref('');
const selectedTarget = ref('');

function normalizeViewerDocument(raw: unknown): ViewerDocument | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;
  const downloadId = data.downloadId ?? data.id ?? data.fileId ?? data.documentId;
  const name =
    data.name ??
    data.fileName ??
    data.documentName ??
    data.displayName ??
    data.sourceFile ??
    data.targetFile;

  if ((typeof downloadId === 'string' || typeof downloadId === 'number') && typeof name === 'string') {
    return {
      downloadId,
      name
    };
  }

  return null;
}

function toFileOption(item: RawFileOption, index: number, prefix: string): FileOption {
  if (typeof item === 'string') {
    return {
      key: `${prefix}-${index}`,
      label: item,
      requestValue: item,
      document: null
    };
  }

  const candidate = normalizeViewerDocument(item);
  const fallbackName =
    (item.label as string | undefined) ??
    (item.name as string | undefined) ??
    (item.fileName as string | undefined) ??
    `File ${index + 1}`;
  const valueCandidate =
    item.value ??
    item.fileKey ??
    item.downloadId ??
    item.id ??
    item.fileName ??
    item.name;

  return {
    key: `${prefix}-${index}-${fallbackName}`,
    label: fallbackName,
    requestValue:
      typeof valueCandidate === 'string' || typeof valueCandidate === 'number'
        ? String(valueCandidate)
        : fallbackName,
    document: candidate
  };
}

const selectedSourceOption = computed(() =>
  sourceFiles.value.find((option) => option.key === selectedSource.value)
);

const selectedTargetOption = computed(() =>
  targetFiles.value.find((option) => option.key === selectedTarget.value)
);

async function fetchDropdownData() {
  try {
    const response = await axios.get('/api/files/options');
    const rawSource = Array.isArray(response.data?.sourceFiles) ? response.data.sourceFiles : [];
    const rawTarget = Array.isArray(response.data?.targetFiles) ? response.data.targetFiles : [];

    sourceFiles.value = rawSource.map((item: RawFileOption, index: number) =>
      toFileOption(item, index, 'source')
    );
    targetFiles.value = rawTarget.map((item: RawFileOption, index: number) =>
      toFileOption(item, index, 'target')
    );
  } catch (error) {
    console.error('Error fetching dropdown data', error);
  }
}

function resolveDocumentFromResponse(
  payload: unknown,
  kind: 'source' | 'target'
): ViewerDocument | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;

  const direct = normalizeViewerDocument(data[`${kind}Document`]);
  if (direct) return direct;

  const fromFile = normalizeViewerDocument(data[`${kind}File`]);
  if (fromFile) return fromFile;

  if (data.data && typeof data.data === 'object') {
    const nested = data.data as Record<string, unknown>;
    const nestedDirect = normalizeViewerDocument(nested[`${kind}Document`]);
    if (nestedDirect) return nestedDirect;
    const nestedFile = normalizeViewerDocument(nested[`${kind}File`]);
    if (nestedFile) return nestedFile;
  }

  return null;
}

function buildCurrentDocumentLabel(responseData: unknown): string {
  if (!responseData || typeof responseData !== 'object') return '';
  const data = responseData as Record<string, unknown>;
  if (typeof data.currentDocument === 'string') return data.currentDocument;
  return '';
}

async function submitSelection() {
  try {
    const sourceRequestValue = selectedSourceOption.value?.requestValue ?? '';
    const targetRequestValue = selectedTargetOption.value?.requestValue ?? '';

    const response = await axios.post('/api/files/fetch', {
      sourceFile: sourceRequestValue,
      targetFile: targetRequestValue
    });

    emit('submit-selection', {
      currentDocument: buildCurrentDocumentLabel(response.data),
      sourceDocument:
        resolveDocumentFromResponse(response.data, 'source') ??
        selectedSourceOption.value?.document ??
        null,
      targetDocument:
        resolveDocumentFromResponse(response.data, 'target') ??
        selectedTargetOption.value?.document ??
        null
    });
  } catch (error) {
    console.error('Error submitting selection', error);
  }
}

onMounted(() => {
  fetchDropdownData();
});
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>Select Files</h3>

      <div class="field">
        <label>Source File</label>
        <select v-model="selectedSource">
          <option value="">Select source file</option>
          <option
            v-for="file in sourceFiles"
            :key="file.key"
            :value="file.key"
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
            :value="file.key"
          >
            {{ file.label }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button @click="$emit('close')">Cancel</button>
        <button @click="submitSelection">Submit</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

@use '../assets/styles/main.scss' as *;
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  width: 420px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 70001;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
}

.field select {
  width: 100%;
  height: 36px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>