import type { DataSource } from 'typeorm';
import { loadRealtimeConfig } from './config.js';
import type { RealtimeConfig } from './config.js';
import { MercurePublisher } from './publisher.js';
import { TypeOrmOutboxStore } from './outboxStore.js';
import { OutboxDispatcher } from './outboxDispatcher.js';

export * from './config.js';
export * from './publisher.js';
export * from './subscriberToken.js';
export * from './tokens.js';
export * from './outboxDispatcher.js';
export * from './outboxStore.js';
export * from './validateEvent.js';

let config: RealtimeConfig | null | undefined;
let dispatcher: OutboxDispatcher | null = null;

/** Configuration chargée une fois ; `null` si Mercure est désactivé. */
export function getRealtimeConfig(): RealtimeConfig | null {
  if (config === undefined) config = loadRealtimeConfig();
  return config;
}

/** Démarre le dispatcher si MERCURE_URL est défini. À appeler après AppDataSource.initialize(). */
export function startRealtime(ds: DataSource): boolean {
  const cfg = getRealtimeConfig();
  if (!cfg) {
    console.log('Temps réel Mercure : désactivé (MERCURE_URL absent)');
    return false;
  }
  dispatcher = new OutboxDispatcher(
    new TypeOrmOutboxStore(ds),
    new MercurePublisher({ hubUrl: cfg.hubUrl, publisherKey: cfg.publisherKey, protocol: cfg.protocol, issuer: cfg.issuer, audience: cfg.audience }),
    { log: (m) => console.warn(`[realtime] ${m}`) },
  );
  dispatcher.start();
  console.log(`Temps réel Mercure : actif (${cfg.hubUrl}, protocole ${cfg.protocol}, auth ${cfg.authMode})`);
  return true;
}

export function stopRealtime(): void {
  dispatcher?.stop();
  dispatcher = null;
}
