import { PublishersTools } from '../tools/publishers.js';
import { PublisherPostRequest } from '../types/schemas/publisher.schemas.js';

export async function createPublisher(
  name: string,
  options: Partial<Omit<PublisherPostRequest, 'name'>> = {}
) {
  try {
    const result = await PublishersTools.create.handler({
      name,
      ...options
    });
    
    const data = JSON.parse(result.content[0].text);
    if (data.status !== 'success') {
      throw new Error(data.message || 'Failed to create publisher');
    }
    
    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create publisher: ${error.message}`);
    }
    throw error;
  }
}
