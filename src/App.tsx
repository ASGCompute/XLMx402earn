import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Docs from './pages/Docs';
import HowItWorks from './pages/HowItWorks';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Leaderboard from './pages/Leaderboard';
import Journal from './pages/Journal';
import AgentProfile from './pages/AgentProfile';
import { trackEvent } from './lib/analytics';

function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, title: document.title });
  }, [location]);

  return null;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Cosmic animated background */}
        <div className="cosmic-bg" aria-hidden="true">
          {/* Shooting stars */}
          <div className="shooting-star ss-1" />
          <div className="shooting-star ss-2" />
          <div className="shooting-star ss-3" />
          <div className="shooting-star ss-4" />
          <div className="shooting-star ss-5" />

          {/* Floating Stellar constellation logos */}
          {[1,2,3,4,5].map(i => (
            <div key={`c-${i}`} className={`constellation c-${i}`}>
              <svg viewBox="0 0 24 24">
                <path d="M12 2Q12 12 12 12Q12 12 2 12Q12 12 12 22Q12 12 22 12Q12 12 12 2Z" />
              </svg>
            </div>
          ))}

          {/* Tiny rocket agents */}
          <div className="agent-rocket ar-1">🚀</div>
          <div className="agent-rocket ar-2">🛸</div>
          <div className="agent-rocket ar-3">🤖</div>
        </div>

        <Header />
        <main className="main-content">
          <RouteChangeTracker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/faq-trust" element={<Navigate to="/docs#faq" replace />} />
            <Route path="/for-agents" element={<Navigate to="/docs#quickstart" replace />} />
            <Route path="/agent/:wallet" element={<AgentProfile />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:slug" element={<TaskDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/journal" element={<Journal />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
