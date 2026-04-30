<script setup lang="ts">
import { analyzeGuidelinesFile } from '@/services/api/aiAnalysisApi';
import type { AiAnalysisResponse } from '@/services/types/AiAnalysis';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';
import axios from 'axios';
import { computed, ref, watch } from 'vue';

const ADDITIONAL_INSTRUCTIONS =
  'Analyze both folders and generate a detailed comparison report highlighting differences, missing files, structure mismatches, and any inconsistencies.';

const loading = ref(false);
const apiError = ref<string | null>(null);
const result = ref<AiAnalysisResponse | null>(null);
const { state: selectionState } = useOnlyOfficeSelectionStore();

const hasReports = computed(() => (result.value?.reports?.length ?? 0) > 0);
const selectedTargetFilePath = computed(() => selectionState.targetFilePath.trim());
const selectedReferencePaths = computed(() =>
  selectionState.referenceFilePaths.map((path) => path.trim()).filter(Boolean)
);
const selectedReferenceFolderPath = computed(() => getFolderPath(selectedReferencePaths.value[0] ?? ''));
const canAnalyzeSelection = computed(
  () => Boolean(selectedReferenceFolderPath.value && selectedTargetFilePath.value)
);

function getFolderPath(filePath: string): string {
  if (!filePath) return '';
  return filePath.replace(/[\\/][^\\/]+$/, '');
}

function getFileName(filePath: string): string {
  if (!filePath) return '';
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] ?? '';
}

function severityClass(severity: string): string {
  const s = severity?.toUpperCase() ?? '';
  if (s.includes('HIGH')) return 'ref-guidelines__sev--high';
  if (s.includes('MEDIUM')) return 'ref-guidelines__sev--medium';
  if (s.includes('LOW')) return 'ref-guidelines__sev--low';
  return 'ref-guidelines__sev--default';
}

async function submitAnalysis() {
  apiError.value = null;
  result.value = null;

  if (!canAnalyzeSelection.value) {
    apiError.value =
      'Select source/target files from the ribbon. Missing mapped target file or reference folder.';
    return;
  }

  loading.value = true;
  try {
    result.value = await analyzeGuidelinesFile({
      referenceFolderPath: selectedReferenceFolderPath.value,
      targetFilePath: selectedTargetFilePath.value,
      additionalInstructions: ADDITIONAL_INSTRUCTIONS
    });
    if (result.value.success === false && result.value.error) {
      apiError.value = result.value.error;
    }
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      const body = e.response?.data;
      apiError.value =
        typeof body === 'string'
          ? body
          : body && typeof body === 'object' && 'message' in body
            ? String((body as { message?: string }).message)
            : e.message;
    } else {
      apiError.value =
        e && typeof e === 'object' && 'message' in e
          ? String((e as Error).message)
          : 'Request failed.';
    }
  } finally {
    loading.value = false;
  }
}

function formatScore(score: number): string {
  return `${(score * 100).toFixed(2)}%`;
}

watch([selectedReferenceFolderPath, selectedTargetFilePath], () => {
  void submitAnalysis();
}, { immediate: true });
</script>

<template>
  <div class="ref-guidelines">
    <header class="ref-guidelines__toolbar">
      <div class="ref-guidelines__title-wrap">
        <h1 class="ref-guidelines__heading">AI Insights</h1>
        <p class="ref-guidelines__selection" :title="selectedTargetFilePath">
          Selected target: {{ getFileName(selectedTargetFilePath) || 'None' }}
        </p>
      </div>
      <button
        type="button"
        class="ref-guidelines__refresh"
        :disabled="loading || !canAnalyzeSelection"
        @click="submitAnalysis"
      >
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <p v-if="loading" class="ref-guidelines__loading" role="status">Loading report…</p>
    <p v-if="apiError" class="ref-guidelines__error" role="alert">{{ apiError }}</p>

    <section
      v-if="result && !loading"
      class="ref-guidelines__results"
      aria-label="Analysis report"
      aria-live="polite"
    >
      <div v-if="!hasReports" class="ref-guidelines__empty">No report rows returned.</div>

      <article
        v-for="(report, idx) in result.reports"
        :key="`${report.targetFile}-${idx}`"
        class="ref-guidelines__report"
      >
        <header class="ref-guidelines__report-head">
          <h2 class="ref-guidelines__report-title">Target: {{ report.targetFile }}</h2>
          <p class="ref-guidelines__report-meta">
            <span>Matched reference: {{ report.matchedReferenceFile }}</span>
            <span class="ref-guidelines__score">
              Similarity: {{ formatScore(report.similarityScore) }}
            </span>
          </p>
        </header>
        <p class="ref-guidelines__assessment">{{ report.overallAssessment }}</p>

        <div v-if="report.issues?.length" class="ref-guidelines__table-wrap">
          <table class="ref-guidelines__table" :aria-label="`Issues for ${report.targetFile}`">
            <thead>
              <tr>
                <th scope="col">Severity</th>
                <th scope="col">Category</th>
                <th scope="col">Description</th>
                <th scope="col">Location</th>
                <th scope="col">Suggestion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(issue, i) in report.issues" :key="i">
                <td>
                  <span class="ref-guidelines__badge" :class="severityClass(issue.severity)">
                    {{ issue.severity }}
                  </span>
                </td>
                <td>{{ issue.category }}</td>
                <td>{{ issue.description }}</td>
                <td>{{ issue.location }}</td>
                <td>{{ issue.suggestion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" src="./ReferenceGuidelinesReport.scss" scoped></style>
