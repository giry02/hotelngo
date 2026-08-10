param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\assets\brand\exploration-20260801')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$color = @{
  Ink = [System.Drawing.Color]::FromArgb(255, 14, 24, 35)
  Navy = [System.Drawing.Color]::FromArgb(255, 10, 43, 73)
  Blue = [System.Drawing.Color]::FromArgb(255, 42, 102, 246)
  Aqua = [System.Drawing.Color]::FromArgb(255, 0, 190, 194)
  Sky = [System.Drawing.Color]::FromArgb(255, 73, 177, 236)
  White = [System.Drawing.Color]::White
  Sand = [System.Drawing.Color]::FromArgb(255, 245, 233, 209)
  Coral = [System.Drawing.Color]::FromArgb(255, 244, 111, 91)
  Pale = [System.Drawing.Color]::FromArgb(255, 244, 248, 251)
  Line = [System.Drawing.Color]::FromArgb(255, 218, 228, 235)
}

function New-Canvas {
  param([int]$Width = 1400, [int]$Height = 400, [switch]$Opaque)
  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  if ($Opaque) { $graphics.Clear($color.White) } else { $graphics.Clear([System.Drawing.Color]::Transparent) }
  [pscustomobject]@{ Bitmap = $bitmap; Graphics = $graphics }
}

function New-RoundedPath {
  param([single]$X, [single]$Y, [single]$Width, [single]$Height, [single]$Radius)
  $diameter = $Radius * 2
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $path
}

function Draw-TextPath {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [string]$FontFamily,
    [single]$Size,
    [single]$X,
    [single]$Y,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  $family = [System.Drawing.FontFamily]::new($FontFamily)
  $format = [System.Drawing.StringFormat]::GenericTypographic
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddString($Text, $family, [int]$Style, $Size, [System.Drawing.PointF]::new($X, $Y), $format)
  $Graphics.FillPath($Brush, $path)
  $bounds = $path.GetBounds()
  $path.Dispose()
  $family.Dispose()
  $bounds
}

function Draw-TrackedText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [string]$FontFamily,
    [single]$Size,
    [single]$X,
    [single]$Y,
    [single]$Tracking,
    [System.Drawing.Brush]$Brush,
    [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
  )
  $cursor = $X
  foreach ($character in $Text.ToCharArray()) {
    $bounds = Draw-TextPath $Graphics ([string]$character) $FontFamily $Size $cursor $Y $Brush $Style
    $cursor = $bounds.Right + $Tracking
  }
  $cursor
}

function Draw-DoorwayMark {
  param([System.Drawing.Graphics]$Graphics, [single]$X, [single]$Y, [single]$Size)
  $outer = New-RoundedPath $X $Y $Size $Size ($Size * 0.22)
  $gradientRect = [System.Drawing.RectangleF]::new($X, $Y, $Size, $Size)
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new($gradientRect, $color.Navy, $color.Blue, [single]45)
  $Graphics.FillPath($gradient, $outer)
  $doorWidth = $Size * 0.42
  $doorHeight = $Size * 0.58
  $doorX = $X + ($Size - $doorWidth) / 2
  $doorY = $Y + $Size * 0.19
  $door = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $door.AddArc($doorX, $doorY, $doorWidth, $doorWidth, 180, 180)
  $door.AddLine($doorX + $doorWidth, $doorY + $doorWidth / 2, $doorX + $doorWidth, $doorY + $doorHeight)
  $door.AddLine($doorX + $doorWidth, $doorY + $doorHeight, $doorX, $doorY + $doorHeight)
  $door.AddLine($doorX, $doorY + $doorHeight, $doorX, $doorY + $doorWidth / 2)
  $door.CloseFigure()
  $whiteBrush = [System.Drawing.SolidBrush]::new($color.White)
  $Graphics.FillPath($whiteBrush, $door)
  $routePen = [System.Drawing.Pen]::new($color.Aqua, $Size * 0.075)
  $routePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $routePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawBezier($routePen, $X + $Size * 0.13, $Y + $Size * 0.81, $X + $Size * 0.32, $Y + $Size * 0.69, $X + $Size * 0.47, $Y + $Size * 0.87, $X + $Size * 0.67, $Y + $Size * 0.63)
  $Graphics.FillEllipse($whiteBrush, $X + $Size * 0.72, $Y + $Size * 0.42, $Size * 0.055, $Size * 0.055)
  $routePen.Dispose(); $whiteBrush.Dispose(); $door.Dispose(); $gradient.Dispose(); $outer.Dispose()
}

