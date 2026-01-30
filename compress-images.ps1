# Image Compression Script for Survival Game
# Compresses large environment images to ~200-300KB each

Add-Type -AssemblyName System.Drawing

$sourceDir = "public\images\environments"
$targetWidth = 1200
$quality = 85

# File mapping: current name -> desired name
$files = @{
    "Coastline.jpeg" = "coast.jpg"
    "Mountain.JPG" = "mountains.jpg"
    "desert.JPG" = "desert.jpg"
    "forest.JPG" = "forest.jpg"
    "Tundra.JPG" = "tundra.jpg"
    "urban-edge.jpg" = "urban-edge.jpg"
}

function Compress-Image {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$maxWidth
    )

    Write-Host "Processing: $sourcePath"

    # Load the original image
    $img = [System.Drawing.Image]::FromFile($sourcePath)

    # Calculate new dimensions maintaining aspect ratio
    $ratio = $img.Height / $img.Width
    $newWidth = [Math]::Min($maxWidth, $img.Width)
    $newHeight = [int]($newWidth * $ratio)

    Write-Host "  Original: $($img.Width)x$($img.Height) ($('{0:N2}' -f ((Get-Item $sourcePath).Length / 1MB)) MB)"
    Write-Host "  Resizing to: ${newWidth}x${newHeight}"

    # Create new bitmap
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($newImg)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)

    # Save with compression
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality,
        [long]$quality
    )

    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq 'image/jpeg' }

    $newImg.Save($destPath, $jpegCodec, $encoderParams)

    # Cleanup
    $graphics.Dispose()
    $newImg.Dispose()
    $img.Dispose()

    $newSize = (Get-Item $destPath).Length / 1KB
    Write-Host "  Saved: $destPath ($('{0:N0}' -f $newSize) KB)" -ForegroundColor Green
    Write-Host ""
}

Write-Host "=== Environment Image Compression ===" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files.GetEnumerator()) {
    $sourcePath = Join-Path $sourceDir $file.Key
    $destPath = Join-Path $sourceDir $file.Value

    if (Test-Path $sourcePath) {
        try {
            # If source and dest are different, create temp file first
            if ($file.Key -ne $file.Value) {
                $tempPath = Join-Path $sourceDir "temp_$($file.Value)"
                Compress-Image -sourcePath $sourcePath -destPath $tempPath -maxWidth $targetWidth

                # Remove original and rename temp
                Remove-Item $sourcePath -Force
                Move-Item $tempPath $destPath -Force
            } else {
                # Same name, compress in place using temp
                $tempPath = Join-Path $sourceDir "temp_$($file.Value)"
                Compress-Image -sourcePath $sourcePath -destPath $tempPath -maxWidth $targetWidth
                Remove-Item $sourcePath -Force
                Move-Item $tempPath $destPath -Force
            }
        } catch {
            Write-Host "  Error: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "Skipping: $($file.Key) (not found)" -ForegroundColor Yellow
    }
}

Write-Host "=== Compression Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Final file sizes:"
Get-ChildItem $sourceDir -Filter "*.jpg" | ForEach-Object {
    $sizeKB = $_.Length / 1KB
    Write-Host "  $($_.Name): $('{0:N0}' -f $sizeKB) KB"
}
