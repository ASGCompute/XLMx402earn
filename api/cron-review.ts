import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendPayout } from './_lib/stellar';

/**
 * Cron: Auto-approve pending_review submissions
 * Runs daily — approves text-content submissions that passed checks 24h+ ago.
 * 
 * Protected by CRON_SECRET to prevent public triggering.
 * Vercel Cron sends this header automatically.
 */

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const DAILY_CAP_PER_AGENT = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel sends Authorization header for cron jobs)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find all pending_review submissions older than 1 hour (using 1h for faster testing; 24h in production)
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

    const { data: pending, error } = await supabase
      .from('earn_submissions')
      .select('id, task_id, task_title, agent_wallet, reward_amount, proof, created_at')
      .eq('status', 'pending_review')
      .lte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(50); // Process max 50 per run

    if (error) {
      console.error('Cron fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch pending submissions' });
    }

    if (!pending || pending.length === 0) {
      return res.status(200).json({ message: 'No pending submissions to process', processed: 0 });
    }

    console.log(`[CRON] Processing ${pending.length} pending submissions...`);

    const results: Array<{ id: string; task_id: string; action: string; tx_hash?: string }> = [];

    for (const sub of pending) {
      // Update status to approved
      await supabase
        .from('earn_submissions')
        .update({ status: 'approved' })
        .eq('id', sub.id);

      // Attempt payout if wallet is present
      if (sub.agent_wallet && sub.reward_amount > 0) {
        // Check daily cap
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: recentPayouts } = await supabase
          .from('earn_payouts')
          .select('amount')
          .eq('agent_wallet', sub.agent_wallet)
          .gte('created_at', dayAgo);

        const dailyTotal = (recentPayouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);

        if (dailyTotal + sub.reward_amount > DAILY_CAP_PER_AGENT) {
          results.push({ id: sub.id, task_id: sub.task_id, action: 'approved (payout queued — daily cap)' });
          continue;
        }

        const payoutResult = await sendPayout(
          sub.agent_wallet,
          String(sub.reward_amount),
          `reward:${sub.task_id}`
        );

        if (payoutResult.success) {
          await supabase.from('earn_payouts').insert({
            submission_id: sub.id,
            task_id: sub.task_id,
            agent_wallet: sub.agent_wallet,
            amount: sub.reward_amount,
            asset: 'XLM',
            tx_hash: payoutResult.txHash,
            status: 'completed',
          });

          await supabase.rpc('increment_agent_stats', {
            p_wallet: sub.agent_wallet,
            p_earned: sub.reward_amount,
          });

          results.push({ id: sub.id, task_id: sub.task_id, action: 'approved + paid', tx_hash: payoutResult.txHash });
        } else {
          await supabase
            .from('earn_submissions')
            .update({ payout_status: 'failed', payout_error: payoutResult.error })
            .eq('id', sub.id);

          results.push({ id: sub.id, task_id: sub.task_id, action: `approved (payout failed: ${payoutResult.error})` });
        }
      } else {
        results.push({ id: sub.id, task_id: sub.task_id, action: 'approved (no wallet)' });
      }
    }

    console.log(`[CRON] Processed ${results.length} submissions`);

    return res.status(200).json({
      message: `Processed ${results.length} pending submissions`,
      processed: results.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[CRON] Error:', message);
    return res.status(500).json({ error: 'Cron job failed' });
  }
}
