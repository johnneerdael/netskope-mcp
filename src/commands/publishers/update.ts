import { PublishersTools } from '../../tools/publishers.js';

// Full replacement with PUT
export async function replacePublisher(
  id: number,
  name: string,
  lbrokerconnect: boolean,
  publisher_upgrade_profiles_id?: number
) {
  const result = await PublishersTools.replace.handler({
    id,
    name,
    lbrokerconnect,
    ...(publisher_upgrade_profiles_id !== undefined && { publisher_upgrade_profiles_id })
  });
  return result;
}

// Partial update with PATCH
export async function updatePublisher(
  id: number,
  name: string,
  lbrokerconnect?: boolean,
  publisher_upgrade_profiles_id?: number
) {
  const result = await PublishersTools.update.handler({
    id,
    name,
    ...(lbrokerconnect !== undefined && { lbrokerconnect }),
    ...(publisher_upgrade_profiles_id !== undefined && { publisher_upgrade_profiles_id })
  });
  return result;
}
