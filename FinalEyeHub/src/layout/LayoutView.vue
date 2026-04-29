<script setup lang="ts">
import TheHeader from './header/TheHeader.vue'
import Sidebar from './sidebar/Sidebar.vue'
import TPLoader from '@/components/TPLoader.vue'
import TheFileRibbon from './TheFileRibbon.vue'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFinalEyeSubmissionStore } from '@/stores/finalEyeSubmissionStore'
import { LoaderSize } from '@/types/LoaderSize'

const route = useRoute()
const { state: submissionState, fetchSubmissionInfo } = useFinalEyeSubmissionStore()

const submissionIdFromUrl = computed(() => {
  const querySubmissionId =
    route.query.submissionId ??
    route.query.SubmissionId ??
    route.query.submissionID

  if (Array.isArray(querySubmissionId)) {
    return (querySubmissionId[0] ?? '').trim()
  }

  if (typeof querySubmissionId === 'string') {
    return querySubmissionId.trim()
  }

  return ''
})

watch(
  submissionIdFromUrl,
  async (submissionId) => {
    if (!submissionId) return
    await fetchSubmissionInfo(submissionId)
  },
  { immediate: true }
)

const showSubmissionLoader = computed(
  () => Boolean(submissionIdFromUrl.value) && submissionState.loading
)
</script>
<template>
<div class="layout">
    <header><TheHeader /></header>
    <div class="ribbon-container">
      <TheFileRibbon />
    </div>
    <main class="page-container">
      <aside
        class="sidebar-container"
      >
        <Sidebar />
      </aside>
      <section class="component-view">
        <router-view v-slot="{ Component, route }">
          <KeepAlive
            v-if="Component"
          >
            <component :is="Component" :key="route.path" />
          </KeepAlive>
          <TPLoader v-else />
        </router-view>
      </section>
    </main>
    <div v-if="showSubmissionLoader" class="layout__submission-loader">
      <TPLoader :size="LoaderSize.medium" />
    </div>
  </div>
</template>
<style lang="scss">
@use '../assets/styles/main.scss' as *;
</style>
<style lang="scss" src="./LayoutView.scss"></style>
<style scoped>
.layout__submission-loader {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.28);
}
</style>
