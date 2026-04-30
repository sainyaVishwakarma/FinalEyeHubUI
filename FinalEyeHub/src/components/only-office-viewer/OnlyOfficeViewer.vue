<script setup lang="ts">
import { DebugModeState } from '@/enums/DebugModeState';
import type { IConfig } from '@onlyoffice/document-editor-vue/lib/model/config';
import { DocumentEditor } from '@onlyoffice/document-editor-vue';
import { SignJWT } from 'jose';
import { cloneDeep } from 'lodash-es';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { getDocumentType, toOnlyOfficeApiDocumentType } from './OnlyOfficeDocumentType';

const emit = defineEmits<{
  'on-error': [];
  'toggle-loader': [visible: boolean];
}>();

const props = withDefaults(
  defineProps<{
    /** Query value for `filePath` (or legacy identifier) in `OnlyOffice/downloadfile` API. */
    downloadId: string | number;
    /** File name including extension (title in ONLYOFFICE). */
    documentName: string;
    isViewOnly?: boolean;
  }>(),
  {
    isViewOnly: true
  }
);

const docServerUrl = computed(() => {
  const raw = import.meta.env.VITE_ONLYOFFICESERVER || '';
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (!s) return '';
  return s.endsWith('/') ? s : `${s}/`;
});

/** Prefer `VITE_ONLYOFFICE_DOWNLOAD_URL`; otherwise `VITE_API_HOST` + `/OnlyOffice/downloadfile`. */
const downloadFileBaseUrl = computed(() => {
  const explicit = (import.meta.env.VITE_ONLYOFFICE_DOWNLOAD_URL || '').trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const host = (import.meta.env.VITE_API_HOST || '').trim().replace(/\/$/, '');
  if (host) return `${host}/OnlyOffice/downloadfile`;
  return '';
});

const logoUrl = import.meta.env.VITE_OIDC_REDIRECT_URI ?? '';

const viewerDisplayName =
  import.meta.env.VITE_ONLYOFFICE_VIEWER_USER_NAME?.trim() || 'Guest';

const extension = computed(
  () => props.documentName.split('.').pop()?.toLowerCase() || ''
);

const documentType = computed(() => getDocumentType(extension.value));

const apiDocumentType = computed(() => toOnlyOfficeApiDocumentType(documentType.value));

const documentKey = computed(() => {
  const raw = `${props.downloadId}|${props.documentName}`;
  const safe = raw
    .replace(/[^a-zA-Z0-9\-._=]/g, '_')
    .slice(0, 128);
  return safe.length > 0 ? safe : 'doc-key';
});

/** Full URL ONLYOFFICE uses to fetch the file bytes (must be reachable from Document Server). */
const documentUrl = computed(() => {
  const base = downloadFileBaseUrl.value;
  const id = encodeURIComponent(String(props.downloadId));
  return `${base}?filePath=${id}&api-version=1`;
});

const unsupported = computed(() => documentType.value === undefined);

const tokenRef = ref('');

const editorConfigBase = computed(() => ({
  mode: props.isViewOnly ? 'view' : 'edit',
  user: {
    name: viewerDisplayName
  },
  customization: {
    autosave: false,
    comments: false,
    hideFileName: true,
    compactHeader: true,
    compactToolbar: true,
    compatibleFeatures: true,
    forcesave: false,
    saveAs: false,
    help: false,
    hideRightMenu: true,
    hideRulers: true,
    integrationMode: 'embedded',
    logo: {
      image: `${logoUrl}/favicon.ico`,
      url: logoUrl,
      visible: true
    },
    macros: false,
    mentionShare: false,
    mobileForceView: false,
    plugins: false,
    toolbarHideFileName: true,
    uiTheme: 'theme-light',
    unit: 'cm',
    zoom: 100,
    features: {
      tabStyle: 'compact',
      tabBackground: 'dark'
    }
  }
}));

const documentBlock = computed(() => ({
  fileType: extension.value,
  title: props.documentName,
  url: documentUrl.value,
  key: documentKey.value,
  permissions: {
    chat: false,
    comment: false,
    copy: false,
    deleteCommentAuthorOnly: false,
    toolbarHideFileName: true,
    download: true,
    edit: !props.isViewOnly,
    editCommentAuthorOnly: false,
    fillForms: false,
    modifyContentControl: false,
    print: props.isViewOnly,
    protect: false,
    review: false
  }
}));

