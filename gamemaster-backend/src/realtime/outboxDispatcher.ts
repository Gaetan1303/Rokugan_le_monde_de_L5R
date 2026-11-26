import type { EventPublisher } from './publisher.js';
import type { OutboxStore } from './outboxStore.js';

export interface DispatcherOptions {
  batchSize?: number;
  pollIntervalMs?: number;
  leaseSeconds?: number;
  maxAttempts?: number;
  /** Plafond du délai de reprise, en secondes. */
  maxBackoffSeconds?: number;
  log?: (msg: string) => void;
}

/**
 * Lit l'outbox et publie sur Mercure.
 *
 * Garanties : livraison AU MOINS UNE FOIS (les clients dédoublonnent par `eventId`) ; l'ordre
 * est respecté dans le cas normal. Après un échec, on n'envoie pas la suite de la MÊME portée
 * dans le lot courant, mais une reprise ultérieure peut inverser deux événements : les clients
 * doivent donc se fier à `seq`, pas à l'ordre d'arrivée.
 */
export class OutboxDispatcher {
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private readonly o: Required<Omit<DispatcherOptions, 'log'>> & { log: (m: string) => void };

  constructor(private readonly store: OutboxStore, private readonly publisher: EventPublisher, opts: DispatcherOptions = {}) {
    this.o = {
      batchSize: opts.batchSize ?? 50,
      pollIntervalMs: opts.pollIntervalMs ?? 500,
      leaseSeconds: opts.leaseSeconds ?? 30,
      maxAttempts: opts.maxAttempts ?? 10,
      maxBackoffSeconds: opts.maxBackoffSeconds ?? 300,
      log: opts.log ?? (() => {}),
    };
  }

  /** Traite un lot. Renvoie le nombre d'événements publiés. */
  async tick(): Promise<number> {
    const items = await this.store.claim(this.o.batchSize, this.o.leaseSeconds);
    const blockedScopes = new Set<string>();
    let published = 0;

    for (const item of items) {
      const scopeKey = `${item.envelope.realmId}|${item.envelope.scope}`;
      if (blockedScopes.has(scopeKey)) {
        await this.store.release(item.outboxId);
        continue;
      }
      try {
        await this.publisher.publish(item.envelope, item.topic, item.isPrivate);
        await this.store.markPublished(item.outboxId);
        published++;
      } catch (err) {
        blockedScopes.add(scopeKey);
        const delay = Math.min(2 ** item.attempts, this.o.maxBackoffSeconds);
        await this.store.markFailed(item.outboxId, (err as Error).message, delay, this.o.maxAttempts);
        this.o.log(`outbox ${item.outboxId} (${item.envelope.type}) échec tentative ${item.attempts}: ${(err as Error).message}`);
      }
    }
    return published;
  }

  start(): void {
    if (this.timer) return;
    const loop = async () => {
      if (this.running) return;
      this.running = true;
      try {
        // Vide l'arriéré avant de dormir.
        while ((await this.tick()) >= this.o.batchSize) { /* continue */ }
      } catch (err) {
        this.o.log(`dispatcher: ${(err as Error).message}`);
      } finally {
        this.running = false;
      }
    };
    this.timer = setInterval(loop, this.o.pollIntervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
