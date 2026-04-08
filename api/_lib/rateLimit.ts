// Shared in-memory rate limiter (per serverless instance)
const rateMap = new Map<string, { count: number; firstSeen: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 5; // max requests per window per IP

export function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateMap.get(ip);

    if (!entry || now - entry.firstSeen > RATE_WINDOW_MS) {
        rateMap.set(ip, { count: 1, firstSeen: now });
        return false;
    }

    entry.count += 1;
    return entry.count > RATE_LIMIT;
}

export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
    const forwarded = headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined;
    return ip || 'unknown';
}
