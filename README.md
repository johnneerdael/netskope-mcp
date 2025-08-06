# Netskope NPA MCP Server

A Model Context Protocol (MCP) server for managing Netskope Network Private Access (NPA) infrastructure through Large Language Models (LLMs).

## Credits
John Neerdael (Netskope Private Access Product Manager)
Mitchell Pompe (Chief Netskope Solutions Engineer for NL)

## Warning

Still lots of work needs to be done for all 50 tools to be operational, i strongly advise against using this with any production environment

## Demonstration
https://github.com/johnneerdael/netskope-mcp/raw/refs/heads/main/demo.mov

## Installation

### Option 1: NPM Package

Install the package using npm:

```bash
npm install @johnneerdael/netskope-mcp
```

### Option 2: Local Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/johnneerdael/netskope-mcp.git
cd netskope-mcp
npm install
npm run build
```

### MCP Configuration

Add the following configuration to your MCP settings file:

#### Windows with WSL

For NPM installation:
```json
{
  "mcpServers": {
    "netskope-mcp": {
      "command": "wsl.exe",
      "args": [
        "bash",
        "-c",
        "source ~/.nvm/nvm.sh && NETSKOPE_BASE_URL=https://your-tenant.goskope.com NETSKOPE_API_KEY=your-token npx -y @johnneerdael/netskope-mcp"
      ]
    }
  }
}
```

For local development:
```json
{
  "mcpServers": {
    "netskope-mcp": {
      "command": "wsl.exe",
      "args": [
        "bash",
        "-c",
        "cd /path/to/netskope-mcp && NETSKOPE_BASE_URL=https://your-tenant.goskope.com NETSKOPE_API_KEY=your-token node dist/cli.js"
      ]
    }
  }
}
```

#### Linux and macOS

For NPM installation:
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

For local development:
```json
{
  "mcpServers": {
    "netskope-mcp": {
      "command": "node",
      "args": ["dist/cli.js"],
      "cwd": "/path/to/netskope-mcp",
      "env": {
        "NETSKOPE_BASE_URL": "https://your-tenant.goskope.com",
        "NETSKOPE_API_KEY": "your-token"
      }
    }
  }
}
```

## Environment Variables

The Netskope NPA MCP Server requires the following environment variables to be configured for proper operation:

### Required Variables

- **NETSKOPE_BASE_URL**
  - **Description**: The base URL of your Netskope tenant
  - **Format**: Full URL including protocol
  - **Example**: `https://your-tenant.goskope.com`
  - **Usage**: Used for all API communications with your Netskope tenant
  - **Note**: Must be the complete tenant URL without any path components

- **NETSKOPE_API_KEY**
  - **Description**: API token for authentication with Netskope services
  - **Format**: String token from Netskope admin console
  - **Example**: `030f31f7d57fd94834af57a3edc4bbda`
  - **Usage**: Required for authenticating all API requests
  - **Security Note**: Keep this token secure and never commit it to version control

### Configuration Examples

#### Development Environment
```bash
export NETSKOPE_BASE_URL="https://dev-tenant.goskope.com"
export NETSKOPE_API_KEY="your-development-token"
```

#### Production Environment
```bash
export NETSKOPE_BASE_URL="https://prod-tenant.goskope.com"
export NETSKOPE_API_KEY="your-production-token"
```

### AlertsTools
- **getAlertConfig**
  - **Description**: Retrieves the current alert configuration settings for publishers, including notification preferences for various events such as upgrades and connection status changes.
  - **Required Parameters**: None
  - **Response Schema**:
    ```typescript
    {
      adminUsers: string[],      // Array of admin user emails to notify
      eventTypes: string[],      // Array of event types to monitor
      selectedUsers: string      // Additional users to notify
    }
    ```
  - **Event Types**:
    - `UPGRADE_WILL_START`: Notification before a publisher upgrade begins
    - `UPGRADE_STARTED`: Notification when upgrade process initiates
    - `UPGRADE_SUCCEEDED`: Notification upon successful upgrade completion
    - `UPGRADE_FAILED`: Notification if upgrade process fails
    - `CONNECTION_FAILED`: Notification when publisher connection issues occur
  - **Usage Examples**:
    1. "Check which administrators are configured to receive upgrade notifications: Use `getAlertConfig` to return the current list of admin users and their notification preferences."
    2. "Verify the alert configuration before a planned maintenance window: Use `getAlertConfig` to ensure the right team members will be notified of upgrade events."
    3. "Audit the publisher monitoring setup: Use `getAlertConfig` to show which critical events are being tracked and who receives notifications."

