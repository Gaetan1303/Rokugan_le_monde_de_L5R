import type { EventEnvelope } from '../contract/index.js';
import type { RealtimeConfig } from './config.js';
import { mintToken } from './tokens.js';

/** Abstraction de publication : permet de tester le dispatcher sans hub. */
export interface EventPublisher {
  publish(envelope: EventEnvelope, topic: string, isPrivate: boolean): Promise<void>;
}

export class PublishError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'PublishError';
  }
}

export interface MercurePublisherOptions {
  hubUrl: string;
  publisherKey: string;
  /** Protocole et identité du hub. Par défaut : Mercure 1.x, émetteur https://localhost. */
  protocol?: RealtimeConfig['protocol'];
  issuer?: string;
  audience?: string;
  /** Délai max d'une requête de publication. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Publie sur un hub Mercure (POST application/x-www-form-urlencoded + JWT éditeur). */
export class MercurePublisher implements EventPublisher {
  private cachedToken: { value: string; expiresAt: number } | null = null;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: MercurePublisherOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private token(): string {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt - now > 60_000) return this.cachedToken.value;
    const ttlSeconds = 600;
    const protocol = this.opts.protocol ?? '1';
    const issuer = this.opts.issuer ?? 'https://localhost';
    const value = mintToken({ protocol, issuer }, {
      role: 'publish',
      topics: ['*'],
      key: this.opts.publisherKey,
      audience: this.opts.audience ?? this.opts.hubUrl,
      subject: 'rokugan-backend',
      ttlSeconds,
    });
    this.cachedToken = { value, expiresAt: now + ttlSeconds * 1000 };
    return value;
  }

  async publish(envelope: EventEnvelope, topic: string, isPrivate: boolean): Promise<void> {
    const body = new URLSearchParams();
    body.set('topic', topic);
    body.set('data', JSON.stringify(envelope));
    body.set('id', envelope.eventId);
    body.set('type', envelope.type);
    if (isPrivate) body.set('private', 'on');

    let res: Response;
    try {
      res = await this.fetchImpl(this.opts.hubUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token()}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 5000),
      });
    } catch (err) {
      throw new PublishError(`Hub Mercure injoignable : ${(err as Error).message}`);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new PublishError(`Hub Mercure a répondu ${res.status} ${text.slice(0, 200)}`, res.status);
    }
  }
}

/** Publisher sans effet (Mercure désactivé, tests). */
export class NullPublisher implements EventPublisher {
  async publish(): Promise<void> {}
}
