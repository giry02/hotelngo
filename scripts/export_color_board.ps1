Add-Type -AssemblyName System.Drawing

$outputPath = Join-Path (Get-Location) 'assets\brand\n-color-types.png'
$width = 1600
$height = 2360
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#F4F5F5'))

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return New-Object System.Drawing.Font('Malgun Gothic', $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-Text([string]$text, [float]$x, [float]$y, [System.Drawing.Font]$font, [string]$color) {
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($color))
    $graphics.DrawString($text, $font, $brush, $x, $y)
    $brush.Dispose()
}

function Draw-Logo([single]$x, [single]$y, [single]$scale, [pscustomobject]$palette) {
    $wordFont = New-Font (76 * $scale) ([System.Drawing.FontStyle]::Bold)
    $wordBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#181B1A'))
    $graphics.DrawString('Hotel', $wordFont, $wordBrush, $x, $y)

    $hotelWidth = $graphics.MeasureString('Hotel', $wordFont).Width - (10 * $scale)
    $nX = $x + $hotelWidth
    $nY = $y + (25 * $scale)
    $nW = 68 * $scale
    $nH = 58 * $scale

    $nPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    [System.Drawing.PointF[]]$points = @(
        [System.Drawing.PointF]::new([single]$nX, [single]($nY + $nH)),
        [System.Drawing.PointF]::new([single]($nX + 14 * $scale), [single]($nY + $nH)),
        [System.Drawing.PointF]::new([single]($nX + 14 * $scale), [single]($nY + 22 * $scale)),
        [System.Drawing.PointF]::new([single]($nX + 26 * $scale), [single]($nY + 10 * $scale)),
        [System.Drawing.PointF]::new([single]($nX + 39 * $scale), [single]($nY + 10 * $scale)),
        [System.Drawing.PointF]::new([single]($nX + 54 * $scale), [single]($nY + 25 * $scale)),
        [System.Drawing.PointF]::new([single]($nX + 54 * $scale), [single]($nY + $nH)),
        [System.Drawing.PointF]::new([single]($nX + $nW), [single]($nY + $nH)),
        [System.Drawing.PointF]::new([single]($nX + $nW), [single]($nY + 20 * $scale)),
        [System.Drawing.PointF]::new([single]($nX + 47 * $scale), [single]$nY),
        [System.Drawing.PointF]::new([single]($nX + 24 * $scale), [single]$nY),
        [System.Drawing.PointF]::new([single]$nX, [single]($nY + 24 * $scale))
    )
    $nPath.AddPolygon($points)

    if ($palette.Solid) {
        $nBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($palette.Solid))
    } else {
        $nBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            [System.Drawing.PointF]::new([single]$nX, [single]$nY),
            [System.Drawing.PointF]::new([single]($nX + $nW), [single]($nY + $nH)),
            [System.Drawing.ColorTranslator]::FromHtml($palette.Colors[0]),
            [System.Drawing.ColorTranslator]::FromHtml($palette.Colors[$palette.Colors.Count - 1])
        )
        if ($palette.Colors.Count -eq 3) {
            $blend = New-Object System.Drawing.Drawing2D.ColorBlend
            $blend.Colors = @(
                [System.Drawing.ColorTranslator]::FromHtml($palette.Colors[0]),
                [System.Drawing.ColorTranslator]::FromHtml($palette.Colors[1]),
                [System.Drawing.ColorTranslator]::FromHtml($palette.Colors[2])
            )
            $blend.Positions = @(0.0, 0.5, 1.0)
            $nBrush.InterpolationColors = $blend
        }
    }
    $graphics.FillPath($nBrush, $nPath)

    $gX = $nX + $nW - (4 * $scale)
    $graphics.DrawString('g', $wordFont, $wordBrush, $gX, $y)
    $gWidth = $graphics.MeasureString('g', $wordFont).Width

    $pinX = $gX + $gWidth + (2 * $scale)
    $pinY = $y + (14 * $scale)
    $pinPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $pinPath.AddEllipse($pinX, $pinY, 61 * $scale, 61 * $scale)
    [System.Drawing.PointF[]]$pinPoints = @(
        [System.Drawing.PointF]::new([single]($pinX + 8 * $scale), [single]($pinY + 42 * $scale)),
        [System.Drawing.PointF]::new([single]($pinX + 30.5 * $scale), [single]($pinY + 81 * $scale)),
        [System.Drawing.PointF]::new([single]($pinX + 53 * $scale), [single]($pinY + 42 * $scale))
    )
    $pinPath.AddPolygon($pinPoints)
    $pinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#2F6BFF'))
    $graphics.FillPath($pinBrush, $pinPath)
    $holeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillEllipse($holeBrush, $pinX + 19 * $scale, $pinY + 18 * $scale, 23 * $scale, 23 * $scale)

    $wordFont.Dispose()
    $wordBrush.Dispose()
    $nBrush.Dispose()
    $nPath.Dispose()
    $pinPath.Dispose()
    $pinBrush.Dispose()
    $holeBrush.Dispose()
}

