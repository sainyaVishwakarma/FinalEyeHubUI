<script setup lang="ts">
import type { ViewerDocument } from '@/services/types/ViewerDocument';
import TPLoader from '@/components/TPLoader.vue';
import { LoaderSize } from '@/types/LoaderSize';
import { ref } from 'vue';
import OnlyOfficeViewer from './OnlyOfficeViewer.vue';

const props = withDefaults(
  defineProps<{
    sectionTitle: string;
  }>(),
  {
    sectionTitle: 'Documents'
  }
);

function extensionFromFileName(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

/** Dummy rows — swap for API data (`downloadId` + `name` per file). */
const dummyCatalog: ViewerDocument[] = [
  { downloadId: 1, name: 'Executive summary.docx', size: '128 KB' },
  { downloadId: 2, name: 'Compliance checklist.docx', size: '312 KB' },
  { downloadId: 3, name: 'Release notes.docx', size: '48 KB' },
  { downloadId: 4, name: 'Quarterly metrics.docx', size: '96 KB' },
  { downloadId: 5, name: 'Stakeholder overview.docx', size: '1.2 MB' },
  { downloadId: 6, name: 'Readme.docx', size: '4 KB' }
];

const activeDocument = ref<ViewerDocument | null>(null);
const loadingViewer = ref(false);

function openDocument(doc: ViewerDocument) {
  activeDocument.value = doc;
  loadingViewer.value = true;
}

function clearViewer() {
  activeDocument.value = null;
  loadingViewer.value = false;
}

function onViewerLoader(visible: boolean) {
  loadingViewer.value = visible;
}

function isActive(doc: ViewerDocument): boolean {
  return (
    activeDocument.value !== null &&
    activeDocument.value.downloadId === doc.downloadId &&
    activeDocument.value.name === doc.name
  );
}
</script>

<template>
  <section class="oo-demo" aria-labelledby="oo-demo-title">
    <header class="oo-demo__header">
      <h2 id="oo-demo-title" class="oo-demo__title">{{ props.sectionTitle }}</h2>
      <p class="oo-demo__subtitle">Select a file to preview it in the viewer below.</p>
    </header>

    <ul class="oo-demo__grid" role="list">
      <li
        v-for="(doc, index) in dummyCatalog"
        :key="`${doc.downloadId}-${index}`"
        class="oo-demo__grid-item"
      >
        <button
          type="button"
          class="oo-demo__card"
          :class="{ 'oo-demo__card--active': isActive(doc) }"
          @click="openDocument(doc)"
        >
          <span class="oo-demo__card-main">
            <span class="oo-demo__card-name">{{ doc.name }}</span>
            <span class="oo-demo__badge" aria-hidden="true">{{
              extensionFromFileName(doc.name)
            }}</span>
          </span>
          <span class="oo-demo__card-meta">{{ doc.size }}</span>
        </button>
      </li>
    </ul>

    <div v-if="activeDocument" class="oo-demo__inline-viewer">
      <header class="oo-demo__inline-head">
        <span class="oo-demo__inline-title">{{ activeDocument.name }}</span>
        <button type="button" class="oo-demo__inline-clear" @click="clearViewer">
          Clear
        </button>
      </header>
      <div class="oo-demo__inline-body">
        <TPLoader v-if="loadingViewer" :size="LoaderSize.medium" />
        <OnlyOfficeViewer
          :key="`${activeDocument.downloadId}::${activeDocument.name}`"
          :download-id="activeDocument.downloadId"
          :document-name="activeDocument.name"
          :is-view-only="true"
          @toggle-loader="onViewerLoader"
        />
      </div>
    </div>

    <p v-else class="oo-demo__empty-hint">No document selected.</p>
  </section>
</template>

<style lang="scss" src="./OnlyOfficeDemoSection.scss" scoped></style>
