<script setup lang="ts">
import { ref } from 'vue'
import FileSelectionModal from './FileSelectionModal.vue'

const showModal = ref(false)

const selectedSource = ref('No source selected')
const selectedTarget = ref('No target selected')

const updateSelection = (payload: { source: string; target: string }) => {
  selectedSource.value = payload.source
  selectedTarget.value = payload.target
  showModal.value = false
}
</script>

<template>
  <div class="file-ribbon">
    <div class="file-info">
      <span><strong>Source:</strong> {{ selectedSource }}</span>
      <span><strong>Target:</strong> {{ selectedTarget }}</span>
    </div>

    <button class="select-btn" @click="showModal = true">
      Select File
    </button>

    <FileSelectionModal
      v-if="showModal"
      @close="showModal = false"
      @submit-selection="updateSelection"
    />
  </div>
</template>

<<style scoped>
.file-ribbon {
  height: 32px;
  min-height: 32px;
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 16px;
  box-sizing: border-box;

  border-bottom: 1px solid #ddd;
  background-color: #f8f9fa;

  color: #222;
  font-size: 13px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 24px;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-btn {
  height: 24px;
  min-width: 90px;

  padding: 0 12px;

  border: 1px solid #ccc;
  border-radius: 4px;

  background: white;
  cursor: pointer;
}
</style>