<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const emit = defineEmits(['close', 'submit-selection'])

const sourceFiles = ref<string[]>([])
const targetFiles = ref<string[]>([])

const selectedSource = ref('')
const selectedTarget = ref('')

const fetchDropdownData = async () => {
  try {
    const response = await axios.get('/api/files/options')

    sourceFiles.value = response.data.sourceFiles
    targetFiles.value = response.data.targetFiles
  } catch (error) {
    console.error('Error fetching dropdown data', error)
  }
}

const submitSelection = async () => {
  try {
    await axios.post('/api/files/fetch', {
      sourceFile: selectedSource.value,
      targetFile: selectedTarget.value
    })

    emit('submit-selection', {
      source: selectedSource.value,
      target: selectedTarget.value
    })
  } catch (error) {
    console.error('Error submitting selection', error)
  }
}

onMounted(() => {
  fetchDropdownData()
})
</script>

<template>
  <div class="modal-overlay">
    <div class="modal">
      <h3>Select Files</h3>

      <div class="field">
        <label>Source File</label>
        <select v-model="selectedSource">
          <option value="">Select source file</option>
          <option
            v-for="file in sourceFiles"
            :key="file"
            :value="file"
          >
            {{ file }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Target File</label>
        <select v-model="selectedTarget">
          <option value="">Select target file</option>
          <option
            v-for="file in targetFiles"
            :key="file"
            :value="file"
          >
            {{ file }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button @click="$emit('close')">Cancel</button>
        <button @click="submitSelection">Submit</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

@use '../assets/styles/main.scss' as *;
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  width: 420px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 70001;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  margin-bottom: 6px;
}

.field select {
  width: 100%;
  height: 36px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>