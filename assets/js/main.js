// Modern Portfolio JavaScript
// Clean, minimal functionality for navigation and animations

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all functionality
  initNavigation();
  initNavbarAutoHide();
  initAnimations();
  initSmoothScrolling();
  initProjectSectionMemory();
  initGallerySystem();
  initParticleSimulation();
});

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
// 2D PARTICLE SIMULATION WITH ATTRACTORS & REPULSORS
// =======================================================================================

function initParticleSimulation() {

  // ===================================================================================
  // SIMULATION SETTINGS — Tweak these to change the look and feel
  // ===================================================================================

  var SIM = {
    // -- Particles --
    particleCount:        100,       // Total number of particles
    particleMinRadius:    8,        // Smallest particle radius (px)
    particleMaxRadius:    16,       // Largest particle radius (px)  (10% of force field ~120-160px)
    particleOpacity:      1.0,      // Particle fill opacity (0..1, 1 = fully solid)
    particleSoftness:     0.0,      // Edge softness (0 = hard circle, 1 = fully feathered to transparent)
    particleInitSpeed:    0.3,      // Initial random velocity magnitude
    particleDamping:      0.985,    // Velocity multiplier per frame (0..1, lower = more friction)
    particleMaxSpeed:     1.8,      // Hard speed cap (px per frame)

    // -- Attractors (pull particles in) --
    attractorCount:       3,        // Number of attractors
    attractorStrengths:   [0.3, 0.7, 0.5],       // Strength per attractor
    attractorRadii:       [750, 200, 380],        // Influence radius per attractor (px)
    attractorForceMult:   0.05,     // Global multiplier on attractor force
    attractorVisualSize:  50,       // Visual draw radius for attractors (px, 0 = invisible)
    attractorOpacity:     0.98,     // Fill opacity for attractor glow (0..1)
    attractorSoftness:    0.95,      // Edge softness (0 = hard circle, 1 = fully feathered)
    attractorColor:       null,     // Color override (null = use page theme, or e.g. '#ff0000')

    // -- Repulsors / Emitters (push particles away) --
    repulsorCount:        2,        // Number of repulsors
    repulsorStrengths:    [0.2, 0.6],             // Strength per repulsor
    repulsorRadii:        [520, 280],             // Influence radius per repulsor (px)
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
    roleSwapInterval:     10,       // Seconds between attractor<->repulsor role swap (0 = disabled)

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

  // Hide existing CSS shapes
  var existingShapes = document.querySelector('.bg-animated-shapes');
  if (existingShapes) {
    var shapeChildren = existingShapes.querySelectorAll('.shape');
    shapeChildren.forEach(function(s) { s.style.display = 'none'; });
  }

  // Create canvas
  var canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.filter = 'blur(' + SIM.blurCSS + ')';
  canvas.style.mixBlendMode = SIM.blendMode;
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    // Reposition force point orbit centers on resize
    forcePoints.forEach(function(fp) {
      fp.cx = W * fp.cxRatio;
      fp.cy = H * fp.cyRatio;
      fp.orbitRx = W * fp.rxRatio;
      fp.orbitRy = H * fp.ryRatio;
    });
  }

  // --- Color palettes per page theme ---
  var colorPalettes = {
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

  function getColors() {
    var body = document.body;
    if (body.classList.contains('page-projects') && body.classList.contains('professional-active')) {
      return colorPalettes['page-projects-professional'];
    }
    if (body.classList.contains('page-about')) return colorPalettes['page-about'];
    if (body.classList.contains('page-resume')) return colorPalettes['page-resume'];
    if (body.classList.contains('page-projects')) return colorPalettes['page-projects'];
    if (body.classList.contains('projects-page')) return colorPalettes['projects-page'];
    return colorPalettes['default'];
  }

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
    return {
      x: Math.random() * (W || window.innerWidth),
      y: Math.random() * (H || window.innerHeight),
      vx: (Math.random() - 0.5) * SIM.particleInitSpeed,
      vy: (Math.random() - 0.5) * SIM.particleInitSpeed,
      radius: SIM.particleMinRadius + Math.random() * (SIM.particleMaxRadius - SIM.particleMinRadius),
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: SIM.particleOpacity
    };
  }

  function updateParticle(p) {
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

    // Wrap around edges with margin
    var margin = p.radius;
    if (p.x < -margin) p.x = W + margin;
    if (p.x > W + margin) p.x = -margin;
    if (p.y < -margin) p.y = H + margin;
    if (p.y > H + margin) p.y = -margin;
  }

  function drawParticle(p) {
    var rgb = hexToRgb(p.color);
    var softness = SIM.particleSoftness;
    if (softness > 0.01) {
      // Soft-edged particle via radial gradient
      var solidStop = 1 - softness;  // fraction of radius that is solid
      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
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
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawForcePoint(fp, visualSize, opacity, softness, colorOverride) {
    if (visualSize <= 0) return;
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
    var cyR = 0.15 + Math.random() * 0.7;
    var rxR = SIM.orbitRadiusXMin + Math.random() * (SIM.orbitRadiusXMax - SIM.orbitRadiusXMin);
    var ryR = SIM.orbitRadiusYMin + Math.random() * (SIM.orbitRadiusYMax - SIM.orbitRadiusYMin);
    var startW = W || window.innerWidth;
    var startH = H || window.innerHeight;
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
      orbitRy: startH * ryR,
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

    // Soft bounce off edges
    var margin = 50;
    if (fp.x < margin)     fp.vx += 0.1;
    if (fp.x > W - margin) fp.vx -= 0.1;
    if (fp.y < margin)     fp.vy += 0.1;
    if (fp.y > H - margin) fp.vy -= 0.1;
  }

  function drawConnections() {
    if (SIM.connectionDistance <= 0) return;
    var maxDist = SIM.connectionDistance;
    var maxDistSq = maxDist * maxDist;
    ctx.lineWidth = SIM.connectionWidth;

    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i + 1; j < particles.length; j++) {
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          var dist = Math.sqrt(distSq);
          var alpha = (1 - dist / maxDist) * SIM.connectionOpacity;
          var rgb;
          if (SIM.connectionColor) {
            rgb = hexToRgb(SIM.connectionColor);
          } else {
            rgb = hexToRgb(a.color);
          }
          ctx.strokeStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  // --- Initialize force points from SIM settings ---
  for (var ai = 0; ai < SIM.attractorCount; ai++) {
    var aStr = SIM.attractorStrengths[ai] !== undefined ? SIM.attractorStrengths[ai] : 0.5;
    var aRad = SIM.attractorRadii[ai] !== undefined ? SIM.attractorRadii[ai] : 300;
    attractors.push(createForcePoint(aStr, aRad, true));
    forcePoints.push(attractors[ai]);
  }
  for (var ri = 0; ri < SIM.repulsorCount; ri++) {
    var rStr = SIM.repulsorStrengths[ri] !== undefined ? SIM.repulsorStrengths[ri] : 0.5;
    var rRad = SIM.repulsorRadii[ri] !== undefined ? SIM.repulsorRadii[ri] : 280;
    repulsors.push(createForcePoint(rStr, rRad, false));
    forcePoints.push(repulsors[ri]);
  }

  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < SIM.particleCount; i++) {
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

  // --- Role swap timer: flip attractors <-> repulsors periodically ---
  if (SIM.roleSwapInterval > 0) {
    setInterval(function() {
      for (var si = 0; si < forcePoints.length; si++) {
        forcePoints[si].isAttractor = !forcePoints[si].isAttractor;
      }
      // Swap the arrays so drawing uses the right visual settings
      var temp = attractors.slice();
      attractors.length = 0;
      Array.prototype.push.apply(attractors, repulsors.slice());
      repulsors.length = 0;
      Array.prototype.push.apply(repulsors, temp);
    }, SIM.roleSwapInterval * 1000);
  }

  // --- Animation loop ---
  var animFrameId;
  function animate() {
    ctx.clearRect(0, 0, W, H);

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
      updateParticle(particles[pi]);
      drawParticle(particles[pi]);
    }

    // Draw connection lines between nearby particles
    drawConnections();

    animFrameId = requestAnimationFrame(animate);
  }

  // Pause when tab not visible for performance
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      cancelAnimationFrame(animFrameId);
    } else {
      animate();
    }
  });

  animate();
}
