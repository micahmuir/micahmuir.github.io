#!/usr/bin/env python3
"""
Notion Export to Website Theme Converter
This script processes Notion HTML exports and applies the website theme
"""

import os
import sys
import zipfile
import re
import shutil
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

class NotionConverter:
    def __init__(self):
        self.template_path = Path("f:/Backpack/Vault/Amber Osprey Code/micahmuir.github.io/professional_projects/combiner/combiner.html")
        self.website_root = Path("f:/Backpack/Vault/Amber Osprey Code/micahmuir.github.io")
        
    def select_zip_file(self):
        """Show file dialog to select ZIP file"""
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        
        file_path = filedialog.askopenfilename(
            title="Select Notion Export ZIP File",
            filetypes=[("ZIP files", "*.zip"), ("All files", "*.*")],
            initialdir=os.path.expanduser("~/Desktop")
        )
        
        root.destroy()
        return file_path if file_path else None
    
    def get_template_content(self):
        """Read template content or create a basic one"""
        if self.template_path.exists():
            with open(self.template_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            print("Template file not found. Creating basic template...")
            return '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}} - Micah Muir</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
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
    
    .caption {
      font-size: 0.9rem;
      color: var(--text-medium);
      font-style: italic;
      margin-top: 1rem;
      line-height: 1.4;
    }
    
    /* Project content styling */
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
        <li><a href="/">About</a></li>
        <li><a href="/resume.html">Resume</a></li>
        <li><a href="/projects.html">Projects</a></li>
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
          <a href="/projects.html" class="btn btn-secondary">← Back to Projects</a>
        </div>
      </div>
    </section>
  </main>

  <!-- Main JavaScript -->
  <script src="/assets/js/main.js"></script>
  
  <!-- JavaScript for active navigation -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const navLinks = document.querySelectorAll('.nav-links a');
      navLinks.forEach(link => {
        if (link.getAttribute('href') === '/projects.html') {
          link.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>'''
    
    def extract_notion_content(self, html_content):
        """Extract and clean content from Notion HTML"""
        # Remove Notion-specific elements and extract main content
        html_content = re.sub(r'<!DOCTYPE html[^>]*>', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'<html[^>]*>', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'</html>', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'<head>.*?</head>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'<body[^>]*>', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'</body>', '', html_content, flags=re.IGNORECASE)
        
        # Extract title from h1 or article title
        title_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
        if title_match:
            title = re.sub(r'<[^>]*>', '', title_match.group(1))  # Remove HTML tags from title
        else:
            title = "Project"
        
        # Process images to use proper structure
        def replace_img(match):
            img_tag = match.group(0)
            src_match = re.search(r'src="([^"]*)"', img_tag)
            alt_match = re.search(r'alt="([^"]*)"', img_tag)
            
            src = src_match.group(1) if src_match else ""
            alt = alt_match.group(1) if alt_match else "Gallery Image"
            
            return f'''<div class="image-with-caption">
  <img alt="{alt}" src="{src}"/>
  <div class="caption">{alt}</div>
</div>'''
        
        html_content = re.sub(r'<img([^>]*src="[^"]*"[^>]*)', replace_img, html_content)
        
        # Wrap content sections in proper structure if not already wrapped
        if 'image-grid' not in html_content:
            html_content = re.sub(
                r'(<div class="image-with-caption">.*?</div>)', 
                r'<div class="image-grid two-column">\1</div>', 
                html_content, 
                flags=re.DOTALL
            )
        
        return {
            'title': title.strip(),
            'content': html_content.strip()
        }
    
    def process_notion_html(self, html_file, output_dir, template):
        """Process a single HTML file"""
        print(f"Processing: {html_file}")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        extracted = self.extract_notion_content(html_content)
        
        # Replace template placeholders
        final_content = template.replace('{{TITLE}}', extracted['title'])
        final_content = final_content.replace('{{CONTENT}}', extracted['content'])
        
        # Generate output filename
        base_name = Path(html_file).stem
        output_file = output_dir / f"{base_name}.html"
        
        # Write processed file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(final_content)
        
        print(f"Created: {output_file}")
        return output_file
    
    def run(self):
        """Main execution function"""
        try:
            print("=== Notion Export to Website Theme Converter ===")
            print()
            
            # Select ZIP file
            zip_path = self.select_zip_file()
            if not zip_path:
                print("No file selected. Exiting.")
                return 1
            
            zip_path = Path(zip_path)
            print(f"Selected: {zip_path}")
            
            # Get output directory name from ZIP filename
            output_dir = zip_path.parent / zip_path.stem
            
            # Create output directory
            if output_dir.exists():
                root = tk.Tk()
                root.withdraw()
                response = messagebox.askyesno(
                    "Directory Exists", 
                    f"Directory '{output_dir}' already exists. Overwrite?"
                )
                root.destroy()
                
                if not response:
                    print("Operation cancelled.")
                    return 0
                
                shutil.rmtree(output_dir)
            
            output_dir.mkdir(parents=True, exist_ok=True)
            print(f"Created output directory: {output_dir}")
            
            # Extract ZIP file
            print("Extracting ZIP file...")
            temp_dir = Path.cwd() / f"notion_extract_{os.getpid()}"
            temp_dir.mkdir(exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Get template content
            template = self.get_template_content()
            
            # Process all HTML files
            html_files = list(temp_dir.rglob("*.html"))
            if not html_files:
                print("No HTML files found in the ZIP archive.")
                shutil.rmtree(temp_dir)
                return 1
            
            print(f"Found {len(html_files)} HTML file(s) to process...")
            
            processed_files = []
            for html_file in html_files:
                processed_file = self.process_notion_html(html_file, output_dir, template)
                processed_files.append(processed_file)
            
            # Copy any image files
            image_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'}
            image_files = [f for f in temp_dir.rglob("*") if f.suffix.lower() in image_extensions]
            
            if image_files:
                print(f"Copying {len(image_files)} image file(s)...")
                for image_file in image_files:
                    dest_path = output_dir / image_file.name
                    # Handle duplicate names by adding a number
                    counter = 1
                    while dest_path.exists():
                        stem = image_file.stem
                        suffix = image_file.suffix
                        dest_path = output_dir / f"{stem}_{counter}{suffix}"
                        counter += 1
                    
                    shutil.copy2(image_file, dest_path)
                    print(f"Copied: {image_file.name}")
            
            # Cleanup
            shutil.rmtree(temp_dir)
            
            print()
            print("=== Processing Complete ===")
            print(f"Output directory: {output_dir}")
            print(f"Files processed: {len(processed_files)}")
            print()
            print("You can now copy the folder to:")
            print(f"- Personal projects: {self.website_root}/personal_projects/")
            print(f"- Professional projects: {self.website_root}/professional_projects/")
            
            # Ask if user wants to open the output directory
            root = tk.Tk()
            root.withdraw()
            open_dir = messagebox.askyesno("Complete", "Processing complete! Open output directory?")
            root.destroy()
            
            if open_dir:
                if sys.platform == "win32":
                    os.startfile(output_dir)
                elif sys.platform == "darwin":
                    os.system(f"open '{output_dir}'")
                else:
                    os.system(f"xdg-open '{output_dir}'")
            
            return 0
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return 1

def main():
    """Entry point"""
    converter = NotionConverter()
    return converter.run()

if __name__ == "__main__":
    sys.exit(main())