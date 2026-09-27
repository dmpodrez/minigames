export function renderApp(): void {
  document.body.innerHTML = `
    <div class="app">
      <header class="header">
        <a class="logo" href="#home" data-page-link="home" aria-label="MiniGames home">
          <img src="/assets/svg/logo.svg" alt="" />
          <span>MiniGames</span>
        </a>

        <!-- Desktop navigation -->
        <nav class="nav" aria-label="Main navigation">
          <a href="#home" data-page-link="home">Home</a>
          <a href="#library" data-page-link="library">Library</a>
          <a href="#home">Tournaments</a>
          <a href="#home">Community</a>

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

      <div
        class="mobile-menu-overlay"
        id="mobile-menu"
        aria-hidden="true"
      >
        <aside class="mobile-menu" aria-label="Mobile navigation">
          <div class="mobile-menu-header">
            <a class="logo" href="#home" data-page-link="home">
              <img src="/assets/svg/logo.svg" alt="" />
              <span>MiniGames</span>
            </a>
          </div>

          <nav class="mobile-menu-nav">
            <a href="#home" data-page-link="home">Home</a>
            <a href="#library" data-page-link="library">Library</a>
            <a href="#home">Tournaments</a>
            <a href="#home">Community</a>
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

      <main id="home-page" data-page-view="home">
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

            <a class="hero-button" href="#library" data-page-link="library">Browse Library</a>
          </div>
        </section>

        <section class="new-games" id="library">
          <div class="section-header">
            <div class="section-title">
              <span class="accent-bar"></span>
              <h2>New Games</h2>
            </div>

            <div class="slider-controls">
              <button
                class="slider-btn slider-prev"
                type="button"
                aria-label="Previous game"
              >
                ←
              </button>

              <button
                class="slider-btn slider-next"
                type="button"
                aria-label="Next game"
              >
                →
              </button>
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
              <span class="top-players-title-full">
                Top Players This Week
              </span>

              <span class="top-players-title-mobile">
                Top Players
              </span>
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
              engaging mini games to add to our platform. Submit your game<br>
              and reach thousands of players!
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


      <main
        id="library-page"
        class="library-page"
        data-page-view="library"
        hidden
      >
        <section class="library-section" aria-labelledby="library-title">
          <div class="library-container">
            <div class="library-heading">
              <div>
                <div class="library-title-row">
                  <span class="accent-bar"></span>
                  <h1 id="library-title">Game Library</h1>
                </div>

                <p class="library-subtitle">
                  Find your next quick break — cozy puzzles, strategy, cards,
                  farm and arcade games.
                </p>
              </div>

              <div class="library-sort">
                <span class="library-sort-label">Sort by</span>

                <button
                  class="library-sort-trigger"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded="false"
                >
                  <span class="library-sort-value">Newest</span>
                  <span class="library-sort-chevron" aria-hidden="true">⌄</span>
                </button>

                <div
                  class="library-sort-menu"
                  role="listbox"
                  aria-label="Sort games"
                  hidden
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected="true"
                    data-sort-value="Newest"
                  >
                    Newest
                  </button>

                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    data-sort-value="Highest Rated"
                  >
                    Highest Rated
                  </button>

                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    data-sort-value="Most Popular"
                  >
                    Most Popular
                  </button>
                </div>
              </div>
            </div>

            <div
              class="library-chips"
              role="group"
              aria-label="Game categories"
            >
              <button
                class="library-chip library-chip--active"
                type="button"
                aria-pressed="true"
              >
                All Games
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Puzzle
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Card
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Match
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Farm
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Strategy
              </button>
              <button class="library-chip" type="button" aria-pressed="false">
                Arcade
              </button>
            </div>

            <div class="library-grid" aria-live="polite"></div>

            <nav class="library-pagination" aria-label="Library pagination">
              <button
                class="pagination-arrow pagination-prev"
                type="button"
                aria-label="Previous page"
                disabled
              >
                ←
              </button>

              <div class="pagination-pages"></div>

              <button
                class="pagination-arrow pagination-next"
                type="button"
                aria-label="Next page"
              >
                →
              </button>
            </nav>
          </div>
        </section>
      </main>

      <footer class="footer">
        <div class="footer-main">
          <div class="footer-brand">
            <a class="footer-logo" href="#home" data-page-link="home">
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
                <li><a href="#home" data-page-link="home">Home</a></li>
                <li><a href="#library" data-page-link="library">Library</a></li>
                <li><a href="#home">Categories</a></li>
                <li><a href="#home">Tournaments</a></li>
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
          <p class="footer-copyright">
            © 2026 MiniGames. All rights reserved.
          </p>

          <a class="footer-school" href="#">
            <img
              src="/assets/svg/rs-logo-container.svg"
              alt=""
            />
            <span>RS School</span>
          </a>

          <a class="footer-github" href="#">
            <img
              src="/assets/svg/github-icon.svg"
              alt=""
            />
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

          <button
            class="auth-tab"
            type="button"
            data-auth-tab="register"
          >
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
              <div class="auth-field">
                <label for="login-email">
                  Email Address
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/mail.svg"
                    alt=""
                  />

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="e.g. alex@minigames.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </div>

              <div class="auth-field">
                <label for="login-password">
                  Password
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />

                  <input
                    id="login-password"
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
                    <img
                      src="/assets/svg/visibility.svg"
                      alt=""
                    />
                  </button>
                </div>
              </div>

              <button
                class="forgot-password"
                type="button"
              >
                Forgot Password?
              </button>

              <button
                class="auth-submit"
                type="submit"
              >
                Login
              </button>
            </form>

            <div class="auth-divider">
              <span>OR</span>
            </div>

            <button
              class="google-button"
              type="button"
            >
              <img
                class="google-icon"
                src="/assets/svg/Vector.svg"
                alt=""
              />

              Continue with Google
            </button>

            <p class="auth-switch-text">
              Don't have an account?

              <button
                type="button"
                data-auth-switch="register"
              >
                Register
              </button>
            </p>
          </section>

          <!-- REGISTER -->
          <section
            class="auth-panel"
            data-auth-panel="register"
          >
            <h2>Create Account</h2>

            <p class="auth-subtitle">
              Join MiniGames to track your score &amp; streak.
            </p>

            <form class="auth-form">
              <div class="auth-field">
                <label for="register-username">
                  Username
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/person.svg"
                    alt=""
                  />

                  <input
                    id="register-username"
                    type="text"
                    name="username"
                    placeholder="e.g. CozyGamer_99"
                    autocomplete="username"
                    required
                  />
                </div>
              </div>

              <div class="auth-field">
                <label for="register-email">
                  Email Address
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/mail.svg"
                    alt=""
                  />

                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="your.email@domain.com"
                    autocomplete="email"
                    required
                  />
                </div>
              </div>

              <div class="auth-field">
                <label for="register-password">
                  Password
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />

                  <input
                    id="register-password"
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
                    <img
                      src="/assets/svg/visibility.svg"
                      alt=""
                    />
                  </button>
                </div>
              </div>

              <div class="auth-field">
                <label for="register-confirm-password">
                  Confirm Password
                </label>

                <div class="auth-input">
                  <img
                    class="auth-input-icon"
                    src="/assets/svg/lock.svg"
                    alt=""
                  />

                  <input
                    id="register-confirm-password"
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
                    <img
                      src="/assets/svg/visibility.svg"
                      alt=""
                    />
                  </button>
                </div>
              </div>

              <button
                class="auth-submit"
                type="submit"
              >
                Create Account
              </button>
            </form>

            <div class="auth-divider">
              <span>OR</span>
            </div>

            <button
              class="google-button"
              type="button"
            >
              <img
                class="google-icon"
                src="/assets/svg/Vector.svg"
                alt=""
              />

              Sign up with Google
            </button>

            <p class="auth-switch-text">
              Already have an account?

              <button
                type="button"
                data-auth-switch="login"
              >
                Login
              </button>
            </p>
          </section>
        </div>
      </div>
    </dialog>


    <dialog class="game-details-dialog">
      <article class="game-details-card">
        <div class="game-details-hero">
          <img
            src="/assets/images/games/tukoni-forest-keepers-hero.jpg"
            alt="Tukoni: Forest Keepers"
          />

          <button
            class="game-details-close"
            type="button"
            aria-label="Close game details"
          >
            ×
          </button>
        </div>

        <div class="game-details-content">
          <header class="game-details-header">
            <div>
              <p class="game-details-eyebrow">Featured game</p>
              <h2>Tukoni: Forest Keepers</h2>
            </div>

            <div class="game-details-rating" aria-label="Rating 4.9">
              <img src="/assets/svg/star.svg" alt="" />
              <strong>4.9</strong>
            </div>
          </header>

          <p class="game-details-description">
            Tukoni: Forest Keepers — a cozy hand-drawn puzzle-adventure.
            You are Traveller, a little forest spirit on an important mission.
            Wander storybook meadows, visit mushroom villages, solve gentle
            hand-crafted puzzles, brew herbal teas and help the Tukoni forest
            prepare peacefully for the coming winter.
          </p>

          <div class="game-details-badges" aria-label="Game information">
            <span>Puzzle</span>
            <span>Solo</span>
            <span>40–90 min</span>
            <span>Free</span>
          </div>

          <div class="game-details-actions">
            <button class="game-play-button" type="button">Play Now</button>

            <button
              class="game-favorite-button"
              type="button"
              aria-pressed="false"
            >
              ♡ Add to Favorites
            </button>
          </div>

          <section class="game-records" aria-labelledby="records-title">
            <h3 id="records-title">Top Records</h3>

            <ol>
              <li>
                <span class="record-position">#1</span>
                <span>ForestSpirit</span>
                <strong>356,700</strong>
              </li>
              <li>
                <span class="record-position">#2</span>
                <span>TeaBrewer</span>
                <strong>332,400</strong>
              </li>
              <li>
                <span class="record-position">#3</span>
                <span>HerbalistPath</span>
                <strong>308,900</strong>
              </li>
            </ol>
          </section>

          <section class="game-comments" aria-labelledby="comments-title">
            <h3 id="comments-title">Comments</h3>

            <form class="comment-form">
              <label for="game-comment">Share your thoughts</label>

              <textarea
                id="game-comment"
                rows="1"
                maxlength="500"
                placeholder="Write a comment..."
              ></textarea>

              <button type="submit">Submit</button>
            </form>

            <div class="comment-list">
              <article class="comment-item">
                <div class="comment-heading">
                  <strong>ForestDweller</strong>
                  <button
                    class="comment-like"
                    type="button"
                    aria-pressed="false"
                    aria-label="Like comment by ForestDweller"
                  >
                    ♡ <span>12</span>
                  </button>
                </div>
                <p>
                  The hand-drawn art is absolutely magical. Every location
                  feels like a page from a children's storybook.
                </p>
              </article>

              <article class="comment-item">
                <div class="comment-heading">
                  <strong>HerbalTeaLover</strong>
                  <button
                    class="comment-like"
                    type="button"
                    aria-pressed="false"
                    aria-label="Like comment by HerbalTeaLover"
                  >
                    ♡ <span>5</span>
                  </button>
                </div>
                <p>
                  Perfect cozy evening game. The puzzles are gentle but
                  satisfying.
                </p>
              </article>

              <article class="comment-item">
                <div class="comment-heading">
                  <strong>CottageCoreMia</strong>
                  <button
                    class="comment-like"
                    type="button"
                    aria-pressed="false"
                    aria-label="Like comment by CottageCoreMia"
                  >
                    ♡ <span>8</span>
                  </button>
                </div>
                <p>
                  I want to live inside this game forever. The atmosphere is
                  pure warmth and calm.
                </p>
              </article>
            </div>
          </section>
        </div>
      </article>
    </dialog>

  `;
}
