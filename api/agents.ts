import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyTransaction, accountExists } from './_lib/stellar';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return handleGetAgents(req, res);
  }

  if (req.method === 'POST') {
    return handleRegister(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * GET /api/agents — list agents (leaderboard)
 */
async function handleGetAgents(_req: VercelRequest, res: VercelResponse) {
  const { data, error } = await supabase
    .from('agents')
    .select('id, name, wallet, total_earned, tasks_completed, created_at')
    .order('total_earned', { ascending: false })
    .limit(50);

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }

  return res.status(200).json({
    agents: data || [],
    count: data?.length || 0,
  });
}

/**
 * POST /api/agents — register a new agent
 * Body: { name, wallet, reg_tx }
 */
async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { name, wallet, reg_tx } = req.body || {};

  // Validate inputs
  if (!name || !wallet) {
    return res.status(400).json({ error: 'name and wallet are required' });
  }

  // Validate agent name (3-20 chars, alphanumeric + hyphens)
  if (!/^[a-zA-Z0-9\-]{3,20}$/.test(name)) {
    return res.status(400).json({
      error: 'Agent name must be 3-20 characters, alphanumeric and hyphens only',
    });
  }

  // Validate Stellar address format
  if (!/^G[A-Z2-7]{55}$/.test(wallet)) {
    return res.status(400).json({ error: 'Invalid Stellar public key format' });
  }

  // Check if wallet already registered (1 wallet = 1 agent)
  const { data: existingByWallet } = await supabase
    .from('agents')
    .select('id')
    .eq('wallet', wallet)
    .maybeSingle();

  if (existingByWallet) {
    return res.status(409).json({ error: 'This wallet is already registered' });
  }

  // Check if name is taken
  const { data: existingByName } = await supabase
    .from('agents')
    .select('id')
    .eq('name', name)
    .maybeSingle();

  if (existingByName) {
    return res.status(409).json({ error: 'Agent name already taken. Choose another.' });
  }

  // Verify the account exists on testnet
  const exists = await accountExists(wallet);
  if (!exists) {
    return res.status(400).json({
      error: 'Wallet not found on Stellar testnet. Fund via Friendbot first.',
    });
  }

  // Optional: Verify registration payment (if reg_tx provided)
  let regVerified = false;
  if (reg_tx) {
    const escrowPubkey = process.env.STELLAR_ESCROW_PUBLIC_KEY || '';
    const verification = await verifyTransaction(reg_tx, {
      expectedFrom: wallet,
      expectedTo: escrowPubkey,
      expectedAmount: '0.5000000',
      maxAgeSeconds: 3600,
    });
    regVerified = verification.valid;
    if (!regVerified) {
      return res.status(400).json({
        error: `Registration payment verification failed: ${verification.reason}`,
      });
    }
  }

  // Insert agent
  const { data: agent, error } = await supabase
    .from('agents')
    .insert({
      name,
      wallet,
      reg_tx: reg_tx || null,
      reg_verified: regVerified,
      total_earned: 0,
      tasks_completed: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Agent insert error:', error);
    return res.status(500).json({ error: 'Failed to register agent' });
  }

  return res.status(201).json({
    success: true,
    message: `Welcome, ${name}! Your agent is registered.`,
    agent: {
      id: agent.id,
      name: agent.name,
      wallet: agent.wallet,
      total_earned: 0,
      tasks_completed: 0,
    },
  });
}
