const SESSION_KEY = 'hotelngo.mock.session.v1';
const CARD_KEY = 'hotelngo.api.state.v1.trip-card';
const TRIPS_KEY = 'hotelngo.api.state.v1.trips';
const ENGAGEMENT_KEY = 'hotelngo.api.state.v1.community-engagements';
const COMMENTS_KEY = 'hotelngo.api.state.v1.community-comments';
const RETURN_KEY = 'hotelngo.mobile.return.v1';
const PENDING_KEY = 'hotelngo.mobile.pending-action.v1';

const main = document.querySelector('#app-main');
const toastElement = document.querySelector('[data-toast]');
const sheetLayer = document.querySelector('[data-sheet-layer]');
let data;
let activeDay = 1;
let toastTimer;
let planMap;

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
  calendar:'<svg viewBox="0 0 24 24"><path d="M5 3v3M19 3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"/></svg>'
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const session = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
const userId = () => session()?.user?.id || '';
const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Number(value || 0));
const formatPrice = (value) => Number(value) ? `${formatNumber(value)}원` : '무료';
const categoryLabel = (category) => ({LANDMARK:'랜드마크',HOTEL:'숙소',RESTAURANT:'식사·카페',SPA:'마사지·스파',GOLF:'골프',TOUR:'투어·체험',VEHICLE:'이동'}[category] || category);

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
  const navName = name === 'story' ? 'community' : name === 'plan' ? 'card' : name === 'login' ? 'trips' : name;
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

const homeView = () => `
  <div class="view home-view">
    <section class="home-hero">
      <div class="home-hero-copy"><span class="eyebrow">DANANG JOURNEY</span><span class="weather">☀ 다낭 29°</span><h1>다낭에서 무엇을 찾으세요?</h1><p>장소를 찾거나 다른 여행자의 일정을 담아 시작하세요.</p></div>
      <button class="search-launcher" type="button" data-open-search>${icons.search}<span><strong>여행지·랜드마크·호텔 검색</strong><small>예: 미케 비치, 오션 리조트</small></span></button>
      <nav class="home-start-actions" aria-label="여행 시작 방법"><a href="#discover">${icons.pin}<span>추천 장소</span></a><a href="#community">${icons.comment}<span>인기 여행기</span></a><a href="#card">${icons.spark}<span>AI 일정 초안</span></a></nav>
    </section>
    <section class="continue-card"><div class="continue-card-top"><div><small>최근 만들던 여행 · 3/5단계</small><strong>처음 가는 다낭 4박 5일</strong><span>랜드마크 4 · 상세 서비스 3</span></div><button class="soft-button" type="button" data-route="plan">이어가기</button></div><div class="progress-track"><i></i></div></section>
    <section class="section" style="margin-top:28px"><div class="section-head"><div><span class="eyebrow">TRAVEL STORIES</span><h2>다른 여행자가 먼저 가봤어요</h2><p>마음에 드는 여행은 그대로 담은 뒤 수정하세요.</p></div><a href="#community">전체보기</a></div><div class="story-reel">${data.stories.map(storyCard).join('')}</div><div class="swipe-hint"><i></i>옆으로 넘겨 여행기를 둘러보세요</div></section>
    <section class="section"><div class="section-head"><div><h2>빠르게 찾기</h2><p>목적에 맞는 항목부터 살펴보세요.</p></div></div><div class="quick-grid">
      <a href="#hotels">${icons.hotel}<span>숙소</span></a><a href="#discover">${icons.pin}<span>랜드마크</span></a><a href="#discover">${icons.route}<span>즐길거리</span></a><a href="#card">${icons.spark}<span>AI 일정</span></a>
    </div></section>
  </div>`;

const destroyPlanMap = () => {
  if (!planMap) return;
  planMap.remove();
  planMap = undefined;
};

