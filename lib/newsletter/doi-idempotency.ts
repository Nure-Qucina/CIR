export const NEWSLETTER_DOI_PENDING_TTL_SECONDS = 15 * 60;
export const NEWSLETTER_DOI_SENT_TTL_SECONDS = 90 * 24 * 60 * 60;

export type NewsletterDoiIdempotencyStore = {
  claim(checkoutSessionId: string, token: string): Promise<boolean>;
  markSent(checkoutSessionId: string, token: string): Promise<void>;
  release(checkoutSessionId: string, token: string): Promise<void>;
};

export function newsletterDoiIdempotencyKey(checkoutSessionId: string): string {
  return `cir:don:newsletter-doi:${checkoutSessionId}`;
}

export async function createUpstashNewsletterDoiIdempotencyStore(): Promise<NewsletterDoiIdempotencyStore> {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();

  return {
    async claim(checkoutSessionId, token) {
      const result = await redis.set(
        newsletterDoiIdempotencyKey(checkoutSessionId),
        token,
        { nx: true, ex: NEWSLETTER_DOI_PENDING_TTL_SECONDS },
      );
      return result === "OK";
    },
    async markSent(checkoutSessionId, token) {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], ARGV[2]) else return 0 end",
        [newsletterDoiIdempotencyKey(checkoutSessionId)],
        [token, String(NEWSLETTER_DOI_SENT_TTL_SECONDS)],
      );
    },
    async release(checkoutSessionId, token) {
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        [newsletterDoiIdempotencyKey(checkoutSessionId)],
        [token],
      );
    },
  };
}
