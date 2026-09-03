import type { RemoteGatewayTransport } from '@/src/shared/remote-gateway';

import { type RemoteProcessingCapabilities, remoteProcessingCapabilitiesSchema } from '../model/remoteProcessingCapability';

export async function getRemoteProcessingCapabilities(transport: RemoteGatewayTransport, signal?: AbortSignal): Promise<RemoteProcessingCapabilities> {
    const response = await transport.request('/v1/capabilities', { signal });
    if (response.status !== 200) throw new Error('capabilities-unavailable');
    const parsed = remoteProcessingCapabilitiesSchema.safeParse(response.body);
    if (!parsed.success) throw new Error('capabilities-unavailable');
    return parsed.data;
}
