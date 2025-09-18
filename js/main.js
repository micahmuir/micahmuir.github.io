// GitHub Pages fix: rewrite absolute links to relative if needed
(function() {
	// Only run if not at root (e.g., /username/repo/)
	var path = window.location.pathname;
	var isRoot = (path === '/' || path.match(/^\/[a-zA-Z0-9_-]+\/?$/));
	if (!isRoot) {
		// Fix <a href="/something"> to be relative
		var anchors = document.querySelectorAll('a[href^="/"]');
		anchors.forEach(function(a) {
			var href = a.getAttribute('href');
			if (href.startsWith('/')) {
				a.setAttribute('href', '.' + href);
			}
		});
		// Fix <img src="/something">
		var imgs = document.querySelectorAll('img[src^="/"]');
		imgs.forEach(function(img) {
			var src = img.getAttribute('src');
			if (src.startsWith('/')) {
				img.setAttribute('src', '.' + src);
			}
		});
		// Fix <link href="/something">
		var links = document.querySelectorAll('link[href^="/"]');
		links.forEach(function(link) {
			var lhref = link.getAttribute('href');
			if (lhref.startsWith('/')) {
				link.setAttribute('href', '.' + lhref);
			}
		});
		// Fix <script src="/something">
		var scripts = document.querySelectorAll('script[src^="/"]');
		scripts.forEach(function(script) {
			var ssrc = script.getAttribute('src');
			if (ssrc.startsWith('/')) {
				script.setAttribute('src', '.' + ssrc);
			}
		});
	}
})();
