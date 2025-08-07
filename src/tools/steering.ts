import { api } from '../config/netskope-config.js';
import {
  PublisherAssociationRequest,
  PublisherAssociationResponse,
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
        // Convert app names to IDs if needed
        let private_app_ids: string[];
        
        if ('private_app_names' in params) {
          // Convert names to IDs
          private_app_ids = await Promise.all(
            params.private_app_names.map(async (appName) => {
              const apps = await api.requestWithRetry('/api/v2/steering/apps/private', {
                method: 'GET'
              }) as any;
              const app = apps.data?.private_apps?.find((a: any) => a.app_name === appName);
              if (!app) {
                throw new Error(`Private app '${appName}' not found`);
              }
              return app.app_id.toString();
            })
          );
        } else {
          // Fallback - should not happen with current schema
          throw new Error('No app identifiers provided');
        }
        
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids,
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
                private_app_ids,
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
        // Convert app names to IDs if needed
        let private_app_ids: string[];
        
        if ('private_app_names' in params) {
          // Convert names to IDs
          private_app_ids = await Promise.all(
            params.private_app_names.map(async (appName) => {
              const apps = await api.requestWithRetry('/api/v2/steering/apps/private', {
                method: 'GET'
              }) as any;
              const app = apps.data?.private_apps?.find((a: any) => a.app_name === appName);
              if (!app) {
                throw new Error(`Private app '${appName}' not found`);
              }
              return app.app_id.toString();
            })
          );
        } else {
          // Fallback - should not happen with current schema
          throw new Error('No app identifiers provided');
        }
        
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids,
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
                private_app_ids,
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
        // Convert app names to IDs if needed
        let private_app_ids: string[];
        
        if ('private_app_names' in params) {
          // Convert names to IDs
          private_app_ids = await Promise.all(
            params.private_app_names.map(async (appName) => {
              const apps = await api.requestWithRetry('/api/v2/steering/apps/private', {
                method: 'GET'
              }) as any;
              const app = apps.data?.private_apps?.find((a: any) => a.app_name === appName);
              if (!app) {
                throw new Error(`Private app '${appName}' not found`);
              }
              return app.app_id.toString();
            })
          );
        } else {
          // Fallback - should not happen with current schema
          throw new Error('No app identifiers provided');
        }
        
        const result = await api.requestWithRetry(
          '/api/v2/steering/apps/private/publishers',
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              private_app_ids,
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
                private_app_ids,
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
  }
};
