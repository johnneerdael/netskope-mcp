# Schema System Architecture

## Overview

The MCP server uses a comprehensive schema system built on Zod for type safety, validation, and API contract enforcement. This system ensures data integrity throughout the entire request-response lifecycle.

## Core Schema Design

### Base Schema Patterns

```typescript
// Common base types
const IdSchema = z.string().min(1);
const UuidSchema = z.string().uuid();
const DisplayNameSchema = z.string().min(1).max(64);
const TimestampSchema = z.string().datetime();

// Pagination schemas
const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional()
});

// Response wrapper
const ApiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
  z.object({
    data: dataSchema,
    status: z.literal('success'),
    message: z.string().optional(),
    pagination: PaginationSchema.optional()
  });
```

### Schema Categories

The schema system is organized into logical categories:

```typescript
// Location: src/types/schemas/
├── api.schemas.ts           // Base API types and responses
├── common.schemas.ts        // Shared common schemas
├── publisher.schemas.ts     // Publisher-related schemas
├── private-apps.schemas.ts  // Private application schemas
├── policy.schemas.ts        // Policy and access control
├── local-broker.schemas.ts  // Local broker configuration
├── upgrade-profiles.schemas.ts // Update scheduling
├── steering.schemas.ts      // Traffic routing
├── alerts.schemas.ts        // Event notifications
└── validation.schemas.ts    // Compliance checking
```

## Publisher Schemas

### Publisher Entity

```typescript
export const PublisherSchema = z.object({
  id: z.string(),
  name: DisplayNameSchema,
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  status: z.enum(['active', 'inactive', 'upgrading', 'error']),
  location: z.object({
    country: z.string().length(2),
    region: z.string(),
    datacenter: z.string().optional()
  }),
  network: z.object({
    private_ip: z.string().ip(),
    public_ip: z.string().ip(),
    interfaces: z.array(NetworkInterfaceSchema)
  }),
  metadata: z.object({
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
    last_seen: TimestampSchema.optional(),
    upgrade_profile_id: UuidSchema.optional()
  })
});

export const NetworkInterfaceSchema = z.object({
  name: z.string(),
  type: z.enum(['ethernet', 'wifi', 'vpn']),
  ip_address: z.string().ip(),
  subnet_mask: z.string(),
  gateway: z.string().ip().optional(),
  mtu: z.number().min(576).max(9000).default(1500)
});
```

### Publisher Operations

```typescript
export const CreatePublisherSchema = z.object({
  name: DisplayNameSchema,
  description: z.string().max(255).optional(),
  location: z.object({
    country: z.string().length(2),
    region: z.string(),
    datacenter: z.string().optional()
  }),
  network_config: z.object({
    private_ip: z.string().ip(),
    interfaces: z.array(NetworkInterfaceSchema).min(1)
  }),
  upgrade_profile_id: UuidSchema.optional()
});

export const UpdatePublisherSchema = CreatePublisherSchema.partial().extend({
  enabled: z.boolean().optional()
});

export const BulkUpgradePublishersSchema = z.object({
  publisher_ids: z.array(IdSchema).min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  schedule: z.object({
    start_time: TimestampSchema,
    maintenance_window_hours: z.number().min(1).max(24).default(4)
  }).optional()
});
```

## Private Application Schemas

### Application Entity

```typescript
export const PrivateAppSchema = z.object({
  id: UuidSchema,
  app_name: DisplayNameSchema,
  host: z.string().url().or(z.string().regex(/^[\w\-\.]+$/)),
  enabled: z.boolean().default(true),
  
  // Protocol configuration
  protocols: z.array(ProtocolSchema).min(1),
  
  // Access control
  clientless_access: z.boolean().default(false),
  trust_untrusted_certificate: z.boolean().default(false),
  
  // Publisher associations
  publisher_sets: z.array(PublisherSetSchema),
  
  // Organizational
  tags: z.array(TagSchema).default([]),
  category: z.string().optional(),
  
  // Metadata
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

export const ProtocolSchema = z.object({
  type: z.enum(['tcp', 'udp', 'icmp']),
  port: z.union([
    z.string().regex(/^\d+$/),                    // Single port: "80"
    z.string().regex(/^\d+-\d+$/),                // Range: "8000-8080"
    z.string().regex(/^\d+(,\d+)*$/),            // Multiple: "80,443,8080"
    z.literal('any')                              // Any port
  ])
});

export const PublisherSetSchema = z.object({
  publisher_id: IdSchema,
  publisher_name: DisplayNameSchema.optional(),
  backup_publisher_id: IdSchema.optional()
});
```

