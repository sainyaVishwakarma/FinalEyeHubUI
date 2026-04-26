<script setup lang="ts">
import OnlyOfficeDemoSection from '@/components/only-office-viewer/OnlyOfficeDemoSection.vue';
import { onMounted } from 'vue';
import { useOnlyOfficeSelectionStore } from '@/stores/onlyOfficeSelectionStore';

const sampleSourceName = 'ALXN1720-MG-301 -   Subject Participation Card.docx';
const sampleTargetName =
  'ALXN1720-MG-301 -   Subject Participation Card-Word-fr-FR#FE_DOMKBI#.docx';

const { state, updateSelection } = useOnlyOfficeSelectionStore();

onMounted(() => {
  // Test bootstrap: prefill source/target from sample files in /public.
  if (state.sourceDocument || state.targetDocument) return;

  updateSelection({
    currentDocument: sampleSourceName,
    sourceDocument: {
      downloadId: sampleSourceName,
      name: sampleSourceName
    },
    targetDocument: {
      downloadId: sampleTargetName,
      name: sampleTargetName
    }
  });
});
</script>
<template>
  <div class="viewer">
    <h1 class="viewer__heading">Viewer</h1>
    <OnlyOfficeDemoSection section-title="Viewer documents" />
  </div>
</template>
<style lang="scss" src="./Viewer.scss" scoped></style>