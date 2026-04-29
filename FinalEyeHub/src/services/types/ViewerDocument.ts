/** Passed to ONLYOFFICE viewer; can carry file path or legacy id with display name. */
export interface ViewerDocument {
  /** Value used for file lookup on the OnlyOffice download endpoint (`filePath` query now). */
  downloadId: string | number;
  /** Display name including extension (ONLYOFFICE title and file type). */
  name: string;
  size?: string;
}
