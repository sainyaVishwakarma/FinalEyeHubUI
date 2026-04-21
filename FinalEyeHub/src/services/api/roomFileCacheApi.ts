import { BaseResourceService } from '../axios/BaseResourceService'

export interface RoomFilePathCacheRequest {
  roomId: string
  path: string
}

export interface RoomFilePathCacheResponse {
  roomId: string
  path: string
}

class RoomFileCacheAPIService extends BaseResourceService {
  constructor(domain: string) {
    super(domain)
  }

  async setFilePathInCache(data: RoomFilePathCacheRequest): Promise<void> {
    await this.client.post('set', data)
  }

  async getFilePathFromCache(roomId: string): Promise<RoomFilePathCacheResponse> {
    const response = await this.client.get<RoomFilePathCacheResponse>(`${roomId}/path`)
    return response.data
  }
}

export const roomFileCacheApi = new RoomFileCacheAPIService('RoomFileCache')
