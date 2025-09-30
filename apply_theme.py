#!/usr/bin/env python3
"""
Website Theme Applicator
Applies the website theme to all HTML files in a directory structure.
Perfect for applying your site's styling to extracted HTML bundles.
"""

import os
import sys
import shutil
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox
import re
import argparse

class WebsiteThemeApplicator:
    def __init__(self):
        self.website_root = Path("f:/Backpack/Vault/Amber Osprey Code/micahmuir.github.io")
        # Use a generic template instead of combiner-specific one
        self.template_path = None  # Will use built-in generic template
        
    def select_directory(self):
        """Show dialog to select directory to process"""
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        
        directory = filedialog.askdirectory(
            title="Select Directory with HTML Files to Theme",
            initialdir=os.path.expanduser("~/Desktop")
        )
        
        root.destroy()
        return directory if directory else None
    
    def get_template_content(self):
        """Read template content or create a basic one"""
        if self.template_path and self.template_path.exists():
            with open(self.template_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            print("Using generic template for project pages...")
            return '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - Micah Muir</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../assets/css/style.css">
  <style>
    /* Project-specific image grid styling */
    .image-grid {
      display: grid;
      gap: 2rem;
      margin: 2rem 0;
    }
    
    .image-grid.two-column {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
    
    .image-grid.three-column {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
    
    .image-grid.four-column {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }
    
    /* Responsive grid adjustments */
    @media (max-width: 768px) {
      .image-grid.three-column,
      .image-grid.four-column {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      }
    }
    
    @media (max-width: 480px) {
      .image-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
    
    .image-with-caption {
      text-align: center;
    }
    
    .image-with-caption img {
      width: 100%;
      height: auto;
      border-radius: var(--border-radius-small);
      box-shadow: var(--shadow-medium);
      transition: transform var(--transition-medium);
    }
    
    .image-with-caption img:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-heavy);
    }
    
    /* Video embed styling for gallery compatibility */
    .image-with-caption div[style*="padding-bottom: 56.25%"]:hover {
      transform: scale(1.02);
      box-shadow: var(--shadow-heavy);
    }
    
    .caption {
      font-size: 0.9rem;
      color: var(--text-medium);
      font-style: italic;
      margin-top: 1rem;
      line-height: 1.4;
    }
    
    /* Project content styling */
    .project-content h2 {
      color: var(--secondary-color);
      font-size: 1.5rem;
      margin: 2rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--secondary-color);
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
      content: '▸';
      color: var(--secondary-color);
      font-weight: bold;
      position: absolute;
      left: 0;
    }
  </style>
</head>
<body class="project-detail">
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
    <!-- Header -->
    <section class="hero" style="padding: 4rem 0 2rem;">
      <div class="container">
        <h1>{{TITLE}}</h1>
      </div>
    </section>

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
          <a href="../../projects.html" class="btn btn-secondary">← Back to Projects</a>
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
</html>'''
    
    def copy_and_fix_images(self, html_content, source_dir, target_dir):
        """Copy images from nested directories and return fixed HTML content"""
        import urllib.parse
        
        source_dir = Path(source_dir)
        target_dir = Path(target_dir)
        
        # Find all image references in the HTML
        img_pattern = r'src="([^"]*)"'
        img_matches = re.findall(img_pattern, html_content)
        
        copied_images = []
        unsupported_images = []
        
        for img_src in img_matches:
            if not img_src:
                continue
                
            # URL decode the path
            decoded_src = urllib.parse.unquote(img_src)
            
            # Check if it's an unsupported format
            file_ext = Path(decoded_src).suffix.lower()
            if file_ext in ['.heic', '.heif']:
                print(f"    ⚠ Unsupported image format (browsers can't display): {Path(decoded_src).name}")
                unsupported_images.append((img_src, Path(decoded_src).name))
                continue
            
            # Try to find the actual image file
            potential_paths = [
                source_dir / decoded_src,
                source_dir / Path(decoded_src).name,
            ]
            
            # Also search in nested directories
            for root, dirs, files in os.walk(source_dir):
                root_path = Path(root)
                filename = Path(decoded_src).name
                if filename in files:
                    potential_paths.append(root_path / filename)
            
            # Find the first existing file
            source_file = None
            for path in potential_paths:
                if path.exists():
                    source_file = path
                    break
            
            if source_file:
                # Copy to target directory with just the filename
                filename = source_file.name
                target_file = target_dir / filename
                
                try:
                    shutil.copy2(source_file, target_file)
                    copied_images.append((img_src, filename))
                    print(f"    ✓ Copied image: {filename}")
                except Exception as e:
                    print(f"    ⚠ Failed to copy {filename}: {e}")
            else:
                print(f"    ⚠ Image not found: {decoded_src}")
        
        # Update HTML content with new image paths
        updated_content = html_content
        for old_src, new_filename in copied_images:
            # Use relative path for images in the same directory as the HTML file
            new_src = new_filename if target_dir == source_dir else f'./{new_filename}'
            updated_content = updated_content.replace(f'src="{old_src}"', f'src="{new_src}"')
        
        # Remove or comment out unsupported images
        for old_src, filename in unsupported_images:
            # Replace the entire img tag with a placeholder comment
            img_tag_pattern = f'<img[^>]*src="{re.escape(old_src)}"[^>]*>'
            replacement = f'<!-- UNSUPPORTED IMAGE FORMAT: {filename} (HEIC files not supported by browsers) -->'
            updated_content = re.sub(img_tag_pattern, replacement, updated_content)
            
            # Also remove the figure/link wrapper if it exists
            figure_pattern = f'<figure[^>]*>.*?<a[^>]*href="[^"]*{re.escape(filename)}"[^>]*>.*?</a>.*?</figure>'
            updated_content = re.sub(figure_pattern, replacement, updated_content, flags=re.DOTALL)
        
        return updated_content
    
    def fix_internal_links(self, html_content, subpage_mapping, source_file):
        """Fix internal navigation links to subpages"""
        import urllib.parse
        
        # Find all href attributes that might be internal links
        href_pattern = r'href="([^"]*\.html)"'
        
        def replace_href(match):
            original_href = match.group(1)
            decoded_href = urllib.parse.unquote(original_href)
            
            # Create variations of the href to match against files
            href_variations = [
                decoded_href,
                Path(decoded_href).name,
                # Convert spaces to underscores for matching
                decoded_href.replace(' ', '_'),
                Path(decoded_href).name.replace(' ', '_'),
                # Convert underscores to spaces for matching
                decoded_href.replace('_', ' '),
                Path(decoded_href).name.replace('_', ' ')
            ]
            
            # Try to find this href in our subpage mapping
            source_dir = source_file.parent
            
            # Look for the target file using variations
            target_file = None
            for variation in href_variations:
                for root, dirs, files in os.walk(source_dir):
                    root_path = Path(root)
                    # Try exact match with variation
                    potential_path = root_path / variation
                    if potential_path.exists():
                        target_file = potential_path
                        break
                    
                    # Try just the filename with variation
                    filename = Path(variation).name
                    if filename in files:
                        potential_path = root_path / filename
                        if potential_path.exists():
                            target_file = potential_path
                            break
                
                if target_file:
                    break
            
            if target_file and target_file in subpage_mapping:
                new_filename, _, _ = subpage_mapping[target_file]
                return f'href="{new_filename}"'
            else:
                # Return original if we can't find a mapping
                return match.group(0)
        
        updated_content = re.sub(href_pattern, replace_href, html_content)
        return updated_content
    
    def extract_content_from_html(self, html_content, file_path):
        """Extract title and main content from existing HTML while preserving layout structure"""
        file_path = Path(file_path)
        
        # Try to extract title from various sources
        title = file_path.stem.replace('_', ' ').replace('-', ' ').title()
        
        # Look for title in various places
        title_patterns = [
            r'<title[^>]*>(.*?)</title>',
            r'<h1[^>]*>(.*?)</h1>',
            r'<h2[^>]*>(.*?)</h2>',
            r'class="title"[^>]*>(.*?)</',
            r'class="page-title"[^>]*>(.*?)</'
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, html_content, re.IGNORECASE | re.DOTALL)
            if match:
                extracted_title = re.sub(r'<[^>]*>', '', match.group(1)).strip()
                if extracted_title and len(extracted_title) < 100:
                    title = extracted_title
                    break
        
        # Extract main content - try to find the actual content area
        content = html_content
        
        # Remove DOCTYPE, html, head sections
        content = re.sub(r'<!DOCTYPE[^>]*>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'<html[^>]*>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'</html>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'<head>.*?</head>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<body[^>]*>', '', content, flags=re.IGNORECASE)
        content = re.sub(r'</body>', '', content, flags=re.IGNORECASE)
        
        # Remove script tags
        content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # PRESERVE LAYOUT STRUCTURES - Look for existing column/grid layouts
        has_columns = self.detect_column_layout(content)
        original_layout_preserved = False
        
        if has_columns:
            print("    📐 Detected multi-column layout - preserving structure")
            content = self.preserve_column_layout(content)
            original_layout_preserved = True
        
        # Clean up common wrapper elements (but preserve layout-related ones)
        content = re.sub(r'<div[^>]*class="[^"]*notion[^"]*"[^>]*>', '<div>', content, flags=re.IGNORECASE)
        content = re.sub(r'<div[^>]*class="[^"]*page[^"]*"[^>]*>', '<div>', content, flags=re.IGNORECASE)
        
        # Process images to use proper structure and fix paths
        def replace_img(match):
            img_tag = match.group(0)
            src_match = re.search(r'src="([^"]*)"', img_tag)
            alt_match = re.search(r'alt="([^"]*)"', img_tag)
            
            src = src_match.group(1) if src_match else ""
            alt = alt_match.group(1) if alt_match else ""
            
            # Fix image path - extract just the filename from nested paths
            if src:
                # URL decode the path
                import urllib.parse
                decoded_src = urllib.parse.unquote(src)
                
                # Extract just the filename from nested paths
                filename = Path(decoded_src).name
                
                # Use just the filename as the new src
                src = filename
            
            # Use alt text as caption, but improve it if it's generic
            caption = alt if alt and alt.lower() not in ['image', 'photo', 'picture', 'gallery image'] else ""
            
            return f'''<div class="image-with-caption">
  <img alt="{alt}" src="{src}"/>
  <div class="caption">{caption}</div>
</div>'''
        
        content = re.sub(r'<img[^>]*>', replace_img, content)
        
        # Look for and extract captions from common Notion export patterns
        # Pattern: <p> tags immediately after images (common in Notion)
        def extract_caption_from_following_p(match):
            img_div = match.group(1)
            following_p = match.group(2)
            
            # Clean up the caption text
            caption_text = re.sub(r'<[^>]*>', '', following_p).strip()
            
            # Only use as caption if it's reasonable length and meaningful
            if caption_text and len(caption_text) < 200 and caption_text.lower() not in ['image', 'photo', 'picture']:
                # Replace the caption in the img div
                updated_img_div = re.sub(r'<div class="caption">.*?</div>', f'<div class="caption">{caption_text}</div>', img_div)
                return updated_img_div
            else:
                return img_div
        
        # Look for image divs followed by paragraph tags (captions)
        content = re.sub(
            r'(<div class="image-with-caption">.*?</div>)\s*<p[^>]*>(.*?)</p>',
            extract_caption_from_following_p,
            content,
            flags=re.DOTALL
        )
        
        # Only apply default grid layout if we didn't preserve original layout
        if not original_layout_preserved and content.count('image-with-caption') > 1 and 'image-grid' not in content:
            # Simple approach: wrap consecutive image-with-caption divs in grid
            content = re.sub(
                r'(<div class="image-with-caption">.*?</div>)(\s*<div class="image-with-caption">.*?</div>)+',
                r'<div class="image-grid two-column">\g<0></div>',
                content,
                flags=re.DOTALL
            )
        
        # Process YouTube links and convert to gallery-compatible embeds
        content = self.convert_youtube_links_to_gallery_embeds(content)
        
        return {
            'title': title,
            'content': content.strip()
        }
    
    def detect_column_layout(self, content):
        """Detect if the content has multi-column layout structures"""
        # Look for common column indicators
        column_indicators = [
            r'display:\s*flex',
            r'display:\s*grid',
            r'grid-template-columns',
            r'flex-direction:\s*row',
            r'class="[^"]*col',  # Bootstrap/common column classes
            r'class="[^"]*grid',  # Grid classes
            r'style="[^"]*width:\s*[0-9]+%',  # Percentage widths
            r'style="[^"]*float:\s*(left|right)',  # Floated elements
            r'<td[^>]*>.*?<img',  # Table-based layouts with images
            r'<div[^>]*style="[^"]*display:\s*inline',  # Inline block elements
        ]
        
        for pattern in column_indicators:
            if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                return True
        
        return False
    
    def preserve_column_layout(self, content):
        """Preserve and adapt existing column layouts for the theme"""
        # Convert common column patterns to our theme-compatible structure
        
        # Handle table-based layouts (common in older HTML or Notion exports)
        if re.search(r'<table[^>]*>.*?<img.*?</table>', content, re.DOTALL | re.IGNORECASE):
            content = self.convert_table_layout_to_grid(content)
        
        # Handle flexbox layouts
        if re.search(r'display:\s*flex', content, re.IGNORECASE):
            content = self.convert_flex_layout_to_grid(content)
        
        # Handle percentage-width divs (common for side-by-side layouts)
        if re.search(r'style="[^"]*width:\s*[0-9]+%', content, re.IGNORECASE):
            content = self.convert_percentage_layout_to_grid(content)
        
        # Handle float-based layouts
        if re.search(r'float:\s*(left|right)', content, re.IGNORECASE):
            content = self.convert_float_layout_to_grid(content)
        
        return content
    
    def convert_table_layout_to_grid(self, content):
        """Convert table-based image layouts to CSS grid"""
        def replace_table_with_grid(match):
            table_content = match.group(1)
            
            # Count cells to determine grid columns
            cell_count = len(re.findall(r'<td[^>]*>', table_content, re.IGNORECASE))
            
            # Extract images from table cells
            cells = re.findall(r'<td[^>]*>(.*?)</td>', table_content, re.DOTALL | re.IGNORECASE)
            
            grid_class = "image-grid"
            if cell_count == 2:
                grid_class += " two-column"
            elif cell_count == 3:
                grid_class += " three-column"
            elif cell_count >= 4:
                grid_class += " four-column"
            
            grid_content = f'<div class="{grid_class}">'
            for cell in cells:
                if '<img' in cell:
                    grid_content += f'<div class="image-with-caption">{cell}<div class="caption"></div></div>'
                else:
                    grid_content += f'<div>{cell}</div>'
            grid_content += '</div>'
            
            return grid_content
        
        content = re.sub(
            r'<table[^>]*>(.*?)</table>',
            replace_table_with_grid,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        return content
    
    def convert_flex_layout_to_grid(self, content):
        """Convert flexbox layouts to CSS grid"""
        def replace_flex_container(match):
            flex_content = match.group(1)
            
            # Count direct children to determine columns
            children = re.findall(r'<div[^>]*>.*?</div>', flex_content)
            child_count = len(children)
            
            grid_class = "image-grid"
            if child_count == 2:
                grid_class += " two-column"
            elif child_count == 3:
                grid_class += " three-column"
            elif child_count >= 4:
                grid_class += " four-column"
            
            return f'<div class="{grid_class}">{flex_content}</div>'
        
        content = re.sub(
            r'<div[^>]*style="[^"]*display:\s*flex[^"]*"[^>]*>(.*?)</div>',
            replace_flex_container,
            content,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        return content
    
    def convert_percentage_layout_to_grid(self, content):
        """Convert percentage-width layouts to CSS grid"""
        # Look for consecutive divs with percentage widths
        def replace_percentage_divs(match):
            divs = match.group(0)
            
            # Count divs to determine grid
            div_count = len(re.findall(r'<div[^>]*style="[^"]*width:\s*[0-9]+%', divs))
            
            grid_class = "image-grid"
            if div_count == 2:
                grid_class += " two-column"
            elif div_count == 3:
                grid_class += " three-column"
            elif div_count >= 4:
                grid_class += " four-column"
            
            # Remove width styles and wrap in grid
            cleaned_divs = re.sub(r'width:\s*[0-9]+%;?\s*', '', divs)
            return f'<div class="{grid_class}">{cleaned_divs}</div>'
        
        content = re.sub(
            r'(<div[^>]*style="[^"]*width:\s*[0-9]+%[^"]*"[^>]*>.*?</div>\s*){2,}',
            replace_percentage_divs,
            content,
            flags=re.DOTALL
        )
        
        return content
    
    def convert_float_layout_to_grid(self, content):
        """Convert float-based layouts to CSS grid"""
        # Remove float styles and detect consecutive floated elements
        def replace_floated_elements(match):
            elements = match.group(0)
            
            # Count floated elements
            float_count = len(re.findall(r'float:\s*(left|right)', elements))
            
            grid_class = "image-grid"
            if float_count == 2:
                grid_class += " two-column"
            elif float_count == 3:
                grid_class += " three-column"
            elif float_count >= 4:
                grid_class += " four-column"
            
            # Remove float styles
            cleaned_elements = re.sub(r'float:\s*(left|right);?\s*', '', elements)
            return f'<div class="{grid_class}">{cleaned_elements}</div>'
        
        content = re.sub(
            r'(<[^>]*style="[^"]*float:\s*(left|right)[^"]*"[^>]*>.*?</[^>]*>\s*){2,}',
            replace_floated_elements,
            content,
            flags=re.DOTALL
        )
        
        return content
        
        return {
            'title': title,
            'content': content.strip()
        }
    
    def convert_youtube_links_to_gallery_embeds(self, content):
        """Convert YouTube links to embedded gallery items"""
        import re
        
        print("    🎥 Processing YouTube links...")
        
        # Skip processing if content already has YouTube iframes (from HTML bundle extractor)
        if 'youtube.com/embed/' in content and '<iframe' in content:
            print("    ℹ️  Content already has embedded YouTube iframes, skipping conversion")
            return content
        
        # YouTube URL patterns to match (excluding embed URLs to avoid double-processing)
        youtube_patterns = [
            r'https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
            r'https?://(?:www\.)?youtube\.com/watch\?.*?v=([a-zA-Z0-9_-]{11})',
            r'https?://youtu\.be/([a-zA-Z0-9_-]{11})',
            r'https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
        ]
        
        youtube_embeds = []
        total_matches = 0
        
        # Process each YouTube pattern
        for pattern in youtube_patterns:
            matches = list(re.finditer(pattern, content))
            total_matches += len(matches)
            
            for match in matches:
                video_id = match.group(1)
                full_url = match.group(0)
                print(f"    📹 Found YouTube video: {full_url} (ID: {video_id})")
                
                # Try to extract title from nearby text
                # Look for text in the same paragraph or nearby elements
                url_start = match.start()
                url_end = match.end()
                
                # Get surrounding context to find potential title
                context_start = max(0, url_start - 200)
                context_end = min(len(content), url_end + 200)
                context = content[context_start:context_end]
                
                # Look for potential titles in various patterns
                title = self.extract_youtube_title_from_context(context, full_url)
                if not title:
                    title = f"YouTube Video {video_id}"
                
                # Create gallery-compatible embed
                embed_html = f'''<div class="image-with-caption">
  <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; border-radius: var(--border-radius-small); overflow: hidden; box-shadow: var(--shadow-medium); transition: transform var(--transition-medium);">
    <iframe 
        src="https://www.youtube.com/embed/{video_id}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
    </iframe>
  </div>
  <div class="caption">{title}</div>
</div>'''
                
                youtube_embeds.append((full_url, embed_html))
        
        # Replace YouTube URLs with embeds
        for url, embed in youtube_embeds:
            # Handle URLs inside <a> tags - be more specific about the replacement
            link_pattern = rf'<a[^>]*href="{re.escape(url)}"[^>]*>[^<]*{re.escape(url)}[^<]*</a>'
            link_matches = re.findall(link_pattern, content, re.DOTALL | re.IGNORECASE)
            
            if link_matches:
                # Replace the entire <a> tag
                content = re.sub(link_pattern, embed, content, flags=re.DOTALL | re.IGNORECASE)
                print(f"    🔗 Replaced YouTube link in <a> tag: {url}")
            else:
                # Replace plain URL
                if url in content:
                    content = content.replace(url, embed)
                    print(f"    📝 Replaced plain YouTube URL: {url}")
        
        # Also handle YouTube URLs in href attributes and complex structures
        def replace_youtube_href(match):
            full_match = match.group(0)
            href_value = match.group(1)
            
            # Check if this is a YouTube URL (excluding embed URLs to avoid conflicts)
            for pattern in [
                r'https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
                r'https?://(?:www\.)?youtube\.com/watch\?.*?v=([a-zA-Z0-9_-]{11})',
                r'https?://youtu\.be/([a-zA-Z0-9_-]{11})',
                r'https?://(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
            ]:
                video_match = re.search(pattern, href_value)
                if video_match:
                    video_id = video_match.group(1)                    # Try to get link text as title
                    link_text_match = re.search(r'<a[^>]*>([^<]*)</a>', full_match)
                    title = "YouTube Video"
                    if link_text_match:
                        link_text = link_text_match.group(1).strip()
                        if link_text and link_text != href_value:
                            title = link_text
                    
                    # Create gallery-compatible embed
                    embed_html = f'''<div class="image-with-caption">
  <div style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; border-radius: var(--border-radius-small); overflow: hidden; box-shadow: var(--shadow-medium); transition: transform var(--transition-medium);">
    <iframe 
        src="https://www.youtube.com/embed/{video_id}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
    </iframe>
  </div>
  <div class="caption">{title}</div>
</div>'''
                    return embed_html
            
            return full_match
        
        # Replace YouTube links in href attributes
        original_content_before_href = content
        content = re.sub(r'<a[^>]*href="([^"]*youtube[^"]*)"[^>]*>.*?</a>', replace_youtube_href, content, flags=re.DOTALL | re.IGNORECASE)
        
        if content != original_content_before_href:
            print(f"    ✅ Replaced YouTube links in href attributes")
        
        total_embeds = len(youtube_embeds) + (1 if content != original_content_before_href else 0)
        if total_embeds > 0:
            print(f"    ✅ Converted {total_embeds} YouTube links to gallery embeds")
        elif total_matches > 0:
            print(f"    ⚠️  Found {total_matches} YouTube URLs but couldn't convert them")
        else:
            print(f"    ℹ️  No YouTube links found")
        
        return content
    
    def extract_youtube_title_from_context(self, context, url):
        """Extract potential title for YouTube video from surrounding context"""
        import re
        
        # Look for text patterns that could be titles
        # Common patterns: text before the URL, in same paragraph, or in headers
        
        # Split context by the URL to get before/after
        parts = context.split(url)
        if len(parts) >= 2:
            before_url = parts[0]
            
            # Look for text in headers near the URL
            header_match = re.search(r'<h[1-6][^>]*>([^<]+)</h[1-6]>', before_url, re.IGNORECASE)
            if header_match:
                title = header_match.group(1).strip()
                if len(title) < 100:
                    return title
            
            # Look for text in same paragraph
            para_match = re.search(r'<p[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</p>$', before_url, re.IGNORECASE)
            if para_match:
                title = re.sub(r'<[^>]*>', '', para_match.group(1)).strip()
                if title and len(title) < 100 and not title.startswith('http'):
                    return title
            
            # Look for text immediately before URL (same line)
            text_before = before_url.split('\n')[-1] if '\n' in before_url else before_url
            text_before = re.sub(r'<[^>]*>', '', text_before).strip()
            if text_before and len(text_before) < 100 and not text_before.startswith('http'):
                # Remove common prefixes
                text_before = re.sub(r'^(video:|watch:|link:|see:)\s*', '', text_before, flags=re.IGNORECASE)
                if text_before:
                    return text_before
        
        return None

    def process_html_file(self, html_file, template, backup_dir=None):
        """Process a single HTML file and apply the theme"""
        html_file = Path(html_file)
        
        print(f"Processing: {html_file.relative_to(html_file.parents[1]) if len(html_file.parents) > 1 else html_file.name}")
        
        # Create backup if requested
        if backup_dir:
            backup_file = backup_dir / html_file.name
            shutil.copy2(html_file, backup_file)
        
        try:
            # Read original file
            with open(html_file, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Copy images and fix paths
            source_dir = html_file.parent
            updated_content = self.copy_and_fix_images(original_content, source_dir, source_dir)
            
            # Extract content from the updated HTML
            extracted = self.extract_content_from_html(updated_content, html_file)
            
            # Apply template
            themed_content = template.replace('{{TITLE}}', extracted['title'])
            themed_content = themed_content.replace('{{CONTENT}}', extracted['content'])
            
            # Write themed file
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(themed_content)
            
            print(f"  ✓ Applied theme to: {extracted['title']}")
            return True
            
        except Exception as e:
            print(f"  ✗ Error processing {html_file.name}: {e}")
            return False
    
    def process_html_file_with_subpages(self, html_file, template, subpage_mapping, backup_dir=None):
        """Process a single HTML file with subpage link support"""
        html_file = Path(html_file)
        
        print(f"Processing: {html_file.relative_to(html_file.parents[1]) if len(html_file.parents) > 1 else html_file.name}")
        
        # Create backup if requested
        if backup_dir:
            # Ensure backup preserves directory structure for subpages
            if html_file.parent != backup_dir.parent:
                # This is a subpage - create nested backup structure
                rel_path = html_file.relative_to(backup_dir.parent)
                backup_file = backup_dir / rel_path
                backup_file.parent.mkdir(parents=True, exist_ok=True)
            else:
                backup_file = backup_dir / html_file.name
            shutil.copy2(html_file, backup_file)
        
        try:
            # Read original file
            with open(html_file, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Determine target directory and filename
            if html_file in subpage_mapping:
                target_filename, clean_name, _ = subpage_mapping[html_file]
                target_dir = html_file.parents[len([p for p in html_file.parents if 'ExportBlock' in p.name or 'Private' in p.name or 'Shared' in p.name])]
            else:
                target_filename = html_file.name
                target_dir = html_file.parent
            
            # Copy images and fix image paths
            updated_content = self.copy_and_fix_images(original_content, html_file.parent, target_dir)
            
            # Fix internal navigation links
            updated_content = self.fix_internal_links(updated_content, subpage_mapping, html_file)
            
            # Extract content from the updated HTML
            extracted = self.extract_content_from_html(updated_content, html_file)
            
            # Apply template
            themed_content = template.replace('{{TITLE}}', extracted['title'])
            themed_content = themed_content.replace('{{CONTENT}}', extracted['content'])
            
            # Write themed file to target location
            target_file = target_dir / target_filename
            with open(target_file, 'w', encoding='utf-8') as f:
                f.write(themed_content)
            
            # If this was a subpage that got moved, remove the original
            if target_file != html_file and html_file.exists():
                html_file.unlink()
            
            print(f"  ✓ Applied theme to: {extracted['title']} -> {target_filename}")
            return True
            
        except Exception as e:
            print(f"  ✗ Error processing {html_file.name}: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def create_clean_dirname(self, title):
        """Create a clean directory name from project title"""
        # Remove common suffixes and clean up
        clean_title = title.replace(' - Micah Muir', '').strip()
        
        # Remove special chars but keep spaces, normalize case
        clean_name = re.sub(r'[^\w\s-]', '', clean_title)
        clean_name = re.sub(r'\s+', ' ', clean_name)  # Normalize multiple spaces to single space
        
        # Remove leading/trailing spaces
        clean_name = clean_name.strip()
        
        return clean_name if clean_name else 'untitled project'
    
    def find_html_files(self, directory):
        """Find all HTML files in directory, including subpages"""
        directory = Path(directory)
        html_files = []
        
        # Look for HTML files recursively
        for pattern in ['*.html', '*.htm']:
            html_files.extend(directory.rglob(pattern))
        
        # Filter out index files (we don't want to theme navigation pages)
        html_files = [f for f in html_files if f.name.lower() not in ['index.html', 'index.htm']]
        
        return sorted(html_files)
    
    def create_subpage_mapping(self, html_files, project_dir):
        """Create a mapping of original subpage paths to new clean paths"""
        import urllib.parse
        
        mapping = {}
        project_dir = Path(project_dir)
        
        for html_file in html_files:
            # Extract a clean name from the original filename
            original_name = html_file.stem
            
            # Remove Notion UUID suffixes and clean up
            clean_name = re.sub(r'\s+[a-f0-9]{32}$', '', original_name)
            clean_name = re.sub(r'[^\w\s-]', '', clean_name)
            clean_name = re.sub(r'\s+', ' ', clean_name)  # Normalize multiple spaces to single space
            clean_name = clean_name.strip()
            
            if not clean_name:
                clean_name = 'subpage'
            
            # Ensure unique names
            counter = 1
            original_clean_name = clean_name
            while any(existing_clean == clean_name for _, existing_clean, _ in mapping.values()):
                clean_name = f"{original_clean_name} {counter}"  # Use spaces for numbering too
                counter += 1
            
            # Create the mapping: original_relative_path -> (new_filename, clean_name, html_file)
            mapping[html_file] = (f"{clean_name}.html", clean_name, html_file)
        
        return mapping
    
    def organize_project_files(self, source_dir, target_base_dir):
        """Organize themed files into properly named project directories"""
        source_dir = Path(source_dir)
        target_base_dir = Path(target_base_dir)
        
        html_files = self.find_html_files(source_dir)
        projects_created = []
        
        for html_file in html_files:
            # Read the file to extract the project title
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            extracted = self.extract_content_from_html(content, html_file)
            project_title = extracted['title']
            clean_dir_name = self.create_clean_dirname(project_title)
            
            # Create project directory
            project_dir = target_base_dir / clean_dir_name
            project_dir.mkdir(exist_ok=True)
            
            # Copy images and fix paths first
            source_parent = html_file.parent
            updated_content = self.copy_and_fix_images(content, source_parent, project_dir)
            
            # Copy HTML file with project name and updated content
            target_html = project_dir / f"{clean_dir_name}.html"
            with open(target_html, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            
            # Copy any other assets (CSS, JS, etc.)
            for asset_file in source_parent.iterdir():
                if asset_file.suffix.lower() in ['.css', '.js'] and asset_file.is_file():
                    shutil.copy2(asset_file, project_dir / asset_file.name)
            
            projects_created.append((project_title, project_dir))
            print(f"  ✓ Created project: {project_title} -> {project_dir}")
        
        return projects_created
    
    def create_backup_dir(self, target_dir):
        """Create backup directory for original files"""
        target_dir = Path(target_dir)
        backup_dir = target_dir / "_original_backups"
        
        if backup_dir.exists():
            response = input(f"Backup directory exists. Overwrite existing backups? (y/N): ")
            if response.lower() != 'y':
                return None
            shutil.rmtree(backup_dir)
        
        backup_dir.mkdir(exist_ok=True)
        return backup_dir
    
    def create_project_structure(self, directory_path, project_name=None):
        """Create a proper project directory structure"""
        directory_path = Path(directory_path)
        
        if not project_name:
            project_name = directory_path.name
        
        # Create project directory structure
        project_dir = directory_path.parent / f"{project_name}_project"
        
        # Handle existing project directory
        if project_dir.exists():
            response = input(f"Project directory '{project_dir}' already exists. Overwrite? (y/N): ")
            if response.lower() != 'y':
                return None
            shutil.rmtree(project_dir)
        
        project_dir.mkdir(exist_ok=True)
        print(f"Created project directory: {project_dir}")
        
        return project_dir
    
    def create_main_project_file(self, html_files, project_dir, template):
        """Create the main project HTML file that combines all content"""
        project_dir = Path(project_dir)
        main_file = project_dir / f"{project_dir.name.replace('_project', '')}.html"
        
        # First, create individual subpage files with proper linking
        subpage_mapping = self.create_subpage_mapping(html_files, project_dir)
        
        # Create individual themed subpages
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Copy images and fix paths
                source_dir = html_file.parent
                updated_content = self.copy_and_fix_images(content, source_dir, project_dir)
                
                # Fix internal links to point to other subpages
                updated_content = self.fix_internal_links(updated_content, subpage_mapping, html_file)
                
                extracted = self.extract_content_from_html(updated_content, html_file)
                
                # Create subpage file
                if html_file in subpage_mapping:
                    subpage_filename, clean_name, _ = subpage_mapping[html_file]
                    subpage_file = project_dir / subpage_filename
                    
                    # Apply template to subpage
                    subpage_content = template.replace('{{TITLE}}', extracted['title'])
                    subpage_content = subpage_content.replace('{{CONTENT}}', extracted['content'])
                    
                    with open(subpage_file, 'w', encoding='utf-8') as f:
                        f.write(subpage_content)
                    
                    print(f"    ✓ Created subpage: {extracted['title']} -> {subpage_filename}")
                    
            except Exception as e:
                print(f"  Warning: Could not process {html_file.name}: {e}")
                continue
        
        # Determine project title
        project_title = project_dir.name.replace('_project', '').replace('_', ' ').replace('-', ' ').title()
        
        # Now create the main file that combines all content (original behavior)
        all_content = []
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Copy images and fix paths BEFORE extracting content
                source_dir = html_file.parent
                updated_content = self.copy_and_fix_images(content, source_dir, project_dir)
                
                extracted = self.extract_content_from_html(updated_content, html_file)
                
                # Add section header for each file (unless it's the main file)
                file_title = extracted['title']
                if file_title.lower() != project_title.lower():
                    all_content.append(f"<h2>{file_title}</h2>")
                
                all_content.append(extracted['content'])
                all_content.append("<hr style='margin: 3rem 0; border: none; border-top: 1px solid var(--border-color);'>")
                
            except Exception as e:
                print(f"  Warning: Could not process {html_file.name}: {e}")
                continue
        
        # Remove the last HR
        if all_content and all_content[-1].startswith("<hr"):
            all_content.pop()
        
        # Combine all content
        combined_content = "\n\n".join(all_content)
        
        # Apply template
        themed_content = template.replace('{{TITLE}}', project_title)
        themed_content = themed_content.replace('{{CONTENT}}', combined_content)
        
        # Write main project file
        with open(main_file, 'w', encoding='utf-8') as f:
            f.write(themed_content)
        
        print(f"Created main project file: {main_file}")
        return main_file
    
    def process_files_for_project_structure(self, html_files, project_dir, template):
        """Process HTML files individually for project structure, keeping the main Notion page as base"""
        project_dir = Path(project_dir)
        
        # Create subpage mapping for internal links
        subpage_mapping = self.create_subpage_mapping(html_files, project_dir)
        
        # Find the main/index file (usually the largest or first one)
        main_file = None
        main_html_file = None
        
        # Look for an obvious main file first
        for html_file in html_files:
            if any(keyword in html_file.stem.lower() for keyword in ['index', 'main', 'overview', 'introduction']):
                main_html_file = html_file
                break
        
        # If no obvious main file, use the first/largest file
        if not main_html_file:
            main_html_file = html_files[0] if html_files else None
        
        if not main_html_file:
            print("No HTML files found to process")
            return None
        
        # Process all files
        processed_count = 0
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    original_content = f.read()
                
                # Copy images and fix paths
                source_dir = html_file.parent
                updated_content = self.copy_and_fix_images(original_content, source_dir, project_dir)
                
                # Fix internal links between subpages
                updated_content = self.fix_internal_links(updated_content, subpage_mapping, html_file)
                
                # Extract content and apply theme
                extracted = self.extract_content_from_html(updated_content, html_file)
                
                # Apply template
                themed_content = template.replace('{{TITLE}}', extracted['title'])
                themed_content = themed_content.replace('{{CONTENT}}', extracted['content'])
                
                # Determine output filename
                if html_file in subpage_mapping:
                    output_filename, clean_name, _ = subpage_mapping[html_file]
                else:
                    output_filename = html_file.name
                
                # Write the themed file
                output_file = project_dir / output_filename
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(themed_content)
                
                # Track the main file
                if html_file == main_html_file:
                    main_file = output_file
                
                print(f"  ✓ Processed: {extracted['title']} -> {output_filename}")
                processed_count += 1
                
            except Exception as e:
                print(f"  ✗ Error processing {html_file.name}: {e}")
                continue
        
        print(f"Successfully processed {processed_count} HTML file(s)")
        
        # Return the main file path
        return main_file if main_file else project_dir / f"{project_dir.name.replace('_project', '')}.html"
    
    def copy_assets(self, source_dir, project_dir):
        """Copy all non-HTML assets to the project directory"""
        source_dir = Path(source_dir)
        project_dir = Path(project_dir)
        
        # Asset extensions to copy
        asset_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.pdf', '.doc', '.docx'}
        
        copied_count = 0
        
        for file_path in source_dir.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in asset_extensions:
                # Create relative path structure in project directory
                rel_path = file_path.relative_to(source_dir)
                dest_path = project_dir / rel_path
                
                # Create destination directory if needed
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy file
                shutil.copy2(file_path, dest_path)
                copied_count += 1
        
        if copied_count > 0:
            print(f"Copied {copied_count} asset file(s) to project directory")
        
        return copied_count
    
    def process_directory(self, directory_path, create_backups=True, create_project_structure=True):
        """Main processing function for a directory"""
        directory_path = Path(directory_path)
        
        if not directory_path.exists():
            print(f"Error: Directory not found: {directory_path}")
            return False
        
        print(f"Scanning directory: {directory_path}")
        
        # Find HTML files
        html_files = self.find_html_files(directory_path)
        
        if not html_files:
            print("No HTML files found to process.")
            return False
        
        print(f"Found {len(html_files)} HTML file(s) to process")
        
        # Get template
        template = self.get_template_content()
        
        if create_project_structure:
            # Create project directory structure
            project_dir = self.create_project_structure(directory_path)
            if not project_dir:
                return False
            
            # Process individual HTML files and create subpages
            main_file = self.process_files_for_project_structure(html_files, project_dir, template)
            
            # Copy assets
            self.copy_assets(directory_path, project_dir)
            
            print(f"\\nProject structure created!")
            print(f"Project directory: {project_dir}")
            print(f"Main project file: {main_file}")
            print(f"\\nYou can now copy '{project_dir.name}' folder to:")
            print(f"- Personal projects: {self.website_root}/personal_projects/")
            print(f"- Professional projects: {self.website_root}/professional_projects/")
            
            return True
            
        else:
            # Enhanced behavior - process files in place with subpage support
            # Create backup directory
            backup_dir = None
            if create_backups:
                backup_dir = self.create_backup_dir(directory_path)
                if backup_dir:
                    print(f"Backups will be saved to: {backup_dir}")
            
            # Create subpage mapping for internal links
            subpage_mapping = self.create_subpage_mapping(html_files, directory_path)
            
            # Process all files
            processed_count = 0
            failed_count = 0
            
            for html_file in html_files:
                if self.process_html_file_with_subpages(html_file, template, subpage_mapping, backup_dir):
                    processed_count += 1
                else:
                    failed_count += 1
            
            print(f"\\nProcessing complete!")
            print(f"Successfully processed: {processed_count} files")
            if failed_count > 0:
                print(f"Failed to process: {failed_count} files")
            
            if backup_dir and processed_count > 0:
                print(f"Original files backed up to: {backup_dir}")
            
            return True
    
    def run(self, directory_path=None, create_backups=True, create_project_structure=True):
        """Main run function"""
        try:
            if not directory_path:
                # Interactive mode - select directory
                directory_path = self.select_directory()
                if not directory_path:
                    print("No directory selected.")
                    return 1
            
            success = self.process_directory(directory_path, create_backups, create_project_structure)
            return 0 if success else 1
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return 1

def main():
    """Entry point with command line argument support"""
    parser = argparse.ArgumentParser(
        description="Apply website theme to all HTML files in a directory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python apply_theme.py                           # Interactive mode - creates project structure
  python apply_theme.py /path/to/html/directory   # Create project structure from directory
  python apply_theme.py --in-place /path/dir     # Process files in-place (original behavior)
  python apply_theme.py --no-backup --in-place   # In-place without backups
        """
    )
    
    parser.add_argument(
        'directory',
        nargs='?',
        help='Path to the directory containing HTML files to theme'
    )
    
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Do not create backup copies of original files (only for in-place mode)'
    )
    
    parser.add_argument(
        '--in-place',
        action='store_true',
        help='Process files in-place instead of creating a project structure'
    )
    
    args = parser.parse_args()
    
    applicator = WebsiteThemeApplicator()
    
    if args.directory:
        # Command line mode
        return applicator.run(
            args.directory, 
            create_backups=not args.no_backup,
            create_project_structure=not args.in_place
        )
    else:
        # Interactive mode
        print("Website Theme Applicator")
        print("========================")
        print("This tool applies your website theme and creates a project directory")
        print("that you can drop into your personal_projects or professional_projects folder.")
        print()
        return applicator.run(
            create_backups=not args.no_backup,
            create_project_structure=not args.in_place
        )

if __name__ == "__main__":
    sys.exit(main())