<template>
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Final Eye Dashboard</h1>
        <p>Review summary and issue queue</p>
      </div>
  
      <!-- Top Summary Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Issues</h3>
          <span>{{ totalIssues }}</span>
        </div>
  
        <div class="summary-card critical">
          <h3>High Severity</h3>
          <span>{{ highSeverityCount }}</span>
        </div>
  
        <div class="summary-card pending">
          <h3>Pending Review</h3>
          <span>{{ issues.length }}</span>
        </div>
  
        <div class="summary-card progress">
          <h3>Completion</h3>
          <span>{{ completionPercentage }}%</span>
        </div>
      </div>
  
      <!-- Issue Breakdown -->
      <div class="breakdown-section">
        <div
          class="breakdown-card"
          v-for="(count, type) in issueTypeCount"
          :key="type"
        >
          <h4>{{ type }}</h4>
          <span>{{ count }}</span>
        </div>
      </div>
  
      <!-- Main Issue List -->
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
            v-for="issue in issues"
            :key="issue.seg"
            :class="issue.severity.toLowerCase()"
            @click="openSegment(issue)"
          >
            <div class="issue-top-row">
              <div>
                <strong>Segment #{{ issue.seg }}</strong>
                <span class="block">Block {{ issue.Block }}</span>
              </div>
  
              <span
                class="severity-badge"
                :class="issue.severity.toLowerCase()"
              >
                {{ issue.severity }}
              </span>
            </div>
  
            <div class="content-grid">
              <div class="content-box source">
                <label>Source</label>
                <p>{{ issue.Source }}</p>
              </div>
  
              <div class="content-box target">
                <label>Target</label>
                <p>{{ issue.Target }}</p>
              </div>
            </div>
  
            <div class="meta-row">
              <span>
                <strong>Issue:</strong> {{ issue.issueType }}
              </span>
              <span>
                <strong>Score:</strong> {{ issue.score }}
              </span>
            </div>
  
            <div class="notes-row">
              <p><strong>Notes:</strong> {{ issue.Notes }}</p>
              <p><strong>Comment:</strong> {{ issue.Comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- Modal -->
    <SendToLinguistModal
      :visible="showModal"
      :problemSegments="issues"
      @close="showModal = false"
      @send="sendMail"
    />
  </template>
  
  <script setup>
  import { computed, ref } from "vue";
  import SendToLinguistModal from "@/components/SendToLinguistModal.vue";
  
  const showModal = ref(false);
  
  const issues = ref([
    {
      seg: 42,
      Block: "1-2-3",
      Source: "The total amount is 120",
      Target: "Le montant total est 12",
      score: "100+",
      Notes: "Possible number mismatch",
      Comment: "Please verify numeric consistency",
      severity: "High",
      issueType: "Number Difference Check",
    },
    {
      seg: 43,
      Block: "1-2-4",
      Source: "Hello World",
      Target: "Bonjour Monde",
      score: "95",
      Notes: "Glossary mismatch",
      Comment: "Use approved terminology",
      severity: "Medium",
      issueType: "Glossary Check",
    },
  ]);
  
  const totalIssues = computed(() => issues.value.length);
  
  const highSeverityCount = computed(
    () =>
      issues.value.filter(
        (x) => x.severity.toLowerCase() === "high"
      ).length
  );
  
  const completionPercentage = computed(() => 78);
  
  const issueTypeCount = computed(() => {
    const map = {};
  
    issues.value.forEach((issue) => {
      map[issue.issueType] = (map[issue.issueType] || 0) + 1;
    });
  
    return map;
  });
  
  const openSegment = (issue) => {
    console.log("Open segment", issue.seg);
  
    // later route to viewer / txlf
    // router.push(`/viewer/${issue.seg}`)
  };
  
  const sendMail = async (payload) => {
    try {
      console.log("Sending payload:", payload);
  
      /*
      await axios.post('/api/send-to-linguist', payload)
      */
  
      showModal.value = false;
    } catch (error) {
      console.error("Failed to send mail", error);
    }
  };
  </script>
  
  <style scoped>
  .dashboard-container {
    padding: 24px;
    background: #f8fafc;
    min-height: 100vh;
  }
  
  .dashboard-header h1 {
    margin: 0;
    font-size: 28px;
  }
  
  .dashboard-header p {
    color: #64748b;
    margin-bottom: 24px;
  }
  
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .summary-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .summary-card span {
    font-size: 28px;
    font-weight: 700;
  }
  
  .breakdown-section {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  
  .breakdown-card {
    background: white;
    padding: 14px 18px;
    border-radius: 12px;
    min-width: 220px;
  }
  
  .issue-list-section {
    background: white;
    border-radius: 18px;
    padding: 20px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  
  .action-btn {
    padding: 10px 16px;
    border: none;
    background: #2563eb;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .action-btn:hover {
    opacity: 0.9;
  }
  
  .issue-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  
  .issue-card {
    border: 1px solid #e2e8f0;
    border-left: 6px solid #94a3b8;
    border-radius: 14px;
    padding: 18px;
    cursor: pointer;
    transition: 0.2s ease;
  }
  
  .issue-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
  }
  
  .issue-card.high {
    border-left-color: #dc2626;
  }
  
  .issue-card.medium {
    border-left-color: #f59e0b;
  }
  
  .issue-top-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .block {
    margin-left: 12px;
    color: #64748b;
  }
  
  .severity-badge {
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .severity-badge.high {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .severity-badge.medium {
    background: #fef3c7;
    color: #d97706;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 14px;
  }
  
  .content-box {
    background: #f8fafc;
    padding: 14px;
    border-radius: 10px;
  }
  
  .content-box label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 8px;
  }
  
  .meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .notes-row p {
    margin: 4px 0;
  }
  </style>