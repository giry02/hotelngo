const SESSION_KEY = 'hotelngo.mock.session.v1';
const CARD_KEY = 'hotelngo.api.state.v1.trip-card';
const TRIPS_KEY = 'hotelngo.api.state.v1.trips';
const ENGAGEMENT_KEY = 'hotelngo.api.state.v1.community-engagements';
const COMMENTS_KEY = 'hotelngo.api.state.v1.community-comments';
const RETURN_KEY = 'hotelngo.mobile.return.v1';
const PENDING_KEY = 'hotelngo.mobile.pending-action.v1';
const CARD_DESTINATION_KEY = 'hotelngo.mobile.card-destination.v1';
const CARD_SELECTION_KEY = 'hotelngo.mobile.card-selection.v1';

const main = document.querySelector('#app-main');
const toastElement = document.querySelector('[data-toast]');
const sheetLayer = document.querySelector('[data-sheet-layer]');
let data;
let activeDay = 1;
let activeDiscoverDestination = 'danang';
let activeDiscoverTheme = 'ALL';
let discoverQuery = '';
let activeCardDestination = localStorage.getItem(CARD_DESTINATION_KEY) || 'danang';
let activeBookingFilter = 'ALL';
let guestBookingVisible = false;
let toastTimer;
let planMap;
let planRouteLine;
let planRouteMover;
let planRouteAnimation;
let planRouteCoordinates = [];
let storyMap;
let storyRouteLine;
let storyRouteMover;
let storyRouteAnimation;
let storyRouteCoordinates = [];
let activeStoryMapId = '';
let activeStoryMapDay = 1;
let activeCommunityFilter = 'RECOMMENDED';

const icons = {
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  hotel:'<svg viewBox="0 0 24 24"><path d="M4 20V5h10v15M14 10h6v10M7 8h4M7 12h4M7 16h4M17 13v3"/></svg>',
  pin:'<svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  spark:'<svg viewBox="0 0 24 24"><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
  comment:'<svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
  share:'<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></svg>',
  back:'<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>',
  route:'<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><path d="M5 3v3M19 3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"/></svg>',
  restaurant:'<svg viewBox="0 0 24 24"><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18M16 3c3 2 4 6 4 9h-4"/></svg>',
  spa:'<svg viewBox="0 0 24 24"><path d="M4 14c3-4 6-4 8 0 2-4 5-4 8 0M5 19h14M8 10c-1-2 0-4 2-5M13 10c-1-2 0-4 2-5"/></svg>',
  golf:'<svg viewBox="0 0 24 24"><path d="M6 21V3l10 4-10 4M4 21h8M16 17c3 0 5 1 5 2s-2 2-5 2-5-1-5-2"/></svg>',
  vehicle:'<svg viewBox="0 0 24 24"><path d="M4 15h16l-2-6H6l-2 6ZM6 15v4M18 15v4M3 15v3h18v-3M7 12h10"/></svg>'
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const userId = () => session()?.user?.id || '';
const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Number(value || 0));
const formatPrice = (value) => Number(value) ? `${formatNumber(value)}원` : '무료';
const categoryLabel = (category) => ({LANDMARK:'랜드마크',HOTEL:'숙소',RESTAURANT:'식사·카페',SPA:'마사지·스파',GOLF:'골프',TOUR:'투어·체험',VEHICLE:'이동'}[category] || category);
const categoryIcon = (category) => ({LANDMARK:icons.pin,HOTEL:icons.hotel,RESTAURANT:icons.restaurant,SPA:icons.spa,GOLF:icons.golf,TOUR:icons.route,VEHICLE:icons.vehicle}[category] || icons.pin);

const toast = (message) => {
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add('is-visible');
  toastTimer = setTimeout(() => toastElement.classList.remove('is-visible'), 2400);
};

const requireLogin = (returnRoute = route().raw, pendingAction = '') => {
  if (session()) return true;
  sessionStorage.setItem(RETURN_KEY, returnRoute);
  if (pendingAction) sessionStorage.setItem(PENDING_KEY, pendingAction);
  location.hash = 'login';
  toast('로그인 후 이용할 수 있습니다.');
  return false;
};

const route = () => {
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const [name, id] = raw.split('/');
  return { raw, name, id };
};

const setActiveNav = (name) => {
  const navName = name === 'story' ? 'community' : name === 'plan' ? 'ai' : ['login','bookings','saved','card'].includes(name) ? 'trips' : name;
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('is-active', link.dataset.nav === navName));
};

const openSheet = (title, body) => {
  sheetLayer.hidden = false;
  sheetLayer.innerHTML = `<section class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="sheet-handle"></div><header class="sheet-head"><h2>${escapeHtml(title)}</h2><button type="button" aria-label="닫기" data-close-sheet>×</button></header><div class="sheet-body">${body}</div></section>`;
  document.body.style.overflow = 'hidden';
};
const closeSheet = () => { sheetLayer.hidden = true; sheetLayer.innerHTML = ''; document.body.style.overflow = ''; };

const storyCard = (story) => `
  <a class="story-card" href="#story/${story.id}">
    <img src="${story.cover}" alt="${escapeHtml(story.title)}">
    <div class="story-card-copy"><small>${escapeHtml(story.destinationId.toUpperCase())} · ${story.duration}</small><h3>${escapeHtml(story.title)}</h3><p>${escapeHtml(story.summary)}</p><div class="story-card-meta"><span class="avatar-line"><i class="avatar">${escapeHtml(story.avatar)}</i>${escapeHtml(story.author)}</span><b>저장 ${formatNumber(story.scraps)}</b></div></div>
  </a>`;

const homePlaceCard = (place) => `
  <button class="home-place-card" type="button" data-place-detail="${place.id}">
    <img src="${place.image}" alt="${escapeHtml(place.title)}">
    <span><small>${categoryLabel(place.category)} · ${escapeHtml(place.area)}</small><strong>${escapeHtml(place.title)}</strong><em>${place.recommendedTime} 추천 · ${place.duration}분</em></span>
  </button>`;

const homeThemes = [
  { id:'BEACH', icon:'🌊', title:'바다와 휴양', copy:'해변·리조트 중심' },
  { id:'FOOD', icon:'🍜', title:'로컬 미식', copy:'시장·맛집·카페' },
  { id:'GOLF', icon:'⛳', title:'골프 여행', copy:'라운드와 휴식' },
  { id:'FAMILY', icon:'👨‍👩‍👧', title:'가족과 함께', copy:'편한 동선 중심' }
];

const homeDestinationCard = (destination) => `<button class="home-destination-card" type="button" data-home-destination="${destination.id}"><img src="${destination.image}" alt=""><span><strong>${escapeHtml(destination.name)}</strong><small>${escapeHtml(destination.country)} · 장소 ${destination.placeCount}</small></span></button>`;

const homeJourneyEntry = () => {
  if (!session()) return `<section class="home-ai-compact"><span class="home-ai-icon">${icons.spark}</span><div><small>AI 여행</small><strong>담은 장소를 날짜별 일정으로 정리해요</strong></div><button type="button" data-route="ai">시작</button></section>`;
  const savedCount = getCardItems().length;
  const hasDraft = Boolean(localStorage.getItem('hotelngo.mobile.plan.v1'));
  if (hasDraft) return `<section class="home-ai-compact"><span class="home-ai-icon">${icons.route}</span><div><small>만들던 여행</small><strong>다낭 4박 5일 초안을 이어서 편집하세요</strong></div><button type="button" data-route="plan">이어가기</button></section>`;
  if (savedCount) return `<section class="home-ai-compact is-saved"><span class="home-ai-icon">${icons.spark}</span><div><small>담은 장소 ${savedCount}곳</small><strong>저장한 장소로 AI 일정을 만들 수 있어요</strong></div><button type="button" data-generate-plan>만들기</button></section>`;
  return `<section class="home-ai-compact"><span class="home-ai-icon">${icons.bookmark}</span><div><small>AI 여행</small><strong>먼저 가고 싶은 장소를 담아주세요</strong></div><button type="button" data-route="discover">찾기</button></section>`;
};

const homeView = () => `
  <div class="view home-view">
    <section class="home-hero">
      <div class="home-hero-copy"><div><h1>어디로 떠날까요?</h1><p>여행지·랜드마크·호텔을 한 번에 검색하세요.</p></div><span class="weather">☀ 다낭 29°</span></div>
      <button class="search-launcher" type="button" data-open-search>${icons.search}<span><strong>도시·랜드마크·호텔 검색</strong><small>다낭, 미케 비치, 호텔명</small></span></button>
      <div class="popular-searches"><b>지금 많이 찾아요</b><button type="button" data-home-destination="danang">다낭</button><button type="button" data-home-destination="bangkok">방콕</button><button type="button" data-home-destination="kyoto">교토</button></div>
    </section>
    ${homeJourneyEntry()}
    <section class="section home-story-section"><div class="section-head"><div><span class="eyebrow">WEEKLY TRAVEL GUIDES</span><h2>이번 주 추천 여행</h2><p>검증된 동선을 먼저 보고 내 일정으로 바꿔보세요.</p></div><a href="#community">전체보기</a></div><div class="story-reel">${data.stories.map(storyCard).join('')}</div><div class="swipe-hint"><i></i>옆으로 넘겨 여행 가이드를 둘러보세요</div></section>
    <section class="section home-theme-section"><div class="section-head"><div><span class="eyebrow">TRAVEL MOOD</span><h2>어떤 여행을 찾으세요?</h2><p>하고 싶은 일을 고르면 어울리는 장소만 모아드려요.</p></div></div><div class="home-theme-grid">${homeThemes.map((theme) => `<button type="button" data-home-theme="${theme.id}"><b>${theme.icon}</b><span><strong>${theme.title}</strong><small>${theme.copy}</small></span><i>›</i></button>`).join('')}</div></section>
    <section class="section home-destination-section"><div class="section-head"><div><span class="eyebrow">TRENDING DESTINATIONS</span><h2>지금 많이 가는 도시</h2><p>도시를 고르면 장소와 여행 가이드가 함께 바뀝니다.</p></div><a href="#discover">전체보기</a></div><div class="home-destination-reel">${data.destinations.map(homeDestinationCard).join('')}</div></section>
    <section class="section home-curation"><div class="section-head"><div><span class="eyebrow">PICK IN DANANG</span><h2>다낭에서 바로 담기 좋은 곳</h2><p>랜드마크부터 식사까지, 일정에 필요한 장소를 골라보세요.</p></div><a href="#discover">전체보기</a></div><div class="home-place-reel">${data.places.slice(0,4).map(homePlaceCard).join('')}</div></section>
    <section class="section"><div class="section-head"><div><h2>빠르게 찾기</h2><p>목적에 맞는 항목부터 살펴보세요.</p></div></div><div class="quick-grid">
      <a href="#hotels">${icons.hotel}<span>숙소</span></a><a href="#discover">${icons.pin}<span>랜드마크</span></a><a href="#discover">${icons.route}<span>즐길거리</span></a><a href="#ai">${icons.spark}<span>AI 여행</span></a>
    </div></section>
  </div>`;

const destroyPlanMap = () => {
  if (planRouteAnimation) cancelAnimationFrame(planRouteAnimation);
  planRouteAnimation = undefined;
  planRouteLine = undefined;
  planRouteMover = undefined;
  planRouteCoordinates = [];
  if (!planMap) return;
  planMap.remove();
  planMap = undefined;
};

const fitPlanRoute = () => {
  if (!planMap || !planRouteCoordinates.length) return;
  if (planRouteCoordinates.length > 1) planMap.fitBounds(planRouteCoordinates, { padding:[34,34] });
  else planMap.setView(planRouteCoordinates[0], 14);
};

