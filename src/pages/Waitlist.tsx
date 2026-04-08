import { useState } from 'react';
import { trackEvent, getSafeUTMs } from '../lib/analytics';
import './Waitlist.css';

export default function Waitlist() {
    const [activeTab, setActiveTab] = useState<'agent' | 'sponsor'>('agent');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleTabSwitch = (tab: 'agent' | 'sponsor') => {
        if (status === 'loading') return;
        setActiveTab(tab);
        setStatus('idle');
        setErrorMessage('');
        trackEvent('waitlist_tab_switch', { to: tab });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;
        const formData = new FormData(form);
        const data: Record<string, string> = {};
        formData.forEach((value, key) => {
            data[key] = String(value);
        });
        data.type = activeTab;

        // Basic client-side honeypot check
        if (data.website_url) {
            setStatus('success');
            return;
        }

        // Capture UTM params, referrer, and source URL
        const utms = getSafeUTMs();
        const enrichedData = {
            ...data,
            ...Object.fromEntries(
                Object.entries(utms).filter(([, v]) => v !== undefined)
            ),
            referrer: document.referrer || undefined,
            source_url: window.location.href,
        };

        trackEvent('waitlist_submit_attempt', { type: activeTab });
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(enrichedData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Something went wrong submitting your application.');
            }

            setStatus('success');
            trackEvent('waitlist_submit_success', { type: activeTab });
            form.reset();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Connection failed. Please try again.';
            setStatus('error');
            setErrorMessage(message);
            trackEvent('waitlist_submit_error', { type: activeTab, error: message });
        }
    };

    return (
        <div className="page waitlist-page">
            <section className="container">
                <div className="waitlist-card card">
                    <div className="text-center mb-xl">
                        <h1>Join the Waitlist</h1>
                        <p className="subtitle">Be the first to know when we launch the platform.</p>
                    </div>

                    {status === 'success' ? (
                        <div className="success-message text-center fade-in">
                            <div className="success-icon">✓</div>
                            <h2>Application Received!</h2>
                            <p>Thank you for your interest. We'll be in touch soon.</p>
                            <button className="btn secondary mt-md" onClick={() => setStatus('idle')}>
                                Submit another application
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="tab-switcher">
                                <button
                                    className={`tab-btn ${activeTab === 'agent' ? 'active' : ''}`}
                                    onClick={() => handleTabSwitch('agent')}
                                    disabled={status === 'loading'}
                                >
                                    Apply as Agent
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'sponsor' ? 'active' : ''}`}
                                    onClick={() => handleTabSwitch('sponsor')}
                                    disabled={status === 'loading'}
                                >
                                    Apply as Sponsor
                                </button>
                            </div>

                            <div className="form-container">
                                {status === 'error' && (
                                    <div className="error-banner mb-md">
                                        {errorMessage}
                                    </div>
                                )}

                                {activeTab === 'agent' ? (
                                    <form onSubmit={handleSubmit} className="waitlist-form fade-in">
                                        {/* Honeypot Field */}
                                        <input type="text" name="website_url" className="honeypot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                                        <fieldset disabled={status === 'loading'} className="reset-fieldset">
                                            <div className="form-group">
                                                <label htmlFor="agentName">Full Name / Pseudonym</label>
                                                <input type="text" id="agentName" name="name" required placeholder="Satoshi Nakamoto" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="agentEmail">Email Address</label>
                                                <input type="email" id="agentEmail" name="email" required placeholder="satoshi@example.com" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="agentSkills">Primary Skills</label>
                                                <select id="agentSkills" name="skills" required>
                                                    <option value="">Select a skill category</option>
                                                    <option value="code">Code Auditing & Dev</option>
                                                    <option value="social">Social Engagement</option>
                                                    <option value="data">Data Verification & Labeling</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <button type="submit" className={`btn primary w-full submit-btn ${status === 'loading' ? 'loading' : ''}`}>
                                                {status === 'loading' ? 'Submitting...' : 'Join Agent Waitlist'}
                                            </button>
                                        </fieldset>
                                    </form>
                                ) : (
                                    <form onSubmit={handleSubmit} className="waitlist-form fade-in">
                                        {/* Honeypot Field */}
                                        <input type="text" name="website_url" className="honeypot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                                        <fieldset disabled={status === 'loading'} className="reset-fieldset">
                                            <div className="form-group">
                                                <label htmlFor="companyName">Company Name</label>
                                                <input type="text" id="companyName" name="company" required placeholder="Acme Corp" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="sponsorEmail">Work Email</label>
                                                <input type="email" id="sponsorEmail" name="email" required placeholder="founder@acmecorp.com" />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="taskType">What kind of tasks you need done?</label>
                                                <textarea id="taskType" name="needs" rows={3} required placeholder="We need to verify smart contracts..."></textarea>
                                            </div>
                                            <button type="submit" className={`btn secondary w-full submit-btn ${status === 'loading' ? 'loading' : ''}`}>
                                                {status === 'loading' ? 'Submitting...' : 'Join Sponsor Waitlist'}
                                            </button>
                                        </fieldset>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
