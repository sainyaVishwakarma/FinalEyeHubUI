<script setup lang="ts">
import { analyzeGuidelinesFolders } from '@/services/api/aiAnalysisApi';
import type { AiAnalysisResponse } from '@/services/types/AiAnalysis';
import axios from 'axios';
import { computed, onMounted, ref } from 'vue';

/** Hardcoded for now; swap for API-driven paths when ready. */
const ANALYSIS_REQUEST = {
  referenceFolderPath:
    'C:\\Temp\\Extracted\\cb0301b2-0bff-4af9-aa15-7a91e10e8544\\Sub_107643_Reference',
  targetFolderPath:
    'C:\\Temp\\Extracted\\cb0301b2-0bff-4af9-aa15-7a91e10e8544\\Sub_107643_de-DE\\Batch1_de-DE_Preview',
  additionalInstructions:
    'Analyze both folders and generate a detailed comparison report highlighting differences, missing files, structure mismatches, and any inconsistencies.'
} as const;

const loading = ref(false);
const apiError = ref<string | null>(null);
const result = ref<AiAnalysisResponse | null>(null);

const hasReports = computed(() => (result.value?.reports?.length ?? 0) > 0);

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
  loading.value = true;
  try {
    result.value = await analyzeGuidelinesFolders({
      referenceFolderPath: ANALYSIS_REQUEST.referenceFolderPath,
      targetFolderPath: ANALYSIS_REQUEST.targetFolderPath,
      additionalInstructions: ANALYSIS_REQUEST.additionalInstructions
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

onMounted(() => {
  void submitAnalysis();
});
</script>

<template>
  <div class="ref-guidelines">
    <header class="ref-guidelines__toolbar">
      <h1 class="ref-guidelines__heading">Reference guidelines report</h1>
      <button
        type="button"
        class="ref-guidelines__refresh"
        :disabled="loading"
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

        <table
          v-if="report.issues?.length"
          class="ref-guidelines__table"
          :aria-label="`Issues for ${report.targetFile}`"
        >
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
      </article>
    </section>
  </div>
</template>

<style lang="scss" src="./ReferenceGuidelinesReport.scss" scoped></style>
