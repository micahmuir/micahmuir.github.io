#!/usr/bin/env python3
"""
Notion export -> portfolio project page converter.

Takes a Notion HTML export (ZIP, extracted folder, or single .html file) and
produces a themed project page for the site while preserving the Notion page's
content and layout (columns, figures, captions). The site stylesheet already
styles Notion's .column-list / .column / figure.image / figcaption markup, so
the Notion body is kept intact and only wrapped in the site chrome.

What it does:
  1. Extracts the ZIP (including nested ZIPs) to a temp folder.
  2. Finds the main page (shallowest, then largest HTML file).
  3. Copies every referenced image/asset into the output folder with the
     Notion UUID stripped from the filename; rewrites src/href to match.
  4. Converts HEIC/HEIF images to PNG (requires pillow-heif).
  5. Replaces YouTube embeds/bookmarks/auto-links with responsive iframes.
  6. Rewrites links between exported subpages; each subpage becomes its own
     themed HTML file alongside the main page.
  7. Writes everything to <site>/personal_projects/<slug>_project/ or
     <site>/professional_projects/<slug>_project/ and prints a ready-to-paste
     card snippet for projects.html.

Usage:
  python notion_to_project.py export.zip --category personal
  python notion_to_project.py "My Page 27f9d96eb8a1....html" -c professional
  python notion_to_project.py export.zip -c personal --name "Cool Robot" --force
  python notion_to_project.py                # GUI: pick file and category
"""

import argparse
import html as html_lib
import os
import re
import shutil
import sys
import tempfile
import urllib.parse
import webbrowser
import zipfile
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent

HEX32 = r'[0-9a-fA-F]{32}'
DASHED_UUID = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
YT_ID = r'(?:youtube\.com/(?:watch\?[^"\'<>\s]*?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})'

try:
    from PIL import Image
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
        HEIC_SUPPORT = True
    except ImportError:
        HEIC_SUPPORT = False
except ImportError:
    Image = None
    HEIC_SUPPORT = False


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - Micah Muir</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/css/style.css">
  <style>
    /* Minimal project-specific styling - rely on main CSS for layout preservation */
    .project-content h2 {
      color: var(--primary-color);
      font-size: 1.5rem;
      margin: 2rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(var(--theme-rgb), 0.4);
    }

    .project-content ul {
      list-style: none;
      padding-left: 0;
      margin: 1rem 0;
    }

    .project-content li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .project-content li::before {
      content: '\\25B8';
      color: var(--theme-color);
      font-weight: bold;
      position: absolute;
      left: 0;
    }
  </style>
