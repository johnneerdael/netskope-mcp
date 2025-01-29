import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { resolveResourceId, validateResourceExists, ResourceResolutionOptions } from '../../utils/id-resolver.js';

/**
 * Base interface for handler responses
 */
export interface HandlerResponse<T> {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  data?: T;
}

/**
 * Base interface for handlers
 */
export interface ResourceHandler<T> {
  handler: (params?: T) => Promise<HandlerResponse<any>>;
  schema?: any;
}

/**
 * Base interface for resource handlers
 */
export interface ResourceHandlers<T, C, U> {
  list: ResourceHandler<void>;
  get?: ResourceHandler<{ id: number }>;
  create?: ResourceHandler<C>;
  update?: ResourceHandler<U>;
  delete?: ResourceHandler<{ id: number }>;
}

/**
 * Base class for resource commands that handles common ID resolution patterns
 * @template T The resource type
 * @template R The list response type
 * @template C The create request type
 * @template U The update request type
 */
export abstract class ResourceCommand<T extends Record<string, any>, R, C, U> {
  protected constructor(
    protected readonly resourceType: string,
    protected readonly handlers: ResourceHandlers<T, C, U>,
    protected readonly resolutionOptions?: ResourceResolutionOptions
  ) {}

  /**
   * Parse handler response
   */
  protected parseResponse<X>(response: HandlerResponse<X>): X {
    return JSON.parse(response.content[0].text);
  }

  /**
   * Extract data from response based on resource type
   */
  protected abstract extractListData(response: R): T[];

  /**
   * Lists all resources
   */
  async list(): Promise<T[]> {
    const result = await this.handlers.list.handler();
    const response = this.parseResponse<R>(result);
    return this.extractListData(response);
  }

  /**
   * Gets a resource by ID or name
   */
  async get(identifier: string | number): Promise<T> {
    if (!this.handlers.get) {
      throw new McpError(405, `Get operation not supported for ${this.resourceType}`);
    }

    // Resolve the ID first
    const resource = await resolveResourceId(
      this.list.bind(this),
      identifier,
      this.resolutionOptions
    );

    const result = await this.handlers.get.handler({ id: resource.id });
    const response = this.parseResponse(result);
    return response.data;
  }

  /**
   * Creates a new resource
   */
  async create(data: C): Promise<T> {
    if (!this.handlers.create) {
      throw new McpError(
        405,
        `Create operation not supported for ${this.resourceType}`
      );
    }

    const result = await this.handlers.create.handler(data);
    const response = this.parseResponse(result);
    return response.data;
  }

  /**
   * Updates an existing resource
   */
  async update(identifier: string | number, data: U): Promise<T> {
    if (!this.handlers.update) {
      throw new McpError(
        405,
        `Update operation not supported for ${this.resourceType}`
      );
    }

    // Resolve the resource first to get its ID
    const resource = await resolveResourceId(
      this.list.bind(this),
      identifier,
      this.resolutionOptions
    );

    const result = await this.handlers.update.handler({
      ...data,
      id: resource.id
    } as U);

    const response = this.parseResponse(result);
    return response.data;
  }

  /**
   * Deletes a resource
   */
  async delete(identifier: string | number): Promise<void> {
    if (!this.handlers.delete) {
      throw new McpError(
        405,
        `Delete operation not supported for ${this.resourceType}`
      );
    }

    // Resolve the resource first to get its ID
    const resource = await resolveResourceId(
      this.list.bind(this),
      identifier,
      this.resolutionOptions
    );

    await this.handlers.delete.handler({ id: resource.id });
  }

  /**
   * Validates that a resource exists
   */
  async validateExists(identifier: string | number): Promise<void> {
    await validateResourceExists(
      this.resourceType,
      this.list.bind(this),
      identifier,
      this.resolutionOptions
    );
  }

  /**
   * Checks if a resource exists
   */
  async exists(identifier: string | number): Promise<boolean> {
    try {
      await this.validateExists(identifier);
      return true;
    } catch (error) {
      if (error instanceof McpError && error.code === 404) {
        return false;
      }
      throw error;
    }
  }
}
