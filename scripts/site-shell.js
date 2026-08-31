(() => {
  const mobileRouteMap = {
    'index.html': 'home',
    'discover.html': 'discover',
    'community.html': 'community',
    'cart.html': 'card',
    'trip-create.html': 'ai',
    'trip-planner.html': 'plan',
    'hotels.html': 'hotels',
    'ai-travel.html': 'ai',
    'trips.html': 'trips',
    'my.html': 'trips',
    'bookings.html': 'bookings',
    'orders.html': 'bookings',
    'saved.html': 'saved',
    'login.html': 'login'
  };
  const desktopRoute = location.pathname.split('/').pop() || 'index.html';
  const mobileRoute = mobileRouteMap[desktopRoute];
  const query = new URLSearchParams(location.search);
  const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;

  if (mobileRoute && isMobileViewport && query.get('desktop') !== '1') {
    const mobileUrl = new URL('mobile/index.html', location.href);
    const deployVersion = query.get('deploy');
    if (deployVersion) mobileUrl.searchParams.set('deploy', deployVersion);
    mobileUrl.hash = mobileRoute;
    location.replace(mobileUrl.href);
    return;
  }

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
  if (!document.querySelector('script[src*="scripts/main.js"], script[data-hotelngo-main]')) {
    const mainScript = document.createElement('script');
    mainScript.src = 'scripts/main.js?v=15';
    mainScript.dataset.hotelngoMain = '';
    document.head.append(mainScript);
  }
  if (!document.querySelector('script[data-hotelngo-trip-card]')) {
    const tripCardScript = document.createElement('script');
    tripCardScript.src = 'scripts/trip-card-store.js?v=4';
    tripCardScript.dataset.hotelngoTripCard = '';
    document.head.append(tripCardScript);
  }
  if (!document.querySelector('link[data-hotelngo-account-navigation]')) {
    const accountNavigationStyles = document.createElement('link');
    accountNavigationStyles.rel = 'stylesheet';
    accountNavigationStyles.href = 'styles/account-navigation.css?v=2';
    accountNavigationStyles.dataset.hotelngoAccountNavigation = '';
    document.head.append(accountNavigationStyles);
  }
  if (document.querySelector('[data-trip-card-root]') && !document.querySelector('link[data-hotelngo-trip-card-enhancements]')) {
    const tripCardEnhancementStyles = document.createElement('link');
    tripCardEnhancementStyles.rel = 'stylesheet';
    tripCardEnhancementStyles.href = 'styles/trip-card-enhancements.css?v=1';
    tripCardEnhancementStyles.dataset.hotelngoTripCardEnhancements = '';
    document.head.append(tripCardEnhancementStyles);
  }

  const logo = (_assetId, ariaLabel = 'HotelnGo Go Capsule IBM Plex Sans 로고') => `
    <img class="brand-logo" src="assets/brand/official/hotelngo-logo-go-capsule-ibm-plex.svg?v=3" width="407" height="100" alt="${ariaLabel}" decoding="async">`;

  const navItems = [
    ['discover', '여행지', 'discover.html'],
    ['community', '여행 가이드', 'community.html'],
    ['planner', '여행 만들기', 'trip-create.html'],
    ['hotels', '호텔', 'hotels.html'],
    ['experiences', '즐길거리', 'experiences.html'],
    ['ai', 'AI 여행', 'ai-travel.html']
  ];

  const route = location.pathname.split('/').pop() || 'index.html';
  if (route === 'my.html') {
    location.replace('trips.html');
    return;
  }
  const accountRouteGroups = {
    trips: ['trips.html', 'shared-trips.html'],
    orders: ['orders.html', 'booking-detail.html'],
    saved: ['saved.html'],
    activity: ['notifications.html', 'coupons.html', 'reviews.html', 'my-stories.html', 'inquiries.html'],
    settings: ['account-settings.html', 'travelers.html', 'payment-methods.html', 'password-change.html', 'privacy-request.html']
  };
  const accountSection = Object.entries(accountRouteGroups).find(([, routes]) => routes.includes(route))?.[0] || '';

  const accountContextNavigation = () => accountSection ? `
    <nav class="account-context-nav" aria-label="마이페이지 메뉴" data-auth-only hidden>
      <div class="shell account-context-inner">
        <a class="${accountSection === 'trips' ? 'is-active' : ''}" href="trips.html">여행 일정</a>
        <a class="${accountSection === 'orders' ? 'is-active' : ''}" href="orders.html">예약 내역</a>
        <a class="${accountSection === 'saved' ? 'is-active' : ''}" href="saved.html">저장·찜</a>
        <a class="${accountSection === 'activity' ? 'is-active' : ''}" href="notifications.html">활동·혜택</a>
      </div>
    </nav>` : '';

  const header = (active) => `
    <header class="site-header" data-header>
      <div class="header-inner shell">
        <a class="brand" href="index.html" aria-label="HotelnGo 홈">${logo('hotelngo-ocean-route-shell-header')}</a>
        <nav class="main-nav" aria-label="주요 서비스">
          ${navItems.map(([key, label, href]) => `<a class="${active === key ? 'is-active' : ''}${key === 'ai' ? ' ai-link' : ''}" href="${href}">${key === 'ai' ? '<span aria-hidden="true">✦</span><b>' + label + '</b>' : label}</a>`).join('')}
        </nav>
        <div class="header-actions">
          <a class="ai-quick-link${active === 'ai' ? ' is-active' : ''}" href="ai-travel.html"><span aria-hidden="true">✦</span><b>AI 여행</b></a>
          <a class="cart-link" href="cart.html">여행 카드</a>
          <a class="account-header-link" href="trips.html" data-auth-only hidden>내 여행</a>
          <a class="reservation-link" href="bookings.html" data-guest-only>예약 조회</a>
          <a class="login-button" href="login.html" data-guest-only>로그인</a>
          <div class="account-user" data-auth-only hidden>
            <button class="account-user-trigger" type="button" aria-label="회원 메뉴 열기" aria-haspopup="menu" aria-expanded="false" data-account-menu-trigger><span data-member-label>내 계정</span><i aria-hidden="true"></i></button>
            <div class="account-user-menu" role="menu" data-account-menu hidden>
              <a role="menuitem" href="account-settings.html">계정 설정</a>
              <button role="menuitem" type="button" data-auth-logout>로그아웃</button>
            </div>
          </div>
          <button class="menu-button" type="button" aria-label="전체 메뉴 열기" aria-expanded="false" data-menu-trigger><span></span><span></span><span></span></button>
        </div>
      </div>
    </header>
    <button class="menu-scrim" type="button" aria-label="메뉴 닫기" data-menu-scrim hidden></button>
    <aside class="mobile-menu" role="dialog" aria-modal="true" aria-label="전체 메뉴" data-mobile-menu hidden>
      <div class="mobile-menu-head"><div><small>HOTELNGO MENU</small><strong>여행을 어디서 이어갈까요?</strong></div><button type="button" aria-label="전체 메뉴 닫기" data-menu-close>×</button></div>
      <nav>${navItems.map(([key, label, href], index) => `<a href="${href}"${active === key ? ' aria-current="page"' : ''}><span>0${index + 1}</span><strong>${label}</strong><i aria-hidden="true">›</i></a>`).join('')}</nav>
      <div class="mobile-menu-actions">
        <a href="cart.html">여행 카드</a>
        <a href="bookings.html" class="reservation-link" data-guest-only>예약 조회</a>
        <a href="trips.html" data-auth-only hidden>내 여행</a>
        <a href="account-settings.html" data-auth-only hidden><span data-member-label>내 계정</span></a>
        <a class="primary" href="login.html" data-guest-only>로그인·회원가입</a>
        <button class="primary" type="button" data-auth-logout data-auth-only hidden>로그아웃</button>
      </div>
      <p>해외 호텔과 여행 장면을 저장하고 하나의 일정으로 연결하세요.</p>
    </aside>
    ${accountContextNavigation()}`;

  const footer = () => `
    <footer class="site-footer">
      <div class="shell footer-inner">
        <div class="footer-brand">${logo('hotelngo-ocean-route-shell-footer')}<p>Stay here. Go anywhere.</p></div>
        <nav aria-label="회사 정보"><a href="company.html">회사소개</a><a href="support.html">고객센터</a><a href="faq.html">자주 묻는 질문</a><a href="terms.html">이용약관</a><a href="privacy.html"><strong>개인정보처리방침</strong></a><a href="bookings.html">예약 조회</a><a href="hotel-login.html">호텔 콘텐츠센터</a><a href="partner-login.html">액티비티 파트너센터</a></nav>
        <div class="company-info"><p>(주)HotelnGo · 대표 Giry · 사업자등록번호 000-00-00000</p><p>고객센터 1670-0000 · 평일 09:00–18:00</p><p>HotelnGo는 통신판매중개자로서 통신판매의 당사자가 아닙니다.</p></div>
        <p class="copyright">© <span data-year></span> HotelnGo. All rights reserved.</p>
      </div>
    </footer>`;

  const mobileIcons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8v9h-6v-6H9v6H3Z"/></svg>',
    discover: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/></svg>',
    ai: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></svg>',
    community: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v11H8l-4 3V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h5"/></svg>',
    trips: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
  };
  const mobileNav = (active) => `
    <nav class="mobile-tabbar" aria-label="모바일 하단 메뉴">
      <a class="${active === 'home' ? 'is-active' : ''}" href="index.html"><span>${mobileIcons.home}</span>홈</a>
      <a class="${active === 'discover' ? 'is-active' : ''}" href="discover.html"><span>${mobileIcons.discover}</span>여행지</a>
      <a class="mobile-ai-entry ${active === 'planner' || active === 'ai' ? 'is-active' : ''}" href="ai-travel.html"><span>${mobileIcons.ai}</span>AI 여행</a>
      <a class="${active === 'community' ? 'is-active' : ''}" href="community.html"><span>${mobileIcons.community}</span>여행 가이드</a>
      <a class="${active === 'my' || active === 'trips' ? 'is-active' : ''}" href="trips.html"><span>${mobileIcons.trips}</span>마이</a>
    </nav>`;

  document.querySelectorAll('[data-site-header]').forEach((target) => {
    target.outerHTML = header(target.dataset.active || '');
  });
  if (accountSection) document.body.classList.add('has-account-context');
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

  const closeAccountMenus = () => {
    document.querySelectorAll('[data-account-menu]').forEach((menu) => { menu.hidden = true; });
    document.querySelectorAll('[data-account-menu-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-account-menu-trigger]');
    if (trigger) {
      const menu = trigger.closest('.account-user')?.querySelector('[data-account-menu]');
      const willOpen = Boolean(menu?.hidden);
      closeAccountMenus();
      if (menu && willOpen) {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      }
      return;
    }
    if (!event.target.closest('.account-user')) closeAccountMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAccountMenus();
  });
})();
