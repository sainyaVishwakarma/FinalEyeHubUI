<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <div>
        <h1>Final Eye Dashboard</h1>
        <p>TransCheck analysis with section-wise review actions</p>
      </div>
      <button class="action-btn" :disabled="selectedSegments.length === 0" @click="showModal = true">
        Send {{ selectedSegments.length }} Segment(s) to Linguist
      </button>
    </div>

    <div class="summary-grid">
      <div class="summary-card" v-for="card in summaryCards" :key="card.title">
        <h3>{{ card.title }}</h3>
        <span>{{ card.value }}</span>
      </div>
    </div>

    <div v-if="analysisLoading" class="state-banner">
      Running analysis for current Transcheck selection...
    </div>

    <div v-else-if="analysisError" class="state-banner state-banner--error">
      {{ analysisError }}
    </div>

    <div v-else-if="sectionCards.length === 0" class="state-banner">
      No analysis rows found for current Transcheck selection.
    </div>

    <div v-else class="section-list">
      <div class="section-card" v-for="section in sectionCards" :key="section.key">
        <div class="section-heading">
          <div>
            <h2>{{ section.displayName }}</h2>
            <p>{{ section.rows.length }} flagged segment(s)</p>
          </div>
        </div>

        <div class="segment-list">
          <article
            class="segment-card"
            v-for="segment in section.rows"
            :key="segment.id"
            :class="[segment.priorityClass, getStatusClass(segment.id)]"
          >
            <div class="segment-top">
              <label class="selection-control">
                <input
                  type="checkbox"
                  :checked="isSelected(segment.id)"
                  :disabled="isFinalized(segment.id)"
                  @change="toggleSelection(segment.id, $event.target.checked)"
                />
                <span>Select</span>
              </label>

              <div class="segment-meta">
                <span class="segment-pill">Seg {{ segment.seg }}</span>
                <span class="segment-pill">Block {{ segment.block }}</span>
                <span class="priority-badge" :class="segment.priorityClass">{{ segment.priority }}</span>
                <span v-if="isIgnored(segment.id)" class="status-badge ignored">Ignored</span>
                <span v-else-if="isCompleted(segment.id)" class="status-badge completed">Completed</span>
              </div>
            </div>

            <p class="segment-message">
              <strong>Comment:</strong>
              {{ previewText(segment.message, 180) }}
            </p>

            <div class="content-grid">
              <div class="content-box">
                <label>Source</label>
                <p :title="segment.source">{{ previewText(segment.source, 280) }}</p>
              </div>

              <div class="content-box">
                <label>Target</label>
                <p :title="segment.target">{{ previewText(segment.target, 280) }}</p>
              </div>
            </div>

            <p class="segment-notes">
              <strong>Notes:</strong>
              {{ previewText(segment.notes, 220) }}
            </p>

            <div class="segment-actions">
              <button class="secondary-btn" :disabled="isFinalized(segment.id)" @click="markIgnored(segment.id)">
                Ignore false positive
              </button>
              <button class="complete-btn" :disabled="isFinalized(segment.id)" @click="markCompleted(segment.id)">
                Mark complete
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>

    <SendToLinguistModal
      :visible="showModal"
      :problemSegments="selectedSegments"
      @close="showModal = false"
      @send="sendMail"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import SendToLinguistModal from '@/components/SendToLinguistModal.vue';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore';
import { finalEyeService } from '@/services/finalEye';

const showModal = ref(false);
const selectedIds = ref([]);
const ignoredIds = ref([]);
const completedIds = ref([]);
const analysisLoading = ref(false);
const analysisError = ref('');
const analysisResponse = ref({ sections: [] });

const { state: selectionState } = useOnlyOfficeSelectionStore();
const { state: submissionState } = useFinalEyeSubmissionStore();

// TEMP TEST OVERRIDE:
// Use this hardcoded Transcheck report path only for dashboard UI testing (notes visibility).
// Uncomment the constant and return line below when needed, then revert after testing.
const HARDCODED_TEST_TRANSCHECK_PATH =
  'C:\\Temp\\Extracted\\9f448580-9494-4460-ab1e-8a5d9a2cd50a\\Sub_107643_de-DE\\Batch1_de-DE_Transcheck\\Transcheck_Report_Sub_107643_Batch1_en-US-de-DE_Proof2.html';

