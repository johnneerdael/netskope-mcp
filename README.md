# Netskope NPA MCP Server
[![Trust Score](https://archestra.ai/mcp-catalog/api/badge/quality/johnneerdael/netskope-mcp)](https://archestra.ai/mcp-catalog/johnneerdael__netskope-mcp)

A comprehensive Model Context Protocol (MCP) server for managing Netskope Private Access (NPA) infrastructure through AI-powered automation.

## 📚 Complete Documentation

This project includes extensive documentation organized for easy navigation:

**👉 [Start with the Complete Documentation](./docs/README.md)** - Overview and navigation guide

### Quick Access Links

| Category | Description | Link |
|----------|-------------|------|
| **🏗️ Architecture** | Server design and patterns | [Server Architecture](./docs/architecture/server-architecture.md) |
| **🛠️ Tools Reference** | Complete tool documentation | [Publisher Tools](./docs/tools/publisher-tools.md), [Private App Tools](./docs/tools/private-app-tools.md), [Policy Tools](./docs/tools/policy-tools.md) |
| **🔄 Workflows** | Common automation patterns | [Common Workflows](./docs/workflows/common-workflows.md) |
| **💼 Real Examples** | Complete use cases | [Real-World Examples](./docs/examples/real-world-examples.md) |

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

## Real-World Usage Examples

### 🏢 "Set up complete NPA infrastructure for our new London office"
**AI Response**: Executes comprehensive deployment workflow
- ✅ Creates publisher with auto-upgrade profile
- ✅ Configures local broker for internal routing  
- ✅ Sets up core business applications (CRM, ERP, File Server)
- ✅ Creates access policies with SCIM group validation
- ✅ Enables monitoring and discovery for office network
- ✅ Generates registration token for field deployment

### 🚨 "URGENT: Security incident - lock down HR/Finance apps immediately"
**AI Response**: Emergency security response workflow
- ✅ Identifies all HR/Finance applications automatically
- ✅ Creates emergency policy group with highest priority
- ✅ Blocks access for all users except incident response team
- ✅ Enhances monitoring for security events
- ✅ Tags applications for incident tracking

### 📊 "Perform comprehensive compliance audit of our NPA environment"
**AI Response**: Automated compliance assessment
- ✅ Audits all publishers for version compliance
- ✅ Identifies applications without access policies
- ✅ Validates SCIM group references in policies
- ✅ Generates compliance score and remediation plan
- ✅ Creates detailed findings report with priorities

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

## Installation Options

### NPM Package
```bash
npm install @johnneerdael/ns-private-access-mcp
```

### Local Development
```bash
git clone https://github.com/johnneerdael/ns-private-access-mcp.git
cd ns-private-access-mcp
npm install
npm run build
```

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

## Credits

- **John Neerdael** (Netskope Private Access Product Manager)  
- **Mitchell Pompe** (Chief Netskope Solutions Engineer for NL)

## Getting Help

- **Documentation Issues**: Open an issue on GitHub
- **Feature Requests**: Create a feature request issue
- **Bug Reports**: Use the bug report template
- **Security Issues**: See [SECURITY.md](./docs/SECURITY.md)

---

*This MCP server transforms complex Netskope NPA management into simple, AI-driven conversations.*