const animatePlanRoute = () => {
  if (!planMap || !planRouteLine || !planRouteMover || planRouteCoordinates.length < 2) return;
  if (planRouteAnimation) cancelAnimationFrame(planRouteAnimation);

  const caption = document.querySelector('[data-route-motion-label]');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    planRouteLine.setLatLngs(planRouteCoordinates);
    planRouteMover.setLatLng(planRouteCoordinates.at(-1));
    if (caption) caption.textContent = `1 → ${planRouteCoordinates.length} 동선`;
    return;
  }

  const segmentDuration = 820;
  const startedAt = performance.now();
  planRouteLine.setLatLngs([planRouteCoordinates[0]]);
  planRouteMover.setLatLng(planRouteCoordinates[0]);
  if (caption) caption.textContent = `1 → ${planRouteCoordinates.length} 이동 중`;

  const drawFrame = (now) => {
    if (!planMap || !planRouteLine || !planRouteMover) return;
    const progress = Math.min((now - startedAt) / segmentDuration, planRouteCoordinates.length - 1);
    const segment = Math.min(Math.floor(progress), planRouteCoordinates.length - 2);
    const localProgress = Math.min(progress - segment, 1);
    const start = planRouteCoordinates[segment];
    const end = planRouteCoordinates[segment + 1];
    const current = [
      start[0] + ((end[0] - start[0]) * localProgress),
      start[1] + ((end[1] - start[1]) * localProgress)
    ];
    planRouteLine.setLatLngs([...planRouteCoordinates.slice(0, segment + 1), current]);
    planRouteMover.setLatLng(current);

    if (progress < planRouteCoordinates.length - 1) {
      planRouteAnimation = requestAnimationFrame(drawFrame);
      return;
    }
    planRouteAnimation = undefined;
    planRouteLine.setLatLngs(planRouteCoordinates);
    planRouteMover.setLatLng(planRouteCoordinates.at(-1));
    if (caption) caption.textContent = `1 → ${planRouteCoordinates.length} 동선 완료`;
  };

  planRouteAnimation = requestAnimationFrame(drawFrame);
};

const planLocation = (item) => {
  if (Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng))) return { lat:Number(item.lat), lng:Number(item.lng), area:item.area || '' };
  const fallbacks = [
    ['다낭 오션 리조트',[16.0408,108.2495],'미케 비치 남쪽'],['미케 비치',[16.0593,108.2469],'다낭 동쪽 해안'],['Madame Lan',[16.0758,108.2228],'한강 북쪽'],
    ['한 시장',[16.0681,108.2241],'하이쩌우'],['한강 로컬 런치',[16.0611,108.2258],'한강변'],['Herbal Spa',[16.0664,108.2345],'안하이'],
    ['바나힐 픽업',[16.0612,108.2464],'미케 비치'],['골든 브리지',[15.9970,107.9886],'바나힐'],['시푸드',[16.0716,108.2442],'미케 비치'],
    ['오행산',[16.0036,108.2642],'오행산'],['호이안 올드타운',[15.8801,108.3380],'호이안'],['투본강',[15.8752,108.3277],'호이안'],
    ['체크아웃 브런치',[16.0622,108.2398],'미케 비치'],['다낭 공항',[16.0439,108.1994],'다낭 국제공항']
  ];
  const match = fallbacks.find(([keyword]) => item.title.includes(keyword));
  return match ? { lat:match[1][0], lng:match[1][1], area:match[2] } : null;
};

const initPlanMap = () => {
  const target = document.querySelector('#plan-route-map');
  const Leaflet = window.L;
  if (!target) return;
  if (!Leaflet) {
    target.classList.add('is-unavailable');
    target.innerHTML = `<div class="map-loading"><b>지도를 표시하지 못했습니다</b><span>네트워크 연결 후 다시 열어주세요.</span></div>`;
    return;
  }

  const plan = getPlan();
  const day = plan.days.find((item) => item.day === activeDay) || plan.days[0];
  const routePlaces = day.items.map((item) => ({ ...item, ...planLocation(item) })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  planMap = Leaflet.map(target, { zoomControl:false, attributionControl:true, dragging:true, scrollWheelZoom:true, doubleClickZoom:true, touchZoom:true, keyboard:true, zoomSnap:.5 });
  const tileLayer = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap' }).addTo(planMap);
  tileLayer.on('tileerror', () => target.classList.add('has-tile-error'));

  const coordinates = routePlaces.map((place) => [place.lat, place.lng]);
  planRouteCoordinates = coordinates;
  Leaflet.polyline(coordinates, { color:'#9dbcf8', weight:5, opacity:.55, dashArray:'4 8' }).addTo(planMap);
  planRouteLine = Leaflet.polyline(coordinates.length ? [coordinates[0]] : [], { color:'#2f6bff', weight:4, opacity:1, lineCap:'round', lineJoin:'round' }).addTo(planMap);
  routePlaces.forEach((place, index) => {
    const marker = Leaflet.marker([place.lat, place.lng], {
      icon:Leaflet.divIcon({ className:'route-live-marker', html:`<span>${index + 1}</span>`, iconSize:[32,32], iconAnchor:[16,16] })
    }).addTo(planMap);
    marker.bindPopup(`<strong>${escapeHtml(place.time)} · ${escapeHtml(place.title)}</strong><small>${escapeHtml(place.area || '')} · 체류 ${place.duration}분</small>`, { closeButton:false, offset:[0,-10] });
  });
  if (coordinates.length) {
    planRouteMover = Leaflet.marker(coordinates[0], {
      interactive:false,
      zIndexOffset:900,
      icon:Leaflet.divIcon({ className:'route-moving-marker', html:'<span aria-hidden="true">➜</span>', iconSize:[30,30], iconAnchor:[15,15] })
    }).addTo(planMap);
  }

  const RouteFitControl = Leaflet.Control.extend({
    options:{ position:'topleft' },
    onAdd:() => {
      const container = Leaflet.DomUtil.create('div', 'leaflet-bar leaflet-control route-fit-control');
      const button = Leaflet.DomUtil.create('button', '', container);
      button.type = 'button';
      button.title = '전체 경로 보기 · 다시 재생';
      button.setAttribute('aria-label', '전체 경로 보기와 이동 모션 다시 재생');
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
      Leaflet.DomEvent.disableClickPropagation(container);
      Leaflet.DomEvent.on(button, 'click', () => {
        fitPlanRoute();
        animatePlanRoute();
      });
      return container;
    }
  });
  new RouteFitControl().addTo(planMap);

  fitPlanRoute();
  setTimeout(() => {
    planMap?.invalidateSize();
    fitPlanRoute();
    animatePlanRoute();
  }, 90);
};

const destroyStoryMap = () => {
  if (storyRouteAnimation) cancelAnimationFrame(storyRouteAnimation);
  storyRouteAnimation = undefined;
  storyRouteLine = undefined;
  storyRouteMover = undefined;
  storyRouteCoordinates = [];
  if (!storyMap) return;
  storyMap.remove();
  storyMap = undefined;
};

const animateStoryRoute = () => {
  if (!storyMap || !storyRouteLine || !storyRouteMover || storyRouteCoordinates.length < 2) return;
  if (storyRouteAnimation) cancelAnimationFrame(storyRouteAnimation);

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    storyRouteLine.setLatLngs(storyRouteCoordinates);
    const midpointIndex = storyRouteCoordinates.length - 2;
    const start = storyRouteCoordinates[midpointIndex];
    const end = storyRouteCoordinates[midpointIndex + 1];
    storyRouteMover.setLatLng([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]);
    return;
  }

  const segmentDuration = 760;
  const startedAt = performance.now();
  storyRouteLine.setLatLngs([storyRouteCoordinates[0]]);
  storyRouteMover.setLatLng(storyRouteCoordinates[0]);

  const drawFrame = (now) => {
    if (!storyMap || !storyRouteLine || !storyRouteMover) return;
    const progress = Math.min((now - startedAt) / segmentDuration, storyRouteCoordinates.length - 1);
    const segment = Math.min(Math.floor(progress), storyRouteCoordinates.length - 2);
    const localProgress = Math.min(progress - segment, 1);
    const start = storyRouteCoordinates[segment];
    const end = storyRouteCoordinates[segment + 1];
    const current = [
      start[0] + ((end[0] - start[0]) * localProgress),
      start[1] + ((end[1] - start[1]) * localProgress)
    ];
    storyRouteLine.setLatLngs([...storyRouteCoordinates.slice(0, segment + 1), current]);
    storyRouteMover.setLatLng(current);

    if (progress < storyRouteCoordinates.length - 1) {
      storyRouteAnimation = requestAnimationFrame(drawFrame);
      return;
    }

    storyRouteAnimation = undefined;
    storyRouteLine.setLatLngs(storyRouteCoordinates);
    const lastStart = storyRouteCoordinates.at(-2);
    const lastEnd = storyRouteCoordinates.at(-1);
    storyRouteMover.setLatLng([
      lastStart[0] + ((lastEnd[0] - lastStart[0]) * .55),
      lastStart[1] + ((lastEnd[1] - lastStart[1]) * .55)
    ]);
  };

  storyRouteAnimation = requestAnimationFrame(drawFrame);
};

