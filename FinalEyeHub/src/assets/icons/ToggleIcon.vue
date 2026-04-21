<template>
  <svg v-if="theme === 'dark'" class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="5" fill="currentColor" />
    <g stroke="currentColor" stroke-width="2">
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </g>
  </svg>

  <svg v-else class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M21 12.79A9 9 0 1111.21 3
         7 7 0 0021 12.79z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ theme: 'light' | 'dark' }>()
</script>

<style scoped>
.icon {
  width: 24px;
  height: 24px;
}
</style>
