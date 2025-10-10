import subprocess
import sys
import os
from pathlib import Path

# Paths to your scripts
extractor_script = "html_bundle_extractor.py"
theme_script = "apply_theme.py"

def run_script(script, args=None):
    cmd = [sys.executable, script]
    if args:
        cmd += args
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(f"--- {script} output ---")
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if result.returncode != 0:
        print(f"Error running {script}")
    return result

def find_deepest_html_folder(root_folder):
    html_folders = []
    for dirpath, dirnames, filenames in os.walk(root_folder):
        if any(f.lower().endswith('.html') for f in filenames):
            html_folders.append(Path(dirpath))
    if not html_folders:
        return None
    # Return the deepest folder (longest path)
    return max(html_folders, key=lambda p: len(str(p)))

if __name__ == "__main__":
    zip_path = input("Enter the path to the zipped HTML bundle: ").strip()
    zip_path = Path(zip_path)
    if not zip_path.exists():
        print(f"File not found: {zip_path}")
        sys.exit(1)

    # Run extractor on ZIP file
    result = run_script(extractor_script, [str(zip_path)])

    # Find the extracted folder (same name as ZIP, without .zip)
    extracted_folder = zip_path.with_suffix("")
    if not extracted_folder.exists():
        # Try to find a folder in the same directory
        candidates = [p for p in zip_path.parent.iterdir() if p.is_dir() and zip_path.stem in p.name]
        if candidates:
            extracted_folder = candidates[0]
        else:
            print(f"Could not find extracted folder for: {zip_path}")
            sys.exit(1)

    # Find the deepest folder containing HTML files
    html_folder = find_deepest_html_folder(extracted_folder)
    if not html_folder:
        print(f"No HTML files found in extracted folder: {extracted_folder}")
        sys.exit(1)
    print(f"Found HTML files in: {html_folder}")

    # Run theme applier on the correct folder
    run_script(theme_script, [str(html_folder)])

    print("All done!")