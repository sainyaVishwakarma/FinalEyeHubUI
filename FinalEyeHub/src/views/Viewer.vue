<script setup lang="ts">
import OnlyOfficeDemoSection from '@/components/only-office-viewer/OnlyOfficeDemoSection.vue';
import { onActivated, ref } from 'vue';

const viewerRefreshToken = ref(0);

onActivated(() => {
  // Force viewer instances to remount when entering the Viewer tab.
  viewerRefreshToken.value += 1;
});
</script>
<template>
  <div class="viewer">
    <h1 class="viewer__heading">Viewer</h1>
    <OnlyOfficeDemoSection
      :refresh-token="viewerRefreshToken"
      section-title="Viewer documents"
    />
  </div>
</template>
<style lang="scss" src="./Viewer.scss" scoped></style>