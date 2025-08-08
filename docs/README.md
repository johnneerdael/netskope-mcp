# Netskope NPA MCP Server

A comprehensive Model Context Protocol (MCP) server for managing Netskope Private Access (NPA) infrastructure through AI-powered automation.

## Documentation Structure

This documentation is organized into logical sections for easy navigation:

### 🏗️ Core Architecture
- [**Server Architecture**](./architecture/server-architecture.md) - MCP server structure and initialization
- [**API Client**](./architecture/api-client.md) - Netskope API integration patterns
- [**Schema System**](./architecture/schema-system.md) - Zod validation and type safety

### 🛠️ Tool Categories

#### Infrastructure Management
- [**Publisher Tools**](./tools/publisher-tools.md) - Publisher lifecycle, upgrades, and monitoring
- [**Local Broker Tools**](./tools/local-broker-tools.md) - Broker configuration and management
- [**Upgrade Profile Tools**](./tools/upgrade-profile-tools.md) - Automated update scheduling

#### Application Management
- [**Private App Tools**](./tools/private-app-tools.md) - Application creation, configuration, and tagging
- [**Discovery Settings Tools**](./tools/discovery-settings-tools.md) - Application discovery configuration

#### Access Control & Policy
- [**Policy Tools**](./tools/policy-tools.md) - Policy group management and rule creation
- [**SCIM Tools**](./tools/scim-tools.md) - User and group identity management
- [**Steering Tools**](./tools/steering-tools.md) - Publisher-application associations

#### Operations & Monitoring
- [**Alert Tools**](./tools/alert-tools.md) - Event notification configuration
- [**Search Tools**](./tools/search-tools.md) - Resource discovery and querying
- [**Validation Tools**](./tools/validation-tools.md) - Resource validation and compliance

### 🔄 Workflows & Patterns
- [**Common Workflows**](./workflows/common-workflows.md) - Standard automation patterns
- [**Tool Integration Patterns**](./workflows/tool-integration.md) - How tools work together
- [**Error Handling**](./workflows/error-handling.md) - Resilient automation strategies

### 📚 Examples & Guides
- [**Getting Started**](./guides/getting-started.md) - Quick setup and first automations
- [**Real-World Examples**](./examples/real-world-examples.md) - Complete use cases and scenarios
- [**Best Practices**](./guides/best-practices.md) - Production deployment guidance

### 🔧 Reference
- [**Environment Setup**](./reference/environment-setup.md) - Configuration and deployment
- [**API Reference**](./reference/api-reference.md) - Complete endpoint documentation
- [**Troubleshooting**](./reference/troubleshooting.md) - Common issues and solutions

## Quick Start

1. **Environment Setup**
   ```bash
   export NETSKOPE_BASE_URL="https://your-tenant.goskope.com"
   export NETSKOPE_TOKEN="your-api-token"
   ```

2. **Install and Run**
   ```bash
   npm install
   npm run build
   npm start
   ```

3. **Connect via MCP Client**
   ```json
   {
     "mcpServers": {
       "netskope-npa": {
         "command": "node",
         "args": ["/path/to/ns-private-access-mcp/build/index.js"],
         "env": {
           "NETSKOPE_BASE_URL": "https://your-tenant.goskope.com",
           "NETSKOPE_TOKEN": "your-api-token"
         }
       }
     }
   }
   ```

## Tool Overview

The MCP server provides **84 specialized tools** across 10 categories:

| Category | Tools | Primary Use Cases |
|----------|-------|------------------|
| **Publishers** | 9 tools | Infrastructure deployment and management |
| **Private Apps** | 15 tools | Application lifecycle and configuration |
| **Local Brokers** | 7 tools | Network connectivity and routing |
| **Policy Management** | 6 tools | Access control and security rules |
| **SCIM Integration** | 5 tools | Identity and user management |
| **Upgrade Profiles** | 7 tools | Automated maintenance scheduling |
| **Steering** | 3 tools | Traffic routing and associations |
| **Alerts** | 2 tools | Event monitoring and notifications |
| **Search** | 2 tools | Resource discovery and querying |
| **Validation** | 2 tools | Configuration compliance |

## Key Features

### 🤖 AI-Native Design
- Tools designed for LLM interaction with clear descriptions
- Automatic parameter validation and transformation
- Rich error context for troubleshooting

### 🔄 Workflow Orchestration
- Tools automatically coordinate with each other
- Built-in retry logic and error recovery
- Transactional operations where possible

### 🛡️ Production Ready
- Comprehensive input validation using Zod schemas
- Rate limiting and API quota management
- Detailed logging and monitoring

### 🔗 Integration Patterns
- SCIM integration for identity resolution
- Search tools for resource discovery
- Validation tools for compliance checking

## Architecture Highlights

### Tool Composition
Tools are designed to work together through well-defined interfaces:

```typescript
// Example: Creating a private app with validation and tagging
1. validateName() -> Check app name compliance
2. searchPublishers() -> Find target publisher
3. createPrivateApp() -> Create the application  
4. createPrivateAppTags() -> Add organizational tags
5. updatePublisherAssociation() -> Associate with publishers
```

### Schema-Driven Validation
Every tool uses Zod schemas for type safety and validation:

```typescript
const createAppSchema = z.object({
  app_name: z.string().min(1).max(64),
  host: z.string().url(),
  protocols: z.array(protocolSchema),
  clientless_access: z.boolean()
});
```

### Error Resilience
Built-in patterns for handling common issues:
- Automatic parameter extraction from MCP objects
- Retry logic with exponential backoff
- Graceful degradation for partial failures

## Getting Help

- **Documentation Issues**: Open an issue on GitHub
- **Feature Requests**: Create a feature request issue
- **Bug Reports**: Use the bug report template
- **Security Issues**: See [SECURITY.md](./SECURITY.md)

---

*This MCP server transforms complex Netskope NPA management into simple, AI-driven conversations.*