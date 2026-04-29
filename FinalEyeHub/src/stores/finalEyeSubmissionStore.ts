import {
  finalEyeService,
  type SubmissionFileInfo,
  type SubmissionFolderInfo,
  type SubmissionFullResponse
} from '@/services/finalEye';
import { reactive, readonly } from 'vue';

export interface SubmissionSourceFile {
  name: string;
  path: string;
  contentType?: string;
  normalizedKey: string;
}

export interface SubmissionTargetFile {
  name: string;
  path: string;
  contentType?: string;
  normalizedKey: string;
  language: string;
  reports: {
    transcheckPaths: string[];
    segmentReviewPaths: string[];
    transiqPaths: string[];
    glossaryPaths: string[];
  };
}

interface FinalEyeSubmissionState {
  submissionId: string;
  submissionInfo: SubmissionFullResponse | null;
  sourceFiles: SubmissionSourceFile[];
  targetFilesBySource: Record<string, SubmissionTargetFile[]>;
  loading: boolean;
  error: string;
}

const state = reactive<FinalEyeSubmissionState>({
  submissionId: '',
  submissionInfo: null,
  sourceFiles: [],
  targetFilesBySource: {},
  loading: false,
  error: ''
});

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unable to fetch submission info.';
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function toFileStem(fileName: string): string {
  const extIdx = fileName.lastIndexOf('.');
  return extIdx > 0 ? fileName.slice(0, extIdx) : fileName;
}

function normalizeFileNameForMatch(fileName: string): string {
  const stem = toFileStem(fileName);
  const withoutPrefix = stem.replace(/^PRELIM__/i, '');
  const withoutLangSuffix = withoutPrefix.replace(/_[a-z]{2}-[a-z]{2}$/i, '');
  return normalizeText(withoutLangSuffix);
}

function toLanguageHint(fileName: string, path: string): string {
  const fromName = fileName.match(/([a-z]{2}-[a-z]{2})/i)?.[1];
  if (fromName) return fromName;
  const fromPath = path.match(/([a-z]{2}-[a-z]{2})/i)?.[1];
  return fromPath ?? '';
}

function normalizeFolderTree(
  node: SubmissionFolderInfo | undefined
): SubmissionFolderInfo | null {
  if (!node || typeof node !== 'object') return null;

  return {
    name: String(node.name ?? ''),
    type: String(node.type ?? ''),
    folders: Array.isArray(node.folders)
      ? node.folders
          .map((folder) => normalizeFolderTree(folder))
          .filter((folder): folder is SubmissionFolderInfo => folder !== null)
      : [],
    files: Array.isArray(node.files)
      ? node.files
          .filter((file) => file && typeof file.name === 'string' && typeof file.path === 'string')
          .map((file) => ({
            name: String(file.name),
            path: String(file.path),
            contentType: typeof file.contentType === 'string' ? file.contentType : undefined
          }))
      : []
  };
}

function collectFilesByFolderType(
  folder: SubmissionFolderInfo,
  targetType: string
): SubmissionFileInfo[] {
  const files: SubmissionFileInfo[] = [];
  const stack: SubmissionFolderInfo[] = [folder];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (normalizeText(current.type) === normalizeText(targetType)) {
      files.push(...current.files);
    }
    stack.push(...current.folders);
  }

  return files;
}

function extractReportPaths(subFolder: SubmissionFolderInfo, type: string): string[] {
  const files = subFolder.folders
    .filter((folder) => normalizeText(folder.type) === normalizeText(type))
    .flatMap((folder) => folder.files);

  return files.map((file) => file.path);
}

function extractLanguageFromPath(path: string): string {
  const match = path.match(/([a-z]{2}-[a-z]{2})/i);
  return match?.[1] ?? '';
}

function reportRank(path: string): number {
  const fileName = path.split('\\').pop()?.toLowerCase() ?? '';
  const proof2Match = fileName.match(/proof\s*2|proof2/);
  if (proof2Match) return 2;
  const proofMatch = fileName.match(/proof/);
  if (proofMatch) return 1;
  return 0;
}

