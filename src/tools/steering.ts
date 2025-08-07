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
  // Update publisher associations (replaces existing associations)
  updatePublisherAssociation: {
    name: 'updatePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: async (params: PublisherAssociationRequest) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids: params.private_app_ids,
              publisher_ids: params.publisher_ids
            })
          }
        );
        
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'success',
              message: `Successfully updated publisher associations`,
              data: {
                private_app_ids: params.private_app_ids,
                publisher_ids: params.publisher_ids,
                result: result
              }
            }, null, 2)
          }] 
        };
      } catch (error) {
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              error_details: error
            }, null, 2)
          }] 
        };
      }
    }
  },

  // Add publisher associations (adds to existing associations)
  addPublisherAssociation: {
    name: 'addPublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: async (params: PublisherAssociationRequest) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids: params.private_app_ids,
              publisher_ids: params.publisher_ids
            })
          }
        );
        
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'success',
              message: `Successfully added publisher associations`,
              data: {
                private_app_ids: params.private_app_ids,
                publisher_ids: params.publisher_ids,
                result: result
              }
            }, null, 2)
          }] 
        };
      } catch (error) {
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              error_details: error
            }, null, 2)
          }] 
        };
      }
    }
  },

  // Delete publisher associations
  deletePublisherAssociation: {
    name: 'deletePublisherAssociation',
    schema: publisherAssociationRequestSchema,
    handler: async (params: PublisherAssociationRequest) => {
      try {
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids: params.private_app_ids,
              publisher_ids: params.publisher_ids
            })
          }
        );
        
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'success',
              message: `Successfully deleted publisher associations`,
              data: {
                private_app_ids: params.private_app_ids,
                publisher_ids: params.publisher_ids,
                result: result
              }
            }, null, 2)
          }] 
        };
      } catch (error) {
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({
              status: 'error',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              error_details: error
            }, null, 2)
          }] 
        };
      }
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
