import * as z from 'zod';
import { 
  LocalBrokerResponse,
  LocalBrokersGetResponse,
  LocalBrokerConfigResponse,
  LocalBrokerPostRequest,
  LocalBrokerPutRequest,
  LocalBrokerConfigPutRequest,
  localBrokerPostRequestSchema,
  localBrokerPutRequestSchema,
  localBrokerConfigPutRequestSchema
} from '../types/schemas/local-broker.schemas.js';
import { api } from '../config/netskope-config.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const LocalBrokerTools = {
  list: {
    name: 'listLocalBrokers',
    schema: z.object({
      fields: z.string().optional()
    }),
    handler: async (params: { fields?: string }) => {
      const queryParams = params.fields ? `?fields=${params.fields}` : '';
      const result = await api.requestWithRetry<ApiResponse<LocalBrokersGetResponse>>(
        `/api/v2/infrastructure/lbrokers${queryParams}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  create: {
    name: 'createLocalBroker',
    schema: localBrokerPostRequestSchema,
    handler: async (params: LocalBrokerPostRequest) => {
      const result = await api.requestWithRetry<ApiResponse<LocalBrokerResponse>>(
        '/api/v2/infrastructure/lbrokers',
        {
          method: 'POST',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  get: {
    name: 'getLocalBroker',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<ApiResponse<LocalBrokerResponse>>(
        `/api/v2/infrastructure/lbrokers/${params.id}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  update: {
    name: 'updateLocalBroker',
    schema: localBrokerPutRequestSchema.extend({
      id: z.number()
    }),
    handler: async (params: LocalBrokerPutRequest & { id: number }) => {
      const { id, ...data } = params;
      const result = await api.requestWithRetry<ApiResponse<LocalBrokerResponse>>(
        `/api/v2/infrastructure/lbrokers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  delete: {
    name: 'deleteLocalBroker',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<ApiResponse<void>>(
        `/api/v2/infrastructure/lbrokers/${params.id}`,
        {
          method: 'DELETE'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  getConfig: {
    name: 'getBrokerConfig',
    schema: z.object({}),
    handler: async () => {
      const result = await api.requestWithRetry<ApiResponse<LocalBrokerConfigResponse>>(
        '/api/v2/infrastructure/lbrokers/brokerconfig'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  updateConfig: {
    name: 'updateBrokerConfig',
    schema: localBrokerConfigPutRequestSchema,
    handler: async (params: LocalBrokerConfigPutRequest) => {
      const result = await api.requestWithRetry<ApiResponse<LocalBrokerConfigResponse>>(
        '/api/v2/infrastructure/lbrokers/brokerconfig',
        {
          method: 'PUT',
          body: JSON.stringify(params)
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  generateLocalBrokerRegistrationToken: {
    name: 'generateLocalBrokerRegistrationToken',
    schema: z.object({
      id: z.number()
    }),
    handler: async (params: { id: number }) => {
      const result = await api.requestWithRetry<ApiResponse<{ token: string }>>(
        `/api/v2/infrastructure/lbrokers/${params.id}/registrationtoken`,
        {
          method: 'POST'
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