const planLocation = (item) => {
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
  planMap = Leaflet.map(target, { zoomControl:false, attributionControl:true, dragging:true, scrollWheelZoom:false, doubleClickZoom:false, touchZoom:true, keyboard:false });
  const tileLayer = Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap' }).addTo(planMap);
  tileLayer.on('tileerror', () => target.classList.add('has-tile-error'));

  const coordinates = routePlaces.map((place) => [place.lat, place.lng]);
  Leaflet.polyline(coordinates, { color:'#2f6bff', weight:4, opacity:.9, dashArray:'8 6' }).addTo(planMap);
  routePlaces.forEach((place, index) => {
    const marker = Leaflet.marker([place.lat, place.lng], {
      icon:Leaflet.divIcon({ className:'route-live-marker', html:`<span>${index + 1}</span>`, iconSize:[32,32], iconAnchor:[16,16] })
    }).addTo(planMap);
    marker.bindPopup(`<strong>${escapeHtml(place.time)} · ${escapeHtml(place.title)}</strong><small>${escapeHtml(place.area || '')} · 체류 ${place.duration}분</small>`, { closeButton:false, offset:[0,-10] });
  });
  if (coordinates.length > 1) planMap.fitBounds(coordinates, { padding:[26,26] });
  else if (coordinates.length === 1) planMap.setView(coordinates[0], 14);
  setTimeout(() => planMap?.invalidateSize(), 60);
};

const discoverView = () => {
  const destinations = data.destinations.map((item) => `<button class="destination-card" type="button" data-destination="${item.id}"><img src="${item.image}" alt="${escapeHtml(item.name)}"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${escapeHtml(item.tagline)}</small><b>여행기 ${item.storyCount} · 장소 ${item.placeCount}</b></div></button>`).join('');
  const places = data.places.slice(0,4).map((place) => `<article class="saved-card"><img src="${place.image}" alt="${escapeHtml(place.title)}"><div class="saved-card-copy"><small>${categoryLabel(place.category)} · ${escapeHtml(place.area)}</small><strong>${escapeHtml(place.title)}</strong><p>${escapeHtml(place.description)}</p><footer><span>${formatPrice(place.price)} · ${place.duration}분</span><button type="button" aria-label="여행 카드에 담기" data-add-place="${place.id}">＋</button></footer></div></article>`).join('');
  return `<div class="view"><header class="page-intro"><span class="eyebrow">DISCOVER BY PLACE</span><div class="page-intro-row"><div><h1>여행 발견</h1><p>지역을 먼저 고르면 여행기와 장소를 함께 추천합니다.</p></div><button class="icon-button" type="button" data-open-search>${icons.search}</button></div></header><section class="section"><div class="chip-row"><button class="chip is-active">추천</button><button class="chip">바다</button><button class="chip">미식</button><button class="chip">골프</button><button class="chip">가족</button></div><div class="destination-grid">${destinations}</div></section><section class="section"><div class="section-head"><div><h2>다낭에서 많이 담아요</h2><p>장소를 담으면 AI가 이동 가능한 순서로 정리합니다.</p></div></div><div class="saved-list">${places}</div></section></div>`;
};

const feedCard = (story) => {
  const engagement = getEngagement(story.id);
  return `<article class="feed-card"><header class="feed-author"><span class="avatar">${escapeHtml(story.avatar)}</span><span><strong>${escapeHtml(story.author)}</strong><small>${escapeHtml(story.duration)} · ${escapeHtml(story.companions)}</small></span><button class="more" type="button" aria-label="더보기">···</button></header><a class="feed-cover" href="#story/${story.id}"><img src="${story.cover}" alt="${escapeHtml(story.title)}"><span class="feed-cover-badge">DAY ${story.days} · ${escapeHtml(data.destinations.find((item) => item.id === story.destinationId)?.name || '')}</span></a><div class="feed-body"><h2>${escapeHtml(story.title)}</h2><p>${escapeHtml(story.summary)}</p><div class="tag-list">${story.tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div></div><div class="social-actions"><button class="${engagement.liked ? 'is-active' : ''}" type="button" data-like-story="${story.id}">${icons.heart}<span>${formatNumber(story.likes + (engagement.liked ? 1 : 0))}</span></button><button type="button" data-route="story/${story.id}">${icons.comment}<span>${formatNumber(story.comments)}</span></button><button class="${engagement.scrapped ? 'is-active' : ''}" type="button" data-scrap-story="${story.id}">${icons.bookmark}<span>스크랩</span></button><button type="button" data-share-story="${story.id}">${icons.share}<span>공유</span></button></div><div class="feed-copy"><a class="secondary-button" href="#story/${story.id}">여행기 보기</a><button class="primary-button" type="button" data-copy-story="${story.id}">내 여행에 담기</button></div></article>`;
};