const viewerConfig = computed<IConfig>(() => ({
  token: tokenRef.value,
  document: documentBlock.value,
  documentType: apiDocumentType.value,
  editorConfig: editorConfigBase.value,
  height: '100%',
  width: '100%'
}));

const tokenReady = ref(false);

function logOnlyOfficeRequest(stage: 'init' | 'change') {
  if (import.meta.env.VITE_DEBUG_MODE !== DebugModeState.ON) return;
  const filePathRaw = String(props.downloadId);
  const looksLikePath = filePathRaw.includes('\\') || filePathRaw.includes('/');
  console.info('[OnlyOfficeViewer] Request debug', {
    stage,
    documentName: props.documentName,
    filePathRaw,
    looksLikePath,
    downloadEndpointBase: downloadFileBaseUrl.value,
    requestUrl: documentUrl.value
  });
}

const generateToken = async () => {
  const docType = apiDocumentType.value;
  if (unsupported.value || !docType) {
    tokenReady.value = false;
    tokenRef.value = '';
    emit('toggle-loader', false);
    return;
  }

  const payload = {
    document: cloneDeep(documentBlock.value),
    documentType: docType,
    editorConfig: cloneDeep(editorConfigBase.value)
  };

  const secretRaw = (
    import.meta.env.VITE_ONLYOFFICE_JWT_SECRET ??
    import.meta.env.VITE_REEFEXHIBIT_ONLYOFFICESERVER_SECERET ??
    ''
  ).trim();
  if (secretRaw.length === 0) {
    tokenRef.value = '';
  } else {
    const key = new TextEncoder().encode(secretRaw);
    tokenRef.value = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime('1h')
      .sign(key);
  }
  tokenReady.value = true;
};

const editorId = computed(() => `doc-${String(props.downloadId)}-view-only`);

const onLoadComponentError = () => {
  emit('on-error');
  emit('toggle-loader', false);
  if (import.meta.env.VITE_DEBUG_MODE === DebugModeState.ON) {
    console.error('Error loading ONLYOFFICE Document Viewer (component load)');
  }
};

const onError = () => {
  emit('on-error');
  if (import.meta.env.VITE_DEBUG_MODE === DebugModeState.ON) {
    console.error('Error from ONLYOFFICE Document Viewer');
  }
};

const onAppReady = () => {
  emit('toggle-loader', false);
};

onBeforeMount(async () => {
  emit('toggle-loader', true);
  logOnlyOfficeRequest('init');
  await generateToken();
});

watch(
  () => [props.downloadId, props.documentName] as const,
  async ([nextId, nextName], prev) => {
    if (prev && (nextId !== prev[0] || nextName !== prev[1])) {
      tokenReady.value = false;
      emit('toggle-loader', true);
      logOnlyOfficeRequest('change');
      await generateToken();
    }
  }
);

watch(unsupported, (invalid) => {
  if (invalid) {
    tokenReady.value = false;
    emit('toggle-loader', false);
  }
});
</script>

<template>
  <div class="only-office-viewer">
    <p v-if="unsupported" class="only-office-viewer__unsupported">
      This file type is not supported for preview.
    </p>
    <p
      v-else-if="tokenReady && !downloadFileBaseUrl"
      class="only-office-viewer__unsupported"
    >
      Download URL is missing. Set
      <code>VITE_ONLYOFFICE_DOWNLOAD_URL</code>
      (e.g.
      <code>https://localhost:7063/OnlyOffice/downloadfile</code>) in
      <code>.env</code>.
    </p>
    <p
      v-else-if="tokenReady && !docServerUrl"
      class="only-office-viewer__unsupported"
    >
      ONLYOFFICE server URL is missing. Set
      <code>VITE_ONLYOFFICESERVER</code>
      in <code>.env</code>, then restart the dev server (<code>npm run dev</code>).
    </p>
    <div
      v-else-if="tokenReady && docServerUrl && downloadFileBaseUrl"
      class="only-office-viewer__frame"
    >
      <DocumentEditor
        :id="editorId"
        :document-server-url="docServerUrl"
        :config="viewerConfig"
        :on-load-component-error="onLoadComponentError"
        :events_on-app-ready="onAppReady"
        :events_on-error="onError"
      />
    </div>
  </div>
</template>

<style lang="scss" src="./OnlyOfficeViewer.scss" scoped></style>
