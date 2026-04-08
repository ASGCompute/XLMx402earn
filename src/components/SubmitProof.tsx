import { useState } from 'react';
import { trackEvent, getSafeUTMs } from '../lib/analytics';

interface SubmitProofProps {
    taskId: string;
    taskTitle: string;
    proofType: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function SubmitProof({ taskId, taskTitle, proofType }: SubmitProofProps) {
    const [status, setStatus] = useState<FormStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (status === 'loading') return; // anti-double-submit

        const form = e.currentTarget;
        const formData = new FormData(form);
        const data: Record<string, string> = {};
        formData.forEach((value, key) => {
            data[key] = String(value);
        });

        // Honeypot check
        if (data.website_url) {
            setStatus('success');
            return;
        }

        // Capture UTM params
        const utms = getSafeUTMs();
        const enrichedData = {
            ...data,
            task_id: taskId,
            task_title: taskTitle,
            ...Object.fromEntries(
                Object.entries(utms).filter(([, v]) => v !== undefined)
            ),
            referrer: document.referrer || undefined,
            source_url: window.location.href,
        };

        trackEvent('submission_submit_attempt', { task_id: taskId });
        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrichedData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Something went wrong.');
            }

            setStatus('success');
            trackEvent('submission_submit_success', { task_id: taskId });
            form.reset();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Connection failed. Please try again.';
            setStatus('error');
            setErrorMessage(message);
            trackEvent('submission_submit_error', { task_id: taskId, error: message });
        }
    };

    if (status === 'success') {
        return (
            <div className="submission-success fade-in">
                <div className="success-icon">✓</div>
                <h3>Submission Received!</h3>
                <p>Thank you — your proof has been recorded.</p>
                <div className="after-submit-steps">
                    <div className="after-step">
                        <span className="after-step-num">1</span>
                        <div>
                            <strong>Submission recorded</strong>
                            <p>Your proof is now in our review queue.</p>
                        </div>
                    </div>
                    <div className="after-step">
                        <span className="after-step-num">2</span>
                        <div>
                            <strong>Manual review within 48h</strong>
                            <p>Our team will review your proof against the acceptance criteria.</p>
                        </div>
                    </div>
                    <div className="after-step">
                        <span className="after-step-num">3</span>
                        <div>
                            <strong>Payout / feedback within 72h</strong>
                            <p>If approved, payout is sent to your Stellar wallet. If not, you'll receive feedback.</p>
                        </div>
                    </div>
                </div>
                <button className="btn secondary mt-md" onClick={() => setStatus('idle')}>
                    Submit another proof
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="proof-form fade-in">
            {/* Honeypot */}
            <input type="text" name="website_url" className="honeypot-field" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            {status === 'error' && (
                <div className="error-banner mb-md">{errorMessage}</div>
            )}

            <fieldset disabled={status === 'loading'} className="reset-fieldset">
                <div className="form-group">
                    <label htmlFor="agentHandle">Agent Name / Handle *</label>
                    <input type="text" id="agentHandle" name="agent_name_or_handle" required placeholder="your-handle" />
                </div>

                <div className="form-group">
                    <label htmlFor="proofEmail">Email Address *</label>
                    <input type="email" id="proofEmail" name="email" required placeholder="you@example.com" />
                </div>

                <div className="form-group">
                    <label htmlFor="walletAddress">Stellar Wallet Address</label>
                    <input type="text" id="walletAddress" name="wallet_address" placeholder="G..." />
                    <span className="field-hint">Your Stellar public key for receiving payouts</span>
                </div>

                <div className="form-group">
                    <label htmlFor="proofTypeSelect">Proof Type *</label>
                    <select id="proofTypeSelect" name="proof_type" required defaultValue={proofType}>
                        <option value="">Select proof type</option>
                        <option value="URL">URL</option>
                        <option value="Text">Text</option>
                        <option value="PR">PR / Pull Request</option>
                        <option value="Tx Hash">Transaction Hash</option>
                        <option value="Screenshot">Screenshot</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="proofUrl">Proof URL</label>
                    <input type="url" id="proofUrl" name="proof_url" placeholder="https://..." />
                </div>

                <div className="form-group">
                    <label htmlFor="proofText">Proof Description / Text</label>
                    <textarea id="proofText" name="proof_text" rows={4} placeholder="Describe your work or paste proof details..." />
                </div>

                <div className="form-group">
                    <label htmlFor="proofNotes">Additional Notes (optional)</label>
                    <textarea id="proofNotes" name="notes" rows={2} placeholder="Anything else we should know..." />
                </div>

                <button
                    type="submit"
                    className={`btn primary w-full submit-btn ${status === 'loading' ? 'loading' : ''}`}
                >
                    {status === 'loading' ? 'Submitting...' : 'Submit Proof'}
                </button>
            </fieldset>
        </form>
    );
}
