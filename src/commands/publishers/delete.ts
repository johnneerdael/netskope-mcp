import { PublishersTools } from '../../tools/publishers.js';

export async function deletePublisher(id: number) {
  const result = await PublishersTools.delete.handler({ id });
  return result;
}
