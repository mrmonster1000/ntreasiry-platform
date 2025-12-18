'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function PenguinEggPage() {
  const [activeTab, setActiveTab] = useState<'mortgages' | 'savings'>('mortgages');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style jsx global>{`
        :root {
          --penguin-dark: #5a534b;
          --penguin-medium: #6b635b;
          --penguin-light: #7d756d;
          --frost: #f5f3f1;
          --ice-white: #faf9f8;
          --egg-gold: #d4a056;
          --egg-gold-light: #e8b975;
          --egg-gold-dark: #b8863d;
          --egg-cream: #fff8f0;
          --egg-warm: #ffecd9;
          --safe-green: #27ae60;
          --text-primary: #3d3832;
          --text-secondary: #6b635b;
          --shadow-soft: 0 4px 20px rgba(90, 83, 75, 0.08);
          --shadow-medium: 0 8px 40px rgba(90, 83, 75, 0.12);
          --radius-sm: 8px;
          --radius-md: 16px;
          --radius-lg: 24px;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--ice-white);
          color: var(--text-primary);
          line-height: 1.6;
        }

        /* Header */
        header {
          background: white;
          padding: 1rem 2rem;
          position: fixed;
          width: 100%;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow-soft);
        }

        nav {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          width: 48px;
          height: 48px;
        }

        .logo-text {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: var(--penguin-dark);
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: var(--egg-gold);
        }

        .nav-links a.active {
          color: var(--penguin-dark);
        }

        /* Mobile menu button */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
        }

        .mobile-menu-btn svg {
          width: 24px;
          height: 24px;
          color: var(--penguin-dark);
        }

        /* Hero Section */
        .hero {
          padding: 140px 2rem 80px;
          background: linear-gradient(180deg, white 0%, var(--frost) 100%);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(107, 99, 91, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212, 160, 86, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hero h1 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 3.5rem;
          font-weight: 700;
          color: var(--penguin-dark);
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }

        .hero h1 span {
          color: var(--egg-gold);
        }

        .hero p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-tagline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--egg-warm);
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 0.9rem;
          color: var(--egg-gold-dark);
          margin-bottom: 2rem;
        }

        /* Tab Navigation */
        .tabs-container {
          max-width: 1200px;
          margin: -40px auto 0;
          padding: 0 2rem;
          position: relative;
          z-index: 10;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .tab-btn {
          padding: 1rem 2rem;
          border: none;
          background: white;
          border-radius: var(--radius-md);
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          box-shadow: var(--shadow-soft);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tab-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .tab-btn.active {
          background: var(--penguin-dark);
          color: white;
        }

        .tab-btn svg {
          width: 24px;
          height: 24px;
        }

        /* Comparison Section */
        .comparison-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--penguin-dark);
        }

        .last-updated {
          font-size: 0.8rem;
          color: var(--text-secondary);
          background: var(--frost);
          padding: 6px 12px;
          border-radius: 100px;
        }

        /* FSCS Badge */
        .fscs-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%);
          color: white;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .fscs-badge svg {
          width: 20px;
          height: 20px;
        }

        .filter-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-select, .filter-input {
          padding: 12px 16px;
          border: 2px solid var(--frost);
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.95rem;
          color: var(--text-primary);
          background: white;
          cursor: pointer;
          min-width: 160px;
          transition: border-color 0.2s;
        }

        .filter-select:focus, .filter-input:focus {
          outline: none;
          border-color: var(--egg-gold);
        }

        /* Rate Cards */
        .rate-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rate-card {
          background: white;
          border-radius: var(--radius-md);
          padding: 1.5rem;
          box-shadow: var(--shadow-soft);
          display: grid;
          grid-template-columns: 180px 1fr auto;
          gap: 2rem;
          align-items: center;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          animation: fadeInUp 0.5s ease forwards;
        }

        .rate-card:nth-child(2) { animation-delay: 0.1s; }
        .rate-card:nth-child(3) { animation-delay: 0.2s; }
        .rate-card:nth-child(4) { animation-delay: 0.3s; }
        .rate-card:nth-child(5) { animation-delay: 0.4s; }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rate-card:hover {
          box-shadow: var(--shadow-medium);
          border-color: var(--frost);
          transform: translateY(-2px);
        }

        .rate-card.featured {
          border-color: var(--egg-gold);
          position: relative;
        }

        .rate-card.featured::before {
          content: 'Top Pick';
          position: absolute;
          top: -12px;
          left: 24px;
          background: var(--egg-gold);
          color: white;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .provider-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .provider-logo {
          width: 120px;
          height: 40px;
          background: var(--frost);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--penguin-medium);
          font-size: 0.9rem;
        }

        .provider-type {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .last-checked {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .rate-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .rate-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .rate-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rate-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--penguin-dark);
        }

        .rate-value.highlight {
          color: var(--safe-green);
        }

        .rate-value small {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .rate-sublabel {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .rate-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-primary {
          padding: 14px 28px;
          background: var(--egg-gold);
          color: white;
          border: none;
          border-radius: var(--radius-sm);
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: var(--egg-gold-dark);
          transform: translateY(-1px);
        }

        .btn-secondary {
          padding: 10px 20px;
          background: transparent;
          color: var(--text-secondary);
          border: none;
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .btn-secondary:hover {
          color: var(--penguin-dark);
        }

        .affiliate-indicator {
          font-size: 0.7rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
        }

        .affiliate-indicator.has-affiliate {
          color: var(--safe-green);
        }

        .affiliate-indicator .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-secondary);
        }

        .affiliate-indicator.has-affiliate .dot {
          background: var(--safe-green);
        }

        /* Disclosure Banner */
        .disclosure-banner {
          background: var(--egg-warm);
          border: 1px solid var(--egg-gold);
          border-radius: var(--radius-md);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
        }

        .disclosure-banner .disclosure-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .disclosure-banner p {
          font-size: 0.9rem;
          color: var(--text-primary);
          margin: 0;
        }

        .disclosure-banner strong {
          color: var(--egg-gold-dark);
        }

        /* Trust Bar */
        .trust-bar {
          background: var(--penguin-dark);
          padding: 3rem 2rem;
          margin-top: 4rem;
        }

        .trust-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .trust-item {
          text-align: center;
          color: white;
        }

        .trust-number {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .trust-label {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        /* How It Works */
        .how-it-works {
          padding: 5rem 2rem;
          background: white;
        }

        .how-it-works-content {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .how-it-works h2 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--penguin-dark);
          margin-bottom: 1rem;
        }

        .how-it-works > div > p {
          color: var(--text-secondary);
          margin-bottom: 3rem;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 3rem;
        }

        .step {
          padding: 2rem;
        }

        .step-icon {
          width: 80px;
          height: 80px;
          background: var(--frost);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 2rem;
        }

        .step h3 {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--penguin-dark);
          margin-bottom: 0.75rem;
        }

        .step p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        /* Footer */
        footer {
          background: var(--penguin-dark);
          color: white;
          padding: 4rem 2rem 2rem;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-brand p {
          opacity: 0.7;
          margin-top: 1rem;
          font-size: 0.9rem;
          line-height: 1.7;
        }

        .footer-links h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .footer-links ul {
          list-style: none;
        }

        .footer-links li {
          margin-bottom: 0.75rem;
        }

        .footer-links a {
          color: white;
          text-decoration: none;
          opacity: 0.8;
          font-size: 0.9rem;
          transition: opacity 0.2s;
        }

        .footer-links a:hover {
          opacity: 1;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          opacity: 0.6;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-legal {
          display: flex;
          gap: 2rem;
        }

        .footer-legal a {
          color: white;
          text-decoration: none;
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }

          .nav-links.open {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            padding: 1rem 2rem;
            box-shadow: var(--shadow-medium);
            gap: 1rem;
          }

          .mobile-menu-btn {
            display: block;
          }

          .rate-card {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .rate-details {
            grid-template-columns: repeat(2, 1fr);
          }

          .footer-top {
            grid-template-columns: 1fr 1fr;
          }

          .steps {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 600px) {
          .tabs {
            flex-direction: column;
          }

          .filter-row {
            flex-direction: column;
          }

          .rate-details {
            grid-template-columns: 1fr;
          }

          .footer-top {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header>
        <nav role="navigation" aria-label="Main navigation">
          <a href="#" className="logo" aria-label="Penguin Egg - Home">
            <img src="/penguin-logo.svg" alt="Penguin Egg logo" className="logo-icon" width={48} height={48} />
            <span className="logo-text">Penguin Egg</span>
          </a>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} role="menubar">
            <li role="none"><a href="#" className="active" role="menuitem">Mortgages</a></li>
            <li role="none"><a href="#" role="menuitem">Savings</a></li>
            <li role="none"><a href="#" role="menuitem">Guides</a></li>
            <li role="none"><a href="#" role="menuitem">About</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-content">
            <div className="hero-tagline">
              Protecting your financial future
            </div>
            <h1 id="hero-heading">Compare rates.<br /><span>Keep your egg safe.</span></h1>
            <p>We compare the whole market so you don&apos;t have to. Find the best mortgage and savings rates, updated daily.</p>
          </div>
        </section>

        <div className="tabs-container">
          <div className="tabs" role="tablist" aria-label="Product categories">
            <button
              className={`tab-btn ${activeTab === 'mortgages' ? 'active' : ''}`}
              onClick={() => setActiveTab('mortgages')}
              role="tab"
              aria-selected={activeTab === 'mortgages'}
              aria-controls="mortgages-panel"
              id="mortgages-tab"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Mortgages
            </button>
            <button
              className={`tab-btn ${activeTab === 'savings' ? 'active' : ''}`}
              onClick={() => setActiveTab('savings')}
              role="tab"
              aria-selected={activeTab === 'savings'}
              aria-controls="savings-panel"
              id="savings-tab"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"></path>
                <path d="M2 9v1c0 1.1.9 2 2 2h1"></path>
                <circle cx="16" cy="11" r="1"></circle>
              </svg>
              Savings
            </button>
          </div>
        </div>

        {/* Mortgages Tab */}
        <div
          id="mortgages-panel"
          role="tabpanel"
          aria-labelledby="mortgages-tab"
          hidden={activeTab !== 'mortgages'}
        >
          <section className="comparison-section">
            <div className="section-header">
              <h2 className="section-title">Best Mortgage Rates</h2>
              <div className="fscs-badge" aria-label="FSCS protected up to £85,000">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                FSCS Protected to £85k
              </div>
              <span className="last-updated">Last updated: 18 Dec 2024</span>
            </div>

            <div className="disclosure-banner" role="note">
              <span className="disclosure-icon" aria-hidden="true">🐧</span>
              <p>We show you <strong>all the deals</strong> – even ones we don&apos;t earn from. Some links may earn us a small commission, but this never affects your rate or rankings. Always confirm the current rate with the provider.</p>
            </div>

            <div className="filter-row" role="search" aria-label="Filter mortgages">
              <div className="filter-group">
                <label className="filter-label" htmlFor="property-value">Property Value</label>
                <input type="text" id="property-value" className="filter-input" defaultValue="£300,000" aria-describedby="property-help" />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="deposit">Deposit</label>
                <input type="text" id="deposit" className="filter-input" defaultValue="£60,000" />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="mortgage-type">Mortgage Type</label>
                <select id="mortgage-type" className="filter-select">
                  <option>Fixed Rate</option>
                  <option>Tracker</option>
                  <option>Variable</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="term">Term</label>
                <select id="term" className="filter-select">
                  <option>2 Years</option>
                  <option>3 Years</option>
                  <option>5 Years</option>
                  <option>10 Years</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="buyer-type">Buyer Type</label>
                <select id="buyer-type" className="filter-select">
                  <option>First Time Buyer</option>
                  <option>Home Mover</option>
                  <option>Remortgage</option>
                  <option>Buy to Let</option>
                </select>
              </div>
            </div>

            <div className="rate-cards" role="list" aria-label="Mortgage deals">
              <article className="rate-card featured" role="listitem" aria-label="Nationwide - Top Pick">
                <div className="provider-info">
                  <div className="provider-logo">Nationwide</div>
                  <span className="provider-type">Building Society</span>
                  <span className="last-checked">Checked: 18 Dec 09:15</span>
                  <span className="affiliate-indicator has-affiliate"><span className="dot"></span> Affiliate link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value highlight">4.19%</span>
                    <span className="rate-sublabel">2 year fixed</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Monthly</span>
                    <span className="rate-value">£1,312</span>
                    <span className="rate-sublabel">Repayment</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Fee</span>
                    <span className="rate-value"><small>£</small>999</span>
                    <span className="rate-sublabel">Product fee</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">APRC</span>
                    <span className="rate-value">6.8%</span>
                    <span className="rate-sublabel">Overall cost</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="View Nationwide deal">View Deal</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="HSBC mortgage">
                <div className="provider-info">
                  <div className="provider-logo">HSBC</div>
                  <span className="provider-type">Bank</span>
                  <span className="last-checked">Checked: 18 Dec 09:12</span>
                  <span className="affiliate-indicator"><span className="dot"></span> Direct link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value">4.24%</span>
                    <span className="rate-sublabel">2 year fixed</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Monthly</span>
                    <span className="rate-value">£1,324</span>
                    <span className="rate-sublabel">Repayment</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Fee</span>
                    <span className="rate-value"><small>£</small>0</span>
                    <span className="rate-sublabel">No fee</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">APRC</span>
                    <span className="rate-value">6.9%</span>
                    <span className="rate-sublabel">Overall cost</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="View HSBC deal">View Deal</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Barclays mortgage">
                <div className="provider-info">
                  <div className="provider-logo">Barclays</div>
                  <span className="provider-type">Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:45</span>
                  <span className="affiliate-indicator has-affiliate"><span className="dot"></span> Affiliate link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value">4.29%</span>
                    <span className="rate-sublabel">2 year fixed</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Monthly</span>
                    <span className="rate-value">£1,336</span>
                    <span className="rate-sublabel">Repayment</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Fee</span>
                    <span className="rate-value"><small>£</small>899</span>
                    <span className="rate-sublabel">Product fee</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">APRC</span>
                    <span className="rate-value">7.0%</span>
                    <span className="rate-sublabel">Overall cost</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="View Barclays deal">View Deal</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Halifax mortgage">
                <div className="provider-info">
                  <div className="provider-logo">Halifax</div>
                  <span className="provider-type">Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:30</span>
                  <span className="affiliate-indicator"><span className="dot"></span> Direct link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value">4.34%</span>
                    <span className="rate-sublabel">2 year fixed</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Monthly</span>
                    <span className="rate-value">£1,348</span>
                    <span className="rate-sublabel">Repayment</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Fee</span>
                    <span className="rate-value"><small>£</small>1,099</span>
                    <span className="rate-sublabel">Product fee</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">APRC</span>
                    <span className="rate-value">7.1%</span>
                    <span className="rate-sublabel">Overall cost</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="View Halifax deal">View Deal</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Santander mortgage">
                <div className="provider-info">
                  <div className="provider-logo">Santander</div>
                  <span className="provider-type">Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:15</span>
                  <span className="affiliate-indicator has-affiliate"><span className="dot"></span> Affiliate link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">Rate</span>
                    <span className="rate-value">4.39%</span>
                    <span className="rate-sublabel">2 year fixed</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Monthly</span>
                    <span className="rate-value">£1,360</span>
                    <span className="rate-sublabel">Repayment</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Fee</span>
                    <span className="rate-value"><small>£</small>0</span>
                    <span className="rate-sublabel">No fee</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">APRC</span>
                    <span className="rate-value">7.2%</span>
                    <span className="rate-sublabel">Overall cost</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="View Santander deal">View Deal</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>
            </div>
          </section>
        </div>

        {/* Savings Tab */}
        <div
          id="savings-panel"
          role="tabpanel"
          aria-labelledby="savings-tab"
          hidden={activeTab !== 'savings'}
        >
          <section className="comparison-section">
            <div className="section-header">
              <h2 className="section-title">Best Savings Rates</h2>
              <div className="fscs-badge" aria-label="FSCS protected up to £85,000">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                </svg>
                FSCS Protected to £85k
              </div>
              <span className="last-updated">Last updated: 18 Dec 2024</span>
            </div>

            <div className="disclosure-banner" role="note">
              <span className="disclosure-icon" aria-hidden="true">🐧</span>
              <p>We show you <strong>all the deals</strong> – even ones we don&apos;t earn from. Savings rates are checked daily. Always confirm the current rate with the provider before applying.</p>
            </div>

            <div className="filter-row" role="search" aria-label="Filter savings accounts">
              <div className="filter-group">
                <label className="filter-label" htmlFor="amount">Amount</label>
                <input type="text" id="amount" className="filter-input" defaultValue="£10,000" />
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="account-type">Account Type</label>
                <select id="account-type" className="filter-select">
                  <option>Easy Access</option>
                  <option>Fixed Rate Bond</option>
                  <option>Notice Account</option>
                  <option>Cash ISA</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label" htmlFor="savings-term">Term</label>
                <select id="savings-term" className="filter-select">
                  <option>No fixed term</option>
                  <option>1 Year</option>
                  <option>2 Years</option>
                  <option>3 Years</option>
                  <option>5 Years</option>
                </select>
              </div>
            </div>

            <div className="rate-cards" role="list" aria-label="Savings accounts">
              <article className="rate-card featured" role="listitem" aria-label="Chip - Top Pick">
                <div className="provider-info">
                  <div className="provider-logo">Chip</div>
                  <span className="provider-type">Digital Bank</span>
                  <span className="last-checked">Checked: 18 Dec 09:00</span>
                  <span className="affiliate-indicator has-affiliate"><span className="dot"></span> Affiliate link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">AER</span>
                    <span className="rate-value highlight">5.00%</span>
                    <span className="rate-sublabel">Easy access</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Interest on £10k</span>
                    <span className="rate-value">£500</span>
                    <span className="rate-sublabel">Per year</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Min Deposit</span>
                    <span className="rate-value"><small>£</small>1</span>
                    <span className="rate-sublabel">To open</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Access</span>
                    <span className="rate-value">Instant</span>
                    <span className="rate-sublabel">No notice</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="Open Chip account">Open Account</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Chase savings">
                <div className="provider-info">
                  <div className="provider-logo">Chase</div>
                  <span className="provider-type">Digital Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:55</span>
                  <span className="affiliate-indicator"><span className="dot"></span> Direct link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">AER</span>
                    <span className="rate-value">4.50%</span>
                    <span className="rate-sublabel">Easy access</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Interest on £10k</span>
                    <span className="rate-value">£450</span>
                    <span className="rate-sublabel">Per year</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Min Deposit</span>
                    <span className="rate-value"><small>£</small>0</span>
                    <span className="rate-sublabel">To open</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Access</span>
                    <span className="rate-value">Instant</span>
                    <span className="rate-sublabel">No notice</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="Open Chase account">Open Account</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Oxbury savings">
                <div className="provider-info">
                  <div className="provider-logo">Oxbury</div>
                  <span className="provider-type">Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:50</span>
                  <span className="affiliate-indicator"><span className="dot"></span> Direct link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">AER</span>
                    <span className="rate-value">4.45%</span>
                    <span className="rate-sublabel">Easy access</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Interest on £10k</span>
                    <span className="rate-value">£445</span>
                    <span className="rate-sublabel">Per year</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Min Deposit</span>
                    <span className="rate-value"><small>£</small>1</span>
                    <span className="rate-sublabel">To open</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Access</span>
                    <span className="rate-value">Instant</span>
                    <span className="rate-sublabel">No notice</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="Open Oxbury account">Open Account</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>

              <article className="rate-card" role="listitem" aria-label="Monzo savings">
                <div className="provider-info">
                  <div className="provider-logo">Monzo</div>
                  <span className="provider-type">Digital Bank</span>
                  <span className="last-checked">Checked: 18 Dec 08:45</span>
                  <span className="affiliate-indicator has-affiliate"><span className="dot"></span> Affiliate link</span>
                </div>
                <div className="rate-details">
                  <div className="rate-item">
                    <span className="rate-label">AER</span>
                    <span className="rate-value">4.35%</span>
                    <span className="rate-sublabel">Easy access</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Interest on £10k</span>
                    <span className="rate-value">£435</span>
                    <span className="rate-sublabel">Per year</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Min Deposit</span>
                    <span className="rate-value"><small>£</small>0</span>
                    <span className="rate-sublabel">To open</span>
                  </div>
                  <div className="rate-item">
                    <span className="rate-label">Access</span>
                    <span className="rate-value">Instant</span>
                    <span className="rate-sublabel">No notice</span>
                  </div>
                </div>
                <div className="rate-actions">
                  <button className="btn-primary" aria-label="Open Monzo account">Open Account</button>
                  <button className="btn-secondary">More details</button>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div className="trust-bar">
          <div className="trust-content">
            <div className="trust-item">
              <div className="trust-number">147</div>
              <div className="trust-label">Providers compared</div>
            </div>
            <div className="trust-item">
              <div className="trust-number">Daily</div>
              <div className="trust-label">Rate updates</div>
            </div>
            <div className="trust-item">
              <div className="trust-number">100%</div>
              <div className="trust-label">Market coverage</div>
            </div>
            <div className="trust-item">
              <div className="trust-number">Free</div>
              <div className="trust-label">Always, forever</div>
            </div>
          </div>
        </div>

        <section className="how-it-works" aria-labelledby="how-heading">
          <div className="how-it-works-content">
            <h2 id="how-heading">How Penguin Egg works</h2>
            <p>We keep it simple. Like a penguin dad with one job.</p>

            <div className="steps">
              <div className="step">
                <div className="step-icon" aria-hidden="true">🔍</div>
                <h3>We gather the rates</h3>
                <p>We check lenders and banks daily so you&apos;re seeing current rates – the whole market, not just selected deals.</p>
              </div>
              <div className="step">
                <div className="step-icon" aria-hidden="true">⚖️</div>
                <h3>You compare fairly</h3>
                <p>See everything side by side – rates, fees, terms. We show deals even when we don&apos;t earn from them. No hidden nasties.</p>
              </div>
              <div className="step">
                <div className="step-icon" aria-hidden="true">🐧</div>
                <h3>Choose with confidence</h3>
                <p>When you&apos;re ready, go direct to the provider. We&apos;ll tell you if a link earns us commission. Your egg, protected.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="#" className="logo" aria-label="Penguin Egg - Home">
                <img src="/penguin-logo.svg" alt="" className="logo-icon" width={48} height={48} style={{ filter: 'brightness(10)' }} />
                <span className="logo-text" style={{ color: 'white' }}>Penguin Egg</span>
              </a>
              <p>We compare mortgages and savings rates so you don&apos;t have to. Like a penguin dad, we&apos;ve got one job: keeping your financial egg safe.</p>
              <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>Some links on this site are affiliate links. We may earn a small commission if you apply through them – but this never affects your rate, and we show all deals regardless of whether we earn from them. Rates shown are indicative and updated daily. Always confirm the current rate directly with the provider before applying. All savings shown are FSCS protected up to £85,000.</p>
            </div>
            <div className="footer-links">
              <h4>Compare</h4>
              <ul>
                <li><a href="#">Mortgages</a></li>
                <li><a href="#">Savings</a></li>
                <li><a href="#">ISAs</a></li>
                <li><a href="#">Fixed Rate Bonds</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Learn</h4>
              <ul>
                <li><a href="#">Mortgage guides</a></li>
                <li><a href="#">Savings guides</a></li>
                <li><a href="#">First time buyers</a></li>
                <li><a href="#">Calculators</a></li>
              </ul>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">How we work</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2024 Penguin Egg. All rights reserved.</span>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
