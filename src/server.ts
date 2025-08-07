import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { NetskopeClient } from './mcp.js';
import { z } from 'zod';
import { publisherCommands } from './commands/publishers/index.js';
import { alertCommands } from './commands/alerts/index.js';
import { localBrokerCommands } from './commands/local-broker/index.js';
import { policyCommands } from './commands/policy/index.js';
import { privateAppCommands } from './commands/private-apps/index.js';
import { steeringCommands } from './commands/steering/index.js';
import { validationCommands } from './commands/validation/index.js';
import { upgradeProfileCommands } from './commands/upgrade/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Debug logging function
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] SERVER: ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
  const logPath = path.join(process.cwd(), 'debug.log');
  
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write to debug.log:', error);
  }
}

// Command interface
interface McpCommand {
  name: string;
  schema: z.ZodType;
  handler: (...args: any[]) => Promise<any>;
}

export class NetskopeServer {
  private server: McpServer;
  private client: NetskopeClient;

  constructor() {
    this.server = new McpServer({
      name: "netskope-mcp",
      version: "4.0.0"
    });
    this.client = new NetskopeClient({
      baseUrl: process.env.NETSKOPE_BASE_URL,
      apiKey: process.env.NETSKOPE_API_KEY
    });
    debugLog('NetskopeServer initialized');
    this.setupTools();
  }

  private setupTools(): void {
    debugLog('Setting up tools');
    
    // Register publisher commands
    Object.entries(publisherCommands).forEach(([key, command]: [string, McpCommand]) => {
      debugLog('Registering publisher command', { key, name: command.name, schema: command.schema });
      
      const wrappedHandler = async (args: any, extra: any) => {
        debugLog(`Tool ${command.name} called`, { args, extra });
        try {
          const result = await command.handler(args);
          debugLog(`Tool ${command.name} completed successfully`);
          return result;
        } catch (error) {
          debugLog(`Tool ${command.name} failed`, { error: error instanceof Error ? error.message : error });
          throw error;
        }
      };
      
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        wrappedHandler
      );
    });

    // Register alert commands
    Object.entries(alertCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register local broker commands
    Object.entries(localBrokerCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register policy commands
    Object.entries(policyCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register private app commands
    Object.entries(privateAppCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register steering commands
    Object.entries(steeringCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register validation commands
    Object.entries(validationCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });

    // Register upgrade profile commands
    Object.entries(upgradeProfileCommands).forEach(([_, command]: [string, McpCommand]) => {
      this.server.tool(
        command.name,
        command.schema instanceof z.ZodObject ? command.schema.shape : {},
        command.handler
      );
    });
  }

  async start(transport: StdioServerTransport): Promise<void> {
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }
}
