import { PrivateAppsTools } from '../../tools/private-apps.js';
import { Protocol } from '../../types/schemas/private-apps.schemas.js';

export async function createPrivateApp(
  name: string,
  host: string,
  protocol: Protocol,
  port: string | number
) {
  const result = await PrivateAppsTools.create.handler({
    app_name: name,
    host,
    protocols: [{
      port: typeof port === 'number' ? port.toString() : port,
      type: protocol.type
    }],
    publishers: [],
    clientless_access: false,
    is_user_portal_app: false,
    trust_self_signed_certs: false,
    use_publisher_dns: false
  });
  return result;
}
