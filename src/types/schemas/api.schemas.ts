import * as z from 'zod';

// Generic API Response Types
export const baseResponseSchema = <T extends z.ZodType>(dataSchema: T) => z.object({
  status: z.enum(['success', 'error', 'not found']).describe('Response status'),
  data: dataSchema.optional().describe('Response data payload'),
  message: z.string().optional().describe('Optional status message'),
  total: z.number().optional().describe('Total count for paginated results')
}).describe('Base response structure for API endpoints');

// Standard Request Parameters
export const paginationParamsSchema = z.object({
  page: z.number().optional().describe('Page number for pagination'),
  limit: z.number().optional().describe('Number of items per page'),
  sort: z.string().optional().describe('Field to sort by'),
  order: z.enum(['asc', 'desc']).optional().describe('Sort order direction')
}).describe('Common pagination parameters');

export const searchParamsSchema = z.object({
  query: z.string().optional().describe('Search query string'),
  fields: z.array(z.string()).optional().describe('Fields to include in search')
}).describe('Common search parameters');

// HTTP Method Type
export const httpMethodSchema = z.enum([
  'GET',      // Retrieve resource
  'POST',     // Create resource
  'PUT',      // Update/Replace resource
  'PATCH',    // Partial update
  'DELETE'    // Remove resource
]).describe('Supported HTTP methods');

// Error Handling
export const apiErrorSchema = z.object({
  code: z.number().describe('Error code'),
  message: z.string().describe('Error message'),
  details: z.any().optional().describe('Additional error details')
}).describe('API error response structure');

// Type Exports
export type BaseResponse<T> = z.infer<ReturnType<typeof baseResponseSchema<z.ZodType<T>>>>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type HttpMethod = z.infer<typeof httpMethodSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

// Utility Types
export type CrudOperations<T, CreateDTO, UpdateDTO> = {
  list: (params?: PaginationParams & SearchParams) => Promise<BaseResponse<T[]>>;
  get: (id: string | number) => Promise<BaseResponse<T>>;
  create: (data: CreateDTO) => Promise<BaseResponse<T>>;
  update: (id: string | number, data: UpdateDTO) => Promise<BaseResponse<T>>;
  delete: (id: string | number) => Promise<BaseResponse<void>>;
};