const storyRouteForDay = (story, day) => {
  const coordinates = data.storyRoutes?.[story.id]?.[day.day - 1] || [];
  return day.items.map((title, index) => ({
    title,
    lat:Number(coordinates[index]?.[0]),
    lng:Number(coordinates[index]?.[1])
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
};

const initStoryMap = () => {
  const target = document.querySelector('#story-route-map');
  const Leaflet = window.L;
  if (!target) return;
  if (!Leaflet) {
    target.classList.add('is-unavailable');
    target.innerHTML = `<div class="map-loading"><b>지도를 표시하지 못했습니다</b><span>네트워크 연결 후 다시 열어주세요.</span></div>`;
    return;
  }

  const story = data.stories.find((item) => item.id === route().id) || data.stories[0];
  const day = story.itinerary.find((item) => item.day === activeStoryMapDay) || story.itinerary[0];
  const routePlaces = storyRouteForDay(story, day);
  const coordinates = routePlaces.map((place) => [place.lat, place.lng]);
  storyRouteCoordinates = coordinates;
  storyMap = Leaflet.map(target, { zoomControl:false, attributionControl:true, dragging:true, scrollWheelZoom:true, doubleClickZoom:true, touchZoom:true, keyboard:true, zoomSnap:.5 });
  const tileLayer = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap' }).addTo(storyMap);
  tileLayer.on('tileerror', () => target.classList.add('has-tile-error'));
  Leaflet.polyline(coordinates, { color:'#9dbcf8', weight:6, opacity:.46, dashArray:'4 9', lineCap:'round' }).addTo(storyMap);
  storyRouteLine = Leaflet.polyline(coordinates.length ? [coordinates[0]] : [], { color:'#2f6bff', weight:3.5, opacity:1, lineCap:'round', lineJoin:'round' }).addTo(storyMap);
  routePlaces.forEach((place, index) => {
    const duplicateIndexes = coordinates.reduce((indexes, coordinate, coordinateIndex) => {
      if (Math.abs(coordinate[0] - place.lat) < .000001 && Math.abs(coordinate[1] - place.lng) < .000001) indexes.push(coordinateIndex);
      return indexes;
    }, []);
    const duplicatePosition = duplicateIndexes.indexOf(index);
    const visualOffset = duplicateIndexes.length > 1 ? (duplicatePosition - ((duplicateIndexes.length - 1) / 2)) * 22 : 0;
    const marker = Leaflet.marker([place.lat, place.lng], {
      zIndexOffset:800 + index,
      icon:Leaflet.divIcon({ className:'route-live-marker story-map-marker', html:`<span>${index + 1}</span>`, iconSize:[32,32], iconAnchor:[16 - visualOffset,16] })
    }).addTo(storyMap);
    marker.bindPopup(`<strong>${index + 1}. ${escapeHtml(place.title)}</strong><small>DAY ${day.day} 일정 순서</small>`, { closeButton:false, offset:[0,-10] });
  });
  if (coordinates.length > 1) {
    storyRouteMover = Leaflet.marker(coordinates[0], {
      interactive:false,
      zIndexOffset:650,
      icon:Leaflet.divIcon({ className:'route-moving-marker story-route-mover', html:'<span aria-hidden="true">➜</span>', iconSize:[30,30], iconAnchor:[15,15] })
    }).addTo(storyMap);
  }
  if (coordinates.length > 1) storyMap.fitBounds(coordinates, { padding:[32,32] });
  else if (coordinates.length) storyMap.setView(coordinates[0], 14);
  else storyMap.setView([16.0544,108.2022], 12);
  setTimeout(() => {
    storyMap?.invalidateSize();
    if (storyRouteCoordinates.length > 1) storyMap?.fitBounds(storyRouteCoordinates, { padding:[32,32] });
    animateStoryRoute();
  }, 90);
};

const discoverThemes = [
  { id:'ALL', label:'추천' },
  { id:'BEACH', label:'바다' },
  { id:'FOOD', label:'미식' },
  { id:'GOLF', label:'골프' },
  { id:'FAMILY', label:'가족' }
];

const placeMatchesTheme = (place, themeId) => themeId === 'ALL' || (place.themes || []).includes(themeId) || (themeId === 'FOOD' && place.category === 'RESTAURANT') || (themeId === 'GOLF' && place.category === 'GOLF');

const discoverPlaceCard = (place) => {
  const saved = Boolean(session()) && getCardItems().some((item) => item.sourceId === place.id);
  return `<article class="discover-place-card"><button class="discover-place-media" type="button" data-place-detail="${place.id}" aria-label="${escapeHtml(place.title)} 소개 보기"><img src="${place.image}" alt=""></button><div class="discover-place-copy"><small>${categoryLabel(place.category)} · ${escapeHtml(place.area)}</small><h3>${escapeHtml(place.title)}</h3><p>${escapeHtml(place.description)}</p><div class="discover-place-meta"><span>${place.recommendedTime} 추천</span><b>${formatPrice(place.price)} · ${place.duration}분</b></div><footer><button class="secondary-button" type="button" data-place-detail="${place.id}">소개</button><button class="primary-button ${saved ? 'is-saved' : ''}" type="button" data-add-place="${place.id}" ${saved ? 'disabled' : ''}>${saved ? '담김 ✓' : '여행 카드에 담기'}</button></footer></div></article>`;
};

const discoverView = () => {
  const selectedDestination = data.destinations.find((item) => item.id === activeDiscoverDestination) || data.destinations[0];
  const destinationPlaces = data.places.filter((place) => place.destinationId === selectedDestination.id);
  const filteredPlaces = destinationPlaces.filter((place) => placeMatchesTheme(place, activeDiscoverTheme) && (!discoverQuery || [place.title,place.area,place.description,categoryLabel(place.category)].join(' ').toLowerCase().includes(discoverQuery.toLowerCase())));
  const destinationStories = data.stories.filter((story) => story.destinationId === selectedDestination.id);
  const activeThemeLabel = discoverThemes.find((theme) => theme.id === activeDiscoverTheme)?.label || '추천';
  const destinations = data.destinations.map((item) => `<button class="destination-card ${item.id === selectedDestination.id ? 'is-active' : ''}" type="button" data-destination="${item.id}"><img src="${item.image}" alt="${escapeHtml(item.name)}"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${escapeHtml(item.tagline)}</small><b>가이드 ${item.storyCount} · 장소 ${item.placeCount}</b></div></button>`).join('');
  return `<div class="view"><header class="page-intro discover-intro"><span class="eyebrow">CHOOSE A DESTINATION</span><div class="page-intro-row"><div><h1>여행지 찾기</h1><p>도시와 테마를 고르면 장소와 여행 가이드가 함께 바뀝니다.</p></div><button class="icon-button" type="button" data-open-search aria-label="여행지 검색">${icons.search}</button></div></header><section class="section"><div class="chip-row discover-theme-row">${discoverThemes.map((theme) => `<button class="chip ${theme.id === activeDiscoverTheme ? 'is-active' : ''}" type="button" data-discover-theme="${theme.id}">${theme.label}</button>`).join('')}</div><div class="destination-grid">${destinations}</div></section><section class="discover-focus" data-discover-results><img src="${selectedDestination.image}" alt=""><div><small>NOW EXPLORING</small><h2>${escapeHtml(selectedDestination.name)}</h2><p>${escapeHtml(selectedDestination.tagline)}</p><span>${destinationPlaces.length}개 추천 장소 · ${destinationStories.length || selectedDestination.storyCount}개 가이드</span></div></section><section class="section discover-result-section"><div class="section-head"><div><span class="eyebrow">${escapeHtml(selectedDestination.name.toUpperCase())} · ${activeThemeLabel}</span><h2>${discoverQuery ? `‘${escapeHtml(discoverQuery)}’ 검색 결과` : `${escapeHtml(selectedDestination.name)}에서 많이 담아요`}</h2><p>소개를 확인하고 마음에 드는 장소를 여행 카드에 담으세요.</p></div>${discoverQuery ? '<button class="text-button" type="button" data-clear-discover-query>검색 해제</button>' : ''}</div>${filteredPlaces.length ? `<div class="discover-place-list">${filteredPlaces.map(discoverPlaceCard).join('')}</div>` : `<div class="empty-state">${icons.search}<h2>조건에 맞는 장소가 없어요</h2><p>다른 테마를 선택하거나 검색어를 지워보세요.</p><button class="primary-button" type="button" data-clear-discover-query>전체 추천 보기</button></div>`}</section>${destinationStories.length ? `<section class="section discover-guide-section"><div class="section-head"><div><span class="eyebrow">TRAVEL GUIDE</span><h2>${escapeHtml(selectedDestination.name)} 여행자가 만든 일정</h2><p>완성된 동선을 먼저 보고 내 여행으로 가져올 수 있어요.</p></div><a href="#community">전체보기</a></div><div class="story-reel">${destinationStories.map(storyCard).join('')}</div></section>` : ''}</div>`;
};

const feedCard = (story) => {
  const engagement = getEngagement(story.id);
  return `<article class="feed-card"><header class="feed-author"><span class="avatar">${escapeHtml(story.avatar)}</span><span><strong>${escapeHtml(story.author)}</strong><small>${escapeHtml(story.duration)} · ${escapeHtml(story.companions)}</small></span><button class="more" type="button" aria-label="더보기">···</button></header><a class="feed-cover" href="#story/${story.id}"><img src="${story.cover}" alt="${escapeHtml(story.title)}"><span class="feed-cover-badge">DAY ${story.days} · ${escapeHtml(data.destinations.find((item) => item.id === story.destinationId)?.name || '')}</span></a><div class="feed-body"><h2>${escapeHtml(story.title)}</h2><p>${escapeHtml(story.summary)}</p><div class="tag-list">${story.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div></div><div class="social-actions"><button class="${engagement.liked ? 'is-active' : ''}" type="button" data-like-story="${story.id}">${icons.heart}<span>${formatNumber(story.likes + (engagement.liked ? 1 : 0))}</span></button><button type="button" data-route="story/${story.id}">${icons.comment}<span>${formatNumber(story.comments)}</span></button><button class="${engagement.scrapped ? 'is-active' : ''}" type="button" data-scrap-story="${story.id}">${icons.bookmark}<span>스크랩</span></button><button type="button" data-share-story="${story.id}">${icons.share}<span>공유</span></button></div><div class="feed-copy"><a class="secondary-button" href="#story/${story.id}">가이드 보기</a><button class="primary-button" type="button" data-copy-story="${story.id}">내 여행에 담기</button></div></article>`;
};

const communityFilters = [
  { id:'RECOMMENDED', label:'추천' },
  { id:'danang', label:'다낭' },
  { id:'kyoto', label:'교토' },
  { id:'bangkok', label:'방콕' },
  { id:'FAMILY', label:'가족여행' }
];

const communityView = () => {
  const filteredStories = activeCommunityFilter === 'RECOMMENDED'
    ? data.stories
    : activeCommunityFilter === 'FAMILY'
      ? data.stories.filter((story) => ['story_danang_first','story_bali_slow'].includes(story.id))
      : data.stories.filter((story) => story.destinationId === activeCommunityFilter);
  return `<div class="view"><header class="page-intro"><span class="eyebrow">TRAVEL GUIDES</span><h1>여행 가이드</h1><p>다른 여행자가 만든 일정과 이야기를 보고, 마음에 들면 담아 내 여행으로 수정하세요.</p></header><section class="section"><div class="chip-row">${communityFilters.map((filter) => `<button class="chip ${filter.id === activeCommunityFilter ? 'is-active' : ''}" type="button" data-community-filter="${filter.id}">${filter.label}</button>`).join('')}</div><div class="feed-list">${filteredStories.map(feedCard).join('')}</div></section></div>`;
};

const storyStopDetail = (story, day, index) => {
  const title = day.items[index];
  const destination = data.destinations.find((item) => item.id === story.destinationId) || data.destinations[0];
  const words = title.split(/\s+/).filter((word) => word.length > 1);
  const candidates = data.places.filter((place) => place.destinationId === story.destinationId);
  const matched = candidates.find((place) => place.title.includes(title) || title.includes(place.title)) || candidates.find((place) => words.filter((word) => place.title.includes(word)).length >= 2);
  const lowerTitle = title.toLowerCase();
  const category = matched?.category || (/호텔|리조트|체크인|숙소/.test(title) ? 'HOTEL' : /스파|마사지/.test(title) ? 'SPA' : /디너|브런치|카페|커피|식당|국수|아침|점심|저녁/.test(title) ? 'RESTAURANT' : /공항|이동|픽업/.test(title) ? 'VEHICLE' : lowerTitle.includes('golf') || title.includes('골프') ? 'GOLF' : 'LANDMARK');
  const coordinate = data.storyRoutes?.[story.id]?.[day.day - 1]?.[index] || [];
  const imageByCategory = { HOTEL:'assets/hotel.jpg', RESTAURANT:'assets/restaurant.jpg', SPA:'assets/spa.jpg', GOLF:'assets/golf.jpg', VEHICLE:'assets/danang.jpg', LANDMARK:destination.image };
  const durationByCategory = { HOTEL:60, RESTAURANT:90, SPA:90, GOLF:300, VEHICLE:45, LANDMARK:120 };
  return {
    title,
    placeId:matched?.id || '',
    category,
    categoryName:categoryLabel(category),
    area:matched?.area || `${destination.name} 일정 구간`,
    image:matched?.image || imageByCategory[category] || destination.image,
    description:matched?.description || `${destination.name} 여행의 DAY ${day.day} ${index + 1}번째 장소입니다. 방문 전 운영시간과 이용 조건을 다시 확인하고 일정에 반영하세요.`,
    duration:Number(matched?.duration || durationByCategory[category] || 90),
    price:Number(matched?.price || 0),
    provider:matched ? 'HotelNGo 등록 업체' : `${destination.name} 현지 운영처`,
    hours:matched?.recommendedTime ? `${matched.recommendedTime} 추천` : category === 'RESTAURANT' ? '방문 전 영업시간 확인' : '일정 시간 기준 운영 확인',
    booking:matched ? '옵션 확인 후 예약' : '현장·정보 확인',
    lat:Number(coordinate[0]),
    lng:Number(coordinate[1])
  };
};

const storyMapSummaryMarkup = (day) => `<span>DAY ${day.day}</span><strong>${escapeHtml(day.title)}</strong><small>${day.items.length}개 장소 · 번호 순서로 이동</small>`;
const storyItineraryMarkup = (story, day) => `<article class="itinerary-day is-current" id="story-day-${day.day}"><header><b>DAY ${day.day}</b><strong>${escapeHtml(day.title)}</strong></header><ol>${day.items.map((item, index) => `<li><span>${escapeHtml(item)}</span><button type="button" data-story-stop-detail="${story.id}" data-story-stop-day="${day.day}" data-story-stop-index="${index}">상세보기</button></li>`).join('')}</ol></article>`;

const updateStoryDetailDay = (dayNumber) => {
  const story = data.stories.find((item) => item.id === route().id) || data.stories[0];
  const day = story.itinerary.find((item) => item.day === dayNumber) || story.itinerary[0];
  const scrollTop = window.scrollY;
  activeStoryMapDay = day.day;
  destroyStoryMap();
  document.querySelectorAll('[data-story-map-day]').forEach((button) => {
    const selected = Number(button.dataset.storyMapDay) === day.day;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-current', selected ? 'true' : 'false');
  });
  const summary = document.querySelector('.story-map-summary');
  const map = document.querySelector('#story-route-map');
  const itinerary = document.querySelector('.itinerary-list');
  const itineraryEyebrow = document.querySelector('.itinerary-section .eyebrow');
  if (summary) summary.innerHTML = storyMapSummaryMarkup(day);
  if (map) {
    map.className = 'story-map';
    map.setAttribute('aria-label', `DAY ${day.day} 여행 일정 지도`);
    map.innerHTML = `<div class="map-loading">DAY ${day.day} 지도를 불러오는 중입니다</div>`;
  }
  if (itinerary) itinerary.innerHTML = storyItineraryMarkup(story, day);
  if (itineraryEyebrow) itineraryEyebrow.textContent = `DAY ${day.day} · DAY BY DAY`;
  window.scrollTo(0, scrollTop);
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollTop);
    initStoryMap();
    requestAnimationFrame(() => window.scrollTo(0, scrollTop));
  });
};

