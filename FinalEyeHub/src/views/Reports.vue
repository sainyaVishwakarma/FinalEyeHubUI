<template>
  <div class="reports-view">
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="tab-content">
      <div v-if="activeTab === 'transcheck'" class="content-card content-card--report">
        <h3>Transcheck File (.html)</h3>
        <p class="content-note">
          Report is loaded from mapped Transcheck file path of current selection.
        </p>
        <p v-if="transcheckLoadError" class="content-error">
          {{ transcheckLoadError }}
        </p>
        <p v-else-if="!transcheckReportHtml" class="content-note">Loading transcheck report...</p>
        <iframe
          class="transcheck-report-frame"
          :srcdoc="transcheckReportHtml"
          :src="transcheckReportPath"
          title="Transcheck report preview"
        />
        <a class="content-link" :href="transcheckReportPath" target="_blank" rel="noopener noreferrer">
          Open report in new tab
        </a>
      </div>

      <div v-else-if="activeTab === 'segmentReview'" class="content-card content-card--report">
        <h3>Segment Review File (.html)</h3>
        <p class="content-note">
          Report is loaded from mapped Segment Review file path of current selection.
        </p>
        <p v-if="segmentReviewLoadError" class="content-error">
          {{ segmentReviewLoadError }}
        </p>
        <p v-else-if="!segmentReviewReportHtml" class="content-note">
          Loading segment review report...
        </p>
        <iframe
          class="transcheck-report-frame"
          :srcdoc="segmentReviewReportHtml"
          :src="segmentReviewReportPath"
          title="Segment review report preview"
        />
        <a class="content-link" :href="segmentReviewReportPath" target="_blank" rel="noopener noreferrer">
          Open report in new tab
        </a>
      </div>

      <div
        v-else-if="activeTab === 'referenceFiles'"
        class="content-card content-card--report content-card--reference"
      >
        <h3>Reference Files</h3>
        <p class="content-note">
          The preferred reference file for current selection is shown in ONLYOFFICE viewer.
        </p>
        <p v-if="!selectedReferencePath" class="content-error">
          No reference file mapped for current selection.
        </p>
        <template v-else>
          <p class="content-note">
            Showing: <strong>{{ selectedReferenceName }}</strong>
          </p>
          <div class="reference-viewer-wrapper">
            <TPLoader v-if="referenceFileLoading" :size="LoaderSize.medium" />
            <OnlyOfficeViewer
              :key="`reference::${selectedReferencePath}`"
              :download-id="selectedReferencePath"
              :document-name="selectedReferenceName"
              :is-view-only="true"
              @toggle-loader="onReferenceViewerLoader"
            />
          </div>
        </template>
      </div>

      <div v-else-if="activeTab === 'clientInstructions'" class="content-card">
        <h3>Client Instructions</h3>
        <div
          v-if="clientInstructionsHtml"
          class="client-instructions"
          v-html="clientInstructionsHtml"
        ></div>
        <p v-else class="content-note">No client instructions available for this submission.</p>
      </div>

      <div v-else-if="activeTab === 'feChecklist'" class="content-card content-card--checklist">
        <div class="checklist-header">
          <div>
            <h3>FE Checklist</h3>
            <p class="content-note">
              Complete all checklist items before finishing submission.
            </p>
          </div>
          <div class="checklist-progress">
            <span class="checklist-progress__value">{{ checkedCount }}/{{ totalChecklistItems }}</span>
            <span class="checklist-progress__label">items complete</span>
          </div>
        </div>

        <div class="checklist-sections">
          <section
            v-for="section in feChecklistSections"
            :key="section.id"
            class="checklist-section"
          >
            <h4>{{ section.title }}</h4>
            <ul class="checklist-items">
              <li v-for="item in section.items" :key="item.id">
                <label class="checklist-item">
                  <input v-model="checklistState[item.id]" type="checkbox" />
                  <span>{{ item.label }}</span>
                </label>
              </li>
            </ul>
          </section>
        </div>

        <div class="checklist-actions">
          <p
            v-if="checklistCompletionMessage"
            class="checklist-status"
          >
            {{ checklistCompletionMessage }}
          </p>
          <button
            class="finish-submission-btn"
            :disabled="!isChecklistComplete"
            @click="onFinishSubmission"
          >
            Finish Submission
          </button>
        </div>
      </div>

      <!--
      <div v-else-if="activeTab === 'transiq'" class="content-card">
        <h3>TransIQ Report</h3>
        <p>Placeholder for excel-style report view.</p>
      </div>
      -->

      <!--
      <div v-else-if="activeTab === 'glossary'" class="content-card">
        <h3>Glossary</h3>
        <p>Placeholder for custom glossary HTML/CSS UI.</p>
      </div>
      -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore';
