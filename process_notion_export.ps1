# Notion Export to Website Theme Converter
# This script processes Notion HTML exports and applies the website theme

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Function to show file dialog
function Select-ZipFile {
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $fileDialog.Title = "Select Notion Export ZIP File"
    $fileDialog.Filter = "ZIP files (*.zip)|*.zip|All files (*.*)|*.*"
    $fileDialog.InitialDirectory = [Environment]::GetFolderPath('Desktop')
    
    if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $fileDialog.FileName
    }
    return $null
}

# Function to read template content
function Get-TemplateContent {
    $templatePath = "f:\Backpack\Vault\Amber Osprey Code\micahmuir.github.io\professional_projects\combiner\combiner.html"
    
    if (Test-Path $templatePath) {
        return Get-Content $templatePath -Raw
    } else {
        Write-Host "Template file not found. Creating basic template..." -ForegroundColor Yellow
        return @"
<!DOCTYPE html>
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
</html>
"@
    }
}

# Function to extract content from Notion HTML
function Extract-NotionContent {
    param([string]$htmlContent)
    
    # Remove Notion-specific elements and extract main content
    $htmlContent = $htmlContent -replace '<!DOCTYPE html[^>]*>', ''
    $htmlContent = $htmlContent -replace '<html[^>]*>', ''
    $htmlContent = $htmlContent -replace '</html>', ''
    $htmlContent = $htmlContent -replace '<head>.*?</head>', '', 'Singleline'
    $htmlContent = $htmlContent -replace '<body[^>]*>', ''
    $htmlContent = $htmlContent -replace '</body>', ''
    
    # Extract title from h1 or article title
    $titleMatch = [regex]::Match($htmlContent, '<h1[^>]*>(.*?)</h1>')
    $title = if ($titleMatch.Success) { $titleMatch.Groups[1].Value } else { "Project" }
    $title = $title -replace '<[^>]*>', '' # Remove HTML tags from title
    
    # Process images to use proper structure
    $htmlContent = [regex]::Replace($htmlContent, '<img([^>]*src="[^"]*"[^>]*)>', {
        param($match)
        $imgTag = $match.Value
        $srcMatch = [regex]::Match($imgTag, 'src="([^"]*)"')
        $altMatch = [regex]::Match($imgTag, 'alt="([^"]*)"')
        
        $src = if ($srcMatch.Success) { $srcMatch.Groups[1].Value } else { "" }
        $alt = if ($altMatch.Success) { $altMatch.Groups[1].Value } else { "Gallery Image" }
        
        return @"
<div class="image-with-caption">
  <img alt="$alt" src="$src"/>
  <div class="caption">$alt</div>
</div>
"@
    })
    
    # Wrap content sections in proper structure
    if ($htmlContent -notmatch '<div class="image-grid') {
        $htmlContent = [regex]::Replace($htmlContent, '(<div class="image-with-caption">.*?</div>)', '<div class="image-grid two-column">$1</div>', 'Singleline')
    }
    
    return @{
        Title = $title
        Content = $htmlContent.Trim()
    }
}

# Function to process HTML files
function Process-NotionHTML {
    param(
        [string]$htmlFile,
        [string]$outputDir,
        [string]$template
    )
    
    Write-Host "Processing: $htmlFile" -ForegroundColor Green
    
    $htmlContent = Get-Content $htmlFile -Raw -Encoding UTF8
    $extracted = Extract-NotionContent $htmlContent
    
    # Replace template placeholders
    $finalContent = $template -replace '{{TITLE}}', $extracted.Title
    $finalContent = $finalContent -replace '{{CONTENT}}', $extracted.Content
    
    # Generate output filename
    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($htmlFile)
    $outputFile = Join-Path $outputDir "$baseName.html"
    
    # Write processed file
    $finalContent | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "Created: $outputFile" -ForegroundColor Cyan
}

# Main script execution
try {
    Write-Host "=== Notion Export to Website Theme Converter ===" -ForegroundColor Magenta
    Write-Host ""
    
    # Select ZIP file
    $zipPath = Select-ZipFile
    if (-not $zipPath) {
        Write-Host "No file selected. Exiting." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Selected: $zipPath" -ForegroundColor Green
    
    # Get output directory name from ZIP filename
    $zipName = [System.IO.Path]::GetFileNameWithoutExtension($zipPath)
    $outputDir = Join-Path ([System.IO.Path]::GetDirectoryName($zipPath)) $zipName
    
    # Create output directory
    if (Test-Path $outputDir) {
        $response = Read-Host "Directory '$outputDir' already exists. Overwrite? (y/N)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Host "Operation cancelled." -ForegroundColor Yellow
            exit 0
        }
        Remove-Item $outputDir -Recurse -Force
    }
    
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "Created output directory: $outputDir" -ForegroundColor Green
    
    # Extract ZIP file
    Write-Host "Extracting ZIP file..." -ForegroundColor Yellow
    $tempDir = Join-Path $env:TEMP "notion_extract_$(Get-Random)"
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $tempDir)
    
    # Get template content
    $template = Get-TemplateContent
    
    # Process all HTML files
    $htmlFiles = Get-ChildItem $tempDir -Filter "*.html" -Recurse
    if ($htmlFiles.Count -eq 0) {
        Write-Host "No HTML files found in the ZIP archive." -ForegroundColor Red
        Remove-Item $tempDir -Recurse -Force
        exit 1
    }
    
    Write-Host "Found $($htmlFiles.Count) HTML file(s) to process..." -ForegroundColor Yellow
    
    foreach ($htmlFile in $htmlFiles) {
        Process-NotionHTML $htmlFile.FullName $outputDir $template
    }
    
    # Copy any image files
    $imageFiles = Get-ChildItem $tempDir -Include @("*.png", "*.jpg", "*.jpeg", "*.gif", "*.svg") -Recurse
    if ($imageFiles.Count -gt 0) {
        Write-Host "Copying $($imageFiles.Count) image file(s)..." -ForegroundColor Yellow
        foreach ($imageFile in $imageFiles) {
            $destPath = Join-Path $outputDir $imageFile.Name
            Copy-Item $imageFile.FullName $destPath
            Write-Host "Copied: $($imageFile.Name)" -ForegroundColor Cyan
        }
    }
    
    # Cleanup
    Remove-Item $tempDir -Recurse -Force
    
    Write-Host ""
    Write-Host "=== Processing Complete ===" -ForegroundColor Magenta
    Write-Host "Output directory: $outputDir" -ForegroundColor Green
    Write-Host "Files processed: $($htmlFiles.Count)" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now copy the '$zipName' folder to:" -ForegroundColor Yellow
    Write-Host "- Personal projects: f:\Backpack\Vault\Amber Osprey Code\micahmuir.github.io\personal_projects\" -ForegroundColor Cyan
    Write-Host "- Professional projects: f:\Backpack\Vault\Amber Osprey Code\micahmuir.github.io\professional_projects\" -ForegroundColor Cyan
    
    # Ask if user wants to open the output directory
    $openDir = Read-Host "Open output directory? (Y/n)"
    if ($openDir -ne 'n' -and $openDir -ne 'N') {
        Start-Process "explorer.exe" -ArgumentList $outputDir
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}