const openStoryStopDetail = (storyId, dayNumber, itemIndex) => {
  const story = data.stories.find((item) => item.id === storyId) || data.stories[0];
  const day = story.itinerary.find((item) => item.day === Number(dayNumber)) || story.itinerary[0];
  const detail = storyStopDetail(story, day, Number(itemIndex));
  const coordinateLabel = Number.isFinite(detail.lat) && Number.isFinite(detail.lng) ? `${detail.lat.toFixed(4)}, ${detail.lng.toFixed(4)}` : '좌표 확인 중';
  openSheet('장소 상세', `<article class="story-stop-sheet"><img src="${detail.image}" alt="${escapeHtml(detail.title)}"><div class="story-stop-sheet-copy"><small>${escapeHtml(detail.categoryName)} · ${escapeHtml(detail.area)}</small><h2>${escapeHtml(detail.title)}</h2><p>${escapeHtml(detail.description)}</p><dl><div><dt>운영·정보 제공</dt><dd>${escapeHtml(detail.provider)}</dd></div><div><dt>운영 시간</dt><dd>${escapeHtml(detail.hours)}</dd></div><div><dt>예약 방식</dt><dd>${escapeHtml(detail.booking)}</dd></div><div><dt>추천 체류</dt><dd>${detail.duration}분</dd></div><div><dt>예상 금액</dt><dd>${detail.price ? formatPrice(detail.price) : '현장 확인'}</dd></div><div><dt>지도 좌표</dt><dd>${coordinateLabel}</dd></div></dl>${detail.placeId ? `<button class="primary-button full-button" type="button" data-add-place="${detail.placeId}">여행 카드에 담기</button>` : `<button class="primary-button full-button" type="button" data-copy-story="${story.id}">이 여행 일정 담기</button>`}</div></article>`);
};

const detailView = (id) => {
  const story = data.stories.find((item) => item.id === id) || data.stories[0];
  const engagement = getEngagement(story.id);
  const comments = getComments(story.id);
  if (activeStoryMapId !== story.id) {
    activeStoryMapId = story.id;
    activeStoryMapDay = 1;
  }
  const mapDay = story.itinerary.find((item) => item.day === activeStoryMapDay) || story.itinerary[0];
  return `<div class="view story-detail-view">
    <section class="detail-hero"><img src="${story.cover}" alt="${escapeHtml(story.title)}"><button class="back-button" type="button" aria-label="뒤로" data-route="community">${icons.back}</button><div class="detail-hero-copy"><small>${escapeHtml(story.duration)} · ${escapeHtml(story.companions)}</small><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(story.summary)}</p></div></section>
    <section class="story-engagement-card"><div class="detail-author"><span class="avatar">${escapeHtml(story.avatar)}</span><div><strong>${escapeHtml(story.author)}</strong><small>공개 여행 ${story.days + 8}개 · 일정 인증</small></div><button type="button" data-follow-author>팔로우</button></div><div class="social-actions detail-actions"><button class="${engagement.liked ? 'is-active' : ''}" type="button" data-like-story="${story.id}">${icons.heart}<span>좋아요</span></button><button type="button" data-focus-comment>${icons.comment}<span>댓글 ${comments.length}</span></button><button class="${engagement.scrapped ? 'is-active' : ''}" type="button" data-scrap-story="${story.id}">${icons.bookmark}<span>스크랩</span></button><button type="button" data-share-story="${story.id}">${icons.share}<span>공유</span></button></div></section>
    <nav class="story-map-days story-day-switcher" aria-label="여행 날짜 선택">${story.itinerary.map((day) => `<button class="${day.day === activeStoryMapDay ? 'is-active' : ''}" type="button" data-story-map-day="${day.day}" aria-current="${day.day === activeStoryMapDay ? 'true' : 'false'}"><b>DAY ${day.day}</b><span>${day.items.length}곳</span></button>`).join('')}</nav>
    <section class="section story-route-section"><div class="section-head"><div><span class="eyebrow">ROUTE MAP</span><h2>일정 동선</h2><p>선택한 날짜의 방문 순서와 이동 경로입니다.</p></div></div><div class="story-map-card"><div class="story-map-summary">${storyMapSummaryMarkup(mapDay)}</div><div class="story-map" id="story-route-map" aria-label="DAY ${mapDay.day} 여행 일정 지도"><div class="map-loading">DAY ${mapDay.day} 지도를 불러오는 중입니다</div></div></div></section>
    <section class="section itinerary-section"><div class="section-head"><div><span class="eyebrow">DAY ${mapDay.day} · DAY BY DAY</span><h2>날짜별 일정</h2><p>장소 소개를 확인하고 마음에 들면 내 여행으로 가져오세요.</p></div></div><div class="itinerary-list">${storyItineraryMarkup(story, mapDay)}</div></section>
    <section class="section story-comment-section"><div class="section-head"><div><h2>댓글 ${comments.length}</h2><p>실제로 다녀온 사람에게 일정 팁을 물어보세요.</p></div></div><div class="comment-list">${comments.length ? comments.map((comment) => `<article class="comment"><span class="avatar">${escapeHtml(comment.authorName.slice(0,1))}</span><div><strong>${escapeHtml(comment.authorName)}</strong><p>${escapeHtml(comment.body)}</p></div></article>`).join('') : '<div class="empty-state"><h2>첫 댓글을 남겨보세요</h2><p>동선이나 체류시간에 대해 질문할 수 있습니다.</p></div>'}</div><form class="comment-form" data-comment-form="${story.id}"><input name="comment" type="text" placeholder="댓글을 입력하세요" aria-label="댓글"><button class="primary-button" type="submit">등록</button></form></section>
    <div class="sticky-action detail-sticky-action"><button class="secondary-button" type="button" data-scrap-story="${story.id}">스크랩</button><button class="primary-button" type="button" data-copy-story="${story.id}">내 여행에 담기</button></div>
  </div>`;
};

const myNavView = (active) => `<nav class="chip-row my-nav" aria-label="내 여행 메뉴">
  <button class="chip ${active === 'trips' ? 'is-active' : ''}" type="button" data-route="trips">여행 일정</button>
  <button class="chip ${active === 'bookings' ? 'is-active' : ''}" type="button" data-route="bookings">예약 내역</button>
  <button class="chip ${active === 'card' ? 'is-active' : ''}" type="button" data-route="card">여행 카드</button>
  <button class="chip ${active === 'saved' ? 'is-active' : ''}" type="button" data-route="saved">저장·찜</button>
</nav>`;

