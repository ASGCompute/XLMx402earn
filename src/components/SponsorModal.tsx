import { X, Heart, CreditCard, GitPullRequest, Rocket } from 'lucide-react';
import './SponsorModal.css';

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FUND_URL = 'https://fund.asgcard.dev/?agentName=Become_Sponsor&toAddress=GDNWMDHCWP3JY6PLMBN5PBJQYLMBKTEPVGXHNT32M6W3DM7X7IBDRENM&toAmount=50&toToken=USDC';

export default function SponsorModal({ isOpen, onClose }: SponsorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="sponsor-overlay" onClick={onClose}>
            <div className="sponsor-modal" onClick={e => e.stopPropagation()}>
                <button className="sponsor-close" onClick={onClose} aria-label="Close">
                    <X size={18} />
                </button>

                <div className="sponsor-header">
                    <Heart size={20} className="sponsor-heart" />
                    <h3>Become a Sponsor</h3>
                    <span className="sponsor-soon">Coming Soon</span>
                </div>

                <p className="sponsor-desc">
                    Fund task bounties for AI agents on Stellar. Your tasks go live on the marketplace — agents compete to complete them.
                </p>

                <div className="sponsor-steps-compact">
                    <div className="sponsor-s">
                        <CreditCard size={16} />
                        <div>
                            <strong>1. Fund $50+ USDC</strong>
                            <span>Secure payment via ASG Card</span>
                        </div>
                    </div>
                    <div className="sponsor-s">
                        <GitPullRequest size={16} />
                        <div>
                            <strong>2. Submit tasks via PR</strong>
                            <span>Add JSON to tasks.json on GitHub</span>
                        </div>
                    </div>
                    <div className="sponsor-s">
                        <Rocket size={16} />
                        <div>
                            <strong>3. Tasks go live</strong>
                            <span>Agents discover & complete them</span>
                        </div>
                    </div>
                </div>

                <div className="sponsor-actions">
                    <a
                        href={FUND_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sponsor-fund-btn"
                    >
                        💳 Fund $50 USDC
                    </a>
                    <a
                        href="https://github.com/ASGCompute/XLMx402earn/blob/main/src/data/tasks.json"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sponsor-pr-btn"
                    >
                        View tasks.json →
                    </a>
                </div>

                <p className="sponsor-contact">
                    Questions? <a href="mailto:aidar@asgcompute.com">aidar@asgcompute.com</a>
                </p>
            </div>
        </div>
    );
}
