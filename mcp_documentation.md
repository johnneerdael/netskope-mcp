# Netskope MCP Server Documentation

## Overview

A Model Context Protocol (MCP) server for managing Netskope Network Private Access (NPA) infrastructure through Large Language Models (LLMs). This server provides comprehensive access to Netskope's Zero Trust Network Access (ZTNA) platform via structured tools and APIs.

**Version:** 5.2.1  
**Package:** `@johnneerdael/netskope-mcp`  
**Author:** John Neerdael  
**License:** ISC  

## Project Structure

```
netskope-mcp/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── index.ts                  # Main server entry
│   ├── mcp.ts                    # MCP server implementation
│   ├── server.ts                 # Server setup and configuration
│   ├── commands/                 # CLI command implementations
│   │   ├── alerts/
│   │   ├── base/
│   │   ├── local-broker/
│   │   ├── policy/
│   │   ├── private-apps/
│   │   ├── publishers/
│   │   ├── steering/
│   │   ├── upgrade/
│   │   └── validation/
│   ├── config/
│   │   └── netskope-config.ts    # API configuration and client
│   ├── tools/                    # MCP tool implementations
│   │   ├── alerts.ts
│   │   ├── local-broker.ts
│   │   ├── policy.ts
│   │   ├── private-apps.ts
│   │   ├── publishers.ts
│   │   ├── steering.ts
│   │   ├── upgrade-profiles.ts
│   │   └── validation.ts
│   ├── types/                    # Type definitions and schemas
│   │   ├── schedule.ts
│   │   └── schemas/
│   │       ├── alerts.schemas.ts
│   │       ├── api.schemas.ts
│   │       ├── common.schemas.ts
│   │       ├── local-broker.schemas.ts
│   │       ├── policy.schemas.ts
│   │       ├── private-apps.schemas.ts
│   │       ├── publisher.schemas.ts
│   │       ├── steering.schemas.ts
│   │       ├── upgrade-profiles.schemas.ts
│   │       └── validation.schemas.ts
│   ├── utils/
│   │   ├── cron.ts               # Cron/schedule utilities
│   │   └── id-resolver.ts        # ID resolution utilities
│   └── examples/                 # Usage examples
├── dist/                         # Compiled JavaScript output
├── swagger.json                  # API schema definitions
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Node.js package configuration
└── README.md                     # Project documentation
```

## Installation & Setup

### Installation
```bash
npm install @johnneerdael/netskope-mcp
```

### Environment Variables
```bash
NETSKOPE_BASE_URL="https://your-tenant.goskope.com"
NETSKOPE_API_KEY="your-api-token"
```

### MCP Configuration
```json
{
  "mcpServers": {
    "netskope-mcp": {
      "command": "npx",
      "args": ["-y", "@johnneerdael/netskope-mcp"],
      "env": {
        "NETSKOPE_BASE_URL": "https://your-tenant.goskope.com",
        "NETSKOPE_API_KEY": "your-token"
      }
    }
  }
}
```

## Core Components

### 1. API Configuration (`src/config/netskope-config.ts`)
- Manages Netskope API authentication and base URL configuration
- Provides centralized HTTP client with retry logic
- Handles API error responses and rate limiting

### 2. MCP Tools (`src/tools/`)
Each tool file implements specific Netskope functionality:

#### **AlertsTools** (`alerts.ts`)
- `getAlertConfig`: Retrieve alert configuration settings
- `updateAlertConfig`: Update notification preferences for events

#### **LocalBrokerTools** (`local-broker.ts`)
- `listLocalBrokers`: List all local broker instances
- `createLocalBroker`: Create new local broker
- `getLocalBroker`: Get specific broker details
- `updateLocalBroker`: Update broker configuration
- `deleteLocalBroker`: Remove broker instance
- `getLocalBrokerConfig`: Get global broker configuration
- `updateLocalBrokerConfig`: Update global broker settings
- `generateLocalBrokerRegistrationToken`: Generate broker registration token

#### **PolicyTools** (`policy.ts`)
- `listPolicyRules`: List all access policy rules
- `getPolicyRule`: Get specific policy rule details
- `createPolicyRule`: Create new access policy rule
- `updatePolicyRule`: Update existing policy rule
- `deletePolicyRule`: Remove policy rule

#### **PrivateAppsTools** (`private-apps.ts`)
- `createPrivateApp`: Create new private application
- `updatePrivateApp`: Update application configuration
- `deletePrivateApp`: Remove private application
- `getPrivateApp`: Get application details
- `listPrivateApps`: List all private applications
- `listPrivateAppTags`: List application tags
- `createPrivateAppTags`: Create application tags
- `updatePrivateAppTags`: Update application tags
- `updatePrivateAppPublishers`: Update publisher associations
- `removePrivateAppPublishers`: Remove publisher associations
- `getDiscoverySettings`: Get discovery configuration
- `getPolicyInUse`: Get active policies for applications

#### **PublishersTools** (`publishers.ts`)
- `listPublishers`: List all publisher instances
- `getPublisher`: Get specific publisher details
- `createPublisher`: Create new publisher
- `updatePublisher`: Update publisher configuration
- `deletePublisher`: Remove publisher
- `bulkUpgradePublishers`: Upgrade multiple publishers
- `getReleases`: Get available publisher releases
- `getPrivateApps`: Get apps associated with publisher
- `generatePublisherRegistrationToken`: Generate registration token

