/**
 * Helper tools for building and executing common queries on private apps
 */

import * as z from 'zod';
import { PrivateAppsTools } from './private-apps.js';
import { QueryHelpers, buildQuery, validateQuery, parseQuery } from '../utils/query-builder.js';

// Schema for query validation tool
const validateQuerySchema = z.object({
  query: z.string().describe('Query string to validate')
});

// Schema for query building tools
const queryByNameSchema = z.object({
  name: z.string().describe('Application name to search for (substring match)')
});

const queryByPublisherSchema = z.object({
  publisherName: z.string().describe('Publisher name to search for (substring match)')
});

const complexQuerySchema = z.object({
  conditions: z.array(z.object({
    field: z.string().describe('Field name'),
    operator: z.enum(['has', 'eq']).describe('Operator type'),
    value: z.union([z.string(), z.boolean(), z.number()]).describe('Value to match')
  })).describe('Array of query conditions')
});

export const QueryHelpersTools = {
  /**
   * Validates query syntax and field support
   */
  validateQuery: {
    name: 'validateQuery',
    schema: validateQuerySchema,
    handler: async (params: { query: string }) => {
      const validation = validateQuery(params.query);
      return { 
        content: [{ 
          type: 'text' as const, 
          text: JSON.stringify(validation) 
        }] 
      };
    }
  },

  /**
   * Builds a query to find apps by name
   */
  queryByName: {
    name: 'queryByName',
    schema: queryByNameSchema,
    handler: async (params: { name: string }) => {
      const query = QueryHelpers.byName(params.name);
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Builds a query to find apps by publisher
   */
  queryByPublisher: {
    name: 'queryByPublisher',
    schema: queryByPublisherSchema,
    handler: async (params: { publisherName: string }) => {
      const query = QueryHelpers.byPublisher(params.publisherName);
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Finds all reachable apps
   */
  getReachableApps: {
    name: 'getReachableApps',
    schema: z.object({}),
    handler: async () => {
      const query = QueryHelpers.reachableApps();
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Finds all clientless apps
   */
  getClientlessApps: {
    name: 'getClientlessApps',
    schema: z.object({}),
    handler: async () => {
      const query = QueryHelpers.clientlessApps();
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Finds apps using publisher DNS
   */
  getAppsUsingPublisherDns: {
    name: 'getAppsUsingPublisherDns',
    schema: z.object({}),
    handler: async () => {
      const query = QueryHelpers.usingPublisherDns();
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Finds reachable clientless HTTPS apps
   */
  getReachableClientlessHttps: {
    name: 'getReachableClientlessHttps',
    schema: z.object({}),
    handler: async () => {
      const query = QueryHelpers.reachableClientlessHttps();
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Builds a complex query from multiple conditions
   */
  buildComplexQuery: {
    name: 'buildComplexQuery',
    schema: complexQuerySchema,
    handler: async (params: { 
      conditions: Array<{
        field: string;
        operator: 'has' | 'eq';
        value: string | boolean | number;
      }> 
    }) => {
      const { buildQueryFromConditions } = await import('../utils/query-builder.js');
      const query = buildQueryFromConditions(params.conditions);
      const result = await PrivateAppsTools.list.handler({ query });
      return result;
    }
  },

  /**
   * Parses an existing query to show its structure
   */
  parseQuery: {
    name: 'parseQuery',
    schema: validateQuerySchema,
    handler: async (params: { query: string }) => {
      try {
        const conditions = parseQuery(params.query);
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({ 
              success: true, 
              conditions,
              summary: `Found ${conditions.length} conditions`
            }) 
          }] 
        };
      } catch (error) {
        return { 
          content: [{ 
            type: 'text' as const, 
            text: JSON.stringify({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Parse error'
            }) 
          }] 
        };
      }
    }
  }
};

/**
 * Extended query examples for documentation
 */
export const QUERY_EXAMPLES = {
  // Basic field searches
  findByName: 'app_name has DC1-W2K22',
  findByPublisher: 'publisher_name has VPC_AWS',
  findReachable: 'reachable eq true',
  findClientless: 'clientless_access eq true',
  findWithPublisherDns: 'use_publisher_dns eq true',
  findByHost: 'host has 172.20',
  findHttpsApps: 'private_app_protocol eq https',
  
  // Complex combinations
  reachableClientless: 'reachable eq true and clientless_access eq true',
  httpsWithSpecificHost: 'private_app_protocol eq https and host has 172.20.3',
  unreachableApps: 'reachable eq false',
  appsInSteeringAndPolicy: 'in_steering eq true and in_policy eq true',
  
  // Multi-field searches
  complexSearch: 'app_name has DC1 and publisher_name has VPC and reachable eq true and clientless_access eq false',
  infraApps: 'app_name has MGMT and use_publisher_dns eq true and reachable eq true'
};