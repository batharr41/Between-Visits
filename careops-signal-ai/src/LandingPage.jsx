import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  Activity, AlertCircle, CheckCircle, Shield, FileText,
  Bell, Users, ChevronRight, ArrowRight, Heart, Clock,
  Smartphone, BarChart3, Zap, X, Eye
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
              <input
                type="email"
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                placeholder="you@agency.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                placeholder="--------"
                required
                minLength={mode === "signup" ? 10 : 1}
              />
              {mode === 'signup' && password.length > 0 && (
                <div className="password-strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4, 5].map(function(i) {
                      return (
                        <div
                          key={i}
                          className="strength-bar"
                          style={{
                            background: i <= strength.level ? strength.color : '#e2e8f0'
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
              {mode === 'signup' && (
                <p className="password-hint">Minimum 10 characters with uppercase, lowercase, number, and symbol</p>
              )}
            </div>



            <button
              type="submit"
              className="login-panel-btn"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="login-toggle">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={function() { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
              className="login-toggle-btn"
            >
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

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <BetweenVisitsLogo size={36} />
            <span>BetweenVisits</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Resources</a>
            <button
              onClick={function() { setLoginOpen(true); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                padding: '0',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Sign Up
            </button>
            <button onClick={handleTryDemo} className="landing-nav-cta">
              Demo
            </button>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-badge">PATIENT GUARDIAN AI</div>
          <h1>Catch Health Risks <em className="hero-highlight">Before</em> They Become Emergencies</h1>
          <p className="hero-subtitle">
            Advanced AI oversight for high-risk patients. Our sanctuary
            protection engine continuously monitors signals to provide
            healthcare providers with clinical foresight.
          </p>
          <div className="hero-actions">
            <button onClick={function() { setLoginOpen(true); }} className="hero-btn-primary">
              Try It Free — 14 Days
            </button>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="section-inner">
          <div className="section-header">
            <h2>Unparalleled Vigilance</h2>
            <p>Bridging the gap between physician visits with persistent, intelligent safety monitoring.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon blue"><BarChart3 size={28} /></div>
              <h3>AI Risk Scoring</h3>
              <p>Our proprietary models aggregate biometric data and patient reports into a continuous safety score, identifying subtle declines before they escalate into hospitalizations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon purple"><Zap size={28} /></div>
              <h3>Instant Alerts</h3>
              <p>Immediate multi-channel notification system when vital thresholds are breached or risky trends are detected.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon blue"><Activity size={28} /></div>
              <h3>Triage Dashboard</h3>
              <p>A centralized, high-density control center for clinical teams to prioritize care based on real-time risk stratification across their entire patient population.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon red"><Bell size={28} /></div>
              <h3>Daily Check-Ins</h3>
              <p>Simple forms for caregivers and family members to report patient status - pain levels, mobility, medications, mood, and vitals.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon orange"><FileText size={28} /></div>
              <h3>PDF Reports</h3>
              <p>Generate professional weekly reports per patient or agency-wide - perfect for doctor visits, family updates, or compliance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon teal"><Users size={28} /></div>
              <h3>Staff Management</h3>
              <p>Assign caregivers to patients, track who acknowledged and resolved alerts, and manage your care team efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-how" id="how-it-works">
        <div className="section-inner">
          <div className="section-header">
            <h2>Seamless Clinical Integration</h2>
            <p>Designed to fit naturally into existing workflows, ensuring patient safety never feels like an administrative burden.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button onClick={function() { setLoginOpen(true); }} className="hero-btn-primary" style={{ fontSize: '0.9rem', padding: '0.625rem 1.5rem' }}>
              Get Started Now
            </button>
          </div>
          <div className="how-steps">
            <div className="how-step">
              <div className="step-number">1</div>
              <h3>Submit Check-In</h3>
              <p>Patients or caregivers provide rapid, guided updates through our clinical-grade interface.</p>
            </div>
            <div className="how-arrow"><ChevronRight size={32} /></div>
            <div className="how-step">
              <div className="step-number">2</div>
              <h3>AI Analyzes</h3>
              <p>Our BetweenVisits engine cross-references inputs against historical data and clinical benchmarks.</p>
            </div>
            <div className="how-arrow"><ChevronRight size={32} /></div>
            <div className="how-step">
              <div className="step-number">3</div>
              <h3>Get Alerted</h3>
              <p>Staff receives clear, actionable insights and priority triage ranking for immediate follow-up.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-pricing" id="pricing">
        <div className="section-inner">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Scale your patient safety network with plans designed for clinical growth.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-tier">Starter</div>
              <div className="pricing-price">
                <span className="price-amount">$499</span>
                <span className="price-period">/mo</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Up to 50 patients</li>
                <li><CheckCircle size={16} /> Core Risk Scoring</li>
                <li><CheckCircle size={16} /> Email & SMS Alerts</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Choose Starter</button>
            </div>
            <div className="pricing-card popular">
              <div className="popular-badge">RECOMMENDED</div>
              <div className="pricing-tier">Professional</div>
              <div className="pricing-price">
                <span className="price-amount">$1,249</span>
                <span className="price-period">/mo</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Up to 200 patients</li>
                <li><CheckCircle size={16} /> Advanced Triage Dashboard</li>
                <li><CheckCircle size={16} /> Multi-team access</li>
                <li><CheckCircle size={16} /> EMR Integration (Ltd)</li>
              </ul>
              <button onClick={handleTryDemo} className="pricing-btn popular">Live Demo Trial</button>
            </div>
            <div className="pricing-card">
              <div className="pricing-tier">Enterprise</div>
              <div className="pricing-price">
                <span className="price-amount">Custom</span>
              </div>
              <ul className="pricing-features">
                <li><CheckCircle size={16} /> Unlimited patients</li>
                <li><CheckCircle size={16} /> Full EMR Integration</li>
                <li><CheckCircle size={16} /> Dedicated Safety Consultant</li>
                <li><CheckCircle size={16} /> Custom SLA & Support</li>
              </ul>
              <button onClick={function() { setLoginOpen(true); }} className="pricing-btn">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="section-inner">
          <h2>Empower Your Care Team Today</h2>
          <p>Built for Arizona home care agencies</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleTryDemo} className="hero-btn-primary">
              Try Live Demo
            </button>
            <a href="mailto:batharbetweenvisits@gmail.com" className="hero-btn-secondary" style={{ cursor: 'pointer', background: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'white' }}>
              Schedule a Walkthrough
            </a>
          </div>
        </div>
      </section>

      <section className="landing-contact" id="contact" style={{ padding: '4rem 2rem', background: '#f8fafc', textAlign: 'center' }}>
        <div className="section-inner">
          <div className="section-header">
            <h2>Get In Touch</h2>
            <p>Have questions or want a walkthrough? We would love to hear from you.</p>
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <a href="mailto:batharbetweenvisits@gmail.com" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
              batharbetweenvisits@gmail.com
            </a>
            <p style={{ color: '#64748b', maxWidth: '500px', lineHeight: 1.6 }}>
              Whether you are a home care agency exploring BetweenVisits or have feedback to share, drop us an email and we will get back to you within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <BetweenVisitsLogo size={28} />
            <span>BetweenVisits</span>
          </div>
          <p className="footer-text">&copy; 2026 BetweenVisits AI. Vigilant Sanctuary Protection.</p>
        </div>
      </footer>
    </div>
  );
}