import TPLoader from '@/components/TPLoader.vue';
import { LoaderSize } from '@/types/LoaderSize';
import OnlyOfficeViewer from '@/components/only-office-viewer/OnlyOfficeViewer.vue';

const activeTab = ref('transcheck');
const transcheckReportHtml = ref('');
const transcheckLoadError = ref('');
const segmentReviewReportHtml = ref('');
const segmentReviewLoadError = ref('');
const checklistCompletionMessage = ref('');
const referenceFileLoading = ref(false);
const { state: selectionState } = useOnlyOfficeSelectionStore();
const { state: submissionState } = useFinalEyeSubmissionStore();

const selectedTranscheckPath = computed(() => selectionState.transcheckReportPaths[0] ?? '');
const selectedSegmentReviewPath = computed(() => selectionState.segmentReviewReportPaths[0] ?? '');
const preferredReferenceFileName = 'StyleGuide_Clinical_All LPs.pdf';

function getFileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() ?? '';
}

const selectedReferencePath = computed(() => {
  const references = (() => {
    if (selectionState.referenceFilePaths.length > 0) return selectionState.referenceFilePaths;
    const targetFilePath = selectionState.targetFilePath;
    if (!targetFilePath) return [];
    for (const targets of Object.values(submissionState.targetFilesBySource)) {
      const matchedTarget = targets.find((target) => target.path === targetFilePath);
      if (matchedTarget) return matchedTarget.reports.referencePaths;
    }
    return [];
  })();
  if (references.length === 0) return '';
  const matched = references.find((path) => getFileNameFromPath(path) === preferredReferenceFileName);
  return matched ?? references[0];
});

const selectedReferenceName = computed(() =>
  selectedReferencePath.value ? getFileNameFromPath(selectedReferencePath.value) : ''
);