const selectedTranscheckPath = computed(() => {
  // TEMP: force testing with hardcoded report path.
  return HARDCODED_TEST_TRANSCHECK_PATH;
  // Revert after testing:
  // return selectionState.transcheckReportPaths[0] ?? '';
});

function getPriorityClass(priority) {
  const normalized = String(priority || 'LOW').toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') return normalized;
  return 'low';
}

function toSegment(row, sectionKey, displayName, index) {
  const columnValues = row?.columnValues ?? {};
  const seg = String(columnValues.Seg ?? index + 1);
  const block = String(columnValues.Block ?? '-');

  return {
    id: `${sectionKey}-${seg}-${block}-${index}`,
    sectionKey,
    sectionName: displayName,
    seg,
    block,
    source: row?.source ?? columnValues.Source ?? '',
    target: row?.target ?? columnValues.Target ?? '',
    message: row?.message ?? columnValues.Comment ?? 'No comment available.',
    notes: row?.notes ?? columnValues.Notes ?? 'No notes available.',
    priority: String(row?.priority ?? 'LOW').toUpperCase(),
    priorityClass: getPriorityClass(row?.priority)
  };
}

const sectionCards = computed(() => {
  const sections = analysisResponse.value?.sections ?? [];
  return sections
    .filter((section) => Array.isArray(section.rows) && section.rows.length > 0)
    .map((section) => ({
      key: section.key,
      displayName: section.displayName,
      rows: section.rows.map((row, index) =>
        toSegment(row, section.key, section.displayName, index)
      )
    }));
});

const allSegments = computed(() => sectionCards.value.flatMap((section) => section.rows));

const selectedSegments = computed(() =>
  allSegments.value.filter(
    (segment) => selectedIds.value.includes(segment.id) && !isFinalized(segment.id)
  )
);

const priorityCounts = computed(() =>
  allSegments.value.reduce(
    (acc, segment) => {
      if (segment.priority === 'HIGH') acc.high += 1;
      if (segment.priority === 'MEDIUM') acc.medium += 1;
      if (segment.priority === 'LOW') acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 }
  )
);

const openSegmentsCount = computed(
  () => allSegments.value.length - ignoredIds.value.length - completedIds.value.length
);

const summaryCards = computed(() => [
  {
    title: 'Target Languages',
    value: submissionState.submissionInfo?.submissionDetails?.targetLanguages?.length ?? '2'
  },
  {
    title: 'Total Flagged Segments',
    value: allSegments.value.length
  },
  {
    title: 'Open Segments',
    value: openSegmentsCount.value
  },
  {
    title: 'Selected for Linguist',
    value: selectedSegments.value.length
  },
  {
    title: 'High Priority',
    value: priorityCounts.value.high
  },
  {
    title: 'Medium Priority',
    value: priorityCounts.value.medium
  },
  {
    title: 'Low Priority',
    value: priorityCounts.value.low
  }
]);

function resetSelectionStates() {
  selectedIds.value = [];
  ignoredIds.value = [];
  completedIds.value = [];
}

function keepOnlyActiveIds(ids) {
  const validIds = new Set(allSegments.value.map((segment) => segment.id));
  return ids.filter((id) => validIds.has(id));
}

async function loadSelectedTranscheckAnalysis() {
  const reportPath = selectedTranscheckPath.value.trim();
  analysisError.value = '';

  if (!reportPath) {
    analysisResponse.value = { sections: [] };
    resetSelectionStates();
    analysisError.value = 'No Transcheck report is mapped for the current selection.';
    return;
  }

  analysisLoading.value = true;
  try {
    const response = await finalEyeService.getTranscheckAnalysis(reportPath);
    analysisResponse.value = {
      sections: Array.isArray(response?.sections) ? response.sections : []
    };
    resetSelectionStates();
  } catch (error) {
    analysisResponse.value = { sections: [] };
    resetSelectionStates();
    analysisError.value =
      error instanceof Error
        ? `Unable to load analysis for current Transcheck report: ${error.message}`
        : 'Unable to load analysis for current Transcheck report.';
  } finally {
    analysisLoading.value = false;
  }
}