function sortReportPaths(paths: string[], languageHint: string): string[] {
  const normalizedLanguage = normalizeText(languageHint);
  const languageMatched = normalizedLanguage
    ? paths.filter((path) => normalizeText(extractLanguageFromPath(path)) === normalizedLanguage)
    : paths;
  const candidates = languageMatched.length > 0 ? languageMatched : paths;

  return [...candidates].sort((a, b) => reportRank(b) - reportRank(a));
}

function mapSourcesAndTargets(folderDetails: SubmissionFolderInfo | null): {
  sourceFiles: SubmissionSourceFile[];
  targetFilesBySource: Record<string, SubmissionTargetFile[]>;
} {
  if (!folderDetails) {
    return { sourceFiles: [], targetFilesBySource: {} };
  }

  const sourceFilesRaw = collectFilesByFolderType(folderDetails, 'Source');
  const sourceFiles: SubmissionSourceFile[] = sourceFilesRaw.map((file) => ({
    name: file.name,
    path: file.path,
    contentType: file.contentType,
    normalizedKey: normalizeFileNameForMatch(file.name)
  }));

  const sourceIndex = new Map<string, SubmissionSourceFile>();
  sourceFiles.forEach((source) => {
    sourceIndex.set(source.normalizedKey, source);
  });

  const targetFilesBySource: Record<string, SubmissionTargetFile[]> = {};

  for (const subFolder of folderDetails.folders) {
    const transcheckPaths = extractReportPaths(subFolder, 'TransCheck');
    const segmentReviewPaths = extractReportPaths(subFolder, 'SegmentReview');
    const transiqPaths = extractReportPaths(subFolder, 'TransIQ');
    const glossaryPaths = extractReportPaths(subFolder, 'Glossary');

    for (const nestedFolder of subFolder.folders) {
      if (normalizeText(nestedFolder.type) !== normalizeText('Preview')) continue;

      for (const file of nestedFolder.files) {
        const normalizedKey = normalizeFileNameForMatch(file.name);
        const source = sourceIndex.get(normalizedKey);
        if (!source) continue;

        const target: SubmissionTargetFile = {
          name: file.name,
          path: file.path,
          contentType: file.contentType,
          normalizedKey,
          language: toLanguageHint(file.name, file.path),
          reports: {
            transcheckPaths: sortReportPaths(
              transcheckPaths,
              toLanguageHint(file.name, file.path)
            ),
            segmentReviewPaths: sortReportPaths(
              segmentReviewPaths,
              toLanguageHint(file.name, file.path)
            ),
            transiqPaths: sortReportPaths(transiqPaths, toLanguageHint(file.name, file.path)),
            glossaryPaths: sortReportPaths(glossaryPaths, toLanguageHint(file.name, file.path))
          }
        };

        const targetsForSource = targetFilesBySource[source.name] ?? [];
        targetsForSource.push(target);
        targetFilesBySource[source.name] = targetsForSource;
      }
    }
  }

  return {
    sourceFiles,
    targetFilesBySource
  };
}

export function useFinalEyeSubmissionStore() {
  const fetchSubmissionInfo = async (submissionId: string) => {
    const normalizedId = submissionId.trim();
    if (!normalizedId) return;

    if (state.loading && state.submissionId === normalizedId) return;

    state.loading = true;
    state.error = '';
    state.submissionId = normalizedId;

    try {
      const response = await finalEyeService.getSubmissionInfo(normalizedId);
      state.submissionInfo = response;
      const { sourceFiles, targetFilesBySource } = mapSourcesAndTargets(
        normalizeFolderTree(response.folderDetails)
      );
      state.sourceFiles = sourceFiles;
      state.targetFilesBySource = targetFilesBySource;
    } catch (error) {
      state.submissionInfo = null;
      state.sourceFiles = [];
      state.targetFilesBySource = {};
      state.error = toErrorMessage(error);
    } finally {
      state.loading = false;
    }
  };

  const resetSubmissionInfo = () => {
    state.submissionId = '';
    state.submissionInfo = null;
    state.sourceFiles = [];
    state.targetFilesBySource = {};
    state.loading = false;
    state.error = '';
  };

  return {
    state: readonly(state),
    fetchSubmissionInfo,
    resetSubmissionInfo
  };
}