### Application Operations

```typescript
export const CreatePrivateAppSchema = z.object({
  app_name: DisplayNameSchema
    .refine(name => !/[<>:"/\\|?*]/.test(name), 
            'App name contains invalid characters'),
  
  host: z.string()
    .refine(host => {
      // Validate FQDN or IP
      const fqdnRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return fqdnRegex.test(host) || ipRegex.test(host);
    }, 'Invalid host format'),
  
  protocols: z.array(ProtocolSchema).min(1).max(10),
  
  clientless_access: z.boolean().default(false),
  trust_untrusted_certificate: z.boolean().default(false),
  
  // Optional categorization
  tags: z.array(z.string()).max(20).default([]),
  category: z.string().max(50).optional(),
  description: z.string().max(500).optional()
});

export const UpdatePrivateAppSchema = z.object({
  app_name: DisplayNameSchema.optional(),
  host: z.string().optional(),
  enabled: z.boolean().optional(),
  protocols: z.array(ProtocolSchema).optional(),
  clientless_access: z.boolean().optional(),
  trust_untrusted_certificate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional()
});

export const CreatePrivateAppTagsSchema = z.object({
  app_id: UuidSchema,
  tags: z.array(z.object({
    key: z.string().min(1).max(50),
    value: z.string().min(1).max(200)
  })).min(1).max(20)
});

export const PatchPrivateAppTagsSchema = z.object({
  tag_updates: z.array(z.object({
    app_id: UuidSchema,
    tags: z.array(z.object({
      key: z.string().min(1).max(50),
      value: z.string().min(1).max(200),
      operation: z.enum(['add', 'update', 'remove']).default('add')
    }))
  })).min(1).max(100)
});
```

## Policy Schemas

### Policy Group

```typescript
export const PolicyGroupSchema = z.object({
  id: UuidSchema,
  name: DisplayNameSchema,
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  
  // Member configuration
  members: z.object({
    users: z.array(z.string()).default([]),
    groups: z.array(z.string()).default([])
  }),
  
  // Settings
  policy_order: z.number().min(1).max(1000).default(100),
  
  // Metadata
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

export const CreatePolicyGroupSchema = z.object({
  name: DisplayNameSchema
    .refine(name => !/[<>:"/\\|?*]/.test(name), 
            'Policy group name contains invalid characters'),
  
  description: z.string().max(500).optional(),
  
  members: z.object({
    users: z.array(z.string().email().or(z.string().min(1))).default([]),
    groups: z.array(z.string().min(1)).default([])
  }).refine(
    members => members.users.length > 0 || members.groups.length > 0,
    'Policy group must have at least one user or group'
  ),
  
  policy_order: z.number().min(1).max(1000).default(100)
});
```

### Policy Rules