const cardView = () => {
  const loggedIn = Boolean(session());
  if (!loggedIn) return `<div class="view"><header class="page-intro"><span class="eyebrow">TRIP CARD</span><h1>여행 카드</h1><p>쇼핑하듯 장소를 담고, 담은 항목으로 일정을 만드세요.</p></header><section class="section"><div class="empty-state">${icons.bookmark}<h2>로그인하면 여행 카드가 저장돼요</h2><p>다른 기기에서도 담은 장소와 여행 가이드를 이어서 볼 수 있습니다.</p><button class="primary-button" type="button" data-route="login">로그인</button></div></section></div>`;
  const groups = cardGroups();
  if (!groups.some((group) => group.id === activeCardDestination)) setActiveCardDestination(groups.find((group) => group.items.length)?.id || 'danang');
  const activeGroup = groups.find((group) => group.id === activeCardDestination) || groups[0];
  const items = activeGroup?.items || [];
  const destinationName = activeGroup?.name || '여행지';
  const selectedIds = new Set(selectedCardIds(activeCardDestination, items));
  const selectedCount = selectedIds.size;
  return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY · ${escapeHtml(session().user.displayName)}님</span><h1>여행 카드</h1><p>여행지별로 모은 장소를 검토하고, 일정에 넣을 장소만 선택하세요.</p></header><section class="section my-nav-section">${myNavView('card')}</section><nav class="card-destination-tabs" aria-label="여행지별 여행 카드">${groups.map((group) => `<button class="${group.id === activeCardDestination ? 'is-active' : ''}" type="button" data-card-destination="${group.id}"><span>${escapeHtml(group.name)}</span><b>${group.items.length}</b></button>`).join('')}</nav><section class="card-summary"><header><div><small>현재 여행지 보관함</small><h2>${escapeHtml(destinationName)} · <span data-card-selection-count>${items.length}개 중 ${selectedCount}개 선택</span></h2></div><b>${data.recommendedPlan.days.length - 1}박 ${data.recommendedPlan.days.length}일</b></header><p class="card-location-rule">${escapeHtml(destinationName)} 안에서 이동 가능한 장소만 묶습니다. 다른 지역은 별도 일정으로 만들어요.</p><div class="ai-draft"><span class="ai-spark">${icons.spark}</span><div><strong>${escapeHtml(destinationName)} 자동 일정 만들기</strong><span data-card-selection-copy>${selectedCount ? `선택한 ${selectedCount}곳만 날짜와 동선에 맞춰 배치합니다.` : '일정에 포함할 장소를 한 곳 이상 선택해주세요.'}</span></div><button type="button" data-generate-plan data-plan-destination="${activeCardDestination}" ${selectedCount ? '' : 'disabled'}>${selectedCount ? `${selectedCount}곳으로 만들기` : '장소 선택 필요'}</button></div></section><section class="section"><div class="section-head card-list-head"><div><h2>${escapeHtml(destinationName)}에 담은 장소</h2><p>체크한 장소만 일정 초안에 반영됩니다. 필요 없는 장소는 삭제할 수 있어요.</p></div><span class="card-list-tools"><button type="button" data-toggle-card-selection>${items.length && selectedCount === items.length ? '전체 해제' : '전체 선택'}</button><a href="#discover">더 담기</a></span></div>${items.length ? `<div class="saved-list">${items.map((item) => { const selected = selectedIds.has(item.id); return `<article class="saved-card ${selected ? 'is-selected' : ''}"><img src="${item.image}" alt="${escapeHtml(item.title)}"><div class="saved-card-copy"><div class="saved-card-top"><small>${categoryLabel(item.category)} · ${escapeHtml(item.area)}</small><label class="card-include-toggle"><input type="checkbox" data-card-select="${escapeHtml(item.id)}" ${selected ? 'checked' : ''}><span>일정에 포함</span></label></div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><footer><span>${formatPrice(item.basePrice)} · ${item.duration}분</span><span class="saved-card-actions"><button type="button" aria-label="${escapeHtml(item.title)} 삭제" data-confirm-remove-card="${escapeHtml(item.id)}">${icons.trash}</button></span></footer></div></article>`; }).join('')}</div>` : `<div class="empty-state">${icons.pin}<h2>${escapeHtml(destinationName)}에 담은 장소가 없어요</h2><p>여행지에서 장소를 담거나, 다른 지역 보관함을 확인해보세요.</p><a class="primary-button" href="#discover">여행지 찾기</a></div>`}</section></div>`;
};

const getRouteEstimate = (day) => {
  const points = day.items.map((item) => ({ ...item, ...planLocation(item) })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const toRadians = (value) => value * (Math.PI / 180);
  const distanceBetween = (from, to) => {
    const earthRadius = 6371;
    const latitude = toRadians(to.lat - from.lat);
    const longitude = toRadians(to.lng - from.lng);
    const value = Math.sin(latitude / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * (Math.sin(longitude / 2) ** 2);
    return earthRadius * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
  };
  const legs = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const distance = distanceBetween(point, next);
    const minutes = Math.max(10, Math.round(((distance / 24) * 60 + 5) / 5) * 5);
    return { from:point, to:next, distance, minutes };
  });
  return {
    legs,
    totalDistance:legs.reduce((sum, item) => sum + item.distance, 0),
    totalMinutes:legs.reduce((sum, item) => sum + item.minutes, 0)
  };
};

const planView = () => {
  const plan = getPlan();
  const day = plan.days.find((item) => item.day === activeDay) || plan.days[0];
  const routeEstimate = getRouteEstimate(day);
  const routeLegs = routeEstimate.legs.map((leg, index) => `
    <div class="route-leg">
      <span class="route-leg-icon">${index + 1}<i>→</i>${index + 2}</span>
      <div><small>${escapeHtml(leg.from.time)} → ${escapeHtml(leg.to.time)} · 차량</small><strong>${escapeHtml(leg.from.title)} → ${escapeHtml(leg.to.title)}</strong></div>
      <em>약 ${leg.minutes}분</em>
    </div>`).join('');
  const routeSummary = routeEstimate.legs.length ? `약 ${routeEstimate.totalMinutes}분 · ${routeEstimate.totalDistance.toFixed(1)}km` : '장소 1곳';
  return `<div class="view">
    <header class="page-intro"><span class="eyebrow">SMART ROUTE</span><h1>${escapeHtml(plan.title)}</h1><p>${escapeHtml(plan.dates)} · 성인 ${plan.people}명 · 충돌 없이 자동 정렬됨</p></header>
    <div class="day-tabs">${plan.days.map((item) => `<button class="${item.day === day.day ? 'is-active' : ''}" type="button" data-plan-day="${item.day}"><strong>DAY ${item.day}</strong><small>${item.date} · ${item.items.length}곳</small></button>`).join('')}</div>
    <section class="route-map-card">
      <div class="route-map-label">${icons.route}<span>DAY ROUTE</span><strong>${routeSummary}</strong></div>
      <div class="route-map" id="plan-route-map" aria-label="DAY ${day.day} 실제 이동 지도"><div class="map-loading">DAY ${day.day} 지도를 불러오는 중입니다</div><span class="map-caption"><b>DAY ${day.day}</b><span data-route-motion-label>${day.items.length > 1 ? `1 → ${day.items.length} 동선` : '선택 장소'}</span></span></div>
      ${routeLegs ? `<div class="route-leg-list">${routeLegs}</div>` : ''}
      <div class="route-map-status"><b>✓</b><span>${routeEstimate.legs.length}개 이동 구간을 시간 순서대로 표시했습니다.</span></div>
      <p class="route-data-note">현재는 실제 위치 좌표를 잇는 예상치입니다. 출발 전 길찾기에서 교통상황을 다시 확인하세요.</p>
    </section>
    <section class="section"><div class="section-head"><div><span class="eyebrow">DAY ${day.day}</span><h2>${escapeHtml(day.title)}</h2><p>지도 핀과 일정 항목을 누르면 장소와 체류시간을 확인할 수 있습니다.</p></div></div><div class="timeline">${day.items.map((item) => `<article class="timeline-item"><time class="timeline-time">${item.time}</time><button class="timeline-card" type="button" data-edit-schedule="${escapeHtml(item.title)}"><small>${categoryIcon(item.type)}${categoryLabel(item.type)}</small><strong>${escapeHtml(item.title)}</strong><span>체류 ${item.duration}분 · 시간 변경 가능</span></button></article>`).join('')}</div><div class="route-ok"><b>✓</b><span>현재 일정은 이동시간과 체류시간이 겹치지 않습니다. 변경 시 가능한 다음 시간을 먼저 제안합니다.</span></div></section>
    <div class="sticky-action"><button class="secondary-button" type="button" data-route="card">장소 수정</button><button class="primary-button" type="button" data-save-plan>내 여행 저장</button></div>
  </div>`;
};

const hotelsView = () => `<div class="view"><header class="page-intro"><span class="eyebrow">STAY IN DANANG</span><div class="page-intro-row"><div><h1>호텔</h1><p>여행지와 호텔명을 함께 검색합니다.</p></div><button class="icon-button" type="button" data-open-search>${icons.search}</button></div></header><section class="section"><div class="chip-row"><button class="chip is-active">추천순</button><button class="chip">가격</button><button class="chip">평점 4.5+</button><button class="chip">해변</button><button class="chip">조식 포함</button></div><div class="hotel-list">${data.hotels.map((hotel) => `<article class="hotel-card"><img src="${hotel.image}" alt="${escapeHtml(hotel.name)}"><div class="hotel-card-body"><small>${escapeHtml(hotel.area)} · ${hotel.badges.join(' · ')}</small><h2>${escapeHtml(hotel.name)}</h2><div class="hotel-card-meta"><b>★ ${hotel.rating} · 후기 ${formatNumber(hotel.reviews)}</b><strong>${formatPrice(hotel.price)}<small>/박</small></strong></div><button class="primary-button full-button" style="margin-top:12px" type="button" data-add-hotel="${hotel.id}">여행 카드에 담고 객실 보기</button></div></article>`).join('')}</div></section></div>`;

const aiView = () => {
  const loggedIn = Boolean(session());
  const savedCount = loggedIn ? getCardItems().length : 0;
  return `<div class="view"><header class="page-intro ai-page-intro"><span class="eyebrow">AI TRIP PLANNER</span><h1>담아둔 장소로<br>여행 초안을 만드세요</h1><p>랜드마크·숙소·식사를 먼저 추천하고, 이동시간과 체류시간을 고려해 날짜별 순서를 정리합니다.</p></header><section class="section"><article class="ai-guide-card"><span class="ai-guide-icon">${icons.spark}</span><div><small>현재 준비 상태</small><h2>${loggedIn ? `여행 카드 ${savedCount}곳` : '로그인 후 내 장소 불러오기'}</h2><p>${loggedIn ? '저장한 장소와 HotelnGo 추천을 섞어 초안을 만들 수 있습니다.' : '로그인하면 여러 기기에서 담아둔 장소와 일정을 이어서 사용할 수 있습니다.'}</p></div></article><ol class="ai-step-list"><li><b>1</b><span><strong>장소를 담아요</strong><small>마음에 드는 랜드마크·호텔·식사를 여행 카드에 저장</small></span></li><li><b>2</b><span><strong>AI가 초안을 만들어요</strong><small>날짜별 동선과 가능한 시간을 먼저 제안</small></span></li><li><b>3</b><span><strong>내 방식으로 바꿔요</strong><small>장소·시간·서비스를 수정한 뒤 내 여행으로 저장</small></span></li></ol><div class="ai-actions">${loggedIn ? `<button class="secondary-button" type="button" data-route="card">여행 카드 확인</button><button class="primary-button" type="button" data-generate-plan>AI 초안 만들기</button>` : `<button class="secondary-button" type="button" data-route="discover">먼저 둘러보기</button><button class="primary-button" type="button" data-route="login">로그인</button>`}</div></section></div>`;
};

const tripsView = () => {
  if (!session()) return `<div class="view"><header class="page-intro"><span class="eyebrow">MY HOTELNGO</span><h1>마이</h1><p>로그인하면 여행 일정, 예약 내역과 담은 장소를 한곳에서 관리할 수 있습니다.</p></header><section class="section"><div class="empty-state">${icons.route}<h2>내 여행을 이어서 보려면 로그인하세요</h2><p>여행 카드와 예약은 HotelnGo 회원 계정에만 저장됩니다.</p><button class="primary-button" type="button" data-route="login">로그인</button></div></section></div>`;
  const trips = read(TRIPS_KEY, []);
  return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY · ${escapeHtml(session().user.displayName)}님</span><h1>내 여행</h1><p>여행 일정, 예약, 담은 장소와 활동을 한곳에서 관리합니다.</p></header><section class="section">${myNavView('trips')}<div class="trip-list"><article class="trip-overview is-primary"><header><div><small>다가오는 여행</small><h2>처음 가는 다낭 4박 5일</h2></div><span class="trip-status">일정 저장</span></header><p>9.20–9.24 · 랜드마크 7 · 숙소 1 · 식사 5<br>예약 확정과 일정 저장은 별도로 관리됩니다.</p><footer><button class="secondary-button" type="button" data-route="plan">일정 열기</button><button class="primary-button" type="button" data-route="hotels">호텔 예약 준비</button></footer></article>${trips.filter((trip) => trip.sourceType === 'COMMUNITY_COPY').map((trip) => `<article class="trip-overview"><header><div><small>여행 가이드에서 담음</small><h2>${escapeHtml(trip.title)}</h2></div><span class="trip-status">수정 가능</span></header><p>${escapeHtml(trip.destination || '')} · 원본과 분리된 나만의 일정입니다.</p><footer><button class="secondary-button" type="button" data-route="plan">일정 편집</button></footer></article>`).join('')}</div></section><section class="section"><button class="secondary-button full-button" type="button" data-logout>로그아웃</button></section></div>`;
};

const bookingStatusClass = (status) => ({CONFIRMED:'is-confirmed',PENDING_SUPPLIER:'is-pending',COMPLETED:'is-completed',CANCELLED:'is-cancelled'}[status] || '');

const bookingCard = (booking) => `<article class="mobile-booking-card">
  <header><span class="booking-category">${categoryIcon(booking.category)}${categoryLabel(booking.category)}</span><span class="booking-status ${bookingStatusClass(booking.status)}">${escapeHtml(booking.statusLabel)}</span></header>
  <div class="mobile-booking-main"><img src="${booking.image}" alt="${escapeHtml(booking.title)}"><div><small>${escapeHtml(booking.destination)} · ${escapeHtml(booking.dateLabel)}</small><h2>${escapeHtml(booking.title)}</h2><p>${escapeHtml(booking.option)}</p></div></div>
  <dl><div><dt>예약번호</dt><dd>${escapeHtml(booking.bookingNo)}</dd></div><div><dt>결제금액</dt><dd>${formatPrice(booking.amount)}</dd></div></dl>
  <footer><button class="secondary-button" type="button" data-booking-detail="${escapeHtml(booking.id)}">예약 상세</button>${booking.tripDay ? `<button class="primary-button" type="button" data-route="plan">일정에서 보기</button>` : ''}</footer>
</article>`;

