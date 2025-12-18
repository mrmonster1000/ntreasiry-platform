'use client';

export default function AboutPage() {
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
          font-family: 'Fraunces', Georgia, serif;
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

        /* About Content */
        .about-hero {
          padding: 160px 2rem 80px;
          background: linear-gradient(180deg, white 0%, var(--frost) 100%);
        }

        .about-hero-content {
          max-width: 720px;
          margin: 0 auto;
        }

        .about-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--egg-gold-dark);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 1.5rem;
        }

        .about-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 3rem;
          font-weight: 800;
          color: var(--penguin-dark);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 2rem;
        }

        .about-subtitle {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 500;
          font-style: italic;
          color: var(--penguin-medium);
          line-height: 1.4;
        }

        /* About Body */
        .about-body {
          padding: 4rem 2rem;
          background: white;
        }

        .about-body-content {
          max-width: 640px;
          margin: 0 auto;
        }

        .about-body p {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-primary);
          margin-bottom: 1.75rem;
        }

        .about-body p.lead {
          font-size: 1.25rem;
          color: var(--penguin-medium);
        }

        .about-body strong {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--penguin-dark);
          display: block;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }

        .about-body p:last-child strong {
          font-size: 1.5rem;
          margin-top: 3rem;
          margin-bottom: 0.5rem;
        }

        .closing {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--penguin-dark);
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--frost);
        }

        /* Divider */
        .divider {
          width: 60px;
          height: 3px;
          background: var(--egg-gold);
          margin: 3rem 0;
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

        /* Responsive */
        @media (max-width: 900px) {
          .nav-links {
            display: none;
          }

          .about-title {
            font-size: 2.25rem;
          }

          .footer-top {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .footer-top {
            grid-template-columns: 1fr;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }

          .about-title {
            font-size: 2rem;
          }

          .about-subtitle {
            font-size: 1.25rem;
          }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header>
        <nav role="navigation" aria-label="Main navigation">
          <a href="/" className="logo" aria-label="Penguin Egg - Home">
            <img src="/penguin-logo.png" alt="Penguin Egg logo" className="logo-icon" width={48} height={48} />
            <span className="logo-text">Penguin Egg</span>
          </a>
          <ul className="nav-links" role="menubar">
            <li role="none"><a href="/" role="menuitem">Mortgages</a></li>
            <li role="none"><a href="/" role="menuitem">Savings</a></li>
            <li role="none"><a href="#" role="menuitem">Guides</a></li>
            <li role="none"><a href="/about" className="active" role="menuitem">About</a></li>
          </ul>
        </nav>
      </header>

      <main>
        <section className="about-hero">
          <div className="about-hero-content">
            <p className="about-label">About</p>
            <h1 className="about-title">Penguin Egg: Your Rates, Our Care</h1>
            <p className="about-subtitle">The emperor penguin doesn&apos;t run from the cold. He stands in it.</p>
          </div>
        </section>

        <section className="about-body">
          <div className="about-body-content">
            <p className="lead">
              For four months, the father penguin balances a single precious egg on his feet, sheltering it beneath his feathers, refusing to eat, refusing to move—because some things are simply too important to leave unprotected.
            </p>

            <p><strong>That&apos;s the spirit behind Penguin Egg.</strong></p>

            <p>
              We know your money matters. It&apos;s not just numbers in an account—it&apos;s your first home, your children&apos;s future, your hard-earned security. And in a world of comparison sites that quietly bury the deals they don&apos;t profit from, it can feel impossible to know who&apos;s really on your side.
            </p>

            <p><strong>We aim to show you all the deals. Then we tell you exactly where we stand.</strong></p>

            <p>
              Some links earn us affiliate commission. Some don&apos;t earn us anything at all. We mark them clearly, so you always know. No guessing. No hidden incentives. Just honest labels and the full picture.
            </p>

            <p>
              You choose what&apos;s best for you—not what&apos;s best for us.
            </p>

            <div className="divider"></div>

            <p><strong>See everything. Know everything. Choose for yourself.</strong></p>

            <p className="closing">Welcome to Penguin Egg.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-top">
            <div className="footer-brand">
              <a href="/" className="logo" aria-label="Penguin Egg - Home">
                <img src="/penguin-logo.png" alt="" className="logo-icon" width={48} height={48} style={{ filter: 'brightness(10)' }} />
                <span className="logo-text" style={{ color: 'white' }}>Penguin Egg</span>
              </a>
              <p>We compare mortgages and savings rates so you don&apos;t have to. Like a penguin dad, we&apos;ve got one job: keeping your financial egg safe.</p>
            </div>
            <div className="footer-links">
              <h4>Compare</h4>
              <ul>
                <li><a href="/">Mortgages</a></li>
                <li><a href="/">Savings</a></li>
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
                <li><a href="/about">About us</a></li>
                <li><a href="#">How we work</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; 2024 Penguin Egg. All rights reserved.</span>
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
