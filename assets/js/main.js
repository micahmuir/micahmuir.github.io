// Modern Portfolio JavaScript
// Clean, minimal functionality for navigation and animations

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all functionality
  initNavigation();
  initNavbarAutoHide();
  initAnimations();
  initSmoothScrollling();
  initProjectSectionMemory();
  initGallerySystem();
});

// Navigation highlighting
function initNavigation() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    
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

// Smooth scrollling for anchor links
function initSmoothScrollling() {
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

// Color scheme management utilities
const ColorScheme = {
  // Easy way to change the entire site's color scheme
  themes: {
    default: {
      '--primary-color': '#2c3e50',
      '--secondary-color': '#3498db',
      '--accent-color': '#e74c3c',
      '--success-color': '#27ae60'
    },
    warm: {
      '--primary-color': '#8b4513',
      '--secondary-color': '#d2691e',
      '--accent-color': '#ff6347',
      '--success-color': '#32cd32'
    },
    cool: {
      '--primary-color': '#2f4f4f',
      '--secondary-color': '#4682b4',
      '--accent-color': '#6a5acd',
      '--success-color': '#20b2aa'
    },
    dark: {
      '--primary-color': '#1a1a1a',
      '--secondary-color': '#4a9eff',
      '--accent-color': '#ff4757',
      '--success-color': '#2ed573'
    }
  },
  
  // Apply a theme by name
  apply: function(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;
    
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Save preference if localStorage is available
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('preferred-theme', themeName);
    }
  },
  
  // Load saved theme
  loadSaved: function() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('preferred-theme');
      if (saved && this.themes[saved]) {
        this.apply(saved);
      }
    }
  }
};

// Load saved color scheme on page load
ColorScheme.loadSaved();

// Export for console access
window.ColorScheme = ColorScheme;

// Project Search and Filter Utilities
const ProjectSearch = {
  // Highlight matching text in search results
  highlightText: function(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  },
  
  // Advanced search with multiple terms
  advancedSearch: function(cards, searchTerms) {
    const terms = searchTerms.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return Array.from(cards).map(card => {
      const tags = card.getAttribute('data-tags')?.toLowerCase() || '';
      const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
      const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';
      
      const content = `${title} ${description} ${tags}`;
      
      // Calculate relevance score
      let score = 0;
      terms.forEach(term => {
        if (title.includes(term)) score += 3; // Title matches are most important
        if (tags.includes(term)) score += 2;  // Tag matches are important
        if (description.includes(term)) score += 1; // Description matches are least important
      });
      
      return { card, score, matches: score > 0 };
    }).filter(result => result.matches)
      .sort((a, b) => b.score - a.score);
  },
  
  // Get all unique tags from project cards
  getAllTags: function(cards) {
    const tagSet = new Set();
    
    Array.from(cards).forEach(card => {
      const tags = card.getAttribute('data-tags');
      if (tags) {
        tags.split(',').forEach(tag => {
          tagSet.add(tag.trim().toLowerCase());
        });
      }
    });
    
    return Array.from(tagSet).sort();
  }
};

// Export search utilities
window.ProjectSearch = ProjectSearch;

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