```typescript
export const PolicyRuleSchema = z.object({
  id: UuidSchema,
  name: DisplayNameSchema,
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  
  // Rule configuration - Netskope API format
  policy: z.object({
    ruleId: z.number().optional(),
    ruleName: z.string(),
    description: z.string().optional(),
    
    // Applications (uses display names, not IDs)
    privateApps: z.array(z.string()).min(1),
    
    // Users and groups (validated through SCIM)
    users: z.array(z.string()).default([]),
    groups: z.array(z.string()).default([]),
    
    // Access control
    action: z.enum(['allow', 'block']).default('allow'),
    
    // Advanced settings
    settings: z.object({
      userNotification: z.boolean().default(true),
      logTraffic: z.boolean().default(true),
      bypassTraffic: z.boolean().default(false)
    }).optional()
  }),
  
  // Rule metadata
  policy_order: z.number().min(1).max(10000).default(1000),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

export const CreatePolicyRuleSchema = z.object({
  name: DisplayNameSchema,
  description: z.string().max(500).optional(),
  
  // Application selection (display names)
  private_app_names: z.array(z.string().min(1)).min(1)
    .refine(async (names) => {
      // Validate app names exist (this would be called during processing)
      return true;
    }),
  
  // User/group selection (display names)
  user_names: z.array(z.string()).default([]),
  group_names: z.array(z.string()).default([]),
  
  // Access control
  action: z.enum(['allow', 'block']).default('allow'),
  
  // Optional settings
  user_notification: z.boolean().default(true),
  log_traffic: z.boolean().default(true),
  bypass_traffic: z.boolean().default(false),
  
  policy_order: z.number().min(1).max(10000).default(1000)
});
```

## Validation Schemas

### SCIM Integration

```typescript
export const ScimUserSchema = z.object({
  id: UuidSchema,
  userName: z.string(),
  displayName: z.string(),
  emails: z.array(z.object({
    value: z.string().email(),
    primary: z.boolean().default(false)
  })),
  active: z.boolean(),
  groups: z.array(z.object({
    value: UuidSchema,
    display: z.string()
  })).default([])
});

export const ScimGroupSchema = z.object({
  id: UuidSchema,
  displayName: z.string(),
  members: z.array(z.object({
    value: UuidSchema,
    display: z.string(),
    type: z.enum(['User', 'Group'])
  })).default([])
});

export const ValidateScimEntitiesSchema = z.object({
  user_names: z.array(z.string()).default([]),
  group_names: z.array(z.string()).default([])
});
```

### Resource Validation

```typescript
export const ValidateResourceNameSchema = z.object({
  name: z.string().min(1).max(64),
  resource_type: z.enum([
    'publisher',
    'private_app', 
    'policy_group',
    'policy_rule',
    'local_broker',
    'upgrade_profile'
  ])
});

export const ComplianceCheckSchema = z.object({
  resource_id: IdSchema,
  resource_type: z.enum(['publisher', 'private_app', 'policy_group']),
  checks: z.array(z.enum([
    'naming_convention',
    'security_settings',
    'network_configuration',
    'access_controls',
    'metadata_completeness'
  ])).min(1)
});
```

## Schema Utilities

### Transform Utilities

```typescript
// Convert between display names and UUIDs
export const transformPolicyRuleForApi = (
  input: z.infer<typeof CreatePolicyRuleSchema>,
  appNameToIdMap: Map<string, string>,
  userNameToIdMap: Map<string, string>,
  groupNameToIdMap: Map<string, string>
): PolicyRuleApiFormat => {
  return {
    ruleName: input.name,
    description: input.description,
    privateApps: input.private_app_names, // Netskope uses display names
    users: input.user_names,              // Netskope uses display names
    groups: input.group_names,            // Netskope uses display names
    action: input.action,
    settings: {
      userNotification: input.user_notification,
      logTraffic: input.log_traffic,
      bypassTraffic: input.bypass_traffic
    }
  };
};

// Extract IDs from MCP parameter objects
export const extractIdFromParams = (params: any): string => {
  if (typeof params === 'string') return params;
  if (typeof params === 'object' && params !== null) {
    return params.id || params.publisher_id || params.app_id || 
           Object.values(params)[0] as string;
  }
  throw new Error('Unable to extract ID from parameters');
};
```

### Validation Helpers

