export const API_BASE_URL = 'http://localhost:4561/pdfannotator/api'
export const API_VERSION = '1'

export const buildUrl = (endpoint: string) => {
  return `${API_BASE_URL}/${endpoint}?api-version=${API_VERSION}`
}
