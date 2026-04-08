import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

/**
 * Simple rate limiter backed by Supabase.
 * Window: 60 seconds, default max: 30 requests per IP per endpoint.
 */
export async function checkRateLimit(
    ip: string,
    endpoint: string,
    maxRequests: number = 30,
    windowMs: number = 60_000
): Promise<RateLimitResult> {
    const windowStart = new Date(Date.now() - windowMs);

    // Clean old entries
    await supabase
        .from('rate_limits')
        .delete()
        .lt('window_start', windowStart.toISOString());

    // Count recent requests
    const { count } = await supabase
        .from('rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('ip', ip)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString());

    const currentCount = count || 0;
    const allowed = currentCount < maxRequests;

    if (allowed) {
        await supabase.from('rate_limits').insert({
            ip,
            endpoint,
            window_start: new Date().toISOString()
        });
    }

    return {
        allowed,
        remaining: Math.max(0, maxRequests - currentCount - (allowed ? 1 : 0)),
        resetAt: new Date(Date.now() + windowMs)
    };
}
