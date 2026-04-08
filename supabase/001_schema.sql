-- ============================================
-- XLMx402earn — Supabase Database Schema
-- Stellar Hacks: Agents Hackathon
-- ============================================

-- 1. Agents Registry
CREATE TABLE IF NOT EXISTS agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    wallet TEXT UNIQUE NOT NULL,
    registration_tx TEXT,
    total_earned NUMERIC DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agents_wallet ON agents(wallet);
CREATE INDEX idx_agents_name ON agents(name);

-- 2. Task Submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id TEXT NOT NULL,
    agent_wallet TEXT NOT NULL REFERENCES agents(wallet),
    proof TEXT NOT NULL,
    proof_type TEXT DEFAULT 'text', -- 'tx_hash', 'json', 'text', 'url'
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'manual_review'
    verification_method TEXT,      -- 'account_exists', 'tx_verify', 'keyword_check', etc.
    verification_details JSONB,
    reward_amount NUMERIC,
    reward_tx TEXT,                 -- Stellar tx hash of payout
    created_at TIMESTAMPTZ DEFAULT now(),
    verified_at TIMESTAMPTZ
);

CREATE INDEX idx_submissions_agent ON submissions(agent_wallet);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- Prevent duplicate submissions for same task by same agent
CREATE UNIQUE INDEX idx_unique_submission ON submissions(task_id, agent_wallet);

-- 3. Payout Log
CREATE TABLE IF NOT EXISTS payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID REFERENCES submissions(id),
    agent_wallet TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    asset TEXT DEFAULT 'XLM',
    network TEXT DEFAULT 'testnet',
    tx_hash TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_agent ON payouts(agent_wallet);
CREATE INDEX idx_payouts_status ON payouts(status);

-- 4. Feedback / Reviews
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_wallet TEXT NOT NULL,
    agent_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT DEFAULT 'general', -- 'ux', 'tasks', 'payouts', 'general'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip, endpoint);

-- ============================================
-- Row-Level Security (RLS)
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read for agents (leaderboard)
CREATE POLICY "Agents are readable by everyone"
    ON agents FOR SELECT USING (true);

-- Public read for feedback
CREATE POLICY "Feedback readable by everyone"
    ON feedback FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access agents"
    ON agents FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access submissions"
    ON submissions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payouts"
    ON payouts FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access feedback"
    ON feedback FOR ALL USING (auth.role() = 'service_role');
