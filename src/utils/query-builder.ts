/**
 * Query builder utility for Netskope private apps search
 * Supports advanced filtering with operators: has, eq, and logical 'and' combinations
 */

export interface QueryCondition {
  field: string;
  operator: 'has' | 'eq';
  value: string | boolean | number;
}

export interface QueryOptions {
  app_name?: string;
  publisher_name?: string;
  reachable?: boolean;
  clientless_access?: boolean;
  use_publisher_dns?: boolean;
  host?: string;
  in_steering?: boolean;
  in_policy?: boolean;
  private_app_protocol?: string;
}

/**
 * Supported filterable fields for private apps
 */
export const FILTERABLE_FIELDS = {
  app_name: 'string',
  publisher_name: 'string',
  reachable: 'boolean',
  clientless_access: 'boolean',
  use_publisher_dns: 'boolean',
  host: 'string',
  in_steering: 'boolean',
  in_policy: 'boolean',
  private_app_protocol: 'string'
} as const;

/**
 * Supported operators for filtering
 */
export const OPERATORS = {
  has: 'substring matching',
  eq: 'exact matching'
} as const;

/**
 * Builds a query string from filter options
 * Automatically determines appropriate operators based on field types
 */
export function buildQuery(options: QueryOptions): string {
  const conditions: string[] = [];

  // Process each field in the options
  Object.entries(options).forEach(([field, value]) => {
    if (value === undefined || value === null) return;

    // Validate field is supported
    if (!(field in FILTERABLE_FIELDS)) {
      throw new Error(`Unsupported field: ${field}. Supported fields: ${Object.keys(FILTERABLE_FIELDS).join(', ')}`);
    }

    const fieldType = FILTERABLE_FIELDS[field as keyof typeof FILTERABLE_FIELDS];
    
    // Determine operator based on field type and value
    let operator: 'has' | 'eq';
    let formattedValue: string;

    if (fieldType === 'boolean' || typeof value === 'boolean') {
      // Boolean fields always use 'eq' operator
      operator = 'eq';
      formattedValue = value.toString().toLowerCase();
    } else if (typeof value === 'string') {
      // String fields use 'has' for substring matching by default
      // Use 'eq' if the value appears to be an exact match (no special chars)
      operator = 'has';
      formattedValue = value;
    } else if (typeof value === 'number') {
      operator = 'eq';
      formattedValue = value.toString();
    } else {
      // Fallback
      operator = 'has';
      formattedValue = String(value);
    }

    conditions.push(`${field} ${operator} ${formattedValue}`);
  });

  return conditions.join(' and ');
}

/**
 * Builds a query string from explicit conditions
 * Provides fine-grained control over operators
 */
export function buildQueryFromConditions(conditions: QueryCondition[]): string {
  const queryParts: string[] = [];

  conditions.forEach(({ field, operator, value }) => {
    // Validate field
    if (!(field in FILTERABLE_FIELDS)) {
      throw new Error(`Unsupported field: ${field}. Supported fields: ${Object.keys(FILTERABLE_FIELDS).join(', ')}`);
    }

    // Validate operator
    if (!(operator in OPERATORS)) {
      throw new Error(`Unsupported operator: ${operator}. Supported operators: ${Object.keys(OPERATORS).join(', ')}`);
    }

    let formattedValue: string;
    if (typeof value === 'boolean') {
      formattedValue = value.toString().toLowerCase();
    } else {
      formattedValue = String(value);
    }

    queryParts.push(`${field} ${operator} ${formattedValue}`);
  });

  return queryParts.join(' and ');
}

/**
 * Parses a query string into structured conditions
 * Useful for validating and analyzing existing queries
 */
export function parseQuery(queryString: string): QueryCondition[] {
  if (!queryString.trim()) return [];

  const conditions: QueryCondition[] = [];
  
  // Split by 'and' (case insensitive)
  const parts = queryString.split(/\s+and\s+/i);
  
  parts.forEach(part => {
    const trimmed = part.trim();
    
    // Match pattern: field operator value
    const match = trimmed.match(/^(\w+)\s+(has|eq)\s+(.+)$/i);
    
    if (!match) {
      throw new Error(`Invalid query condition: "${trimmed}". Expected format: "field operator value"`);
    }

    const [, field, operator, valueStr] = match;
    
    // Parse value based on field type
    let value: string | boolean | number = valueStr;
    
    if (field in FILTERABLE_FIELDS) {
      const fieldType = FILTERABLE_FIELDS[field as keyof typeof FILTERABLE_FIELDS];
      
      if (fieldType === 'boolean') {
        const lowerValue = valueStr.toLowerCase();
        if (lowerValue === 'true' || lowerValue === 'yes') {
          value = true;
        } else if (lowerValue === 'false' || lowerValue === 'no') {
          value = false;
        } else {
          throw new Error(`Invalid boolean value for field ${field}: "${valueStr}". Use: true, false, yes, or no`);
        }
      }
    }

    conditions.push({
      field,
      operator: operator.toLowerCase() as 'has' | 'eq',
      value
    });
  });

  return conditions;
}

/**
 * Validates a query string for syntax and field support
 */
export function validateQuery(queryString: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const conditions = parseQuery(queryString);
    
    conditions.forEach(({ field, operator, value }) => {
      // Validate field
      if (!(field in FILTERABLE_FIELDS)) {
        errors.push(`Unsupported field: ${field}`);
      }
      
      // Validate operator
      if (!(operator in OPERATORS)) {
        errors.push(`Unsupported operator: ${operator}`);
      }
      
      // Validate value type matches field
      if (field in FILTERABLE_FIELDS) {
        const fieldType = FILTERABLE_FIELDS[field as keyof typeof FILTERABLE_FIELDS];
        
        if (fieldType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field ${field} expects boolean value, got: ${typeof value}`);
        }
      }
    });
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Parse error');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to create common queries
 */
export const QueryHelpers = {
  /**
   * Find apps by name (substring match)
   */
  byName: (name: string): string => buildQuery({ app_name: name }),

  /**
   * Find apps by publisher (substring match)
   */
  byPublisher: (publisherName: string): string => buildQuery({ publisher_name: publisherName }),

  /**
   * Find reachable apps
   */
  reachableApps: (): string => buildQuery({ reachable: true }),

  /**
   * Find clientless apps
   */
  clientlessApps: (): string => buildQuery({ clientless_access: true }),

  /**
   * Find apps using publisher DNS
   */
  usingPublisherDns: (): string => buildQuery({ use_publisher_dns: true }),

  /**
   * Find apps by host (substring match)
   */
  byHost: (host: string): string => buildQuery({ host }),

  /**
   * Find apps by protocol
   */
  byProtocol: (protocol: string): string => buildQuery({ private_app_protocol: protocol }),

  /**
   * Complex query: reachable clientless HTTPS apps
   */
  reachableClientlessHttps: (): string => buildQuery({
    reachable: true,
    clientless_access: true,
    private_app_protocol: 'https'
  }),

  /**
   * Complex query: unreachable apps with specific host pattern
   */
  unreachableByHost: (hostPattern: string): string => buildQuery({
    reachable: false,
    host: hostPattern
  })
};

/**
 * URL-encodes a query string for use in API requests
 */
export function encodeQuery(queryString: string): string {
  return encodeURIComponent(queryString);
}