import { BaseResourceService } from '../axios/BaseResourceService'

export interface CreateClientRequest {
  clientName: string
  isCollaborationSubscribed: boolean
  roomAuthenticationTokenLifetime: number
  contactPerson: string
  contactEmail: string
}

export interface CreateClientResponse {
  apiKey: string
}

export interface ClientResponse {
  id: number
  name: string
  status: string
  isCollaborationSubscribed: boolean
  tokenLifetime: number
  contactName: string
  contactEmail: string
  createdOn: string
}

class ClientAPIService extends BaseResourceService {
  constructor(domain: string) {
    super(domain)
  }

  async create(data: CreateClientRequest): Promise<CreateClientResponse> {
    const response = await this.client.post('create', data)
    return response.data
  }

  async getAll(): Promise<ClientResponse[]> {
    const response = await this.client.get('all')
    return response.data
  }
}

export const clientApi = new ClientAPIService('Client')
