/* Project split view: media stage + thumbnail ribbon.
 *
 * The ribbon is the source of truth. Each .media-thumb button declares its
 * media via data attributes:
 *   data-type="youtube" data-id="VIDEOID"     - YouTube embed
 *   data-type="video"   data-src="clip.mp4"   - uploaded video file
 *   data-type="image"   data-src="photo.png"  - image
 *   data-caption="Shown under the stage"      - optional
 * The first thumb is loaded into the stage on page load (without autoplay);
 * clicking a thumb swaps the stage content (videos autoplay on click).
 * Clicking the stage while it shows an image toggles fullscreen (real
 * Fullscreen API where available, CSS pseudo-fullscreen fallback on iOS).
 */
(function () {
  'use strict';

  function isFullscreen(stage) {
    return document.fullscreenElement === stage ||
      document.webkitFullscreenElement === stage ||
      stage.classList.contains('stage-fullscreen');
  }

  function exitFullscreen(stage) {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    stage.classList.remove('stage-fullscreen');
    document.body.classList.remove('stage-fullscreen-open');
  }

  function enterFullscreen(stage) {
    if (stage.requestFullscreen) {
      stage.requestFullscreen();
    } else if (stage.webkitRequestFullscreen) {
      stage.webkitRequestFullscreen();
    } else {
      stage.classList.add('stage-fullscreen');
      document.body.classList.add('stage-fullscreen-open');
    }
  }

  function showItem(stage, caption, thumbs, thumb, autoplay) {
    thumbs.forEach(function (t) {
      t.classList.toggle('active', t === thumb);
    });

    stage.innerHTML = '';
    stage.classList.toggle('is-image', thumb.dataset.type === 'image');
    if (thumb.dataset.type === 'youtube') {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube.com/embed/' + thumb.dataset.id +
        (autoplay ? '?autoplay=1' : '');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; ' +
        'encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.title = thumb.dataset.caption || 'Project video';
      stage.appendChild(iframe);
    } else if (thumb.dataset.type === 'video') {
      var video = document.createElement('video');
      video.src = thumb.dataset.src;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.autoplay = !!autoplay;
      stage.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = thumb.dataset.src;
      img.alt = thumb.dataset.caption || 'Project media';
      stage.appendChild(img);
    }

    if (caption) {
      caption.textContent = thumb.dataset.caption || '';
    }
  }

  function initRail(rail) {
    var stage = rail.querySelector('.media-stage');
    var caption = rail.querySelector('.media-stage-caption');
    var thumbs = Array.prototype.slice.call(rail.querySelectorAll('.media-thumb'));
    if (!stage || thumbs.length === 0) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        if (isFullscreen(stage)) exitFullscreen(stage);
        showItem(stage, caption, thumbs, thumb, thumb.dataset.type !== 'image');
      });
    });

    // Clicking the stage toggles fullscreen for images only (YouTube and
    // <video> players consume their own clicks with player controls)
    stage.addEventListener('click', function () {
      if (!stage.classList.contains('is-image')) return;
      if (isFullscreen(stage)) {
        exitFullscreen(stage);
      } else {
        enterFullscreen(stage);
      }
    });

    // Escape closes the pseudo-fullscreen fallback (the real Fullscreen
    // API handles Escape natively)
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && stage.classList.contains('stage-fullscreen')) {
        exitFullscreen(stage);
      }
    });

    showItem(stage, caption, thumbs, thumbs[0], false);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.project-media-rail').forEach(initRail);
  });
})();
