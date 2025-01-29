import { z } from 'zod';

/**
 * Base interface for MCP tool response content
 */
export interface McpToolResponseContent {
  [key: string]: unknown;
  type: 'text';
  text: string;
}

/**
 * Base interface for MCP tool response
 */
export interface McpToolResponse {
  [key: string]: unknown;
  content: McpToolResponseContent[];
  data?: unknown;
  isError?: boolean;
}

/**
 * Base interface for MCP tool
 */
export interface McpTool {
  name: string;
  schema: z.ZodType<any, any>;
  handler: (args: any) => Promise<McpToolResponse>;
}
