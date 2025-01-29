import { api } from '../config/netskope-config.js';
import {
  PublisherAssociationRequest,
  PublisherAssociationResponse,
  UserDiagnostics,
  DeviceDiagnostics,
  publisherAssociationRequestSchema
} from '../types/schemas/steering.schemas.js';

interface ApiResponse<T> {
  status: string;
  data: T;
}

// Tools for managing publisher and private app associations
export const SteeringTools = {
  // Update publisher associations
  updatePublisherAssociation: {
    name: 'updatePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: async (params: PublisherAssociationRequest) => {
      const result = await api.requestWithRetry<ApiResponse<PublisherAssociationResponse>>(
        '/api/v2/steering/npa/publisher/association',
        {
          method: 'PUT',
          body: JSON.stringify({
            private_app_ids: params.private_app_ids,
            publisher_ids: params.publisher_ids
          })
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  // Delete publisher associations
  deletePublisherAssociation: {
    name: 'deletePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: async (params: PublisherAssociationRequest) => {
      const result = await api.requestWithRetry<ApiResponse<PublisherAssociationResponse>>(
        '/api/v2/steering/npa/publisher/association',
        {
          method: 'DELETE',
          body: JSON.stringify({
            private_app_ids: params.private_app_ids,
            publisher_ids: params.publisher_ids
          })
        }
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  // Get user diagnostics
  getUserDiagnostics: {
    name: 'getUserDiagnostics',
    schema: {},
    handler: async () => {
      const result = await api.requestWithRetry<ApiResponse<UserDiagnostics>>(
        '/api/v2/steering/npa/user/diagnostics'
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  },

  // Get device diagnostics
  getDeviceDiagnostics: {
    name: 'getDeviceDiagnostics',
    schema: {
      deviceId: 'string',
      privateAppId: 'string'
    },
    handler: async (params: { deviceId: string; privateAppId: string }) => {
      const result = await api.requestWithRetry<ApiResponse<DeviceDiagnostics>>(
        `/api/v2/steering/npa/devices/${params.deviceId}/diagnostics/private_app/${params.privateAppId}`
      );
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
    }
  }
};
