<script setup lang="ts">
import axios from 'axios';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';
import { finalEyeService, type SubmissionFullResponse } from '@/services/finalEye';

interface TxlfRowField {
  raw: string;
  display: string;
}

interface TxlfRow {
  uiId: number;
  xmlId: string;
  fields: Record<string, TxlfRowField>;
}

const units = ref<TxlfRow[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const loadError = ref('');
const saveError = ref('');
const successToast = ref('');
const sourceXmlText = ref('');
const updateCallResponse = ref<SubmissionFullResponse | null>(null);
let successToastTimer: ReturnType<typeof setTimeout> | null = null;

const { state: submissionState } = useFinalEyeSubmissionStore();
const { state: selectionState } = useOnlyOfficeSelectionStore();

const selectedSourceName = computed(() => selectionState.sourceDocument?.name ?? '');
const selectedTargetName = computed(() => selectionState.targetDocument?.name ?? '');
const selectedTargetPath = computed(() => selectionState.targetFilePath ?? '');

const selectedTarget = computed(() => {
  const sourceName = selectedSourceName.value;
  if (!sourceName) return null;
  const candidates = submissionState.targetFilesBySource[sourceName] ?? [];
  return (
    candidates.find((item) => item.path === selectedTargetPath.value) ??
    candidates.find((item) => item.name === selectedTargetName.value) ??
    null
  );
});

const selectedTxlfPath = computed(() => selectedTarget.value?.txlfPaths?.[0] ?? '');
const selectedTxlfName = computed(() => selectedTxlfPath.value.split('\\').pop() ?? '');

const downloadFileBaseUrl = computed(() => {
  const explicit = (import.meta.env.VITE_FINALEYE_DOWNLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host = (import.meta.env.VITE_FINALEYE_BASE_URL || import.meta.env.VITE_API_HOST || '')
    .trim()
    .replace(/\/$/, '');
  if (host) return `${host}/OnlyOffice/downloadfile`;
  return '';
});

function buildDownloadPath(filePath: string): string {
  if (!filePath || !downloadFileBaseUrl.value) return '';
  return `${downloadFileBaseUrl.value}?filePath=${encodeURIComponent(filePath)}&api-version=1`;
}

const txlfDownloadPath = computed(() => buildDownloadPath(selectedTxlfPath.value));

function stripXliffTags(value: string): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractUnits(doc: Document): TxlfRow[] {
  const nodes = doc.getElementsByTagNameNS('*', 'trans-unit');
  return Array.from(nodes).map((node, index) => {
    const fields: Record<string, TxlfRowField> = {};
    Array.from(node.children).forEach((child) => {
      const key = child.localName;
      if (key === 'alt-trans') return;
      fields[key] = {
        raw: child.innerHTML,
        display: stripXliffTags(child.innerHTML)
      };
    });
    return {
      uiId: index + 1,
      xmlId: node.getAttribute('id') ?? '',
      fields
    };
  });
}

const columns = computed(() => {
  if (!units.value.length) return [];
  const firstUnit = units.value[0];
  if (!firstUnit) return [];
  return Object.keys(firstUnit.fields).filter((key) => key !== 'alt-trans');
});

async function loadTxlf() {
  units.value = [];
  loadError.value = '';
  saveError.value = '';
  sourceXmlText.value = '';

  if (!selectedSourceName.value || !selectedTargetPath.value) {
    loadError.value = 'Select source and target files from the ribbon to load TXLF.';
    return;
  }

  if (!selectedTxlfPath.value) {
    loadError.value = 'No TXLF file is mapped for the selected source/target file.';
    return;
  }

  if (!txlfDownloadPath.value) {
    loadError.value = 'TXLF download URL is not configured.';
    return;
  }

  isLoading.value = true;
  try {
    const response = await fetch(txlfDownloadPath.value, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load TXLF (${response.status})`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const parserError = doc.getElementsByTagName('parsererror')[0];
    if (parserError?.textContent) {
      throw new Error('Fetched TXLF content is not valid XML.');
    }

    sourceXmlText.value = xmlText;
    units.value = extractUnits(doc);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load TXLF content.';
  } finally {
    isLoading.value = false;
  }
}

function transCheckUploadTxlfUrl(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const explicit = env.VITE_TRANSCHECK_BASE_URL?.replace(/\/$/, '');
  if (explicit) {
    return `${explicit}/TransCheck/upload/txlf`;
  }
  if (import.meta.env.DEV) {
    return '/TransCheck/upload/txlf';
  }
  return 'http://localhost:5001/TransCheck/upload/txlf';
}

function txlfFormFieldName(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_TRANSCHECK_TXLF_FORM_FIELD?.trim() || 'file';
}

function applyUnitsToXml(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError?.textContent) {
    throw new Error('Current TXLF content is invalid XML.');
  }

  const unitNodes = Array.from(doc.getElementsByTagNameNS('*', 'trans-unit'));
  units.value.forEach((unit, index) => {
    const transUnit = unitNodes[index];
    if (!transUnit) return;

    Array.from(transUnit.children).forEach((child) => {
      const key = child.localName;
      if (key === 'alt-trans') return;
      const field = unit.fields[key];
      if (field && typeof field.display === 'string') {
        child.innerHTML = field.display;
      }
    });
  });

  return new XMLSerializer().serializeToString(doc);
}

function getEditedXmlPayload(): string {
  if (!sourceXmlText.value.trim()) return '';
  return applyUnitsToXml(sourceXmlText.value);
}

function buildUpdatedTxlfFromXml(updatedXml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(updatedXml, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError?.textContent) {
    throw new Error('Updated XML could not be converted to TXLF.');
  }

  // Re-serialize to ensure a valid TXLF payload is generated in frontend.
  return new XMLSerializer().serializeToString(doc);
}

function buildUpdatedTxlfFile(txlfContent: string): File {
  const fileName = selectedTxlfName.value || 'document.txlf';
  return new File([txlfContent], fileName, { type: 'application/xml' });
}

function refreshFromXmlString(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError?.textContent) return;

  sourceXmlText.value = xml;
  units.value = extractUnits(doc);
}

function extractTxlfXmlFromResponse(data: unknown): string | null {
  if (typeof data === 'string' && data.trim().startsWith('<')) return data;
  if (data && typeof data === 'object') {
    const payload = data as Record<string, unknown>;
    for (const key of ['txlfContent', 'content', 'txlf', 'data', 'value']) {
      const value = payload[key];
      if (typeof value === 'string' && value.trim().startsWith('<')) return value;
    }
  }
  return null;
}

function showSuccessToast(message: string) {
  successToast.value = message;
  if (successToastTimer) {
    clearTimeout(successToastTimer);
  }
  successToastTimer = setTimeout(() => {
    successToast.value = '';
    successToastTimer = null;
  }, 2800);
}

async function saveTxlf() {
  saveError.value = '';
  const submissionId = submissionState.submissionId.trim();
  if (!submissionId) {
    saveError.value = 'Submission ID is missing. Open a submission first.';
    return;
  }

  const xmlString = getEditedXmlPayload();
  if (!xmlString) {
    saveError.value = 'No TXLF content to save.';
    return;
  }

  const updatedTxlfContent = buildUpdatedTxlfFromXml(xmlString);
  const updatedTxlfFile = buildUpdatedTxlfFile(updatedTxlfContent);

  const formData = new FormData();
  formData.append(txlfFormFieldName(), updatedTxlfFile);

  isSaving.value = true;
  try {
    const { data } = await axios.post(transCheckUploadTxlfUrl(), formData, {
      params: {
        submissionId,
        'api-version': '1'
      }
    });

    const txlfFromServer = extractTxlfXmlFromResponse(data);
    if (txlfFromServer) {
      refreshFromXmlString(txlfFromServer);
    } else {
      refreshFromXmlString(updatedTxlfContent);
    }

    // Update-only API call after save; keep response local and do not mutate existing stores.
    updateCallResponse.value = await finalEyeService.getSubmissionInfo(submissionId, {
      isCallOnUpdate: true
    });
    showSuccessToast('TXLF saved successfully.');
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Failed to save TXLF.';
  } finally {
    isSaving.value = false;
  }
}

function downloadEditedTxlf() {
  const xmlString = getEditedXmlPayload();
  if (!xmlString) return;
  const updatedTxlfContent = buildUpdatedTxlfFromXml(xmlString);
  const baseName = selectedTxlfName.value.replace(/\.[^.]+$/, '') || 'document';
  const blob = new Blob([updatedTxlfContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${baseName}-edited.txlf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

watch(
  txlfDownloadPath,
  async () => {
    await loadTxlf();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (successToastTimer) {
    clearTimeout(successToastTimer);
  }
});
</script>

<template>
  <section class="txlf">
    <div v-if="successToast" class="txlf-toast" role="status" aria-live="polite">
      {{ successToast }}
    </div>
    <header class="txlf__header">
      <h1 class="txlf__title">TXLF</h1>
      <p class="txlf__subtitle">
        TXLF content is automatically loaded based on the currently selected source and target files.
      </p>
    </header>

    <p v-if="loadError" class="txlf__state txlf__state--error">{{ loadError }}</p>
    <p v-else-if="saveError" class="txlf__state txlf__state--error">{{ saveError }}</p>
    <p v-else-if="isLoading" class="txlf__state">Loading TXLF...</p>
    <p v-else-if="!units.length" class="txlf__state">No TXLF data available.</p>

    <div v-else class="txlf__table-container">
      <table class="txlf__table">
        <thead>
          <tr>
            <th>ID</th>
            <th v-for="key in columns" :key="key">{{ key }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in units" :key="row.uiId">
            <td class="txlf__id">{{ row.uiId }}</td>
            <td v-for="key in columns" :key="`${row.uiId}-${key}`">
              <input v-model="row.fields[key]!.display" type="text" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="units.length" class="txlf-actions">
      <button type="button" @click="downloadEditedTxlf">Download edited TXLF</button>
      <button type="button" @click="saveTxlf" :disabled="isSaving">
        {{ isSaving ? 'Saving…' : 'Save TXLF' }}
      </button>
    </div>
  </section>
</template>

<style lang="scss" src="./Txlf.scss" scoped></style>
