(() => {
  const header = document.querySelector('[data-header]');
  const menuTrigger = document.querySelector('[data-menu-trigger]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const searchForm = document.querySelector('[data-search-form]');
  const searchTabs = [...document.querySelectorAll('[data-search-tab]')];
  const regionTabs = [...document.querySelectorAll('[data-region-tab]')];
  const stayFilters = [...document.querySelectorAll('[data-stay-filter]')];
  const heroCarousel = document.querySelector('[data-hero-carousel]');
  const heroSlides = [...document.querySelectorAll('[data-hero-slide]')];
  const heroDots = [...document.querySelectorAll('[data-hero-dot]')];
  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  let heroTimer;
  let heroIndex = 0;

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  };

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
  };

  const closeMenu = () => {
    if (!menuTrigger || !mobileMenu) return;
    mobileMenu.hidden = true;
    menuTrigger.setAttribute('aria-expanded', 'false');
    menuTrigger.setAttribute('aria-label', '전체 메뉴 열기');
    document.body.classList.remove('menu-open');
  };

  const showHeroSlide = (index, restart = false) => {
    if (!heroSlides.length) return;
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, slideIndex) => {
      const active = slideIndex === heroIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    heroDots.forEach((dot, dotIndex) => {
      const active = dotIndex === heroIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
    if (restart) startHeroRotation();
  };

  const stopHeroRotation = () => window.clearInterval(heroTimer);
  const startHeroRotation = () => {
    stopHeroRotation();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || heroSlides.length < 2) return;
    heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 5600);
  };

  const setDefaultDates = () => {
    if (!searchForm) return;
    const today = new Date();
    const arrival = addDays(today, 7);
    const departure = addDays(arrival, 1);
    const checkIn = searchForm.elements.checkIn;
    const checkOut = searchForm.elements.checkOut;
    checkIn.min = formatDate(today);
    checkOut.min = formatDate(addDays(today, 1));
    if (!checkIn.value) checkIn.value = formatDate(arrival);
    if (!checkOut.value) checkOut.value = formatDate(departure);
  };

  menuTrigger?.addEventListener('click', () => {
    const willOpen = menuTrigger.getAttribute('aria-expanded') !== 'true';
    mobileMenu.hidden = !willOpen;
    menuTrigger.setAttribute('aria-expanded', String(willOpen));
    menuTrigger.setAttribute('aria-label', willOpen ? '전체 메뉴 닫기' : '전체 메뉴 열기');
    document.body.classList.toggle('menu-open', willOpen);
  });

  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  searchTabs.forEach((tab) => tab.addEventListener('click', () => {
    searchTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    const destination = searchForm?.elements.destination;
    if (!destination) return;
    const copy = { overseas: ['다낭', '도시, 공항, 해외 호텔을 검색해보세요'] };
    const [value, placeholder] = copy[tab.dataset.searchTab];
    destination.value = value;
    destination.placeholder = placeholder;
  }));

  document.querySelectorAll('[data-fill-search]').forEach((button) => button.addEventListener('click', () => {
    const destination = searchForm?.elements.destination;
    if (!destination) return;
    destination.value = button.dataset.fillSearch;
    destination.focus();
  }));

  searchForm?.addEventListener('change', (event) => {
    if (event.target.name !== 'checkIn' || !event.target.value) return;
    const checkOut = searchForm.elements.checkOut;
    const minimum = addDays(new Date(`${event.target.value}T12:00:00`), 1);
    checkOut.min = formatDate(minimum);
    if (!checkOut.value || checkOut.value <= event.target.value) checkOut.value = formatDate(minimum);
  });

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(searchForm);
    const query = new URLSearchParams({
      destination: data.get('destination') || '',
      checkIn: data.get('checkIn') || '',
      checkOut: data.get('checkOut') || '',
      guests: data.get('guests') || ''
    });
    window.location.href = `hotels.html?${query.toString()}`;
  });

  regionTabs.forEach((tab) => tab.addEventListener('click', () => {
    const selectedRegion = tab.dataset.regionTab;
    regionTabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('[data-region-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.regionPanel !== selectedRegion;
    });
  }));

  stayFilters.forEach((filter) => filter.addEventListener('click', () => {
    const category = filter.dataset.stayFilter;
    stayFilters.forEach((item) => item.classList.toggle('is-active', item === filter));
    document.querySelectorAll('[data-category]').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  }));

  document.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', () => {
    const saved = button.classList.toggle('is-saved');
    button.textContent = saved ? '♥' : '♡';
    button.setAttribute('aria-label', button.getAttribute('aria-label').replace(saved ? '찜하기' : '찜 취소', saved ? '찜 취소' : '찜하기'));
    showToast(saved ? '찜 목록에 숙소를 저장했습니다.' : '찜 목록에서 숙소를 제외했습니다.');
  }));

  document.querySelectorAll('[data-story-save]').forEach((button) => button.addEventListener('click', () => {
    const saved = button.classList.toggle('is-saved');
    button.textContent = button.hasAttribute('data-copy-save') ? (saved ? '저장됨' : '저장하기') : (saved ? '♥' : '♡');
    const ariaLabel = button.getAttribute('aria-label');
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel.replace(saved ? '저장' : '저장 취소', saved ? '저장 취소' : '저장'));
    showToast(saved ? '여행 스토리를 저장했습니다.' : '저장한 스토리에서 제외했습니다.');
  }));

  document.querySelector('[data-hero-prev]')?.addEventListener('click', () => showHeroSlide(heroIndex - 1, true));
  document.querySelector('[data-hero-next]')?.addEventListener('click', () => showHeroSlide(heroIndex + 1, true));
  heroDots.forEach((dot) => dot.addEventListener('click', () => showHeroSlide(Number(dot.dataset.heroDot), true)));
  heroCarousel?.addEventListener('pointerenter', stopHeroRotation);
  heroCarousel?.addEventListener('pointerleave', startHeroRotation);
  heroCarousel?.addEventListener('focusin', stopHeroRotation);
  heroCarousel?.addEventListener('focusout', startHeroRotation);

  document.querySelector('.more-button')?.addEventListener('click', () => showToast('다음 추천 숙소를 준비하고 있습니다.'));
  document.querySelectorAll('.reservation-link, .login-button, .member-banner button, .app-actions button').forEach((button) => {
    button.addEventListener('click', () => showToast(`${button.textContent.trim()} 기능은 다음 구현 단계에서 연결됩니다.`));
  });

  const handleScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  showHeroSlide(0);
  startHeroRotation();
  setDefaultDates();
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
