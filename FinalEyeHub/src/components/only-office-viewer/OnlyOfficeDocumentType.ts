/**
 * Local extension groups for routing files to ONLYOFFICE. The Docs API itself
 * only accepts documentType: word | cell | slide | pdf | diagram — use
 * {@link toOnlyOfficeApiDocumentType} when building the editor config/JWT.
 */
export const OnlyOfficeDocumentType = {
  word: [
    'doc',
    'docm',
    'docx',
    'dot',
    'dotm',
    'dotx',
    'odt',
    'ott',
    'rtf',
    /** Plain text */
    'txt',
    'text',
    'log',
    /** Markup / web (HTML family) */
    'html',
    'htm',
    'xhtml',
    'shtml',
    'shtm',
    'xht',
    'hml',
    'mht',
    'mhtml',
    'md',
    'markdown',
    'xml',
    'xsl',
    'xslt',
    /** E-books & long-form text */
    'epub',
    'fb2',
    'fodt',
    'hwp',
    'hwpx',
    'pages',
    'wps',
    'wpt',
    'stw',
    'sxw',
    /** Other text / code often previewed as text */
    'json',
    'jsonc',
    'yaml',
    'yml',
    'toml',
    'ini',
    'cfg',
    'conf',
    'properties',
    'env',
    'sql',
    'vue',
    'jsx',
    'tsx',
    'css',
    'scss',
    'sass',
    'less',
    'js',
    'mjs',
    'cjs',
    'ts',
    'py',
    'rb',
    'php',
    'java',
    'cs',
    'go',
    'rs',
    'swift',
    'kt',
    'sh',
    'bash',
    'ps1',
    'bat',
    'cmd'
  ],
  cell: [
    'xls',
    'xlsx',
    'xlsb',
    'xlsm',
    'xlt',
    'xltm',
    'xltx',
    'ods',
    'ots',
    'fods',
    'et',
    'ett',
    'numbers',
    'sxc',
    'tsv'
  ],
  slide: [
    'odg',
    'ppt',
    'pptx',
    'pptm',
    'pot',
    'potm',
    'potx',
    'pps',
    'ppsm',
    'ppsx',
    'odp',
    'otp',
    'dps',
    'dpt',
    'fodp',
    'key',
    'sxi'
  ],
  pdf: ['pdf', 'djvu', 'xps', 'oxps'],
  diagram: ['vsd', 'vsdx', 'vsdm', 'vssx', 'vssm', 'vstx', 'vstm'],
  /**
   * Raster/vector images — opened with documentType `word` at the API layer
   * (ONLYOFFICE has no separate `image` type; support depends on server version).
   */
  image: [
    'bmp',
    'gif',
    'jpeg',
    'jpg',
    'jpe',
    'jfif',
    'pjpeg',
    'pjp',
    'png',
    'apng',
    'webp',
    'tif',
    'tiff',
    'ico',
    'svg',
    'heic',
    'heif',
    'avif',
    'raw',
    'dng',
    'cr2',
    'nef',
    'orf',
    'rw2',
    'arw'
  ]
};

export type OnlyOfficeBranchKey = keyof typeof OnlyOfficeDocumentType;

export type OnlyOfficeApiDocumentType = 'word' | 'cell' | 'slide' | 'pdf' | 'diagram';

export function getDocumentType(extension: string): OnlyOfficeBranchKey | undefined {
  const ext = extension.toLowerCase();
  for (const [docType, extensions] of Object.entries(OnlyOfficeDocumentType)) {
    if (extensions.includes(ext)) {
      return docType as OnlyOfficeBranchKey;
    }
  }
  return undefined;
}

/** Maps local branch (e.g. `image`) to a value allowed in ONLYOFFICE `config.documentType`. */
export function toOnlyOfficeApiDocumentType(
  branch: OnlyOfficeBranchKey | undefined
): OnlyOfficeApiDocumentType | undefined {
  if (branch === undefined) return undefined;
  if (branch === 'image') return 'word';
  return branch;
}