- **updateAlertConfig**
  - **Description**: Updates the alert configuration settings for publishers, allowing customization of notification preferences for various system events including upgrades and connection status changes.
  - **Required Parameters**:
    ```typescript
    {
      adminUsers: string[],      // Array of admin user emails to receive notifications
      eventTypes: string[],      // Array of event types to monitor
      selectedUsers: string      // Additional users to receive notifications
    }
    ```
  - **Response Schema**: Same as getAlertConfig
  - **Usage Examples**:
    1. "Configure notifications: Update alert settings to ensure critical events are properly monitored."
    2. "Modify recipients: Adjust the list of administrators who receive specific types of alerts."
    3. "Event selection: Customize which event types trigger notifications for different user groups."

### LocalBrokerTools
- **listLocalBrokers**
  - **Description**: Lists all configured local brokers in your Netskope environment. Local brokers are used for on-premises Zero Trust Network Access (ZTNA) scenarios where end-users connect to a Local Broker instead of a Cloud Broker to access private applications hosted on-premises.
  - **Required Parameters**: None
  - **Optional Parameters**:
    - `fields`: Array of specific fields to return in the response
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      total: number,
      data: Array<{
        id: number,              // Unique identifier for the local broker
        name: string,            // Display name of the local broker
        common_name: string,     // Common name used for broker identification
        registered: boolean      // Registration status of the broker
      }>
    }
    ```
  - **Usage Examples**:
    1. "Monitor your local broker deployment by listing your local brokers to get an overview of all registered brokers and their current status."
    2. "Verify high availability setup: Check if you have multiple local brokers configured per site by reviewing the list of deployed brokers."
    3. "Audit broker registration: List all local brokers to identify any unregistered instances that need attention."

- **createLocalBroker**
  - **Description**: Creates a new local broker instance for handling on-premises ZTNA traffic. This is typically used when setting up new sites or expanding capacity for existing locations.
  - **Required Parameters**:
    ```typescript
    {
      name: string              // Name for the new local broker
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        id: number,             // Assigned unique identifier
        name: string,           // Configured broker name
        common_name: string,    // Assigned common name
        registered: boolean     // Initial registration status
      }
    }
    ```
  - **Usage Examples**:
    1. "Deploy a new site: Create a local broker  twice to ensure high availability for a new office location."
    2. "Expand capacity: Add additional local brokers to handle increased on-premises traffic by creating new broker instances."
    3. "Initialize HA setup: Create multiple local brokers with descriptive names indicating their site and role."

- **getLocalBroker**
  - **Description**: Retrieves detailed information about a specific local broker by its ID. Use this to monitor the status and configuration of individual broker instances.
  - **Required Parameters**:
    - `id`: Numeric identifier of the local broker to retrieve
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        id: number,             // Broker's unique identifier
        name: string,           // Broker's display name
        common_name: string,    // Broker's common name
        registered: boolean     // Current registration status
      }
    }
    ```
  - **Usage Examples**:
    1. "Check broker health: Retrieve specific broker details to verify its registration status and configuration."
    2. "Troubleshoot connectivity: Get detailed information about a broker that's experiencing issues."
    3. "Verify deployment: Confirm the successful creation of a new broker by retrieving its details."

- **updateLocalBroker**
  - **Description**: Updates the configuration of an existing local broker. This allows you to modify broker settings such as its name while maintaining its identity and connections.
  - **Required Parameters**:
    ```typescript
    {
      id: number,               // Identifier of broker to update
      name: string              // New name for the broker
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        id: number,             // Broker's identifier
        name: string,           // Updated broker name
        common_name: string,    // Broker's common name
        registered: boolean     // Current registration status
      }
    }
    ```
  - **Usage Examples**:
    1. "Rename for clarity: Update a broker's name to better reflect its location or role in your infrastructure."
    2. "Standardize naming: Modify broker names to follow updated naming conventions across your organization."
    3. "Update HA pair: Adjust broker names to clearly indicate primary and secondary roles."

- **deleteLocalBroker**
  - **Description**: Removes a local broker from your Netskope configuration. Use this when decommissioning brokers or cleaning up unused instances.
  - **Required Parameters**:
    - `id`: Numeric identifier of the local broker to delete
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Decommission old brokers: Remove brokers that are no longer needed or have been replaced."
    2. "Clean up test instances: Delete temporary brokers created for testing purposes."
    3. "Site consolidation: Remove brokers from decommissioned locations while maintaining service at active sites."

