(() => {
  if (!document.querySelector('link[data-hotelngo-components]')) {
    const componentStyles = document.createElement('link');
    componentStyles.rel = 'stylesheet';
    componentStyles.href = 'styles/components.css?v=3';
    componentStyles.dataset.hotelngoComponents = '';
    document.head.append(componentStyles);
  }
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=1';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }
  if (!document.querySelector('script[data-hotelngo-search]')) {
    const searchScript = document.createElement('script');
    searchScript.src = 'scripts/search-autocomplete.js?v=3';
    searchScript.dataset.hotelngoSearch = '';
    document.head.append(searchScript);
  }

  const logo = (gradientId, ariaLabel = 'HotelnGo Ocean Route 로고') => `
    <svg class="brand-logo" viewBox="0 0 315 86" role="img" aria-label="${ariaLabel}">
      <defs>
        <linearGradient id="${gradientId}" gradientUnits="userSpaceOnUse" x1="144" y1="45" x2="180" y2="45">
          <stop offset="0%" stop-color="#00C6B7"/>
          <stop offset="48%" stop-color="#1CB3E5"/>
          <stop offset="100%" stop-color="#2F6BFF"/>
        </linearGradient>
      </defs>
      <g transform="translate(-.65)">
        <text class="word" x="7.3" y="59" font-size="56">Hotel</text>
        <g transform="translate(144 59) scale(1.45) translate(-144 -59)">
          <path d="M147.51 31.89 149.62 32.24 151.55 34.54 151.73 46.77 152.08 48.01 154.19 50.49 158.40 51.38 161.21 50.14 162.79 47.48 163.14 44.11 164.90 42.16 167.71 41.81 169.99 43.41 170.52 46.06 169.64 50.67 168.06 53.51 165.07 56.52 161.21 58.47 157 59 152.43 58.11 149.97 56.87 147.16 54.39 144.35 48.72 144 35.43 145.23 32.77Z" fill="url(#${gradientId})"/>
          <path d="M164.72 31 168.76 31 172.45 32.06 175.61 34.19 178.77 38.44 180 43.05 180 55.81 179.47 57.23 177.89 58.65 174.56 58.65 172.62 56.52 172.45 43.05 171.04 40.22 169.64 39.15 165.42 38.62 162.61 40.22 161.21 42.87 160.86 45.89 158.93 47.84 155.59 47.84 153.48 45.18 154.01 40.22 156.47 35.61 160.16 32.59Z" fill="url(#${gradientId})"/>
        </g>
        <text class="word" x="202" y="59" font-size="56">g</text>
        <g transform="translate(28)">
          <path class="pin" d="M247 6c-20.5 0-35 13.7-35 33.5 0 16.5 11.3 28.7 35 45.5 23.7-16.8 35-29 35-45.5C282 19.7 267.5 6 247 6Z"/>
          <circle class="pin-hole" cx="247" cy="38.5" r="14"/>
          <path class="pin" d="m239 39 17-8-6.2 17.6-4.5-7Z" transform="translate(-1.8 -.5)"/>
        </g>
      </g>
    </svg>`;

  const navItems = [
    ['discover', '여행 발견', 'discover.html'],
    ['community', '여행 일정', 'community.html'],
    ['hotels', '호텔', 'hotels.html'],
    ['experiences', '즐길거리', 'experiences.html'],
    ['places', '현지 장소', 'places.html'],
    ['ai', 'AI 여행', 'ai-travel.html'],
    ['trips', '내 여행', 'trips.html']
  ];

  const header = (active) => `
    <header class="site-header" data-header>
      <div class="header-inner shell">
        <a class="brand" href="index.html" aria-label="HotelnGo 홈">${logo('hotelngo-ocean-route-shell-header')}</a>
        <nav class="main-nav" aria-label="주요 서비스">
          ${navItems.map(([key, label, href]) => `<a class="${active === key ? 'is-active' : ''}${key === 'ai' ? ' ai-link' : ''}" href="${href}"${key === 'trips' ? ' data-member-only' : ''}>${key === 'ai' ? '<span aria-hidden="true">✦</span><b>' + label + '</b>' : label}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <a class="cart-link" href="cart.html">여행 카트</a>
          <a class="reservation-link" href="bookings.html">예약 조회</a>
          <a class="login-button" href="login.html">로그인</a>
          <button class="menu-button" type="button" aria-label="전체 메뉴 열기" aria-expanded="false" data-menu-trigger><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
    <button class="menu-scrim" type="button" aria-label="메뉴 닫기" data-menu-scrim hidden></button>
    <aside class="mobile-menu" aria-label="전체 메뉴" data-mobile-menu hidden>
      <div class="mobile-menu-head"><div><small>HOTELNGO MENU</small><strong>여행을 어디서 이어갈까요?</strong></div><button type="button" aria-label="전체 메뉴 닫기" data-menu-close>×</button></div>
      <nav>${navItems.map(([key, label, href], index) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}${key === 'trips' ? ' data-member-only' : ''}><span>0${index + 1}</span><strong>${label}</strong><i aria-hidden="true">›</i></a>`).join('')}</nav>
      <div class="mobile-menu-actions"><a href="cart.html">여행 카트</a><a href="bookings.html">예약 조회</a><a class="primary" href="login.html">로그인·회원가입</a></div>
      <p>해외 호텔과 여행 장면을 저장하고 하나의 일정으로 연결하세요.</p>
    </aside>`;

  const footer = () => `
    <footer class="site-footer">
      <div class="shell footer-inner">
        <div class="footer-brand">${logo('hotelngo-ocean-route-shell-footer')}<p>Stay here. Go anywhere.</p></div>
        <nav aria-label="회사 정보"><a href="company.html">회사소개</a><a href="support.html">고객센터</a><a href="faq.html">자주 묻는 질문</a><a href="terms.html">이용약관</a><a href="privacy.html"><strong>개인정보처리방침</strong></a><a href="bookings.html">예약 조회</a><a href="hotel-login.html">호텔 콘텐츠센터</a><a href="partner-login.html">액티비티 파트너센터</a></nav>
        <div class="company-info"><p>(주)HotelnGo · 대표 Giry · 사업자등록번호 000-00-00000</p><p>고객센터 1670-0000 · 평일 09:00–18:00</p><p>HotelnGo는 통신판매중개자로서 통신판매의 당사자가 아닙니다.</p></div>
        <p class="copyright">© <span data-year></span> HotelnGo. All rights reserved.</p>
      </div>
    </footer>`;

  const mobileNav = (active) => `
    <nav class="mobile-tabbar" aria-label="모바일 하단 메뉴">
      <a class="${active === 'home' ? 'is-active' : ''}" href="index.html"><span>⌂</span>홈</a>
      <a class="${active === 'hotels' ? 'is-active' : ''}" href="hotels.html"><span>⌕</span>검색</a>
      <a class="${active === 'ai' ? 'is-active' : ''}" href="ai-travel.html"><span>✦</span>AI 여행</a>
      <a class="${active === 'trips' ? 'is-active' : ''}" href="trips.html" data-member-only><span>◇</span>내 여행</a>
      <a class="${active === 'my' ? 'is-active' : ''}" href="my.html"><span>○</span>마이</a>
    </nav>`;

  document.querySelectorAll('[data-site-header]').forEach((target) => {
    target.outerHTML = header(target.dataset.active || '');
  });
  document.querySelectorAll('[data-site-footer]').forEach((target) => {
    target.outerHTML = footer();
  });
  document.querySelectorAll('[data-site-mobile-nav]').forEach((target) => {
    target.outerHTML = mobileNav(target.dataset.active || '');
  });
  document.querySelectorAll('[data-brand-lockup]').forEach((target, index) => {
    target.innerHTML = logo(`hotelngo-ocean-route-showcase-${index}`);
  });
  if (!document.querySelector('[data-toast]')) {
    document.body.insertAdjacentHTML('beforeend', '<div class="toast" role="status" aria-live="polite" data-toast></div>');
  }
})();
