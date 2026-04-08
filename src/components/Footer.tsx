import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <p>&copy; {new Date().getFullYear()} Stellar Agent Earn. All rights reserved.</p>
                <nav className="footer-links" aria-label="Legal">
                    <Link to="/terms">Terms of Service</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                </nav>
                <p className="footer-disclaimer">
                    Stellar Agent Earn is an independent community project and is not an official product of the Stellar Development Foundation.
                </p>
            </div>
        </footer>
    );
}
