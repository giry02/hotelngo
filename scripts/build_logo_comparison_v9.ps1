param(
  [string]$ProjectRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$VisualizationPath = 'C:\Users\Giry\.codex\visualizations\2026\07\27\019fa347-28a8-7d33-8bf0-c76d150a8b25\hotelngo-logo-directions-v14.html'
)

$ErrorActionPreference = 'Stop'
$assetDirectory = Join-Path $ProjectRoot 'assets\brand\exploration-20260801'

function Get-PngDataUri([string]$Name) {
  $path = Join-Path $assetDirectory $Name
  'data:image/png;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($path))
}

$doorway = Get-PngDataUri 'hotelngo-logo-preview-03.png'
$coastal = Get-PngDataUri 'hotelngo-logo-preview-04.png'
$keyTag = Get-PngDataUri 'hotelngo-logo-preview-06.png'

$fragment = @'
<div id="hotelngo-logo-directions-v14">
  <div class="logo-list" role="group" aria-label="HotelnGo logo candidates with equal visible height">
    <button type="button" class="btn logo-option">
      <span class="logo-stage">
        <svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Ocean Route 03 logo">
          <defs>
            <linearGradient id="v9-ocean-route" gradientUnits="userSpaceOnUse" x1="144" y1="45" x2="180" y2="45"><stop offset="0" stop-color="#00C6B7"/><stop offset=".48" stop-color="#1CB3E5"/><stop offset="1" stop-color="#2F6BFF"/></linearGradient>
          </defs>
          <g transform="translate(322.1 96.33) scale(2.278481)">
            <g transform="translate(-.65)">
              <text class="ocean-word" x="7.3" y="59" font-size="56"><tspan>Hote</tspan><tspan>l</tspan></text>
              <g transform="translate(20.587327 0) translate(144 59) scale(1.32) translate(-144 -59)">
                <path d="M147.51 31.89 149.62 32.24 151.55 34.54 151.73 46.77 152.08 48.01 154.19 50.49 158.40 51.38 161.21 50.14 162.79 47.48 163.14 44.11 164.90 42.16 167.71 41.81 169.99 43.41 170.52 46.06 169.64 50.67 168.06 53.51 165.07 56.52 161.21 58.47 157 59 152.43 58.11 149.97 56.87 147.16 54.39 144.35 48.72 144 35.43 145.23 32.77Z" fill="url(#v9-ocean-route)"/>
                <path d="M164.72 31 168.76 31 172.45 32.06 175.61 34.19 178.77 38.44 180 43.05 180 55.81 179.47 57.23 177.89 58.65 174.56 58.65 172.62 56.52 172.45 43.05 171.04 40.22 169.64 39.15 165.42 38.62 162.61 40.22 161.21 42.87 160.86 45.89 158.93 47.84 155.59 47.84 153.48 45.18 154.01 40.22 156.47 35.61 160.16 32.59Z" fill="url(#v9-ocean-route)"/>
              </g>
              <text class="ocean-word" x="216.439463" y="59" font-size="56">g</text>
              <g transform="translate(43.729955)"><path d="M247 6c-20.5 0-35 13.7-35 33.5 0 16.5 11.3 28.7 35 45.5 23.7-16.8 35-29 35-45.5C282 19.7 267.5 6 247 6Z" fill="#2F6BFF"/><circle cx="247" cy="38.5" r="14" fill="#FFFFFF"/><path d="m239 39 17-8-6.2 17.6-4.5-7Z" transform="translate(-1.8 -.5)" fill="#2F6BFF"/></g>
            </g>
          </g>
        </svg>
      </span>
      <span class="option-copy"><span class="option-title">01 &middot; Ocean Route 03</span><span class="text-small text-muted">&#44592;&#51456; &#47196;&#44256; &middot; &#47196;&#52992;&#51060;&#49496; &#47336;&#53944;</span></span>
    </button>

    <button type="button" class="btn logo-option">
      <span class="logo-stage">
        <svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Doorline logo">
          <defs><linearGradient id="v9-doorline" x1="16" y1="96" x2="96" y2="16" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00C6B7"/><stop offset=".5" stop-color="#1CB3E5"/><stop offset="1" stop-color="#2F6BFF"/></linearGradient></defs>
          <g transform="translate(163.46 103.08) scale(1.730769)">
            <rect x="4" y="4" width="104" height="104" rx="27" fill="#101E33"/><path d="M32 86V43c0-15.5 10.5-27 24-27s24 11.5 24 27v43" fill="none" stroke="url(#v9-doorline)" stroke-width="12" stroke-linecap="round"/><path d="M56 36v50l30-10V46L56 36Z" fill="url(#v9-doorline)"/><circle cx="72" cy="61" r="4" fill="#FFFFFF"/><path d="M88 86h13" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/><text class="new-word" x="132" y="84" font-size="82">HotelnGo</text>
          </g>
        </svg>
      </span>
      <span class="option-copy"><span class="option-title">02 &middot; Doorline</span><span class="text-small text-muted">&#50724;&#54536; &#46020;&#50612; &middot; &#54872;&#45824;</span></span>
    </button>

    <button type="button" class="btn logo-option">
      <span class="logo-stage"><svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Doorway logo"><image href="__DOORWAY__" x="127.2727" y="36.3636" width="1145.4545" height="327.2727"/></svg></span>
      <span class="option-copy"><span class="option-title">03 &middot; Doorway</span><span class="text-small text-muted">&#54840;&#53588; &#44221;&#54744; &middot; &#50545; &#50500;&#51060;&#53080;</span></span>
    </button>

    <button type="button" class="btn logo-option">
      <span class="logo-stage"><svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Coastal Seal logo"><image href="__COASTAL__" x="127.2727" y="36.3636" width="1145.4545" height="327.2727"/></svg></span>
      <span class="option-copy"><span class="option-title">04 &middot; Coastal Seal</span><span class="text-small text-muted">&#54532;&#47532;&#48120;&#50628; &middot; &#50668;&#54665; &#50640;&#46356;&#53664;&#47532;&#50620;</span></span>
    </button>

    <button type="button" class="btn logo-option">
      <span class="logo-stage">
        <svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Go Capsule logo">
          <defs><linearGradient id="v9-capsule" x1="224" y1="14" x2="398" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#00C6B7"/><stop offset=".48" stop-color="#1CB3E5"/><stop offset="1" stop-color="#2F6BFF"/></linearGradient></defs>
          <g transform="translate(267.14 92.857) scale(2.142857)"><text class="capsule-base" x="2" y="76" font-size="78">Hoteln</text><rect x="212" y="8" width="190" height="84" rx="42" fill="url(#v9-capsule)"/><text class="capsule-go" x="232" y="69" font-size="61">GO</text><path d="M314 50h44m-14-13 14 13-14 13" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
        </svg>
      </span>
      <span class="option-copy"><span class="option-title">05 &middot; Go Capsule</span><span class="text-small text-muted">&#50892;&#46300;&#47560;&#53356; &middot; &#48736;&#47480; &#51060;&#46041;</span></span>
    </button>

    <button type="button" class="btn logo-option">
      <span class="logo-stage"><svg class="normalized-logo" viewBox="0 70 1400 260" role="img" aria-label="Key Tag logo"><image href="__KEYTAG__" x="127.2727" y="36.3636" width="1145.4545" height="327.2727"/></svg></span>
      <span class="option-copy"><span class="option-title">06 &middot; Key Tag</span><span class="text-small text-muted">&#45824;&#45812;&#54632; &middot; &#54840;&#53588; &#49324;&#51064;</span></span>
    </button>
  </div>