$palettes = @(
    [pscustomobject]@{ No='01'; Name='Warm Sunset'; Tag='REFERENCE'; Colors=@('#FFD21A','#FF9B42','#F45B8D'); Solid=$null; Desc='노랑 · 오렌지 · 핑크' },
    [pscustomobject]@{ No='02'; Name='Aqua Violet'; Tag='REFERENCE'; Colors=@('#18D5D0','#36B2E7','#8B45F5'); Solid=$null; Desc='청록 · 스카이블루 · 보라' },
    [pscustomobject]@{ No='03'; Name='Ocean Route'; Tag='SELECTED'; Colors=@('#00C6B7','#1CB3E5','#2F6BFF'); Solid=$null; Desc='공식 선택안 · 청록 · 로열블루' },
    [pscustomobject]@{ No='04'; Name='Lagoon Sky'; Tag=''; Colors=@('#58D9E7','#4F91F5','#6258E8'); Solid=$null; Desc='라군 · 스카이블루 · 바이올렛' },
    [pscustomobject]@{ No='05'; Name='Violet Coral'; Tag=''; Colors=@('#725AF6','#B94BE2','#F05D8E'); Solid=$null; Desc='바이올렛 · 마젠타 · 코럴' },
    [pscustomobject]@{ No='06'; Name='Dusk Indigo'; Tag=''; Colors=@('#8798BB','#6878C5','#4659A9'); Solid=$null; Desc='블루그레이 · 인디고' },
    [pscustomobject]@{ No='07'; Name='Blue Gray'; Tag=''; Colors=@('#7D8FB8'); Solid='#7D8FB8'; Desc='안정적인 브랜드 보조 단색' },
    [pscustomobject]@{ No='08'; Name='Neutral Gray'; Tag=''; Colors=@('#8E9693'); Solid='#8E9693'; Desc='중립적인 그레이 단색' },
    [pscustomobject]@{ No='09'; Name='Teal Indigo'; Tag='REFERENCE'; Colors=@('#16A8BC','#2F73BA','#342F8F'); Solid=$null; Desc='청록 · 블루 · 인디고' }
)

$smallBlue = New-Font 18 ([System.Drawing.FontStyle]::Bold)
$titleFont = New-Font 42 ([System.Drawing.FontStyle]::Bold)
$bodyFont = New-Font 20
$cardNumFont = New-Font 16 ([System.Drawing.FontStyle]::Bold)
$cardTitleFont = New-Font 28 ([System.Drawing.FontStyle]::Bold)
$hexFont = New-Font 16

Draw-Text 'HOTELNGO · N COLOR STUDY' 100 78 $smallBlue '#2F6BFF'
Draw-Text '확대한 n에서 색상만 비교' 100 112 $titleFont '#181B1A'
Draw-Text 'HotelnGo 워드마크의 형태는 고정하고 n 리본 심볼의 색상만 비교한 보드입니다.' 100 176 $bodyFont '#737B79'

$cardW = 690
$cardH = 380
$gapX = 24
$gapY = 24
$startX = 98
$startY = 245

for ($i = 0; $i -lt $palettes.Count; $i++) {
    $palette = $palettes[$i]
    $col = $i % 2
    $row = [Math]::Floor($i / 2)
    $x = $startX + ($col * ($cardW + $gapX))
    $y = $startY + ($row * ($cardH + $gapY))

    $cardPath = New-RoundedPath $x $y $cardW $cardH 22
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillPath($cardBrush, $cardPath)
    $borderColor = if ($palette.Tag -eq 'SELECTED') { '#2F6BFF' } elseif ($palette.Tag -eq 'REFERENCE') { '#ADC1FF' } else { '#E1E4E3' }
    $borderWidth = if ($palette.Tag -eq 'SELECTED') { 4 } else { 2 }
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($borderColor), $borderWidth)
    $graphics.DrawPath($cardPen, $cardPath)

    $tagText = "COLOR $($palette.No)"
    if ($palette.Tag) { $tagText += " · $($palette.Tag)" }
    Draw-Text $tagText ($x + 30) ($y + 25) $cardNumFont '#2F6BFF'
    Draw-Text $palette.Name ($x + 30) ($y + 52) $cardTitleFont '#181B1A'

    $chipX = $x + $cardW - 35
    for ($c = $palette.Colors.Count - 1; $c -ge 0; $c--) {
        $chipBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($palette.Colors[$c]))
        $graphics.FillEllipse($chipBrush, $chipX - 25, $y + 34, 24, 24)
        $chipBrush.Dispose()
        $chipX -= 31
    }

    Draw-Logo ($x + 105) ($y + 120) 0.88 $palette
    Draw-Text $palette.Desc ($x + 30) ($y + 285) $bodyFont '#777F7D'

    $hexes = $palette.Colors -join '   '
    Draw-Text $hexes ($x + 30) ($y + 329) $hexFont '#8B9290'

    $cardPath.Dispose()
    $cardBrush.Dispose()
    $cardPen.Dispose()
}

Draw-Text 'Selected palette: 03 · Ocean Route' 100 2294 $smallBlue '#2F6BFF'

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$smallBlue.Dispose()
$titleFont.Dispose()
$bodyFont.Dispose()
$cardNumFont.Dispose()
$cardTitleFont.Dispose()
$hexFont.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $outputPath
