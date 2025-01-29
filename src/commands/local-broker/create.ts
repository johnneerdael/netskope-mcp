import { LocalBrokerTools } from '../../tools/local-broker.js';
import { LocalBrokerPostRequest } from '../../types/schemas/local-broker.schemas.js';

export async function createLocalBroker(name: string) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Name is required and cannot be empty');
    }

    const params: LocalBrokerPostRequest = {
      name: name.trim()
    };

    const result = await LocalBrokerTools.create.handler(params);
    const data = JSON.parse(result.content[0].text);
    
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create local broker');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create local broker: ${error.message}`);
    }
    throw error;
  }
}