const downloadFileBaseUrl = computed(() => {
  const explicit = (import.meta.env.VITE_FINALEYE_DOWNLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host =
    (import.meta.env.VITE_FINALEYE_BASE_URL || import.meta.env.VITE_API_HOST || '')
      .trim()
      .replace(/\/$/, '');
  if (host) return `${host}/OnlyOffice/downloadfile`;
  return '';
});

function buildReportDownloadPath(selectedReportPath: string): string {
  if (!selectedReportPath || !downloadFileBaseUrl.value) return '';
  const id = encodeURIComponent(selectedReportPath);
  return `${downloadFileBaseUrl.value}?filePath=${id}&api-version=1`;
}

const transcheckReportPath = computed(() => buildReportDownloadPath(selectedTranscheckPath.value));
const segmentReviewReportPath = computed(() =>
  buildReportDownloadPath(selectedSegmentReviewPath.value)
);

const tabs = [
  { id: 'transcheck', label: 'Transcheck File' },
  { id: 'segmentReview', label: 'Segment Review' },
  { id: 'referenceFiles', label: 'Reference Files' },
  { id: 'clientInstructions', label: 'Client Instructions' },
  { id: 'feChecklist', label: 'FE Checklist' }
  // { id: 'transiq', label: 'TransIQ Report' },
  // { id: 'glossary', label: 'Glossary' }
];

const clientInstructionsHtml = computed(() => {
  return submissionState.submissionInfo?.submissionDetails?.instructions ?? '';
});

const feChecklistSections = [
  {
    id: 'preFinalEyeReview',
    title: 'Pre-Final Eye Review',
    items: [
      {
        id: 'preFinalEyeReview-projectInstructions',
        label:
          'Read project instructions in job summary, including job-specific modifications (footer details, version number, and header/footer translation guidance).'
      },
      {
        id: 'preFinalEyeReview-pdiInstructions',
        label: 'Read PDi (GLE internal) instructions.'
      },
      {
        id: 'preFinalEyeReview-clientPaq',
        label:
          'Check client PAQ and other job-specific instructions/references as needed.'
      },
      {
        id: 'preFinalEyeReview-studyTitleRepository',
        label:
          'Check Study Title Repository first for existing protocol title; if missing, check ClinicalTrials.gov (>EN), EU register (>FOR), and JS + email instructions.'
      },
      {
        id: 'preFinalEyeReview-jobNumberProperties',
        label: 'Insert job number into document properties for future tracking.'
      }
    ]
  },
  {
    id: 'transcheckAndTransiq',
    title: 'TransCheck & TransIQ',
    items: [
      {
        id: 'transcheckAndTransiq-reviewCombinedReport',
        label:
          'Review the combined TransCheck & TransIQ report on final TXLF and verify all required report-header fields are present.'
      },
      {
        id: 'transcheckAndTransiq-transcheckFullReport',
        label:
          'Review TransCheck full report (excluding Terminology Check if CTD glossary was connected).'
      },
      {
        id: 'transcheckAndTransiq-transiqFullReport',
        label:
          'Review TransIQ notes full report and ensure the linguist checked all segments.'
      },
      {
        id: 'transcheckAndTransiq-manageEdits',
        label:
          'Mark up comments in TXLF or deliverable for items that must be sent back to linguists after full FE.'
      }
    ]
  },
  {
    id: 'firstScanOnScreen',
    title: 'First Scan of Document - ON-SCREEN CHECK',
    items: [
      {
        id: 'firstScanOnScreen-hiddenText',
        label:
          'Confirm no text is improperly hidden, including in headers, footers, and text boxes.'
      },
      {
        id: 'firstScanOnScreen-linksAndFields',
        label:
          'Check all links/fields are updated and not broken (highlight all text + F9, then verify headers/footers/text boxes manually).'
      },
      {
        id: 'firstScanOnScreen-languageSetting',
        label:
          'For English, confirm correct language setting is used on all text, including headers/footers/text boxes.'
      },
      {
        id: 'firstScanOnScreen-spellCheck',
        label: 'For English, run spell-check.'
      },
      {
        id: 'firstScanOnScreen-headerFooterUpdate',
        label: 'Insert or modify header/footer (version, language, etc.) per client instructions.'
      },
      {
        id: 'firstScanOnScreen-obviousFormatting',
        label:
          'Scroll through document for obvious formatting issues or apparent errors and fix as needed.'
      }
    ]
  },
  {
    id: 'secondScanSourceTarget',
    title: 'Second Scan of Document - FE comparing target against source',
    items: [
      {
        id: 'secondScanSourceTarget-acronymsLogos',
        label:
          'Confirm acronyms and logos follow instructions and are consistent within file(s).'
      },
      {
        id: 'secondScanSourceTarget-clientInstructions',
        label:
          'Ensure all client-specific instructions, terminology, and preferences are followed in each instance.'
      },
      {
        id: 'secondScanSourceTarget-inclusionExclusion',
        label:
          'Verify inclusion and exclusion criteria are correct and consistent throughout file(s).'
      },
      {
        id: 'secondScanSourceTarget-allSectionsHeadersFooters',
        label:
          'Check headers/footers in every Word section (if multiple sections exist, review section-by-section).'
      },
      {
        id: 'secondScanSourceTarget-properNames',
        label:
          'Verify proper names (brand/drug/person/address/law/guideline names) are spelled correctly.'
      },
      {
        id: 'secondScanSourceTarget-numbersDates',
        label: 'Verify numbers and dates are correct and consistent.'
      },
      {
        id: 'secondScanSourceTarget-clinicalProtocolSections',
        label:
          'For clinical research protocols, verify consistency of estimand/endpoints, objectives, study design/schema, administration, SoA, and sample size determination.'
      },
      {
        id: 'secondScanSourceTarget-formattingMatch',
        label:
          'Confirm formatting matches source: fonts/styles, superscript/subscript, highlighting, color, tables/cells, screenshots/dead text, paragraph settings, and auto fields.'
      },
      {
        id: 'secondScanSourceTarget-noCorruption',
        label: 'Confirm no corrupted characters are present.'
      },
      {
        id: 'secondScanSourceTarget-printOrPdfExtensiveChanges',
        label:
          'If extensive tracked changes/formatting exist, print or save PDF for formatting review; fix issues in live file and re-check.'
      },
      {
        id: 'secondScanSourceTarget-studyTitleFindCheck',
        label:
          'Use Find (Ctrl+F) to verify protocol title consistency against Study Title Repository guidance and across all related documents.'
      },
      {
        id: 'secondScanSourceTarget-abbreviationsConsistency',
        label:
          'For large documents, use abbreviation list to verify acronym/full-term consistency in all instances.'
      },
      {
        id: 'secondScanSourceTarget-recreatedText',
        label:
          'Check all recreated text (including graphics) against source; do not rely solely on technology tools.'
      },
      {
        id: 'secondScanSourceTarget-editsLinguistConfirmed',
        label:
          'Flag edits in comments and confirm with a certified linguist; implement all edits in deliverable and TXLFs.'
      },
      {
        id: 'secondScanSourceTarget-tocLastStep',
        label:
          'If TOC exists, update it as the last FE step and verify links/sections match source.'
      }
    ]
  },
  {
    id: 'machineTranslationPostEditing',
    title: 'Machine Translation Post-editing Checks',
    items: [
      {
        id: 'machineTranslationPostEditing-scopeCheck',
        label:
          'Perform full FE for Full Post-Edit scope; for Light PE, punctuation/consistency/formatting checks are not required.'
      }
    ]
  },
  {
    id: 'crossFileOrLanguageConsistency',
    title: 'Cross-file or Language Consistency Checks',
    items: [
      {
        id: 'crossFileOrLanguageConsistency-clientInstructions',
        label: 'Verify consistency with client-specific instructions.'
      },
      {
        id: 'crossFileOrLanguageConsistency-formatting',
        label: 'Verify formatting consistency across files/languages.'
      },
      {
        id: 'crossFileOrLanguageConsistency-acronymsFullForm',
        label: 'Verify acronym and full-form handling consistency.'
      },
      {
        id: 'crossFileOrLanguageConsistency-logos',
        label: 'Verify logo consistency.'
      },
      {
        id: 'crossFileOrLanguageConsistency-unitsOfMeasurement',
        label: 'Verify units-of-measurement conversions.'
      },
      {
        id: 'crossFileOrLanguageConsistency-specificTerms',
        label:
          'Verify specific-term handling (source terms left in English, institution/organization names, etc.).'
      }
    ]
  },
  {
    id: 'beforeDelivery',
    title: 'Before Delivery',
    items: [
      {
        id: 'beforeDelivery-rerunTranscheck',
        label:
          'If extensive edits were made after full FE, run a new TransCheck report to confirm no new errors.'
      },
      {
        id: 'beforeDelivery-pdfLayoutCorruption',
        label:
          'Save a PDF to confirm final layout and no corruption (including when PDF is a required deliverable).'
      },
      {
        id: 'beforeDelivery-clearCommentsTrackedChanges',
        label:
          'Clear unnecessary comments/tracked changes; ensure comments are typo-free, client-friendly, and author name is hidden per macro guidance.'
      },
      {
        id: 'beforeDelivery-fileNameStandard',
        label:
          'Ensure file naming follows client/subject standards; if none exists, use source file name + _LP.'
      }
    ]
  },
  {
    id: 'afterDelivery',
    title: 'After Delivery',
    items: [
      {
        id: 'afterDelivery-tmGlossaryUpdates',
        label: 'Perform TM and/or glossary updates where applicable.'
      },
      {
        id: 'afterDelivery-feedbackToLinguists',
        label: 'Provide feedback to linguists where applicable.'
      },
      {
        id: 'afterDelivery-qaProcesses',
        label: 'Perform QA processes (such as CRs and PFFs) where applicable.'
      }
    ]
  }
] as const;

const checklistItemIds = feChecklistSections.flatMap((section) =>
  section.items.map((item) => item.id)
);

const checklistState = reactive<Record<string, boolean>>(
  Object.fromEntries(checklistItemIds.map((itemId) => [itemId, false]))
);

const checklistStorageKey = computed(() => {
  const submissionId = submissionState.submissionId || 'unknown-submission';
  const targetPath = selectionState.targetFilePath || 'unknown-target';
  return `finaleye:fe-checklist:${submissionId}:${targetPath}`;
});

const totalChecklistItems = checklistItemIds.length;

const checkedCount = computed(
  () => checklistItemIds.filter((itemId) => checklistState[itemId]).length
);

const isChecklistComplete = computed(() => checkedCount.value === totalChecklistItems);

function resetChecklistState() {
  checklistItemIds.forEach((itemId) => {
    checklistState[itemId] = false;
  });
}

function loadChecklistStateFromStorage() {
  resetChecklistState();
  checklistCompletionMessage.value = '';
  try {
    const saved = localStorage.getItem(checklistStorageKey.value);
    if (!saved) return;
    const parsed = JSON.parse(saved) as Record<string, boolean> | null;
    if (!parsed || typeof parsed !== 'object') return;
    checklistItemIds.forEach((itemId) => {
      checklistState[itemId] = Boolean(parsed[itemId]);
    });
  } catch {
    // Ignore storage parsing errors and start with a clean checklist.
  }
}

function onFinishSubmission() {
  if (!isChecklistComplete.value) return;
  checklistCompletionMessage.value = 'Checklist complete. Submission is ready to finish.';
}

function onReferenceViewerLoader(visible: boolean) {
  referenceFileLoading.value = visible;
}

function addBaseHref(html: string): string {
  const baseTag = `<base href="${window.location.origin}/">`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`);
  }
  return `${baseTag}${html}`;
}

async function loadTranscheckReport() {
  if (!selectedTranscheckPath.value) {
    transcheckReportHtml.value = '';
    transcheckLoadError.value = 'No transcheck report mapped for current selection.';
    return;
  }

  if (!transcheckReportPath.value) {
    transcheckReportHtml.value = '';
    transcheckLoadError.value = 'Download URL is not configured.';
    return;
  }

  transcheckLoadError.value = '';
  try {
    const html = await fetchReportHtml(transcheckReportPath.value);
    transcheckReportHtml.value = addBaseHref(html);
  } catch (error) {
    transcheckLoadError.value =
      error instanceof Error ? error.message : 'Unable to load transcheck report.';
  }
}

async function fetchReportHtml(reportPath: string): Promise<string> {
  const response = await fetch(reportPath, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load report (${response.status})`);
  }
  return response.text();
}

