/**
 * In-memory rate limiter for Vercel serverless functions.
 * No external dependencies — each cold start resets the window.
 * This is fine for hackathon scale (< 1000 RPM).
 */

const windowMs = 60_000; // 1 minute
const maxRequests = 30;

// In-memory store: ip -> { count, windowStart }
const store: Map<string, { count: number; windowStart: number }> = new Map();

/**
 * Extract client IP from request headers (works on Vercel).
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
    const forwarded = headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0].split(',')[0].trim();
    }
    const real = headers['x-real-ip'];
    if (typeof real === 'string') return real;
    return '127.0.0.1';
}

/**
 * Check if an IP is rate limited.
 * Returns true if the IP should be blocked.
 */
export function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
        // New window
        store.set(ip, { count: 1, windowStart: now });
        return false;
    }

    entry.count++;
    if (entry.count > maxRequests) {
        return true;
    }

    return false;
}