function isSelected(segmentId) {
  return selectedIds.value.includes(segmentId);
}

function isIgnored(segmentId) {
  return ignoredIds.value.includes(segmentId);
}

function isCompleted(segmentId) {
  return completedIds.value.includes(segmentId);
}

function isFinalized(segmentId) {
  return isIgnored(segmentId) || isCompleted(segmentId);
}

function getStatusClass(segmentId) {
  if (isIgnored(segmentId)) return 'status-ignored';
  if (isCompleted(segmentId)) return 'status-completed';
  return 'status-open';
}

function toggleSelection(segmentId, checked) {
  if (!checked) {
    selectedIds.value = selectedIds.value.filter((id) => id !== segmentId);
    return;
  }

  if (!selectedIds.value.includes(segmentId)) {
    selectedIds.value = [...selectedIds.value, segmentId];
  }
}

function markIgnored(segmentId) {
  if (isFinalized(segmentId)) return;
  ignoredIds.value = [...ignoredIds.value, segmentId];
  selectedIds.value = selectedIds.value.filter((id) => id !== segmentId);
}

function markCompleted(segmentId) {
  if (isFinalized(segmentId)) return;
  completedIds.value = [...completedIds.value, segmentId];
  selectedIds.value = selectedIds.value.filter((id) => id !== segmentId);
}

function sendMail(payload) {
  console.log('Send to linguist payload:', payload);
  showModal.value = false;
}

function previewText(value, maxLength) {
  const text = String(value ?? '').trim();
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

watch(
  selectedTranscheckPath,
  async () => {
    await loadSelectedTranscheckAnalysis();
  },
  { immediate: true }
);

watch(allSegments, () => {
  selectedIds.value = keepOnlyActiveIds(selectedIds.value);
  ignoredIds.value = keepOnlyActiveIds(ignoredIds.value);
  completedIds.value = keepOnlyActiveIds(completedIds.value);
});
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: #f8fafc;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  margin: 0;
}

.dashboard-header p {
  margin: 6px 0 0;
  color: #475569;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card {
  background: #ffffff;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  padding: 16px;
}

.summary-card h3 {
  margin: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.summary-card span {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
}

.state-banner {
  border: 1px solid #dbe5f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  color: #334155;
  font-weight: 600;
}

.state-banner--error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: #ffffff;
  border: 1px solid #dbe5f0;
  border-radius: 12px;
  padding: 16px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-heading h2 {
  margin: 0;
  font-size: 18px;
}

.section-heading p {
  margin: 6px 0 0;
  color: #64748b;
}

.segment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-card {
  border: 1px solid #e2e8f0;
  border-left: 5px solid #94a3b8;
  border-radius: 10px;
  padding: 14px;
  background: #ffffff;
}

.segment-card.high {
  border-left-color: #dc2626;
}

.segment-card.medium {
  border-left-color: #d97706;
}

.segment-card.low {
  border-left-color: #0284c7;
}

.segment-card.status-ignored,
.segment-card.status-completed {
  opacity: 0.75;
}

.segment-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.selection-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #334155;
}

.segment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.segment-pill {
  border-radius: 999px;
  background: #e2e8f0;
  color: #334155;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.priority-badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.priority-badge.high {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #b45309;
}

.priority-badge.low {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.ignored {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.segment-message,
.segment-notes {
  margin: 0 0 10px;
  color: #1f2937;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.content-box {
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 10px;
}

.content-box label {
  display: block;
  font-size: 12px;
  color: #475569;
  margin-bottom: 6px;
  font-weight: 700;
}

.content-box p {
  margin: 0;
  line-height: 1.4;
}

.segment-actions {
  display: flex;
  gap: 10px;
}

.action-btn,
.secondary-btn,
.complete-btn {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn {
  background: #2563eb;
  color: white;
}

.action-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.secondary-btn {
  background: #fff7ed;
  color: #9a3412;
}

.complete-btn {
  background: #dcfce7;
  color: #166534;
}

.secondary-btn:disabled,
.complete-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 960px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>