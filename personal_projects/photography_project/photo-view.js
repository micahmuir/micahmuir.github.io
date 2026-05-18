(function () {
  // --- Slideshow ---
  const slides = document.querySelectorAll('#slideshow .slide');
  let i = 0;
  let timer;

  // Optional thumbnail ribbon: auto-built from slide sources
  const ribbon = document.getElementById('thumbRibbon');
  const thumbs = [];
  if (ribbon && slides.length > 0) {
    slides.forEach((slide, idx) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'thumb' + (idx === 0 ? ' active' : '');
      t.style.backgroundImage = `url("${slide.getAttribute('src')}")`;
      t.setAttribute('aria-label', `Show photo ${idx + 1}`);
      t.addEventListener('click', () => { show(idx); restart(); });
      ribbon.appendChild(t);
      thumbs.push(t);
    });
  }

  function centerThumb(idx) {
    if (!ribbon || !thumbs[idx]) return;
    const thumb = thumbs[idx];
    ribbon.scrollTo({
      left: thumb.offsetLeft - ribbon.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: 'smooth'
    });
  }

  function show(next) {
    if (slides.length < 2) return;
    slides[i].classList.remove('active');
    if (thumbs[i]) thumbs[i].classList.remove('active');
    i = (next + slides.length) % slides.length;
    slides[i].classList.add('active');
    if (thumbs[i]) {
      thumbs[i].classList.add('active');
      centerThumb(i);
    }
  }
  function start() { timer = setInterval(() => show(i + 1), 10000); }
  function restart() { clearInterval(timer); start(); }

  const prev = document.getElementById('slidePrev');
  const next = document.getElementById('slideNext');
  if (prev) prev.addEventListener('click', () => { show(i - 1); restart(); });
  if (next) next.addEventListener('click', () => { show(i + 1); restart(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { show(i - 1); restart(); }
    if (e.key === 'ArrowRight') { show(i + 1); restart(); }
  });

  if (slides.length > 1) start();

  // --- Chrome auto-hide ---
  const IDLE_MS = 2500;
  let idleTimer;

  function wake() {
    document.body.classList.remove('chrome-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('chrome-idle'), IDLE_MS);
  }

  document.addEventListener('mousemove', wake);
  document.addEventListener('keydown', wake);
  document.addEventListener('touchstart', wake, { passive: true });

  // Keep chrome visible while the user is interacting with it
  document.querySelectorAll('.navbar, .album-links, .title-pill, .slide-arrow, .thumb-ribbon').forEach(el => {
    el.addEventListener('mouseenter', () => {
      clearTimeout(idleTimer);
      document.body.classList.remove('chrome-idle');
    });
    el.addEventListener('mouseleave', wake);
    el.addEventListener('focusin', () => {
      clearTimeout(idleTimer);
      document.body.classList.remove('chrome-idle');
    });
    el.addEventListener('focusout', wake);
  });

  wake();
})();
