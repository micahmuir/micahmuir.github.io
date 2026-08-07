// Modern Portfolio JavaScript
// Clean, minimal functionality for navigation and animations

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all functionality
  initPageTransitions();
  initNavigation();
  initNavbarAutoHide();
  initAnimations();
  initSmoothScrolling();
  initProjectSectionMemory();
  initGallerySystem();
  initBackgroundVisuals();
});

// Page transition system
function initPageTransitions() {
  // Intercept internal navigation links
  document.addEventListener('click', function(e) {
    // Already handled elsewhere (e.g. the gallery opened for an image
    // wrapped in an <a>) — don't navigate on top of it
    if (e.defaultPrevented) return;

    var link = e.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href) return;

    // Skip anchors, external links, and special targets
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') ||
        link.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;

    // Skip same-page links
    var resolved = new URL(href, window.location.href);
    if (resolved.pathname === window.location.pathname) return;

    e.preventDefault();

    // Hand the nav selection to the clicked link right away so its selection
    // animation (the ink burst on the About page) plays during the exit delay
    if (link.closest('.nav-links')) {
      document.querySelectorAll('.nav-links a.active').forEach(function(a) {
        a.classList.remove('active');
      });
      link.classList.add('active');
    }

    document.body.classList.add('page-leaving');

    setTimeout(function() {
      window.location.href = href;
    }, 400);
  });

  // Handle browser back/forward cache
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      document.body.classList.remove('page-leaving');
    }
  });
}

// Navigation highlighting
function initNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    
    // Check if we're in a project page and this is the projects link
    const isProjectPage = currentPath.includes('/personal_projects/') || 
                          currentPath.includes('/professional_projects/');
    const isProjectsLink = href.includes('projects.html');
    
    if (isProjectPage && isProjectsLink) {
      link.classList.add('active');
      link.textContent = 'Back to Projects';
      return; // Early return to avoid other checks
    }
    
    // Handle different path matching scenarios
    if (href === currentPath) {
      // Exact match
      link.classList.add('active');
    } else if (href === '/' && (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html'))) {
      // Home/About page match
      link.classList.add('active');
    } else if (href !== '/' && href.length > 1) {
      // For non-root paths, check if current path matches the href exactly
      // Remove leading slash for comparison if needed
      const hrefPath = href.startsWith('/') ? href : '/' + href;
      if (currentPath === hrefPath) {
        link.classList.add('active');
      }
    }
  });
}

// Navbar auto-hide on scroll for all screen sizes
function initNavbarAutoHide() {
  const navbar = document.querySelector('.navbar');
  let lastScrollTop = 0;
  let scrollTimeout;
  
  window.addEventListener('scroll', function() {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(function() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Apply auto-hide on all screen sizes
      if (scrollTop <= 50) {
        // At the very top of the page - show navbar fully
        navbar.classList.remove('navbar-hidden');
        navbar.classList.add('navbar-visible');
      } else if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down and past header - hide navbar (90% disappears)
        navbar.classList.add('navbar-hidden');
        navbar.classList.remove('navbar-visible');
      }
      // Note: Scrolling up does NOT show navbar unless at very top
      // This matches the requirement "doesn't fully reappear until scrolling all the way back up"
      
      lastScrollTop = scrollTop;
    }, 10); // Debounce scroll events
  });
}

// Scroll-triggered animations
function initAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => observer.observe(el));
  }
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Project Section Memory System
function initProjectSectionMemory() {
  // Handle "Back to Projects" links and navigation to remember last section
  const projectLinks = document.querySelectorAll('a[href="/projects.html"], a[href="projects.html"], a[href="../projects.html"]');
  
  projectLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Check if we have a saved project section preference
      const savedSection = localStorage.getItem('lastProjectSection');
      
      if (savedSection) {
        // Update the href to include the section hash
        const originalHref = this.getAttribute('href');
        const separator = originalHref.includes('?') ? '&' : '#';
        this.setAttribute('href', `${originalHref}${separator}section=${savedSection}`);
      }
    });
  });
  
  // Handle URL hash parameters for direct section access
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const sectionParam = urlParams.get('section');
  
  if (sectionParam && (sectionParam === 'personal' || sectionParam === 'professional')) {
    // Update localStorage with the URL parameter
    localStorage.setItem('lastProjectSection', sectionParam);
    
    // Clean up the URL hash
    if (window.history && window.history.replaceState) {
      const newUrl = window.location.pathname + window.location.search;
      window.history.replaceState({}, document.title, newUrl);
    }
  }
}

// Utility function to navigate to projects with specific section
window.navigateToProjects = function(section) {
  if (section === 'personal' || section === 'professional') {
    localStorage.setItem('lastProjectSection', section);
  }
  window.location.href = '/projects.html';
};

// Export for global access
window.ProjectSectionMemory = {
  setSection: function(section) {
    if (section === 'personal' || section === 'professional') {
      localStorage.setItem('lastProjectSection', section);
    }
  },
  
  getSection: function() {
    return localStorage.getItem('lastProjectSection') || 'professional';
  },
  
  clearSection: function() {
    localStorage.removeItem('lastProjectSection');
  }
};

// =======================================================================================
// ELEGANT GALLERY SYSTEM
// =======================================================================================

let galleryState = {
  isOpen: false,
  currentIndex: 0,
  mediaItems: [],
  overlay: null
};

function initGallerySystem() {
  createGalleryOverlay();
  makeMediaClickable();
}

