import axios from 'axios'
import { setupAxiosInterceptors } from '@/services/axios'
import { requestTimeOut } from '@/services/types/BaseServiceApiSetting'

/** Filesystem API host + `/fs` segment, e.g. `https://fs-qa.transperfect.com/fs` */
const CARFS_BASE_URL = (
  import.meta.env.VITE_CARFS_BASE_URL ?? 'https://fs-qa.transperfect.com/fs'
).replace(/\/$/, '')

/**
 * Default folder/path segment for uploads (e.g. `PDFAnnotator` → `.../fs/PDFAnnotator`).
 * Override with `VITE_CARFS_UPLOAD_PATH`.
 */
export const CARFS_DEFAULT_UPLOAD_PATH =
  import.meta.env.VITE_CARFS_UPLOAD_PATH ?? 'PDFAnnotator'

export interface CarfsDirectoryItem {
  name: string
  path: string
  parentPath: string
  dateModified: string
  dateAdded: string
  expiration: string
  isDirectory: boolean
  size: number
  type: number
  replicated: boolean
  id: string
}

export interface CarfsDirectoryResponse {
  path: string
  filter: string
  pageIndex: number
  pageSize: number
  totalPages: number
  totalResults: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  list: CarfsDirectoryItem[]
}

function createCarfsClient() {
  const client = axios.create({
    baseURL: CARFS_BASE_URL,
    timeout: requestTimeOut,
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return setupAxiosInterceptors(client)
}

class CarfsAPIService {
  private readonly client = createCarfsClient()

  private encodePath(path: string): string {
    return path
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/')
  }

  getUsernameFromEmail(email: string): string {
    return email.split('@')[0]?.trim() ?? ''
  }

  getUserFolderPath(email: string): string {
    const username = this.getUsernameFromEmail(email)
    if (!username) {
      throw new Error('Unable to resolve username from email')
    }
    return `${CARFS_DEFAULT_UPLOAD_PATH}/${username}`
  }

  async pathExists(path: string): Promise<boolean> {
    try {
      await this.client.head(this.encodePath(path))
      return true
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false
      }
      throw error
    }
  }

  async createFolder(parentPath: string | null, folderName: string): Promise<void> {
    const formData = new FormData()
    formData.append(
      'folder',
      new Blob([], { type: 'application/octet-stream' }),
      folderName
    )
    const targetPath = parentPath ? this.encodePath(parentPath) : ''
    await this.client.post(targetPath, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async ensureUserFolder(email: string): Promise<string> {
    const userFolderPath = this.getUserFolderPath(email)
    const exists = await this.pathExists(userFolderPath)
    if (!exists) {
      const username = this.getUsernameFromEmail(email)
      if (!username) {
        throw new Error('Unable to resolve username from email')
      }
      await this.createFolder(CARFS_DEFAULT_UPLOAD_PATH, username)
    }
    return userFolderPath
  }

  async uploadFile(file: File, path: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)

    await this.client.post(
      this.encodePath(path),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
  }

  async getDirectory(path: string): Promise<CarfsDirectoryResponse> {
    const response = await this.client.get<CarfsDirectoryResponse>(`directory/${this.encodePath(path)}`)
    return response.data
  }

  async downloadFile(path: string): Promise<Blob> {
    const response = await this.client.get(this.encodePath(path), {
      responseType: 'blob',
    })
    return response.data
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.delete(this.encodePath(path))
  }
}

export const carfsAPIService = new CarfsAPIService()




