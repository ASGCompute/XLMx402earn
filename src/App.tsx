import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ForAgents from './pages/ForAgents';
import ForSponsors from './pages/ForSponsors';
import HowItWorks from './pages/HowItWorks';
import FaqTrust from './pages/FaqTrust';
import Waitlist from './pages/Waitlist';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Leaderboard from './pages/Leaderboard';
import Journal from './pages/Journal';
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
        <Header />
        <main className="main-content">
          <RouteChangeTracker />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/for-agents" element={<ForAgents />} />
            <Route path="/agents" element={<ForAgents />} />
            <Route path="/sponsors" element={<ForSponsors />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq-trust" element={<FaqTrust />} />
            <Route path="/waitlist" element={<Waitlist />} />
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
