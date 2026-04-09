import { useState, useEffect } from 'react';

interface JournalEntry {
  id: string;
  task_id: string;
  task_title: string;
  agent_wallet: string;
  status: string;
  verify_type: string;
  reward_amount: number;
  created_at: string;
}

const API_BASE = 'https://stellar-agent-earn.vercel.app';

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending_review' | 'rejected'>('all');

  useEffect(() => {
    fetch(`${API_BASE}/api/submissions`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.submissions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.status === filter);

  const stats = {
    total: entries.length,
    approved: entries.filter((e) => e.status === 'approved').length,
    pending: entries.filter((e) => e.status === 'pending_review').length,
    rejected: entries.filter((e) => e.status === 'rejected').length,
    totalXLM: entries.filter((e) => e.status === 'approved').reduce((s, e) => s + (e.reward_amount || 0), 0),
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'approved': return '✅';
      case 'pending_review': return '⏳';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  const statusClass = (s: string) => {
    switch (s) {
      case 'approved': return 'journal-status-approved';
      case 'pending_review': return 'journal-status-pending';
      case 'rejected': return 'journal-status-rejected';
      default: return '';
    }
  };

  const shortWallet = (w: string) => w ? `${w.slice(0, 4)}...${w.slice(-4)}` : '—';

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="page-container" style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          📋 Activity Journal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.5rem' }}>
          Real-time feed of all task submissions, verifications, and payouts across the marketplace.
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Submissions', value: stats.total, color: '#94a3b8' },
          { label: 'Approved', value: stats.approved, color: '#4ade80' },
          { label: 'Pending Review', value: stats.pending, color: '#fbbf24' },
          { label: 'Rejected', value: stats.rejected, color: '#f87171' },
          { label: 'XLM Paid Out', value: `${stats.totalXLM}`, color: '#60a5fa' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(30,30,50,0.6)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['all', 'approved', 'pending_review', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? 'chip-active' : ''}`}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: filter === f ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? 'All' : f === 'pending_review' ? '⏳ Pending' : f === 'approved' ? '✅ Approved' : '❌ Rejected'}
          </button>
        ))}
      </div>

      {/* Journal Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 24, height: 24, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          Loading journal...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No submissions found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className={`journal-entry ${statusClass(entry.status)}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5rem 1fr auto',
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'rgba(30,30,50,0.5)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
            >
              {/* Status Icon */}
              <div style={{ fontSize: '1.3rem', textAlign: 'center' }}>
                {statusIcon(entry.status)}
              </div>

              {/* Task Info */}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {entry.task_title || entry.task_id}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{shortWallet(entry.agent_wallet)}</span>
                  <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>•</span>
                  <span>{entry.verify_type === 'auto' ? '⚡ Auto-verified' : entry.verify_type === 'semi' ? '🔍 Semi-auto' : '👤 Manual review'}</span>
                  <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>•</span>
                  <span>{timeAgo(entry.created_at)}</span>
                </div>
              </div>

              {/* Reward */}
              <div style={{ textAlign: 'right' }}>
                {entry.status === 'approved' && entry.reward_amount > 0 ? (
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#4ade80' }}>
                    +{entry.reward_amount} XLM
                  </div>
                ) : entry.status === 'pending_review' ? (
                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 500 }}>
                    pending
                  </div>
                ) : entry.status === 'rejected' ? (
                  <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 500 }}>
                    failed
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .journal-entry:hover {
          transform: translateY(-1px);
          border-color: rgba(255,255,255,0.12) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