- **getBrokerConfig**
  - **Description**: Retrieves the global configuration settings for local brokers, including hostname configurations that affect all broker instances.
  - **Required Parameters**: None
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        hostname: string        // Global hostname configuration
      }
    }
    ```
  - **Usage Examples**:
    1. "Review global settings: Check the current hostname configuration affecting all local brokers."
    2. "Prepare for changes: Verify existing configuration before planning updates."
    3. "Audit configuration: Ensure hostname settings align with your network architecture."

- **updateBrokerConfig**
  - **Description**: Updates the global configuration settings for all local brokers, allowing you to modify system-wide broker behavior.
  - **Required Parameters**:
    ```typescript
    {
      hostname: string          // New hostname configuration
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        hostname: string        // Updated hostname configuration
      }
    }
    ```
  - **Usage Examples**:
    1. "Modify global settings: Update the hostname configuration to reflect network changes."
    2. "Infrastructure updates: Adjust broker configurations to accommodate new networking requirements."
    3. "Standardize setup: Ensure consistent hostname configuration across all broker instances."

- **generateLocalBrokerRegistrationToken**
  - **Description**: Generates a new registration token for a specific local broker, enabling secure registration with the Netskope management plane.
  - **Required Parameters**:
    - `id`: Numeric identifier of the local broker
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found',
      data: {
        token: string          // Generated registration token
      }
    }
    ```
  - **Usage Examples**:
    1. "Secure new broker: Generate a token to safely register a newly deployed local broker."
    2. "Re-register broker: Create a new token when needing to re-establish broker registration."
    3. "Token rotation: Generate new registration tokens as part of security maintenance."

### PolicyTools
- **listRules**
  - **Description**: Lists all policy rules configured in your Netskope Private Access environment. These rules define access controls for private applications using Zero Trust Network Access (ZTNA) principles.
  - **Required Parameters**: None
  - **Optional Parameters**: 
    - `fields`: Array of specific fields to return
    - `filter`: Filter criteria for the rules
    - `limit`: Maximum number of rules to return
    - `offset`: Number of rules to skip
    - `sortby`: Field to sort by
    - `sortorder`: Sort direction ('asc' or 'desc')
  - **Response Schema**:
    ```typescript
    {
      data: {
        rules: Array<{
          id: number,
          name: string,
          description?: string,
          enabled: boolean,
          action: 'allow' | 'block',
          policy_group_id: number,
          priority: number,
          conditions: Array<{
            type: 'private_app' | 'user' | 'group' | 'organization_unit' | 'location' | 'device',
            operator: 'in' | 'not_in' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with',
            value: string | string[] | number | number[]
          }>,
          created_at: string,
          updated_at: string
        }>
      },
      status: 'success' | 'error',
      total: number
    }
    ```
  - **Usage Examples**:
    1. "Audit access policies to review all configured rules and their conditions to ensure proper access controls."
    2. "Prioritize rules: List rules sorted by priority to understand the order of policy evaluation and identify potential conflicts."
    3. "Filter specific policies: Retrieve rules related to specific applications or user groups using the filter parameter."

- **getRule**
  - **Description**: Retrieves detailed information about a specific policy rule by its ID. Use this to examine individual rule configurations and conditions.
  - **Required Parameters**: 
    - `id`: Numeric identifier of the policy rule
  - **Optional Parameters**: 
    - `fields`: Array of specific fields to return
  - **Response Schema**:
    ```typescript
    {
      data: {
        id: number,
        name: string,
        description?: string,
        enabled: boolean,
        action: 'allow' | 'block',
        policy_group_id: number,
        priority: number,
        conditions: Array<{
          type: 'private_app' | 'user' | 'group' | 'organization_unit' | 'location' | 'device',
          operator: 'in' | 'not_in' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with',
          value: string | string[] | number | number[]
        }>,
        created_at: string,
        updated_at: string
      },
      status: 'success' | 'error'
    }
    ```
  - **Usage Examples**:
    1. "Troubleshoot access issues: Examine specific rule details to understand why access might be blocked or allowed."
    2. "Verify rule conditions: Check the exact conditions configured for a critical access policy."
    3. "Review rule history: Check creation and update timestamps to track policy changes."

- **createRule**
  - **Description**: Creates a new policy rule to control access to private applications. Rules can be based on various conditions including user identity, device status, and location.
  - **Required Parameters**:
    ```typescript
    {
      name: string,                // Rule name
      description?: string,        // Optional rule description
      enabled: boolean,            // Rule status
      action: 'allow' | 'block',   // Access action
      policy_group_id: number,     // Associated policy group
      priority: number,            // Rule priority
      conditions: Array<{
        type: 'private_app' | 'user' | 'group' | 'organization_unit' | 'location' | 'device',
        operator: 'in' | 'not_in' | 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with',
        value: string | string[] | number | number[]
      }>
    }
    ```
  - **Usage Examples**:
    1. "Implement least privilege access: Create rules that grant access only to specific applications based on user roles and device status."
    2. "Set up location-based policies: Define rules that restrict access based on user location for compliance requirements."
    3. "Configure group-based access: Create rules that allow specific user groups to access designated private applications."

