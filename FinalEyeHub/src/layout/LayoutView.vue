<script setup lang="ts">
import TheHeader from './header/TheHeader.vue'
import Sidebar from './sidebar/Sidebar.vue'
import TPLoader from '@/components/TPLoader.vue'
import TheFileRibbon from './TheFileRibbon.vue'

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
  </div>
</template>
<style lang="scss">
@use '../assets/styles/main.scss' as *;
</style>
<style lang="scss" src="./LayoutView.scss"></style>
