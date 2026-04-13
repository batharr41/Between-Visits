import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Activity, AlertCircle, CheckCircle, Shield, FileText,
  Bell, Users, ChevronRight, ArrowRight, Heart, Clock,
  Smartphone, BarChart3, Zap, X, Eye, TrendingUp
} from 'lucide-react';
import './Landing.css';

function BetweenVisitsLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="#2563eb"/>
      <path d="M60 25C41.775 25 27 39.775 27 58C27 76.225 41.775 91 60 91C78.225 91 93 76.225 93 58C93 39.775 78.225 25 60 25Z" fill="none" stroke="white" strokeWidth="4"/>
      <path d="M60 38V58L72 70" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="60" cy="58" r="4" fill="white"/>
      <path d="M38 95L42 85" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 95L78 85" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round"/>
      <rect x="50" y="18" width="20" height="8" rx="3" fill="white"/>
    </svg>
  );
}

function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  var score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#dc2626' };
  if (score <= 3) return { level: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 4) return { level: 3, label: 'Good', color: '#eab308' };
  if (score <= 5) return { level: 4, label: 'Strong', color: '#16a34a' };
  return { level: 5, label: 'Very Strong', color: '#059669' };
}

function LoginPanel({ isOpen, onClose }) {
  var { signIn, signUp } = useAuth();
  var navigate = useNavigate();
  var _mode = useState('login');
  var mode = _mode[0], setMode = _mode[1];
  var _email = useState('');
  var email = _email[0], setEmail = _email[1];
  var _password = useState('');
  var password = _password[0], setPassword = _password[1];
  var _loading = useState(false);
  var loading = _loading[0], setLoading = _loading[1];
  var _error = useState(null);
  var error = _error[0], setError = _error[1];
  var _message = useState(null);
  var message = _message[0], setMessage = _message[1];

  var strength = getPasswordStrength(password);

  var handleSubmit = async function(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === 'login') {
      var result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else {
        navigate('/dashboard');
      }
    } else {
      if (strength.level < 3) {
        setError('Password must be at least 10 characters with uppercase, lowercase, a number, and a special character.');
        setLoading(false);
        return;
      }
      var result2 = await signUp(email, password);
      if (result2.error) {
        setError(result2.error.message);
        setLoading(false);
      } else {
        setMessage('Account created! Check your email to confirm, then log in.');
        setMode('login');
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className={'login-overlay ' + (isOpen ? 'open' : '')} onClick={onClose} />
      <div className={'login-panel ' + (isOpen ? 'open' : '')}>
        <button className="login-panel-close" onClick={onClose}>
          <X size={24} />
        </button>
        <div className="login-panel-content">
          <div className="login-logo">
            <BetweenVisitsLogo size={48} />
            <h2 className="login-title">BetweenVisits</h2>
            <p className="login-subtitle">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>
          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-success">{message}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }} placeholder="you@agency.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={function(e) { setPassword(e.target.value); }} placeholder="--------" required minLength={mode === "signup" ? 10 : 1} />
              {mode === 'signup' && password.length > 0 && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map(function(i) {
                      return (<div key={i} className="strength-bar" style={{ background: i <= strength.level ? strength.color : '#e2e8f0' }} />);
                    })}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
              {mode === 'signup' && (
                <p className="password-hint">Minimum 10 characters with uppercase, lowercase, number, and symbol</p>
              )}
            </div>
            <button type="submit" className="login-panel-btn" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p className="login-toggle">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={function() { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }} className="login-toggle-btn">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

export default function LandingPage() {
  var { user, startDemo } = useAuth();
  var navigate = useNavigate();
  var _searchParams = useSearchParams();
  var searchParams = _searchParams[0];
  var _loginOpen = useState(false);
  var loginOpen = _loginOpen[0], setLoginOpen = _loginOpen[1];

  useEffect(function() {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(function() {
    if (searchParams.get('login') !== null || window.location.pathname === '/login') {
      setLoginOpen(true);
    }
  }, [searchParams]);

  function handleTryDemo() {
    startDemo();
    navigate('/dashboard');
  }

  return (
    <div className="landing">
      <LoginPanel isOpen={loginOpen} onClose={function() { setLoginOpen(false); }} />

      {/* ===== NAV ===== */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span>BetweenVisits</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Resources</a>
            <button onClick={function() { setLoginOpen(true); }} className="nav-signup-btn">Sign Up</button>
            <button onClick={handleTryDemo} className="nav-demo-btn">Demo</button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="landing-hero">
        <div className="hero-grid">
          <div>
            <div className="hero-badge">
              <Shield size={14} />
              Patient Guardian AI
            </div>
            <h1>Catch Health Risks <br /><em className="hero-highlight">Before</em> They Become Emergencies</h1>
            <p className="hero-subtitle">
              Advanced AI oversight for high-risk patients. Our sanctuary protection engine continuously monitors signals to provide healthcare providers with clinical foresight.
            </p>
            <button onClick={function() { setLoginOpen(true); }} className="hero-cta-btn">
              Try It Free — 14 Days
            </button>
          </div>
          <div className="hero-image-wrapper">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk7OEeAIPQsTY8eIqfmrxycCamgy9CBau-6Lj9-KJKYL2IyciXYU5cvFAF1oompE4-0JZsFLIX7E5ZeDjyWKTAOlMN7ZjlhXOByU3PJ2bThjhf8eIhRv1i5jfVC8GQoM5lKs2N6Cn1Ya8FfDvcuZsvlPnsNRQp1v4fl3ILRwTZ00yIr0b3XCPickuKbPWLqKsPzmzVCV3vHseW1KTl9RN3kZaKHYEqygdU-TbxqeoxSGuWc44LqWRg4GPgv5oUqCruWUO3C-UuX6ze" alt="Clinical monitoring interface" />
            <div className="hero-image-overlay" />
            <div className="hero-glass-card">
              <div className="glass-card-header">
                <div className="glass-pulse-dot" />
                <span>Critical Alert Processed</span>
              </div>
              <div className="glass-progress-bar">
                <div className="glass-progress-fill" />
              </div>
              <div className="glass-card-label">98.2% AI Confidence Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES (BENTO GRID) ===== */}
      <section className="landing-features" id="features">
        <div className="section-inner">
          <div className="section-header">
            <h2>Unparalleled Vigilance</h2>
            <p>Bridging the gap between physician visits with persistent, intelligent safety monitoring.</p>
          </div>
          <div className="bento-grid">
            {/* AI Risk Scoring - large card */}
            <div className="bento-card span-7">
              <div className="bento-icon blue"><BarChart3 size={28} /></div>
              <h3>AI Risk Scoring</h3>
              <p>Our proprietary models aggregate biometric data and patient reports into a continuous safety score, identifying subtle declines before they escalate into hospitalizations.</p>
              <div className="bento-tags">
                <span className="bento-tag">Biometric Analysis</span>
                <span className="bento-tag">Predictive Trends</span>
              </div>
            </div>

            {/* Instant Alerts - dark card */}
            <div className="bento-card span-5 dark-card">
              <div>
                <div className="bento-icon white-glass"><Zap size={28} /></div>
                <h3>Instant Alerts</h3>
                <p>Immediate multi-channel notification system when vital thresholds are breached or risky trends are detected.</p>
              </div>
              <img className="bento-card-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjab22UebKuWvtCts15JemLw-Hu56FdezCsHTH5gsKKMoicKCaN1xdYq-puUXZUbtEt2TqqAh0jO3k35__nbFqMrOMFEE7tQ8B1MD-zjtWsSiAw-D-eZvSSvmbHRlGK6uMFIu5lYqYIYNR_4KNC_zh_FdF5cfSc-lqqCIP72GdrZctJ5C6n6mdh_OuPzTRCGzJ0me8FPOvhoBr7Nz8zZB4Ve7nCVIw_ZGvsaLrjL8pINE796QL2Ba1kLCrmcapYlLOVtHqqirUjlbX" alt="Heart rate monitor" />
            </div>

            {/* Triage Dashboard - full width */}
            <div className="bento-card span-12">
              <div className="bento-wide-inner">
                <div className="bento-wide-content">
                  <div className="bento-icon secondary"><Activity size={28} /></div>
                  <h3>Triage Dashboard</h3>
                  <p>A centralized, high-density control center for clinical teams to prioritize care based on real-time risk stratification across their entire patient population.</p>
                </div>
                <div className="bento-triage-preview">
                  <div className="triage-row critical">
                    <div className="triage-row-name">Patient #8229 - High Risk</div>
                    <span className="triage-badge urgent">Immediate Action</span>
                  </div>
                  <div className="triage-row stable">
                    <div className="triage-row-name">Patient #1204 - Stable</div>
                    <span className="triage-badge routine">Routine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="landing-how" id="how-it-works">
        <div className="section-inner">
          <div className="how-header">
            <div className="how-header-top">
              <div>
                <h2>Seamless Clinical Integration</h2>
                <p>Designed to fit naturally into existing workflows, ensuring patient safety never feels like an administrative burden.</p>
              </div>
              <button onClick={function() { setLoginOpen(true); }} className="how-get-started-btn">Get Started Now</button>
            </div>
          </div>
          <div className="how-steps-grid">
            <div className="how-step">
              <div className="how-step-number">01</div>
              <h4>Submit Check-In</h4>
              <p>Patients or caregivers provide rapid, guided updates through our clinical-grade interface.</p>
            </div>
            <div className="how-step">
              <div className="how-step-number">02</div>
              <h4>AI Analyzes</h4>
              <p>Our BetweenVisits engine cross-references inputs against historical data and clinical benchmarks.</p>
            </div>
            <div className="how-step">
              <div className="how-step-number">03</div>
              <h4>Get Alerted</h4>
              <p>Staff receives clear, actionable insights and priority triage ranking for immediate follow-up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="landing-pricing" id="pricing">
        <div className="section-inner">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Scale your patient safety network with plans designed for clinical growth.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-tier">Starter</div>
              <div className="pricing-price-row">
                <span className="pricing-amount">$49</span>
                <span className="pricing-period">/mo</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={18} className="pricing-check" /> Up to 25 patients</li>
                <li><CheckCircle size={18} className="pricing-check" /> AI risk scoring</li>
                <li><CheckCircle size={18} className="pricing-check" /> Email & SMS alerts</li>
                <li><CheckCircle size={18} className="pricing-check" /> PDF reports</li>
                <li><CheckCircle size={18} className="pricing-check" /> 2 staff accounts</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Choose Starter</button>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">Recommended</div>
              <div className="pricing-tier">Professional</div>
              <div className="pricing-price-row">
                <span className="pricing-amount">$99</span>
                <span className="pricing-period">/mo</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={18} className="pricing-check" /> Up to 100 patients</li>
                <li><CheckCircle size={18} className="pricing-check" /> Advanced Triage Dashboard</li>
                <li><CheckCircle size={18} className="pricing-check" /> Multi-team access</li>
                <li><CheckCircle size={18} className="pricing-check" /> Email + SMS alerts</li>
                <li><CheckCircle size={18} className="pricing-check" /> 10 staff accounts</li>
                <li><CheckCircle size={18} className="pricing-check" /> Priority support</li>
              </ul>
              <button onClick={handleTryDemo} className="pricing-btn popular">Live Demo Trial</button>
            </div>
            <div className="pricing-card">
              <div className="pricing-tier">Enterprise</div>
              <div className="pricing-price-row">
                <span className="pricing-amount">$199</span>
                <span className="pricing-period">/mo</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={18} className="pricing-check" /> Unlimited patients</li>
                <li><CheckCircle size={18} className="pricing-check" /> Full EMR Integration</li>
                <li><CheckCircle size={18} className="pricing-check" /> Dedicated Safety Consultant</li>
                <li><CheckCircle size={18} className="pricing-check" /> Custom SLA & Support</li>
                <li><CheckCircle size={18} className="pricing-check" /> Unlimited staff accounts</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="landing-cta">
        <div className="section-inner">
          <h2>Empower Your Care Team Today</h2>
          <p>Built for Arizona home care agencies</p>
          <div className="cta-buttons">
            <button onClick={handleTryDemo} className="cta-btn-primary">Try Live Demo</button>
            <a href="mailto:batharbetweenvisits@gmail.com" className="cta-btn-secondary">Schedule a Walkthrough</a>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="landing-contact" id="contact">
        <div className="section-inner">
          <div className="section-header">
            <h2>Get In Touch</h2>
            <p>Have questions or want a walkthrough? We would love to hear from you.</p>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <a href="mailto:batharbetweenvisits@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
              batharbetweenvisits@gmail.com
            </a>
            <p style={{ color: '#64748b', maxWidth: '500px', lineHeight: 1.6, fontSize: '0.95rem' }}>
              Whether you are a home care agency exploring BetweenVisits or have feedback to share, drop us an email and we will get back to you within 24 hours.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-title">BetweenVisits AI</div>
            <p className="footer-brand-desc">Vigilant Sanctuary Protection for patient populations. Advanced AI-driven safety monitoring for the modern healthcare enterprise.</p>
            <p className="footer-copyright">&copy; 2026 BetweenVisits AI. Vigilant Sanctuary Protection.</p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-col-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Security</a></li>
              <li><a href="#pricing">Status</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Resources</div>
            <ul className="footer-col-links">
              <li><a href="#contact">Case Studies</a></li>
              <li><a href="#contact">Whitepapers</a></li>
              <li><a href="#contact">Clinical Evidence</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-col-links">
              <li><a href="#contact">Privacy Policy</a></li>
              <li><a href="#contact">Terms of Service</a></li>
              <li><a href="#contact">Cookie Policy</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-col-links">
              <li><a href="#contact">About Us</a></li>
              <li><a href="mailto:batharbetweenvisits@gmail.com">Contact</a></li>
              <li><a href="#contact">Careers</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