#### **SteeringTools** (`steering.ts`)
- `updatePublisherAssociation`: Update app-publisher associations
- `deletePublisherAssociation`: Remove app-publisher associations
- `getUserDiagnostics`: Get user access diagnostics
- `getDeviceDiagnostics`: Get device access diagnostics

#### **UpgradeProfileTools** (`upgrade-profiles.ts`)
- `listUpgradeProfiles`: List all upgrade profiles
- `getUpgradeProfile`: Get specific upgrade profile
- `createUpgradeProfile`: Create new upgrade profile
- `updateUpgradeProfile`: Update upgrade profile
- `deleteUpgradeProfile`: Remove upgrade profile
- `upgradeProfileSchedule`: Manage upgrade schedules

#### **ValidationTools** (`validation.ts`)
- `validateName`: Validate resource names
- `validateResource`: Validate resource configurations
- `searchResources`: Search for resources

### 3. Schema Definitions (`src/types/schemas/`)
Comprehensive Zod schemas for:
- **Request validation**: Ensure proper input format
- **Response validation**: Type-safe API responses
- **Data transformation**: Convert between MCP and API formats

### 4. API Transformations
The MCP server handles format differences between MCP tool parameters and Netskope API expectations:

#### Private App Creation Transform
```typescript
// MCP Input Format
{
  protocols: [{ type: "tcp", port: "80" }],
  trust_self_signed_certs: true
}

// API Output Format
{
  protocols: [{ type: "tcp", ports: ["80"] }],
  isSelfSignedCert: true,
  hostType: "http"  // derived from protocol for clientless apps
}
```

## Key Features

### 1. **Zero Trust Network Access (ZTNA) Management**
- Complete private application lifecycle management
- Publisher deployment and configuration
- Policy-based access controls

### 2. **Automated Operations**
- Bulk publisher upgrades
- Scheduled maintenance profiles
- Alert configuration management

### 3. **Diagnostics & Monitoring**
- User access diagnostics
- Device connectivity troubleshooting
- Publisher health monitoring

### 4. **High Availability Support**
- Local broker configuration
- Multi-publisher application hosting
- Publisher association management

## Data Flow Architecture

```
LLM Request → MCP Tool → Schema Validation → API Transform → Netskope API
                ↓
LLM Response ← Response Transform ← API Response ← Netskope API
```

## Common Usage Patterns

### 1. **Private Application Deployment**
```typescript
// Create TCP application
createPrivateApp({
  app_name: "internal-web-app",
  host: "192.168.1.100", 
  protocols: [{ type: "tcp", port: "80" }],
  clientless_access: false,
  trust_self_signed_certs: true
})

// Create clientless application  
createPrivateApp({
  app_name: "web-portal",
  host: "internal.company.com",
  protocols: [{ type: "tcp", port: "443" }], 
  clientless_access: true,
  app_type: "clientless"
})
```

### 2. **Publisher Management**
```typescript
// List publishers and their status
listPublishers() 

// Create high-availability setup
createPublisher({ name: "datacenter-1-primary" })
createPublisher({ name: "datacenter-1-secondary" })

// Associate apps with multiple publishers
updatePrivateAppPublishers({
  private_app_ids: ["123"],
  publisher_ids: ["456", "789"]
})
```

### 3. **Policy Configuration**
```typescript
// Create access policy
createPolicyRule({
  name: "Engineering Team Access",
  action: "allow",
  conditions: [
    { type: "group", operator: "in", value: ["Engineering"] },
    { type: "private_app", operator: "equals", value: "internal-app" }
  ]
})
```

## Security Considerations

1. **API Token Management**: Store `NETSKOPE_API_KEY` securely
2. **Access Controls**: Use policy rules for least privilege access
3. **Certificate Validation**: Configure `trust_self_signed_certs` appropriately
4. **Network Segmentation**: Use publisher associations for traffic isolation

## Development & Testing

### Build Commands
```bash
npm run build      # Compile TypeScript
npm run dev        # Watch mode development
npm run test       # Run test suite
npm run test:watch # Watch mode testing
```

### Key Dependencies
- `@modelcontextprotocol/sdk`: MCP framework
- `zod`: Schema validation and type safety
- `dotenv`: Environment variable management

## Error Handling

The server implements comprehensive error handling:
- **Schema Validation**: Input/output validation with descriptive errors
- **API Error Mapping**: Netskope API errors mapped to meaningful messages
- **Retry Logic**: Automatic retry for transient failures
- **Type Safety**: Full TypeScript coverage prevents runtime errors

## Extension Points

The architecture supports easy extension:
1. **New Tools**: Add tools in `src/tools/` following existing patterns
2. **New Schemas**: Define schemas in `src/types/schemas/`
3. **Custom Commands**: Add CLI commands in `src/commands/`
4. **Additional APIs**: Extend API client in `src/config/netskope-config.ts`

This documentation provides the foundation for understanding and extending the Netskope MCP server in any new LLM context.