function Draw-CoastalSeal {
  param([System.Drawing.Graphics]$Graphics, [single]$X, [single]$Y, [single]$Size)
  $navyBrush = [System.Drawing.SolidBrush]::new($color.Navy)
  $aquaBrush = [System.Drawing.SolidBrush]::new($color.Aqua)
  $sandBrush = [System.Drawing.SolidBrush]::new($color.Sand)
  $whiteBrush = [System.Drawing.SolidBrush]::new($color.White)
  $Graphics.FillEllipse($navyBrush, $X, $Y, $Size, $Size)
  $Graphics.FillEllipse($sandBrush, $X + $Size * 0.09, $Y + $Size * 0.09, $Size * 0.82, $Size * 0.82)
  $Graphics.FillEllipse($navyBrush, $X + $Size * 0.16, $Y + $Size * 0.16, $Size * 0.68, $Size * 0.68)
  $horizonPen = [System.Drawing.Pen]::new($color.White, $Size * 0.035)
  $horizonPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $horizonPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawLine($horizonPen, $X + $Size * 0.28, $Y + $Size * 0.49, $X + $Size * 0.72, $Y + $Size * 0.49)
  $wavePen = [System.Drawing.Pen]::new($color.Aqua, $Size * 0.08)
  $wavePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $wavePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.DrawBezier($wavePen, $X + $Size * 0.27, $Y + $Size * 0.61, $X + $Size * 0.39, $Y + $Size * 0.47, $X + $Size * 0.56, $Y + $Size * 0.73, $X + $Size * 0.73, $Y + $Size * 0.55)
  $star = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($X + $Size * 0.50, $Y + $Size * 0.27),
    [System.Drawing.PointF]::new($X + $Size * 0.53, $Y + $Size * 0.35),
    [System.Drawing.PointF]::new($X + $Size * 0.61, $Y + $Size * 0.38),
    [System.Drawing.PointF]::new($X + $Size * 0.53, $Y + $Size * 0.41),
    [System.Drawing.PointF]::new($X + $Size * 0.50, $Y + $Size * 0.49),
    [System.Drawing.PointF]::new($X + $Size * 0.47, $Y + $Size * 0.41),
    [System.Drawing.PointF]::new($X + $Size * 0.39, $Y + $Size * 0.38),
    [System.Drawing.PointF]::new($X + $Size * 0.47, $Y + $Size * 0.35)
  )
  $Graphics.FillPolygon($whiteBrush, $star)
  $horizonPen.Dispose(); $wavePen.Dispose(); $navyBrush.Dispose(); $aquaBrush.Dispose(); $sandBrush.Dispose(); $whiteBrush.Dispose()
}

function Draw-OrbitMark {
  param([System.Drawing.Graphics]$Graphics, [single]$X, [single]$Y, [single]$Size)
  $circleBrush = [System.Drawing.SolidBrush]::new($color.Pale)
  $navyBrush = [System.Drawing.SolidBrush]::new($color.Navy)
  $orbitPen = [System.Drawing.Pen]::new($color.Blue, $Size * 0.055)
  $orbitPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $orbitPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $Graphics.FillEllipse($circleBrush, $X + $Size * 0.12, $Y + $Size * 0.12, $Size * 0.76, $Size * 0.76)
  $Graphics.DrawEllipse($orbitPen, $X + $Size * 0.07, $Y + $Size * 0.24, $Size * 0.86, $Size * 0.52)
  [void](Draw-TextPath $Graphics 'HN' 'Century Gothic' ($Size * 0.28) ($X + $Size * 0.27) ($Y + $Size * 0.35) $navyBrush ([System.Drawing.FontStyle]::Bold))
  $aquaBrush = [System.Drawing.SolidBrush]::new($color.Aqua)
  $Graphics.FillEllipse($aquaBrush, $X + $Size * 0.80, $Y + $Size * 0.26, $Size * 0.11, $Size * 0.11)
  $Graphics.FillEllipse($navyBrush, $X + $Size * 0.09, $Y + $Size * 0.63, $Size * 0.07, $Size * 0.07)
  $circleBrush.Dispose(); $navyBrush.Dispose(); $orbitPen.Dispose(); $aquaBrush.Dispose()
}

