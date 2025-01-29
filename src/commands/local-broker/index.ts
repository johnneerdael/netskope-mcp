import { z } from 'zod';
import { LocalBrokerTools } from '../../tools/local-broker.js';
import { 
  localBrokerPostRequestSchema,
  localBrokerPutRequestSchema,
  localBrokerConfigPutRequestSchema
} from '../../types/schemas/local-broker.schemas.js';

// Command implementations
export async function listLocalBrokers(params: { fields?: string } = {}) {
  try {
    const result = await LocalBrokerTools.list.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list local brokers: ${error.message}`);
    }
    throw error;
  }
}

export async function createLocalBroker(params: z.infer<typeof localBrokerPostRequestSchema>) {
  try {
    const result = await LocalBrokerTools.create.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create local broker: ${error.message}`);
    }
    throw error;
  }
}

export async function getLocalBroker(id: number) {
  try {
    const result = await LocalBrokerTools.get.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get local broker: ${error.message}`);
    }
    throw error;
  }
}

export async function updateLocalBroker(id: number, params: z.infer<typeof localBrokerPutRequestSchema>) {
  try {
    const result = await LocalBrokerTools.update.handler({ id, ...params });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update local broker: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteLocalBroker(id: number) {
  try {
    const result = await LocalBrokerTools.delete.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete local broker: ${error.message}`);
    }
    throw error;
  }
}

export async function getLocalBrokerConfig() {
  try {
    const result = await LocalBrokerTools.getConfig.handler();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get local broker config: ${error.message}`);
    }
    throw error;
  }
}

export async function updateLocalBrokerConfig(params: z.infer<typeof localBrokerConfigPutRequestSchema>) {
  try {
    const result = await LocalBrokerTools.updateConfig.handler(params);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update local broker config: ${error.message}`);
    }
    throw error;
  }
}

export async function generateLocalBrokerRegistrationToken(id: number) {
  try {
    const result = await LocalBrokerTools.generateLocalBrokerRegistrationToken.handler({ id });
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate registration token: ${error.message}`);
    }
    throw error;
  }
}

// Export command definitions for MCP server
export const localBrokerCommands = {
  listLocalBrokers: {
    name: 'listLocalBrokers',
    schema: LocalBrokerTools.list.schema,
    handler: listLocalBrokers
  },
  createLocalBroker: {
    name: 'createLocalBroker',
    schema: localBrokerPostRequestSchema,
    handler: createLocalBroker
  },
  getLocalBroker: {
    name: 'getLocalBroker',
    schema: LocalBrokerTools.get.schema,
    handler: getLocalBroker
  },
  updateLocalBroker: {
    name: 'updateLocalBroker',
    schema: LocalBrokerTools.update.schema,
    handler: updateLocalBroker
  },
  deleteLocalBroker: {
    name: 'deleteLocalBroker',
    schema: LocalBrokerTools.delete.schema,
    handler: deleteLocalBroker
  },
  getLocalBrokerConfig: {
    name: 'getLocalBrokerConfig',
    schema: LocalBrokerTools.getConfig.schema,
    handler: getLocalBrokerConfig
  },
  updateLocalBrokerConfig: {
    name: 'updateLocalBrokerConfig',
    schema: localBrokerConfigPutRequestSchema,
    handler: updateLocalBrokerConfig
  },
  generateLocalBrokerRegistrationToken: {
    name: 'generateLocalBrokerRegistrationToken',
    schema: LocalBrokerTools.generateLocalBrokerRegistrationToken.schema,
    handler: generateLocalBrokerRegistrationToken
  }
};