</head>
<body class="page-projects">
  <!-- Navigation -->
  <nav class="navbar">
    <div class="nav-container">
      <ul class="nav-links">
        <li><a href="../../index.html">About</a></li>
        <li><a href="../../resume.html">Resume</a></li>
        <li><a href="../../projects.html">Projects</a></li>
      </ul>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="main-content">
    <!-- Project Content -->
    <section class="section">
      <div class="container">
        <div class="paper-panel">
          <div class="project-content">
            {{CONTENT}}
          </div>
        </div>

        <!-- Back to Projects -->
        <div class="text-center mt-3">
          <a href="../../projects.html" class="btn btn-secondary">&larr; Back to Projects</a>
        </div>
      </div>
    </section>
  </main>

  <!-- Main JavaScript -->
  <script src="../../assets/js/main.js"></script>

  <!-- JavaScript for active navigation -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const navLinks = document.querySelectorAll('.nav-links a');
      navLinks.forEach(link => {
        if (link.getAttribute('href') === '../../projects.html') {
          link.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>
"""


def youtube_iframe(video_id):
    return (
        '<div style="position: relative; width: 100%; height: 0; '
        'padding-bottom: 56.25%; margin: 1rem 0;">\n'
        f'  <iframe src="https://www.youtube.com/embed/{video_id}"\n'
        '    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"\n'
        '    frameborder="0"\n'
        '    allow="accelerometer; autoplay; clipboard-write; encrypted-media; '
        'gyroscope; picture-in-picture"\n'
        '    allowfullscreen>\n'
        '  </iframe>\n'
        '</div>'
    )


def clean_component(filename):
    """Strip Notion UUIDs and unsafe characters from a single file name."""
    base, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext == '.htm':
        ext = '.html'
    base = re.sub(rf'\s*(?:{DASHED_UUID}|{HEX32})\s*', ' ', base)
    base = re.sub(r'[<>:"|?*\\/]', '', base)
    base = re.sub(r'\s+', ' ', base).strip(' .-_')
    if len(base) > 60:
        base = base[:60].rstrip(' .-_')
    return (base or 'untitled') + ext


def slugify(title):
    slug = re.sub(r'[^A-Za-z0-9]+', '_', title).strip('_').lower()
    return slug or 'project'


def strip_tags(fragment):
    return html_lib.unescape(re.sub(r'<[^>]+>', '', fragment)).strip()


def extract_title(content, fallback):
    for pattern in (r'<title[^>]*>(.*?)</title>',
                    r'<h1[^>]*class="page-title"[^>]*>(.*?)</h1>',
                    r'<h1[^>]*>(.*?)</h1>'):
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            title = strip_tags(match.group(1))
            if title and len(title) < 120:
                return title
    return fallback


def extract_body(content):
    match = re.search(r'<body[^>]*>(.*)</body>', content, re.IGNORECASE | re.DOTALL)
    body = match.group(1) if match else content
    body = re.sub(r'<script\b.*?</script>', '', body, flags=re.IGNORECASE | re.DOTALL)
    return body.strip()


def embed_youtube(content):
    """Replace Notion YouTube embeds/bookmarks/auto-links with iframe players.

    Only anchors that are clearly standalone video blocks are replaced; a
    YouTube link inside a sentence keeps its original text.
    """
    def href_to_iframe(match):
        block = match.group(0)
        href = re.search(r'href="([^"]*)"', block)
        video = href and re.search(YT_ID, href.group(1))
        return youtube_iframe(video.group(1)) if video else block

    # Notion "embed" blocks: <div class="source"><a href="URL">URL</a></div>
    content = re.sub(r'<div class="source">\s*<a\b[^>]*>.*?</a>\s*</div>',
                     href_to_iframe, content, flags=re.IGNORECASE | re.DOTALL)

    # Notion bookmark cards pointing at YouTube
    content = re.sub(r'<figure[^>]*>\s*<a\b(?=[^>]*\bbookmark\b)[^>]*>.*?</a>\s*</figure>',
                     href_to_iframe, content, flags=re.IGNORECASE | re.DOTALL)

    # Bare auto-links whose visible text is the URL itself
    def autolink(match):
        href, text = match.group(1), strip_tags(match.group(2))
        video = re.search(YT_ID, href)
        if video and (text == href or text.startswith(('http://', 'https://'))):
            return youtube_iframe(video.group(1))
        return match.group(0)

    content = re.sub(r'<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>',
                     autolink, content, flags=re.IGNORECASE | re.DOTALL)
    return content


def tag_wide_images(content):
    """Add the theme's wide-image class to panoramic images (>2000px wide)."""
    def repl(match):
        tag = match.group(0)
        width = re.search(r'width:\s*([\d.]+)px', tag)
        if width and float(width.group(1)) > 2000 and 'wide-image' not in tag:
            if 'class="' in tag:
                tag = tag.replace('class="', 'class="wide-image ', 1)
            else:
                tag = tag.replace('<img', '<img class="wide-image"', 1)
        return tag
    return re.sub(r'<img\b[^>]*>', repl, content)


class NotionConverter:
    def __init__(self, site_root=SITE_ROOT, category='personal', name=None, force=False):
        self.site_root = Path(site_root)
        self.category = category
        self.name_override = name
        self.force = force
        self.out_dir = None
        self.root = None
        self.asset_map = {}     # resolved source Path -> output filename
        self.html_map = {}      # resolved source Path -> output filename
        self.uuid_map = {}      # 32-hex uuid -> resolved source html Path
        self.used_names = set()
        self.warnings = []
        # Called when the output folder already exists and --force wasn't
        # given; GUI mode replaces this with a yes/no dialog.
        self.confirm_overwrite = lambda path: False

    def warn(self, message):
        self.warnings.append(message)
        print(f"  ! {message}")

    # ------------------------------------------------------------- discovery

    @staticmethod
    def extract_zip(zip_path, dest, depth=0):
        with zipfile.ZipFile(zip_path) as archive:
            archive.extractall(dest)
        if depth < 3:
            for nested in list(Path(dest).rglob('*.zip')):
                sub_dir = nested.with_suffix('')
                sub_dir.mkdir(exist_ok=True)
                try:
                    NotionConverter.extract_zip(nested, sub_dir, depth + 1)
                except zipfile.BadZipFile:
                    print(f"  ! Skipping corrupt nested zip: {nested.name}")
                nested.unlink()

    @staticmethod
    def find_html_files(root):
        """All HTML files under root, deduplicated (Windows globbing is
        case-insensitive, so *.html and *.HTML would double-count)."""
        seen, found = set(), []
        for path in sorted(Path(root).rglob('*')):
            if path.is_file() and path.suffix.lower() in ('.html', '.htm'):
                key = str(path).lower()
                if key not in seen:
                    seen.add(key)
                    found.append(path.resolve())
        return found

    @staticmethod
    def choose_main(html_files, root):
        return min(html_files,
                   key=lambda p: (len(p.relative_to(root).parts), -p.stat().st_size))

    # ---------------------------------------------------------------- assets

    def unique_name(self, name):
        base, ext = os.path.splitext(name)
        candidate, counter = name, 2
        while candidate.lower() in self.used_names:
            candidate = f"{base} {counter}{ext}"
            counter += 1
        self.used_names.add(candidate.lower())
        return candidate

    def import_asset(self, source):
        source = source.resolve()
        if source in self.asset_map:
            return self.asset_map[source]

        suffix = source.suffix.lower()
        convert_heic = suffix in ('.heic', '.heif') and HEIC_SUPPORT
        name = clean_component(source.name)
        if convert_heic:
            name = os.path.splitext(name)[0] + '.png'
        elif suffix in ('.heic', '.heif'):
            self.warn(f"{source.name}: browsers cannot display HEIC. "
                      "Install pillow-heif to convert (pip install pillow-heif).")

        name = self.unique_name(name)
        dest = self.out_dir / name
        if convert_heic:
            with Image.open(source) as img:
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                img.save(dest, 'PNG', optimize=True)
        else:
            shutil.copy2(source, dest)

        self.asset_map[source] = name
        return name

    # ----------------------------------------------------------------- links

    def rewrite_refs(self, content, page_dir):
        def repl(match):
            attr, value = match.group(1), match.group(2)
            if not value or value.startswith(('#', 'mailto:', 'data:', 'javascript:', 'tel:')):
                return match.group(0)

            if value.startswith(('http://', 'https://')):
                if 'notion.so' in value:
                    uuid = re.search(rf'{DASHED_UUID}|{HEX32}', value)
                    if uuid:
                        target = self.uuid_map.get(uuid.group(0).replace('-', '').lower())
                        if target in self.html_map:
                            return f'{attr}="{urllib.parse.quote(self.html_map[target])}"'
                return match.group(0)

            decoded = urllib.parse.unquote(value).split('#')[0].split('?')[0]
            if not decoded:
                return match.group(0)
            try:
                target = (page_dir / decoded).resolve()
            except OSError:
                return match.group(0)

            if target in self.html_map:
                return f'{attr}="{urllib.parse.quote(self.html_map[target])}"'
            if target.is_file():
                return f'{attr}="{urllib.parse.quote(self.import_asset(target))}"'
            self.warn(f"Referenced file not found in export: {decoded}")
            return match.group(0)

        return re.sub(r'\b(src|href)="([^"]*)"', repl, content)

    # ------------------------------------------------------------ conversion

    def convert(self, input_path):
        input_path = Path(input_path).resolve()
        temp_dir = None
        try:
            html_files = None
            if input_path.suffix.lower() == '.zip':
                temp_dir = Path(tempfile.mkdtemp(prefix='notion_export_'))
                print(f"Extracting {input_path.name}...")
                self.extract_zip(input_path, temp_dir)
                self.root = temp_dir
            elif input_path.is_dir():
                self.root = input_path
            elif input_path.suffix.lower() in ('.html', '.htm'):
                # A single exported page: the page itself plus subpages inside
                # its sibling asset folder ("Title uuid/").
                self.root = input_path.parent
                html_files = [input_path]
                asset_dir = input_path.with_suffix('')
                if asset_dir.is_dir():
                    html_files += self.find_html_files(asset_dir)
            else:
                raise SystemExit(f"Unsupported input: {input_path}")

            if html_files is None:
                html_files = self.find_html_files(self.root)
            if not html_files:
                raise SystemExit("No HTML files found in the export.")

            main_html = self.choose_main(html_files, self.root)
            main_content = main_html.read_text(encoding='utf-8', errors='replace')
            title = self.name_override or extract_title(
                main_content, clean_component(main_html.name).rsplit('.', 1)[0])
            print(f"Project title: {title}")
            print(f"Pages: {len(html_files)} (main: {main_html.name})")

            self.out_dir = (self.site_root / f"{self.category}_projects"
                            / f"{slugify(title)}_project")
            if self.out_dir.exists():
                if not self.force and not self.confirm_overwrite(self.out_dir):
                    raise SystemExit(
                        f"Output folder already exists: {self.out_dir}\n"
                        "Re-run with --force to replace it.")
                shutil.rmtree(self.out_dir)
            self.out_dir.mkdir(parents=True)

            # Assign output names for every page before rewriting links.
            main_name = self.unique_name(clean_component(title + '.html'))
            self.html_map[main_html] = main_name
            for page in html_files:
                if page == main_html:
                    continue
                self.html_map[page] = self.unique_name(clean_component(page.name))
                uuid = re.search(HEX32, page.name)
                if uuid:
                    self.uuid_map[uuid.group(0).lower()] = page
            uuid = re.search(HEX32, main_html.name)
            if uuid:
                self.uuid_map[uuid.group(0).lower()] = main_html

            for page, out_name in self.html_map.items():
                content = (main_content if page == main_html
                           else page.read_text(encoding='utf-8', errors='replace'))
                page_title = (title if page == main_html
                              else extract_title(content, out_name.rsplit('.', 1)[0]))
                body = extract_body(content)
                body = embed_youtube(body)
                body = self.rewrite_refs(body, page.parent)
                body = tag_wide_images(body)
                themed = (PAGE_TEMPLATE
                          .replace('{{TITLE}}', html_lib.escape(page_title))
                          .replace('{{CONTENT}}', body))
                (self.out_dir / out_name).write_text(themed, encoding='utf-8')
                print(f"  + {out_name}")

            self.print_summary(main_name)
            return self.out_dir / main_name
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)

    def print_summary(self, main_name):
        rel = f"/{self.category}_projects/{self.out_dir.name}/{main_name}"
        main_file = self.out_dir / main_name
        thumb = re.search(r'<img\b[^>]*src="([^"]*)"',
                          main_file.read_text(encoding='utf-8'))
        thumb_url = (f"/{self.category}_projects/{self.out_dir.name}/"
                     f"{urllib.parse.unquote(thumb.group(1))}"
                     if thumb else "/assets/images/333_logo.png")
        title = re.search(r'<title>(.*?) - Micah Muir</title>',
                          main_file.read_text(encoding='utf-8'))

        grid_id = ('personalProjects' if self.category == 'personal'
                   else 'professionalProjects')
        snippet = f'''          <a href="{urllib.parse.quote(rel)}" class="card">
            <div class="card-image" style="background-image: url('{urllib.parse.quote(thumb_url)}');"></div>
            <h3 class="card-title">{title.group(1) if title else 'Project'}</h3>
            <p class="card-description">TODO: one-line description.</p>
          </a>'''
        (self.out_dir / 'card_snippet.txt').write_text(
            f"Paste into the {grid_id} grid in projects.html "
            "(then delete this file):\n\n" + snippet + "\n", encoding='utf-8')

        print(f"\nDone. {len(self.asset_map)} asset(s) copied, "
              f"{len(self.html_map)} page(s) written to:\n  {self.out_dir}")
        if self.warnings:
            print(f"\n{len(self.warnings)} warning(s) - review above.")
        print(f"\nPaste this card into the {grid_id} grid in projects.html"
              " (also saved as card_snippet.txt):\n")
        print(snippet)


# ------------------------------------------------------------------ GUI bits

def pick_file_gui():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    path = filedialog.askopenfilename(
        title="Select Notion export (ZIP or HTML)",
        filetypes=[("Notion exports", "*.zip *.html *.htm"), ("All files", "*.*")],
        initialdir=os.path.expanduser("~/Downloads"))
    root.destroy()
    return path or None


def pick_category_gui():
    import tkinter as tk
    result = {'value': None}
    root = tk.Tk()
    root.title("Project Category")
    root.geometry("360x140")
    root.eval('tk::PlaceWindow . center')
    tk.Label(root, text="Add this project to which portfolio section?",
             font=('Segoe UI', 11)).pack(pady=(20, 12))
    frame = tk.Frame(root)
    frame.pack()

    def choose(value):
        result['value'] = value
        root.destroy()

    tk.Button(frame, text="Personal", width=14, padx=8, pady=6,
              command=lambda: choose('personal')).pack(side='left', padx=8)
    tk.Button(frame, text="Professional", width=14, padx=8, pady=6,
              command=lambda: choose('professional')).pack(side='left', padx=8)
    root.mainloop()
    return result['value']


def main():
    parser = argparse.ArgumentParser(
        description="Convert a Notion HTML export into a themed portfolio project page.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""\
Examples:
  python notion_to_project.py export.zip -c personal
  python notion_to_project.py "Page abc123.html" -c professional --name "Cool Robot"
  python notion_to_project.py            # GUI mode
""")
    parser.add_argument('input', nargs='?',
                        help='Notion export: .zip, extracted folder, or .html file')
    parser.add_argument('--category', '-c', choices=['personal', 'professional'],
                        help='Portfolio section to place the project in')
    parser.add_argument('--name', '-n', help='Override the project title/folder name')
    parser.add_argument('--site-root', default=str(SITE_ROOT),
                        help='Website root (default: folder containing this script)')
    parser.add_argument('--force', '-f', action='store_true',
                        help='Replace the output folder if it already exists')
    parser.add_argument('--open', action='store_true', dest='open_page',
                        help='Open the finished page in a browser')
    args = parser.parse_args()

    interactive = args.input is None
    input_path = args.input or pick_file_gui()
    if not input_path:
        print("No input selected.")
        return 1
    category = args.category or pick_category_gui()
    if not category:
        print("No category selected.")
        return 1

    if not HEIC_SUPPORT:
        print("Note: HEIC conversion unavailable (pip install pillow-heif to enable).")

    converter = NotionConverter(site_root=args.site_root, category=category,
                                name=args.name, force=args.force)
    if interactive:
        def confirm(path):
            import tkinter as tk
            from tkinter import messagebox
            root = tk.Tk()
            root.withdraw()
            answer = messagebox.askyesno(
                "Folder exists", f"Replace existing project folder?\n\n{path}")
            root.destroy()
            return answer
        converter.confirm_overwrite = confirm

    try:
        main_page = converter.convert(input_path)
    except (SystemExit, Exception) as error:
        if interactive:
            import tkinter as tk
            from tkinter import messagebox
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("Notion to Project", str(error))
            root.destroy()
        raise

    if args.open_page or interactive:
        webbrowser.open(main_page.as_uri())
    return 0


if __name__ == "__main__":
    sys.exit(main())
