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
// SWITCHABLE BACKGROUND VISUALS
// A small control at the bottom of every page picks between background effects:
//   1. "Nodes"      — particle simulation with attractors & repulsors
//   2. "Watercolor" — pigment washes that bleed and mix on a persistent canvas;
//                     hovering clickable elements releases extra pigment
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

// --- Manager: builds the switcher control and swaps visuals ---
function initBackgroundVisuals() {
  // Hide legacy CSS blob shapes — canvas visuals replace them
  document.querySelectorAll('.bg-animated-shapes .shape').forEach(function(s) {
    s.style.display = 'none';
  });

  var current = null;
  var mode = localStorage.getItem('bgVisualMode');
  if (mode !== 'nodes' && mode !== 'watercolor') mode = 'nodes';

  var control = document.createElement('div');
  control.className = 'bg-visual-control';
  control.setAttribute('aria-label', 'Background visual style');
  control.innerHTML =
    '<button type="button" class="bg-visual-btn" data-mode="nodes" title="Node gravity background">Nodes</button>' +
    '<button type="button" class="bg-visual-btn" data-mode="watercolor" title="Watercolor background">Watercolor</button>';
  document.body.appendChild(control);

  function setMode(m) {
    if (current) {
      current.stop();
      current = null;
    }
    mode = m;
    localStorage.setItem('bgVisualMode', m);
    control.querySelectorAll('.bg-visual-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === m);
    });
    current = (m === 'watercolor') ? createWatercolorVisual() : createParticleVisual();
  }

  control.addEventListener('click', function(e) {
    var btn = e.target.closest('.bg-visual-btn');
    if (!btn) return;
    var m = btn.getAttribute('data-mode');
    if (m !== mode) setMode(m);
  });

  setMode(mode);
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
    W = canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
    H = canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
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
    if (t && t.closest('.bg-visual-control')) t = null; // the switcher itself shouldn't paint
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
// BACKGROUND VISUAL 1: 2D PARTICLE SIMULATION WITH ATTRACTORS & REPULSORS ("Nodes")
// =======================================================================================