- **updateRule**
  - **Description**: Updates an existing policy rule's configuration. Use this to modify access controls, conditions, or rule properties.
  - **Required Parameters**: 
    - `id`: Numeric identifier of the rule to update
    - `data`: Updated rule configuration following the same schema as create_rule
  - **Response Schema**:
    ```typescript
    {
      data: {
        // Updated rule details (same as get_rule response)
      },
      status: 'success' | 'error'
    }
    ```
  - **Usage Examples**:
    1. "Adjust access conditions: Modify rule conditions to accommodate new security requirements or organizational changes."
    2. "Update rule priority: Change a rule's priority to ensure proper policy evaluation order."
    3. "Enable/disable rules: Toggle rule status during maintenance or when implementing policy changes."

- **deleteRule**
  - **Description**: Removes a policy rule from your configuration. Use with caution as this permanently removes the access control policy.
  - **Required Parameters**: 
    - `id`: Numeric identifier of the rule to delete
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error'
    }
    ```
  - **Usage Examples**:
    1. "Clean up obsolete policies: Remove rules that are no longer needed or have been superseded by new policies."
    2. "Policy consolidation: Delete redundant rules after merging policy configurations."
    3. "Remove temporary rules: Clean up temporary access policies created for specific projects or maintenance."

### PrivateAppsTools
- **createPrivateApp**
  - **Description**: Creates a new private application in your Netskope environment. This allows you to define and configure applications that will be accessible through your Zero Trust Network Access (ZTNA) infrastructure.
  - **Required Parameters**:
    ```typescript
    {
      app_name: string,                    // Name of the private application
      host: string,                        // Host address of the application
      clientless_access: boolean,          // Enable clientless access
      is_user_portal_app: boolean,         // Show in user portal
      protocols: Array<{
        port: string,                      // Port number
        type: 'tcp' | 'udp'               // Protocol type
      }>,
      publisher_tags?: Array<{            // Optional publisher tags
        tag_name: string
      }>,
      publishers: Array<{                 // Associated publishers
        publisher_id: string,
        publisher_name: string
      }>,
      trust_self_signed_certs: boolean,   // Trust self-signed certificates
      use_publisher_dns: boolean,         // Use publisher DNS
      allow_unauthenticated_cors?: boolean, // Optional CORS settings
      allow_uri_bypass?: boolean,         // Optional URI bypass
      bypass_uris?: string[],            // Optional bypass URIs
      real_host?: string,                // Optional real host
      app_option?: Record<string, unknown> // Additional options
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      data: {
        allow_unauthenticated_cors: boolean,
        allow_uri_bypass: boolean,
        uribypass_header_value: string,
        bypass_uris: string[],
        app_option: Record<string, unknown>,
        clientless_access: boolean,
        host: string,
        id: number,
        is_user_portal_app: boolean,
        name: string,
        protocols: Array<{
          ports: string[],
          type: string
        }>,
        real_host: string,
        service_publisher_assignments: Array<{
          primary: boolean,
          publisher_id: number,
          publisher_name: string,
          reachability: {
            error_code: number,
            error_string: string,
            reachable: boolean
          },
          service_id: number
        }>,
        tags: Array<{
          tag_id: number,
          tag_name: string
        }>,
        trust_self_signed_certs: boolean,
        use_publisher_dns: boolean
      },
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Deploy internal application: Create a private app definition for an internal web service with specific protocol and security settings."
    2. "Configure high availability: Set up a private application with multiple publishers for redundancy."
    3. "Enable secure access: Create a private app with strict security settings and specific bypass rules."

- **updatePrivateApp**
  - **Description**: Updates the configuration of an existing private application, allowing modification of access settings, protocols, and security parameters.
  - **Required Parameters**:
    ```typescript
    {
      id: number,                         // Application ID
      // All other fields same as create_private_app
    }
    ```
  - **Response Schema**: Same as create_private_app
  - **Usage Examples**:
    1. "Modify security settings: Update certificate trust settings and CORS configuration for enhanced security."
    2. "Adjust access parameters: Update protocols or bypass rules to accommodate changing requirements."
    3. "Publisher reassignment: Modify the list of publishers handling the application traffic."

- **deletePrivateApp**
  - **Description**: Removes a private application from your Netskope configuration. This action permanently removes the application definition and associated access controls.
  - **Required Parameters**:
    - `id`: Numeric identifier of the private application
  - **Response Schema**:
    ```typescript
    {
      status: number,
      result: string
    }
    ```
  - **Usage Examples**:
    1. "Decommission service: Remove a private application that is no longer in use."
    2. "Clean up test apps: Delete temporary applications used for testing."
    3. "Remove deprecated services: Clean up old application definitions during infrastructure updates."

- **getPrivateApp**
  - **Description**: Retrieves detailed configuration information about a specific private application.
  - **Required Parameters**:
    - `id`: Numeric identifier of the private application
  - **Response Schema**: Same as create_private_app response
  - **Usage Examples**:
    1. "Audit configuration: Review detailed settings of a private application for compliance checks."
    2. "Troubleshoot access: Examine application configuration to resolve connectivity issues."
    3. "Verify settings: Confirm proper configuration after making changes to the application."

- **listPrivateApps**
  - **Description**: Retrieves a list of all configured private applications with their configurations.
  - **Required Parameters**: None
  - **Optional Parameters**:
    - `fields`: Specific fields to return
    - `filter`: Filter criteria
    - `query`: Search query
    - `limit`: Maximum number of results
    - `offset`: Number of results to skip
  - **Response Schema**:
    ```typescript
    {
      data: Array<{
        // Same fields as get_private_app response
      }>,
      status: 'success' | 'not found',
      total: number
    }
    ```
  - **Usage Examples**:
    1. "Inventory applications: Get a complete list of all private applications for audit purposes."
    2. "Filter by criteria: Search for applications with specific configurations or tags."
    3. "Paginated review: Retrieve applications in manageable chunks for large deployments."

- **getPrivateAppTags**
  - **Description**: Retrieves all tags associated with private applications, useful for organizing and categorizing applications.
  - **Required Parameters**: None
  - **Optional Parameters**:
    - `query`: Search query for tags
    - `limit`: Maximum number of tags
    - `offset`: Number of tags to skip
  - **Response Schema**:
    ```typescript
    {
      data: Array<{
        tag_id: number,
        tag_name: string
      }>,
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "List categories: Retrieve all tags to understand application categorization."
    2. "Search tags: Find specific tags matching certain criteria."
    3. "Tag inventory: Review all available tags for standardization purposes."

- **createPrivateAppTags**
  - **Description**: Associates new tags with a private application for better organization and management.
  - **Required Parameters**:
    - `id`: Application identifier
    - `tags`: Array of tag objects
  - **Usage Examples**:
    1. "Categorize apps: Add organizational tags to group related applications."
    2. "Environment labeling: Tag applications based on their deployment environment."
    3. "Team assignment: Add tags to indicate which team owns or manages the application."

- **updatePrivateAppTags**
  - **Description**: Updates the tags associated with one or more private applications.
  - **Required Parameters**:
    - `ids`: Array of application identifiers
    - `tags`: Array of updated tag objects
  - **Usage Examples**:
    1. "Bulk tag update: Modify tags for multiple applications simultaneously."
    2. "Tag standardization: Update tags to conform to new naming conventions."
    3. "Ownership changes: Update tags to reflect new team assignments."

- **updatePrivateAppPublishers**
  - **Description**: Updates the publisher assignments for private applications, controlling which publishers handle application traffic.
  - **Required Parameters**:
    ```typescript
    {
      private_app_ids: string[],          // Application IDs
      publisher_ids: string[]             // Publisher IDs
    }
    ```
  - **Usage Examples**:
    1. "Load balancing: Distribute application traffic across multiple publishers."
    2. "Publisher migration: Move applications to new or different publishers."
    3. "HA configuration: Add backup publishers for high availability."

- **deletePrivateAppPublishers**
  - **Description**: Removes publisher assignments from private applications.
  - **Required Parameters**:
    ```typescript
    {
      private_app_ids: string[],          // Application IDs
      publisher_ids: string[]             // Publisher IDs to remove
    }
    ```
  - **Usage Examples**:
    1. "Publisher decommission: Remove old publishers from application configurations."
    2. "Clean up assignments: Remove unnecessary publisher assignments."
    3. "Reconfigure routing: Remove publishers during traffic flow updates."

- **getDiscoverySettings**
  - **Description**: Retrieves the current discovery settings for private applications, which control how applications are discovered and monitored.
  - **Required Parameters**: None
  - **Usage Examples**:
    1. "Review discovery: Check current application discovery configuration."
    2. "Audit settings: Verify discovery parameters for compliance."
    3. "Monitor configuration: Examine how applications are being discovered and tracked."

- **getPolicyInUse**
  - **Description**: Retrieves the active policies associated with specified private applications.
  - **Required Parameters**:
    - `ids`: Array of application identifiers
  - **Usage Examples**:
    1. "Policy audit: Review which policies are affecting specific applications."
    2. "Access control review: Verify policy assignments for security compliance."
    3. "Troubleshoot access: Check policies when investigating access issues."

### PublishersTools
- **listPublishers**
  - **Description**: Lists all publishers configured in your Netskope environment. Publishers are the components that handle private application traffic and require proper management for optimal performance.
  - **Required Parameters**: None
  - **Optional Parameters**:
    - `fields`: Specific fields to return in the response
  - **Response Schema**:
    ```typescript
    {
      data: {
        publishers: Array<{
          apps_count: number,
          assessment: {
            ca_certs_status: {
              hashes: string[],
              last_modified: number
            },
            eee_support: boolean,
            hdd_free: string,
            hdd_total: string,
            ip_address: string,
            latency: number,
            version: string
          },
          capabilities: {
            DTLS: boolean,
            EEE: boolean,
            auto_upgrade: boolean,
            nwa_ba: boolean,
            pull_nsconfig: {
              orgkey_exist: boolean,
              orguri_exist: boolean
            }
          },
          common_name: string,
          connected_apps: string[],
          id: number,
          lbrokerconnect: boolean,
          name: string,
          publisher_upgrade_profiles_id: number,
          registered: boolean,
          status: 'connected' | 'not registered',
          stitcher_id: number,
          sticher_pop: string,
          upgrade_request: boolean,
          upgrade_status: {
            upstat: string
          }
        }>
      },
      status: 'success' | 'not found',
      total: number
    }
    ```
  - **Usage Examples**:
    1. "Monitor deployment: List all publishers to check their connection status and capabilities."
    2. "Audit configuration: Review publisher settings and associated applications."
    3. "Capacity planning: Check the number of apps and load across publishers."

- **getPublisher**
  - **Description**: Retrieves detailed information about a specific publisher, including its configuration, status, and capabilities.
  - **Required Parameters**:
    - `id`: Numeric identifier of the publisher
  - **Response Schema**: Same as individual publisher in list_publishers response
  - **Usage Examples**:
    1. "Health check: Get detailed status information for a specific publisher."
    2. "Troubleshoot connectivity: Examine publisher capabilities and connection status."
    3. "Version verification: Check publisher version and upgrade status."

- **createPublisher**
  - **Description**: Creates a new publisher instance in your Netskope environment.
  - **Required Parameters**:
    ```typescript
    {
      name: string,                        // Publisher name
      lbrokerconnect?: boolean,           // Optional local broker connection
      publisher_upgrade_profiles_id?: number // Optional upgrade profile assignment
    }
    ```
  - **Response Schema**: Same as get_publisher response
  - **Usage Examples**:
    1. "Deploy new publisher: Create a publisher for a new data center location."
    2. "Expand capacity: Add publishers to handle increased application traffic."
    3. "Configure HA: Create additional publishers for high availability setup."

- **patchPublisher**
  - **Description**: Partially updates a publisher's configuration, allowing modification of specific settings while maintaining others.
  - **Required Parameters**:
    ```typescript
    {
      name: string,                        // Publisher name
      id?: number,                        // Optional publisher ID
      lbrokerconnect?: boolean,           // Optional local broker connection
      publisher_upgrade_profiles_id?: number // Optional upgrade profile assignment
    }
    ```
  - **Response Schema**: Same as get_publisher response
  - **Usage Examples**:
    1. "Update name: Change publisher name to match new naming convention."
    2. "Modify connection: Update local broker connection settings."
    3. "Assign profile: Link publisher to an upgrade profile."

- **updatePublisher**
  - **Description**: Performs a complete update of a publisher's configuration, replacing all settings with the provided values.
  - **Required Parameters**:
    ```typescript
    {
      id: number,                         // Publisher ID
      name: string,                       // Publisher name
      lbrokerconnect?: boolean,          // Optional local broker connection
      tags?: Array<{                     // Optional tags
        tag_id: number,
        tag_name: string
      }>
    }
    ```
  - **Response Schema**: Same as get_publisher response
  - **Usage Examples**:
    1. "Full reconfiguration: Update all publisher settings at once."
    2. "Tag management: Update publisher tags and configuration together."
    3. "Reset settings: Replace existing configuration with new values."

- **deletePublisher**
  - **Description**: Removes a publisher from your Netskope configuration. Use with caution as this affects application access.
  - **Required Parameters**:
    - `id`: Numeric identifier of the publisher to delete
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error'
    }
    ```
  - **Usage Examples**:
    1. "Decommission publisher: Remove a publisher that's being retired."
    2. "Clean up test instances: Delete publishers used for testing."
    3. "Remove unused: Clean up publishers that are no longer needed."

- **bulkUpgradePublishers**
  - **Description**: Initiates upgrades for multiple publishers simultaneously.
  - **Required Parameters**:
    ```typescript
    {
      publishers: {
        apply: {
          upgrade_request: boolean      // Whether to request upgrade
        },
        id: string[]                   // Array of publisher IDs
      }
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      data: {
        publishers: Array<PublisherResponse>
      },
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Mass upgrade: Upgrade all publishers in a specific region."
    2. "Staged rollout: Upgrade a subset of publishers at once."
    3. "Emergency patching: Apply critical updates to multiple publishers."

- **getReleases**
  - **Description**: Retrieves information about available publisher releases.
  - **Required Parameters**: None
  - **Response Schema**:
    ```typescript
    {
      data: Array<{
        docker_tag: string,
        is_recommended: boolean,
        release_type: 'Beta' | 'Latest' | 'Latest-1' | 'Latest-2',
        version: string
      }>,
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Version planning: Check available releases for upgrade planning."
    2. "Release tracking: Monitor new versions and recommendations."
    3. "Compatibility check: Verify release types before upgrading."

- **getPrivateApps**
  - **Description**: Retrieves the list of private applications associated with a specific publisher.
  - **Required Parameters**:
    - `publisherId`: Numeric identifier of the publisher
  - **Response Schema**: Application-specific response
  - **Usage Examples**:
    1. "App inventory: List all applications handled by a publisher."
    2. "Load assessment: Check number and type of apps on a publisher."
    3. "Migration planning: Review apps before moving to a different publisher."

- **generatePublisherRegistrationToken**
  - **Description**: Creates a new registration token for a publisher, enabling secure registration with the Netskope control plane.
  - **Required Parameters**:
    - `publisherId`: Numeric identifier of the publisher
  - **Response Schema**:
    ```typescript
    {
      data: {
        token: string          // Registration token
      },
      status: string
    }
    ```
  - **Usage Examples**:
    1. "Initial setup: Generate token for new publisher registration."
    2. "Re-registration: Create new token for publisher reconnection."
    3. "Security refresh: Rotate registration tokens periodically."

### UpgradeProfileTools
- **listUpgradeProfiles**
  - **Description**: Lists all upgrade profiles configured in your Netskope environment. Upgrade profiles define when and how publisher upgrades are performed.
  - **Required Parameters**: None
  - **Response Schema**:
    ```typescript
    {
      data: {
        upgrade_profiles: Array<{
          id: number,
          external_id: number,
          name: string,
          docker_tag: string,
          enabled: boolean,
          frequency: string,          // Cron format: minute hour day * DAY_OF_WEEK
          timezone: string,           // Standard timezone identifier
          release_type: 'Beta' | 'Latest' | 'Latest-1' | 'Latest-2',
          created_at: string,
          updated_at: string,
          next_update_time?: number,
          num_associated_publisher: number,
          upgrading_stage?: number,
          will_start?: boolean
        }>
      },
      status: 'success' | 'not found',
      total: number
    }
    ```
  - **Usage Examples**:
    1. "Review upgrade schedules: List all profiles to understand when different publishers are scheduled for upgrades."
    2. "Audit configurations: Check all upgrade profiles for consistency in settings and schedules."
    3. "Monitor upgrade status: View which profiles are actively upgrading or scheduled for updates."

- **getUpgradeProfile**
  - **Description**: Retrieves detailed information about a specific upgrade profile, including its schedule and configuration.
  - **Required Parameters**:
    - `id`: Numeric identifier of the upgrade profile
  - **Response Schema**: Same as individual profile in list_upgrade_profiles
  - **Usage Examples**:
    1. "Verify settings: Check specific profile configuration before an upgrade window."
    2. "Troubleshoot upgrades: Examine profile details when investigating upgrade issues."
    3. "Monitor progress: Track the status of an ongoing upgrade process."

- **createUpgradeProfile**
  - **Description**: Creates a new upgrade profile to manage automated publisher upgrades. Profiles control when and how updates are applied to publishers.
  - **Required Parameters**:
    ```typescript
    {
      name: string,                  // Profile name
      enabled: boolean,              // Profile status
      docker_tag: string,            // Docker image tag for upgrade
      frequency: string,             // Cron schedule format
      timezone: string,              // Timezone for schedule
      release_type: 'Beta' | 'Latest' | 'Latest-1' | 'Latest-2'
    }
    ```
  - **Usage Examples**:
    1. "Schedule maintenance: Create a profile for regular off-hours upgrades."
    2. "Beta testing: Set up a profile for testing new releases on selected publishers."
    3. "Regional updates: Create profiles aligned with different timezone maintenance windows."

- **updateUpgradeProfile**
  - **Description**: Updates an existing upgrade profile's configuration, allowing modification of schedule, release type, and other settings.
  - **Required Parameters**:
    - `id`: Profile identifier
    - `data`: Updated profile configuration (same schema as create_upgrade_profile)
  - **Response Schema**:
    ```typescript
    {
      data: {
        // Updated profile details (same as get_upgrade_profile response)
      },
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Adjust schedule: Modify upgrade timing to better align with maintenance windows."
    2. "Change release track: Update profile to use a different release type."
    3. "Enable/disable upgrades: Toggle profile status during change freeze periods."

- **deleteUpgradeProfile**
  - **Description**: Removes an upgrade profile from your configuration. Use with caution as this affects automated upgrade scheduling.
  - **Required Parameters**:
    - `id`: Numeric identifier of the profile to delete
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'not found'
    }
    ```
  - **Usage Examples**:
    1. "Remove obsolete profiles: Clean up unused upgrade configurations."
    2. "Profile consolidation: Delete redundant profiles after consolidating upgrade schedules."
    3. "Clean up test profiles: Remove temporary profiles used for upgrade testing."

### SteeringTools
- **updatePublisherAssociation**
  - **Description**: Updates the association between private applications and publishers, allowing you to modify which publishers handle specific application traffic.
  - **Required Parameters**:
    ```typescript
    {
      private_app_ids: string[],          // Array of private application IDs
      publisher_ids: string[]             // Array of publisher IDs
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error',
      data: {
        private_app_ids: string[],
        publisher_ids: string[]
      }
    }
    ```
  - **Usage Examples**:
    1. "Reassign publishers: Update which publishers handle specific private applications."
    2. "Load distribution: Modify publisher assignments for better traffic distribution."
    3. "HA configuration: Set up multiple publishers for application redundancy."

- **deletePublisherAssociation**
  - **Description**: Removes associations between private applications and publishers, effectively stopping those publishers from handling the applications' traffic.
  - **Required Parameters**:
    ```typescript
    {
      private_app_ids: string[],          // Array of private application IDs
      publisher_ids: string[]             // Array of publisher IDs to remove
    }
    ```
  - **Response Schema**: Same as update_publisher_association
  - **Usage Examples**:
    1. "Remove associations: Stop specific publishers from handling certain applications."
    2. "Clean up configuration: Remove unnecessary publisher assignments."
    3. "Prepare for decommission: Remove applications before retiring a publisher."

- **getUserDiagnostics**
  - **Description**: Retrieves diagnostic information about user access to private applications, helping troubleshoot connectivity issues.
  - **Required Parameters**: None
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error',
      data: {
        user_id: string,
        diagnostics: Array<{
          private_app_id: string,
          private_app_name: string,
          publisher_id: string,
          publisher_name: string,
          status: string,
          timestamp: string
        }>
      }
    }
    ```
  - **Usage Examples**:
    1. "Access troubleshooting: Investigate user connectivity issues to private applications."
    2. "Audit access patterns: Review which publishers users are connecting through."
    3. "Monitor performance: Check connection status and timing for user access."

- **getDeviceDiagnostics**
  - **Description**: Retrieves diagnostic information about device access to specific private applications.
  - **Required Parameters**:
    - `deviceId`: Device identifier
    - `privateAppId`: Private application identifier
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error',
      data: {
        device_id: string,
        private_app_id: string,
        diagnostics: Array<{
          publisher_id: string,
          publisher_name: string,
          status: string,
          timestamp: string
        }>
      }
    }
    ```
  - **Usage Examples**:
    1. "Device troubleshooting: Investigate specific device connectivity issues."
    2. "Application access: Check device-specific access to private applications."
    3. "Connection history: Review device connection patterns and status."

### ValidationTools
- **validateName**
  - **Description**: Validates names for various resources (publishers, private apps, policies, etc.) to ensure they meet naming requirements.
  - **Required Parameters**:
    ```typescript
    {
      resourceType: 'publisher' | 'private_app' | 'policy' | 'policy_group' | 'upgrade_profile',
      name: string,
      tagType?: 'publisher' | 'private_app'
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error',
      data: {
        valid: boolean,
        message?: string
      }
    }
    ```
  - **Usage Examples**:
    1. "Name validation: Check if a proposed resource name meets requirements."
    2. "Tag verification: Validate tag names before creation."
    3. "Policy naming: Ensure policy names follow conventions."

- **validateResource**
  - **Description**: Validates complete resource configurations before creation or update operations.
  - **Required Parameters**:
    ```typescript
    {
      resourceType: 'publisher' | 'private_app' | 'policy' | 'policy_group' | 'upgrade_profile',
      data: {
        name: string,
        // Additional resource-specific fields
      }
    }
    ```
  - **Response Schema**:
    ```typescript
    {
      status: 'success' | 'error',
      data: {
        valid: boolean,
        errors?: string[]
      }
    }
    ```
  - **Usage Examples**:
    1. "Configuration validation: Verify resource settings before creation."
    2. "Update verification: Validate changes before applying updates."
    3. "Compliance check: Ensure resources meet required standards."

- **searchResources**
  - **Description**: Searches for publishers or private applications based on specified criteria.
  - **Required Parameters**:
    ```typescript
    {
      resourceType: 'publishers' | 'private_apps',
      query: string
    }
    ```
  - **Response Schema**: Resource-specific response format
  - **Usage Examples**:
    1. "Resource search: Find resources matching specific criteria."
    2. "Publisher lookup: Search for publishers by name or attributes."
    3. "Application discovery: Find private apps matching search terms."

