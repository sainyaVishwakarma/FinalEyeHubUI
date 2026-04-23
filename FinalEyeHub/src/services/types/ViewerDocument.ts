/** Passed to ONLYOFFICE viewer; your API can return `downloadId` + `name` per file. */
export interface ViewerDocument {
  /** Value for the `downloadId` query on the OnlyOffice download endpoint. */
  downloadId: string | number;
  /** Display name including extension (ONLYOFFICE title and file type). */
  name: string;
  size?: string;
}
