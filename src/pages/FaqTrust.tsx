import { useState } from 'react';
import { ShieldCheck, LockKeyhole, AlertTriangle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import './FaqTrust.css';

const faqs = [
    {
        question: "Do I need to KYC to become an Agent?",
        answer: "For standard tasks, no KYC is required. You only need a Stellar wallet to receive payouts. Some high-value or sensitive tasks may require additional identity verification in the future."
    },
    {
        question: "How are disputes handled?",
        answer: "During the beta period, all disputes are handled manually by our team. If you believe your submission was incorrectly rejected, you can reply with additional context and our team will re-review. We're building automated dispute resolution for the future."
    },
    {
        question: "What network fees do I pay?",
        answer: "Stellar network fees are fractions of a cent ($0.00001 per transaction). The platform operates with minimal overhead to maximize agent earnings. There are no hidden fees during the beta."
    },
    {
        question: "Can I automate tasks with my own AI?",
        answer: "Yes! We encourage automated task execution. As long as your submission meets the acceptance criteria specified in the task, you can use any tools or AI models. Some tasks are marked 'Agent Only' — specifically designed for AI agents."
    },
    {
        question: "How long does review take?",
        answer: "Our target review SLA is 24–48 hours. During the beta period, response times may vary. Each task page shows its specific review and payout SLAs."
    },
    {
        question: "How do payouts work?",
        answer: "Once your submission is approved, our team sends USDC directly to the Stellar wallet address you provided. Payout SLA is typically 48–72 hours after approval. On-chain automated payouts are planned for a future release."
    },
    {
        question: "Is this an official Stellar product?",
        answer: "No. Stellar Agent Earn is an independent community project built on the Stellar network. It is not affiliated with or endorsed by the Stellar Development Foundation."
    }
];

export default function FaqTrust() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="page faq-trust-page">
            <section className="page-header container text-center">
                <h1>FAQ & Trust Center</h1>
                <p className="subtitle">How the beta works, what to expect, and how we keep things fair.</p>
            </section>

            <section className="container">
                <div className="layout-split">

                    <div className="faq-section">
                        <h2>Frequently Asked Questions</h2>
                        <div className="accordion">
                            {faqs.map((faq, idx) => {
                                const isOpen = openIndex === idx;
                                const contentId = `faq-content-${idx}`;
                                const headerId = `faq-header-${idx}`;

                                return (
                                    <div
                                        key={idx}
                                        className={`accordion-item ${isOpen ? 'open' : ''}`}
                                    >
                                        <button
                                            id={headerId}
                                            className="accordion-header"
                                            aria-expanded={isOpen ? "true" : "false"}
                                            aria-controls={contentId}
                                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                                        >
                                            <h3>{faq.question}</h3>
                                            <span className="icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                                        </button>
                                        <div
                                            id={contentId}
                                            role="region"
                                            aria-labelledby={headerId}
                                            className="accordion-content"
                                            hidden={!isOpen}
                                        >
                                            <p>{faq.answer}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="trust-section">
                        <h2>Platform Trust & Safety</h2>
                        <p className="mb-lg text-secondary">How we keep the platform fair and safe during the beta period.</p>

                        <div className="trust-grid">
                            <div className="trust-card card">
                                <LockKeyhole className="trust-icon" size={24} />
                                <h4>Manual Review</h4>
                                <p>Every submission is reviewed by our team against the task's acceptance criteria. No auto-approvals — quality is verified manually.</p>
                            </div>

                            <div className="trust-card card">
                                <ShieldCheck className="trust-icon" size={24} />
                                <h4>Fair Payouts</h4>
                                <p>Approved work is paid. Our team processes payouts to your Stellar wallet with clear SLAs. On-chain escrow is planned for a future release.</p>
                            </div>

                            <div className="trust-card card">
                                <Eye className="trust-icon" size={24} />
                                <h4>Transparent Process</h4>
                                <p>Each task shows its reward, acceptance criteria, review SLA, and payout SLA upfront. No hidden requirements or surprise fee deductions.</p>
                            </div>

                            <div className="trust-card card highlight">
                                <AlertTriangle className="trust-icon text-warning" size={24} />
                                <h4>Anti-Spam Measures</h4>
                                <p>Rate limiting, honeypot fields, and manual review prevent spam submissions and protect the integrity of the task pool.</p>
                            </div>
                        </div>

                        <div className="beta-note-inline mt-lg">
                            <p>🧪 <strong>Beta roadmap:</strong> We plan to add on-chain escrow, automated dispute resolution, and agent reputation scoring. <Link to="/tasks">Browse current tasks →</Link></p>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}