function Draw-KeyTagMark {
  param([System.Drawing.Graphics]$Graphics, [single]$X, [single]$Y, [single]$Width, [single]$Height)
  $tag = New-RoundedPath $X $Y $Width $Height ($Height * 0.18)
  $gradientRect = [System.Drawing.RectangleF]::new($X, $Y, $Width, $Height)
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new($gradientRect, $color.Aqua, $color.Blue, [single]0)
  $Graphics.FillPath($gradient, $tag)
  $holeBrush = [System.Drawing.SolidBrush]::new($color.White)
  $Graphics.FillEllipse($holeBrush, $X + $Width * 0.08, $Y + $Height * 0.37, $Height * 0.26, $Height * 0.26)
  $arrow = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($X + $Width * 0.68, $Y + $Height * 0.31),
    [System.Drawing.PointF]::new($X + $Width * 0.84, $Y + $Height * 0.50),
    [System.Drawing.PointF]::new($X + $Width * 0.68, $Y + $Height * 0.69),
    [System.Drawing.PointF]::new($X + $Width * 0.68, $Y + $Height * 0.57),
    [System.Drawing.PointF]::new($X + $Width * 0.43, $Y + $Height * 0.57),
    [System.Drawing.PointF]::new($X + $Width * 0.43, $Y + $Height * 0.43),
    [System.Drawing.PointF]::new($X + $Width * 0.68, $Y + $Height * 0.43)
  )
  $Graphics.FillPolygon($holeBrush, $arrow)
  $holeBrush.Dispose(); $gradient.Dispose(); $tag.Dispose()
}

function Draw-ImageContained {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Image]$Image,
    [System.Drawing.RectangleF]$Bounds
  )
  $scale = [Math]::Min($Bounds.Width / $Image.Width, $Bounds.Height / $Image.Height)
  $width = [single]($Image.Width * $scale)
  $height = [single]($Image.Height * $scale)
  $x = [single]($Bounds.X + ($Bounds.Width - $width) / 2)
  $y = [single]($Bounds.Y + ($Bounds.Height - $height) / 2)
  $destination = [System.Drawing.RectangleF]::new($x, $y, $width, $height)
  $Graphics.DrawImage($Image, $destination)
}

function Get-AlphaBounds {
  param([System.Drawing.Bitmap]$Bitmap, [byte]$Threshold = 8)
  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $Bitmap.Height; $y++) {
    for ($x = 0; $x -lt $Bitmap.Width; $x++) {
      if ($Bitmap.GetPixel($x, $y).A -gt $Threshold) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { throw 'The source logo contains no visible pixels.' }
  [System.Drawing.Rectangle]::new($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1))
}