async function loadSegmentReviewReport() {
  if (!selectedSegmentReviewPath.value) {
    segmentReviewReportHtml.value = '';
    segmentReviewLoadError.value = 'No segment review report mapped for current selection.';
    return;
  }

  if (!segmentReviewReportPath.value) {
    segmentReviewReportHtml.value = '';
    segmentReviewLoadError.value = 'Download URL is not configured.';
    return;
  }

  segmentReviewLoadError.value = '';
  try {
    const html = await fetchReportHtml(segmentReviewReportPath.value);
    segmentReviewReportHtml.value = addBaseHref(html);
  } catch (error) {
    segmentReviewLoadError.value =
      error instanceof Error ? error.message : 'Unable to load segment review report.';
  }
}

watch(
  transcheckReportPath,
  async () => {
    await loadTranscheckReport();
  },
  { immediate: true }
);

watch(
  segmentReviewReportPath,
  async () => {
    await loadSegmentReviewReport();
  },
  { immediate: true }
);

watch(
  checklistStorageKey,
  () => {
    loadChecklistStateFromStorage();
  },
  { immediate: true }
);

watch(
  checklistState,
  (stateValue) => {
    localStorage.setItem(checklistStorageKey.value, JSON.stringify(stateValue));
    if (!isChecklistComplete.value && checklistCompletionMessage.value) {
      checklistCompletionMessage.value = '';
    }
  },
  { deep: true }
);
</script>

