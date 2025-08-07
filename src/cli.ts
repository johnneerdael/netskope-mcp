#!/usr/bin/env node
import createServer from './index.js';

async function main() {
  try {
    await createServer();
  } catch (error) {
    console.error('Failed to start NPA MCP server:', error);
    process.exit(1);
  }
}

main();
