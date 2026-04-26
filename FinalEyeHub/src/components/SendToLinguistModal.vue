<template>
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Send to Linguist</h2>
          <button class="close-btn" @click="close">✕</button>
        </div>
  
        <div class="modal-body">
          <!-- Recipients -->
          <div class="field-group">
            <label>To</label>
            <input
              v-model="form.to"
              type="text"
              placeholder="linguist@company.com"
            />
          </div>
  
          <div class="recipient-row">
            <div class="field-group">
              <label>CC</label>
              <input
                v-model="form.cc"
                type="text"
                placeholder="manager@company.com"
              />
            </div>
  
            <div class="field-group">
              <label>BCC</label>
              <input
                v-model="form.bcc"
                type="text"
                placeholder="audit@company.com"
              />
            </div>
          </div>
  
          <!-- Subject -->
          <div class="field-group">
            <label>Subject</label>
            <input
              v-model="form.subject"
              type="text"
              placeholder="Review required for flagged segments"
            />
          </div>
  
          <!-- Message -->
          <div class="field-group">
            <label>Message</label>
            <textarea
              v-model="form.message"
              rows="6"
            />
          </div>
  
          <!-- Problem Segments -->
          <div class="segments-section">
            <h3>Problem Segments</h3>
  
            <div
              class="segment-card"
              v-for="segment in problemSegments"
              :key="segment.seg"
            >
              <div class="segment-header">
                <strong>Segment #{{ segment.seg }}</strong>
                <span class="severity">
                  {{ segment.severity }}
                </span>
              </div>
  
              <p><strong>Issue:</strong> {{ segment.issueType }}</p>
              <p><strong>Source:</strong> {{ segment.Source }}</p>
              <p><strong>Target:</strong> {{ segment.Target }}</p>
              <p><strong>Comment:</strong> {{ segment.Comment }}</p>
            </div>
          </div>
        </div>
  
        <div class="modal-footer">
          <button class="secondary-btn" @click="close">
            Cancel
          </button>
          <button class="primary-btn" @click="sendToLinguist">
            Send
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { reactive, watch } from "vue";
  
  const props = defineProps({
    visible: Boolean,
    problemSegments: {
      type: Array,
      default: () => [],
    },
  });
  
  const emit = defineEmits(["close", "send"]);
  
  const form = reactive({
    to: "",
    cc: "",
    bcc: "",
    subject: "Review required for flagged segments",
    message: "",
  });
  
  watch(
    () => props.visible,
    (newVal) => {
      if (newVal) {
        form.message = `Hi Team,
  
  Please review the highlighted segments mentioned below.
  
  The Final Eye review identified issues that require linguistic validation and correction.
  
  Kindly review and update the target content accordingly.
  
  Thanks,
  Final Eye Specialist`;
      }
    }
  );
  
  const close = () => {
    emit("close");
  };
  
  const sendToLinguist = () => {
    emit("send", {
      ...form,
      problemSegments: props.problemSegments,
    });
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-container {
    width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    background: white;
    border-radius: 18px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }
  
  .modal-header,
  .modal-footer {
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .modal-footer {
    border-top: 1px solid #e2e8f0;
    border-bottom: none;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .close-btn {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 18px;
  }
  
  .field-group {
    margin-bottom: 16px;
  }
  
  .field-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }
  
  input,
  textarea {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .recipient-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .segments-section {
    margin-top: 24px;
  }
  
  .segment-card {
    border: 1px solid #e2e8f0;
    border-left: 5px solid #dc2626;
    border-radius: 12px;
    padding: 14px;
    margin-top: 12px;
    background: #f8fafc;
  }
  
  .segment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .severity {
    color: #dc2626;
    font-weight: 600;
  }
  
  .primary-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
  }
  
  .secondary-btn {
    background: #e2e8f0;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
  }
  </style>