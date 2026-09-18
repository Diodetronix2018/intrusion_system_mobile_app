import { useCallback, useState } from 'react';

import { useIotConnection } from './IotConnection';

/**
 * One-shot AWS IoT device-shadow publish, scoped to a single named shadow.
 * Publishes over the app's one shared MQTT connection (`IotConnectionProvider`,
 * mounted at the navigation root) instead of opening a connection of its
 * own — AWS IoT allows only one live connection per clientId (ours is the
 * bare Cognito identity id the attached policy requires), so a second
 * connection per publish used to evict the shared one and vice versa,
 * producing an endless connect/evict/reconnect loop and a multi-second
 * delay on every command while it redid the whole connect flow. Reusing
 * the already-open connection makes a publish near-instant.
 */
export function useIotShadowPublish(shadowName: string) {
  const { publish: publishToConnection } = useIotConnection();
  const [publishing, setPublishing] = useState(false);

  const publish = useCallback(
    async (desired: Record<string, unknown>): Promise<void> => {
      setPublishing(true);
      try {
        await publishToConnection(shadowName, desired);
      } finally {
        setPublishing(false);
      }
    },
    [publishToConnection, shadowName],
  );

  return { publish, publishing };
}