function createGalleryOverlay() {
  // Create gallery overlay HTML
  const overlayHTML = `
    <div class="gallery-overlay" id="galleryOverlay">
      <div class="gallery-container">
        <div class="gallery-controls">
          <button class="gallery-btn" id="galleryClose" title="Close Gallery">×</button>
        </div>
        
        <button class="gallery-nav prev" id="galleryPrev" title="Previous">‹</button>
        <button class="gallery-nav next" id="galleryNext" title="Next">›</button>
        
        <img class="gallery-media" id="galleryMedia" alt="Gallery Image">
        <video class="gallery-media" id="galleryVideo" controls style="display: none;">
          Your browser does not support the video tag.
        </video>
        
        <div class="gallery-counter" id="galleryCounter">1 / 1</div>
        <div class="gallery-caption" id="galleryCaption"></div>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.insertAdjacentHTML('beforeend', overlayHTML);
  
  // Cache overlay element
  galleryState.overlay = document.getElementById('galleryOverlay');
  
  // Add event listeners
  document.getElementById('galleryClose').addEventListener('click', closeGallery);
  document.getElementById('galleryPrev').addEventListener('click', showPrevious);
  document.getElementById('galleryNext').addEventListener('click', showNext);
  
  // Close on overlay click (but not on media click)
  galleryState.overlay.addEventListener('click', function(e) {
    if (e.target === galleryState.overlay) {
      closeGallery();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', handleKeyboard);
}

function makeMediaClickable() {
  // Find all images and videos in the main content area
  const contentSelectors = [
    '.main-content img',
    '.paper-panel img', 
    '.main-content video',
    '.paper-panel video',
    '.project-media img',
    '.project-media video'
  ];
  
  contentSelectors.forEach(selector => {
    const mediaElements = document.querySelectorAll(selector);
    mediaElements.forEach(media => {
      // Skip if already processed or is a gallery control
      if (media.classList.contains('clickable-media') ||
          media.closest('.gallery-overlay') ||
          media.classList.contains('gallery-media')) {
        return;
      }

      // Skip the split-view media rail: thumbs swap the stage and the
      // stage handles its own fullscreen (project-split.js)
      if (media.closest('.project-media-rail')) {
        return;
      }
      
      // Make clickable
      media.classList.add('clickable-media');
      media.addEventListener('click', function(e) {
        e.preventDefault();
        openGallery(this);
      });
      
      // Add visual hint
      media.title = media.title || 'Click to view in gallery';
    });
  });
}

function openGallery(clickedMedia) {
  // Collect all clickable media on the page
  const allMedia = Array.from(document.querySelectorAll('.clickable-media'));
  galleryState.mediaItems = allMedia;
  galleryState.currentIndex = allMedia.indexOf(clickedMedia);
  galleryState.isOpen = true;
  
  // Show overlay
  galleryState.overlay.classList.add('active');
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  
  // Show current media
  showCurrentMedia();
  
  // Update navigation visibility
  updateNavigation();
}

function closeGallery() {
  galleryState.isOpen = false;
  galleryState.overlay.classList.remove('active');
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  // Hide all media elements
  document.getElementById('galleryMedia').style.display = 'none';
  document.getElementById('galleryVideo').style.display = 'none';
}

function showPrevious() {
  if (galleryState.currentIndex > 0) {
    galleryState.currentIndex--;
    showCurrentMedia();
    updateNavigation();
  }
}

function showNext() {
  if (galleryState.currentIndex < galleryState.mediaItems.length - 1) {
    galleryState.currentIndex++;
    showCurrentMedia();
    updateNavigation();
  }
}

function showCurrentMedia() {
  const currentMedia = galleryState.mediaItems[galleryState.currentIndex];
  const galleryImg = document.getElementById('galleryMedia');
  const galleryVideo = document.getElementById('galleryVideo');
  const galleryCaption = document.getElementById('galleryCaption');
  
  if (currentMedia.tagName === 'IMG') {
    // Show image
    galleryImg.src = currentMedia.src;
    galleryImg.alt = currentMedia.alt || 'Gallery Image';
    galleryImg.style.display = 'block';
    galleryVideo.style.display = 'none';
    
    // Pause any videos
    if (!galleryVideo.paused) {
      galleryVideo.pause();
    }
  } else if (currentMedia.tagName === 'VIDEO') {
    // Show video
    galleryVideo.src = currentMedia.src;
    galleryVideo.poster = currentMedia.poster || '';
    galleryVideo.style.display = 'block';
    galleryImg.style.display = 'none';
  }
  
  // Extract and show caption
  updateCaption(currentMedia);
  updateCounter();
}

function updateCaption(mediaElement) {
  const galleryCaption = document.getElementById('galleryCaption');
  let captionText = '';
  
  // Look for the specific div structure pattern used in the project pages
  const parent = mediaElement.parentElement;
  
  // Primary pattern: image-with-caption container with .caption div sibling
  if (parent && parent.classList.contains('image-with-caption')) {
    const captionDiv = parent.querySelector('.caption');
    if (captionDiv) {
      captionText = captionDiv.textContent.trim();
    }
  }
  
  // Secondary pattern: .caption div as direct sibling
  if (!captionText) {
    const captionDiv = parent?.querySelector('.caption');
    if (captionDiv) {
      captionText = captionDiv.textContent.trim();
    }
  }
  
  // Tertiary pattern: figcaption in figure elements
  if (!captionText) {
    const figcaption = parent?.querySelector('figcaption') || 
                     parent?.parentElement?.querySelector('figcaption');
    if (figcaption) {
      captionText = figcaption.textContent.trim();
    }
  }
  
  // Update caption display
  if (captionText) {
    galleryCaption.textContent = captionText;
    galleryCaption.classList.add('visible');
  } else {
    galleryCaption.textContent = '';
    galleryCaption.classList.remove('visible');
  }
}

function updateNavigation() {
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  
  // Show/hide navigation based on position
  prevBtn.style.opacity = galleryState.currentIndex > 0 ? '0.7' : '0.3';
  nextBtn.style.opacity = galleryState.currentIndex < galleryState.mediaItems.length - 1 ? '0.7' : '0.3';
  
  prevBtn.style.pointerEvents = galleryState.currentIndex > 0 ? 'auto' : 'none';
  nextBtn.style.pointerEvents = galleryState.currentIndex < galleryState.mediaItems.length - 1 ? 'auto' : 'none';
}

function updateCounter() {
  const counter = document.getElementById('galleryCounter');
  counter.textContent = `${galleryState.currentIndex + 1} / ${galleryState.mediaItems.length}`;
}

function handleKeyboard(e) {
  if (!galleryState.isOpen) return;
  
  switch(e.key) {
    case 'Escape':
      closeGallery();
      break;
    case 'ArrowLeft':
      showPrevious();
      break;
    case 'ArrowRight':
      showNext();
      break;
  }
}

// Auto-initialize when new content is loaded
const galleryObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(makeMediaClickable, 100);
    }
  });
});

// Start observing
galleryObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Export gallery functions for global access
window.Gallery = {
  open: openGallery,
  close: closeGallery,
  refresh: makeMediaClickable
};

// =======================================================================================
// BACKGROUND VISUAL: WATERCOLOR
// Pigment washes that bleed and mix on a persistent canvas; hovering clickable
// elements releases extra pigment. This is the single site-wide background.
// =======================================================================================

// --- Shared per-page color palettes ---
var PAGE_PALETTES = {
  'page-about': [
    '#00897b', '#26a69a', '#004d40', '#00bfae', '#009688',
    '#4dd0e1', '#006064', '#80cbc4', '#26c6da', '#00838f'
  ],
  'page-resume': [
    '#ff9800', '#f57c00', '#e65100', '#ffb74d', '#ff6f00',
    '#ffa726', '#ffd54f', '#ff8f00', '#ffcc80', '#ffb300'
  ],
  'page-projects': [
    '#ffd21c', '#ffe066', '#fff3b0', '#ffd21c', '#ffe066',
    '#fff3b0', '#ffd21c', '#ffe066'
  ],
  'page-projects-professional': [
    '#1976d2', '#1565c0', '#0d47a1', '#42a5f5', '#1e88e5',
    '#90caf9', '#64b5f6', '#2196f3', '#bbdefb'
  ],
  'projects-page': [
    '#ffd21c', '#ffe066', '#fff3b0', '#ffd21c', '#ffe066'
  ],
  'default': [
    '#888888', '#aaaaaa', '#666666', '#999999', '#777777'
  ]
};

function getPagePalette() {
  var body = document.body;
  if (body.classList.contains('page-projects') && body.classList.contains('professional-active')) {
    return PAGE_PALETTES['page-projects-professional'];
  }
  if (body.classList.contains('page-about')) return PAGE_PALETTES['page-about'];
  if (body.classList.contains('page-resume')) return PAGE_PALETTES['page-resume'];
  if (body.classList.contains('page-projects')) return PAGE_PALETTES['page-projects'];
  if (body.classList.contains('projects-page')) return PAGE_PALETTES['projects-page'];
  return PAGE_PALETTES['default'];
}

// Fixed-position elements sit outside mobile pinch-zoom: the browser scales
// and pans ordinary page content around them while a `position: fixed` layer
// stays put at its native size, so a full-viewport background canvas visually
// drifts apart from (and can appear to move opposite to) the content it's
// meant to track. Counter that with a matching CSS transform driven by the
// Visual Viewport API, so the canvas rides the same pinch-zoom as everything
// else instead of staying anchored to the layout viewport.
//
// The transform alone keeps it aligned at any zoom level, in or out, but
// its box is still only innerWidth x innerHeight — zoomed OUT past 1:1 the
// visual viewport shows more page than that box covers once shrunk down,
// leaving bare margin at the far edges. `onResize`, if given, is the sim's
// own resize() — called (debounced, so a pinch gesture doesn't thrash GL
// buffer reallocation on every touch event) after growing the box to the
// current visual-viewport size, so the sim's internal resolution settles to
// match and the coverage gap closes once the gesture stops.
function syncFixedToVisualViewport(el, onResize) {
  var vv = window.visualViewport;
  if (!vv) return;
  el.style.transformOrigin = '0 0';

  function applyTransform() {
    el.style.transform = 'scale(' + vv.scale + ') translate(' + (-vv.offsetLeft) + 'px, ' + (-vv.offsetTop) + 'px)';
  }

  var settleTimer = null;
  function scheduleResettle() {
    if (!onResize) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(function() {
      if (vv.scale === 1) {
        // No pinch-zoom in play (desktop, or mobile at 1:1): the CSS
        // 100vw/100lvh box tracks the viewport by itself. An inline px size
        // would go stale on the next browser-zoom step and make the whole
        // field lurch sideways until the next resettle — so clear it.
        el.style.width = '';
        el.style.height = '';
      } else {
        el.style.width = vv.width + 'px';
        el.style.height = vv.height + 'px';
      }
      onResize();
    }, 150);
  }

  vv.addEventListener('resize', function() { applyTransform(); scheduleResettle(); });
  vv.addEventListener('scroll', function() { applyTransform(); scheduleResettle(); });
  applyTransform();
}

// --- Manager: one background visual per page ---
function initBackgroundVisuals() {
  // Photo-first pages (photography portfolio) provide their own full-black
  // stage — skip the background entirely so nothing animates behind the photos
  if (document.querySelector('.stage')) return;

  // Theme test: the About page gets the liquid ink-boundary sim; if WebGL is
  // unavailable it falls through to the watercolor canvas like every other page
  if (document.body.classList.contains('page-about')) {
    if (createInkBoundaryVisual()) return;
  }

  createWatercolorVisual();
}

// =======================================================================================
// BACKGROUND VISUAL 2: WATERCOLOR CANVAS
// Pigment sources wander the page and bleed washes of the page palette onto a
// persistent canvas. Paint slowly "dries" (fades) so the piece keeps evolving.
// Hovering a clickable element releases extra pigment from its footprint.
// =======================================================================================

function createWatercolorVisual() {

  var SIM = {
    // -- Rendering --
    resolutionScale:      0.5,      // Render at half resolution: softer edges, faster
    blurCSS:              '24px',   // CSS blur for watery diffusion
    canvasOpacity:        0.72,     // Overall intensity of the whole effect

    // -- Bloom lifecycle --
    // The painting is fully redrawn every frame and each bloom's opacity, size,
    // position, and shape are smooth analytic functions of time. Nothing
    // accumulates in the canvas between frames, so nothing can flicker, and
    // pigment always dries away completely on its own.
    bloomLifeMin:         14,       // Bloom lifetime range (seconds)
    bloomLifeMax:         26,
    bloomGrowPortion:     0.12,     // Fraction of life spent soaking in
    bloomFadePortion:     0.38,     // Fraction of life spent drying away
    bloomAlphaMax:        0.42,     // Peak bloom opacity (scaled by canvasOpacity)
    bloomRadiusMin:       80,       // Final bloom radius range (CSS px)
    bloomRadiusMax:       190,

    // -- Turbulence: blooms churn like pigment dropped in moving water --
    lobeCount:            3,        // Soft lobes per bloom (irregular, non-circular)
    lobeOrbit:            0.45,     // Lobe offset from center, fraction of radius
    lobeChurnSpeed:       0.83,     // How fast lobes swirl around the bloom (rad/s)
    lobeBreathe:          0.22,     // Lobe size modulation depth
    driftSpeed:           13.5,     // Bloom wander speed (CSS px/s)
    swirlStrength:        1.6,      // How strongly the wander direction meanders
    spreadRate:           1.5,      // Radius growth time-scale — higher = blooms
                                    // reach full size earlier in their life

    // -- Ambient blooms, seeping from the perimeters of visible content blocks --
    ambientMaxBlooms:     11,       // Max concurrent ambient blooms
    ambientSpawnDelay:    0.9,      // Seconds between ambient bloom spawns
    edgeBand:             0.18,     // Viewport-edge band used only as a fallback
                                    // when no content blocks are on screen

    // -- Hover pigment, seeping from the hovered element's outline --
    hoverMaxBlooms:       8,        // Max concurrent hover blooms
    hoverSpawnDelay:      0.3,      // Seconds between spawns while hovering
    hoverAlphaMax:        0.55,     // Peak opacity for hover blooms
    hoverLifeMin:         8,        // Hover blooms are shorter-lived
    hoverLifeMax:         14,
    hoverRadiusMin:       55,
    hoverRadiusMax:       130
  };

  var canvas = document.createElement('canvas');
  canvas.id = 'watercolor-canvas';
  canvas.style.filter = 'blur(' + SIM.blurCSS + ')';
  canvas.style.opacity = SIM.canvasOpacity;
  document.body.appendChild(canvas);
  syncFixedToVisualViewport(canvas, function() { resize(); });
  var ctx = canvas.getContext('2d');

  var scale = SIM.resolutionScale;
  var W, H;
  var running = true;
  var rafId;

  function resize() {
    // Size the drawing buffer from the canvas's actual on-screen box so the
    // paint is never stretched. On phones, the URL bar showing/hiding fires
    // resize events without changing that box (the canvas spans the large
    // viewport) — the early return skips those so scrolling stays smooth.
    var w = Math.max(1, Math.round((canvas.clientWidth || window.innerWidth) * scale));
    var h = Math.max(1, Math.round((canvas.clientHeight || window.innerHeight) * scale));
    if (w === W && h === H) return;
    W = canvas.width = w;
    H = canvas.height = h;
  }

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  var palette = getPagePalette();

  function pickColor() {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // --- Pigment blooms ---
  // Each bloom is a cluster of soft lobes that swirl around its center and
  // breathe in size — an irregular, churning wash rather than a flat circle.
  var blooms = [];

  function easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  }

  function smoothstep(u) {
    u = Math.max(0, Math.min(1, u));
    return u * u * (3 - 2 * u);
  }

  function bloomRadius(min, max) {
    return (min + Math.random() * (max - min)) * scale;
  }

  function spawnBloom(x, y, hex, radius, peakAlpha, isHover) {
    var life = isHover
      ? SIM.hoverLifeMin + Math.random() * (SIM.hoverLifeMax - SIM.hoverLifeMin)
      : SIM.bloomLifeMin + Math.random() * (SIM.bloomLifeMax - SIM.bloomLifeMin);
    var lobes = [];
    for (var l = 0; l < SIM.lobeCount; l++) {
      lobes.push({
        baseAngle: (l / SIM.lobeCount) * Math.PI * 2 + Math.random() * 1.5,
        churnDir: Math.random() < 0.5 ? -1 : 1,
        churnFreq: 0.6 + Math.random() * 0.8,
        breathePhase: Math.random() * Math.PI * 2,
        breatheFreq: 0.3 + Math.random() * 0.5,
        sizeScale: 0.55 + Math.random() * 0.35
      });
    }
    blooms.push({
      x: x,
      y: y,
      rgb: hexToRgb(hex),
      r1: radius,
      life: life,
      age: 0,
      peak: peakAlpha,
      dir: Math.random() * Math.PI * 2,
      seed: Math.random() * 1000,
      lobes: lobes,
      isHover: !!isHover
    });
  }

  // Smooth soak-in → plateau → dry-out envelope
  function bloomEnvelope(t) {
    var grow = SIM.bloomGrowPortion;
    var fade = SIM.bloomFadePortion;
    if (t < grow) return smoothstep(t / grow);
    if (t > 1 - fade) return smoothstep((1 - t) / fade);
    return 1;
  }

  var viewTop = 0; // current scroll offset in canvas pixels, set each frame

  function drawBloom(b, timeSec) {
    // Cull blooms far outside the visible scroll window
    if (b.y < viewTop - b.r1 * 2 - 60 || b.y > viewTop + H + b.r1 * 2 + 60) return;
    var t = Math.min(1, b.age / b.life);
    var a = b.peak * bloomEnvelope(t);
    if (a <= 0.002) return;
    var r = Math.max(4, b.r1 * (0.25 + 0.75 * easeOut(Math.min(1, t * SIM.spreadRate))));
    var perLobe = a / (1 + (SIM.lobeCount - 1) * 0.45); // share alpha across overlapping lobes
    for (var l = 0; l < b.lobes.length; l++) {
      var lb = b.lobes[l];
      // Lobes swirl slowly around the bloom center and breathe in size
      var ang = lb.baseAngle +
        lb.churnDir * timeSec * SIM.lobeChurnSpeed * lb.churnFreq +
        Math.sin(timeSec * lb.breatheFreq + lb.breathePhase) * 0.7;
      var off = r * SIM.lobeOrbit *
        (0.65 + 0.35 * Math.sin(timeSec * lb.breatheFreq * 0.7 + lb.breathePhase));
      var lx = b.x + Math.cos(ang) * off;
      var ly = b.y + Math.sin(ang) * off;
      var lr = Math.max(3, r * lb.sizeScale *
        (1 + SIM.lobeBreathe * Math.sin(timeSec * lb.breatheFreq + lb.breathePhase * 1.7)));
      var g = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      g.addColorStop(0, 'rgba(' + b.rgb[0] + ',' + b.rgb[1] + ',' + b.rgb[2] + ',' + perLobe + ')');
      g.addColorStop(0.65, 'rgba(' + b.rgb[0] + ',' + b.rgb[1] + ',' + b.rgb[2] + ',' + (perLobe * 0.55) + ')');
      g.addColorStop(1, 'rgba(' + b.rgb[0] + ',' + b.rgb[1] + ',' + b.rgb[2] + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function countHoverBlooms() {
    var n = 0;
    for (var i = 0; i < blooms.length; i++) {
      if (blooms[i].isHover) n++;
    }
    return n;
  }

  // --- Spawn positions ---
  // Fallback only: a band around the viewport edge, used when no content
  // blocks are currently visible
  function perimeterPoint() {
    var band = SIM.edgeBand;
    var side = Math.floor(Math.random() * 4);
    var u = Math.random();
    var v = Math.random() * band;
    var x, y;
    if (side === 0)      { x = u;     y = v; }       // top
    else if (side === 1) { x = u;     y = 1 - v; }   // bottom
    else if (side === 2) { x = v;     y = u; }       // left
    else                 { x = 1 - v; y = u; }       // right
    return { x: x * W, y: y * H + window.pageYOffset * scale };
  }

  // Ambient pigment seeps from the perimeters of content blocks on screen
  var AMBIENT_BLOCKS = '.paper-panel, .card, .timeline-content, .project-nav, .video-container';

  function visibleBlockRects() {
    var els = document.querySelectorAll(AMBIENT_BLOCKS);
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight && r.width > 40 && r.height > 40) {
        out.push(r);
      }
    }
    return out;
  }

  function spawnAmbientBloom() {
    var rects = visibleBlockRects();
    var p = rects.length
      ? rectPerimeterPoint(rects[Math.floor(Math.random() * rects.length)])
      : perimeterPoint();
    spawnBloom(p.x, p.y, pickColor(),
      bloomRadius(SIM.bloomRadiusMin, SIM.bloomRadiusMax),
      SIM.bloomAlphaMax, false);
  }

  // Random point on an element's outline, nudged slightly outward, so hover
  // pigment seeps from the perimeter of the emphasised item.
  // Returned in document space so blooms stay anchored to their block on scroll.
  function rectPerimeterPoint(rect) {
    var side = Math.floor(Math.random() * 4);
    var pad = 6 + Math.random() * 22;
    var x, y;
    if (side === 0)      { x = rect.left + Math.random() * rect.width; y = rect.top - pad; }
    else if (side === 1) { x = rect.left + Math.random() * rect.width; y = rect.bottom + pad; }
    else if (side === 2) { x = rect.left - pad;  y = rect.top + Math.random() * rect.height; }
    else                 { x = rect.right + pad; y = rect.top + Math.random() * rect.height; }
    return { x: x * scale, y: (y + window.pageYOffset) * scale };
  }

  // --- Hover pigment release ---
  var CLICKABLE = 'a, button, .card, .clickable-media, .project-nav-item';
  var hoverEl = null;
  var lastHoverSpawn = 0;

  function spawnHoverBloom() {
    if (!hoverEl) return;
    var rect = hoverEl.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    var p = rectPerimeterPoint(rect);
    spawnBloom(p.x, p.y, pickColor(),
      bloomRadius(SIM.hoverRadiusMin, SIM.hoverRadiusMax),
      SIM.hoverAlphaMax, true);
  }

  function onPointerOver(e) {
    var t = (e.target && e.target.closest) ? e.target.closest(CLICKABLE) : null;
    if (t && t !== hoverEl) {
      hoverEl = t;
      lastHoverSpawn = 0; // lets the first bloom start right away (it still grows in gently)
    } else if (!t) {
      hoverEl = null;
    }
  }

  function onPointerLeaveDoc() {
    hoverEl = null;
  }

  document.addEventListener('pointerover', onPointerOver, true);
  document.documentElement.addEventListener('pointerleave', onPointerLeaveDoc);

  // Refresh palette when body classes change (e.g. personal/professional toggle)
  var classObserver = new MutationObserver(function() {
    palette = getPagePalette();
  });
  classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // --- Animation loop ---
  var lastAmbientSpawn = 0;
  var lastNow = 0;

  function frame(now) {
    if (!running) return;
    if (now === undefined) now = performance.now();
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60;
    lastNow = now;
    var timeSec = now / 1000;

    // Full redraw every frame — every value is a continuous function of time,
    // so the result is smooth by construction. Blooms live in document space
    // and the camera follows the scroll position, so paint moves with content.
    viewTop = window.pageYOffset * scale;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, -viewTop);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = blooms.length - 1; i >= 0; i--) {
      var b = blooms[i];
      b.age += dt;
      // Turbulent wander: the drift direction itself meanders smoothly
      b.dir += (Math.sin(timeSec * 0.13 + b.seed) +
                Math.sin(timeSec * 0.31 + b.seed * 2.7)) * SIM.swirlStrength * dt;
      b.x += Math.cos(b.dir) * SIM.driftSpeed * scale * dt;
      b.y += Math.sin(b.dir) * SIM.driftSpeed * scale * dt;
      if (b.age >= b.life) {
        blooms.splice(i, 1);
      } else {
        drawBloom(b, timeSec);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Ambient blooms seeping from the perimeters of visible content blocks
    var hoverCount = countHoverBlooms();
    var ambientCount = blooms.length - hoverCount;
    if (ambientCount < SIM.ambientMaxBlooms &&
        now - lastAmbientSpawn > SIM.ambientSpawnDelay * 1000) {
      lastAmbientSpawn = now;
      spawnAmbientBloom();
    }

    // Sustained hover keeps seeping pigment from the emphasised element's outline
    if (hoverEl && !document.contains(hoverEl)) hoverEl = null;
    if (hoverEl && hoverCount < SIM.hoverMaxBlooms &&
        now - lastHoverSpawn > SIM.hoverSpawnDelay * 1000) {
      lastHoverSpawn = now;
      spawnHoverBloom();
    }

    rafId = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else if (running) {
      frame();
    }
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  // Seed a batch of staggered blooms so the canvas has color within seconds
  for (var si = 0; si < 8; si++) {
    spawnAmbientBloom();
    blooms[blooms.length - 1].age = Math.random() * 4;
  }

  frame();

  return {
    stop: function() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.documentElement.removeEventListener('pointerleave', onPointerLeaveDoc);
      classObserver.disconnect();
      canvas.remove();
    }
  };
}

// =======================================================================================
// BACKGROUND VISUAL 3: LIQUID INK BOUNDARY (theme test — About page)
// A tiny GPU advection simulation of TWO liquids. The background itself is an
// ink — a parchment-toned liquid with visible internal marbling — and each
// content card is a blob of dark ink suspended in it. A divergence-free
// curl-noise flow stirs everything, and an interface-shear term adds extra
// swirl along every dye boundary, so where the two inks meet they actively
// roll up and curl into each other: ink mixing with ink, not ink on paper.
//
// Cost: two ping-pong textures (~5/8 screen resolution, capped) and two
// fragment passes per frame — one sim step, one colorize. No geometry, no CPU
// per-pixel work. The dye field is advected in screen space but shifted by the
// scroll delta each frame, so tendrils stay anchored to their cards.
// =======================================================================================

function createInkBoundaryVisual() {

  var SIM = {
    // -- Resolution: sim runs on a reduced buffer, CSS scales it up --
    maxSimDim:     1200,     // Cap on the sim buffer's largest dimension (px)
    maxScale:      0.62,     // Never simulate above ~5/8 resolution

    // -- Palette: two liquids, ink on ink --
    // The BACKGROUND is itself a liquid: its density (G channel) relaxes
    // toward a drifting noise pattern and is displayed as a blend between a
    // light and a deep parchment tone, so it shows constant internal marbling
    // and visibly reacts when stirred. The panes and the ink they bleed are
    // ONE substance (paneColor) suspended in that liquid.
    bgColor:       '#f2ead9',   // Background liquid, light tone (creamy beige)
    bgDeep:        '#d2c5a6',   // Background liquid, deep tone — G interpolates
                                // between these two. The CSS ink-active page
                                // background is their midpoint (#e2d7bf).
    bgRate:        0.5,      // How fast the background liquid re-forms its
                             // marbling after being stirred aside (1/s)

    // -- Boundary band: where the two inks are continuously injected --
    // Both inks live just OUTSIDE the card edge (the glass panels are opaque
    // enough to hide anything under them): the deep ink hugs the edge, the
    // bright ink rings it further out, and the flow mixes them where they meet
    bandWidth:     54,       // Total reach of the ink bands from the card edge (CSS px)
    cornerRadius:  18,       // Card corner rounding — matches --border-radius (CSS px)
    amorph:        11,       // Boundary wobble amplitude (CSS px): the pane SDF is
                             // displaced by slow two-octave noise, so the blob's
                             // outline meanders organically instead of tracing the
                             // straight CSS rectangle (total swing ~±1.5×this —
                             // keep below the panes' text padding)

    // -- Pane fill: the panes are not drawn as rectangles — they are regions
    //    of strong ink injection in the SAME advected dye field as the bleed,
    //    so the pane body, its boundary, and its tendrils are one continuous
    //    fluid: a rectangular blob of ink mixing into the background --
    paneColor:     '#20221f',   // The ink — pane body and everything it sheds
                                // (near-black warm grey)
    injectRate:    2.8,      // Dye injection per second inside the bands
    decayRate:     0.18,     // Fractional dye decay per second — sets tendril lifetime

    // -- Turbulent flow: curl noise --
    // The five values the control table exposes are set at fixed fractions of
    // their slider ranges: turbulence 35%, mixing 10%, shear 20%, bleed 90%,
    // ink life 50% — a calmer, coarser stir than the sim's own calibration,
    // with the panes pushing hard outward
    flowSpeed:     4200,     // Overall stirring strength (raw curl magnitude is ~0.01,
                             // so this lands around 30-40 CSS px/s of drift)
    flowScale1:    0.009,    // Large swirls: ~110 CSS px wavelength
    flowScale2:    0.027,    // Fine filaments: ~37 CSS px wavelength — coarse, so the
                             // background marbles in broad veils rather than fine grain
    flowEvolve:    0.09,     // How fast the flow pattern itself morphs over time
    bleedSpeed:    36,       // Outward current from every pane edge (CSS px/s) — the
                             // panes continuously push fresh ink away as they bleed,
                             // stretching the seep points into fingers
    shearSpeed:    16,       // Interface shear: extra swirl along every dye
                             // boundary (CSS px/s at full saturation). This is
                             // what makes the two inks actively roll up and
                             // curl into each other where they meet, instead
                             // of just diffusing side by side

    // -- Interaction --
    hoverBoost:    1.9,      // Injection multiplier while a card is hovered
    boostEase:     3.0,      // How quickly the hover boost fades in/out (1/s)

    // -- Interaction: click drops an ink splot, click-drag paints a stroke.
    //    Brush ink lives in its own dye channel with its own color, so the
    //    control panel can recolor it independently of the pane ink --
    brushColor:    '#8c2f22',   // Default brush ink (control panel can change it)
    brushScale:    1,        // Brush size multiplier (control panel)
    brushDecay:    0.19,     // Brush ink decay (1/s), separate from the pane fade.
                             // The "Ink life" slider maps exponentially onto
                             // 6 (instant dispersal) .. 0.006 (lingers minutes,
                             // for painting); 0.19 is the midpoint of that curve
                             // (6 * 0.001^0.5), i.e. the slider at 50%
    splatRadius:   34,       // Single-click splot radius (CSS px, ±random)
    strokeRadius:  16,       // Radius of each stroke stamp while dragging (CSS px)
    strokeSpacing: 12,       // Distance dragged between stroke stamps (CSS px)
    splatStrength: 16,       // Injection rate at a splat's center (dye/s)
    maxSplats:     16,       // Uniform-array size; oldest splats drop first

    // -- Placeable objects (control-table buttons): flow emitters are
    //    persistent directional jets defined by click-drag (position +
    //    vector); ink sources are persistent bleeding pools of the brush
    //    color current at placement. Both live in document space --
    emitterRadius: 64,       // Gaussian radius of a flow emitter (CSS px)
    emitterGain:   4.5,      // Drag length (CSS px) -> jet speed (CSS px/s)
    emitterMin:    80,       // Speed floor — even a short flick makes a real current
    emitterMax:    800,      // Jet speed cap (CSS px/s)
    maxEmitters:   8,        // Uniform-array size; oldest emitter drops first
    sourceRadius:  26,       // Gaussian radius of an ink source (CSS px)
    sourceRate:    8,        // Dye injection at a source's center (dye/s)
    maxSources:    8,        // Uniform-array size; oldest source drops first

    // -- Motifs: a procession of recognizable silhouettes (gear, mug, brush,
    //    book, magnifier, peace sign, scissors, drill, wrench, boot) that rise
    //    from behind the bio pane's edge and set back into it, one launching
    //    every motifCycle. They inject the SAME pane ink, only to a partial density —
    //    so they read as tendril-shade grey, and wherever the pane's own ink
    //    is already denser they simply are not there. That is the whole
    //    occlusion model: the shape is "behind the frame" because the frame's
    //    ink outranks it, with no masking anywhere --
    motifRadius:   96,       // Silhouette outer radius (CSS px)
    motifInk:      0.70,     // Peak dye density it holds (pane body is 1.0). Has to
                             // sit clearly above the surrounding tendrils, or the
                             // silhouette just reads as one more blob in the wash —
                             // and the shallower the rise, the denser it must be to
                             // show through the halo it stays buried in
    motifRate:     20.0,     // How fast it re-asserts itself against the flow (1/s).
                             // This is the recognizability knob: the flow drags ink
                             // off the shape at ~35 CSS px/s, so a slow stamp is
                             // smeared shapeless before it is ever legible — at 8/s
                             // the gear survived but the brush handle dissolved
                             // outright. At 20/s the silhouette refills within a
                             // couple of frames and the flow can only take what
                             // leaves it, which is exactly the look: a firm shape
                             // shedding ink downstream
    // The "frame" the eye reads is not the CSS rect — it is the pane's ink
    // mass, which stays saturated for ~60 CSS px past the edge and only
    // thins out around ~110. So the rise is measured against THAT: at rest
    // the shape sits inside the solid halo (invisible by density alone), and
    // at peak its center clears the halo, leaving the outer half of the
    // silhouette in open parchment and the inner half drowned in ink
    motifHide:    -0.60,     // At rest, center this many radii INSIDE the pane edge
    motifPeak:     1.05,     // At the peak of the rise, this many radii outside.
                             // A shallow peek: most of the silhouette stays sunk in
                             // the pane's halo and only its far side clears into
                             // open parchment
    motifDrift:    0.9,      // Lateral travel along the edge across one pass (radii)
    motifSpin:     0.16,     // Peak rotation rate (rad/s), direction alternating
                             // per launch. Scaled by the same rise curve as the
                             // ink, so a shape is nearly still while sunk in the
                             // halo and turns fastest at the top of its peek —
                             // the motion shows up exactly where the silhouette
                             // does. ~150 degrees across a whole pass
    motifShow:     26,       // Seconds from first emergence to fully withdrawn
    motifCycle:    10,       // Seconds between launches. Far shorter than a pass, so
                             // two or three are always in the air at once
    maxMotifs:     4,        // Uniform-array size: ceil(motifShow / motifCycle), + 1

    maxRects:      8         // Uniform-array size; visible blocks beyond this are skipped
  };

  var canvas = document.createElement('canvas');
  canvas.id = 'ink-canvas';
  document.body.appendChild(canvas);
  syncFixedToVisualViewport(canvas, function() { resize(); });

  var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false }) ||
           canvas.getContext('experimental-webgl', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) {
    canvas.remove();
    return null;
  }

  // --- Shaders ---

  var VERT = [
    'attribute vec2 aPos;',
    'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var PRECISION = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif'
  ].join('\n');

  // Sim step: advect the dye field through the curl-noise flow, decay it, and
  // re-inject both inks along the card boundaries. R = inner ink, G = outer ink.
  // Shared chunk for the dye and brush passes: all uniforms, the noise/SDF
  // helpers, and the velocity field — both fluids ride exactly the same flow.
  var FIELD_COMMON = [
    'uniform sampler2D uPrev;',      // dye field: r pane ink, g background liquid
    'uniform sampler2D uBrushTex;',  // brush ink: premultiplied rgb, a = amount
    'uniform vec2  uRes;',
    'uniform float uTime;',
    'uniform float uDt;',
    'uniform float uShiftY;',    // scroll delta this frame, sim px (keeps dye on its card)
    'uniform float uMotion;',    // 0 under prefers-reduced-motion: bands render, nothing stirs
    'uniform float uCss;',       // sim px -> CSS px, so the flow looks the same at any size
    'uniform float uSimScale;',  // CSS px -> sim px
    'uniform vec4  uRects[' + SIM.maxRects + '];',  // xy = center, zw = half-size (sim px, y-up)',
    'uniform float uBoost[' + SIM.maxRects + '];',
    'uniform int   uCount;',
    'uniform float uBand;',      // band width, sim px
    'uniform float uCorner;',    // corner radius, sim px
    'uniform float uAmorph;',    // boundary wobble amplitude, sim px
    'uniform float uSpeed;',
    'uniform float uInject;',
    'uniform float uDecay;',
    'uniform vec3  uFlow;',      // (freq1, freq2, evolve)
    'uniform float uBleed;',     // outward bleed current, CSS px/s
    'uniform float uShear;',     // interface shear strength, CSS px/s
    'uniform float uBgRate;',    // background liquid pattern recovery, 1/s
    'uniform float uBrushDecay;',// brush ink decay, 1/s (independent of uDecay)
    'uniform vec3  uBrushColor;',// tint of NEW splats only — laid ink keeps its color
    'uniform vec4  uSplats[' + SIM.maxSplats + '];',   // xy center (sim px), z radius (sim px), w strength
    'uniform int   uSplatCount;',
    'uniform vec4  uEmit[' + SIM.maxEmitters + '];',   // xy center (sim px), zw jet velocity (CSS px/s, y-up)
    'uniform int   uEmitCount;',
    'uniform float uEmitRad;',   // emitter gaussian radius, sim px
    'uniform vec4  uSrc[' + SIM.maxSources + '];',     // xy center (sim px), z radius (sim px), w rate
    'uniform vec3  uSrcCol[' + SIM.maxSources + '];',  // ink color of each source (set at placement)
    'uniform int   uSrcCount;',
    'uniform vec4  uHole;',      // selected nav pill: xy = center, zw = half-size (sim px, y-up)
    'uniform float uHoleAmt;',   // eased 0..1 — a fresh selection bursts in through this
    'uniform vec4  uMotif[' + SIM.maxMotifs + '];',     // xy center (sim px), z radius, w ink target
    'uniform vec2  uMotifRC[' + SIM.maxMotifs + '];',   // (cos, sin) of each one's rotation
    'uniform float uMotifKind[' + SIM.maxMotifs + '];', // 0 gear, 1 mug, 2 paintbrush
    'uniform int   uMotifCount;',

    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',

    'float noise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i),                   hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)),  hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',

    // Stream function: its curl gives a divergence-free (incompressible) flow,
    // which is what makes the mixing read as liquid rather than random smear
    'float psi(vec2 q, float t) {',
    '  return noise(q * uFlow.x + vec2(0.0, t * uFlow.z * 0.6)) +',
    '         0.75 * noise(q * uFlow.y + vec2(t * uFlow.z, 13.7 - t * uFlow.z * 0.47));',
    '}',

    'vec2 curlVel(vec2 q, float t) {',
    '  float e = 3.0;',
    '  float dx = psi(q + vec2(e, 0.0), t) - psi(q - vec2(e, 0.0), t);',
    '  float dy = psi(q + vec2(0.0, e), t) - psi(q - vec2(0.0, e), t);',
    '  return vec2(dy, -dx) / (2.0 * e);',
    '}',

    'float sdRoundRect(vec2 p, vec2 c, vec2 h, float r) {',
    '  vec2 q = abs(p - c) - h + r;',
    '  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;',
    '}',

    // Boundary wobble: a slow drifting two-octave noise displacement of the
    // pane SDF. The blob's outline meanders instead of tracing the straight
    // CSS rectangle, so the root and tendrils grow from an organic edge —
    // and because the SDF gradient follows the wobble, tendrils leave it at
    // varied angles rather than marching off a ruler-straight line
    'float bump(vec2 pp) {',
    '  vec2 w = pp * uCss;',
    '  return ((noise(w * 0.016 + vec2(uTime * 0.03, 1.7)) - 0.5) * 2.0 +',
    '          (noise(w * 0.05 - vec2(3.3, uTime * 0.022)) - 0.5)) * uAmorph;',
    '}',

    'float sceneSD(vec2 p) {',
    '  float d = 1e6;',
    '  for (int i = 0; i < ' + SIM.maxRects + '; i++) {',
    '    if (i >= uCount) break;',
    '    d = min(d, sdRoundRect(p, uRects[i].xy, uRects[i].zw, uCorner));',
    '  }',
    '  return d - bump(p);',
    '}',

    // The selected nav pill is a HOLE in the navbar's ink: a capsule region
    // where the pane ink is actively cleared so the background liquid pools
    // through it. Same wobble treatment as the panes, on an offset noise
    // domain (so it meanders independently of the navbar's own edge) and at
    // reduced amplitude to suit the pill's small size. The capsule grows
    // with uHoleAmt, so a fresh selection bursts outward from its center.
    // Far from the pill the exact distance is irrelevant — return it raw and
    // skip the wobble noise. This keeps the hole's cost confined to a thin
    // band around the navbar: the sim-wide per-pixel price of the feature is
    // one rounded-rect SDF, not six noise evaluations.
    'float holeSD(vec2 p) {',
    '  vec2 h = uHole.zw * (0.2 + 0.8 * uHoleAmt);',
    '  float d = sdRoundRect(p, uHole.xy, h, min(h.x, h.y));',
    '  if (abs(d) > uBand * 1.5) return d;',
    '  return d - 0.5 * bump(p + vec2(53.0, 17.0));',
    '}',

    // --- Motif silhouettes, in the shape's own frame, sized in radii of R.
    // Built from the same max/min CSG the panes use; only the sign matters
    // here (the coverage smoothstep spans a few px), so exactness of the
    // distance away from the outline is not worth paying for.
    //
    // Two rules govern every one of these, both learned the hard way (see
    // GALLERY_THEME.md): no feature thinner than ~0.1R, because the flow
    // erases anything finer no matter how hard it is re-stamped; and put the
    // identifying feature LOW in the frame, because a shallow rise only ever
    // shows the shape's lower part.

    // Angle is always a literal at the call site, so the trig folds away
    'vec2 rotp(vec2 p, float a) {',
    '  float c = cos(a), s = sin(a);',
    '  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);',
    '}',

    // Toothed rim, an annular gap, four spokes, hub and bore — the gap and
    // the spokes are what make it read as a GEAR rather than a cog stamp
    'float sdGear(vec2 p, float R) {',
    '  float r = length(p);',
    '  float a = atan(p.y, p.x + 1e-4);',   // atan(0,0) is undefined, and one NaN
                                           // here would advect across the field
    '  float tooth = smoothstep(-0.20, 0.30, cos(a * 8.0));',   // 8 flat-topped teeth
    '  float d = r - R * (0.66 + 0.24 * tooth);',               // deeper teeth read further
    '  float gap = max(r - 0.50 * R, 0.26 * R - r);',           // rim / hub separation
    '  d = max(d, -gap);',
    '  float spokes = max(min(abs(p.x), abs(p.y)) - 0.10 * R, r - 0.55 * R);',
    '  d = min(d, spokes);',
    '  return max(d, 0.15 * R - r);',                           // bore
    '}',

    // Body, a handle ring on the right, and a slot carved under the lip. That
    // slot is what makes it a vessel rather than a lozenge: it lets a line of
    // parchment through where the opening would be
    'float sdMug(vec2 p, float R) {',
    // Tapered body: narrower at the base. The lip slot is the clearest cue
    // but it sits high, where a shallow rise leaves it buried — the taper and
    // the handle are what have to carry the shape from its lower half alone,
    // so the handle is large and hangs low on purpose
    '  vec2 q = p;',
    '  q.x /= 0.84 + 0.16 * smoothstep(-0.5 * R, 0.5 * R, p.y);',
    '  float body = sdRoundRect(q, vec2(-0.15 * R, 0.0), vec2(0.46 * R, 0.52 * R), 0.10 * R);',
    '  float slot = sdRoundRect(p, vec2(-0.14 * R, 0.30 * R), vec2(0.34 * R, 0.055 * R), 0.05 * R);',
    '  body = max(body, -slot);',
    '  vec2 hp = p - vec2(0.34 * R, -0.10 * R);',
    '  float ring = abs(length(hp) - 0.35 * R) - 0.105 * R;',
    '  return min(body, max(ring, -hp.x));',   // keep the outer half of the ring
    '}',

    // Handle, ferrule, and bristles tapering to a point down the local -Y.
    // Everything here is deliberately chunky — a scale-thin handle is gone
    // within a frame or two of flow no matter how hard it is re-stamped — and
    // stubbier than a real brush, so the silhouette fills its radius instead
    // of being a long thin line lost in a wash
    'float sdBrush(vec2 p, float R) {',
    // The three parts step in width — thin handle, a proud ferrule collar,
    // then the swell of the bristles tapering to a point. Lying along an
    // edge, that stepped SIDE profile is the whole of what shows, so the
    // steps are exaggerated well past a real brush's proportions
    '  float handle  = sdRoundRect(p, vec2(0.0,  0.38 * R), vec2(0.135 * R, 0.52 * R), 0.12 * R);',
    '  float ferrule = sdRoundRect(p, vec2(0.0, -0.24 * R), vec2(0.300 * R, 0.17 * R), 0.03 * R);',
    '  float t = clamp((-p.y - 0.38 * R) / (0.52 * R), 0.0, 1.0);',
    '  float w = 0.32 * R * (1.0 - 0.88 * t * t);',
    '  float bris = max(abs(p.x) - w, max(-0.90 * R - p.y, p.y + 0.38 * R));',
    '  return min(handle, min(ferrule, bris));',
    '}',

    // Open book: two leaves splayed off a spine. The splay is exaggerated so
    // the silhouette is a wide shallow V — legible even when only its lower
    // edge has cleared the ink — and a slot is carved in each leaf so it
    // reads as paper rather than a slab
    'float sdBook(vec2 p, float R) {',
    '  vec2 lp = rotp(p - vec2(-0.42 * R, -0.04 * R),  0.36);',
    '  vec2 rp = rotp(p - vec2( 0.42 * R, -0.04 * R), -0.36);',
    '  float left  = sdRoundRect(lp, vec2(0.0), vec2(0.44 * R, 0.30 * R), 0.06 * R);',
    '  float right = sdRoundRect(rp, vec2(0.0), vec2(0.44 * R, 0.30 * R), 0.06 * R);',
    '  float spine = sdRoundRect(p, vec2(0.0, -0.14 * R), vec2(0.10 * R, 0.30 * R), 0.04 * R);',
    '  float d = min(min(left, right), spine);',
    // A page line down each leaf, so the leaves read as stacked paper
    // splaying open rather than two planks. Sized against the LEAF, not the
    // radius — at half again this thickness it cut each leaf in two
    '  float sl = sdRoundRect(lp, vec2(-0.02 * R, 0.10 * R), vec2(0.30 * R, 0.05 * R), 0.04 * R);',
    '  float sr = sdRoundRect(rp, vec2( 0.02 * R, 0.10 * R), vec2(0.30 * R, 0.05 * R), 0.04 * R);',
    '  return max(d, -min(sl, sr));',
    '}',

    // Magnifying glass, lens DOWN: the ring is the whole of the read, so it
    // is the part that has to emerge first
    'float sdLens(vec2 p, float R) {',
    '  vec2 c = vec2(-0.16 * R, -0.20 * R);',
    '  float ring = abs(length(p - c) - 0.44 * R) - 0.115 * R;',
    '  vec2 h = rotp(p - vec2(0.38 * R, 0.42 * R), -0.785);',   // grip axis to +Y
    '  float grip = sdRoundRect(h, vec2(0.0), vec2(0.105 * R, 0.30 * R), 0.09 * R);',
    '  return min(ring, grip);',
    '}',

    // Peace sign: ring, full vertical bar, two legs down from the center
    'float sdPeace(vec2 p, float R) {',
    '  float ring = abs(length(p) - 0.66 * R) - 0.105 * R;',
    '  float bar = max(abs(p.x) - 0.09 * R, abs(p.y) - 0.66 * R);',
    '  vec2 q = rotp(vec2(abs(p.x), p.y), 0.785);',            // both legs at once
    '  float leg = max(abs(q.y) - 0.09 * R, max(-q.x, q.x - 0.60 * R));',
    '  return min(ring, min(bar, leg));',
    '}',

    // Scissors, mirrored about X: blades up and out, shanks down and out to
    // ring handles. The pair reads as an X, which is the whole silhouette
    'float sdScissors(vec2 p, float R) {',
    '  vec2 q = vec2(abs(p.x), p.y);',
    '  vec2 pv = vec2(0.0, 0.06 * R);',
    '  vec2 b = rotp(q - pv, 0.31);',                          // blade axis to +Y
    '  float t = clamp(b.y / (0.80 * R), 0.0, 1.0);',
    '  float blade = max(abs(b.x) - 0.12 * R * (1.0 - 0.60 * t), max(-b.y, b.y - 0.80 * R));',
    '  vec2 s = rotp(q - pv, -0.49);',                         // shank axis to -Y
    '  float shank = max(abs(s.x) - 0.085 * R, max(s.y, -s.y - 0.62 * R));',
    '  float ring = abs(length(q - (pv + vec2(0.47, -0.88) * 0.72 * R)) - 0.21 * R) - 0.08 * R;',
    '  float pivot = length(p - pv) - 0.10 * R;',
    '  return min(min(blade, shank), min(ring, pivot));',
    '}',

    // Cordless drill in profile: body, chuck and bit forward, pistol grip and
    // battery below. The grip-and-battery L is what carries it from below
    'float sdDrill(vec2 p, float R) {',
    '  float body  = sdRoundRect(p, vec2(-0.06 * R,  0.26 * R), vec2(0.40 * R, 0.24 * R), 0.13 * R);',
    '  float chuck = sdRoundRect(p, vec2( 0.44 * R,  0.24 * R), vec2(0.13 * R, 0.16 * R), 0.04 * R);',
    '  float bit   = sdRoundRect(p, vec2( 0.70 * R,  0.24 * R), vec2(0.17 * R, 0.05 * R), 0.02 * R);',
    '  vec2 h = rotp(p - vec2(-0.16 * R, -0.20 * R), 0.20);',
    '  float grip  = sdRoundRect(h, vec2(0.0), vec2(0.165 * R, 0.34 * R), 0.08 * R);',
    '  float batt  = sdRoundRect(p, vec2(-0.30 * R, -0.60 * R), vec2(0.27 * R, 0.16 * R), 0.05 * R);',
    '  return min(min(body, chuck), min(bit, min(grip, batt)));',
    '}',

    // Combination wrench: shaft with a closed ring at one end and an open
    // jaw at the other. Both ends carry negative space, which is what makes
    // them read at this contrast
    'float sdWrench(vec2 p, float R) {',
    '  float shaft = sdRoundRect(p, vec2(0.0, 0.0), vec2(0.115 * R, 0.52 * R), 0.06 * R);',
    '  float ring = abs(length(p - vec2(0.0, 0.66 * R)) - 0.20 * R) - 0.085 * R;',
    '  vec2 j = p - vec2(0.0, -0.68 * R);',
    '  float jaw = abs(length(j) - 0.23 * R) - 0.10 * R;',
    // The opening faces AWAY from the shaft — cut downward, not up, or the
    // notch hides behind the shaft and the jaw reads as a second closed ring
    '  jaw = max(jaw, -max(abs(j.x) - 0.16 * R, j.y - 0.05 * R));',
    '  return min(shaft, min(ring, jaw));',
    '}',

    // Boot: shaft up, foot forward, sole and heel underneath — the L is the
    // read, and the sole is the part that surfaces first
    'float sdBoot(vec2 p, float R) {',
    '  float shaft = sdRoundRect(p, vec2(-0.26 * R,  0.26 * R), vec2(0.25 * R, 0.52 * R), 0.08 * R);',
    '  float foot  = sdRoundRect(p, vec2( 0.04 * R, -0.42 * R), vec2(0.55 * R, 0.22 * R), 0.11 * R);',
    '  float toe   = sdRoundRect(p, vec2( 0.48 * R, -0.40 * R), vec2(0.16 * R, 0.16 * R), 0.13 * R);',
    '  float sole  = sdRoundRect(p, vec2( 0.02 * R, -0.66 * R), vec2(0.60 * R, 0.09 * R), 0.03 * R);',
    '  float heel  = sdRoundRect(p, vec2(-0.38 * R, -0.78 * R), vec2(0.17 * R, 0.11 * R), 0.02 * R);',
    '  return min(min(shaft, foot), min(toe, min(sole, heel)));',
    '}',

    // Strongest motif ink asked for at a sim-px position. Several are in the
    // air at once (one launches every motifCycle seconds, each takes far
    // longer than that to rise and set), so this is a max over the live
    // slots. Each outline takes the same wobble the panes get, so it is
    // hand-inked rather than plotted; and each is skipped outside its
    // bounding circle, which keeps the whole feature off the bill for the
    // large majority of the screen it does not occupy.
    'float motifInkAt(vec2 p) {',
    '  float best = 0.0;',
    '  float e = max(uBand * 0.06, 1.0);',
    '  float wob = 0.16 * bump(p + vec2(31.0, 7.0));',   // un-plots the outline
                                                        // without eating the detail
    '  for (int i = 0; i < ' + SIM.maxMotifs + '; i++) {',
    '    if (i >= uMotifCount) break;',
    '    if (uMotif[i].w <= 0.0) continue;',
    '    vec2 rel = p - uMotif[i].xy;',
    '    if (dot(rel, rel) > uMotif[i].z * uMotif[i].z * 2.6) continue;',
    '    vec2 rc = uMotifRC[i];',
    '    vec2 lp = vec2(rel.x * rc.x + rel.y * rc.y, -rel.x * rc.y + rel.y * rc.x);',
    // k is uniform across the whole draw for a given slot, so this chain
    // costs one taken branch per pixel, not ten
    '    float d;',
    '    float k = uMotifKind[i];',
    '    float rr = uMotif[i].z;',
    '    if (k < 0.5)      d = sdGear(lp, rr);',
    '    else if (k < 1.5) d = sdMug(lp, rr);',
    '    else if (k < 2.5) d = sdBrush(lp, rr);',
    '    else if (k < 3.5) d = sdBook(lp, rr);',
    '    else if (k < 4.5) d = sdLens(lp, rr);',
    '    else if (k < 5.5) d = sdPeace(lp, rr);',
    '    else if (k < 6.5) d = sdScissors(lp, rr);',
    '    else if (k < 7.5) d = sdDrill(lp, rr);',
    '    else if (k < 8.5) d = sdWrench(lp, rr);',
    '    else              d = sdBoot(lp, rr);',
    // Keep this edge TIGHT. At uBand * 0.22 the ramp spans ~24 CSS px, which
    // is wider than a brush handle — thin features then never reach full
    // coverage and fade out entirely while the gear survives.
    '    best = max(best, smoothstep(e, -e, d - wob) * uMotif[i].w);',
    '  }',
    '  return best;',
    '}',

    // Combined ink density at a sim-px position (pane ink + brush ink) —
    // its gradient marks every interface between laid ink and the background
    'float inkAt(vec2 pp) {',
    '  return texture2D(uPrev, pp / uRes).r + texture2D(uBrushTex, pp / uRes).a;',
    '}',

    // Gaussian sum of the live splats / stroke stamps at a sim-px position
    'float splatAt(vec2 p) {',
    '  float s = 0.0;',
    '  for (int i = 0; i < ' + SIM.maxSplats + '; i++) {',
    '    if (i >= uSplatCount) break;',
    '    vec2 sd = p - uSplats[i].xy;',
    '    s += uSplats[i].w * exp(-dot(sd, sd) / (uSplats[i].z * uSplats[i].z));',
    '  }',
    '  return s;',
    '}',

    // Gaussian sum of the placed ink sources at a sim-px position
    'float srcInkAt(vec2 p) {',
    '  float s = 0.0;',
    '  for (int i = 0; i < ' + SIM.maxSources + '; i++) {',
    '    if (i >= uSrcCount) break;',
    '    vec2 sd = p - uSrc[i].xy;',
    '    s += uSrc[i].w * exp(-dot(sd, sd) / (uSrc[i].z * uSrc[i].z));',
    '  }',
    '  return s;',
    '}',

    // The flow everything rides: curl-noise turbulence, an outward bleed
    // current near every pane edge, and interface shear — velocity along the
    // iso-contours of ink density (the gradient rotated 90 degrees), so every
    // boundary between laid ink and background liquid rolls up into curls.
    // The shear speed SATURATES at min(gm/0.3, 1): without the cap it feeds
    // back (stretching sharpens the gradient, which shears harder) and the
    // mixing layer runs away until ink floods the screen.
    // Also reports the wobbled pane SDF, its outward direction, and the
    // hover boost of the nearest pane.
    'vec2 velocityAt(vec2 p, vec2 q, out float dOut, out float boostOut, out vec2 outwardOut) {',
    '  float d = 1e6;',
    '  float boost = 1.0;',
    '  for (int i = 0; i < ' + SIM.maxRects + '; i++) {',
    '    if (i >= uCount) break;',
    '    float di = sdRoundRect(p, uRects[i].xy, uRects[i].zw, uCorner);',
    '    if (di < d) { d = di; boost = uBoost[i]; }',
    '  }',
    '  d -= bump(p);',   // same wobble as sceneSD, so the gradient stays consistent
    '  vec2 g = vec2(sceneSD(p + vec2(2.0, 0.0)) - d, sceneSD(p + vec2(0.0, 2.0)) - d);',
    '  vec2 outward = g / max(length(g), 0.001);',
    '  float push = smoothstep(uBand * 1.8, 0.0, abs(d));',
    '  vec2 dg = vec2(inkAt(p + vec2(2.0, 0.0)) - inkAt(p - vec2(2.0, 0.0)),',
    '                 inkAt(p + vec2(0.0, 2.0)) - inkAt(p - vec2(0.0, 2.0)));',
    '  float gm = length(dg);',
    '  vec2 shear = (vec2(dg.y, -dg.x) / max(gm, 0.001)) * min(gm / 0.3, 1.0) * uShear;',

    // The nav-pill hole pushes an outward current at its boundary — the same
    // bleed the pane edges get, so the cream pool actively shoulders the
    // navbar ink aside and the interface shear rolls the two up where they
    // meet, instead of the pool just sitting in a stencil. Guarded to the
    // boundary band: everywhere else the gradient probes never run.
    '  float hb = holeSD(p);',
    '  vec2 hbleed = vec2(0.0);',
    '  if (abs(hb) < uBand * 0.9 && uHoleAmt > 0.0) {',
    '    vec2 hbg = vec2(holeSD(p + vec2(2.0, 0.0)) - hb, holeSD(p + vec2(0.0, 2.0)) - hb);',
    '    hbleed = (hbg / max(length(hbg), 0.001)) * uBleed * smoothstep(uBand * 0.9, 0.0, abs(hb)) * uHoleAmt;',
    '  }',

    // User-placed flow emitters: persistent LAMINAR jets. Each is a lane
    // elongated downstream (reach grows with speed), narrow across the
    // axis, with velocity decaying smoothly along it. Inside the lane the
    // ambient turbulence and interface shear are suppressed in proportion
    // to the lane weight — that suppression is what makes the flow read as
    // laminar: carried pigment travels as a coherent, concentrated stream
    // and only breaks up and dissipates where the lane hands it back to
    // the turbulence. Shared by both fluid passes.
    '  vec2 jet = vec2(0.0);',
    '  float lam = 0.0;',
    '  for (int i = 0; i < ' + SIM.maxEmitters + '; i++) {',
    '    if (i >= uEmitCount) break;',
    '    vec2 ed = p - uEmit[i].xy;',
    '    float spd = length(uEmit[i].zw);',
    '    vec2 dir = uEmit[i].zw / max(spd, 0.001);',
    '    float along = dot(ed, dir);',
    '    float across = ed.x * dir.y - ed.y * dir.x;',
    '    float reach = uEmitRad * (2.0 + spd * 0.006);',   // faster jet -> longer lane
    '    float sa = along < 0.0 ? uEmitRad : reach;',      // short stub upstream of the nozzle
    '    float w = exp(-along * along / (sa * sa)) * exp(-across * across / (uEmitRad * uEmitRad * 0.3));',
    '    jet += dir * (spd * w);',
    '    lam = max(lam, w);',
    '  }',

    '  dOut = d; boostOut = boost; outwardOut = outward;',
    '  return (curlVel(q, uTime) * uSpeed * (1.0 - 0.85 * lam) + outward * uBleed * push + shear * (1.0 - 0.7 * lam) + hbleed + jet) * uSimScale * uMotion;',
    '}'
  ].join('\n');

  var STEP_FRAG = PRECISION + '\n' + FIELD_COMMON + '\n' + [

    'void main() {',
    '  vec2 p = gl_FragCoord.xy;',
    '  vec2 q = p * uCss;',
    '  float d; float boost; vec2 outward;',
    '  vec2 vel = velocityAt(p, q, d, boost, outward);',

    // Semi-Lagrangian advection: walk back along the flow (and the scroll
    // shift) and pick up the dye that is arriving at this pixel
    '  vec2 back = p - vec2(0.0, uShiftY) - vel * uDt;',
    '  vec3 dye = texture2D(uPrev, back / uRes).rgb;',   // r pane ink, g background liquid

    // Pane-ink sources. The pane's ink (R) grows as radial FINGERS rooted on
    // the edge: the gate noise is sampled at the point projected onto the
    // pane edge, so it is constant along each outward ray — an open gate
    // feeds a whole finger from root to tip, with clean edge between fingers.
    '  float s = d / uBand;',   // 0 at the card edge, 1 at the band's outer reach
    '  vec2 pe = (p - outward * max(d, 0.0)) * uCss;',   // projection onto the edge
    // Rotate the noise domain so its grid never aligns with the (axis-
    // aligned) pane edges — keeps the fingers organic instead of blocky.
    // Slow crawl only: a fast-drifting gate smears fingers into smudge
    // within one dye lifetime.
    '  vec2 pr = vec2(pe.x * 0.83 - pe.y * 0.56, pe.x * 0.56 + pe.y * 0.83);',
    '  float nA = noise(pr * 0.045 + vec2(uTime * 0.02, 3.1));',
    '  float gate = smoothstep(0.45, 0.62, nA);',
    '  float len = 0.3 + 0.9 * nA;',   // open gates grow fingers of varied lengths
    // Sources begin slightly INSIDE the pane edge (invisible there — the pane
    // fill covers them in the same color), so the root and every tendril
    // emerge already attached: no background sliver between pane and ink
    '  float side = smoothstep(-0.12, -0.04, s);',
    // Continuous root: a thin ribbon of pane ink wets the ENTIRE perimeter,
    // its thickness breathing with the same noise; the fingers grow out of it
    '  float root = smoothstep(0.08 + 0.18 * nA, 0.0, s);',
    '  float srcA = max(root, gate * smoothstep(len, 0.0, s)) * side;',

    // The pane body itself: saturating injection deep inside, ramping off
    // toward the edge. The interior stays solid, but the boundary shell is
    // fed slowly enough that the flow genuinely erodes and smears it — the
    // pane is a blob of ink whose edge belongs to the fluid.
    '  float srcPane = smoothstep(0.06, -0.35, s);',

    '  dye.r = dye.r * (1.0 - uDecay * uDt) - 0.0012;',   // sweep quantization residue to zero
    '  dye.r += max(srcA, srcPane) * (uInject * boost * uDt);',

    // The rising motif. Unlike every other ink source this one RELAXES TOWARD
    // a target instead of adding: it lifts thin ink up to its own modest
    // density and does nothing at all where the field is already darker. So
    // it is invisible under the pane body and under the dense inner halo, and
    // only surfaces out in the tendril zone — a shape behind the frame,
    // achieved by arithmetic rather than by masking. What it does deposit is
    // ordinary pane ink, so the flow immediately starts eroding and dragging
    // it, and the outline stays legible only because it is re-asserted.
    '  float mv = motifInkAt(p);',
    '  dye.r += max(0.0, mv - dye.r) * (' + SIM.motifRate.toFixed(2) + ' * uDt);',

    // The selected nav pill: the background liquid holds a clear pool in the
    // navbar's ink. Clearing mirrors the pane injection in reverse —
    // saturating deep inside the capsule, ramping off across the edge so the
    // boundary shell is only loosely held and the flow genuinely erodes and
    // roils it — plus noise-gated FINGERS of clearing rooted on the pill
    // edge, the inverse of the panes' ink fingers, so the pool reaches into
    // the charcoal with the same organic tendrils the panes shed.
    '  float hd = holeSD(p);',
    '  if (hd < uBand * 0.6 && uHoleAmt > 0.0) {',   // interior + finger reach only
    '    float hs = hd / (uBand * 0.6);',   // 0 at the pill edge, 1 at the clearing's outer reach
    '    vec2 hg = vec2(holeSD(p + vec2(2.0, 0.0)) - hd, holeSD(p + vec2(0.0, 2.0)) - hd);',
    '    vec2 hout = hg / max(length(hg), 0.001);',
    '    vec2 hpe = (p - hout * max(hd, 0.0)) * uCss;',   // projection onto the pill edge
    '    vec2 hpr = vec2(hpe.x * 0.83 - hpe.y * 0.56, hpe.x * 0.56 + hpe.y * 0.83);',
    '    float hn = noise(hpr * 0.06 + vec2(uTime * 0.025, 4.9));',
    '    float hgate = smoothstep(0.45, 0.62, hn);',
    '    float hlen = 0.25 + 0.75 * hn;',
    '    float hclear = max(smoothstep(0.05, -0.3, hs), 0.8 * hgate * smoothstep(hlen, 0.0, hs));',
    // 4x the injection rate: the clearing must outrun the pane fill (up to
    // 1.9x boosted when the navbar is hovered) deep inside the pill, while
    // the edge zone stays contested — that contest is the roiling boundary
    '    dye.r -= hclear * uHoleAmt * (uInject * 4.0) * uDt;',
    '  }',

    // The background liquid: its density relaxes toward a slowly drifting
    // two-octave noise pattern, so it always shows internal marbling — and
    // anything that stirs or displaces it leaves a wake that heals over
    // ~1/uBgRate seconds. The per-frame dither keeps the tiny relaxation
    // increments alive through byte-texture rounding (which would otherwise
    // stall them to zero before the pattern fully re-forms).
    '  vec2 pb = vec2(q.x * 0.94 - q.y * 0.34, q.x * 0.34 + q.y * 0.94);',
    '  float nB  = noise(pb * 0.011 + vec2(uTime * 0.015, 7.7));',
    '  float nB2 = noise(pb * 0.035 - vec2(3.3, uTime * 0.02));',
    '  float gTarget = 0.25 + 0.55 * nB + 0.25 * (nB2 - 0.5);',
    '  float dith = (hash(p + vec2(fract(uTime) * 61.7, 9.2)) - 0.5) / 255.0;',
    '  dye.g += clamp(gTarget - dye.g, -1.0, 1.0) * (uBgRate * uDt) + dith;',

    // Brush strokes and placed ink sources shove the background liquid
    // aside — a light rim that heals. (The brush ink itself lives in its
    // own field; see BRUSH_FRAG.)
    '  dye.g -= (splatAt(p) + srcInkAt(p)) * 0.4 * uDt;',

    '  gl_FragColor = vec4(clamp(dye.rg, 0.0, 1.0), 0.0, 1.0);',
    '}'
  ].join('\n');

  // Brush pass: the user's ink is a second advected field with TRUE COLOR —
  // premultiplied rgb, amount in alpha. New splats are tinted with the
  // current brush color; ink already on the page keeps whatever color it was
  // laid down with, and overlapping strokes genuinely mix (premultiplied
  // sums blend the way pigments do). Changing the brush color therefore
  // never recolors existing ink.
  var BRUSH_FRAG = PRECISION + '\n' + FIELD_COMMON + '\n' + [
    'void main() {',
    '  vec2 p = gl_FragCoord.xy;',
    '  vec2 q = p * uCss;',
    '  float d; float boost; vec2 outward;',
    '  vec2 vel = velocityAt(p, q, d, boost, outward);',
    '  vec2 back = p - vec2(0.0, uShiftY) - vel * uDt;',
    '  vec4 ink = texture2D(uBrushTex, back / uRes);',

    // Own lifetime (the Ink life slider); the quantization sweep scales down
    // with the decay so a long-life setting is not silently erased by it
    // (the full sweep alone would clear solid ink in ~14s)
    '  ink *= 1.0 - uBrushDecay * uDt;',
    '  ink -= 0.0012 * min(uBrushDecay * 5.0, 1.0);',

    // Deposit paint only into the remaining coverage (else rgb accumulates
    // past the pigment color and clamps to white); leftover paint on an
    // already-saturated area RE-PIGMENTS it instead — the stored color pulls
    // toward the incoming ink, so painting over a wet area mixes colors
    '  float add = splatAt(p) * uDt;',
    '  float dep = min(add, 1.0 - ink.a);',
    '  ink.rgb += uBrushColor * dep;',
    '  ink.a += dep;',
    '  float rep = min((add - dep) * 0.3, 1.0);',
    '  ink.rgb = mix(ink.rgb, uBrushColor * ink.a, rep);',

    // Placed ink sources: each bleeds continuously in the color it was
    // placed with, using the same deposit/re-pigment rule as the brush
    '  for (int i = 0; i < ' + SIM.maxSources + '; i++) {',
    '    if (i >= uSrcCount) break;',
    '    vec2 sd = p - uSrc[i].xy;',
    '    float sadd = uSrc[i].w * exp(-dot(sd, sd) / (uSrc[i].z * uSrc[i].z)) * uDt;',
    '    float sdep = min(sadd, 1.0 - ink.a);',
    '    ink.rgb += uSrcCol[i] * sdep;',
    '    ink.a += sdep;',
    '    float srep = min((sadd - sdep) * 0.3, 1.0);',
    '    ink.rgb = mix(ink.rgb, uSrcCol[i] * ink.a, srep);',
    '  }',

    '  gl_FragColor = clamp(ink, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Colorize: ink on ink. The background liquid (field.g) interpolates
  // between its light and deep tones (uBg -> uColB) — that is what makes its
  // marbling visible; the pane ink (field.r) and the brush ink (field.b)
  // layer into it.
  var DRAW_FRAG = PRECISION + '\n' + [
    'uniform sampler2D uTex;',
    'uniform sampler2D uBrushTex;',
    'uniform vec2 uRes;',
    'uniform vec3 uBg;',
    'uniform vec3 uColB;',
    'uniform vec3 uPane;',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  vec3 field = texture2D(uTex, uv).rgb;',
    '  vec3 col = mix(uBg, uColB, min(field.g, 1.0));',
    '  col = mix(col, uPane, field.r);',
    '  vec4 br = texture2D(uBrushTex, uv);',   // premultiplied: rgb already carries amount
    '  col = col * (1.0 - min(br.a, 1.0)) + br.rgb;',   // user's ink, in its true colors
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // Resize blit: carries a dye field across a buffer rebuild. Samples the
  // old texture through an affine map (old_px = new_px * ratio + offset);
  // outside the old field's bounds it writes zero instead of smearing the
  // texture's edge clamp across the new area.
  var COPY_FRAG = PRECISION + '\n' + [
    'uniform sampler2D uTex;',
    'uniform vec2  uOldSize;',
    'uniform float uRatio;',
    'uniform vec2  uOffset;',
    'void main() {',
    '  vec2 op = gl_FragCoord.xy * uRatio + uOffset;',
    '  if (op.x < 0.0 || op.y < 0.0 || op.x > uOldSize.x || op.y > uOldSize.y) {',
    '    gl_FragColor = vec4(0.0);',
    '    return;',
    '  }',
    '  gl_FragColor = texture2D(uTex, op / uOldSize);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console && console.error) {
        console.error('ink-canvas shader compile failed:', gl.getShaderInfoLog(s));
      }
      return null;
    }
    return s;
  }

  function program(fragSrc) {
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  var stepProg = program(STEP_FRAG);
  var brushProg = program(BRUSH_FRAG);
  var drawProg = program(DRAW_FRAG);
  var copyProg = program(COPY_FRAG);
  if (!stepProg || !brushProg || !drawProg || !copyProg) {
    canvas.remove();
    return null;
  }

  // Fullscreen triangle
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  function bindQuad(prog) {
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  function hexToVec3(hex) {
    return [
      parseInt(hex.slice(1, 3), 16) / 255,
      parseInt(hex.slice(3, 5), 16) / 255,
      parseInt(hex.slice(5, 7), 16) / 255
    ];
  }

  // --- Ping-pong textures: dye field + brush ink field ---
  var texA = null, texB = null, fboA = null, fboB = null;
  var brushTexA = null, brushTexB = null, brushFboA = null, brushFboB = null;
  var simW = 0, simH = 0, simScale = 1;

  function makeTarget(w, h) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex: tex, fbo: fbo };
  }

  function resize() {
    // Same guard as the watercolor canvas: mobile URL-bar show/hide fires
    // resize without changing the canvas box — skip those
    var cssW = canvas.clientWidth || window.innerWidth;
    var cssH = canvas.clientHeight || window.innerHeight;
    var scale = Math.min(SIM.maxScale, SIM.maxSimDim / Math.max(cssW, cssH));
    var w = Math.max(1, Math.round(cssW * scale));
    var h = Math.max(1, Math.round(cssH * scale));
    if (w === simW && h === simH) {
      // Browser zoom preserves the viewport aspect ratio, so once maxSimDim
      // caps the buffer the dims come out unchanged — but the CSS box did
      // change, so the CSS->sim mapping must still be refreshed or the ink
      // injects offset from the panes (drifting left/right with zoom level)
      if (scale !== simScale) {
        simScale = scale;
        remapPlaced();
      }
      return;
    }

    var oldW = simW, oldH = simH, oldScale = simScale;
    var oldTexA = texA, oldTexB = texB, oldFboA = fboA, oldFboB = fboB;
    var oldBrushTexA = brushTexA, oldBrushTexB = brushTexB;
    var oldBrushFboA = brushFboA, oldBrushFboB = brushFboB;

    simW = canvas.width = w;
    simH = canvas.height = h;
    simScale = scale;

    var a = makeTarget(w, h);
    var b = makeTarget(w, h);
    texA = a.tex; fboA = a.fbo;
    texB = b.tex; fboB = b.fbo;
    var ba = makeTarget(w, h);
    var bb = makeTarget(w, h);
    brushTexA = ba.tex; brushFboA = ba.fbo;
    brushTexB = bb.tex; brushFboB = bb.fbo;

    // Carry the user's laid ink across the resize: re-blit the old brush
    // field into the new buffer anchored on the canvas VERTICAL CENTERLINE —
    // a stroke painted dead-center stays dead-center and everything keeps
    // its CSS size (only the sim resolution changed). Vertically the anchor
    // is the viewport top, matching how the advected field tracks scroll.
    var preserved = false;
    if (oldBrushTexA && oldW > 0) {
      var r = oldScale / scale;
      gl.viewport(0, 0, w, h);
      gl.useProgram(copyProg);
      bindQuad(copyProg);
      gl.bindFramebuffer(gl.FRAMEBUFFER, brushFboA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, oldBrushTexA);
      gl.uniform1i(gl.getUniformLocation(copyProg, 'uTex'), 0);
      gl.uniform2f(gl.getUniformLocation(copyProg, 'uOldSize'), oldW, oldH);
      gl.uniform1f(gl.getUniformLocation(copyProg, 'uRatio'), r);
      gl.uniform2f(gl.getUniformLocation(copyProg, 'uOffset'), (oldW - w * r) / 2, oldH - h * r);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      preserved = true;
    }

    if (oldTexA) {
      gl.deleteTexture(oldTexA); gl.deleteTexture(oldTexB); gl.deleteFramebuffer(oldFboA); gl.deleteFramebuffer(oldFboB);
      gl.deleteTexture(oldBrushTexA); gl.deleteTexture(oldBrushTexB); gl.deleteFramebuffer(oldBrushFboA); gl.deleteFramebuffer(oldBrushFboB);
    }

    // The placed objects ride the content layout's transform, then the pane
    // blobs (and any source pools, on a fresh field) soak in at their new
    // reflowed positions
    remapPlaced();
    warmup(preserved);
  }

  // --- Content blocks whose edges the inks trace ---
  var INK_BLOCKS = '.navbar, .paper-panel, .card, .timeline-content, .project-nav, .video-container';
  var CLICKABLE = 'a, button, .card, .clickable-media, .project-nav-item';
  var hoverEl = null;
  var boostMap = (typeof WeakMap === 'function') ? new WeakMap() : null;

  function onPointerOver(e) {
    var t = (e.target && e.target.closest) ? e.target.closest(CLICKABLE) : null;
    hoverEl = t || null;
  }
  function onPointerLeaveDoc() { hoverEl = null; }
  document.addEventListener('pointerover', onPointerOver, true);
  document.documentElement.addEventListener('pointerleave', onPointerLeaveDoc);

  // --- User ink: click drops a splot, click-drag paints a stroke ---
  // Only on the open background — clicks on panes, links, and controls are theirs
  var NO_PAINT = 'a, button, input, textarea, select, label, .navbar, .paper-panel, .card, .clickable-media, .gallery-overlay, .ink-controls';
  var splats = [];
  var splatData = new Float32Array(SIM.maxSplats * 4);
  var paintDrag = null;

  // --- Placed objects: flow emitters (persistent jets) and ink sources
  // (persistent bleeding pools). Armed via control-table buttons; the next
  // click (source) or click-drag (emitter: press = position, drag = the
  // flow vector) on the open background places one. Document space.
  var placeMode = null;      // null | 'emitter' | 'source'
  var emitterDrag = null;
  var emitters = [];
  var sources = [];
  // Placement is allowed over panes (they're fluid too) — only interactive
  // chrome is off-limits, unlike painting's stricter NO_PAINT rule
  var NO_PLACE = 'a, button, input, textarea, select, label, .navbar, .ink-controls, .gallery-overlay';

  // --- Emitter arrows: each placed emitter shows its vector as an ink-
  // styled arrow (dot = position, length ~ speed), absolutely positioned in
  // document space so it scrolls with the page. A live preview follows the
  // pointer while the vector is being dragged out.
  var arrowLayer = document.createElement('div');
  arrowLayer.className = 'ink-arrows';
  document.body.appendChild(arrowLayer);

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function arrowLen(vx, vy) {
    var speed = Math.sqrt(vx * vx + vy * vy);
    return Math.max(30, Math.min(118, 26 + speed * 0.11));
  }

  function styleArrow(el, x, yDoc, vx, vy) {
    var len = arrowLen(vx, vy);
    var ang = Math.atan2(vy, vx) * 180 / Math.PI;
    el.setAttribute('width', Math.ceil(len));
    el.setAttribute('height', 18);
    el.style.left = (x - 4) + 'px';
    el.style.top = (yDoc - 9) + 'px';
    el.style.transformOrigin = '4px 9px';
    el.style.transform = 'rotate(' + ang + 'deg)';
    el.innerHTML =
      '<title>Drag the head to re-aim, the body to move; double-click to delete</title>' +
      '<circle class="handle" cx="4" cy="9" r="6.5"></circle>' +
      '<circle cx="4" cy="9" r="3"></circle>' +
      '<line x1="10.5" y1="9" x2="' + (len - 11) + '" y2="9"></line>' +
      '<circle class="handle" cx="' + (len - 5) + '" cy="9" r="6.5"></circle>' +
      '<polygon points="' + (len - 10) + ',4 ' + len + ',9 ' + (len - 10) + ',14"></polygon>';
  }

  function makeArrow(x, yDoc, vx, vy) {
    var el = document.createElementNS(SVG_NS, 'svg');
    styleArrow(el, x, yDoc, vx, vy);
    arrowLayer.appendChild(el);
    return el;
  }

  // A committed emitter's arrow is a grab handle: dragging its BODY (dot or
  // shaft) moves the emitter; dragging its HEAD re-aims the vector — the new
  // direction and speed come from origin -> pointer, exactly like placement.
  // The jet follows live either way (state is re-read every frame).
  var moveDrag = null;

  function attachArrowDrag(em) {
    em.el.classList.add('placed');
    em.el.addEventListener('pointerdown', function(ev) {
      if (ev.button !== 0) return;
      ev.stopPropagation();   // keep the paint/placement handlers out of it
      ev.preventDefault();
      em.el.classList.add('dragging');   // hold it at full opacity for the whole drag
      var pyDoc = ev.clientY + window.pageYOffset;
      var gx = ev.clientX - em.x, gy = pyDoc - em.yDoc;
      var grabDist = Math.sqrt(gx * gx + gy * gy);
      // snap: the pre-drag state, committed to history on first real move —
      // a no-op click (or half a double-click) never pollutes the history
      if (grabDist > arrowLen(em.vx, em.vy) * 0.6) {
        moveDrag = { em: em, aim: true, snap: snapshot() };
      } else {
        moveDrag = { em: em, dx: em.x - ev.clientX, dyDoc: em.yDoc - pyDoc, snap: snapshot() };
      }
    });
    em.el.addEventListener('dblclick', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      pushHistory();
      var idx = emitters.indexOf(em);
      if (idx >= 0) emitters.splice(idx, 1);
      em.el.remove();
      moveDrag = null;
      saveState();
    });
  }

  // --- Ink source markers: a source is only a bleeding pool in the dye
  // field, so it gets a small document-anchored dot on its center to make it
  // grabbable. Like the arrows it sits faint until pointed at; the hover
  // highlight names the one pool a double-click deletes or a drag moves.
  var SRC_HIT = 15;   // CSS px: half the marker box, i.e. the center hit radius

  function styleSourceMarker(el, s) {
    var c = s.color;
    var rgb = 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' +
      Math.round(c[2] * 255) + ')';
    el.setAttribute('width', SRC_HIT * 2);
    el.setAttribute('height', SRC_HIT * 2);
    el.style.left = (s.x - SRC_HIT) + 'px';
    el.style.top = (s.yDoc - SRC_HIT) + 'px';
    // fill goes in a style attribute, not a presentation attribute — the
    // .ink-arrows circle rule would otherwise win over the source's color
    el.innerHTML =
      '<title>Drag to move; double-click to delete</title>' +
      '<circle class="halo" cx="' + SRC_HIT + '" cy="' + SRC_HIT + '" r="11"></circle>' +
      '<circle class="dot" cx="' + SRC_HIT + '" cy="' + SRC_HIT + '" r="4.5" style="fill:' + rgb + '"></circle>';
  }

  function attachSourceDrag(s) {
    s.el.addEventListener('pointerdown', function(ev) {
      // The handle stays live even while a placement mode is armed: modes are
      // sticky, so the very next thing after dropping a pool is usually a drag
      // to nudge it — the grab has to win over placing another one
      if (ev.button !== 0) return;
      ev.stopPropagation();
      ev.preventDefault();
      s.el.classList.add('dragging');
      moveDrag = {
        src: s,
        dx: s.x - ev.clientX,
        dyDoc: s.yDoc - (ev.clientY + window.pageYOffset),
        snap: snapshot()
      };
    });
    s.el.addEventListener('dblclick', function(ev) {
      ev.stopPropagation();
      ev.preventDefault();
      pushHistory();
      var idx = sources.indexOf(s);
      if (idx >= 0) sources.splice(idx, 1);
      s.el.remove();
      moveDrag = null;
      saveState();
    });
  }

  // Single entry point for a pool: marker, handles, and oldest-first eviction
  function addSource(x, yDoc, r, color) {
    var s = { x: x, yDoc: yDoc, r: r, color: color };
    s.el = document.createElementNS(SVG_NS, 'svg');
    s.el.setAttribute('class', 'ink-source');
    styleSourceMarker(s.el, s);
    arrowLayer.appendChild(s.el);
    attachSourceDrag(s);
    sources.push(s);
    while (sources.length > SIM.maxSources) {
      var dead = sources.shift();
      if (dead.el) dead.el.remove();
    }
    return s;
  }

  function clearSources() {
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].el) sources[i].el.remove();
    }
    sources.length = 0;
  }

  // --- Undo/redo: snapshot history of the placed objects (not the ink) ---
  var undoStack = [], redoStack = [];

  function snapshot() {
    return {
      emitters: emitters.map(function(e) { return { x: e.x, yDoc: e.yDoc, vx: e.vx, vy: e.vy }; }),
      sources: sources.map(function(s) { return { x: s.x, yDoc: s.yDoc, r: s.r, color: s.color.slice() }; })
    };
  }

  // Call BEFORE a mutation: the current state becomes the undo point
  function pushHistory() {
    undoStack.push(snapshot());
    if (undoStack.length > 40) undoStack.shift();
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function applySnapshot(s) {
    for (var i = 0; i < emitters.length; i++) {
      if (emitters[i].el) emitters[i].el.remove();
    }
    emitters.length = 0;
    clearSources();
    s.emitters.forEach(function(e) {
      var em = { x: e.x, yDoc: e.yDoc, vx: e.vx, vy: e.vy, el: makeArrow(e.x, e.yDoc, e.vx, e.vy) };
      attachArrowDrag(em);
      emitters.push(em);
    });
    s.sources.forEach(function(sr) {
      addSource(sr.x, sr.yDoc, sr.r, sr.color.slice());
    });
    saveState();
  }

  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    applySnapshot(undoStack.pop());
    updateHistoryButtons();
  }

  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    applySnapshot(redoStack.pop());
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (!panel) return;
    var u = panel.querySelector('button[data-ink="undo"]');
    var r = panel.querySelector('button[data-ink="redo"]');
    if (u) u.disabled = !undoStack.length;
    if (r) r.disabled = !redoStack.length;
  }

  // --- Persistence: placed objects and panel settings survive navigation
  // within a visit (sessionStorage, per page) but not a browser restart.
  // The dye fields themselves are NOT saved — sources re-soak their pools
  // during warmup, so returning to the page looks continuous anyway.
  var STORE_KEY = 'inkState:' + location.pathname;

  function saveState() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({
        settings: {
          brushColor: SIM.brushColor,
          brushScale: SIM.brushScale,
          brushDecay: SIM.brushDecay,
          flowSpeed: SIM.flowSpeed,
          flowScale2: SIM.flowScale2,
          shearSpeed: SIM.shearSpeed,
          bleedSpeed: SIM.bleedSpeed,
          decayRate: SIM.decayRate
        },
        layout: layoutRef,
        emitters: emitters.map(function(e) { return { x: e.x, yDoc: e.yDoc, vx: e.vx, vy: e.vy }; }),
        sources: sources.map(function(s) { return { x: s.x, yDoc: s.yDoc, r: s.r, color: s.color }; })
      }));
    } catch (err) {}   // storage may be unavailable (private mode) — optional feature
  }

  function restoreState() {
    var raw = null;
    try { raw = sessionStorage.getItem(STORE_KEY); } catch (err) {}
    if (!raw) return;
    try {
      var st = JSON.parse(raw);
      var s = st.settings || {};
      if (typeof s.brushColor === 'string' && /^#[0-9a-f]{6}$/i.test(s.brushColor)) {
        SIM.brushColor = s.brushColor;
      }
      ['brushScale', 'brushDecay', 'flowSpeed', 'flowScale2', 'shearSpeed', 'bleedSpeed', 'decayRate']
        .forEach(function(key) {
          if (typeof s[key] === 'number' && isFinite(s[key])) SIM[key] = s[key];
        });
      colBrush = hexToVec3(SIM.brushColor);
      // The layout reference the objects were saved under — the first
      // remapPlaced() (from the initial resize()) maps them from this onto
      // the current layout, so a different window size lands them coherently
      if (st.layout && isFinite(st.layout.cx) && isFinite(st.layout.top) &&
          st.layout.w > 1 && st.layout.h > 1) {
        layoutRef = { cx: +st.layout.cx, top: +st.layout.top, w: +st.layout.w, h: +st.layout.h };
      }
      (st.emitters || []).slice(0, SIM.maxEmitters).forEach(function(e) {
        if (!isFinite(e.x) || !isFinite(e.yDoc) || !isFinite(e.vx) || !isFinite(e.vy)) return;
        var em = { x: e.x, yDoc: e.yDoc, vx: e.vx, vy: e.vy, el: makeArrow(e.x, e.yDoc, e.vx, e.vy) };
        attachArrowDrag(em);
        emitters.push(em);
      });
      (st.sources || []).slice(0, SIM.maxSources).forEach(function(sr) {
        if (!isFinite(sr.x) || !isFinite(sr.yDoc) || !isFinite(sr.r) || !sr.color || sr.color.length !== 3) return;
        addSource(sr.x, sr.yDoc, sr.r, [+sr.color[0] || 0, +sr.color[1] || 0, +sr.color[2] || 0]);
      });
    } catch (err) {}   // malformed state: start fresh
  }

  // --- Layout coherence across resizes: the placed objects ride the content.
  // The bio pane's rect is the layout reference; every object keeps its
  // position relative to the pane's center and scale, so an object placed on
  // the canvas centerline stays on it. Emitter vectors and source radii
  // scale through the same transform, so the whole arrangement — jets aimed
  // at pane corners, pools tucked against an edge — stays coherent. The
  // reference is saved with the state, so restoring into a differently-sized
  // window adapts the objects instead of replaying stale coordinates.
  var layoutRef = null;   // { cx, top, w, h } — document space

  function measureLayout() {
    var pane = document.querySelector('.paper-panel');
    if (pane) {
      var r = pane.getBoundingClientRect();
      return { cx: (r.left + r.right) / 2, top: r.top + window.pageYOffset, w: r.width, h: r.height };
    }
    return { cx: window.innerWidth / 2, top: 0, w: Math.max(1, window.innerWidth), h: Math.max(1, window.innerHeight) };
  }

  function remapPlaced() {
    var ref = measureLayout();
    if (layoutRef && layoutRef.w > 1 && layoutRef.h > 1 && (emitters.length || sources.length)) {
      var sx = ref.w / layoutRef.w;
      var sy = ref.h / layoutRef.h;
      if (Math.abs(sx - 1) > 0.001 || Math.abs(sy - 1) > 0.001 ||
          Math.abs(ref.cx - layoutRef.cx) > 0.5 || Math.abs(ref.top - layoutRef.top) > 0.5) {
        emitters.forEach(function(em) {
          em.x = ref.cx + (em.x - layoutRef.cx) * sx;
          em.yDoc = ref.top + (em.yDoc - layoutRef.top) * sy;
          em.vx *= sx;
          em.vy *= sy;
          var spd = Math.sqrt(em.vx * em.vx + em.vy * em.vy);
          if (spd > SIM.emitterMax) {
            em.vx *= SIM.emitterMax / spd;
            em.vy *= SIM.emitterMax / spd;
          }
          if (em.el) styleArrow(em.el, em.x, em.yDoc, em.vx, em.vy);
        });
        sources.forEach(function(s) {
          s.x = ref.cx + (s.x - layoutRef.cx) * sx;
          s.yDoc = ref.top + (s.yDoc - layoutRef.top) * sy;
          s.r *= (sx + sy) / 2;
          if (s.el) styleSourceMarker(s.el, s);
        });
      }
    }
    layoutRef = ref;
    saveState();
  }

  // Drag delta -> emitter velocity (CSS px/s): direction from the drag,
  // speed from its length, capped
  function dragVector(dx, dy) {
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 8) return null;   // accidental click
    var speed = Math.max(SIM.emitterMin, Math.min(len * SIM.emitterGain, SIM.emitterMax));
    return { vx: (dx / len) * speed, vy: (dy / len) * speed };
  }
  var emitData = new Float32Array(SIM.maxEmitters * 4);
  var srcData = new Float32Array(SIM.maxSources * 4);
  var srcColData = new Float32Array(SIM.maxSources * 3);
  var emitCount = 0, srcCount = 0;

  function setPlaceMode(mode) {
    placeMode = mode;
    if (emitterDrag && emitterDrag.el) emitterDrag.el.remove();   // abandon any live preview
    emitterDrag = null;
    document.documentElement.style.cursor = mode ? 'crosshair' : '';
    var btns = panel ? panel.querySelectorAll('button[data-ink]') : [];
    for (var i = 0; i < btns.length; i++) {
      var arm = btns[i].getAttribute('data-ink') === 'place-' + mode;
      btns[i].classList.toggle('armed', arm);
    }
  }

  // Screen-space uniform data for the placed objects; called each frame
  function updatePlaced() {
    var i, k;
    // An in-progress placement drag counts as a live emitter (last slot;
    // the oldest committed one yields if the array is already full)
    var list = emitters;
    if (emitterDrag && emitterDrag.vx !== undefined) {
      list = emitters.slice(Math.max(0, emitters.length - (SIM.maxEmitters - 1)));
      list = list.concat([emitterDrag]);
    }
    emitCount = Math.min(list.length, SIM.maxEmitters);
    for (i = 0; i < emitCount; i++) {
      var em = list[i];
      k = i * 4;
      emitData[k]     = em.x * simScale;
      emitData[k + 1] = simH - (em.yDoc - window.pageYOffset) * simScale;
      emitData[k + 2] = em.vx;        // CSS px/s
      emitData[k + 3] = -em.vy;       // flip to GL y-up
    }
    srcCount = sources.length;
    for (i = 0; i < srcCount; i++) {
      var sr = sources[i];
      k = i * 4;
      srcData[k]     = sr.x * simScale;
      srcData[k + 1] = simH - (sr.yDoc - window.pageYOffset) * simScale;
      srcData[k + 2] = Math.max(3, sr.r * simScale);
      srcData[k + 3] = SIM.sourceRate;
      srcColData[i * 3]     = sr.color[0];
      srcColData[i * 3 + 1] = sr.color[1];
      srcColData[i * 3 + 2] = sr.color[2];
    }
  }

  function spawnSplat(clientX, clientY, radius, life) {
    splats.push({
      x: clientX,
      yDoc: clientY + window.pageYOffset,   // document space: stays put when scrolling
      r: radius,
      born: performance.now(),
      life: life
    });
    if (splats.length > SIM.maxSplats) splats.shift();
  }

  // Fill splatData with the live splats (screen space, sim px); returns count
  function updateSplats(now) {
    var n = 0;
    for (var i = 0; i < splats.length; i++) {
      var sp = splats[i];
      var t = (now - sp.born) / (sp.life * 1000);
      if (t < 0 || t >= 1) continue;   // t<0 guards clock skew — a "future" splat would blow up env
      var env = (1 - t) * (1 - t);   // hard burst, fast taper
      var k = n * 4;
      splatData[k]     = sp.x * simScale;
      splatData[k + 1] = simH - (sp.yDoc - window.pageYOffset) * simScale;
      splatData[k + 2] = Math.max(3, sp.r * simScale);
      splatData[k + 3] = SIM.splatStrength * env;
      n++;
    }
    // Compact: drop expired splats once none of them are live anymore
    if (n === 0) splats.length = 0;
    return n;
  }

  function onPaintDown(e) {
    if (e.button !== 0) return;

    if (placeMode) {
      if (e.target && e.target.closest && e.target.closest(NO_PLACE)) return;
      if (placeMode === 'source') {
        pushHistory();
        // the source keeps the current brush color forever
        addSource(e.clientX, e.clientY + window.pageYOffset,
          SIM.sourceRadius * SIM.brushScale, colBrush.slice());
        saveState();   // mode stays armed — keep placing until the button is toggled off
      } else {
        emitterDrag = { x: e.clientX, y: e.clientY, yDoc: e.clientY + window.pageYOffset, el: null };
      }
      e.preventDefault();
      return;
    }

    if (e.target && e.target.closest && e.target.closest(NO_PAINT)) return;
    spawnSplat(e.clientX, e.clientY, SIM.splatRadius * SIM.brushScale * (0.75 + Math.random() * 0.5), 0.55);
    paintDrag = { x: e.clientX, y: e.clientY };
  }
  function onPaintMove(e) {
    if (moveDrag) {
      if (moveDrag.snap) {   // first real movement: commit the pre-drag state to history
        undoStack.push(moveDrag.snap);
        if (undoStack.length > 40) undoStack.shift();
        redoStack.length = 0;
        updateHistoryButtons();
        moveDrag.snap = null;
      }
      if (moveDrag.src) {   // a pool: position only, no vector to re-aim
        var ms = moveDrag.src;
        ms.x = e.clientX + moveDrag.dx;
        ms.yDoc = e.clientY + window.pageYOffset + moveDrag.dyDoc;
        styleSourceMarker(ms.el, ms);
        return;
      }
      var mem = moveDrag.em;
      if (moveDrag.aim) {
        var av = dragVector(e.clientX - mem.x, (e.clientY + window.pageYOffset) - mem.yDoc);
        if (av) { mem.vx = av.vx; mem.vy = av.vy; }
      } else {
        mem.x = e.clientX + moveDrag.dx;
        mem.yDoc = e.clientY + window.pageYOffset + moveDrag.dyDoc;
      }
      styleArrow(mem.el, mem.x, mem.yDoc, mem.vx, mem.vy);
      return;
    }
    if (emitterDrag) {
      // Live rubber-band preview of the vector being dragged out. The
      // vector is stored on the drag state, so updatePlaced() feeds it to
      // the sim as a live emitter — the jet blows while you aim it.
      var v = dragVector(e.clientX - emitterDrag.x, e.clientY - emitterDrag.y);
      if (v) {
        emitterDrag.vx = v.vx;
        emitterDrag.vy = v.vy;
        if (!emitterDrag.el) emitterDrag.el = makeArrow(emitterDrag.x, emitterDrag.yDoc, v.vx, v.vy);
        else styleArrow(emitterDrag.el, emitterDrag.x, emitterDrag.yDoc, v.vx, v.vy);
      }
      return;
    }
    if (!paintDrag) return;
    var dx = e.clientX - paintDrag.x;
    var dy = e.clientY - paintDrag.y;
    if (dx * dx + dy * dy < SIM.strokeSpacing * SIM.strokeSpacing) return;
    paintDrag = { x: e.clientX, y: e.clientY };
    spawnSplat(e.clientX, e.clientY, SIM.strokeRadius * SIM.brushScale * (0.8 + Math.random() * 0.4), 0.4);
  }
  function onPaintUp(e) {
    if (moveDrag) {
      var dragged = moveDrag.src || moveDrag.em;
      if (dragged && dragged.el) dragged.el.classList.remove('dragging');   // let it fade back out
      moveDrag = null;
      saveState();   // a move/re-aim drag just ended
    }
    if (emitterDrag) {
      var v = (e && e.clientX !== undefined) ?
        dragVector(e.clientX - emitterDrag.x, e.clientY - emitterDrag.y) : null;
      if (v) {
        pushHistory();
        var el = emitterDrag.el || makeArrow(emitterDrag.x, emitterDrag.yDoc, v.vx, v.vy);
        styleArrow(el, emitterDrag.x, emitterDrag.yDoc, v.vx, v.vy);
        var em = { x: emitterDrag.x, yDoc: emitterDrag.yDoc, vx: v.vx, vy: v.vy, el: el };
        attachArrowDrag(em);
        emitters.push(em);
        if (emitters.length > SIM.maxEmitters) {
          var dead = emitters.shift();
          if (dead.el) dead.el.remove();
        }
        emitterDrag = null;   // committed — the arrow now belongs to the emitter
        saveState();   // mode stays armed — keep placing until the button is toggled off
      } else {
        // Accidental click: discard any preview, stay armed for a retry
        if (emitterDrag.el) emitterDrag.el.remove();
        emitterDrag = null;
      }
    }
    paintDrag = null;
  }

  document.addEventListener('pointerdown', onPaintDown);
  document.addEventListener('pointermove', onPaintMove);
  window.addEventListener('pointerup', onPaintUp);
  document.addEventListener('pointercancel', onPaintUp);

  // Gather visible blocks as sim-space rects (y-up), easing each block's hover
  // boost so the extra ink swells and subsides smoothly
  var rectData = new Float32Array(SIM.maxRects * 4);
  var boostData = new Float32Array(SIM.maxRects);

  // The selected nav pill, fed to the shaders as a hole in the navbar's ink
  // (see holeSD). A hovered nav link takes over as the target, so the pool
  // MIGRATES: the hole's rect is eased toward the target pill, the clearing
  // eats through the ink ahead of it while the navbar re-inks the trail it
  // leaves — the pool visibly swims through the charcoal rather than
  // teleporting. It bursts in place only on first appearance (page load);
  // initPageTransitions hands .active to a clicked link before navigating,
  // so the pool settles onto the new selection during the exit delay.
  var holeData = new Float32Array([-1e6, -1e6, 1, 1]);
  var holeAmt = 0;
  var holeOn = false;

  function updateHole(dt) {
    var el = document.querySelector('.nav-links a:hover') ||
             document.querySelector('.nav-links a.active');
    if (!el) {
      holeData[0] = -1e6; holeData[1] = -1e6;
      holeAmt = 0; holeOn = false;
      return;
    }
    var r = el.getBoundingClientRect();
    var tx = ((r.left + r.right) / 2) * simScale;
    var ty = simH - ((r.top + r.bottom) / 2) * simScale;   // flip to GL y-up
    var tw = (r.width / 2) * simScale;
    var th = (r.height / 2) * simScale;
    if (!holeOn) {
      // First appearance: snap into place and burst open from the center
      holeData[0] = tx; holeData[1] = ty; holeData[2] = tw; holeData[3] = th;
      holeAmt = 0; holeOn = true;
    } else {
      var k = Math.min(1, 9 * dt);
      holeData[0] += (tx - holeData[0]) * k;
      holeData[1] += (ty - holeData[1]) * k;
      holeData[2] += (tw - holeData[2]) * k;
      holeData[3] += (th - holeData[3]) * k;
    }
    holeAmt += (1 - holeAmt) * Math.min(1, 5 * dt);
  }

  // Keep at least the bio pane's own height of open liquid below it — blank
  // canvas to paint on and place objects in. Re-checked every frame (the
  // pane's height moves with viewport width and font load) but only touches
  // layout when the value actually changes.
  var reservedFor = -1;

  function reserveCanvas() {
    var pane = document.querySelector('.paper-panel');
    var main = document.querySelector('.main-content');
    if (!pane || !main) return;
    var h = Math.ceil(pane.getBoundingClientRect().height);
    if (h !== reservedFor) {
      reservedFor = h;
      main.style.paddingBottom = h + 'px';
    }
  }

  // --- Motifs: a shape launches every motifCycle seconds, rises from behind
  // the bio pane's edge, turns as it arcs along it, and sets back in. A pass
  // takes far longer than the launch interval, so two or three are always in
  // the air at different stations. The pane is the hill: the rise is shallow
  // and most of each silhouette stays buried in its halo. Positions are
  // recomputed from the pane's live rect every frame, so the whole procession
  // rides scrolling and reflow for free.
  // Each launch takes a random start angle, so a shape never rises at the same
  // attitude twice and the procession never settles into a pattern. Nothing
  // here fixes an orientation: the shapes are read by their outline, and a
  // brush or wrench crossing the edge at an angle reads as a thing tumbling
  // past rather than a label stamped on the page.
  var MOTIF_KINDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  // Where along the pane's perimeter each rise happens. A launch takes the
  // next station with room that nothing else is occupying, so the count here
  // is also the cap on how many can be in the air: the bottom edge carries
  // five of them because on a laptop width it is the ONLY edge with room —
  // with fewer, the launch cadence would silently throttle to whenever a
  // station frees up. Ordered so consecutive launches land far apart.
  var MOTIF_STATIONS = [
    { edge: 'bottom', along: 0.18 },
    { edge: 'right',  along: 0.34 },
    { edge: 'bottom', along: 0.50 },
    { edge: 'left',   along: 0.58 },
    { edge: 'bottom', along: 0.82 },
    { edge: 'right',  along: 0.70 },
    { edge: 'bottom', along: 0.34 },
    { edge: 'left',   along: 0.30 },
    { edge: 'bottom', along: 0.66 }
  ];

  var motifs = [];            // live passes, oldest first
  var motifData = new Float32Array(SIM.maxMotifs * 4);   // xy center, z radius, w ink
  var motifRCData = new Float32Array(SIM.maxMotifs * 2); // (cos, sin) per motif
  var motifKindData = new Float32Array(SIM.maxMotifs);
  var motifCount = 0;
  var motifTimer = SIM.motifCycle - 5;   // a few quiet seconds before the first
  var motifIdx = -1;          // which shape comes next
  var motifStation = -1;
  var motifDir = 1;           // which way it slides and turns — alternates

  // Room outside a pane edge, in CSS px — a shape needs open page to rise
  // into, or it just scrapes along under the viewport border
  function edgeRoom(r, edge) {
    if (edge === 'left')   return r.left;
    if (edge === 'right')  return window.innerWidth - r.right;
    return window.innerHeight - r.bottom;
  }

  // Launch the next shape at the next station that has room and is not
  // already occupied; returns null if nowhere on the pane will take one
  function launchMotif(r) {
    motifIdx = (motifIdx + 1) % MOTIF_KINDS.length;
    motifDir = -motifDir;
    for (var i = 1; i <= MOTIF_STATIONS.length; i++) {
      var idx = (motifStation + i) % MOTIF_STATIONS.length;
      // Needs room for the halo AND the emerged part, or the shape would
      // rise into the viewport border instead of into open page
      if (edgeRoom(r, MOTIF_STATIONS[idx].edge) < SIM.motifRadius * 1.8) continue;
      var taken = false;
      for (var j = 0; j < motifs.length; j++) {
        if (motifs[j].station === idx) { taken = true; break; }
      }
      if (taken) continue;
      motifStation = idx;
      return {
        kind: MOTIF_KINDS[motifIdx],
        station: idx,
        dir: motifDir,
        rot: Math.random() * Math.PI * 2,
        spin: SIM.motifSpin * motifDir,
        clock: 0
      };
    }
    return null;
  }

  function updateMotif(dt) {
    motifCount = 0;
    var pane = document.querySelector('.paper-panel');
    if (!pane) return;
    var r = pane.getBoundingClientRect();
    if (r.width < 120 || r.height < 120) return;

    var still = motionScale() === 0;
    if (still) {
      // Reduced motion: no procession — one shape holds a quiet peek
      if (!motifs.length) {
        var one = launchMotif(r);
        if (one) { one.clock = SIM.motifShow * 0.55; motifs.push(one); }
      }
    } else {
      motifTimer += dt;
      if (motifTimer >= SIM.motifCycle) {
        motifTimer -= SIM.motifCycle;
        if (motifs.length < SIM.maxMotifs) {
          var m = launchMotif(r);
          if (m) motifs.push(m);
        }
      }
      for (var i = motifs.length - 1; i >= 0; i--) {
        motifs[i].clock += dt;
        // Turn on the same half-sine that drives the rise: barely moving while
        // buried, fastest at the peak of the peek
        motifs[i].rot += motifs[i].spin * Math.sin(Math.PI * (motifs[i].clock / SIM.motifShow)) * dt;
        if (motifs[i].clock >= SIM.motifShow) motifs.splice(i, 1);
      }
    }

    for (var n = 0; n < motifs.length && motifCount < SIM.maxMotifs; n++) {
      var mo = motifs[n];
      var st = MOTIF_STATIONS[mo.station];
      var ax, ay, nx, ny, tx, ty;     // anchor, outward normal, edge tangent
      if (st.edge === 'bottom')     { ax = r.left + r.width * st.along;  ay = r.bottom; nx =  0; ny = 1; tx = 1; ty = 0; }
      else if (st.edge === 'left')  { ax = r.left;  ay = r.top + r.height * st.along;   nx = -1; ny = 0; tx = 0; ty = 1; }
      else                          { ax = r.right; ay = r.top + r.height * st.along;   nx =  1; ny = 0; tx = 0; ty = 1; }

      // Rise and set: a half-sine out along the edge normal, with a slow
      // slide along the edge across the whole pass. On the side stations
      // that slide is vertical, which is where the shape most reads as a sun
      // tracking across behind a ridge.
      var t = mo.clock / SIM.motifShow;
      var s = Math.sin(Math.PI * t);
      var out = SIM.motifRadius * (SIM.motifHide + (SIM.motifPeak - SIM.motifHide) * s);
      var lat = (t - 0.5) * SIM.motifDrift * SIM.motifRadius * mo.dir;
      var k = motifCount * 4;
      motifData[k]     = (ax + nx * out + tx * lat) * simScale;
      motifData[k + 1] = simH - (ay + ny * out + ty * lat) * simScale;   // flip to GL y-up
      motifData[k + 2] = SIM.motifRadius * simScale;
      motifData[k + 3] = SIM.motifInk * s;      // fades in and out with the rise
      motifRCData[motifCount * 2]     = Math.cos(mo.rot);
      motifRCData[motifCount * 2 + 1] = Math.sin(mo.rot);
      motifKindData[motifCount] = mo.kind;
      motifCount++;
    }
  }

  function gatherRects(dt) {
    var els = document.querySelectorAll(INK_BLOCKS);
    var count = 0;
    for (var i = 0; i < els.length && count < SIM.maxRects; i++) {
      var el = els[i];
      var r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > window.innerHeight + 80 || r.width < 40 || r.height < 40) continue;

      var target = (hoverEl && (el === hoverEl || el.contains(hoverEl))) ? SIM.hoverBoost : 1.0;
      var cur = (boostMap && boostMap.get(el)) || 1.0;
      cur += (target - cur) * Math.min(1, SIM.boostEase * dt);
      if (boostMap) boostMap.set(el, cur);

      // The fixed navbar hugs the viewport's top edge: push its top and side
      // edges far offscreen so only its bottom edge lives in the fluid — no
      // rounded corners or stray tendrils at the screen border
      var left = r.left, top = r.top, right = r.right, bottom = r.bottom;
      if (top <= 1 && r.width >= window.innerWidth - 2) {
        top -= 160; left -= 160; right += 160;
      }

      var k = count * 4;
      rectData[k]     = ((left + right) / 2) * simScale;
      rectData[k + 1] = simH - ((top + bottom) / 2) * simScale;   // flip to GL y-up
      rectData[k + 2] = ((right - left) / 2) * simScale;
      rectData[k + 3] = ((bottom - top) / 2) * simScale;
      boostData[count] = cur;
      count++;
    }
    return count;
  }

  // --- Uniform locations ---
  function locs(prog, names) {
    var out = {};
    for (var i = 0; i < names.length; i++) out[names[i]] = gl.getUniformLocation(prog, names[i]);
    return out;
  }
  // Both field passes share the same uniform set (unused ones resolve to a
  // null location, which gl.uniform* silently ignores)
  var FIELD_UNIFORMS = ['uPrev', 'uBrushTex', 'uRes', 'uTime', 'uDt', 'uShiftY', 'uMotion', 'uCss',
    'uSimScale', 'uRects', 'uBoost', 'uCount', 'uBand', 'uCorner', 'uAmorph', 'uSpeed', 'uInject', 'uDecay', 'uFlow', 'uBleed',
    'uShear', 'uBgRate', 'uBrushDecay', 'uBrushColor', 'uSplats', 'uSplatCount',
    'uEmit', 'uEmitCount', 'uEmitRad', 'uSrc', 'uSrcCol', 'uSrcCount', 'uHole', 'uHoleAmt',
    'uMotif', 'uMotifRC', 'uMotifKind', 'uMotifCount'];
  var stepU = locs(stepProg, FIELD_UNIFORMS);
  var brushU = locs(brushProg, FIELD_UNIFORMS);
  var drawU = locs(drawProg, ['uTex', 'uBrushTex', 'uRes', 'uBg', 'uColB', 'uPane']);

  var colBg = hexToVec3(SIM.bgColor);
  var colB = hexToVec3(SIM.bgDeep);
  var colPane = hexToVec3(SIM.paneColor);
  var colBrush = hexToVec3(SIM.brushColor);

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionScale() { return (reduceMotion && reduceMotion.matches) ? 0 : 1; }

  // Send the shared uniform set; the previous dye and brush fields are bound
  // on texture units 0 and 1 by the caller
  function setFieldUniforms(u, dt, timeSec, shiftY, count, splatCount) {
    gl.uniform1i(u.uPrev, 0);
    gl.uniform1i(u.uBrushTex, 1);
    gl.uniform2f(u.uRes, simW, simH);
    gl.uniform1f(u.uTime, timeSec);
    gl.uniform1f(u.uDt, dt);
    gl.uniform1f(u.uShiftY, shiftY);
    gl.uniform1f(u.uMotion, motionScale());
    gl.uniform1f(u.uCss, 1 / simScale);
    gl.uniform1f(u.uSimScale, simScale);
    gl.uniform4fv(u.uRects, rectData);
    gl.uniform1fv(u.uBoost, boostData);
    gl.uniform1i(u.uCount, count);
    gl.uniform1f(u.uBand, SIM.bandWidth * simScale);
    gl.uniform1f(u.uCorner, SIM.cornerRadius * simScale);
    gl.uniform1f(u.uAmorph, SIM.amorph * simScale);
    gl.uniform1f(u.uSpeed, SIM.flowSpeed);
    gl.uniform1f(u.uInject, SIM.injectRate);
    gl.uniform1f(u.uDecay, SIM.decayRate);
    gl.uniform3f(u.uFlow, SIM.flowScale1, SIM.flowScale2, SIM.flowEvolve);
    gl.uniform1f(u.uBleed, SIM.bleedSpeed);
    gl.uniform1f(u.uShear, SIM.shearSpeed);
    gl.uniform1f(u.uBgRate, SIM.bgRate);
    gl.uniform1f(u.uBrushDecay, SIM.brushDecay);
    gl.uniform3fv(u.uBrushColor, colBrush);
    gl.uniform4fv(u.uSplats, splatData);
    gl.uniform1i(u.uSplatCount, splatCount || 0);
    gl.uniform4fv(u.uEmit, emitData);
    gl.uniform1i(u.uEmitCount, emitCount);
    gl.uniform1f(u.uEmitRad, SIM.emitterRadius * simScale);
    gl.uniform4fv(u.uSrc, srcData);
    gl.uniform3fv(u.uSrcCol, srcColData);
    gl.uniform1i(u.uSrcCount, srcCount);
    gl.uniform4fv(u.uHole, holeData);
    gl.uniform1f(u.uHoleAmt, holeAmt);
    gl.uniform4fv(u.uMotif, motifData);
    gl.uniform2fv(u.uMotifRC, motifRCData);
    gl.uniform1fv(u.uMotifKind, motifKindData);
    gl.uniform1i(u.uMotifCount, motifCount);
  }

  function bindFieldInputs() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, brushTexA);
  }

  // One dye step: read texA (+ brush field for the shear), write texB, swap
  function stepPass(dt, timeSec, shiftY, count, splatCount) {
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(stepProg);
    bindQuad(stepProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    bindFieldInputs();
    setFieldUniforms(stepU, dt, timeSec, shiftY, count, splatCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    var t = texA; texA = texB; texB = t;
    var f = fboA; fboA = fboB; fboB = f;
  }

  // One brush step: advect the user's true-color ink through the same flow
  function brushPass(dt, timeSec, shiftY, count, splatCount) {
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(brushProg);
    bindQuad(brushProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, brushFboB);
    bindFieldInputs();
    setFieldUniforms(brushU, dt, timeSec, shiftY, count, splatCount);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    var t = brushTexA; brushTexA = brushTexB; brushTexB = t;
    var f = brushFboA; brushFboA = brushFboB; brushFboB = f;
  }

  // Soak-in: after the dye textures are (re)created, run a few big sim steps
  // so the pane interiors are full of ink and the background liquid's
  // marbling is mostly formed on the first visible paint. When the brush
  // field survived the rebuild (resize blit), its pass is skipped — the big
  // warmup steps would visibly advect and fade the preserved strokes.
  function warmup(brushPreserved) {
    var count = gatherRects(1 / 60);
    updatePlaced();   // restored/kept sources and emitters soak in with the panes
    updateMotif(0);   // a motif mid-rise at (re)build time soaks in with them
    for (var i = 0; i < 12; i++) {
      stepPass(0.35, i * 0.35, 0, count, 0);
      if (!brushPreserved) brushPass(0.35, i * 0.35, 0, count, 0);
    }
  }

  // Wipe every dye field back to empty: laid brush ink, live splats, and the
  // marbled background all go. Placed objects stay — the warmup re-soaks the
  // pane interiors and any ink sources so the page reforms instead of
  // flashing blank.
  function clearFields() {
    splats.length = 0;
    paintDrag = null;
    gl.clearColor(0, 0, 0, 0);
    var targets = [fboA, fboB, brushFboA, brushFboB];
    for (var i = 0; i < targets.length; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, targets[i]);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    warmup();
  }

  // --- Animation loop ---
  var running = true;
  var rafId;
  var lastNow = 0;
  var lastScroll = window.pageYOffset;
  var contextLost = false;

  canvas.addEventListener('webglcontextlost', function(e) {
    e.preventDefault();
    contextLost = true;
  });

  function frame(now) {
    if (!running || contextLost) return;
    if (now === undefined) now = performance.now();
    var dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 1 / 60;
    lastNow = now;
    var timeSec = now / 1000;

    var scroll = window.pageYOffset;
    var shiftY = (scroll - lastScroll) * simScale;
    lastScroll = scroll;

    var count = gatherRects(dt);
    updateHole(dt);
    updateMotif(dt);
    reserveCanvas();
    var splatCount = updateSplats(now);
    updatePlaced();
    stepPass(dt, timeSec, shiftY, count, splatCount);
    brushPass(dt, timeSec, shiftY, count, splatCount);

    // Colorize to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(drawProg);
    bindQuad(drawProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, brushTexA);
    gl.uniform1i(drawU.uTex, 0);
    gl.uniform1i(drawU.uBrushTex, 1);
    gl.uniform2f(drawU.uRes, simW, simH);
    gl.uniform3fv(drawU.uBg, colBg);
    gl.uniform3fv(drawU.uColB, colB);
    gl.uniform3fv(drawU.uPane, colPane);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = requestAnimationFrame(frame);
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      lastNow = 0;   // avoid a giant dt (clamped anyway) on wake
    } else if (running) {
      frame();
    }
  }

  restoreState();   // before resize(): restored sources soak in during warmup
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  // The sim paints the pane interiors itself — this class strips the CSS
  // pane chrome (background, border, shadow, glass blur) so nothing sits
  // between the pane fill and its bleed. Only set once the sim is running.
  document.body.classList.add('ink-active');

  // --- Control table: live knobs for the brush and the fluid ---
  // Every uniform is re-sent from SIM each frame, so sliders just mutate SIM.
  // Starts mostly hidden: a small round tab with a soft pulsing glow that
  // invites a press. Tapping it (or anywhere on the collapsed tab) unfolds
  // the full table; tapping the header folds it back. The glow stops for
  // good after the first open.
  var panel = document.createElement('div');
  panel.className = 'ink-controls collapsed glow';
  panel.innerHTML =
    '<button type="button" class="ink-toggle" data-ink="toggle" title="Ink controls">' +
      '<span class="when-closed">&#10002;</span>' +
      '<span class="when-open">&#10002; ink controls &#9662;</span>' +
    '</button>' +
    '<label>Brush <input type="color" data-ink="brush" value="' + SIM.brushColor + '"></label>' +
    '<label>Size <input type="range" data-ink="size" min="0.5" max="3" step="0.1" value="' + SIM.brushScale + '"></label>' +
    '<label>Ink life <input type="range" data-ink="life" min="0" max="100" step="1" value="' +
      Math.round(100 * Math.log(SIM.brushDecay / 6) / Math.log(0.001)) + '"></label>' +
    '<label>Turbulence <input type="range" data-ink="flow" min="0" max="12000" step="200" value="' + SIM.flowSpeed + '"></label>' +
    '<label>Mixing <input type="range" data-ink="mix" min="0.02" max="0.09" step="0.001" value="' + SIM.flowScale2 + '"></label>' +
    '<label>Shear <input type="range" data-ink="shear" min="0" max="80" step="2" value="' + SIM.shearSpeed + '"></label>' +
    '<label>Bleed <input type="range" data-ink="bleed" min="0" max="40" step="1" value="' + SIM.bleedSpeed + '"></label>' +
    '<label>Fade <input type="range" data-ink="fade" min="0.05" max="0.6" step="0.01" value="' + SIM.decayRate + '"></label>' +
    '<div class="ink-buttons">' +
    '<button type="button" data-ink="place-emitter" title="Then click-drag the background: press = position, drag = flow direction and strength">Place flow emitter</button>' +
    '<button type="button" data-ink="place-source" title="Then click the background to place a bleeding ink source in the current brush color">Place ink source</button>' +
    '</div>' +
    '<div class="ink-note">Double click object to delete</div>' +
    '<div class="ink-buttons">' +
    '<button type="button" data-ink="clear-placed" title="Remove all placed emitters and sources">Clear objects</button>' +
    '<button type="button" data-ink="clear-canvas" title="Wipe all laid ink — the panes and any placed sources soak back in">Clear canvas</button>' +
    '<button type="button" class="mini" data-ink="undo" title="Undo" disabled>&#8630;</button>' +
    '<button type="button" class="mini" data-ink="redo" title="Redo" disabled>&#8631;</button>' +
    '</div>';
  document.body.appendChild(panel);

  panel.addEventListener('click', function(e) {
    // Collapsed: any tap on the tab unfolds the table (and retires the glow)
    if (panel.classList.contains('collapsed')) {
      panel.classList.remove('collapsed');
      panel.classList.remove('glow');
      return;
    }
    var btn = (e.target && e.target.closest) ? e.target.closest('button[data-ink]') : null;
    if (!btn) return;
    var k = btn.getAttribute('data-ink');
    if (k === 'toggle') {
      panel.classList.add('collapsed');
    } else if (k === 'undo') {
      doUndo();
    } else if (k === 'redo') {
      doRedo();
    } else if (k === 'clear-placed') {
      if (emitters.length || sources.length) pushHistory();
      for (var i = 0; i < emitters.length; i++) {
        if (emitters[i].el) emitters[i].el.remove();
      }
      emitters.length = 0;
      clearSources();
      setPlaceMode(null);
      saveState();
    } else if (k === 'clear-canvas') {
      clearFields();
    } else if (k === 'place-emitter') {
      setPlaceMode(placeMode === 'emitter' ? null : 'emitter');
    } else if (k === 'place-source') {
      setPlaceMode(placeMode === 'source' ? null : 'source');
    }
  });

  panel.addEventListener('input', function(e) {
    var knob = e.target.getAttribute('data-ink');
    var v = e.target.value;
    if (knob === 'brush')      { SIM.brushColor = v; colBrush = hexToVec3(v); }
    else if (knob === 'size')  SIM.brushScale = parseFloat(v);
    else if (knob === 'life')  SIM.brushDecay = 6 * Math.pow(0.001, parseFloat(v) / 100);
    else if (knob === 'flow')  SIM.flowSpeed = parseFloat(v);
    else if (knob === 'mix')   SIM.flowScale2 = parseFloat(v);
    else if (knob === 'shear') SIM.shearSpeed = parseFloat(v);
    else if (knob === 'bleed') SIM.bleedSpeed = parseFloat(v);
    else if (knob === 'fade')  SIM.decayRate = parseFloat(v);
    saveState();
  });

  frame();

  return {
    stop: function() {
      running = false;
      cancelAnimationFrame(rafId);
      document.body.classList.remove('ink-active');
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('pointerover', onPointerOver, true);
      document.documentElement.removeEventListener('pointerleave', onPointerLeaveDoc);
      document.removeEventListener('pointerdown', onPaintDown);
      document.removeEventListener('pointermove', onPaintMove);
      window.removeEventListener('pointerup', onPaintUp);
      document.removeEventListener('pointercancel', onPaintUp);
      document.documentElement.style.cursor = '';
      var mainEl = document.querySelector('.main-content');
      if (mainEl) mainEl.style.paddingBottom = '';
      arrowLayer.remove();
      panel.remove();
      canvas.remove();
    }
  };
}
