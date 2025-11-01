document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.querySelector('[data-year]');
  if (yearSpan) yearSpan.textContent = String(new Date().getFullYear());

  // Set active navigation state
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // Mobile navigation toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      
      // Focus trapping when open
      if (!isOpen) {
        const firstLink = navLinks.querySelector('a');
        if (firstLink) setTimeout(() => firstLink.focus(), 100);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && 
          !navLinks.contains(e.target) && 
          !menuToggle.contains(e.target)) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Respect reduced motion preference
  try {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
      const hero = document.querySelector('.hero');
      if (hero && hero.animate) {
        hero.animate([
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, easing: 'ease-out' });
      }
    }
  } catch (e) {
    // silently ignore in older browsers
  }

  // Background music functionality
  try {
    // Audio Element Reference and Constants
    const bgMusic = document.getElementById('bgMusic');
    const BG_MUSIC_TIME_KEY = 'bgMusicTime';
    const BG_MUSIC_PLAYING_KEY = 'bgMusicPlaying';
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 500; // Save every 500ms

    if (bgMusic) {
      // Restore Playback Position
      const savedTime = localStorage.getItem(BG_MUSIC_TIME_KEY);
      const savedPlaying = localStorage.getItem(BG_MUSIC_PLAYING_KEY);

      if (savedTime !== null && !isNaN(Number(savedTime))) {
        bgMusic.currentTime = Number(savedTime);
      }

      // Autoplay with Fallback Handling
      const attemptPlay = async () => {
        try {
          // Only attempt autoplay if it was playing before
          if (savedPlaying === 'true') {
            await bgMusic.play();
          }
        } catch (error) {
          console.log('Autoplay was blocked. Music will start after user interaction.');
          // Add one-time click listener to attempt playback on first user interaction
          const playOnInteraction = () => {
            bgMusic.play().catch(() => {});
          };
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
        }
      };

      attemptPlay().then(() => {
        // Initialize button state after autoplay attempt
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle && bgMusic) {
          const isPlaying = !bgMusic.paused;
          musicToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
          musicToggle.dataset.playing = isPlaying ? 'true' : 'false';
          musicToggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
        }
      }).catch(() => {
        // If autoplay fails, ensure button shows paused state
        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
          musicToggle.setAttribute('aria-pressed', 'false');
          musicToggle.dataset.playing = 'false';
          musicToggle.setAttribute('aria-label', 'Play music');
        }
      });

      // Periodic Position Saving
      bgMusic.addEventListener('timeupdate', () => {
        const now = Date.now();
        if (now - lastSaveTime >= SAVE_INTERVAL) {
          try {
            localStorage.setItem(BG_MUSIC_TIME_KEY, String(bgMusic.currentTime));
            lastSaveTime = now;
          } catch (e) {
            // Handle localStorage quota exceeded errors
            if (e.name === 'QuotaExceededError') {
              console.warn('localStorage quota exceeded. Cannot save music position.');
            }
          }
        }
      });

      // Save on Page Unload
      window.addEventListener('beforeunload', () => {
        try {
          localStorage.setItem(BG_MUSIC_TIME_KEY, String(bgMusic.currentTime));
          localStorage.setItem(BG_MUSIC_PLAYING_KEY, String(!bgMusic.paused));
        } catch (e) {
          // Silently handle errors on unload
        }
      });

      // Global Play/Pause Toggle Function
      window.toggleMusic = () => {
        if (!bgMusic) return false;
        
        try {
          let isPlaying = false;
          if (bgMusic.paused) {
            bgMusic.play().catch(() => {});
            isPlaying = true;
          } else {
            bgMusic.pause();
            isPlaying = false;
          }
          
          // Update localStorage playing state
          try {
            localStorage.setItem(BG_MUSIC_PLAYING_KEY, String(isPlaying));
          } catch (e) {
            // Handle localStorage errors
          }
          
          return isPlaying;
        } catch (e) {
          return false;
        }
      };

      // Music Control Button Event Listener
      const musicToggle = document.getElementById('musicToggle');
      if (musicToggle) {
        musicToggle.addEventListener('click', () => {
          const isPlaying = window.toggleMusic();
          // Update aria-label for accessibility
          musicToggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
          // Update aria-pressed and data-playing for visual state
          musicToggle.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
          musicToggle.dataset.playing = isPlaying ? 'true' : 'false';
        });
      }
    }
  } catch (e) {
    // Error handling - ensure code fails gracefully
    console.error('Error initializing background music:', e);
  }
});

