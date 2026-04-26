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
          Showing local sample report from <code>public</code> for testing.
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

      <div v-else-if="activeTab === 'clientInstructions'" class="content-card">
        <h3>Client Instructions</h3>
        <p>Placeholder for table list UI.</p>
      </div>

      <div v-else-if="activeTab === 'feChecklist'" class="content-card">
        <h3>FE Checklist</h3>
        <p>Placeholder for to-do style checklist UI.</p>
      </div>

      <div v-else-if="activeTab === 'transiq'" class="content-card">
        <h3>TransIQ Report</h3>
        <p>Placeholder for excel-style report view.</p>
      </div>

      <div v-else-if="activeTab === 'glossary'" class="content-card">
        <h3>Glossary</h3>
        <p>Placeholder for custom glossary HTML/CSS UI.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const activeTab = ref('transcheck');
const transcheckReportPath =
  '/Transcheck_Report_Combined_Sub_6167783_Batch1(1)_en-US-ro-RO_QM2.html';
const transcheckReportHtml = ref('');
const transcheckLoadError = ref('');

const tabs = [
  { id: 'transcheck', label: 'Transcheck File' },
  { id: 'clientInstructions', label: 'Client Instructions' },
  { id: 'feChecklist', label: 'FE Checklist' },
  { id: 'transiq', label: 'TransIQ Report' },
  { id: 'glossary', label: 'Glossary' }
];

function addBaseHref(html: string): string {
  const baseTag = `<base href="${window.location.origin}/">`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`);
  }
  return `${baseTag}${html}`;
}

onMounted(async () => {
  try {
    const response = await fetch(transcheckReportPath, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Unable to load report (${response.status})`);
    }
    const html = await response.text();
    transcheckReportHtml.value = addBaseHref(html);
  } catch (error) {
    transcheckLoadError.value =
      error instanceof Error ? error.message : 'Unable to load transcheck report.';
  }
});
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

.content-link {
  width: fit-content;
  color: #1d4ed8;
  font-weight: 600;
}
</style>