const guestBookingView = () => {
  const result = guestBookingVisible ? data.bookings[0] : null;
  return `<div class="view"><header class="page-intro"><span class="eyebrow">BOOKING LOOKUP</span><h1>예약 조회</h1><p>예약번호와 예약자 이메일로 비회원 예약을 확인하세요.</p></header><section class="section"><form class="guest-booking-form" data-mobile-booking-lookup><label class="form-field"><span>예약번호</span><input name="bookingNo" value="HNG-2026-00021" required></label><label class="form-field"><span>예약자 이메일</span><input name="email" type="email" value="demo@hotelngo.test" required></label><button class="primary-button full-button" type="submit">예약 확인</button></form>${result ? `<div class="guest-booking-result"><div class="section-head"><div><span class="eyebrow">LOOKUP RESULT</span><h2>예약을 찾았습니다</h2></div></div>${bookingCard(result)}</div>` : '<p class="booking-help">회원 예약은 로그인 후 <strong>내 여행 · 예약 내역</strong>에서 한 번에 볼 수 있습니다.</p>'}</section></div>`;
};

const bookingsView = () => {
  if (!session()) return guestBookingView();
  const bookings = data.bookings || [];
  const filtered = activeBookingFilter === 'ALL' ? bookings : bookings.filter((booking) => booking.status === activeBookingFilter);
  const confirmedCount = bookings.filter((booking) => booking.status === 'CONFIRMED').length;
  const pendingCount = bookings.filter((booking) => booking.status === 'PENDING_SUPPLIER').length;
  return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY · ${escapeHtml(session().user.displayName)}님</span><h1>예약 내역</h1><p>예약 상태와 결제금액을 확인하고 여행 일정으로 이어보세요.</p></header><section class="section">${myNavView('bookings')}<div class="booking-summary"><div><small>예약 확정</small><strong>${confirmedCount}</strong></div><div><small>업체 확인 중</small><strong>${pendingCount}</strong></div><div><small>전체 예약</small><strong>${bookings.length}</strong></div></div><div class="booking-filter" aria-label="예약 상태 필터"><button class="${activeBookingFilter === 'ALL' ? 'is-active' : ''}" type="button" data-booking-filter="ALL">전체</button><button class="${activeBookingFilter === 'CONFIRMED' ? 'is-active' : ''}" type="button" data-booking-filter="CONFIRMED">예약 확정</button><button class="${activeBookingFilter === 'PENDING_SUPPLIER' ? 'is-active' : ''}" type="button" data-booking-filter="PENDING_SUPPLIER">확인 중</button><button class="${activeBookingFilter === 'COMPLETED' ? 'is-active' : ''}" type="button" data-booking-filter="COMPLETED">이용 완료</button></div><div class="mobile-booking-list">${filtered.length ? filtered.map(bookingCard).join('') : `<div class="empty-state">${icons.calendar}<h2>해당 상태의 예약이 없어요</h2><p>다른 상태를 선택해 예약 내역을 확인하세요.</p></div>`}</div></section></div>`;
};

const savedView = () => {
  if (!session()) return `<div class="view"><header class="page-intro"><span class="eyebrow">MY HOTELNGO</span><h1>저장·찜</h1><p>로그인하면 저장한 여행 가이드와 찜한 장소를 볼 수 있습니다.</p></header><section class="section"><div class="empty-state">${icons.bookmark}<h2>저장한 콘텐츠를 보려면 로그인하세요</h2><button class="primary-button" type="button" data-route="login">로그인</button></div></section></div>`;
  const savedStories = data.stories.filter((story) => getEngagement(story.id).scrapped);
  return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY · ${escapeHtml(session().user.displayName)}님</span><h1>저장·찜</h1><p>다시 보고 싶은 여행 가이드와 장소를 모아봅니다.</p></header><section class="section">${myNavView('saved')}<div class="section-head"><div><h2>저장한 여행 가이드</h2><p>가이드를 열어 내 여행에 담거나 원본을 다시 확인하세요.</p></div></div>${savedStories.length ? `<div class="saved-guide-list">${savedStories.map(storyCard).join('')}</div>` : `<div class="empty-state">${icons.bookmark}<h2>아직 저장한 가이드가 없어요</h2><p>여행 가이드에서 스크랩하면 이곳에 모입니다.</p><button class="primary-button" type="button" data-route="community">여행 가이드 보기</button></div>`}</section></div>`;
};

const openBookingDetail = (bookingId) => {
  const booking = (data.bookings || []).find((item) => item.id === bookingId);
  if (!booking) return;
  openSheet('예약 상세', `<article class="booking-detail-sheet"><span class="booking-status ${bookingStatusClass(booking.status)}">${escapeHtml(booking.statusLabel)}</span><h2>${escapeHtml(booking.title)}</h2><p>${escapeHtml(booking.option)}</p><dl><div><dt>예약번호</dt><dd>${escapeHtml(booking.bookingNo)}</dd></div><div><dt>이용 일정</dt><dd>${escapeHtml(booking.dateLabel)}</dd></div><div><dt>이용자</dt><dd>${escapeHtml(booking.guests)}</dd></div><div><dt>결제 상태</dt><dd>${escapeHtml(booking.paymentStatus)}</dd></div><div><dt>결제금액</dt><dd>${formatPrice(booking.amount)}</dd></div></dl><div class="booking-next-action"><strong>다음 안내</strong><p>${escapeHtml(booking.nextAction)}</p></div>${booking.tripDay ? '<button class="primary-button full-button" type="button" data-route="plan">여행 일정에서 확인</button>' : ''}</article>`);
};

const loginView = () => `<div class="view auth-view"><span class="eyebrow">WELCOME BACK</span><h1>로그인</h1><p>여행 카드와 내 여행을 어느 기기에서든 이어서 확인하세요.</p><form class="auth-form" data-mobile-login><label class="form-field"><span>이메일</span><input name="email" type="email" value="demo@hotelngo.test" autocomplete="username" required></label><label class="form-field"><span>비밀번호</span><input name="password" type="password" value="Hotelngo!2026" autocomplete="current-password" required></label><button class="primary-button full-button" type="submit">로그인</button></form><div class="demo-account"><span>화면 검증용 계정이 입력되어 있습니다.</span><button type="button" data-demo-fill>다시 채우기</button></div></div>`;

const openServiceMenu = () => {
  const loggedIn = Boolean(session());
  const accountBlock = loggedIn
    ? `<div class="service-account"><span class="avatar">${escapeHtml(session().user.displayName.slice(0,1))}</span><div><strong>${escapeHtml(session().user.displayName)}님</strong><small>여행 일정과 예약을 관리하세요.</small></div><button type="button" data-route="trips">내 여행</button></div>`
    : `<div class="service-account"><span class="service-login-icon">${icons.route}</span><div><strong>로그인이 필요해요</strong><small>여행 카드와 일정을 안전하게 저장하세요.</small></div><button type="button" data-route="login">로그인</button></div>`;
  openSheet('전체 서비스', `${accountBlock}<div class="service-menu-section"><h3>여행 준비</h3><div class="service-menu-grid"><button type="button" data-route="hotels">${icons.hotel}<span><strong>호텔</strong><small>숙소와 객실 찾기</small></span></button><button type="button" data-route="ai">${icons.spark}<span><strong>AI 여행</strong><small>담은 장소로 일정 초안 만들기</small></span></button><button type="button" data-route="card">${icons.bookmark}<span><strong>여행 카드</strong><small>가고 싶은 곳 모아보기</small></span></button><button type="button" data-route="community">${icons.comment}<span><strong>여행 가이드</strong><small>공유 일정과 여행 이야기</small></span></button></div></div><div class="service-menu-section"><h3>예약·계정</h3><div class="service-list"><button type="button" data-route="bookings">${icons.calendar}<span><strong>예약 조회</strong><small>예약번호와 예약 상태 확인</small></span><b>›</b></button>${loggedIn ? `<button type="button" data-route="trips">${icons.route}<span><strong>내 여행</strong><small>일정·예약·저장·활동 관리</small></span><b>›</b></button><a href="../account-settings.html">${icons.pin}<span><strong>계정 설정</strong><small>회원 정보와 여행자 정보</small></span><b>›</b></a><button class="service-logout" type="button" data-logout>로그아웃</button>` : ''}</div></div>`);
};

const getEngagement = (storyId) => read(ENGAGEMENT_KEY, []).find((item) => item.id === `${userId()}_${storyId}`) || {};
const setEngagement = (storyId, field) => {
  if (!requireLogin(`story/${storyId}`)) return;
  const list = read(ENGAGEMENT_KEY, []);
  const id = `${userId()}_${storyId}`;
  const index = list.findIndex((item) => item.id === id);
  const current = index >= 0 ? list[index] : { id, userId:userId(), tripId:storyId, liked:false, scrapped:false };
  const next = { ...current, [field]:!current[field], updatedAt:new Date().toISOString() };
  if (index >= 0) list[index] = next; else list.unshift(next);
  write(ENGAGEMENT_KEY, list);
  render();
};
const getComments = (storyId) => [...(data.comments || []).filter((item) => item.tripId === storyId), ...read(COMMENTS_KEY, []).filter((item) => item.tripId === storyId)];
const getCardItems = () => read(CARD_KEY, []).filter((item) => item.ownerId === userId());
const destinationMeta = (destinationId) => data.destinations.find((item) => item.id === destinationId) || { id:destinationId, name:destinationId === 'unassigned' ? '지역 미지정' : destinationId, country:'' };
const cardDestinationId = (item = {}) => item.destinationId || data.destinations.find((destination) => [item.destination,item.area,item.title].filter(Boolean).join(' ').includes(destination.name))?.id || 'unassigned';
const cardGroups = () => {
  const items = getCardItems();
  const groups = data.destinations.map((destination) => ({ ...destination, items:items.filter((item) => cardDestinationId(item) === destination.id) }));
  [...new Set(items.map(cardDestinationId))].forEach((destinationId) => {
    if (groups.some((group) => group.id === destinationId)) return;
    const first = items.find((item) => cardDestinationId(item) === destinationId);
    groups.push({ id:destinationId,name:first?.destination || (destinationId === 'unassigned' ? '지역 미지정' : destinationId),country:'',items:items.filter((item) => cardDestinationId(item) === destinationId) });
  });
  return groups;
};
const setActiveCardDestination = (destinationId) => {
  activeCardDestination = destinationId;
  localStorage.setItem(CARD_DESTINATION_KEY, destinationId);
};
const getActiveCardItems = () => getCardItems().filter((item) => cardDestinationId(item) === activeCardDestination);
const getCardSelectionState = () => read(CARD_SELECTION_KEY, {});
const selectedCardIds = (destinationId, items = getCardItems().filter((item) => cardDestinationId(item) === destinationId)) => {
  const state = getCardSelectionState();
  const availableIds = new Set(items.map((item) => item.id));
  if (!Object.prototype.hasOwnProperty.call(state, destinationId)) return items.map((item) => item.id);
  return (state[destinationId] || []).filter((id) => availableIds.has(id));
};
const setCardSelection = (destinationId, ids) => {
  const state = getCardSelectionState();
  state[destinationId] = [...new Set(ids)];
  write(CARD_SELECTION_KEY, state);
};
const getSelectedCardItems = (destinationId) => {
  const items = getCardItems().filter((item) => cardDestinationId(item) === destinationId);
  const ids = new Set(selectedCardIds(destinationId, items));
  return items.filter((item) => ids.has(item.id));
};
const seedDemoCard = () => {
  const all = read(CARD_KEY, []);
  if (all.some((item) => item.ownerId === userId())) return;
  const seed = ['mykhe','hanmarket','madamelan','danang_hotel'].map((id) => {
    const place = data.places.find((item) => item.id === id);
    return { id:`${userId()}_danang_${id}`,ownerId:userId(),sourceId:id,sourceType:place.category,destinationId:'danang',destination:'다낭',category:place.category,title:place.title,area:place.area,image:place.image,description:place.description,duration:place.duration,recommendedTime:place.recommendedTime,basePrice:place.price,lat:place.lat,lng:place.lng,status:'SAVED',addedAt:new Date().toISOString() };
  });
  write(CARD_KEY, [...seed,...all]);
};
const getPlan = () => read('hotelngo.mobile.plan.v1', data.recommendedPlan);

