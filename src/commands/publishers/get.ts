import { PublishersTools } from '../../tools/publishers.js';

export async function getPublisher({ id }: { id: number }) {
  const result = await PublishersTools.get.handler({ id });
  return result;
}