```typescript
// Custom refinement functions
export const validateCronExpression = (cron: string): boolean => {
  const cronRegex = /^(\*|([0-9]|[1-5][0-9])|\*\/[0-9]+) (\*|([0-9]|1[0-9]|2[0-3])|\*\/[0-9]+) (\*|([1-9]|[12][0-9]|3[01])|\*\/[0-9]+) (\*|([1-9]|1[0-2])|\*\/[0-9]+) (\*|[0-6]|\*\/[0-9]+)$/;
  return cronRegex.test(cron);
};

export const validateNetworkPort = (port: string): boolean => {
  if (port === 'any') return true;
  
  // Single port
  if (/^\d+$/.test(port)) {
    const portNum = parseInt(port);
    return portNum >= 1 && portNum <= 65535;
  }
  
  // Port range
  if (/^\d+-\d+$/.test(port)) {
    const [start, end] = port.split('-').map(Number);
    return start >= 1 && end <= 65535 && start < end;
  }
  
  // Multiple ports
  if (/^\d+(,\d+)*$/.test(port)) {
    return port.split(',').every(p => {
      const portNum = parseInt(p);
      return portNum >= 1 && portNum <= 65535;
    });
  }
  
  return false;
};

// Schema composition
export const createListResponseSchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.object({
    data: z.array(itemSchema),
    pagination: PaginationSchema.optional(),
    total: z.number().optional()
  });

export const createErrorResponseSchema = () =>
  z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional()
    }),
    status: z.literal('error'),
    timestamp: TimestampSchema
  });
```

## Schema Testing

### Test Utilities

```typescript
// Schema test helpers
export const createMockPublisher = (overrides?: Partial<Publisher>): Publisher => {
  return PublisherSchema.parse({
    id: 'pub-123',
    name: 'Test Publisher',
    enabled: true,
    version: '1.2.3',
    status: 'active',
    location: {
      country: 'US',
      region: 'us-west-2'
    },
    network: {
      private_ip: '10.0.1.100',
      public_ip: '203.0.113.1',
      interfaces: [{
        name: 'eth0',
        type: 'ethernet',
        ip_address: '10.0.1.100',
        subnet_mask: '255.255.255.0'
      }]
    },
    metadata: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    ...overrides
  });
};

export const validateSchemaAgainstApi = async (
  schema: z.ZodSchema,
  apiEndpoint: string,
  sampleData: any
): Promise<boolean> => {
  try {
    const result = schema.parse(sampleData);
    return true;
  } catch (error) {
    console.error(`Schema validation failed for ${apiEndpoint}:`, error);
    return false;
  }
};
```

## Error Handling

### Schema Validation Errors

```typescript
export class SchemaValidationError extends Error {
  constructor(
    public schema: string,
    public field: string,
    public value: unknown,
    public reason: string
  ) {
    super(`Schema validation failed for ${schema}.${field}: ${reason}`);
    this.name = 'SchemaValidationError';
  }
}

export const handleSchemaError = (error: z.ZodError, schemaName: string): never => {
  const firstError = error.errors[0];
  throw new SchemaValidationError(
    schemaName,
    firstError.path.join('.'),
    firstError.received,
    firstError.message
  );
};
```

## Best Practices

### Schema Design Principles

1. **Immutable Schemas**: Never modify existing schemas, create new versions
2. **Strict Validation**: Use strict validation for inputs, loose for outputs
3. **Clear Error Messages**: Provide actionable error messages
4. **Type Safety**: Leverage TypeScript inference for type safety
5. **Composition**: Build complex schemas from smaller, reusable components

### Performance Considerations

```typescript
// Pre-compile schemas for better performance
const compiledSchemas = {
  CreatePublisher: CreatePublisherSchema,
  UpdatePublisher: UpdatePublisherSchema,
  CreatePrivateApp: CreatePrivateAppSchema,
  CreatePolicyRule: CreatePolicyRuleSchema
} as const;

// Use schema caching for frequently validated schemas
const schemaCache = new Map<string, z.ZodSchema>();

export const getCachedSchema = (schemaKey: string): z.ZodSchema => {
  if (!schemaCache.has(schemaKey)) {
    schemaCache.set(schemaKey, compiledSchemas[schemaKey]);
  }
  return schemaCache.get(schemaKey)!;
};
```

---

This schema system ensures type safety, data validation, and API contract compliance throughout the entire MCP server ecosystem.
