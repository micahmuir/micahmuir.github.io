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
// A tiny GPU advection simulation. Content-card edges are the interface between
// two inks: one seeps from just inside each card's outline, the other from just
// outside. A divergence-free curl-noise flow slowly stirs the dye field, so the
// boundary between the inks constantly shifts and mixes with turbulent tendrils.
//
// Cost: two low-res ping-pong textures (~1/3 screen resolution, capped) and two
// fragment passes per frame — one sim step, one colorize. No geometry, no CPU
// per-pixel work. The dye field is advected in screen space but shifted by the
// scroll delta each frame, so tendrils stay anchored to their cards.
// =======================================================================================

function createInkBoundaryVisual() {

  var SIM = {
    // -- Resolution: sim runs on a small buffer, CSS scales it up --
    maxSimDim:     880,      // Cap on the sim buffer's largest dimension (px)
    maxScale:      0.5,      // Never simulate above half resolution

    // -- Palette: dark ink on light paper --
    // The background is the lightest tone; the panes and both inks share one
    // hue and sit darker than it. The panes and the ink they bleed are ONE
    // substance (paneColor); the surrounding ink is a mid-dark wash of the
    // same hue that the bleed mixes into.
    bgColor:       '#f2ead9',   // Page/canvas background (creamy beige) — keep in
                                // sync with the .page-about.ink-active CSS background
    inkOuter:      '#8f8878',   // Surrounding ink wash, warm grey, darker than bg

    // -- Boundary band: where the two inks are continuously injected --
    // Both inks live just OUTSIDE the card edge (the glass panels are opaque
    // enough to hide anything under them): the deep ink hugs the edge, the
    // bright ink rings it further out, and the flow mixes them where they meet
    bandWidth:     54,       // Total reach of the ink bands from the card edge (CSS px)
    cornerRadius:  18,       // Card corner rounding — matches --border-radius (CSS px)

    // -- Pane fill: the panes are not drawn as rectangles — they are regions
    //    of strong ink injection in the SAME advected dye field as the bleed,
    //    so the pane body, its boundary, and its tendrils are one continuous
    //    fluid: a rectangular blob of ink mixing into the background --
    paneColor:     '#20221f',   // The ink — pane body and everything it sheds
                                // (near-black warm grey)
    injectRate:    2.8,      // Dye injection per second inside the bands
    decayRate:     0.18,     // Fractional dye decay per second — sets tendril lifetime

    // -- Turbulent flow: curl noise --
    flowSpeed:     5600,     // Overall stirring strength (raw curl magnitude is ~0.01,
                             // so this lands around 40-55 CSS px/s of drift)
    flowScale1:    0.009,    // Large swirls: ~110 CSS px wavelength
    flowScale2:    0.055,    // Fine filaments: ~18 CSS px wavelength
    flowEvolve:    0.09,     // How fast the flow pattern itself morphs over time
    bleedSpeed:    14,       // Outward current from every pane edge (CSS px/s) — the
                             // panes continuously push fresh ink away as they bleed,
                             // stretching the seep points into fingers

    // -- Interaction --
    hoverBoost:    1.9,      // Injection multiplier while a card is hovered
    boostEase:     3.0,      // How quickly the hover boost fades in/out (1/s)

    // -- Interaction: click drops an ink splot, click-drag paints a stroke.
    //    Brush ink lives in its own dye channel with its own color, so the
    //    control panel can recolor it independently of the pane ink --
    brushColor:    '#8c2f22',   // Default brush ink (control panel can change it)
    brushScale:    1,        // Brush size multiplier (control panel)
    splatRadius:   34,       // Single-click splot radius (CSS px, ±random)
    strokeRadius:  16,       // Radius of each stroke stamp while dragging (CSS px)
    strokeSpacing: 12,       // Distance dragged between stroke stamps (CSS px)
    splatStrength: 16,       // Injection rate at a splat's center (dye/s)
    maxSplats:     16,       // Uniform-array size; oldest splats drop first

    maxRects:      8         // Uniform-array size; visible blocks beyond this are skipped
  };

  var canvas = document.createElement('canvas');
  canvas.id = 'ink-canvas';
  document.body.appendChild(canvas);

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
  var STEP_FRAG = PRECISION + '\n' + [
    'uniform sampler2D uPrev;',
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
    'uniform float uSpeed;',
    'uniform float uInject;',
    'uniform float uDecay;',
    'uniform vec3  uFlow;',      // (freq1, freq2, evolve)
    'uniform float uBleed;',     // outward bleed current, CSS px/s
    'uniform vec4  uSplats[' + SIM.maxSplats + '];',   // xy center (sim px), z radius (sim px), w strength
    'uniform int   uSplatCount;',

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

    'float sceneSD(vec2 p) {',
    '  float d = 1e6;',
    '  for (int i = 0; i < ' + SIM.maxRects + '; i++) {',
    '    if (i >= uCount) break;',
    '    d = min(d, sdRoundRect(p, uRects[i].xy, uRects[i].zw, uCorner));',
    '  }',
    '  return d;',
    '}',

    'void main() {',
    '  vec2 p = gl_FragCoord.xy;',
    '  vec2 q = p * uCss;',

    // Signed distance to the nearest pane edge, tracking that pane's hover boost
    '  float d = 1e6;',
    '  float boost = 1.0;',
    '  for (int i = 0; i < ' + SIM.maxRects + '; i++) {',
    '    if (i >= uCount) break;',
    '    float di = sdRoundRect(p, uRects[i].xy, uRects[i].zw, uCorner);',
    '    if (di < d) { d = di; boost = uBoost[i]; }',
    '  }',

    // The panes bleed: near every edge the flow gains an outward component
    // (along the SDF gradient), continuously carrying fresh ink away
    '  vec2 g = vec2(sceneSD(p + vec2(2.0, 0.0)) - d, sceneSD(p + vec2(0.0, 2.0)) - d);',
    '  vec2 outward = g / max(length(g), 0.001);',
    '  float push = smoothstep(uBand * 1.8, 0.0, abs(d));',

    // Semi-Lagrangian advection: walk back along the flow (and the scroll
    // shift) and pick up the dye that is arriving at this pixel
    '  vec2 vel = (curlVel(q, uTime) * uSpeed + outward * uBleed * push) * uSimScale * uMotion;',
    '  vec2 back = p - vec2(0.0, uShiftY) - vel * uDt;',
    '  vec3 dye = texture2D(uPrev, back / uRes).rgb;',   // r pane ink, g wash, b brush ink

    // Ink sources, strictly OUTSIDE the edge; nothing is injected inside a
    // pane. The pane's ink (R) grows as radial FINGERS rooted on the edge:
    // the gate noise is sampled at the point projected onto the pane edge,
    // so it is constant along each outward ray — an open gate feeds a whole
    // finger from root to tip, with clean pane edge between fingers. The
    // surrounding wash (G) is only faint far mottling, never an outline.
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
    // The wash is a halo bound to each finger, reaching past its tip —
    // watery diffusion around the ink, never a free-floating field
    '  float srcB = 0.35 * gate * smoothstep(len * 1.6, len * 0.5, s) * side;',

    // The pane body itself: saturating injection deep inside, ramping off
    // toward the edge. The interior stays solid, but the boundary shell is
    // fed slowly enough that the flow genuinely erodes and smears it — the
    // pane is a blob of ink whose edge belongs to the fluid.
    '  float srcPane = smoothstep(0.06, -0.35, s);',

    '  vec2 src = vec2(max(srcA, srcPane), srcB);',

    '  dye *= 1.0 - uDecay * uDt;',
    '  dye -= 0.0012;',   // sweep byte-texture quantization residue down to true zero
    '  dye.rg += src * (uInject * boost * uDt);',

    // User ink: clicked splots and drag-stroke stamps, injected as gaussian
    // bursts of brush ink (with a touch of wash), then left to the fluid
    '  float splat = 0.0;',
    '  for (int i = 0; i < ' + SIM.maxSplats + '; i++) {',
    '    if (i >= uSplatCount) break;',
    '    vec2 sd = p - uSplats[i].xy;',
    '    splat += uSplats[i].w * exp(-dot(sd, sd) / (uSplats[i].z * uSplats[i].z));',
    '  }',
    '  dye.b += splat * uDt;',
    '  dye.g += splat * 0.25 * uDt;',

    '  gl_FragColor = vec4(clamp(dye, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  // Colorize: dark ink on light paper. Ink coverage interpolates the paper
  // toward the ink tones — the pane body and everything it sheds (field.r)
  // are one substance in paneColor; the surrounding wash (field.g) is a
  // mid-dark layer of the same hue underneath it.
  var DRAW_FRAG = PRECISION + '\n' + [
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',
    'uniform vec3 uBg;',
    'uniform vec3 uColB;',
    'uniform vec3 uPane;',
    'uniform vec3 uBrush;',
    'void main() {',
    '  vec3 field = texture2D(uTex, gl_FragCoord.xy / uRes).rgb;',
    '  vec3 col = mix(uBg, uColB, min(field.g, 1.0));',
    '  col = mix(col, uPane, field.r);',
    '  col = mix(col, uBrush, field.b);',   // user's brush ink layers on top
    '  gl_FragColor = vec4(col, 1.0);',
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
  var drawProg = program(DRAW_FRAG);
  if (!stepProg || !drawProg) {
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

  // --- Ping-pong dye textures ---
  var texA = null, texB = null, fboA = null, fboB = null;
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
    if (w === simW && h === simH) return;
    simW = canvas.width = w;
    simH = canvas.height = h;
    simScale = scale;
    if (texA) { gl.deleteTexture(texA); gl.deleteTexture(texB); gl.deleteFramebuffer(fboA); gl.deleteFramebuffer(fboB); }
    var a = makeTarget(w, h);
    var b = makeTarget(w, h);
    texA = a.tex; fboA = a.fbo;
    texB = b.tex; fboB = b.fbo;
    warmup();   // fresh textures start empty — soak the pane interiors in
  }

  // --- Content blocks whose edges the inks trace ---
  var INK_BLOCKS = '.paper-panel, .card, .timeline-content, .project-nav, .video-container';
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
      if (t >= 1) continue;
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
    if (e.target && e.target.closest && e.target.closest(NO_PAINT)) return;
    spawnSplat(e.clientX, e.clientY, SIM.splatRadius * SIM.brushScale * (0.75 + Math.random() * 0.5), 0.55);
    paintDrag = { x: e.clientX, y: e.clientY };
  }
  function onPaintMove(e) {
    if (!paintDrag) return;
    var dx = e.clientX - paintDrag.x;
    var dy = e.clientY - paintDrag.y;
    if (dx * dx + dy * dy < SIM.strokeSpacing * SIM.strokeSpacing) return;
    paintDrag = { x: e.clientX, y: e.clientY };
    spawnSplat(e.clientX, e.clientY, SIM.strokeRadius * SIM.brushScale * (0.8 + Math.random() * 0.4), 0.4);
  }
  function onPaintUp() { paintDrag = null; }

  document.addEventListener('pointerdown', onPaintDown);
  document.addEventListener('pointermove', onPaintMove);
  window.addEventListener('pointerup', onPaintUp);
  document.addEventListener('pointercancel', onPaintUp);

  // Gather visible blocks as sim-space rects (y-up), easing each block's hover
  // boost so the extra ink swells and subsides smoothly
  var rectData = new Float32Array(SIM.maxRects * 4);
  var boostData = new Float32Array(SIM.maxRects);

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

      var k = count * 4;
      rectData[k]     = (r.left + r.width / 2) * simScale;
      rectData[k + 1] = simH - (r.top + r.height / 2) * simScale;   // flip to GL y-up
      rectData[k + 2] = (r.width / 2) * simScale;
      rectData[k + 3] = (r.height / 2) * simScale;
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
  var stepU = locs(stepProg, ['uPrev', 'uRes', 'uTime', 'uDt', 'uShiftY', 'uMotion', 'uCss',
    'uSimScale', 'uRects', 'uBoost', 'uCount', 'uBand', 'uCorner', 'uSpeed', 'uInject', 'uDecay', 'uFlow', 'uBleed',
    'uSplats', 'uSplatCount']);
  var drawU = locs(drawProg, ['uTex', 'uRes', 'uBg', 'uColB', 'uPane', 'uBrush']);

  var colBg = hexToVec3(SIM.bgColor);
  var colB = hexToVec3(SIM.inkOuter);
  var colPane = hexToVec3(SIM.paneColor);
  var colBrush = hexToVec3(SIM.brushColor);

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  function motionScale() { return (reduceMotion && reduceMotion.matches) ? 0 : 1; }

  // One sim step: read texA, write texB, swap
  function stepPass(dt, timeSec, shiftY, count, splatCount) {
    gl.viewport(0, 0, simW, simH);
    gl.useProgram(stepProg);
    bindQuad(stepProg);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(stepU.uPrev, 0);
    gl.uniform2f(stepU.uRes, simW, simH);
    gl.uniform1f(stepU.uTime, timeSec);
    gl.uniform1f(stepU.uDt, dt);
    gl.uniform1f(stepU.uShiftY, shiftY);
    gl.uniform1f(stepU.uMotion, motionScale());
    gl.uniform1f(stepU.uCss, 1 / simScale);
    gl.uniform1f(stepU.uSimScale, simScale);
    gl.uniform4fv(stepU.uRects, rectData);
    gl.uniform1fv(stepU.uBoost, boostData);
    gl.uniform1i(stepU.uCount, count);
    gl.uniform1f(stepU.uBand, SIM.bandWidth * simScale);
    gl.uniform1f(stepU.uCorner, SIM.cornerRadius * simScale);
    gl.uniform1f(stepU.uSpeed, SIM.flowSpeed);
    gl.uniform1f(stepU.uInject, SIM.injectRate);
    gl.uniform1f(stepU.uDecay, SIM.decayRate);
    gl.uniform3f(stepU.uFlow, SIM.flowScale1, SIM.flowScale2, SIM.flowEvolve);
    gl.uniform1f(stepU.uBleed, SIM.bleedSpeed);
    gl.uniform4fv(stepU.uSplats, splatData);
    gl.uniform1i(stepU.uSplatCount, splatCount || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    var t = texA; texA = texB; texB = t;
    var f = fboA; fboA = fboB; fboB = f;
  }

  // Soak-in: after the dye textures are (re)created, run a few big sim steps
  // so the pane interiors are already full of ink on the first visible paint
  function warmup() {
    var count = gatherRects(1 / 60);
    for (var i = 0; i < 8; i++) {
      stepPass(0.35, i * 0.35, 0, count, 0);
    }
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
    var splatCount = updateSplats(now);
    stepPass(dt, timeSec, shiftY, count, splatCount);

    // Colorize to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(drawProg);
    bindQuad(drawProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texA);
    gl.uniform1i(drawU.uTex, 0);
    gl.uniform2f(drawU.uRes, simW, simH);
    gl.uniform3fv(drawU.uBg, colBg);
    gl.uniform3fv(drawU.uColB, colB);
    gl.uniform3fv(drawU.uPane, colPane);
    gl.uniform3fv(drawU.uBrush, colBrush);
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

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  // The sim paints the pane interiors itself — this class strips the CSS
  // pane chrome (background, border, shadow, glass blur) so nothing sits
  // between the pane fill and its bleed. Only set once the sim is running.
  document.body.classList.add('ink-active');

  // --- Control table: live knobs for the brush and the fluid ---
  // Every uniform is re-sent from SIM each frame, so sliders just mutate SIM.
  var panel = document.createElement('div');
  panel.className = 'ink-controls';
  panel.innerHTML =
    '<label>Brush <input type="color" data-ink="brush" value="' + SIM.brushColor + '"></label>' +
    '<label>Size <input type="range" data-ink="size" min="0.5" max="3" step="0.1" value="' + SIM.brushScale + '"></label>' +
    '<label>Turbulence <input type="range" data-ink="flow" min="0" max="12000" step="200" value="' + SIM.flowSpeed + '"></label>' +
    '<label>Mixing <input type="range" data-ink="mix" min="0.02" max="0.09" step="0.005" value="' + SIM.flowScale2 + '"></label>' +
    '<label>Bleed <input type="range" data-ink="bleed" min="0" max="40" step="1" value="' + SIM.bleedSpeed + '"></label>' +
    '<label>Fade <input type="range" data-ink="fade" min="0.05" max="0.6" step="0.01" value="' + SIM.decayRate + '"></label>';
  document.body.appendChild(panel);

  panel.addEventListener('input', function(e) {
    var knob = e.target.getAttribute('data-ink');
    var v = e.target.value;
    if (knob === 'brush')      colBrush = hexToVec3(v);
    else if (knob === 'size')  SIM.brushScale = parseFloat(v);
    else if (knob === 'flow')  SIM.flowSpeed = parseFloat(v);
    else if (knob === 'mix')   SIM.flowScale2 = parseFloat(v);
    else if (knob === 'bleed') SIM.bleedSpeed = parseFloat(v);
    else if (knob === 'fade')  SIM.decayRate = parseFloat(v);
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
      panel.remove();
      canvas.remove();
    }
  };
}
