#!/usr/bin/env python3
"""
HTML Bundle Extractor
A Python script that extracts zipped HTML bundles and organizes them for viewing.
Can be used from Windows Explorer context menu or run independently.
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import webbrowser
import argparse
import re
import urllib.parse
import threading
import time

# For HEIC conversion
try:
    from PIL import Image
    from pillow_heif import register_heif_opener
    register_heif_opener()
    HEIC_SUPPORT = True
    print("HEIC conversion support enabled")
except ImportError:
    HEIC_SUPPORT = False
    print("Warning: HEIC conversion not available. Install pillow-heif for HEIC support: pip install pillow-heif")

class HTMLBundleExtractor:
    def __init__(self, cleanup_zips=True):
        self.supported_extensions = {'.zip', '.7z', '.rar'}
        self.cleanup_zips = cleanup_zips  # Whether to clean up ZIP files after extraction
        self.filename_mapping = {}  # Track original -> cleaned filename mappings
    
    def convert_heic_to_png(self, heic_path, output_path):
        """Convert a HEIC file to PNG format"""
        if not HEIC_SUPPORT:
            print(f"    ⚠ Cannot convert {heic_path.name}: HEIC support not available")
            return False
        
        try:
            # Open and convert HEIC to PNG
            with Image.open(heic_path) as img:
                # Convert to RGB if necessary (HEIC can be in different color modes)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save as PNG
                img.save(output_path, 'PNG', optimize=True)
                print(f"    ✓ Converted: {heic_path.name} -> {output_path.name}")
                return True
                
        except Exception as e:
            print(f"    ✗ Failed to convert {heic_path.name}: {e}")
            return False
    
    def convert_all_heic_files(self, directory):
        """Find and convert all HEIC files in the directory to PNG"""
        directory = Path(directory)
        
        # Find all HEIC files recursively (including different case variations)
        heic_files = []
        for pattern in ['*.heic', '*.HEIC', '*.heif', '*.HEIF']:
            found_files = list(directory.rglob(pattern))
            heic_files.extend(found_files)
            if found_files:
                print(f"    Found {len(found_files)} files with pattern {pattern}")
        
        if not heic_files:
            print("No HEIC/HEIF files found to convert")
            return 0
        
        print(f"Found {len(heic_files)} HEIC file(s) to convert:")
        for heic_file in heic_files:
            print(f"    - {heic_file.relative_to(directory)}")
        
        converted_count = 0
        failed_count = 0
        conversions = []  # Track conversions for link updates
        
        for heic_file in heic_files:
            print(f"Converting: {heic_file.relative_to(directory)}")
            
            # Create PNG filename
            png_file = heic_file.with_suffix('.png')
            
            if self.convert_heic_to_png(heic_file, png_file):
                converted_count += 1
                conversions.append((heic_file, png_file))
                
                # Remove the original HEIC file
                try:
                    heic_file.unlink()
                    print(f"    ✓ Removed original: {heic_file.name}")
                except Exception as e:
                    print(f"    ⚠ Could not remove {heic_file.name}: {e}")
            else:
                failed_count += 1
                print(f"    ✗ Failed to convert: {heic_file.name}")
        
        print(f"Conversion summary: {converted_count} successful, {failed_count} failed")
        
        if converted_count > 0:
            # Update HTML files to reference PNG instead of HEIC
            self.update_heic_references_in_html(directory, conversions)
        
        return converted_count
    
    def update_heic_references_in_html(self, directory, conversions):
        """Update HTML files to reference PNG files instead of HEIC"""
        if not conversions:
            return
        
        # Find all HTML files
        html_files = self.find_html_files(directory)
        
        updated_files = 0
        
        for html_file in html_files:
            try:
                with open(html_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Update references for each conversion
                for heic_file, png_file in conversions:
                    # Get relative paths from HTML file
                    try:
                        heic_rel = os.path.relpath(heic_file, html_file.parent)
                        png_rel = os.path.relpath(png_file, html_file.parent)
                        
                        # Create all possible patterns that might appear in HTML
                        patterns_to_replace = [
                            heic_file.name,  # Just filename
                            heic_rel,        # Relative path
                            heic_rel.replace('\\', '/'),  # Forward slashes
                            urllib.parse.quote(heic_file.name),  # URL encoded filename
                            urllib.parse.quote(heic_rel),  # URL encoded relative path
                            urllib.parse.quote(heic_rel.replace('\\', '/')),  # URL encoded with forward slashes
                        ]
                        
                        # Also try with different extensions (case variations)
                        for ext in ['.heic', '.HEIC', '.heif', '.HEIF']:
                            if heic_file.suffix.lower() == ext.lower():
                                base_name = heic_file.stem
                                patterns_to_replace.extend([
                                    base_name + ext,
                                    urllib.parse.quote(base_name + ext),
                                ])
                        
                        replacements_made = 0
                        for pattern in patterns_to_replace:
                            if pattern in content:
                                # Replace with just the PNG filename (relative to HTML file)
                                content = content.replace(pattern, png_file.name)
                                replacements_made += 1
                        
                        if replacements_made > 0:
                            print(f"    ✓ Updated {replacements_made} references to {heic_file.name} in {html_file.name}")
                                
                    except Exception as e:
                        print(f"    ⚠ Could not update reference to {heic_file.name}: {e}")
                
                # Write back if changed
                if content != original_content:
                    with open(html_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    updated_files += 1
                    
            except Exception as e:
                print(f"    ⚠ Could not update {html_file.name}: {e}")
        
        if updated_files > 0:
            print(f"    ✓ Updated HEIC references in {updated_files} HTML files")
    
    def reprocess_extracted_directory(self, directory_path):
        """Re-process an already extracted directory to fix navigation links"""
        directory_path = Path(directory_path)
        
        if not directory_path.exists():
            print(f"Error: Directory not found: {directory_path}")
            return False
        
        print(f"Re-processing extracted directory: {directory_path}")
        
        # Find HTML files
        html_files = self.find_html_files(directory_path)
        
        if not html_files:
            print("No HTML files found in the directory.")
            return False
        
        print(f"Found {len(html_files)} HTML file(s)")
        
        # Remove any existing index.html created by old extractor
        old_index = directory_path / "index.html"
        if old_index.exists():
            print("Removing old custom index.html...")
            old_index.unlink()
        
        # Find the main HTML file
        # Clean up filenames first
        print("Cleaning up long filenames...")
        cleaned_count = self.clean_and_move_files(directory_path)
        
        # Re-find HTML files after filename cleanup
        if cleaned_count > 0:
            html_files = self.find_html_files(directory_path)
            print(f"Re-discovered {len(html_files)} HTML files after cleanup")
        
        main_html = self.find_main_html_file(html_files, directory_path)
        
        if main_html:
            print(f"Main HTML file identified: {main_html.name}")
            
            # Fix internal navigation links in all HTML files
            print("Fixing internal navigation links...")
            fixed_count = 0
            for html_file in html_files:
                if self.fix_internal_links(html_file, html_files, directory_path):
                    fixed_count += 1
            
            print(f"Fixed links in {fixed_count}/{len(html_files)} HTML files")
        
        print(f"\\nRe-processing complete!")
        print(f"Directory: {directory_path}")
        if main_html:
            print(f"Main file: {main_html.name}")
            print(f"Open {main_html.name} to start navigating the project")
        
        return True
    
    def run(self, archive_path=None, reprocess_dir=None):
        """Main run function"""
        try:
            if reprocess_dir:
                # Re-process existing directory mode
                success = self.reprocess_extracted_directory(reprocess_dir)
                return 0 if success else 1
            elif not archive_path:
                # Interactive mode - select archive
                archive_path = self.select_zip_file()
                if not archive_path:
                    print("No archive selected.")
                    return 1
            
            success = self.process_archive(archive_path)
            return 0 if success else 1
            
        except Exception as e:
            print(f"Error: {e}")
            return 1
        
    def select_zip_file(self):
        """Show drag-and-drop GUI to select ZIP file"""
        return self.show_drag_drop_gui()
    
    def show_drag_drop_gui(self):
        """Create a drag-and-drop interface for file selection"""
        root = tk.Tk()
        root.title("HTML Bundle Extractor")
        root.geometry("500x350")
        root.configure(bg='#f0f0f0')
        
        # Center the window
        root.update_idletasks()
        x = (root.winfo_screenwidth() // 2) - (500 // 2)
        y = (root.winfo_screenheight() // 2) - (350 // 2)
        root.geometry(f"500x350+{x}+{y}")
        
        # Result storage
        self.selected_file = None
        
        # Main frame
        main_frame = tk.Frame(root, bg='#f0f0f0')
        main_frame.pack(fill='both', expand=True, padx=20, pady=20)
        
        # Title
        title_label = tk.Label(
            main_frame, 
            text="HTML Bundle Extractor",
            font=('Arial', 16, 'bold'),
            bg='#f0f0f0',
            fg='#333333'
        )
        title_label.pack(pady=(0, 10))
        
        # Drop area
        self.drop_frame = tk.Frame(
            main_frame,
            bg='#ffffff',
            relief='solid',
            bd=2,
            height=150
        )
        self.drop_frame.pack(fill='both', expand=True, pady=10)
        self.drop_frame.pack_propagate(False)
        
        # Drop area content
        drop_content = tk.Frame(self.drop_frame, bg='#ffffff')
        drop_content.place(relx=0.5, rely=0.5, anchor='center')
        
        # Drop icon (using text for simplicity)
        drop_icon = tk.Label(
            drop_content,
            text="📁",
            font=('Arial', 32),
            bg='#ffffff',
            fg='#666666'
        )
        drop_icon.pack()
        
        self.drop_label = tk.Label(
            drop_content,
            text="Drag & Drop ZIP file here\nor click to browse",
            font=('Arial', 12),
            bg='#ffffff',
            fg='#666666',
            justify='center'
        )
        self.drop_label.pack(pady=(10, 0))
        
        # Status area
        self.status_frame = tk.Frame(main_frame, bg='#f0f0f0')
        self.status_frame.pack(fill='x', pady=(10, 0))
        
        self.status_label = tk.Label(
            self.status_frame,
            text="Ready to process files...",
            font=('Arial', 10),
            bg='#f0f0f0',
            fg='#666666'
        )
        self.status_label.pack()
        
        # Progress bar (initially hidden)
        self.progress = ttk.Progressbar(
            self.status_frame,
            mode='indeterminate',
            length=400
        )
        
        # Buttons frame
        button_frame = tk.Frame(main_frame, bg='#f0f0f0')
        button_frame.pack(fill='x', pady=(20, 0))
        
        # Browse button
        browse_btn = tk.Button(
            button_frame,
            text="Browse Files",
            font=('Arial', 10),
            bg='#4CAF50',
            fg='white',
            activebackground='#45a049',
            activeforeground='white',
            relief='flat',
            padx=20,
            pady=8,
            command=self.browse_file
        )
        browse_btn.pack(side='left')
        
        # Cancel button
        cancel_btn = tk.Button(
            button_frame,
            text="Cancel",
            font=('Arial', 10),
            bg='#f44336',
            fg='white',
            activebackground='#da190b',
            activeforeground='white',
            relief='flat',
            padx=20,
            pady=8,
            command=lambda: self.cancel_selection(root)
        )
        cancel_btn.pack(side='right')
        
        # Bind drag and drop events
        self.setup_drag_drop(root)
        
        # Click to browse
        self.drop_frame.bind("<Button-1>", lambda e: self.browse_file())
        drop_content.bind("<Button-1>", lambda e: self.browse_file())
        drop_icon.bind("<Button-1>", lambda e: self.browse_file())
        self.drop_label.bind("<Button-1>", lambda e: self.browse_file())
        
        # Run the GUI
        root.mainloop()
        
        return self.selected_file
    
    def setup_drag_drop(self, root):
        """Setup basic drag and drop functionality"""
        # This is a simplified version that works without external libraries
        def on_drag_enter(event):
            self.drop_frame.configure(bg='#e8f5e8', bd=3)
            self.drop_label.configure(text="Drop file here!", bg='#e8f5e8', fg='#2e7d32')
        
        def on_drag_leave(event):
            self.drop_frame.configure(bg='#ffffff', bd=2)
            self.drop_label.configure(text="Drag & Drop ZIP file here\nor click to browse", bg='#ffffff', fg='#666666')
        
        # For now, just visual feedback - actual drag/drop would need tkinterdnd2
        root.bind('<Enter>', on_drag_enter)
        root.bind('<Leave>', on_drag_leave)
    
    def browse_file(self):
        """Open file browser"""
        file_path = filedialog.askopenfilename(
            title="Select HTML Bundle ZIP File",
            filetypes=[
                ("ZIP files", "*.zip"),
                ("7-Zip files", "*.7z"),
                ("RAR files", "*.rar"),
                ("All files", "*.*")
            ],
            initialdir=os.path.expanduser("~/Desktop")
        )
        
        if file_path:
            self.process_selected_file(file_path)
    
    def process_selected_file(self, file_path):
        """Process the selected file"""
        self.selected_file = file_path
        filename = os.path.basename(file_path)
        
        # Update UI
        self.drop_label.configure(text=f"Selected: {filename}")
        self.status_label.configure(text="Processing file...", fg='#2e7d32')
        self.progress.pack(pady=(10, 0))
        self.progress.start()
        
        # Process file in background thread
        def process_file():
            try:
                time.sleep(0.5)  # Small delay for UI update
                # Close the GUI and continue with processing
                self.status_label.configure(text="File selected! Processing will begin...", fg='#2e7d32')
                time.sleep(1)
                root = self.drop_label.winfo_toplevel()
                root.quit()
                root.destroy()
            except Exception as e:
                self.status_label.configure(text=f"Error: {str(e)}", fg='#f44336')
                self.progress.stop()
                self.progress.pack_forget()
        
        # Start processing thread
        thread = threading.Thread(target=process_file)
        thread.daemon = True
        thread.start()
    
    def cancel_selection(self, root):
        """Cancel file selection"""
        self.selected_file = None
        root.quit()
        root.destroy()
    
    def clean_filename(self, filename):
        """Clean up Notion export filenames by removing UUIDs and long paths"""
        import re
        
        # Remove common Notion UUID patterns
        # Pattern 1: Remove trailing space + 32-char hex UUID
        cleaned = re.sub(r'\s+[a-f0-9]{32}$', '', filename)
        
        # Pattern 2: Remove UUID in various formats
        cleaned = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '', cleaned)
        cleaned = re.sub(r'[a-f0-9]{32}', '', cleaned)
        
        # Remove common Notion export prefixes/suffixes
        cleaned = re.sub(r'^ExportBlock-[^/]*/', '', cleaned)
        cleaned = re.sub(r'/Private & Shared/', '/', cleaned)
        cleaned = re.sub(r'/Shared/', '/', cleaned)
        
        # Clean up the path components
        path_parts = cleaned.split('/')
        clean_parts = []
        
        for part in path_parts:
            if not part:  # Skip empty parts
                continue
            
            # Remove trailing UUIDs from each path component
            clean_part = re.sub(r'\s+[a-f0-9]{32}$', '', part)
            clean_part = re.sub(r'[a-f0-9]{32}$', '', clean_part)
            clean_part = re.sub(r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}', '', clean_part)
            
            # Remove special characters that cause issues but keep spaces
            clean_part = re.sub(r'[<>:"|?*]', '', clean_part)
            clean_part = re.sub(r'\s+', ' ', clean_part)  # Normalize multiple spaces to single space
            
            # Preserve file extensions for images and other important file types
            # Extract extension before length limiting
            clean_part_path = Path(clean_part)
            extension = clean_part_path.suffix.lower()
            name_without_ext = clean_part_path.stem
            
            # Limit length of filename without extension
            if len(name_without_ext) > 50:
                name_without_ext = name_without_ext[:50]
            
            # Reconstruct with extension
            if extension:
                clean_part = name_without_ext + extension
            else:
                clean_part = name_without_ext
            
            clean_part = clean_part.strip(' .-')
            
            if clean_part:  # Only add non-empty parts
                clean_parts.append(clean_part)
        
        # Reconstruct the path
        result = '/'.join(clean_parts)
        
        # Final cleanup
        result = result.strip('/')
        
        # If we ended up with nothing, use a default
        if not result:
            result = 'untitled'
        
        return result
    
    def clean_and_move_files(self, directory):
        """Clean up filenames in the extracted directory"""
        directory = Path(directory)
        moves_made = []
        
        # Find all files recursively
        all_files = []
        for item in directory.rglob('*'):
            if item.is_file():
                all_files.append(item)
        
        print(f"Cleaning up {len(all_files)} file names...")
        
        # Sort by depth (deepest first) to avoid moving parent directories before children
        all_files.sort(key=lambda x: len(x.parts), reverse=True)
        
        for file_path in all_files:
            try:
                # Get relative path from directory
                rel_path = file_path.relative_to(directory)
                original_path_str = str(rel_path)
                
                # Clean the filename
                cleaned_path_str = self.clean_filename(original_path_str)
                
                # Convert .htm files to .html
                if cleaned_path_str.lower().endswith('.htm'):
                    cleaned_path_str = cleaned_path_str[:-4] + '.html'
                
                if cleaned_path_str != original_path_str:
                    # Create new path
                    new_path = directory / cleaned_path_str
                    
                    # Ensure unique filename if there's a conflict
                    counter = 1
                    base_new_path = new_path
                    while new_path.exists() and new_path != file_path:
                        stem = base_new_path.stem
                        suffix = base_new_path.suffix
                        parent = base_new_path.parent
                        new_path = parent / f"{stem}_{counter}{suffix}"
                        counter += 1
                    
                    # Make sure parent directory exists
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    # Move the file
                    shutil.move(str(file_path), str(new_path))
                    moves_made.append((original_path_str, cleaned_path_str))
                    
                    # Track the mapping for link updates
                    self.filename_mapping[original_path_str] = cleaned_path_str
                    
            except Exception as e:
                print(f"  Warning: Could not clean filename {file_path.name}: {e}")
                continue
        
        # Remove empty directories
        self.remove_empty_directories(directory)
        
        if moves_made:
            print(f"Cleaned {len(moves_made)} filenames:")
            for original, cleaned in moves_made[:5]:  # Show first 5
                print(f"  {original} -> {cleaned}")
            if len(moves_made) > 5:
                print(f"  ... and {len(moves_made) - 5} more files")
        
        return len(moves_made)
    
    def remove_empty_directories(self, directory):
        """Remove empty directories recursively"""
        directory = Path(directory)
        
        # Get all directories, sorted by depth (deepest first)
        all_dirs = [d for d in directory.rglob('*') if d.is_dir()]
        all_dirs.sort(key=lambda x: len(x.parts), reverse=True)
        
        removed_count = 0
        for dir_path in all_dirs:
            try:
                if dir_path.exists() and not any(dir_path.iterdir()):
                    dir_path.rmdir()
                    removed_count += 1
            except (OSError, PermissionError):
                # Directory not empty or permission denied
                continue
        
        if removed_count > 0:
            print(f"Removed {removed_count} empty directories")
        
        return removed_count
    
    def remove_empty_directories(self, directory):
        """Remove empty directories recursively"""
        directory = Path(directory)
        
        # Get all directories, sorted by depth (deepest first)
        all_dirs = [d for d in directory.rglob('*') if d.is_dir()]
        all_dirs.sort(key=lambda x: len(x.parts), reverse=True)
        
        removed_count = 0
        for dir_path in all_dirs:
            try:
                if dir_path.exists() and not any(dir_path.iterdir()):
                    dir_path.rmdir()
                    removed_count += 1
            except (OSError, PermissionError):
                # Directory not empty or permission denied
                continue
        
        if removed_count > 0:
            print(f"Removed {removed_count} empty directories")
        
        return removed_count
    
    def extract_archive(self, archive_path, extract_to, level=0):
        """Extract archive contents recursively"""
        archive_path = Path(archive_path)
        extract_to = Path(extract_to)
        indent = "  " * level
        
        print(f"{indent}Extracting {archive_path.name}...")
        
        if archive_path.suffix.lower() == '.zip':
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                # List contents
                contents = zip_ref.namelist()
                print(f"{indent}Archive contains {len(contents)} items:")
                for item in contents[:5]:  # Show first 5 items
                    print(f"{indent}  - {item}")
                if len(contents) > 5:
                    print(f"{indent}  ... and {len(contents) - 5} more items")
                
                # Extract all
                zip_ref.extractall(extract_to)
                print(f"{indent}Extracted to: {extract_to}")
                
                # Look for nested ZIP files and extract them
                self.extract_nested_archives(extract_to, level + 1)
                
                return True
        else:
            print(f"{indent}Unsupported archive format: {archive_path.suffix}")
            return False
    
    def extract_nested_archives(self, directory, level=0):
        """Recursively extract any ZIP files found in the directory"""
        directory = Path(directory)
        indent = "  " * level
        
        # Find all ZIP files in the current directory and subdirectories
        zip_files = list(directory.rglob("*.zip"))
        
        if zip_files:
            print(f"{indent}Found {len(zip_files)} nested ZIP file(s) to extract:")
            
            for zip_file in zip_files:
                print(f"{indent}Processing nested ZIP: {zip_file.name}")
                
                # Create extraction directory next to the ZIP file
                extract_dir = zip_file.parent / zip_file.stem
                
                # Avoid infinite recursion - don't extract if already extracted
                if extract_dir.exists():
                    print(f"{indent}  Skipping {zip_file.name} - already extracted")
                    continue
                
                try:
                    # Extract the nested ZIP
                    extract_dir.mkdir(exist_ok=True)
                    
                    with zipfile.ZipFile(zip_file, 'r') as nested_zip:
                        nested_contents = nested_zip.namelist()
                        print(f"{indent}  Nested ZIP contains {len(nested_contents)} items")
                        nested_zip.extractall(extract_dir)
                        print(f"{indent}  Extracted nested ZIP to: {extract_dir}")
                    
                    # Recursively check for more nested ZIPs (with depth limit)
                    if level < 5:  # Prevent infinite recursion
                        self.extract_nested_archives(extract_dir, level + 1)
                    
                    # Optionally remove the ZIP file after extraction
                    if self.cleanup_zips:
                        try:
                            zip_file.unlink()
                            print(f"{indent}  Cleaned up: {zip_file.name}")
                        except Exception as cleanup_error:
                            print(f"{indent}  Warning: Could not delete {zip_file.name}: {cleanup_error}")
                    
                except zipfile.BadZipFile:
                    print(f"{indent}  Warning: {zip_file.name} is not a valid ZIP file or is corrupted")
                    continue
                except Exception as e:
                    print(f"{indent}  Error extracting {zip_file.name}: {e}")
                    continue
    
    def cleanup_all_zip_files(self, directory):
        """Remove all ZIP files from the directory tree"""
        directory = Path(directory)
        zip_files = list(directory.rglob("*.zip"))
        
        if zip_files:
            print(f"Cleaning up {len(zip_files)} ZIP file(s) from final directory...")
            for zip_file in zip_files:
                try:
                    zip_file.unlink()
                    print(f"  Removed: {zip_file.relative_to(directory)}")
                except Exception as e:
                    print(f"  Warning: Could not remove {zip_file.name}: {e}")
    
    def show_final_summary(self, directory, html_files):
        """Show summary of final directory contents"""
        directory = Path(directory)
        
        # Count different file types
        all_files = [f for f in directory.rglob("*") if f.is_file() and f.name != "index.html"]
        
        file_types = {}
        for file in all_files:
            ext = file.suffix.lower()
            if ext in file_types:
                file_types[ext] += 1
            else:
                file_types[ext] = 1
        
        print(f"\\nFinal directory contains:")
        print(f"  HTML files: {len(html_files)}")
        for ext, count in sorted(file_types.items()):
            if ext not in ['.html', '.htm']:
                file_type = ext[1:].upper() if ext else "No extension"
                print(f"  {file_type} files: {count}")
        
        # Show directory structure (top level only)
        dirs = [d for d in directory.iterdir() if d.is_dir()]
        if dirs:
            print(f"  Subdirectories: {len(dirs)}")
            for d in sorted(dirs)[:5]:
                file_count = len([f for f in d.rglob("*") if f.is_file()])
                print(f"    - {d.name}/ ({file_count} files)")
            if len(dirs) > 5:
                print(f"    ... and {len(dirs) - 5} more directories")
    
    def find_html_files(self, directory):
        """Find all HTML files in directory"""
        directory = Path(directory)
        html_files = []
        
        # Look for HTML files recursively
        for pattern in ['*.html', '*.htm', '*.HTML', '*.HTM']:
            html_files.extend(directory.rglob(pattern))
        
        return sorted(html_files)
    
    def find_main_html_file(self, html_files, output_dir):
        """Find the main/root HTML file - typically the largest or in the root directory"""
        if not html_files:
            return None
        
        output_dir = Path(output_dir)
        
        # Prefer files in the root directory
        root_files = [f for f in html_files if f.parent == output_dir]
        
        if root_files:
            # Among root files, prefer the largest (usually the main page)
            main_file = max(root_files, key=lambda f: f.stat().st_size)
            return main_file
        
        # If no root files, take the largest overall
        main_file = max(html_files, key=lambda f: f.stat().st_size)
        return main_file
    
    def fix_internal_links(self, html_file, all_html_files, output_dir):
        """Fix internal navigation links in HTML files to work in extracted structure"""
        import urllib.parse
        import re
        
        output_dir = Path(output_dir)
        html_file = Path(html_file)
        
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Create a mapping of Notion UUIDs to actual HTML files
            uuid_to_file = {}
            filename_to_file = {}
            
            for html in all_html_files:
                html_path = Path(html)
                
                # Map filename to file path
                filename_to_file[html_path.name] = html_path
                filename_to_file[html_path.stem] = html_path
                
                # Extract UUID from filename (Notion exports often have UUID suffixes)
                # Pattern: "Title UUID.html" or "Title-UUID.html" 
                uuid_match = re.search(r'([a-f0-9]{32})', html_path.name)
                if uuid_match:
                    uuid = uuid_match.group(1)
                    uuid_to_file[uuid] = html_path
                    
                    # Also try common UUID formats in URLs
                    formatted_uuid = f"{uuid[:8]}-{uuid[8:12]}-{uuid[12:16]}-{uuid[16:20]}-{uuid[20:]}"
                    uuid_to_file[formatted_uuid] = html_path
                    uuid_to_file[formatted_uuid.replace('-', '')] = html_path
            
            # Fix href links
            def fix_link(match):
                full_match = match.group(0)
                href_value = match.group(1)
                
                # Skip external links that aren't Notion, and anchors
                if (href_value.startswith(('mailto:', '#')) or 
                    (href_value.startswith(('http://', 'https://')) and 'notion.so' not in href_value)):
                    return full_match
                
                # Handle Notion URLs
                if 'notion.so' in href_value:
                    # Extract UUID from Notion URL
                    # Common patterns: https://www.notion.so/Title-UUID or https://notion.so/UUID
                    uuid_match = re.search(r'([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', href_value)
                    if uuid_match:
                        uuid = uuid_match.group(1).replace('-', '')
                        if uuid in uuid_to_file:
                            target_file = uuid_to_file[uuid]
                            # Calculate relative path
                            current_dir = html_file.parent
                            try:
                                rel_path = os.path.relpath(target_file, current_dir)
                                rel_path = rel_path.replace(os.sep, '/')
                                return f'href="{rel_path}"'
                            except (ValueError, OSError):
                                return f'href="{target_file.name}"'
                
                # Handle relative or local HTML links
                decoded_href = urllib.parse.unquote(href_value)
                
                # Try to find matching file
                target_file = None
                
                # Direct filename match
                if href_value in filename_to_file:
                    target_file = filename_to_file[href_value]
                elif decoded_href in filename_to_file:
                    target_file = filename_to_file[decoded_href]
                else:
                    # Look for partial matches in filenames
                    href_base = Path(decoded_href).stem
                    for filename, file_path in filename_to_file.items():
                        if (href_base in filename or filename in href_base):
                            target_file = file_path
                            break
                
                if target_file:
                    # Calculate relative path from current file to target
                    current_dir = html_file.parent
                    try:
                        rel_path = os.path.relpath(target_file, current_dir)
                        rel_path = rel_path.replace(os.sep, '/')
                        return f'href="{rel_path}"'
                    except (ValueError, OSError):
                        return f'href="{target_file.name}"'
                
                # Return original if no match found
                return full_match
            
            # Apply the link fixes
            content = re.sub(r'href="([^"]*)"', fix_link, content)
            
            # Only write if content changed
            if content != original_content:
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                return True
            
            return False  # No changes made
            
        except Exception as e:
            print(f"Warning: Could not fix links in {html_file.name}: {e}")
            return False
    
    def create_index_html(self, output_dir, html_files, archive_name):
        """Create an index.html file to navigate all HTML files"""
        output_dir = Path(output_dir)
        index_path = output_dir / "index.html"
        
        # Group files by directory
        file_groups = {}
        for html_file in html_files:
            rel_path = html_file.relative_to(output_dir)
            dir_name = str(rel_path.parent) if rel_path.parent != Path('.') else "Root"
            
            if dir_name not in file_groups:
                file_groups[dir_name] = []
            file_groups[dir_name].append({
                'name': html_file.name,
                'path': str(rel_path).replace('\\', '/'),
                'size': html_file.stat().st_size
            })
        
        # Create index HTML
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{archive_name} - HTML Bundle Index</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        
        .container {{
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        h1 {{
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }}
        
        .stats {{
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(45deg, #3498db, #2980b9);
            border-radius: 10px;
            color: white;
            text-align: center;
        }}
        
        .stat-item {{
            flex: 1;
        }}
        
        .stat-number {{
            font-size: 2em;
            font-weight: bold;
            display: block;
        }}
        
        .section {{
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #3498db;
        }}
        
        .section h2 {{
            color: #2c3e50;
            margin-top: 0;
            font-size: 1.5em;
        }}
        
        .file-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }}
        
        .file-card {{
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }}
        
        .file-card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            border-color: #3498db;
        }}
        
        .file-name {{
            font-weight: bold;
            color: #2c3e50;
            text-decoration: none;
            display: block;
            margin-bottom: 5px;
            font-size: 1.1em;
        }}
        
        .file-name:hover {{
            color: #3498db;
        }}
        
        .file-info {{
            font-size: 0.9em;
            color: #666;
        }}
        
        .file-size {{
            background: #ecf0f1;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            display: inline-block;
            margin-top: 5px;
        }}
        
        .controls {{
            text-align: center;
            margin: 30px 0;
        }}
        
        .btn {{
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            margin: 0 10px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }}
        
        .btn:hover {{
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }}
        
        .footer {{
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 {archive_name}</h1>
        <p style="text-align: center; font-size: 1.2em; color: #666;">HTML Bundle Contents</p>
        
        <div class="stats">
            <div class="stat-item">
                <span class="stat-number">{len(html_files)}</span>
                <span>HTML Files</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{len(file_groups)}</span>
                <span>Directories</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">{sum(f['size'] for group in file_groups.values() for f in group) // 1024}</span>
                <span>KB Total</span>
            </div>
        </div>
        
        <div class="controls">
            <button class="btn" onclick="window.location.reload()">🔄 Refresh</button>
            <button class="btn" onclick="window.close()">❌ Close</button>
        </div>
"""
        
        # Add file sections
        for dir_name, files in file_groups.items():
            html_content += f"""
        <div class="section">
            <h2>📂 {dir_name}</h2>
            <div class="file-grid">
"""
            for file_info in files:
                size_kb = file_info['size'] // 1024
                size_str = f"{size_kb} KB" if size_kb > 0 else f"{file_info['size']} bytes"
                
                html_content += f"""
                <div class="file-card">
                    <a href="{file_info['path']}" class="file-name" target="_blank">
                        📄 {file_info['name']}
                    </a>
                    <div class="file-info">
                        <span class="file-size">{size_str}</span>
                    </div>
                </div>
"""
            html_content += """
            </div>
        </div>
"""
        
        html_content += """
        <div class="footer">
            <p>Generated by HTML Bundle Extractor</p>
            <p>Click on any file name to open it in a new tab</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh if files change
        document.addEventListener('DOMContentLoaded', function() {
            console.log('HTML Bundle Index loaded successfully');
        });
    </script>
</body>
</html>"""
        
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return index_path
    
    def process_archive(self, archive_path):
        """Main processing function"""
        archive_path = Path(archive_path)
        
        if not archive_path.exists():
            print(f"Error: Archive not found: {archive_path}")
            return False
        
        # Create output directory
        output_dir = archive_path.parent / archive_path.stem
        
        # Handle existing directory
        if output_dir.exists():
            response = input(f"Directory '{output_dir}' already exists. Overwrite? (y/N): ")
            if response.lower() != 'y':
                print("Operation cancelled.")
                return False
            shutil.rmtree(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Extract archive (including nested ZIPs)
        if not self.extract_archive(archive_path, output_dir, level=0):
            return False
        
        # Find HTML files (now including those from nested extractions)
        html_files = self.find_html_files(output_dir)
        
        if not html_files:
            print("No HTML files found in the archive.")
            return False
        
        print(f"Found {len(html_files)} HTML file(s):")
        for html_file in html_files[:5]:  # Show first 5
            rel_path = html_file.relative_to(output_dir)
            print(f"  - {rel_path}")
        if len(html_files) > 5:
            print(f"  ... and {len(html_files) - 5} more files")
        
        # Always clean up ZIP files from final directory
        self.cleanup_all_zip_files(output_dir)
        
        # Convert HEIC files to PNG
        print("Converting HEIC files to PNG...")
        converted_count = self.convert_all_heic_files(output_dir)
        if converted_count > 0:
            print(f"Converted {converted_count} HEIC files to PNG format")
        else:
            print("No HEIC files found to convert")
        
        # Find the main HTML file
        # Clean up filenames first
        print("Cleaning up long filenames...")
        cleaned_count = self.clean_and_move_files(output_dir)
        
        # Re-find HTML files after filename cleanup
        if cleaned_count > 0:
            html_files = self.find_html_files(output_dir)
            print(f"Re-discovered {len(html_files)} HTML files after cleanup")
        
        main_html = self.find_main_html_file(html_files, output_dir)
        
        if main_html:
            print(f"Main HTML file identified: {main_html.name}")
            
            # Fix internal navigation links in all HTML files (must do after filename cleanup)
            print("Fixing internal navigation links with cleaned filenames...")
            fixed_count = 0
            for html_file in html_files:
                if self.fix_internal_links(html_file, html_files, output_dir):
                    fixed_count += 1
            
            print(f"Fixed links in {fixed_count}/{len(html_files)} HTML files")
        
        # Show final directory contents summary
        self.show_final_summary(output_dir, html_files)
        
        # Ask to open the main HTML file instead of index
        if len(sys.argv) == 1:  # Interactive mode
            if main_html:
                open_browser = input(f"Open {main_html.name} in browser? (Y/n): ")
                if open_browser.lower() != 'n':
                    webbrowser.open(f"file://{main_html.absolute()}")
            else:
                print("No main HTML file found to open.")
        
        print(f"\\nExtraction complete!")
        print(f"Output directory: {output_dir}")
        if main_html:
            print(f"Main file: {main_html.name}")
            print(f"Open {main_html.name} to start navigating the project")
        
        return True

def main():
    """Entry point with command line argument support"""
    parser = argparse.ArgumentParser(
        description="Extract HTML bundles and create viewable directory structure",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python html_bundle_extractor.py                    # Interactive mode
  python html_bundle_extractor.py archive.zip       # Extract specific file
  python html_bundle_extractor.py --help            # Show this help
        """
    )
    
    parser.add_argument(
        'archive',
        nargs='?',
        help='Path to the archive file to extract'
    )
    
    parser.add_argument(
        '--reprocess', '-r',
        metavar='DIRECTORY',
        help='Re-process an already extracted directory to fix navigation links'
    )
    
    parser.add_argument(
        '--keep-zips', '-k',
        action='store_true',
        help='Keep ZIP files in final directory (default: clean up all ZIPs)'
    )
    
    args = parser.parse_args()
    
    # Default is to cleanup ZIPs unless --keep-zips is specified
    extractor = HTMLBundleExtractor(cleanup_zips=not args.keep_zips)
    
    if args.reprocess:
        # Re-process existing directory mode
        return extractor.run(reprocess_dir=args.reprocess)
    elif args.archive:
        # Command line mode
        return extractor.run(args.archive)
    else:
        # Interactive mode - show drag-and-drop GUI
        print("Starting HTML Bundle Extractor GUI...")
        return extractor.run()

if __name__ == "__main__":
    sys.exit(main())