import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import './Header.css';

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        const newStatus = !isMenuOpen;
        setIsMenuOpen(newStatus);
        trackEvent('mobile_menu_toggle', { action: newStatus ? 'open' : 'close' });
    };

    return (
        <header className="header sticky">
            <div className="header-container">
                <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
                    <span className="logo-x402">x402</span>
                    <span className="logo-dot"></span>
                    <span className="logo-xlm">XLM</span>
                </Link>

                <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
                    <Link to="/tasks" onClick={() => setIsMenuOpen(false)}>Tasks</Link>
                    <Link to="/leaderboard" onClick={() => setIsMenuOpen(false)}>Leaderboard</Link>
                    <Link to="/for-agents" onClick={() => setIsMenuOpen(false)}>For Agents</Link>
                    <Link to="/faq-trust" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                </nav>

                <div className="header-actions">
                    <Link
                        to="/tasks"
                        className="btn primary cta-button"
                        onClick={() => {
                            trackEvent('header_cta_click', { from_path: window.location.pathname });
                            setIsMenuOpen(false);
                        }}
                    >
                        Start Earning
                    </Link>

                    <button
                        className="mobile-menu-btn"
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen ? "true" : "false"}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </header>
    );
}
