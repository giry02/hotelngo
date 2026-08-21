(() => {
  if (!document.querySelector('link[data-hotelngo-components]')) {
    const componentStyles = document.createElement('link');
    componentStyles.rel = 'stylesheet';
    componentStyles.href = 'styles/components.css?v=4';
    componentStyles.dataset.hotelngoComponents = '';
    document.head.append(componentStyles);
  }
  if (!document.querySelector('script[data-hotelngo-ui]')) {
    const uiScript = document.createElement('script');
    uiScript.src = 'scripts/ui-components.js?v=2';
    uiScript.dataset.hotelngoUi = '';
    document.head.append(uiScript);
  }
  if (!document.querySelector('script[data-hotelngo-search]')) {
    const searchScript = document.createElement('script');
    searchScript.src = 'scripts/search-autocomplete.js?v=5';
    searchScript.dataset.hotelngoSearch = '';
    document.head.append(searchScript);
  }
  if (!document.querySelector('script[data-hotelngo-trip-card]')) {
    const tripCardScript = document.createElement('script');
    tripCardScript.src = 'scripts/trip-card-store.js?v=1';
    tripCardScript.dataset.hotelngoTripCard = '';
    document.head.append(tripCardScript);
  }

  const logo = (_assetId, ariaLabel = 'HotelnGo Ocean Route 로고') => `
    <img class="brand-logo" src="assets/brand/official/hotelngo-logo-web.png?v=2" width="504" height="138" alt="${ariaLabel}" decoding="async">`;

  const navItems = [
    ['discover', '여행 발견', 'discover.html'],
    ['planner', '여행 만들기', 'trip-create.html'],
    ['hotels', '호텔', 'hotels.html'],
    ['experiences', '즐길거리', 'experiences.html'],
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
          <a class="ai-quick-link${active === 'ai' ? ' is-active' : ''}" href="ai-travel.html"><span aria-hidden="true">✦</span><b>AI 여행</b></a>
          <a class="cart-link" href="cart.html">여행 카드</a>
          <a class="reservation-link" href="bookings.html">예약 조회</a>
          <a class="login-button" href="login.html">로그인</a>
          <button class="menu-button" type="button" aria-label="전체 메뉴 열기" aria-expanded="false" data-menu-trigger><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
    <button class="menu-scrim" type="button" aria-label="메뉴 닫기" data-menu-scrim hidden></button>
    <aside class="mobile-menu" role="dialog" aria-modal="true" aria-label="전체 메뉴" data-mobile-menu hidden>
      <div class="mobile-menu-head"><div><small>HOTELNGO MENU</small><strong>여행을 어디서 이어갈까요?</strong></div><button type="button" aria-label="전체 메뉴 닫기" data-menu-close>×</button></div>
      <nav>${navItems.map(([key, label, href], index) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}${key === 'trips' ? ' data-member-only' : ''}><span>0${index + 1}</span><strong>${label}</strong><i aria-hidden="true">›</i></a>`).join('')}</nav>
      <div class="mobile-menu-actions"><a href="cart.html">여행 카드</a><a href="booking-cart.html">예약 카트</a><a href="bookings.html">예약 조회</a><a class="primary" href="login.html">로그인·회원가입</a></div>
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
      <a class="${active === 'hotels' ? 'is-active' : ''}" href="hotels.html"><span>⌕</span>호텔</a>
      <a class="${active === 'planner' || active === 'ai' || active === 'trips' ? 'is-active' : ''}" href="trip-create.html"><span>＋</span>여행 만들기</a>
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
  document.querySelectorAll('a[href="cart.html"]').forEach((link) => {
    if (link.textContent.trim() === '여행 카트') link.textContent = '여행 카드';
  });
  if (!document.querySelector('[data-toast]')) {
    document.body.insertAdjacentHTML('beforeend', '<div class="toast" role="status" aria-live="polite" data-toast></div>');
  }
})();