function New-NormalizedPreview {
  param(
    [string]$SourcePath,
    [string]$DestinationPath,
    [int]$Width = 1400,
    [int]$Height = 400,
    [int]$TargetWidth = 1000,
    [int]$TargetHeight = 220
  )
  $source = [System.Drawing.Bitmap]::FromFile($SourcePath)
  $visible = Get-AlphaBounds $source
  $canvas = New-Canvas -Width $Width -Height $Height
  $scale = [Math]::Min($TargetWidth / $visible.Width, $TargetHeight / $visible.Height)
  $drawWidth = [single]($visible.Width * $scale)
  $drawHeight = [single]($visible.Height * $scale)
  $destination = [System.Drawing.RectangleF]::new(
    [single](($Width - $drawWidth) / 2),
    [single](($Height - $drawHeight) / 2),
    $drawWidth,
    $drawHeight
  )
  $sourceRectangle = [System.Drawing.RectangleF]::new($visible.X, $visible.Y, $visible.Width, $visible.Height)
  $canvas.Graphics.DrawImage($source, $destination, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
  $source.Dispose()
  Save-Canvas $canvas $DestinationPath
}

function Save-Canvas {
  param($Canvas, [string]$Path)
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Bitmap.Dispose()
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
Get-ChildItem $OutputDirectory -Filter 'hotelngo-logo-sample-*.png' -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem $OutputDirectory -Filter 'hotelngo-logo-preview-*.png' -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem $OutputDirectory -Filter 'hotelngo-logo-samples-comparison.png' -ErrorAction SilentlyContinue | Remove-Item -Force
$official = (Resolve-Path (Join-Path $PSScriptRoot '..\assets\brand\official\hotelngo-logo-web.png')).Path
Copy-Item -LiteralPath $official -Destination (Join-Path $OutputDirectory 'hotelngo-logo-current-20260801.png') -Force

$inkBrush = [System.Drawing.SolidBrush]::new($color.Ink)
$navyBrush = [System.Drawing.SolidBrush]::new($color.Navy)
$blueBrush = [System.Drawing.SolidBrush]::new($color.Blue)
$aquaBrush = [System.Drawing.SolidBrush]::new($color.Aqua)
$whiteBrush = [System.Drawing.SolidBrush]::new($color.White)
$coralBrush = [System.Drawing.SolidBrush]::new($color.Coral)

# 01 — Pure wordmark. No icon; typography and a restrained route accent carry the brand.
$canvas = New-Canvas
$wordBounds = Draw-TextPath $canvas.Graphics 'HotelnGo' 'Century Gothic' 174 92 85 $navyBrush ([System.Drawing.FontStyle]::Bold)
$accentPen = [System.Drawing.Pen]::new($color.Aqua, 11)
$accentPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$accentPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$canvas.Graphics.DrawLine($accentPen, $wordBounds.Left + 8, $wordBounds.Bottom + 29, $wordBounds.Right - 8, $wordBounds.Bottom + 29)
$canvas.Graphics.FillEllipse($blueBrush, $wordBounds.Right - 20, $wordBounds.Bottom + 17, 24, 24)
$accentPen.Dispose()
Save-Canvas $canvas (Join-Path $OutputDirectory 'hotelngo-logo-sample-01-linear-wordmark.png')

# 02 — Doorway. Hospitality-first app icon plus a clean horizontal wordmark.
$canvas = New-Canvas
Draw-DoorwayMark $canvas.Graphics 72 56 288
[void](Draw-TextPath $canvas.Graphics 'HotelnGo' 'Segoe UI Semibold' 169 410 88 $navyBrush)
[void](Draw-TextPath $canvas.Graphics 'BOOK  STAY  GO' 'Segoe UI Semibold' 30 421 278 $aquaBrush)
Save-Canvas $canvas (Join-Path $OutputDirectory 'hotelngo-logo-sample-02-doorway.png')

# 03 — Coastal seal. Premium travel seal with serif wordmark.
$canvas = New-Canvas
Draw-CoastalSeal $canvas.Graphics 62 48 304
[void](Draw-TextPath $canvas.Graphics 'HotelnGo' 'Georgia' 168 420 69 $navyBrush ([System.Drawing.FontStyle]::Bold))
[void](Draw-TextPath $canvas.Graphics 'STAY  DISCOVER  RETURN' 'Century Gothic' 27 432 277 $coralBrush ([System.Drawing.FontStyle]::Bold))
Save-Canvas $canvas (Join-Path $OutputDirectory 'hotelngo-logo-sample-03-coastal-seal.png')

# 04 — Orbit monogram. Network/platform identity with a compact HN symbol.
$canvas = New-Canvas
Draw-OrbitMark $canvas.Graphics 62 48 304
[void](Draw-TextPath $canvas.Graphics 'hotelngo' 'Arial Rounded MT Bold' 164 412 91 $inkBrush)
[void](Draw-TextPath $canvas.Graphics 'hotel network, connected' 'Segoe UI' 31 424 283 $blueBrush)
Save-Canvas $canvas (Join-Path $OutputDirectory 'hotelngo-logo-sample-04-orbit-monogram.png')

# 05 — Key tag. Bold stacked typography and a directional hospitality tag.
$canvas = New-Canvas
Draw-KeyTagMark $canvas.Graphics 76 93 278 206
[void](Draw-TextPath $canvas.Graphics 'HOTEL' 'Noto Sans KR Black' 96 411 49 $navyBrush ([System.Drawing.FontStyle]::Bold))
[void](Draw-TextPath $canvas.Graphics 'N GO' 'Noto Sans KR Black' 132 405 134 $blueBrush ([System.Drawing.FontStyle]::Bold))
[void](Draw-TextPath $canvas.Graphics 'YOUR NEXT STAY' 'Century Gothic' 28 424 302 $inkBrush ([System.Drawing.FontStyle]::Bold))
Save-Canvas $canvas (Join-Path $OutputDirectory 'hotelngo-logo-sample-05-key-tag.png')

# Normalize visible alpha bounds so every comparison tile has the same logo height.
$previewSources = @((Get-Item (Join-Path $OutputDirectory 'hotelngo-logo-current-20260801.png'))) + @(Get-ChildItem $OutputDirectory -Filter 'hotelngo-logo-sample-*.png' | Sort-Object Name)
for ($index = 0; $index -lt $previewSources.Count; $index++) {
  $previewNumber = ($index + 1).ToString('00')
  New-NormalizedPreview $previewSources[$index].FullName (Join-Path $OutputDirectory "hotelngo-logo-preview-$previewNumber.png")
}

# Comparison board: the approved PNG is inserted directly as option 01.
$board = New-Canvas -Width 1600 -Height 2340 -Opaque
$titleFont = [System.Drawing.Font]::new('Segoe UI Semibold', 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$labelFont = [System.Drawing.Font]::new('Segoe UI Semibold', 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = [System.Drawing.Font]::new('Segoe UI', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$board.Graphics.DrawString('HotelnGo - Original PNG + Five New Directions', $titleFont, $inkBrush, 76, 42)
$names = @(
  @('01  Original PNG', 'Approved current logo / exact source image'),
  @('02  Linear Wordmark', 'Typography-only / minimal / scalable'),
  @('03  Doorway', 'Hospitality-first / app-ready / welcoming'),
  @('04  Coastal Seal', 'Premium / travel editorial / memorable'),
  @('05  Orbit Monogram', 'Platform / network / digital product'),
  @('06  Key Tag', 'Bold / directional / hotel signage')
)
$sampleFiles = @(Get-ChildItem $OutputDirectory -Filter 'hotelngo-logo-preview-*.png' | Sort-Object Name)
for ($index = 0; $index -lt $sampleFiles.Count; $index++) {
  $top = 126 + $index * 365
  $card = New-RoundedPath 52 $top 1496 326 28
  $cardBrush = [System.Drawing.SolidBrush]::new($color.Pale)
  $borderPen = [System.Drawing.Pen]::new($color.Line, 2)
  $board.Graphics.FillPath($cardBrush, $card)
  $board.Graphics.DrawPath($borderPen, $card)
  $sample = [System.Drawing.Image]::FromFile($sampleFiles[$index].FullName)
  Draw-ImageContained $board.Graphics $sample ([System.Drawing.RectangleF]::new(76, [single]($top + 26), 1030, 294))
  $board.Graphics.DrawString($names[$index][0], $labelFont, $inkBrush, 1150, $top + 89)
  $board.Graphics.DrawString($names[$index][1], $subFont, $navyBrush, [System.Drawing.RectangleF]::new(1150, [single]($top + 141), 340, 100))
  $sample.Dispose(); $cardBrush.Dispose(); $borderPen.Dispose(); $card.Dispose()
}
$titleFont.Dispose(); $labelFont.Dispose(); $subFont.Dispose()
Save-Canvas $board (Join-Path $OutputDirectory 'hotelngo-logo-samples-comparison.png')

foreach ($brush in @($inkBrush,$navyBrush,$blueBrush,$aquaBrush,$whiteBrush,$coralBrush)) { $brush.Dispose() }
Get-ChildItem $OutputDirectory -Filter '*.png' | Sort-Object Name | Select-Object Name,Length
