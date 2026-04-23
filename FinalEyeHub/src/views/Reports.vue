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
        <div v-if="activeTab === 'transcheck'" class="content-card">
          <h3>Transcheck File (.html)</h3>
          <p>Placeholder for transcheck HTML report preview.</p>
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
  
  <script setup>
  import { ref } from 'vue'
  
  const activeTab = ref('transcheck')
  
  const tabs = [
    { id: 'transcheck', label: 'Transcheck File' },
    { id: 'clientInstructions', label: 'Client Instructions' },
    { id: 'feChecklist', label: 'FE Checklist' },
    { id: 'transiq', label: 'TransIQ Report' },
    { id: 'glossary', label: 'Glossary' },
  ]
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
  </style>