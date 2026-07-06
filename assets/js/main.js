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

// --- Manager: the watercolor canvas is the only background visual ---
function initBackgroundVisuals() {
  // Photo-first pages (photography portfolio) provide their own full-black
  // stage — skip the background entirely so nothing animates behind the photos
  if (document.querySelector('.stage')) return;

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
