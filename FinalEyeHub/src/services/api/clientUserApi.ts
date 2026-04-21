import { BaseResourceService } from '../axios/BaseResourceService'

export interface RegisterClientUserRequest {
  email: string
  role: string
  clientName: string
}

export interface RegisterClientUserResponse {
  clientUserId: number
  message: string
}

export interface ClientUserResponse {
  id: number
  email: string
  role: string
  clientName: string
  createdOn: string
}

class ClientUserAPIService extends BaseResourceService {
  constructor(domain: string) {
    super(domain)
  }

  async register(data: RegisterClientUserRequest): Promise<RegisterClientUserResponse> {
    const response = await this.client.post('register', data)
    return response.data
  }

  async getAll(): Promise<ClientUserResponse[]> {
    const response = await this.client.get('list')
    return response.data
  }
}

export const clientUserApi = new ClientUserAPIService('ClientUser')
