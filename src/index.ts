import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NetskopeServer } from './server.js';

export const createServer = async () => {
  const server = new NetskopeServer();
  const transport = new StdioServerTransport();
  
  await server.start(transport);
  
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });
  
  return server;
};

export default createServer;