const copyStory = (storyId) => {
  if (!requireLogin(`story/${storyId}`, `copy:${storyId}`)) return;
  const story = data.stories.find((item) => item.id === storyId);
  const trips = read(TRIPS_KEY, []);
  if (!trips.some((trip) => trip.sourceTripId === storyId && trip.ownerId === userId())) trips.unshift({ id:`trip_${Date.now()}`,ownerId:userId(),sourceTripId:storyId,sourceType:'COMMUNITY_COPY',title:story.title,destination:data.destinations.find((item) => item.id === story.destinationId)?.name,days:story.itinerary,createdAt:new Date().toISOString() });
  write(TRIPS_KEY, trips);
  toast('여행 가이드를 내 여행에 담았습니다. 자유롭게 수정할 수 있어요.');
  window.HotelnGoNative?.haptic('Medium');
};

const addPlace = (placeId) => {
  if (!requireLogin('discover', `place:${placeId}`)) return;
  const place = data.places.find((item) => item.id === placeId);
  const list = read(CARD_KEY, []);
  if (list.some((item) => item.ownerId === userId() && item.sourceId === placeId)) return toast('이미 여행 카드에 담긴 장소입니다.');
  const destinationId = place.destinationId || 'unassigned';
  const destination = destinationMeta(destinationId);
  const cardItem = { id:`${userId()}_${destinationId}_${place.id}`,ownerId:userId(),sourceId:place.id,sourceType:place.category,destinationId,destination:destination.name,category:place.category,title:place.title,area:place.area,image:place.image,description:place.description,duration:place.duration,recommendedTime:place.recommendedTime,basePrice:place.price,lat:place.lat,lng:place.lng,status:'SAVED',addedAt:new Date().toISOString() };
  list.unshift(cardItem);
  write(CARD_KEY, list);
  const selectionState = getCardSelectionState();
  if (Object.prototype.hasOwnProperty.call(selectionState, destinationId)) {
    setCardSelection(destinationId, [...(selectionState[destinationId] || []), cardItem.id]);
  }
  setActiveCardDestination(destinationId);
  toast(`${place.title}을 여행 카드에 담았습니다.`);
  window.HotelnGoNative?.haptic('Light');
  document.querySelectorAll(`[data-add-place="${placeId}"]`).forEach((button) => {
    button.disabled = true;
    button.classList.add('is-saved');
    button.textContent = '담김 ✓';
  });
};

const openPlaceDetail = (placeId) => {
  const place = data.places.find((item) => item.id === placeId);
  if (!place) return;
  const destination = destinationMeta(place.destinationId);
  const saved = Boolean(session()) && getCardItems().some((item) => item.sourceId === place.id);
  openSheet(place.title, `<article class="place-detail-sheet"><img src="${place.image}" alt=""><div class="place-detail-sheet-copy"><small>${categoryLabel(place.category)} · ${escapeHtml(destination.name)} ${escapeHtml(place.area)}</small><p>${escapeHtml(place.description)}</p><dl><div><dt>추천 시간</dt><dd>${escapeHtml(place.recommendedTime)}</dd></div><div><dt>예상 체류</dt><dd>${place.duration}분</dd></div><div><dt>기본 비용</dt><dd>${formatPrice(place.price)}</dd></div></dl><div class="place-detail-actions"><button class="secondary-button" type="button" data-close-sheet>계속 둘러보기</button><button class="primary-button ${saved ? 'is-saved' : ''}" type="button" data-add-place="${place.id}" ${saved ? 'disabled' : ''}>${saved ? '여행 카드에 담김 ✓' : '여행 카드에 담기'}</button></div></div></article>`);
};

const openCardRemoveConfirm = (cardId) => {
  const item = getCardItems().find((candidate) => candidate.id === cardId);
  if (!item) return;
  openSheet('여행 카드에서 삭제', `<div class="card-remove-confirm"><img src="${item.image}" alt=""><div><small>${categoryLabel(item.category)} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><p>삭제하면 이 여행지의 일정 초안에도 더 이상 포함되지 않습니다.</p></div></div><div class="sheet-confirm-actions"><button type="button" data-close-sheet>취소</button><button class="is-danger" type="button" data-remove-card="${escapeHtml(item.id)}">삭제하기</button></div>`);
};

const removeCardItem = (cardId) => {
  const list = read(CARD_KEY, []);
  const item = list.find((candidate) => candidate.id === cardId && candidate.ownerId === userId());
  if (!item) return;
  const destinationId = cardDestinationId(item);
  write(CARD_KEY, list.filter((candidate) => candidate.id !== cardId));
  const selectionState = getCardSelectionState();
  if (Object.prototype.hasOwnProperty.call(selectionState, destinationId)) {
    setCardSelection(destinationId, (selectionState[destinationId] || []).filter((id) => id !== cardId));
  }
  closeSheet();
  render();
  window.HotelnGoNative?.haptic('Light');
  toast(`${item.title}을 여행 카드에서 삭제했습니다.`);
};

const syncCardSelectionUi = () => {
  const items = getCardItems().filter((item) => cardDestinationId(item) === activeCardDestination);
  const selected = new Set(selectedCardIds(activeCardDestination, items));
  document.querySelectorAll('[data-card-select]').forEach((checkbox) => {
    checkbox.checked = selected.has(checkbox.dataset.cardSelect);
    checkbox.closest('.saved-card')?.classList.toggle('is-selected', checkbox.checked);
  });
  const count = selected.size;
  const countLabel = document.querySelector('[data-card-selection-count]');
  if (countLabel) countLabel.textContent = `${items.length}개 중 ${count}개 선택`;
  const copy = document.querySelector('[data-card-selection-copy]');
  if (copy) copy.textContent = count ? `선택한 ${count}곳만 날짜와 동선에 맞춰 배치합니다.` : '일정에 포함할 장소를 한 곳 이상 선택해주세요.';
  const generate = document.querySelector('[data-generate-plan]');
  if (generate) {
    generate.disabled = count === 0;
    generate.textContent = count ? `${count}곳으로 만들기` : '장소 선택 필요';
  }
  const toggle = document.querySelector('[data-toggle-card-selection]');
  if (toggle) toggle.textContent = items.length && count === items.length ? '전체 해제' : '전체 선택';
};

const buildPlanFromCard = (destinationId) => {
  const destination = destinationMeta(destinationId);
  const saved = getSelectedCardItems(destinationId);
  if (!saved.length) return null;
  const base = destinationId === data.recommendedPlan.destinationId ? data.recommendedPlan : null;
  const dayCount = base?.days?.length || 5;
  const days = Array.from({ length:dayCount }, (_, index) => ({
    day:index + 1,
    date:base?.days?.[index]?.date || `${index + 1}일차`,
    title:base?.days?.[index]?.title || `${destination.name}에서 보내는 ${index + 1}일`,
    items:[]
  }));
  const slots = ['09:00','13:00','17:00'];
  const ordered = [...saved].sort((a, b) => ({HOTEL:0,LANDMARK:1,RESTAURANT:2,GOLF:3,SPA:4,TOUR:5,VEHICLE:6}[a.category] ?? 9) - ({HOTEL:0,LANDMARK:1,RESTAURANT:2,GOLF:3,SPA:4,TOUR:5,VEHICLE:6}[b.category] ?? 9));
  ordered.forEach((item, index) => {
    const dayIndex = item.category === 'HOTEL' ? 0 : Math.min(index % dayCount, dayCount - 1);
    const sequence = days[dayIndex].items.length;
    days[dayIndex].items.push({ time:slots[Math.min(sequence, slots.length - 1)], type:item.category, title:item.title, duration:Number(item.duration || 60), lat:Number(item.lat) || null, lng:Number(item.lng) || null, source:'SAVED' });
  });
  return { id:`card_plan_${destinationId}_${Date.now()}`,title:`${destination.name} ${dayCount - 1}박 ${dayCount}일`,destinationId,destination:destination.name,dates:base?.dates || '날짜를 정해주세요',people:base?.people || 2,source:'TRIP_CARD',savedCount:saved.length,days };
};

const openSearch = () => openSheet('여행지와 장소 검색', `<form class="search-form" data-mobile-search><input name="query" type="search" placeholder="도시, 랜드마크, 호텔명" autocomplete="off"><button class="primary-button" type="submit" data-mobile-search-submit>검색</button></form><p class="search-guide">도시를 고르거나 ‘미케 비치’, ‘시장’, ‘호텔’처럼 장소를 검색해보세요.</p><div class="search-result-list">${data.destinations.map((item) => `<button class="search-result" type="button" data-search-destination="${item.id}"><img src="${item.image}" alt=""><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${item.placeCount}개 장소</small></span><b>›</b></button>`).join('')}</div>`);

const openScheduleEditor = (title) => openSheet('시간과 체류시간 변경', `<div class="section-head"><div><span class="eyebrow">SCHEDULE OPTION</span><h2>${escapeHtml(title)}</h2><p>현재 일정과 겹치지 않는 시간만 먼저 보여줍니다.</p></div></div><div class="chip-row" style="margin-left:0;margin-right:0;padding:0"><button class="chip is-active">추천 10:30</button><button class="chip">11:00</button><button class="chip">14:30</button></div><label class="form-field"><span>체류시간</span><select style="height:50px;border:1px solid var(--line);border-radius:13px;padding:0 12px"><option>60분</option><option selected>90분</option><option>120분</option></select></label><button class="primary-button full-button" style="margin-top:16px" type="button" data-apply-schedule>변경 적용</button>`);

const render = () => {
  const current = route();
  setActiveNav(current.name);
  const loggedIn = Boolean(session());
  const profileButton = document.querySelector('.profile-button');
  document.querySelector('[data-notification-button]').hidden = !loggedIn;
  const initial = loggedIn ? session().user.displayName.slice(0,1) : '로그인';
  document.querySelector('[data-profile-initial]').textContent = initial;
  profileButton.dataset.route = loggedIn ? 'trips' : 'login';
  profileButton.setAttribute('aria-label', loggedIn ? `${session().user.displayName}님의 내 여행 열기` : '로그인');
  profileButton.classList.toggle('is-login', !loggedIn);
  const views = {home:homeView,discover:discoverView,community:communityView,story:()=>detailView(current.id),card:cardView,plan:planView,hotels:hotelsView,ai:aiView,trips:tripsView,bookings:bookingsView,saved:savedView,login:loginView};
  destroyPlanMap();
  destroyStoryMap();
  main.innerHTML = (views[current.name] || homeView)();
  requestAnimationFrame(() => {
    initPlanMap();
    initStoryMap();
  });
  main.focus({ preventScroll:true });
  scrollTo({ top:0, behavior:'instant' });
};