<style scoped>
.reports-view {
  padding: 16px;
  background: #ffffff;
}

.tabs-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.tab-button {
  padding: 10px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  border-bottom: 2px solid #2563eb;
  color: #2563eb;
}

.tab-content {
  margin-top: 20px;
}

.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
  background: #f9fafb;
}

.content-card--report {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: min(75vh, 920px);
}

.content-card--reference {
  height: min(75vh, 920px);
}

.content-card--checklist {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.checklist-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 130px;
}

.checklist-progress__value {
  font-size: 22px;
  line-height: 1.1;
  font-weight: 700;
  color: #1d4ed8;
}

.checklist-progress__label {
  font-size: 12px;
  color: #64748b;
}

.checklist-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checklist-section {
  border: 1px solid #dbe5f0;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.checklist-section h4 {
  margin: 0 0 10px;
  font-size: 15px;
  color: #0f172a;
}

.checklist-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #334155;
  line-height: 1.45;
  cursor: pointer;
}

.checklist-item input {
  margin-top: 4px;
}

.checklist-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #dbe5f0;
  padding-top: 12px;
}

.checklist-status {
  margin: 0;
  color: #166534;
  font-weight: 600;
}

.finish-submission-btn {
  border: none;
  border-radius: 6px;
  padding: 10px 14px;
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.finish-submission-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.content-note {
  margin: 0;
  color: #4b5563;
}

.content-error {
  margin: 0;
  color: #b91c1c;
  font-weight: 600;
}

.transcheck-report-frame {
  width: 100%;
  flex: 1;
  min-height: min(68vh, 820px);
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
}

.reference-viewer-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  height: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.reference-viewer-wrapper :deep(.only-office-viewer) {
  height: 100%;
  min-height: 0;
  flex: 1;
}

.content-link {
  width: fit-content;
  color: #1d4ed8;
  font-weight: 600;
}

.client-instructions {
  border: 1px solid #d6dee8;
  border-radius: 10px;
  background: #ffffff;
  padding: 16px;
  color: #334155;
  line-height: 1.6;
}

.client-instructions :deep(p) {
  margin: 0 0 10px;
}

.client-instructions :deep(ul),
.client-instructions :deep(ol) {
  margin: 0 0 10px 18px;
  padding: 0;
}

.client-instructions :deep(li) {
  margin-bottom: 8px;
}

.client-instructions :deep(strong) {
  color: #1f2937;
}
</style>