function createParticleVisual() {

  // ===================================================================================
  // SIMULATION SETTINGS — Tweak these to change the look and feel
  // ===================================================================================

  var SIM = {
    // -- Particles --
    particleCount:        50,       // Total number of particles
    particleMinRadius:    8,        // Smallest particle radius (px)
    particleMaxRadius:    16,       // Largest particle radius (px)  (10% of force field ~120-160px)
    particleOpacity:      1.0,      // Particle fill opacity (0..1, 1 = fully solid)
    particleSoftness:     0.0,      // Edge softness (0 = hard circle, 1 = fully feathered to transparent)
    particleInitSpeed:    0.3,      // Initial random velocity magnitude
    particleDamping:      0.97,     // Velocity multiplier per frame (0..1, lower = more friction)
    particleMaxSpeed:     0.3,      // Hard speed cap (px per frame)
    particleKeepAway:     60,       // Min distance (px) particles try to maintain from each other (0 = disabled)
    keepAwayStrength:     0.025,    // How strongly particles push apart when too close
                                    // (kept gentle relative to particleMaxSpeed — a strong kick
                                    //  against a low speed cap makes particles jitter/flicker)
    renderSmoothing:      0.1,      // Rendered positions chase physics positions through this
                                    // low-pass filter — physics micro-jitter in dense clusters
                                    // can never reach the screen (1 = no smoothing)

    // -- Attractors (pull particles in) --
    attractorCount:       3,        // Number of attractors
    attractorStrengths:   [0.3, 0.7, 0.5],       // Strength per attractor
    attractorRadii:       [1000, 1000, 1000],        // Influence radius per attractor (px)
    attractorForceMult:   0.05,     // Global multiplier on attractor force
    attractorVisualSize:  50,       // Visual draw radius for attractors (px, 0 = invisible)
    attractorOpacity:     0.98,     // Fill opacity for attractor glow (0..1)
    attractorSoftness:    0.95,      // Edge softness (0 = hard circle, 1 = fully feathered)
    attractorColor:       null,     // Color override (null = use page theme, or e.g. '#ff0000')

    // -- Repulsors / Emitters (push particles away) --
    repulsorCount:        2,        // Number of repulsors
    repulsorStrengths:    [0.2, 0.6],             // Strength per repulsor
    repulsorRadii:        [1000, 1000],             // Influence radius per repulsor (px)
    repulsorForceMult:    0.1,      // Global multiplier on repulsor force
    repulsorVisualSize:   50,       // Visual draw radius for repulsors (px, 0 = invisible)
    repulsorOpacity:      0.94,     // Fill opacity for repulsor glow (0..1)
    repulsorSoftness:     0.95,     // Edge softness (0 = hard circle, 1 = fully feathered)
    repulsorColor:        null,     // Color override (null = use page theme, or e.g. '#0000ff')

    // -- Force Point Orbits (how attractors/repulsors drift around the screen) --
    orbitSpeedMin:        0.0008,   // Minimum angular speed
    orbitSpeedMax:        0.0023,   // Maximum angular speed (min + range)
    orbitRadiusXMin:      0.08,     // Min orbit X radius (fraction of screen width)
    orbitRadiusXMax:      0.23,     // Max orbit X radius
    orbitRadiusYMin:      0.08,     // Min orbit Y radius (fraction of screen height)
    orbitRadiusYMax:      0.23,     // Max orbit Y radius

    // -- Force Point Interactions (attractors & repulsors affect each other) --
    fpInteraction:        true,     // Enable force points pushing/pulling each other
    fpInteractionMult:    0.02,     // How strongly force points affect each other's orbits
    fpInitSpeed:          0.4,      // Initial random velocity for force points (px/frame)
    fpDamping:            0.995,    // Velocity damping for force points
    fpMaxSpeed:           1.2,      // Speed cap for force point drift
    roleSwapIntervalMin:  16,       // Min seconds before a force point swaps role (0 = disabled)
    roleSwapIntervalMax:  32,       // Max seconds before a force point swaps role

    // -- Particle Connection Lines --
    connectionDistance:   300,      // Max distance (px) to draw a line between two particles
    connectionOpacity:    1.0,      // Line opacity at zero distance
    connectionWidth:      5.0,      // Line width in px
    connectionColor:      null,     // Line color (null = use particle color, or e.g. '#ffffff')

    // -- Rendering --
    blurCSS:              '12px',   // CSS blur applied to the canvas
    blendMode:            'lighten' // CSS mix-blend-mode for the canvas
  };

  // ===================================================================================
  // END SETTINGS
  // ===================================================================================

  // Create canvas
  var canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.filter = 'blur(' + SIM.blurCSS + ')';
  canvas.style.mixBlendMode = SIM.blendMode;
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;
  var worldH = 0;       // simulation world spans the full document height
  var scrollOffset = 0; // camera position, follows page scroll
  var running = true;

  function docHeight() {
    return Math.max(window.innerHeight, document.documentElement.scrollHeight);
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    worldH = docHeight();
    // Reposition force point orbit centers on resize
    forcePoints.forEach(function(fp) {
      fp.cx = W * fp.cxRatio;
      fp.cy = worldH * fp.cyRatio;
      fp.orbitRx = W * fp.rxRatio;
      fp.orbitRy = H * fp.ryRatio;
    });
  }

  // --- Color palettes shared across background visuals ---
  var getColors = getPagePalette;

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  // --- Particle ---
  var particles = [];

  function createParticle() {
    var colors = getColors();
    var px = Math.random() * (W || window.innerWidth);
    var py = Math.random() * (worldH || docHeight());
    return {
      x: px,
      y: py,
      rx: px,   // rendered position — smoothed copy of the physics position
      ry: py,
      vx: (Math.random() - 0.5) * SIM.particleInitSpeed,
      vy: (Math.random() - 0.5) * SIM.particleInitSpeed,
      radius: SIM.particleMinRadius + Math.random() * (SIM.particleMaxRadius - SIM.particleMinRadius),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: SIM.particleOpacity
    };
  }

  function updateParticle(p, index) {
    // Forces from attractors
    for (var i = 0; i < attractors.length; i++) {
      var a = attractors[i];
      var dx = a.x - p.x;
      var dy = a.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy) + 1;
      if (dist < a.influenceRadius) {
        var falloff = 1 - (dist / a.influenceRadius);
        var force = a.strength * falloff * SIM.attractorForceMult;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }

    // Forces from repulsors
    for (var j = 0; j < repulsors.length; j++) {
      var r = repulsors[j];
      var rdx = r.x - p.x;
      var rdy = r.y - p.y;
      var rDist = Math.sqrt(rdx * rdx + rdy * rdy) + 1;
      if (rDist < r.influenceRadius) {
        var rFalloff = 1 - (rDist / r.influenceRadius);
        var rForce = r.strength * rFalloff * SIM.repulsorForceMult;
        p.vx -= (rdx / rDist) * rForce;
        p.vy -= (rdy / rDist) * rForce;
      }
    }

    // Particle keep-away: repel from nearby particles
    if (SIM.particleKeepAway > 0) {
      for (var k = index + 1; k < particles.length; k++) {
        var other = particles[k];
        var kdx = p.x - other.x;
        var kdy = p.y - other.y;
        var kDist = Math.sqrt(kdx * kdx + kdy * kdy) + 1;
        if (kDist < SIM.particleKeepAway) {
          var kFalloff = 1 - (kDist / SIM.particleKeepAway);
          // Squared falloff: the force eases in from zero at the boundary instead
          // of switching on abruptly, which caused oscillation in dense clusters
          var kForce = kFalloff * kFalloff * SIM.keepAwayStrength;
          var nx = kdx / kDist;
          var ny = kdy / kDist;
          p.vx += nx * kForce;
          p.vy += ny * kForce;
          other.vx -= nx * kForce;
          other.vy -= ny * kForce;
        }
      }
    }

    // Damping
    p.vx *= SIM.particleDamping;
    p.vy *= SIM.particleDamping;

    // Speed limit
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > SIM.particleMaxSpeed) {
      p.vx = (p.vx / speed) * SIM.particleMaxSpeed;
      p.vy = (p.vy / speed) * SIM.particleMaxSpeed;
    }

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around world edges with margin (world height = document height)
    var margin = p.radius;
    var wrapped = false;
    if (p.x < -margin) { p.x = W + margin; wrapped = true; }
    if (p.x > W + margin) { p.x = -margin; wrapped = true; }
    if (p.y < -margin) { p.y = worldH + margin; wrapped = true; }
    if (p.y > worldH + margin) { p.y = -margin; wrapped = true; }

    // Rendered position chases the physics position through a low-pass filter,
    // so any per-frame jitter is absorbed before drawing. Snap on wrap (the
    // particle is off-screen at that moment) to avoid a streak across the view.
    if (wrapped) {
      p.rx = p.x;
      p.ry = p.y;
    } else {
      p.rx += (p.x - p.rx) * SIM.renderSmoothing;
      p.ry += (p.y - p.ry) * SIM.renderSmoothing;
    }
  }

  function drawParticle(p) {
    // Cull particles outside the visible scroll window
    if (p.ry < scrollOffset - 150 || p.ry > scrollOffset + H + 150) return;
    var rgb = hexToRgb(p.color);
    var softness = SIM.particleSoftness;
    if (softness > 0.01) {
      // Soft-edged particle via radial gradient
      var solidStop = 1 - softness;  // fraction of radius that is solid
      var grad = ctx.createRadialGradient(p.rx, p.ry, 0, p.rx, p.ry, p.radius);
      grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + p.opacity + ')');
      grad.addColorStop(Math.max(0, solidStop), 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + p.opacity + ')');
      grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      ctx.fillStyle = grad;
    } else {
      // Hard-edged particle
      ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      ctx.globalAlpha = p.opacity;
    }
    ctx.beginPath();
    ctx.arc(p.rx, p.ry, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawForcePoint(fp, visualSize, opacity, softness, colorOverride) {
    if (visualSize <= 0) return;
    // Cull force points outside the visible scroll window
    if (fp.y < scrollOffset - visualSize * 4 || fp.y > scrollOffset + H + visualSize * 4) return;
    var colors = getColors();
    var hex = colorOverride || colors[0];
    var rgb = hexToRgb(hex);
    if (softness > 0.01) {
      var solidStop = 1 - softness;
      var grad = ctx.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, visualSize);
      grad.addColorStop(0, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + opacity + ')');
      grad.addColorStop(Math.max(0, solidStop), 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + opacity + ')');
      grad.addColorStop(1, 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0)');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      ctx.globalAlpha = opacity;
    }
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, visualSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- Force Points (attractors & repulsors) ---
  var forcePoints = [];
  var attractors = [];
  var repulsors = [];

  function createForcePoint(strength, influenceRadius, isAttractor) {
    var cxR = 0.15 + Math.random() * 0.7;
    var cyR = 0.1 + Math.random() * 0.8;
    var rxR = SIM.orbitRadiusXMin + Math.random() * (SIM.orbitRadiusXMax - SIM.orbitRadiusXMin);
    var ryR = SIM.orbitRadiusYMin + Math.random() * (SIM.orbitRadiusYMax - SIM.orbitRadiusYMin);
    var startW = W || window.innerWidth;
    var startH = worldH || docHeight();
    var viewH = H || window.innerHeight;
    // Random initial trajectory
    var angle = Math.random() * Math.PI * 2;
    return {
      x: startW * cxR,
      y: startH * cyR,
      vx: Math.cos(angle) * SIM.fpInitSpeed,
      vy: Math.sin(angle) * SIM.fpInitSpeed,
      strength: strength,
      influenceRadius: influenceRadius,
      isAttractor: isAttractor,
      cxRatio: cxR,
      cyRatio: cyR,
      rxRatio: rxR,
      ryRatio: ryR,
      cx: startW * cxR,
      cy: startH * cyR,
      orbitRx: startW * rxR,
      orbitRy: viewH * ryR,
      orbitAngle: Math.random() * Math.PI * 2,
      speed: SIM.orbitSpeedMin + Math.random() * (SIM.orbitSpeedMax - SIM.orbitSpeedMin),
      freqX: 0.7 + Math.random() * 0.6,
      freqY: 0.5 + Math.random() * 0.7,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2
    };
  }

  function updateForcePoint(fp, allForcePoints) {
    // Orbit pull — gently steers toward the Lissajous path
    fp.orbitAngle += fp.speed;
    var targetX = fp.cx + Math.sin(fp.orbitAngle * fp.freqX + fp.phaseX) * fp.orbitRx;
    var targetY = fp.cy + Math.cos(fp.orbitAngle * fp.freqY + fp.phaseY) * fp.orbitRy;
    fp.vx += (targetX - fp.x) * 0.003;
    fp.vy += (targetY - fp.y) * 0.003;

    // Force-point-on-force-point interactions
    if (SIM.fpInteraction) {
      for (var i = 0; i < allForcePoints.length; i++) {
        var other = allForcePoints[i];
        if (other === fp) continue;
        var dx = other.x - fp.x;
        var dy = other.y - fp.y;
        var dist = Math.sqrt(dx * dx + dy * dy) + 1;
        var maxDist = Math.max(fp.influenceRadius, other.influenceRadius);
        if (dist < maxDist) {
          var falloff = 1 - (dist / maxDist);
          var sign = other.isAttractor ? 1 : -1;
          var f = sign * other.strength * falloff * SIM.fpInteractionMult;
          fp.vx += (dx / dist) * f;
          fp.vy += (dy / dist) * f;
        }
      }
    }

    // Damping & speed limit
    fp.vx *= SIM.fpDamping;
    fp.vy *= SIM.fpDamping;
    var spd = Math.sqrt(fp.vx * fp.vx + fp.vy * fp.vy);
    if (spd > SIM.fpMaxSpeed) {
      fp.vx = (fp.vx / spd) * SIM.fpMaxSpeed;
      fp.vy = (fp.vy / spd) * SIM.fpMaxSpeed;
    }

    fp.x += fp.vx;
    fp.y += fp.vy;

    // Soft bounce off world edges
    var margin = 50;
    if (fp.x < margin)          fp.vx += 0.1;
    if (fp.x > W - margin)      fp.vx -= 0.1;
    if (fp.y < margin)          fp.vy += 0.1;
    if (fp.y > worldH - margin) fp.vy -= 0.1;
  }

  function drawConnections() {
    if (SIM.connectionDistance <= 0) return;
    var maxDist = SIM.connectionDistance;
    var maxDistSq = maxDist * maxDist;
    var ALPHA_STEPS = 48;   // quantize alpha into discrete buckets to batch draws
                            // (fine steps — coarse buckets made lines visibly jump
                            //  between alpha levels, reading as flicker)
    var MIN_ALPHA = 0.02;   // floor — lines below this are skipped entirely
    ctx.lineWidth = SIM.connectionWidth;

    // Collect lines into buckets keyed by "r,g,b|alphaStep"
    var buckets = {};

    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = a.rx - b.rx;
        var dy = a.ry - b.ry;
        var distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          // Cull lines fully outside the visible scroll window
          if ((a.ry < scrollOffset - 60 && b.ry < scrollOffset - 60) ||
              (a.ry > scrollOffset + H + 60 && b.ry > scrollOffset + H + 60)) continue;
          var dist = Math.sqrt(distSq);
          var t = 1 - dist / maxDist;
          var alpha = t * t * (3 - 2 * t) * SIM.connectionOpacity;
          if (alpha < MIN_ALPHA) continue;
          // Quantize alpha to discrete step
          var step = Math.round(alpha * ALPHA_STEPS) / ALPHA_STEPS;
          var rgb;
          if (SIM.connectionColor) {
            rgb = hexToRgb(SIM.connectionColor);
          } else {
            rgb = hexToRgb(a.color);
          }
          var key = rgb[0] + ',' + rgb[1] + ',' + rgb[2] + '|' + step;
          if (!buckets[key]) {
            buckets[key] = { rgb: rgb, alpha: step, lines: [] };
          }
          buckets[key].lines.push(a.rx, a.ry, b.rx, b.ry);
        }
      }
    }

    // Draw each bucket in a single batched stroke
    var keys = Object.keys(buckets);
    for (var k = 0; k < keys.length; k++) {
      var bucket = buckets[keys[k]];
      var br = bucket.rgb;
      ctx.strokeStyle = 'rgba(' + br[0] + ',' + br[1] + ',' + br[2] + ',' + bucket.alpha + ')';
      ctx.beginPath();
      var segs = bucket.lines;
      for (var s = 0; s < segs.length; s += 4) {
        ctx.moveTo(segs[s], segs[s + 1]);
        ctx.lineTo(segs[s + 2], segs[s + 3]);
      }
      ctx.stroke();
    }
  }

  // --- Initialize world, force points, and particles ---
  // Size the world first, then scale populations with page length so long
  // pages have the same visual density as short ones (capped for performance)
  resize();
  window.addEventListener('resize', resize);

  var pages = Math.min(4, Math.max(1, Math.round(worldH / H)));

  for (var pg = 0; pg < pages; pg++) {
    for (var ai = 0; ai < SIM.attractorCount; ai++) {
      var aStr = SIM.attractorStrengths[ai] !== undefined ? SIM.attractorStrengths[ai] : 0.5;
      var aRad = SIM.attractorRadii[ai] !== undefined ? SIM.attractorRadii[ai] : 300;
      var att = createForcePoint(aStr, aRad, true);
      attractors.push(att);
      forcePoints.push(att);
    }
    for (var ri = 0; ri < SIM.repulsorCount; ri++) {
      var rStr = SIM.repulsorStrengths[ri] !== undefined ? SIM.repulsorStrengths[ri] : 0.5;
      var rRad = SIM.repulsorRadii[ri] !== undefined ? SIM.repulsorRadii[ri] : 280;
      var rep = createForcePoint(rStr, rRad, false);
      repulsors.push(rep);
      forcePoints.push(rep);
    }
  }

  var totalParticles = Math.min(160, Math.round(SIM.particleCount * worldH / H));
  for (var i = 0; i < totalParticles; i++) {
    particles.push(createParticle());
  }

  // --- Watch for class changes on body (e.g. professional-active toggle) ---
  var currentColorKey = getColors().join(',');
  var classObserver = new MutationObserver(function() {
    var newColors = getColors();
    var newKey = newColors.join(',');
    if (newKey !== currentColorKey) {
      currentColorKey = newKey;
      particles.forEach(function(p) {
        p.color = newColors[Math.floor(Math.random() * newColors.length)];
      });
    }
  });
  classObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // --- Per-force-point role swap timers ---
  var roleSwapTimers = [];

  function randomSwapDelay() {
    return (SIM.roleSwapIntervalMin + Math.random() * (SIM.roleSwapIntervalMax - SIM.roleSwapIntervalMin)) * 1000;
  }

  function scheduleRoleSwap(fp) {
    if (SIM.roleSwapIntervalMin <= 0 && SIM.roleSwapIntervalMax <= 0) return;
    roleSwapTimers.push(setTimeout(function() {
      if (!running) return;
      fp.isAttractor = !fp.isAttractor;
      // Move between attractor/repulsor arrays so drawing uses correct visuals
      if (fp.isAttractor) {
        var idx = repulsors.indexOf(fp);
        if (idx !== -1) repulsors.splice(idx, 1);
        if (attractors.indexOf(fp) === -1) attractors.push(fp);
      } else {
        var idx2 = attractors.indexOf(fp);
        if (idx2 !== -1) attractors.splice(idx2, 1);
        if (repulsors.indexOf(fp) === -1) repulsors.push(fp);
      }
      scheduleRoleSwap(fp); // schedule next swap
    }, randomSwapDelay()));
  }

  for (var swi = 0; swi < forcePoints.length; swi++) {
    scheduleRoleSwap(forcePoints[swi]);
  }

  // --- Animation loop ---
  var animFrameId;
  var heightCheckTick = 0;

  function animate() {
    if (!running) return;

    // Track content height changes (images loading, section toggles)
    if ((heightCheckTick++ & 127) === 0) {
      var dh = docHeight();
      if (Math.abs(dh - worldH) > 4) {
        worldH = dh;
        forcePoints.forEach(function(fp) {
          fp.cy = worldH * fp.cyRatio;
        });
      }
    }

    // Camera follows the page scroll — the field lives in document space
    scrollOffset = window.pageYOffset || 0;

    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(0, -scrollOffset);

    // Update and draw force points (with mutual interaction)
    for (var fi = 0; fi < forcePoints.length; fi++) {
      updateForcePoint(forcePoints[fi], forcePoints);
    }
    for (var adi = 0; adi < attractors.length; adi++) {
      drawForcePoint(attractors[adi], SIM.attractorVisualSize, SIM.attractorOpacity, SIM.attractorSoftness, SIM.attractorColor);
    }
    for (var rei = 0; rei < repulsors.length; rei++) {
      drawForcePoint(repulsors[rei], SIM.repulsorVisualSize, SIM.repulsorOpacity, SIM.repulsorSoftness, SIM.repulsorColor);
    }

    // Update and draw particles
    for (var pi = 0; pi < particles.length; pi++) {
      updateParticle(particles[pi], pi);
      drawParticle(particles[pi]);
    }

    // Draw connection lines between nearby particles
    drawConnections();

    ctx.restore();

    animFrameId = requestAnimationFrame(animate);
  }

  // Pause when tab not visible for performance
  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(animFrameId);
    } else if (running) {
      animate();
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  animate();

  return {
    stop: function() {
      running = false;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      classObserver.disconnect();
      roleSwapTimers.forEach(clearTimeout);
      canvas.remove();
    }
  };
}
