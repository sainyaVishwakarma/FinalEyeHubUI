<template>
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Final Eye Dashboard</h1>
        <p>TransCheck issue summary and review queue</p>
      </div>
  
      <!-- Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Issues</h3>
          <span>{{ totalIssues }}</span>
        </div>
  
        <div class="summary-card critical">
          <h3>High Priority</h3>
          <span>{{ highPriorityCount }}</span>
        </div>
  
        <div class="summary-card pending">
          <h3>Medium Priority</h3>
          <span>{{ mediumPriorityCount }}</span>
        </div>
  
        <div class="summary-card progress">
          <h3>Low Priority</h3>
          <span>{{ lowPriorityCount }}</span>
        </div>
      </div>
  
      <!-- Tags Breakdown -->
      <div class="breakdown-section">
        <div
          class="breakdown-card"
          v-for="(count, tag) in tagCount"
          :key="tag"
        >
          <h4>{{ tag }}</h4>
          <span>{{ count }}</span>
        </div>
      </div>
  
      <!-- Issues -->
      <div class="issue-list-section">
        <div class="section-header">
          <h2>Segments Requiring Review</h2>
  
          <button class="action-btn" @click="showModal = true">
            Send to Linguist
          </button>
        </div>
  
        <div class="issue-list">
          <div
            class="issue-card"
            v-for="(issue, index) in issues"
            :key="index"
            :class="issue.priority.toLowerCase()"
          >
            <div class="issue-top-row">
              <strong>Issue #{{ index + 1 }}</strong>
  
              <span
                class="priority-badge"
                :class="issue.priority.toLowerCase()"
              >
                {{ issue.priority }}
              </span>
            </div>
  
            <div class="content-grid">
              <div class="content-box">
                <label>Source</label>
                <p>{{ issue.source }}</p>
              </div>
  
              <div class="content-box">
                <label>Target</label>
                <p>{{ issue.target }}</p>
              </div>
            </div>
  
            <div class="meta-row">
              <span>
                <strong>Message:</strong>
                {{ issue.message || "No issue message" }}
              </span>
            </div>
  
            <div class="notes-row">
              <p><strong>Notes:</strong> {{ issue.notes }}</p>
            </div>
  
            <div class="tags-row">
              <span
                class="tag-pill"
                v-for="tag in issue.tags"
                :key="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
  
      <SendToLinguistModal
        :visible="showModal"
        :problemSegments="issues"
        @close="showModal = false"
        @send="sendMail"
      />
    </div>
  </template>
  
  <script setup>
  import { computed, ref } from "vue";
  import SendToLinguistModal from "@/components/SendToLinguistModal.vue";
  
  const showModal = ref(false);
  
  const issues = ref([
    {
      source: "Signature of Investigator if different to above:",
      target:
        "Semnătura Investigatorului dacă diferă de numele de mai sus:",
      message: "",
      notes:
        "Mistranslation detected. Suggestion: Semnătura Investigatorului dacă diferă de cea de mai sus",
      priority: "LOW",
      isEmptyNote: false,
      hasMultipleNotes: false,
      tags: ["Mistranslation"],
    },
  ]);
  
  const totalIssues = computed(() => issues.value.length);
  
  const highPriorityCount = computed(
    () => issues.value.filter((x) => x.priority === "HIGH").length
  );
  
  const mediumPriorityCount = computed(
    () => issues.value.filter((x) => x.priority === "MEDIUM").length
  );
  
  const lowPriorityCount = computed(
    () => issues.value.filter((x) => x.priority === "LOW").length
  );
  
  const tagCount = computed(() => {
    const map = {};
  
    issues.value.forEach((issue) => {
      issue.tags.forEach((tag) => {
        map[tag] = (map[tag] || 0) + 1;
      });
    });
  
    return map;
  });
  
  const sendMail = async (payload) => {
    console.log(payload);
    showModal.value = false;
  };
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 24px;
    background: #f8fafc;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .summary-card,
  .breakdown-card,
  .issue-list-section {
    background: white;
    border-radius: 14px;
    padding: 18px;
  }
  
  .breakdown-section {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .issue-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .issue-card {
    border: 1px solid #e2e8f0;
    border-left: 5px solid #94a3b8;
    padding: 18px;
    border-radius: 12px;
  }
  
  .issue-card.high {
    border-left-color: #dc2626;
  }
  
  .issue-card.medium {
    border-left-color: #f59e0b;
  }
  
  .issue-card.low {
    border-left-color: #16a34a;
  }
  
  .priority-badge {
    padding: 6px 10px;
    border-radius: 999px;
  }
  
  .priority-badge.high {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .priority-badge.medium {
    background: #fef3c7;
    color: #d97706;
  }
  
  .priority-badge.low {
    background: #dcfce7;
    color: #16a34a;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 14px 0;
  }
  
  .content-box {
    background: #f8fafc;
    padding: 14px;
    border-radius: 10px;
  }
  
  .tag-pill {
    display: inline-block;
    padding: 4px 8px;
    margin-right: 8px;
    margin-top: 8px;
    background: #e2e8f0;
    border-radius: 999px;
    font-size: 12px;
  }
  
  .action-btn {
    padding: 10px 16px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
  }
  </style>