document.addEventListener('click', async (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) { if (!sheetLayer.hidden) closeSheet(); location.hash = routeButton.dataset.route; return; }
  if (event.target.closest('[data-open-menu]')) return openServiceMenu();
  if (event.target.closest('[data-open-search]')) return openSearch();
  if (event.target.closest('[data-mobile-search-submit]')) {
    event.preventDefault();
    event.target.closest('form')?.requestSubmit();
    return;
  }
  if (event.target.closest('[data-close-sheet]') || event.target === sheetLayer) return closeSheet();
  const homeDestination = event.target.closest('[data-home-destination]');
  if (homeDestination) {
    activeDiscoverDestination = homeDestination.dataset.homeDestination;
    activeDiscoverTheme = 'ALL';
    discoverQuery = '';
    location.hash = 'discover';
    return;
  }
  const homeTheme = event.target.closest('[data-home-theme]');
  if (homeTheme) {
    activeDiscoverTheme = homeTheme.dataset.homeTheme;
    discoverQuery = '';
    location.hash = 'discover';
    return;
  }
  const communityFilter = event.target.closest('[data-community-filter]');
  if (communityFilter) {
    activeCommunityFilter = communityFilter.dataset.communityFilter;
    render();
    return;
  }
  const discoverTheme = event.target.closest('[data-discover-theme]');
  if (discoverTheme) {
    activeDiscoverTheme = discoverTheme.dataset.discoverTheme;
    discoverQuery = '';
    render();
    requestAnimationFrame(() => document.querySelector('[data-discover-results]')?.scrollIntoView({ behavior:'smooth', block:'start' }));
    return;
  }
  const placeDetail = event.target.closest('[data-place-detail]');
  if (placeDetail) return openPlaceDetail(placeDetail.dataset.placeDetail);
  const storyStop = event.target.closest('[data-story-stop-detail]');
  if (storyStop) return openStoryStopDetail(storyStop.dataset.storyStopDetail, storyStop.dataset.storyStopDay, storyStop.dataset.storyStopIndex);
  if (event.target.closest('[data-clear-discover-query]')) {
    discoverQuery = '';
    activeDiscoverTheme = 'ALL';
    render();
    return;
  }
  const cardDestination = event.target.closest('[data-card-destination]');
  if (cardDestination) { setActiveCardDestination(cardDestination.dataset.cardDestination); render(); return; }
  const toggleCardSelection = event.target.closest('[data-toggle-card-selection]');
  if (toggleCardSelection) {
    const items = getCardItems().filter((item) => cardDestinationId(item) === activeCardDestination);
    const selected = selectedCardIds(activeCardDestination, items);
    setCardSelection(activeCardDestination, selected.length === items.length ? [] : items.map((item) => item.id));
    syncCardSelectionUi();
    return;
  }
  const destination = event.target.closest('[data-destination],[data-search-destination]');
  if (destination) {
    activeDiscoverDestination = destination.dataset.destination || destination.dataset.searchDestination;
    activeDiscoverTheme = 'ALL';
    discoverQuery = '';
    closeSheet();
    if (route().name !== 'discover') location.hash = 'discover';
    else {
      render();
      requestAnimationFrame(() => document.querySelector('[data-discover-results]')?.scrollIntoView({ behavior:'smooth', block:'start' }));
    }
    toast(`${destinationMeta(activeDiscoverDestination).name} 추천 장소를 불러왔습니다.`);
    return;
  }
  const bookingFilter = event.target.closest('[data-booking-filter]');
  if (bookingFilter) { activeBookingFilter = bookingFilter.dataset.bookingFilter; render(); return; }
  const bookingDetail = event.target.closest('[data-booking-detail]');
  if (bookingDetail) return openBookingDetail(bookingDetail.dataset.bookingDetail);
  const add = event.target.closest('[data-add-place]');
  if (add) return addPlace(add.dataset.addPlace);
  const addHotel = event.target.closest('[data-add-hotel]');
  if (addHotel) { const hotel = data.hotels.find((item) => item.id === addHotel.dataset.addHotel); if (!requireLogin('hotels')) return; const place = data.places.find((item) => item.category === 'HOTEL'); addPlace(place.id); toast(`${hotel.name}을 여행 카드에 담았습니다. 객실 옵션은 예약 단계에서 선택합니다.`); return; }
  const confirmRemove = event.target.closest('[data-confirm-remove-card]');
  if (confirmRemove) return openCardRemoveConfirm(confirmRemove.dataset.confirmRemoveCard);
  const remove = event.target.closest('[data-remove-card]');
  if (remove) return removeCardItem(remove.dataset.removeCard);
  const like = event.target.closest('[data-like-story]');
  if (like) return setEngagement(like.dataset.likeStory, 'liked');
  const scrap = event.target.closest('[data-scrap-story]');
  if (scrap) return setEngagement(scrap.dataset.scrapStory, 'scrapped');
  const copy = event.target.closest('[data-copy-story]');
  if (copy) return copyStory(copy.dataset.copyStory);
  const share = event.target.closest('[data-share-story]');
  if (share) { const story = data.stories.find((item) => item.id === share.dataset.shareStory); try { await window.HotelnGoNative.share({title:story.title,text:story.summary,url:`${location.origin}${location.pathname}#story/${story.id}`}); toast('공유 화면을 열었습니다.'); } catch { toast('공유 링크를 만들지 못했습니다.'); } return; }
  const day = event.target.closest('[data-plan-day]');
  if (day) { activeDay = Number(day.dataset.planDay); render(); return; }
  const storyMapDay = event.target.closest('[data-story-map-day]');
  if (storyMapDay) {
    updateStoryDetailDay(Number(storyMapDay.dataset.storyMapDay));
    window.HotelnGoNative?.haptic('Light');
    return;
  }
  const edit = event.target.closest('[data-edit-schedule]');
  if (edit) return openScheduleEditor(edit.dataset.editSchedule);
  if (event.target.closest('[data-apply-schedule]')) { closeSheet(); toast('겹치지 않는 시간으로 변경했습니다.'); return; }
  const generatePlan = event.target.closest('[data-generate-plan]');
  if (generatePlan) {
    const requestedDestination = generatePlan.dataset.planDestination || activeCardDestination;
    const destinationId = getCardItems().some((item) => cardDestinationId(item) === requestedDestination) ? requestedDestination : cardGroups().find((group) => group.items.length)?.id;
    const plan = buildPlanFromCard(destinationId);
    if (!plan) return toast('일정에 포함할 장소를 한 곳 이상 선택해주세요.');
    write('hotelngo.mobile.plan.v1', plan);
    activeDay = 1;
    window.HotelnGoNative?.haptic('Heavy');
    toast(`${destinationMeta(destinationId).name}에서 선택한 장소만 일정에 반영했습니다.`);
    location.hash = 'plan';
    return;
  }
  if (event.target.closest('[data-save-plan]')) { if (!requireLogin('plan')) return; toast('내 여행에 일정을 저장했습니다.'); window.HotelnGoNative?.haptic('Medium'); return; }
  if (event.target.closest('[data-focus-comment]')) { document.querySelector('.comment-form input')?.focus(); return; }
  if (event.target.closest('[data-follow-author]')) { if (!requireLogin(route().raw)) return; event.target.closest('button').textContent = '팔로잉'; toast('작성자를 팔로우했습니다.'); return; }
  if (event.target.closest('[data-demo-fill]')) { const form=document.querySelector('[data-mobile-login]'); form.email.value='demo@hotelngo.test'; form.password.value='Hotelngo!2026'; return; }
  if (event.target.closest('[data-logout]')) { sessionStorage.removeItem(SESSION_KEY); toast('로그아웃했습니다.'); render(); }
});

document.addEventListener('change', (event) => {
  const checkbox = event.target.closest('[data-card-select]');
  if (!checkbox) return;
  const items = getCardItems().filter((item) => cardDestinationId(item) === activeCardDestination);
  const selected = new Set(selectedCardIds(activeCardDestination, items));
  if (checkbox.checked) selected.add(checkbox.dataset.cardSelect);
  else selected.delete(checkbox.dataset.cardSelect);
  setCardSelection(activeCardDestination, [...selected]);
  syncCardSelectionUi();
  window.HotelnGoNative?.haptic('Light');
});

document.addEventListener('submit', (event) => {
  const login = event.target.closest('[data-mobile-login]');
  if (login) {
    event.preventDefault();
    const form = new FormData(login);
    if (form.get('email') !== 'demo@hotelngo.test' || form.get('password') !== 'Hotelngo!2026') return toast('데모 계정 정보를 확인해주세요.');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({user:{id:'usr_demo_jiho',email:'demo@hotelngo.test',name:'김지호',displayName:'지호',roles:['TRAVELER']},issuedAt:new Date().toISOString()}));
    seedDemoCard();
    const returnRoute = sessionStorage.getItem(RETURN_KEY) || 'trips';
    const pendingAction = sessionStorage.getItem(PENDING_KEY) || '';
    sessionStorage.removeItem(RETURN_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (pendingAction.startsWith('copy:')) copyStory(pendingAction.slice(5));
    if (pendingAction.startsWith('place:')) addPlace(pendingAction.slice(6));
    location.hash = returnRoute;
    toast('로그인했습니다.');
    return;
  }
  const comment = event.target.closest('[data-comment-form]');
  if (comment) {
    event.preventDefault();
    if (!requireLogin(route().raw)) return;
    const body = String(new FormData(comment).get('comment') || '').trim();
    if (!body) return;
    const comments = read(COMMENTS_KEY, []);
    comments.unshift({id:`comment_${Date.now()}`,tripId:comment.dataset.commentForm,userId:userId(),authorName:session().user.displayName,body,createdAt:new Date().toISOString()});
    write(COMMENTS_KEY, comments);
    render();
    toast('댓글을 등록했습니다.');
    return;
  }
  const search = event.target.closest('[data-mobile-search]');
  if (search) {
    event.preventDefault();
    const query = String(new FormData(search).get('query') || '').trim();
    if (!query) return toast('검색어를 입력해주세요.');
    const normalized = query.toLowerCase();
    const destination = data.destinations.find((item) => [item.name,item.country,item.tagline].join(' ').toLowerCase().includes(normalized));
    const place = data.places.find((item) => [item.title,item.area,item.description,categoryLabel(item.category)].join(' ').toLowerCase().includes(normalized));
    if (!destination && !place) return toast(`‘${query}’에 맞는 여행지나 장소가 없어요.`);
    activeDiscoverDestination = destination?.id || place.destinationId;
    activeDiscoverTheme = 'ALL';
    discoverQuery = destination ? '' : query;
    closeSheet();
    if (route().name !== 'discover') location.hash = 'discover';
    else render();
    toast(destination ? `${destination.name} 추천을 열었습니다.` : `‘${query}’ 검색 결과를 찾았습니다.`);
  }
  const bookingLookup = event.target.closest('[data-mobile-booking-lookup]');
  if (bookingLookup) {
    event.preventDefault();
    const form = new FormData(bookingLookup);
    guestBookingVisible = form.get('bookingNo') === 'HNG-2026-00021' && form.get('email') === 'demo@hotelngo.test';
    render();
    toast(guestBookingVisible ? '예약을 찾았습니다.' : '예약번호와 이메일을 다시 확인해주세요.');
  }
});

addEventListener('hashchange', render);
addEventListener('online', () => { document.querySelector('[data-network-status]').hidden = true; });
addEventListener('offline', () => { document.querySelector('[data-network-status]').hidden = false; });

try {
  const response = await fetch('data/mobile-app.json', { cache:'no-store' });
  if (!response.ok) throw new Error('mobile fixture unavailable');
  data = await response.json();
  render();
} catch (error) {
  main.innerHTML = `<section class="auth-view"><span class="eyebrow">OFFLINE</span><h1>앱 데이터를 불러오지 못했습니다</h1><p>인터넷 연결을 확인한 후 다시 시도해주세요.</p><button class="primary-button" type="button" onclick="location.reload()">다시 시도</button></section>`;
}
