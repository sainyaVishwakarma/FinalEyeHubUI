<script setup lang="ts">
import axios from "axios";
import { computed, markRaw, ref, shallowRef, toRaw, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

/** Avoid Vue deep proxies on DOM trees — they can break live mutations + XMLSerializer. */
const xmlDoc = shallowRef<Document | null>(null);
const units = shallowRef<any[]>([]);
const isSaving = ref(false);
/** Default submission id (temporary); URL ?submissionId= still overrides when present. */
const submissionIdInput = ref("0107643");
const saveError = ref("");

/** Original file text from the last upload — output is always rebuilt from this + table edits (avoids stale DOM). */
const sourceXmlText = ref("");

watch(
  () => route.query.submissionId,
  (q) => {
    if (q !== undefined && q !== null && String(q).trim() !== "") {
      submissionIdInput.value = String(q);
    }
  },
  { immediate: true },
);

function resolvedSubmissionId(): string {
  const fromInput = submissionIdInput.value.trim();
  const q = route.query.submissionId;
  const fromQuery =
    q !== undefined && q !== null ? String(q).trim() : "";
  return fromInput || fromQuery;
}

/**
 * Upload URL. In dev, use same-origin path so Vite can proxy (see vite.config → /TransCheck).
 * Set VITE_TRANSCHECK_BASE_URL for production or a non-proxied API host.
 */
function transCheckUploadTxlfUrl(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const explicit = env.VITE_TRANSCHECK_BASE_URL?.replace(/\/$/, "");
  if (explicit) {
    return `${explicit}/TransCheck/upload/txlf`;
  }
  if (import.meta.env.DEV) {
    return "/TransCheck/upload/txlf";
  }
  return "http://localhost:5001/TransCheck/upload/txlf";
}

/** Form field name for the file part (must match backend parameter name). */
function txlfFormFieldName(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return env.VITE_TRANSCHECK_TXLF_FORM_FIELD?.trim() || "file";
}

function looksLikeXml(s: string): boolean {
  const t = s.trim();
  return t.startsWith("<?xml") || t.startsWith("<");
}

/** Prefer XML returned by the server; ignore JSON bodies that are not XML (avoids corrupting the editor). */
function extractTxlfXmlFromResponse(data: unknown): string | null {
  if (typeof data === "string" && data.trim().length > 0 && looksLikeXml(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const k of ["txlfContent", "content", "txlf", "data", "value"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim().length > 0 && looksLikeXml(v)) {
        return v;
      }
    }
  }
  return null;
}

function refreshFromXmlString(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err?.textContent) {
    console.error("Failed to parse TXLF from response:", err.textContent);
    return;
  }
  sourceXmlText.value = xml;
  xmlDoc.value = doc;
  units.value = extractUnits(doc);
}

// 🔹 Strip XLIFF tags for UI display
function stripXliffTags(value: string): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/<[^>]*>/g, "") // remove all XML tags
    .replace(/\s+/g, " ") // normalize spaces
    .trim();
}

// 🔹 File upload handler
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const text = reader.result as string;
    sourceXmlText.value = text;

    const parser = new DOMParser();

    xmlDoc.value = parser.parseFromString(text, "text/xml");

    units.value = extractUnits(xmlDoc.value);
  };

  reader.readAsText(file);
}

// 🔹 Extract TXLF units dynamically
function extractUnits(doc: Document) {
  const nodes = doc.getElementsByTagNameNS("*", "trans-unit");

  return Array.from(nodes).map((node: any, index: number) => {
    const fields: Record<string, any> = {};

    Array.from(node.children).forEach((child: any) => {
      const key = child.localName;

      if (key === "alt-trans") return;

      fields[key] = {
        raw: child.innerHTML,
        display: stripXliffTags(child.innerHTML),
      };
    });

    return {
      uiId: index + 1,
      xmlId: node.getAttribute("id"),
      fields,
      /** Raw DOM node — not reactive (see markRaw). */
      node: markRaw(node),
    };
  });
}

/**
 * Apply table edits onto a Document (by trans-unit index). Uses toRaw(unit) so Vue proxies never hide updates.
 */
function applyUnitsToDocument(doc: Document) {
  const unitNodes = Array.from(
    doc.getElementsByTagNameNS("*", "trans-unit"),
  );

  units.value.forEach((unit, index) => {
    const tu = unitNodes[index];
    if (!tu) return;
    const u = toRaw(unit);

    Array.from(tu.children).forEach((child) => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const el = child as Element;
      const key = el.localName;
      if (key === "alt-trans") return;
      const field = u.fields[key] as { display?: string } | undefined;
      if (field && typeof field.display === "string") {
        el.innerHTML = field.display;
      }
    });
  });
}

/** Always rebuild XML from the uploaded source string + current table — reliable bytes for API / download. */
function getEditedXmlPayload(): string {
  const base = sourceXmlText.value;
  if (!base.trim()) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(base, "text/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err?.textContent) {
    console.error("Invalid XML:", err.textContent);
    return "";
  }

  applyUnitsToDocument(doc);
  const out = new XMLSerializer().serializeToString(doc);
  return out;
}

