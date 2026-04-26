<script setup lang="ts">
import TPLoader from '@/components/TPLoader.vue';
import { LoaderSize } from '@/types/LoaderSize';
import { ref } from 'vue';
import OnlyOfficeViewer from './OnlyOfficeViewer.vue';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';

const props = withDefaults(
  defineProps<{
    sectionTitle: string;
  }>(),
  {
    sectionTitle: 'Documents'
  }
);

const { state } = useOnlyOfficeSelectionStore();
const sourceLoading = ref(false);
const targetLoading = ref(false);

function onSourceViewerLoader(visible: boolean) {
  sourceLoading.value = visible;
}

function onTargetViewerLoader(visible: boolean) {
  targetLoading.value = visible;
}
</script>

<template>
  <section class="oo-demo" aria-labelledby="oo-demo-title">
    <header class="oo-demo__header">
      <h2 id="oo-demo-title" class="oo-demo__title">{{ props.sectionTitle }}</h2>
      <p class="oo-demo__subtitle">
        Source and target files selected from the ribbon are displayed side-by-side.
      </p>
    </header>

    <div
      v-if="state.sourceDocument || state.targetDocument"
      class="oo-demo__viewer-grid"
      role="list"
    >
      <div class="oo-demo__inline-viewer" role="listitem">
        <header class="oo-demo__inline-head">
          <span class="oo-demo__inline-title">Source</span>
          <span class="oo-demo__inline-file">{{ state.sourceDocument?.name ?? 'Not selected' }}</span>
        </header>
        <div class="oo-demo__inline-body">
          <template v-if="state.sourceDocument">
            <TPLoader v-if="sourceLoading" :size="LoaderSize.medium" />
            <OnlyOfficeViewer
              :key="`source::${state.sourceDocument.downloadId}::${state.sourceDocument.name}`"
              :download-id="state.sourceDocument.downloadId"
              :document-name="state.sourceDocument.name"
              :is-view-only="true"
              @toggle-loader="onSourceViewerLoader"
            />
          </template>
          <p v-else class="oo-demo__empty-hint">No source file selected.</p>
        </div>
      </div>

      <div class="oo-demo__inline-viewer" role="listitem">
        <header class="oo-demo__inline-head">
          <span class="oo-demo__inline-title">Target</span>
          <span class="oo-demo__inline-file">{{ state.targetDocument?.name ?? 'Not selected' }}</span>
        </header>
        <div class="oo-demo__inline-body">
          <template v-if="state.targetDocument">
            <TPLoader v-if="targetLoading" :size="LoaderSize.medium" />
            <OnlyOfficeViewer
              :key="`target::${state.targetDocument.downloadId}::${state.targetDocument.name}`"
              :download-id="state.targetDocument.downloadId"
              :document-name="state.targetDocument.name"
              :is-view-only="true"
              @toggle-loader="onTargetViewerLoader"
            />
          </template>
          <p v-else class="oo-demo__empty-hint">No target file selected.</p>
        </div>
      </div>
    </div>

    <p v-else class="oo-demo__empty-hint">
      Select source and target files from the ribbon to preview them here.
    </p>
  </section>
</template>

<style lang="scss" src="./OnlyOfficeDemoSection.scss" scoped></style>