const communityView = () => `<div class="view"><header class="page-intro"><span class="eyebrow">TRAVEL COMMUNITY</span><h1>여행기</h1><p>여행자가 직접 만든 동선을 보고, 댓글로 묻고, 내 여행으로 가져와 수정하세요.</p></header><section class="section"><div class="chip-row"><button class="chip is-active">추천</button><button class="chip">다낭</button><button class="chip">교토</button><button class="chip">방콕</button><button class="chip">가족여행</button></div><div class="feed-list">${data.stories.map(feedCard).join('')}</div></section></div>`;

const detailView = (id) => {
  const story = data.stories.find((item) => item.id === id) || data.stories[0];
  const engagement = getEngagement(story.id);
  const comments = getComments(story.id);
  return `<div class="view"><section class="detail-hero"><img src="${story.cover}" alt="${escapeHtml(story.title)}"><button class="back-button" type="button" aria-label="뒤로" data-route="community">${icons.back}</button><div class="detail-hero-copy"><small>${escapeHtml(story.duration)} · ${escapeHtml(story.companions)}</small><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(story.summary)}</p></div></section><div class="detail-author"><span class="avatar">${escapeHtml(story.avatar)}</span><div><strong>${escapeHtml(story.author)}</strong><small>공개 여행 ${story.days + 8}개 · 일정 인증</small></div><button type="button" data-follow-author>팔로우</button></div><div class="social-actions detail-actions"><button class="${engagement.liked ? 'is-active' : ''}" type="button" data-like-story="${story.id}">${icons.heart}<span>좋아요</span></button><button type="button" data-focus-comment>${icons.comment}<span>댓글 ${comments.length}</span></button><button class="${engagement.scrapped ? 'is-active' : ''}" type="button" data-scrap-story="${story.id}">${icons.bookmark}<span>스크랩</span></button><button type="button" data-share-story="${story.id}">${icons.share}<span>공유</span></button></div><section class="section" style="margin-top:24px"><div class="section-head"><div><span class="eyebrow">DAY BY DAY</span><h2>날짜별 일정</h2></div></div><div class="itinerary-list">${story.itinerary.map((day) => `<article class="itinerary-day"><header><b>DAY ${day.day}</b><strong>${escapeHtml(day.title)}</strong></header><ol>${day.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol></article>`).join('')}</div></section><section class="section"><div class="section-head"><div><h2>댓글 ${comments.length}</h2><p>실제로 다녀온 사람에게 일정 팁을 물어보세요.</p></div></div><div class="comment-list">${comments.length ? comments.map((comment) => `<article class="comment"><span class="avatar">${escapeHtml(comment.authorName.slice(0,1))}</span><div><strong>${escapeHtml(comment.authorName)}</strong><p>${escapeHtml(comment.body)}</p></div></article>`).join('') : '<div class="empty-state"><h2>첫 댓글을 남겨보세요</h2><p>동선이나 체류시간에 대해 질문할 수 있습니다.</p></div>'}</div><form class="comment-form" data-comment-form="${story.id}"><input name="comment" type="text" placeholder="댓글을 입력하세요" aria-label="댓글"><button class="primary-button" type="submit">등록</button></form></section><div class="sticky-action"><button class="secondary-button" type="button" data-scrap-story="${story.id}">스크랩</button><button class="primary-button" type="button" data-copy-story="${story.id}">내 여행에 담기</button></div></div>`;
};

const cardView = () => {
  const loggedIn = Boolean(session());
  const items = getCardItems();
  if (!loggedIn) return `<div class="view"><header class="page-intro"><span class="eyebrow">TRIP CARD</span><h1>여행 카드</h1><p>쇼핑하듯 장소를 담고, 담은 항목으로 AI 일정을 만드세요.</p></header><section class="section"><div class="empty-state">${icons.bookmark}<h2>로그인하면 여행 카드가 저장돼요</h2><p>다른 기기에서도 담은 장소와 여행기를 이어서 볼 수 있습니다.</p><button class="primary-button" type="button" data-route="login">로그인</button></div></section></div>`;
  return `<div class="view"><header class="page-intro"><span class="eyebrow">BUILD YOUR JOURNEY</span><h1>여행 카드</h1><p>예약 전 단계입니다. 가고 싶은 곳을 모아 동선을 먼저 만드세요.</p></header><section class="card-summary"><header><div><small>현재 여행지</small><h2>다낭 · ${items.length}개 담음</h2></div><b>4박 5일</b></header><div class="ai-draft"><span class="ai-spark">${icons.spark}</span><div><strong>담은 장소로 자동 일정 만들기</strong><span>운영시간·체류시간·이동거리를 고려합니다.</span></div><button type="button" data-generate-plan>초안 만들기</button></div></section><section class="section"><div class="section-head"><div><h2>담은 장소</h2><p>아직 예약되지 않았으며 언제든 삭제할 수 있습니다.</p></div><a href="#discover">더 담기</a></div>${items.length ? `<div class="saved-list">${items.map((item) => `<article class="saved-card"><img src="${item.image}" alt="${escapeHtml(item.title)}"><div class="saved-card-copy"><small>${categoryLabel(item.category)} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><footer><span>${formatPrice(item.basePrice)} · ${item.duration}분</span><button type="button" aria-label="삭제" data-remove-card="${item.id}">${icons.trash}</button></footer></div></article>`).join('')}</div>` : `<div class="empty-state">${icons.pin}<h2>아직 담은 장소가 없어요</h2><p>여행 발견이나 여행기에서 마음에 드는 장소를 담아보세요.</p><a class="primary-button" href="#discover">장소 발견하기</a></div>`}</section></div>`;
};

const planView = () => {
  const plan = getPlan();
  const day = plan.days.find((item) => item.day === activeDay) || plan.days[0];
  return `<div class="view"><header class="page-intro"><span class="eyebrow">SMART ROUTE</span><h1>${escapeHtml(plan.title)}</h1><p>${escapeHtml(plan.dates)} · 성인 ${plan.people}명 · 충돌 없이 자동 정렬됨</p></header><div class="day-tabs">${plan.days.map((item) => `<button class="${item.day === day.day ? 'is-active' : ''}" type="button" data-plan-day="${item.day}"><strong>DAY ${item.day}</strong><small>${item.date} · ${item.items.length}곳</small></button>`).join('')}</div><section class="route-map" id="plan-route-map" aria-label="DAY ${day.day} 실제 이동 지도"><div class="map-loading">DAY ${day.day} 지도를 불러오는 중입니다</div><span class="map-caption">DAY ${day.day} · ${day.items.length}곳 실제 위치</span></section><section class="section"><div class="section-head"><div><span class="eyebrow">DAY ${day.day}</span><h2>${escapeHtml(day.title)}</h2><p>지도 핀과 일정 항목을 누르면 장소와 체류시간을 확인할 수 있습니다.</p></div></div><div class="timeline">${day.items.map((item) => `<article class="timeline-item"><time class="timeline-time">${item.time}</time><button class="timeline-card" type="button" data-edit-schedule="${escapeHtml(item.title)}"><small>${categoryLabel(item.type)}</small><strong>${escapeHtml(item.title)}</strong><span>체류 ${item.duration}분 · 시간 변경 가능</span></button></article>`).join('')}</div><div class="route-ok"><b>✓</b><span>현재 일정은 이동시간과 체류시간이 겹치지 않습니다. 변경 시 가능한 다음 시간을 먼저 제안합니다.</span></div></section><div class="sticky-action"><button class="secondary-button" type="button" data-route="card">장소 수정</button><button class="primary-button" type="button" data-save-plan>내 여행 저장</button></div></div>`;
};

const hotelsView = () => `<div class="view"><header class="page-intro"><span class="eyebrow">STAY IN DANANG</span><div class="page-intro-row"><div><h1>호텔</h1><p>여행지와 호텔명을 함께 검색합니다.</p></div><button class="icon-button" type="button" data-open-search>${icons.search}</button></div></header><section class="section"><div class="chip-row"><button class="chip is-active">추천순</button><button class="chip">가격</button><button class="chip">평점 4.5+</button><button class="chip">해변</button><button class="chip">조식 포함</button></div><div class="hotel-list">${data.hotels.map((hotel) => `<article class="hotel-card"><img src="${hotel.image}" alt="${escapeHtml(hotel.name)}"><div class="hotel-card-body"><small>${escapeHtml(hotel.area)} · ${hotel.badges.join(' · ')}</small><h2>${escapeHtml(hotel.name)}</h2><div class="hotel-card-meta"><b>★ ${hotel.rating} · 후기 ${formatNumber(hotel.reviews)}</b><strong>${formatPrice(hotel.price)}<small>/박</small></strong></div><button class="primary-button full-button" style="margin-top:12px" type="button" data-add-hotel="${hotel.id}">여행 카드에 담고 객실 보기</button></div></article>`).join('')}</div></section></div>`;

const tripsView = () => {
  if (!session()) return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY</span><h1>내 여행</h1><p>여행 일정, 예약 내역, 저장·찜과 활동을 한곳에서 관리합니다.</p></header><section class="section"><div class="empty-state">${icons.route}<h2>내 여행을 이어서 보려면 로그인하세요</h2><p>여행 카드와 예약은 HotelnGo 회원 계정에만 저장됩니다.</p><button class="primary-button" type="button" data-route="login">로그인</button></div></section></div>`;
  const trips = read(TRIPS_KEY, []);
  return `<div class="view"><header class="page-intro"><span class="eyebrow">MY JOURNEY</span><h1>${escapeHtml(session().user.displayName)}님의 내 여행</h1><p>일정과 예약을 구분해서 한 공간에서 확인합니다.</p></header><section class="section"><div class="chip-row"><button class="chip is-active">여행 일정</button><button class="chip">예약 내역</button><button class="chip">저장·찜</button><button class="chip">활동</button></div><div class="trip-list"><article class="trip-overview is-primary"><header><div><small>다가오는 여행</small><h2>처음 가는 다낭 4박 5일</h2></div><span class="trip-status">일정 저장</span></header><p>9.20–9.24 · 랜드마크 7 · 숙소 1 · 식사 5<br>예약 확정과 일정 저장은 별도로 관리됩니다.</p><footer><button class="secondary-button" type="button" data-route="plan">일정 열기</button><button class="primary-button" type="button" data-route="hotels">예약 준비</button></footer></article>${trips.filter((trip) => trip.sourceType === 'COMMUNITY_COPY').map((trip) => `<article class="trip-overview"><header><div><small>여행기에서 담음</small><h2>${escapeHtml(trip.title)}</h2></div><span class="trip-status">수정 가능</span></header><p>${escapeHtml(trip.destination || '')} · 원본과 분리된 나만의 일정입니다.</p><footer><button class="secondary-button" type="button" data-route="plan">일정 편집</button></footer></article>`).join('')}</div></section><section class="section"><button class="secondary-button full-button" type="button" data-logout>로그아웃</button></section></div>`;
};

const loginView = () => `<div class="view auth-view"><span class="eyebrow">WELCOME BACK</span><h1>로그인</h1><p>여행 카드와 내 여행을 어느 기기에서든 이어서 확인하세요.</p><form class="auth-form" data-mobile-login><label class="form-field"><span>이메일</span><input name="email" type="email" value="demo@hotelngo.test" autocomplete="username" required></label><label class="form-field"><span>비밀번호</span><input name="password" type="password" value="Hotelngo!2026" autocomplete="current-password" required></label><button class="primary-button full-button" type="submit">로그인</button></form><div class="demo-account"><span>화면 검증용 계정이 입력되어 있습니다.</span><button type="button" data-demo-fill>다시 채우기</button></div></div>`;

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
  toast('여행기를 내 여행에 담았습니다. 자유롭게 수정할 수 있어요.');
  window.HotelnGoNative?.haptic('Medium');
};

const addPlace = (placeId) => {
  if (!requireLogin('discover', `place:${placeId}`)) return;
  const place = data.places.find((item) => item.id === placeId);
  const list = read(CARD_KEY, []);
  if (list.some((item) => item.ownerId === userId() && item.sourceId === placeId)) return toast('이미 여행 카드에 담긴 장소입니다.');
  list.unshift({ id:`${userId()}_danang_${place.id}`,ownerId:userId(),sourceId:place.id,sourceType:place.category,destinationId:'danang',destination:'다낭',category:place.category,title:place.title,area:place.area,image:place.image,description:place.description,duration:place.duration,recommendedTime:place.recommendedTime,basePrice:place.price,lat:place.lat,lng:place.lng,status:'SAVED',addedAt:new Date().toISOString() });
  write(CARD_KEY, list);
  toast(`${place.title}을 여행 카드에 담았습니다.`);
  window.HotelnGoNative?.haptic('Light');
};

const openSearch = () => openSheet('여행지와 장소 검색', `<form class="search-form" data-mobile-search><input name="query" type="search" placeholder="도시, 랜드마크, 호텔명" autocomplete="off"><button class="primary-button" type="submit">검색</button></form><div class="search-result-list">${data.destinations.slice(0,3).map((item) => `<button class="search-result" type="button" data-search-destination="${item.id}"><img src="${item.image}" alt=""><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${item.placeCount}개 장소</small></span><b>›</b></button>`).join('')}</div>`);

const openScheduleEditor = (title) => openSheet('시간과 체류시간 변경', `<div class="section-head"><div><span class="eyebrow">SCHEDULE OPTION</span><h2>${escapeHtml(title)}</h2><p>현재 일정과 겹치지 않는 시간만 먼저 보여줍니다.</p></div></div><div class="chip-row" style="margin-left:0;margin-right:0;padding:0"><button class="chip is-active">추천 10:30</button><button class="chip">11:00</button><button class="chip">14:30</button></div><label class="form-field"><span>체류시간</span><select style="height:50px;border:1px solid var(--line);border-radius:13px;padding:0 12px"><option>60분</option><option selected>90분</option><option>120분</option></select></label><button class="primary-button full-button" style="margin-top:16px" type="button" data-apply-schedule>변경 적용</button>`);

const render = () => {
  const current = route();
  setActiveNav(current.name);
  const initial = session()?.user?.displayName?.slice(0,1) || 'G';
  document.querySelector('[data-profile-initial]').textContent = initial;
  const views = {home:homeView,discover:discoverView,community:communityView,story:()=>detailView(current.id),card:cardView,plan:planView,hotels:hotelsView,trips:tripsView,login:loginView};
  destroyPlanMap();
  main.innerHTML = (views[current.name] || homeView)();
  requestAnimationFrame(initPlanMap);
  main.focus({ preventScroll:true });
  scrollTo({ top:0, behavior:'instant' });
};

document.addEventListener('click', async (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) { location.hash = routeButton.dataset.route; return; }
  if (event.target.closest('[data-open-search]')) return openSearch();
  if (event.target.closest('[data-close-sheet]') || event.target === sheetLayer) return closeSheet();
  const destination = event.target.closest('[data-destination],[data-search-destination]');
  if (destination) { closeSheet(); toast(`${data.destinations.find((item) => item.id === (destination.dataset.destination || destination.dataset.searchDestination))?.name} 추천을 불러왔습니다.`); return; }
  const add = event.target.closest('[data-add-place]');
  if (add) return addPlace(add.dataset.addPlace);
  const addHotel = event.target.closest('[data-add-hotel]');
  if (addHotel) { const hotel = data.hotels.find((item) => item.id === addHotel.dataset.addHotel); if (!requireLogin('hotels')) return; const place = data.places.find((item) => item.category === 'HOTEL'); addPlace(place.id); toast(`${hotel.name}을 여행 카드에 담았습니다. 객실 옵션은 예약 단계에서 선택합니다.`); return; }
  const remove = event.target.closest('[data-remove-card]');
  if (remove) { write(CARD_KEY, read(CARD_KEY, []).filter((item) => item.id !== remove.dataset.removeCard)); window.HotelnGoNative?.haptic('Light'); render(); return; }
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
  const edit = event.target.closest('[data-edit-schedule]');
  if (edit) return openScheduleEditor(edit.dataset.editSchedule);
  if (event.target.closest('[data-apply-schedule]')) { closeSheet(); toast('겹치지 않는 시간으로 변경했습니다.'); return; }
  if (event.target.closest('[data-generate-plan]')) { if (!getCardItems().length) return toast('먼저 여행 카드에 장소를 담아주세요.'); write('hotelngo.mobile.plan.v1', data.recommendedPlan); window.HotelnGoNative?.haptic('Heavy'); location.hash = 'plan'; return; }
  if (event.target.closest('[data-save-plan]')) { if (!requireLogin('plan')) return; toast('내 여행에 일정을 저장했습니다.'); window.HotelnGoNative?.haptic('Medium'); return; }
  if (event.target.closest('[data-focus-comment]')) { document.querySelector('.comment-form input')?.focus(); return; }
  if (event.target.closest('[data-follow-author]')) { if (!requireLogin(route().raw)) return; event.target.closest('button').textContent = '팔로잉'; toast('작성자를 팔로우했습니다.'); return; }
  if (event.target.closest('[data-demo-fill]')) { const form=document.querySelector('[data-mobile-login]'); form.email.value='demo@hotelngo.test'; form.password.value='Hotelngo!2026'; return; }
  if (event.target.closest('[data-logout]')) { sessionStorage.removeItem(SESSION_KEY); toast('로그아웃했습니다.'); render(); }
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
  if (search) { event.preventDefault(); const query=String(new FormData(search).get('query') || '').trim(); closeSheet(); toast(query ? `‘${query}’ 검색 결과를 준비했습니다.` : '검색어를 입력해주세요.'); }
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