/** Sync in-memory tree after we produce a new XML string (optional visual consistency). */
function replaceDocumentFromXml(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err?.textContent) return;
  xmlDoc.value = doc;
  units.value = extractUnits(doc);
}

// 🔹 Convert live DOM → string (fallback)
function getXmlString() {
  const doc = toRaw(xmlDoc.value);
  if (!doc) return "";

  return new XMLSerializer().serializeToString(doc);
}

// 🔹 Save — POST TXLF update (submissionId + file), then refresh UI from response or local XML
async function saveTxlf() {
  saveError.value = "";
  const submissionId = resolvedSubmissionId();
  if (!submissionId) {
    saveError.value =
      "Enter a submission ID above (or open this page with ?submissionId=…). Save was skipped — no request sent.";
    return;
  }

  const xmlString = getEditedXmlPayload();
  if (!xmlString) {
    saveError.value = "No TXLF content to save.";
    return;
  }

  const formData = new FormData();
  const field = txlfFormFieldName();
  formData.append(
    field,
    new Blob([xmlString], { type: "application/xml" }),
    "document.txlf",
  );

  isSaving.value = true;
  try {
    const { data } = await axios.post(transCheckUploadTxlfUrl(), formData, {
      params: {
        submissionId: String(submissionId),
        "api-version": "1",
      },
    });

    const fromServer = extractTxlfXmlFromResponse(data);
    if (fromServer) {
      refreshFromXmlString(fromServer);
    } else {
      sourceXmlText.value = xmlString;
      replaceDocumentFromXml(xmlString);
    }
    saveError.value = "";
  } catch (e) {
    console.error("Update TXLF failed:", e);
    if (axios.isAxiosError(e)) {
      const msg =
        (typeof e.response?.data === "string" && e.response.data) ||
        (e.response?.data &&
          typeof e.response.data === "object" &&
          String(
            (e.response.data as { message?: string; title?: string })
              .message ||
              (e.response.data as { title?: string }).title ||
              "",
          )) ||
        e.message;
      saveError.value =
        `Save failed (${e.response?.status ?? "network"}): ${msg}. If this only happens in the dev server, ensure Vite proxy targets your API (vite.config server.proxy /TransCheck).`;
    } else {
      saveError.value = `Save failed: ${String(e)}`;
    }
  } finally {
    isSaving.value = false;
  }
}

const uploadedFileName = ref("");

function onFilePickMeta(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  uploadedFileName.value = file?.name ?? "document.txlf";
  onFileChange(event);
}

/** Same bytes as upload API — use this to verify edits; browsers cannot overwrite the file you picked from disk. */
function downloadEditedTxlf() {
  const xmlString = getEditedXmlPayload();
  if (!xmlString) return;

  const base = uploadedFileName.value.replace(/\.[^.]+$/, "") || "document";
  const name = `${base}-edited.txlf`;

  const blob = new Blob([xmlString], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
const columns = computed(() => {
  if (!units.value.length) return [];

  return Object.keys(units.value[0].fields).filter(
    (key) => key !== "alt-trans",
  );
});
</script>

<template>
  <div class="txlf">
    <h1>TXLF Editor</h1>

    <div class="submission-row">
      <label for="txlf-submission-id">Submission ID</label>
      <input
        id="txlf-submission-id"
        v-model="submissionIdInput"
        type="text"
        inputmode="numeric"
        placeholder="0107643"
        autocomplete="off"
      />
    </div>
    <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>

    <p class="txlf-hint">
      The file you choose from your computer is not modified in place (browser limitation).
      Use <strong>Download edited TXLF</strong> to save your changes locally, or <strong>Save TXLF</strong> to send them to the server.
    </p>

    <!-- 🔹 File input -->
    <input type="file" accept=".txlf,.xml" @change="onFilePickMeta" />

    <!-- 🔹 Table -->
    <div v-if="units.length" class="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th v-for="key in columns" :key="key">
              {{ key }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in units" :key="row.uiId">
            <td>{{ row.uiId }}</td>

            <td v-for="key in columns" :key="key">
              <input v-model="row.fields[key].display" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>No TXLF loaded</div>

    <div v-if="units.length" class="txlf-actions">
      <button type="button" @click="downloadEditedTxlf">
        Download edited TXLF
      </button>

      <button type="button" @click="saveTxlf" :disabled="isSaving">
        {{ isSaving ? "Saving…" : "Save TXLF" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.submission-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.submission-row label {
  font-weight: 600;
}

.submission-row input {
  width: 12rem;
  padding: 6px 10px;
}

.save-error {
  color: #b91c1c;
  font-size: 14px;
  margin: 0 0 12px;
  max-width: 40rem;
}

.txlf-hint {
  font-size: 14px;
  color: #475569;
  margin: 0 0 16px;
  max-width: 44rem;
  line-height: 1.45;
}

.txlf-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.txlf-actions button {
  padding: 8px 14px;
  cursor: pointer;
}
</style>

<style lang="scss" src="./Txlf.scss" scoped></style>