</div>

<style>
  @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css");
  @import url("https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@700;800&family=Montserrat+Alternates:wght@700&display=swap");
  #hotelngo-logo-directions-v14 .logo-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem}
  #hotelngo-logo-directions-v14 .logo-option{display:grid;grid-template-areas:"title" "logo" "desc";grid-template-rows:auto 7.5rem auto;align-items:center;gap:.3rem;width:100%;text-align:left;white-space:normal}
  #hotelngo-logo-directions-v14 .logo-stage{grid-area:logo;display:grid;place-items:center;min-width:0;height:100%}
  #hotelngo-logo-directions-v14 .normalized-logo{display:block;width:100%;height:100%;overflow:visible}
  #hotelngo-logo-directions-v14 .option-copy{display:contents}
  #hotelngo-logo-directions-v14 .option-title{grid-area:title;font-weight:500}
  #hotelngo-logo-directions-v14 .option-copy .text-small{grid-area:desc}
  #hotelngo-logo-directions-v14 .ocean-word{font-family:Pretendard,"Noto Sans",Arial,sans-serif;font-weight:800;letter-spacing:-2.4px;fill:#181B1A;transform:scaleY(.94);transform-box:fill-box;transform-origin:center}
  #hotelngo-logo-directions-v14 .new-word{font-family:"Montserrat Alternates",Arial,sans-serif;font-weight:700;letter-spacing:-1.4px;fill:#181B1A}
  #hotelngo-logo-directions-v14 .capsule-base{font-family:"Barlow Semi Condensed",Arial,sans-serif;font-weight:700;letter-spacing:-.5px;fill:#181B1A}
  #hotelngo-logo-directions-v14 .capsule-go{font-family:"Barlow Semi Condensed",Arial,sans-serif;font-weight:800;letter-spacing:0;fill:#FFFFFF}
  @media(max-width:620px){#hotelngo-logo-directions-v14 .logo-list{grid-template-columns:1fr}#hotelngo-logo-directions-v14 .logo-option{grid-template-rows:auto 6.75rem auto}}
</style>

'@

$fragment = $fragment.Replace('__DOORWAY__', $doorway).Replace('__COASTAL__', $coastal).Replace('__KEYTAG__', $keyTag)
[IO.File]::WriteAllText($VisualizationPath, $fragment, [Text.UTF8Encoding]::new($false))
Get-Item -LiteralPath $VisualizationPath | Select-Object FullName, Length
