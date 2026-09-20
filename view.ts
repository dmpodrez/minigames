export function renderApp(): void {
  document.body.innerHTML = `
    <div class="app">
      <header class="header">
        <a class="logo" href="#" aria-label="MiniGames home">
          <img src="/assets/svg/logo.svg" alt="" />
          <span>MiniGames</span>
        </a>
    
        <!-- Desktop navigation -->
        <nav class="nav" aria-label="Main navigation">
          <a href="#">Home</a>
          <a href="#library">Library</a>
          <a href="#">Tournaments</a>
          <a href="#">Community</a>
    
          <button
            class="login-button auth-open"
            type="button"
            data-auth-mode="login"
          >
            Log In
          </button>
    
          <button
            class="signup-button auth-open"
            type="button"
            data-auth-mode="register"
          >
            Sign Up
          </button>
        </nav>
    
        <!-- Tablet / Mobile -->
        <div class="header-mobile-actions">
          <button
            class="signup-button header-signup auth-open"
            type="button"
            data-auth-mode="register"
          >
            Sign Up
          </button>
    
          <button
            class="burger-button"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
      <div class="mobile-menu-overlay" id="mobile-menu" aria-hidden="true">
        <aside class="mobile-menu" aria-label="Mobile navigation">
          <div class="mobile-menu-header">
            <a class="logo" href="#">
              <img src="/assets/svg/logo.svg" alt="" />
              <span>MiniGames</span>
            </a>
          </div>
    
          <nav class="mobile-menu-nav">
            <a href="#">Home</a>
            <a href="#">Library</a>
            <a href="#">Tournaments</a>
            <a href="#">Community</a>
          </nav>
    
          <div class="mobile-menu-actions">
            <button
              class="login-button auth-open"
              type="button"
              data-auth-mode="login"
            >
              Log In
            </button>
    
            <button
              class="signup-button auth-open"
              type="button"
              data-auth-mode="register"
            >
              Sign Up
            </button>
          </div>
        </aside>
      </div>
      <main>
        <section class="hero">
          <div class="hero-content">
            <h1>Take a Short Break & Have Fun</h1>
           <p class="hero-description">
              <span class="hero-description-desktop">
                Discover hundreds of curated casual mini-games. Play instantly in
                your browser — puzzle, match 3, farm, and board classics.
              </span>

              <span class="hero-description-mobile">
                Discover hundreds of curated casual mini-games right in your browser.
              </span>
           </p>
            <a class="hero-button" href="#library">Browse Library</a>
          </div>
        </section>
        <section class="new-games" id="library">
          <div class="section-header">
            <div class="section-title">
              <span class="accent-bar"></span>
              <h2>New Games</h2>
            </div>
            <div class="slider-controls">
              <button class="slider-btn slider-prev">←</button>
              <button class="slider-btn slider-next">→</button>
            </div>
          </div>
          <div class="games-viewport">
            <div class="games-track"></div>
          </div>
        </section>
        <section class="top-players">
          <div class="section-title">
            <span class="accent-bar"></span>
            <h2>
              <span class="top-players-title-full">Top Players This Week</span>
              <span class="top-players-title-mobile">Top Players</span>
            </h2>
          </div>
    
          <div class="leaderboard">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                 <th>
                  <span class="desktop-label">GAMES PLAYED</span>
                  <span class="compact-label">GAMES</span>
                </th>
                <th>
                  <span class="desktop-label">TOTAL SCORE</span>
                  <span class="compact-label">SCORE</span>
                </th>
                  <th>Streak</th>
                  <th>Favorite Game</th>
                </tr>
              </thead>
              <tbody class="leaderboard-body"></tbody>
            </table>
          </div>
        </section>
        <section class="developer-section">
          <div class="developer-illustration">
            <img
              src="/assets/images/illustration-side.png"
              alt="Game developer workspace"
            />
          </div>
    
          <div class="developer-card">
            <h2>Are You a Game Developer?</h2>
    
            <p class="developer-description">
              Want to see your game on MiniGames? We're always looking for fun,<br>
              engaging mini games to add to our platform. Submit your game<br> and
              reach thousands of players!
            </p>
    
            <button class="developer-button" type="button">
              <img
                class="developer-button-icon"
                src="/assets/svg/upload.svg"
                alt=""
              />
              Submit Form
            </button>
    
            <p class="developer-contact">
              or contact us at developers@minigames.com
            </p>
          </div>
        </section>
      </main>
      <footer class="footer">
        <div class="footer-main">
          <div class="footer-brand">
            <a class="footer-logo" href="#">
              <img src="/assets/svg/logo.svg" alt="" />
              <span>MiniGames</span>
            </a>
    
            <p class="footer-description">
              Take a short break and have fun. Hundreds of curated casual
              mini-games right in your web browser. No download required.
            </p>
          </div>
    
          <nav class="footer-nav" aria-label="Footer navigation">
            <div class="footer-column">
              <h3>Explore</h3>
    
              <ul>
                <li><a href="#">Home</a></li>
                <li><a href="#library">Library</a></li>
                <li><a href="#">Categories</a></li>
                <li><a href="#">Tournaments</a></li>
              </ul>
            </div>
    
            <div class="footer-column">
              <h3>Company</h3>
    
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
    
            <div class="footer-community">
              <h3>Community</h3>
    
              <div class="footer-socials">
                <a href="#" aria-label="Share">
                  <img src="/assets/svg/share.svg" alt="" />
                </a>
    
                <a href="#" aria-label="Twitch">
                  <img src="/assets/svg/chat.svg" alt="" />
                </a>
    
                <a href="#" aria-label="RSS">
                  <img src="/assets/svg/rss_feed.svg" alt="" />
                </a>
              </div>
            </div>
          </nav>
        </div>
    
        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 MiniGames. All rights reserved.</p>
    
          <a class="footer-school" href="#">
            <img src="/assets/svg/rs-logo-container.svg" alt="" />
            <span>RS School</span>
          </a>
    
          <a class="footer-github" href="#">
            <img src="/assets/svg/github-icon.svg" alt="" />
            <span>@dmpodrez</span>
          </a>
    
          <p class="footer-love">Designed with love</p>
        </div>
      </footer>
    </div>
    <dialog class="auth-dialog">
      <div class="auth-dialog-content">
        <div class="auth-tabs">
          <button
            class="auth-tab auth-tab--active"
            type="button"
            data-auth-tab="login"
          >
            Login
          </button>
    
          <button class="auth-tab" type="button" data-auth-tab="register">
            Register
          </button>
        </div>
    
        <div class="auth-panels">
          <!-- LOGIN -->
          <section
            class="auth-panel auth-panel--active"
            data-auth-panel="login"
          >
            <h2>Welcome Back!</h2>
    
            <p class="auth-subtitle">
              Sign in to resume your games and progress.
            </p>
    
            <form class="auth-form">
              <label class="auth-field">
                <span>Email Address</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/mail.svg"
                    alt=""
                  />
    
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. alex@minigames.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </label>
    
              <label class="auth-field">
                <span>Password</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />
    
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    required
                  />
    
                  <button
                    class="password-toggle"
                    type="button"
                    aria-label="Show password"
                  >
                    <img src="/assets/svg/visibility.svg" alt="" />
                  </button>
                </div>
              </label>
    
              <button class="forgot-password" type="button">
                Forgot Password?
              </button>
    
              <button class="auth-submit" type="submit">Login</button>
            </form>
    
            <div class="auth-divider">
              <span>OR</span>
            </div>
    
            <button class="google-button" type="button">
              <img class="google-icon" src="/assets/svg/Vector.svg" alt="" />
    
              Continue with Google
            </button>
    
            <p class="auth-switch-text">
              Don't have an account?
              <button type="button" data-auth-switch="register">
                Register
              </button>
            </p>
          </section>
    
          <!-- REGISTER -->
          <section class="auth-panel" data-auth-panel="register">
            <h2>Create Account</h2>
    
            <p class="auth-subtitle">
              Join MiniGames to track your score &amp; streak.
            </p>
    
            <form class="auth-form">
              <label class="auth-field">
                <span>Username</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/person.svg"
                    alt=""
                  />
    
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. CozyGamer_99"
                    autocomplete="username"
                    required
                  />
                </div>
              </label>
    
              <label class="auth-field">
                <span>Email Address</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/mail.svg"
                    alt=""
                  />
    
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@domain.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </label>
    
              <label class="auth-field">
                <span>Password</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />
    
                  <input
                    type="password"
                    name="password"
                    placeholder="Min. 8 characters"
                    autocomplete="new-password"
                    required
                  />
    
                  <button
                    class="password-toggle"
                    type="button"
                    aria-label="Show password"
                  >
                    <img src="/assets/svg/visibility.svg" alt="" />
                  </button>
                </div>
              </label>
    
              <label class="auth-field">
                <span>Confirm Password</span>
    
                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />
    
                  <input
                    type="password"
                    name="confirm-password"
                    placeholder="Repeat your password"
                    autocomplete="new-password"
                    required
                  />
    
                  <button
                    class="password-toggle"
                    type="button"
                    aria-label="Show password"
                  >
                    <img src="/assets/svg/visibility.svg" alt="" />
                  </button>
                </div>
              </label>
    
              <button class="auth-submit" type="submit">Create Account</button>
            </form>
    
            <div class="auth-divider">
              <span>OR</span>
            </div>
    
            <button class="google-button" type="button">
              <img class="google-icon" src="/assets/svg/Vector.svg" alt="" />
      
              Sign up with Google
            </button>
    
            <p class="auth-switch-text">
              Already have an account?
              <button type="button" data-auth-switch="login">Login</button>
            </p>
          </section>
        </div>
      </div>
    </dialog>
  `;
}
