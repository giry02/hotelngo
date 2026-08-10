(() => {
  const api = window.HotelNGoMockAPI;
  const root = document.querySelector('[data-trip-planner-root]');
  if (!api?.get || !root) return;

  const query = new URLSearchParams(location.search);
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('hotelngo.mock.session.v1') || 'null'); } catch { return null; }
  })();
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const categoryMeta = {
    STAY: ['숙소', '#6f65d8'],
    LANDMARK: ['랜드마크', '#18a68f'],
    FOOD: ['식사·카페', '#ef8d32'],
    GOLF: ['골프', '#208858'],
    SPA: ['마사지·스파', '#b65cc5'],
    TOUR: ['투어·체험', '#3276d9'],
    TRANSPORT: ['이동', '#64748b'],
    FREE: ['자유시간', '#94a3b8']
  };
  const iconPaths = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    sparkles: '<path d="m12 3-1.35 3.65L7 8l3.65 1.35L12 13l1.35-3.65L17 8l-3.65-1.35L12 3Z"/><path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14Zm14-2-.8 2.2-2.2.8 2.2.8L19 18l.8-2.2 2.2-.8-2.2-.8L19 12Z"/>',
    hotel: '<path d="M3 21V5a2 2 0 0 1 2-2h10v18M3 21h18M9 7h2m-2 4h2m-2 4h2m6-6h2a2 2 0 0 1 2 2v10m-4-6h2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    bed: '<path d="M3 20v-8m18 8v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2h14M3 16h18M7 12V8a2 2 0 0 0-2-2H3v10"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    food: '<path d="M6 3v8m3-8v8M4 7h7m-3 4v10M16 3v18m0-18c3 2 4 5 4 8h-4"/>',
    golf: '<path d="M6 21V4m0 0 9 3-9 3m5 11h8m-4-4 4 4-4 4"/>',
    spa: '<path d="M12 21c4-2 7-5 7-9-4 0-7 2-7 6 0-4-3-6-7-6 0 4 3 7 7 9Z"/><path d="M12 13c-3-2-4-5-2-9 3 2 4 5 2 9Z"/>',
    tour: '<path d="M3 6h18v14H3zM8 6V4h8v2M3 11h18M9 11v2h6v-2"/>',
    car: '<path d="m5 17-2-2 2-6h14l2 6-2 2H5Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M7 9 9 5h6l2 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8A7 7 0 0 1 18 6l2 1M18 16a7 7 0 0 1-12 2l-2-1"/>',
    save: '<path d="M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const categoryIcons = {
    ALL: 'grid',
    STAY: 'bed',
    LANDMARK: 'pin',
    FOOD: 'food',
    GOLF: 'golf',
    SPA: 'spa',
    TOUR: 'tour',
    TRANSPORT: 'car',
    FREE: 'compass'
  };
  const icon = (name) => `<span class="planner-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.grid}</svg></span>`;
  let catalog;
  let state;
  let toastTimer;
  let undoSnapshot = null;
  let mapInstance = null;
  let autosaveTimer = null;
  let saveStatus = 'saved';

  const canonicalCategory = (value) => ({
    HOTEL: 'STAY',
    RESTAURANT: 'FOOD',
    VEHICLE: 'TRANSPORT',
    PLACE: 'LANDMARK'
  }[value] || value || 'LANDMARK');

  const parseDate = (value) => {
    const [year, month, day] = String(value).split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const formatDate = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const addDays = (value, days) => {
    const date = typeof value === 'string' ? parseDate(value) : new Date(value);
    date.setDate(date.getDate() + Number(days || 0));
    return formatDate(date);
  };
  const dayCountFor = (startDate, endDate) => Math.max(2, Math.min(14, Math.round((parseDate(endDate) - parseDate(startDate)) / 86400000) + 1));
  const dayCount = () => dayCountFor(state.startDate, state.endDate);
  const destination = () => catalog.destinations.find((item) => item.id === state.destinationId) || catalog.destinations[0];
  const itemById = (id) => destination().items.find((item) => item.id === id);
  const dayDate = (day) => addDays(state.startDate, day - 1);
  const dateLabel = (day) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(parseDate(dayDate(day)));
  const money = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const categoryLabel = (category) => categoryMeta[category]?.[0] || category;
  const bookingTypeLabel = (type) => ({ INSTANT: '바로 예약 가능', REQUEST: '업체 확인 후 확정', INFORMATION_ONLY: '방문 정보 제공' }[type] || '예약 조건 확인');
  const showToast = (message) => {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
  };
  const showUndo = (message, snapshot) => {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    clearTimeout(toastTimer);
    undoSnapshot = snapshot;
    toast.innerHTML = `<span>${escapeHtml(message)}</span><button type="button" data-planner-undo>되돌리기</button>`;
    toast.classList.add('is-visible', 'has-action');
    toast.querySelector('[data-planner-undo]').addEventListener('click', () => {
      if (!undoSnapshot) return;
      state = structuredClone(undoSnapshot);
      undoSnapshot = null;
      render();
      scheduleAutosave();
      showToast('이전 일정으로 되돌렸습니다.');
    }, { once: true });
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible', 'has-action');
      undoSnapshot = null;
    }, 10000);
  };
  const openPlannerDialog = ({ title, message, confirmLabel = '적용하기', alternateLabel = '', onConfirm, onAlternate }) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'planner-dialog';
    dialog.innerHTML = `<header><div><small>여행 일정 변경</small><strong>${escapeHtml(title)}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="planner-dialog-body">${message}</div><footer><button class="ui-button" type="button" data-planner-cancel>취소</button>${alternateLabel ? `<button class="ui-button" type="button" data-planner-alternate>${escapeHtml(alternateLabel)}</button>` : ''}<button class="ui-button primary" type="button" data-planner-confirm>${escapeHtml(confirmLabel)}</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-planner-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-planner-confirm]').addEventListener('click', () => { onConfirm?.(); close(); });
    dialog.querySelector('[data-planner-alternate]')?.addEventListener('click', () => { onAlternate?.(); close(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };
  const persistContext = () => {
    const context = {
      tripId: state.id,
      destinationId: state.destinationId,
      destination: destination().name,
      startDate: state.startDate,
      endDate: state.endDate,
      travelers: state.travelers,
      updatedAt: new Date().toISOString()
    };
    try { localStorage.setItem('hotelngo.trip.context.v1', JSON.stringify(context)); } catch {}
  };
  const makeInstance = (itemId, day, time, index = 0) => {
    const source = itemById(itemId);
    if (!source) return null;
    return {
      instanceId: `${itemId}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      sourceId: source.id,
      category: source.category,
      day: Math.max(1, Math.min(dayCount(), Number(day) || 1)),
      time: time || source.recommendedTime || '10:00',
      title: source.title,
      area: source.area,
      image: source.image,
      duration: source.duration,
      price: source.price,
      priceLabel: source.priceLabel,
      bookingType: source.bookingType,
      status: source.status,
      note: source.description
      ,lat: Number(source.lat) || null
      ,lng: Number(source.lng) || null
    };
  };
  const templateItems = () => destination().template
    .filter((entry) => entry.day <= dayCount())
    .map((entry, index) => makeInstance(entry.itemId, entry.day, entry.time, index))
    .filter(Boolean);
  const defaultDates = () => {
    const start = addDays(new Date(), 30);
    const nights = Math.max(2, Number(query.get('nights') || 4));
    return { start, end: addDays(start, nights) };
  };
  const findDestinationId = (value) => {
    const normalized = String(value || '').toLowerCase();
    return catalog.destinations.find((item) => [item.id, item.name].some((candidate) => String(candidate).toLowerCase() === normalized))?.id
      || catalog.destinations[0].id;
  };
  const normalizeStoredItem = (item, index) => {
    const sourceId = item.sourceId || item.id;
    const source = itemById(sourceId);
    return {
      instanceId: item.instanceId || item.id || `stored_${Date.now()}_${index}`,
      sourceId,
      category: canonicalCategory(item.category || item.type || source?.category),
      day: Number(item.day || 1),
      time: item.time || source?.recommendedTime || '10:00',
      title: item.title || source?.title || '일정 항목',
      area: item.area || source?.area || '',
      image: item.image || source?.image || '',
      duration: Number(item.duration ?? source?.duration ?? 60),
      price: Number(item.price ?? source?.price ?? 0),
      priceLabel: item.priceLabel || source?.priceLabel || money(item.price),
      bookingType: item.bookingType || source?.bookingType || 'INFORMATION_ONLY',
      status: item.status || source?.status || 'CHECK_REQUIRED',
      note: item.note || item.reason || source?.description || ''
      ,lat: Number(item.lat ?? source?.lat) || null
      ,lng: Number(item.lng ?? source?.lng) || null
    };
  };

  const warnings = () => {
    const results = [];
    const items = state.items;
    if (!items.some((item) => item.category === 'STAY')) results.push(['error', '숙소가 없습니다. 체크인·체크아웃과 숙박 위치를 먼저 정하세요.']);
    if (!items.some((item) => item.category === 'TRANSPORT')) results.push(['warning', '공항 또는 도시 간 이동이 없습니다. 도착·출발 동선을 확인하세요.']);
    if (!items.some((item) => item.category === 'FOOD')) results.push(['warning', '식사 일정이 없습니다. 이동 동선과 영업시간에 맞는 식당을 추가하세요.']);
    for (let day = 1; day <= dayCount(); day += 1) {
      const dayItems = items.filter((item) => item.day === day);
      if (dayItems.length < 2) results.push(['suggestion', `DAY ${day} 일정이 비어 있거나 항목이 적습니다. 자유시간으로 둘지 확인하세요.`]);
      const sorted = [...dayItems].filter((item) => item.duration > 0).sort((a, b) => a.time.localeCompare(b.time));
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1];
        const [hour, minute] = previous.time.split(':').map(Number);
        const endMinutes = hour * 60 + minute + Number(previous.duration || 0);
        const [nextHour, nextMinute] = sorted[index].time.split(':').map(Number);
        if (endMinutes > nextHour * 60 + nextMinute) {
          results.push(['error', `DAY ${day} ${previous.title}과(와) ${sorted[index].title} 시간이 겹칩니다.`]);
        }
      }
    }
    if (!results.length) results.push(['suggestion', '기본 일정 충돌은 없습니다. 실제 운영시간·이동시간·재고는 예약 전에 다시 확인합니다.']);
    return results.slice(0, 6);
  };
  const totals = () => {
    const total = state.items.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const instant = state.items.filter((item) => item.bookingType === 'INSTANT').length;
    const request = state.items.filter((item) => item.bookingType === 'REQUEST').length;
    const info = state.items.filter((item) => item.bookingType === 'INFORMATION_ONLY').length;
    return { total, instant, request, info };
  };
  const dayOptions = (selected) => Array.from({ length: dayCount() }, (_, index) => {
    const day = index + 1;
    return `<option value="${day}"${Number(selected) === day ? ' selected' : ''}>DAY ${day}</option>`;
  }).join('');
  const distanceKm = (a, b) => {
    const toRad = (value) => value * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };
  const mapDayItems = () => state.items
    .filter((item) => (state.mapDay === 'ALL' || item.day === state.mapDay) && item.lat && item.lng)
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const focusedMapSource = () => {
    const source = itemById(state.focusLocationId);
    if (source?.lat && source?.lng) return source;
    const landmark = mapDayItems().find((item) => item.category === 'LANDMARK' || item.category === 'TOUR') || mapDayItems()[0];
    return landmark ? itemById(landmark.sourceId) : null;
  };
  const nearbyItems = () => {
    const focus = focusedMapSource();
    if (!focus) return [];
    return destination().items
      .filter((item) => item.id !== focus.id && item.lat && item.lng && ['STAY','FOOD','GOLF','SPA','TOUR','LANDMARK'].includes(item.category))
      .map((item) => ({ ...item, distance: distanceKm(focus, item) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  };
  const renderMap = () => {
    const element = root.querySelector('[data-planner-map]');
    if (!element) return;
    const points = mapDayItems();
    if (!window.L) {
      element.innerHTML = '<div class="planner-map-fallback"><strong>지도를 불러오지 못했습니다.</strong><span>일정 목록의 장소명과 좌표는 그대로 저장됩니다. 네트워크 연결 후 다시 열어 주세요.</span></div>';
      return;
    }
    mapInstance = window.L.map(element, { zoomControl: true, scrollWheelZoom: false });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
    if (!points.length) {
      mapInstance.setView([16.0544, 108.2022], 11);
      return;
    }
    const bounds = [];
    points.forEach((item, index) => {
      const color = categoryMeta[item.category]?.[1] || '#2f6bff';
      const marker = window.L.marker([item.lat, item.lng], {
        icon: window.L.divIcon({ className: 'planner-map-marker-wrap', html: `<span class="planner-map-marker" style="--marker-color:${color}">${index + 1}</span>`, iconSize: [34, 42], iconAnchor: [17, 38] })
      }).addTo(mapInstance);
      const popup = document.createElement('div');
      popup.className = 'planner-map-popup';
      const label = document.createElement('small');
      label.textContent = `DAY ${item.day} · ${item.time} · ${categoryLabel(item.category)}`;
      const title = document.createElement('strong');
      title.textContent = item.title;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '주변 장소 보기';
      button.addEventListener('click', () => { state.focusLocationId = item.sourceId; render(); });
      popup.append(label, title, button);
      marker.bindPopup(popup);
      bounds.push([item.lat, item.lng]);
    });
    const routeGroups = state.mapDay === 'ALL'
      ? [...new Set(points.map((item) => item.day))].map((day) => points.filter((item) => item.day === day))
      : [points];
    const routeColors = ['#2f6bff', '#10a58f', '#ef8d32', '#8b5cf6', '#e34d73', '#3276d9'];
    routeGroups.forEach((group, index) => {
      if (group.length > 1) window.L.polyline(group.map((item) => [item.lat, item.lng]), { color: routeColors[index % routeColors.length], weight: 4, opacity: .76, dashArray: '8 7' }).addTo(mapInstance);
    });
    mapInstance.fitBounds(bounds, { padding: [34, 34], maxZoom: 13 });
    setTimeout(() => mapInstance?.invalidateSize(), 0);
  };

  const render = () => {
    if (mapInstance) { mapInstance.remove(); mapInstance = null; }
    const currentDestination = destination();
    const totalsData = totals();
    const days = Array.from({ length: dayCount() }, (_, index) => index + 1);
    const selectedItems = state.items
      .filter((item) => item.day === state.selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
    const focusedItemId = query.get('focus');
    const searchTerm = String(state.catalogSearch || '').trim().toLowerCase();
    const visibleCatalog = currentDestination.items.filter((item) => {
      const categoryMatches = state.category === 'ALL' || item.category === state.category;
      const searchMatches = !searchTerm || `${item.title} ${item.area} ${item.description}`.toLowerCase().includes(searchTerm);
      return categoryMatches && searchMatches;
    });
    const mapFocus = focusedMapSource();
    const nearby = nearbyItems();
    const routePoints = mapDayItems();
    const routeGroups = state.mapDay === 'ALL'
      ? [...new Set(routePoints.map((item) => item.day))].map((day) => routePoints.filter((item) => item.day === day))
      : [routePoints];
    const routeDistance = routeGroups.reduce((total, group) => total + group.slice(1).reduce((sum, item, index) => sum + distanceKm(group[index], item), 0), 0);
    const routeMetric = state.mapDay === 'ALL'
      ? `${dayCount()}일 · 지도 장소 ${routePoints.length}곳 · 일자별 연결선`
      : `DAY ${state.mapDay} · ${routePoints.length}곳 · 직선 동선 약 ${routeDistance.toFixed(1)}km`;
    const categoryCounts = state.items.reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + 1;
      return accumulator;
    }, {});
    const hotelHref = `hotels.html?destination=${encodeURIComponent(currentDestination.name)}&checkIn=${state.startDate}&checkOut=${state.endDate}&tripId=${encodeURIComponent(state.id)}`;
    const experienceHref = `experiences.html?destination=${encodeURIComponent(currentDestination.name)}&startDate=${state.startDate}&endDate=${state.endDate}&tripId=${encodeURIComponent(state.id)}`;
    root.innerHTML = `
      ${state.sourceGuideId ? `<section class="planner-remix-banner"><div><span>REMIXED GUIDE</span><strong>${escapeHtml(state.sourceGuideTitle || '다른 여행자의 일정')}을 바탕으로 만든 내 여행입니다.</strong><p>여기서 변경한 내용은 원본 가이드에 영향을 주지 않습니다.</p></div><a href="trip-guide-detail.html?id=${encodeURIComponent(state.sourceGuideId)}">원본 가이드 보기</a></section>` : ''}
      <section class="planner-hero">
        <div class="planner-hero-row">
          <div><span class="page-eyebrow">${query.get('mode') === 'ai' ? 'AI DRAFT · EDIT EVERYTHING' : 'BUILD ONE COMPLETE JOURNEY'}</span><h1>하나를 고르는 예약이 아니라,<br>여행 전체를 날짜별로 만드세요</h1><p>${query.get('mode') === 'ai' ? 'AI가 만든 다카테고리 초안입니다. 모든 항목을 직접 추가·이동·삭제하고 예약 전에 다시 검증할 수 있습니다.' : '목적지와 기간을 먼저 정하고 숙소·랜드마크·식사·골프·스파·이동을 같은 4박 5일 안에 여러 개 조합합니다.'}</p></div>
          <div class="planner-hero-actions"><a class="ui-button" href="trip-create.html?destination=${encodeURIComponent(currentDestination.name)}&startDate=${encodeURIComponent(state.startDate)}&endDate=${encodeURIComponent(state.endDate)}">${icon('arrow-left')}<span>단계별로 다시 시작</span></a><a class="ui-button" href="community.html">${icon('users')}<span>다른 여행자 일정</span></a></div>
        </div>
      </section>
      <section class="planner-setup" aria-labelledby="planner-setup-title">
        <div class="planner-setup-head"><h2 id="planner-setup-title">1. 어디로, 언제, 누구와 가나요?</h2><span>이 정보가 호텔·즐길거리·AI 추천에 공통으로 적용됩니다.</span></div>
        <div class="planner-fields">
          <label class="planner-field"><span>여행 이름</span><input name="title" value="${escapeHtml(state.title)}"></label>
          <label class="planner-field"><span>출발일</span><input name="startDate" type="date" value="${escapeHtml(state.startDate)}"></label>
          <label class="planner-field"><span>귀국일</span><input name="endDate" type="date" value="${escapeHtml(state.endDate)}"></label>
          <label class="planner-field"><span>여행 인원</span><select name="travelers"><option${state.travelers === '혼자' ? ' selected' : ''}>혼자</option><option${state.travelers === '성인 2명' ? ' selected' : ''}>성인 2명</option><option${state.travelers === '가족 4명' ? ' selected' : ''}>가족 4명</option><option${state.travelers === '친구 4명' ? ' selected' : ''}>친구 4명</option></select></label>
        </div>
        <div class="destination-strip" aria-label="여행지 선택">${catalog.destinations.map((item) => `<button class="destination-choice${item.id === state.destinationId ? ' is-active' : ''}" type="button" data-destination-id="${escapeHtml(item.id)}"><img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${escapeHtml(item.summary)}</small></span></button>`).join('')}</div>
      </section>
      <section class="planner-context">
        <div class="planner-context-main"><span class="planner-context-pin" aria-hidden="true">⌖</span><div><strong>${escapeHtml(currentDestination.name)} · ${dayCount() - 1}박 ${dayCount()}일 · ${escapeHtml(state.travelers)}</strong><span>${escapeHtml(state.startDate)}–${escapeHtml(state.endDate)} · 일정 ${state.items.length}개 · 등록 장소 기준</span></div></div>
        <div class="planner-context-links"><a href="${hotelHref}">${icon('hotel')}<span>이 날짜의 호텔 찾기</span></a><a href="${experienceHref}">${icon('compass')}<span>이 도시의 즐길거리 찾기</span></a></div>
      </section>
      <section class="planner-route" aria-labelledby="planner-route-title">
        <div class="planner-route-head"><div><span class="page-eyebrow">MAP & ROUTE</span><h2 id="planner-route-title">날짜별 동선 지도</h2><p>일정에 담은 장소를 시간순으로 연결합니다. 점선은 이동 순서를 보여주는 안내선이며 실제 도로 경로는 모바일 내비게이션 연동 단계에서 계산합니다.</p></div><div class="planner-route-controls"><span class="planner-route-metric">${escapeHtml(routeMetric)}</span><div class="planner-map-days"><button class="${state.mapDay === 'ALL' ? 'is-active' : ''}" type="button" data-map-day="ALL">전체</button>${days.map((day) => `<button class="${state.mapDay === day ? 'is-active' : ''}" type="button" data-map-day="${day}">DAY ${day}</button>`).join('')}</div></div></div>
        <div class="planner-route-grid"><div class="planner-map" data-planner-map aria-label="${escapeHtml(currentDestination.name)} 일정 지도"></div><aside class="planner-nearby"><div><small>선택한 기준 장소</small><strong>${mapFocus ? escapeHtml(mapFocus.title) : '지도 마커를 선택하세요'}</strong><span>${mapFocus ? `${escapeHtml(mapFocus.area)} 주변의 숙소·식사·활동을 거리순으로 보여드립니다.` : '일정에 좌표가 있는 장소를 추가하면 주변 후보가 나타납니다.'}</span></div><div class="planner-nearby-list">${nearby.length ? nearby.map((item) => `<button type="button" data-nearby-item="${escapeHtml(item.id)}"><span style="--nearby-color:${categoryMeta[item.category]?.[1] || '#2f6bff'}"></span><div><small>${escapeHtml(categoryLabel(item.category))} · 약 ${item.distance.toFixed(1)}km</small><strong>${escapeHtml(item.title)}</strong></div><em>추가</em></button>`).join('') : '<p>주변 후보를 보려면 지도에서 랜드마크를 선택하세요.</p>'}</div></aside></div>
      </section>
      <div class="planner-workspace">
        <section class="planner-board" aria-labelledby="planner-board-title">
          <div class="planner-board-head"><div><span class="page-eyebrow">2. DAY BY DAY</span><h2 id="planner-board-title">날짜별 여행 일정</h2><p>같은 날에 숙소, 관광, 식사와 활동을 여러 개 배치할 수 있습니다.</p></div><div class="planner-summary">${Object.entries(categoryCounts).map(([category, count]) => `<span>${icon(categoryIcons[category])}${categoryLabel(category)} ${count}</span>`).join('') || '<span>아직 일정 없음</span>'}</div></div>
          <nav class="planner-day-tabs" aria-label="여행 일자">${days.map((day) => `<button class="planner-day-tab${day === state.selectedDay ? ' is-active' : ''}" type="button" data-day="${day}"><strong>DAY ${day}</strong><small>${escapeHtml(dateLabel(day))} · ${state.items.filter((item) => item.day === day).length}개</small></button>`).join('')}</nav>
          <div class="planner-day-title"><strong>DAY ${state.selectedDay} · ${escapeHtml(dateLabel(state.selectedDay))}</strong><span>시간순 자동 정렬</span></div>
          <div class="planner-timeline">${selectedItems.length ? selectedItems.map((item) => `
            <article class="planner-stop" style="--category-color:${categoryMeta[item.category]?.[1] || '#2f6bff'}" data-instance-id="${escapeHtml(item.instanceId)}">
              <time>${escapeHtml(item.time)}</time><span class="planner-stop-line"></span>
              <div class="planner-stop-copy"><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.priceLabel)} · ${item.duration ? `${item.duration}분` : `${dayCount() - 1}박`} · ${escapeHtml(bookingTypeLabel(item.bookingType))}</span></div>
              <div class="planner-stop-actions"><select aria-label="${escapeHtml(item.title)} 이동할 일자" data-move-day>${dayOptions(item.day)}</select><button type="button" data-edit-item><span>수정</span></button><button type="button" data-remove-item>${icon('trash')}<span>삭제</span></button></div>
            </article>`).join('') : '<div class="planner-empty-day"><strong>이 날짜에는 아직 일정이 없습니다.</strong><span>오른쪽 카탈로그에서 숙소·장소·식사·활동을 여러 개 추가하세요.</span></div>'}</div>
          <div class="planner-validation">${warnings().map(([tone, message]) => `<article class="${tone}">${escapeHtml(message)}</article>`).join('')}</div>
          <div class="planner-booking-readiness"><article><span>바로 예약 가능</span><strong>${totalsData.instant}</strong></article><article><span>업체 확인 필요</span><strong>${totalsData.request}</strong></article><article><span>방문 정보</span><strong>${totalsData.info}</strong></article></div>
          <footer class="planner-board-footer"><div class="planner-cost"><small>표시된 참고가격 합계 · 인원과 옵션에 따라 달라질 수 있음</small><strong>${money(totalsData.total)}</strong><span class="planner-save-status" data-save-status data-state="${saveStatus}">${saveStatus === 'saving' ? '변경사항 저장 중…' : saveStatus === 'error' ? '저장 실패 · 다시 시도해 주세요' : '모든 변경사항 저장됨'}</span></div><div class="planner-footer-actions"><button class="ui-button" type="button" data-clear-plan>${icon('trash')}<span>일정 비우기</span></button><button class="ui-button" type="button" data-fill-template>${icon('refresh')}<span>추천 일정 다시 채우기</span></button><button class="ui-button" type="button" data-share-plan>${icon('users')}<span>가이드 공유</span></button><button class="ui-button primary" type="button" data-save-plan>${icon('save')}<span>지금 저장</span></button></div></footer>
        </section>
        <aside class="planner-catalog" aria-labelledby="planner-catalog-title">
          <div class="planner-catalog-head"><div><span class="page-eyebrow">3. ADD TO YOUR DAYS</span><h2 id="planner-catalog-title">${escapeHtml(currentDestination.name)}에서 무엇을 할까요?</h2><p>추가할 날짜와 시간을 선택하세요. 한 날짜에 여러 항목을 담을 수 있습니다.</p></div></div>
          <label class="planner-catalog-search"><span>장소 검색</span><input type="search" data-catalog-search placeholder="장소명·지역·설명 검색" value="${escapeHtml(state.catalogSearch || '')}"></label>
          <div class="planner-category-tabs">${catalog.categories.map((category) => `<button class="${category.id === state.category ? 'is-active' : ''}" type="button" data-category="${escapeHtml(category.id)}">${icon(categoryIcons[category.id])}<span>${escapeHtml(category.label)}</span></button>`).join('')}</div>
          <div class="planner-catalog-list">${visibleCatalog.length ? visibleCatalog.map((item) => `
            <article class="planner-product${focusedItemId === item.id ? ' is-focused' : ''}" data-catalog-item="${escapeHtml(item.id)}">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
              <div class="planner-product-copy"><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span><div class="planner-product-meta"><b>${escapeHtml(item.priceLabel)}</b><span>${item.duration ? `${item.duration}분` : `${dayCount() - 1}박`} · ${escapeHtml(bookingTypeLabel(item.bookingType))}</span></div></div><div class="planner-product-add"><button class="planner-product-detail" type="button" data-view-item>상세 보기</button><button type="button" data-add-item>${icon('plus')}<span>일정에 추가</span></button></div>
            </article>`).join('') : '<div class="planner-catalog-empty"><strong>검색 결과가 없습니다.</strong><span>다른 검색어 또는 카테고리를 선택해 보세요.</span></div>'}</div>
        </aside>
      </div>`;
    persistContext();
    renderMap();
  };

  const updateSaveStatus = (status) => {
    saveStatus = status;
    const label = root.querySelector('[data-save-status]');
    if (label) {
      label.textContent = status === 'saving' ? '변경사항 저장 중…' : status === 'error' ? '저장 실패 · 다시 시도해 주세요' : '모든 변경사항 저장됨';
      label.dataset.state = status;
    }
  };

  const savePlan = ({ silent = false } = {}) => {
    const record = {
      id: state.id,
      ownerId: session?.user?.id || 'LOCAL_GUEST',
      title: state.title,
      destination: destination().name,
      destinationId: state.destinationId,
      startDate: state.startDate,
      endDate: state.endDate,
      travelers: state.travelers,
      duration: `${dayCount() - 1}박 ${dayCount()}일`,
      status: 'DRAFT',
      sourceType: state.sourceType || (query.get('mode') === 'ai' ? 'AI_DRAFT' : 'USER_CREATED'),
      sourceTripId: state.sourceTripId || null,
      sourceGuideId: state.sourceGuideId || null,
      sourceGuideTitle: state.sourceGuideTitle || null,
      sourceAuthor: state.sourceAuthor || null,
      sourcePublishedVersion: state.sourcePublishedVersion || null,
      items: state.items.map((item) => ({
        id: item.instanceId,
        sourceId: item.sourceId,
        type: item.category,
        category: item.category,
        day: item.day,
        time: item.time,
        title: item.title,
        area: item.area,
        image: item.image,
        duration: item.duration,
        price: item.price,
        priceLabel: item.priceLabel,
        bookingType: item.bookingType,
        status: item.status,
        bookingStatus: 'NOT_BOOKED',
        note: item.note
        ,lat: item.lat
        ,lng: item.lng
      }))
    };
    try {
      api.upsert('trips', record);
      updateSaveStatus('saved');
      if (!silent) {
        api.appendAudit({ actor: record.ownerId, action: 'MULTI_DAY_TRIP_SAVED', entityType: 'TRIP', entityId: record.id, payload: { itemCount: record.items.length, destination: record.destination } });
        showToast(`${record.title}을(를) ${record.items.length}개 일정으로 저장했습니다.`);
      }
      return record;
    } catch {
      updateSaveStatus('error');
      return null;
    }
  };

  const scheduleAutosave = () => {
    clearTimeout(autosaveTimer);
    updateSaveStatus('saving');
    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;
      savePlan({ silent: true });
    }, 500);
  };

  const addCatalogItem = (source, selectedDay, time) => {
    if (source.category === 'STAY') state.items = state.items.filter((item) => item.category !== 'STAY');
    const instance = makeInstance(source.id, selectedDay, time);
    if (instance) state.items.push(instance);
    state.selectedDay = selectedDay;
    state.mapDay = selectedDay;
    if (['LANDMARK', 'TOUR'].includes(source.category)) state.focusLocationId = source.id;
    render();
    scheduleAutosave();
    showToast(`${source.title}을(를) DAY ${selectedDay} ${time}에 추가했습니다.`);
  };
  const openCatalogItem = (source) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'planner-dialog planner-add-dialog';
    dialog.innerHTML = `<header><div><small>${escapeHtml(categoryLabel(source.category))} · ${escapeHtml(source.area)}</small><strong>${escapeHtml(source.title)}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="planner-dialog-body"><img src="${escapeHtml(source.image)}" alt="${escapeHtml(source.title)}"><p>${escapeHtml(source.description)}</p><div class="planner-dialog-facts"><span><small>예상 비용</small><strong>${escapeHtml(source.priceLabel)}</strong></span><span><small>소요 시간</small><strong>${source.duration ? `${source.duration}분` : `${dayCount() - 1}박`}</strong></span><span><small>예약 방식</small><strong>${escapeHtml(bookingTypeLabel(source.bookingType))}</strong></span></div><div class="planner-dialog-fields"><label><span>추가할 날짜</span><select data-dialog-day>${dayOptions(state.selectedDay)}</select></label><label><span>시작 시간</span><input type="time" data-dialog-time value="${escapeHtml(source.recommendedTime)}"></label></div></div><footer><button class="ui-button" type="button" data-planner-cancel>취소</button><button class="ui-button primary" type="button" data-planner-confirm>${icon('plus')}일정에 추가</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-planner-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-planner-confirm]').addEventListener('click', () => {
      addCatalogItem(source, Number(dialog.querySelector('[data-dialog-day]').value), dialog.querySelector('[data-dialog-time]').value || source.recommendedTime);
      close();
    });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };

  const openItemEditor = (item) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'planner-dialog planner-edit-dialog';
    dialog.innerHTML = `<header><div><small>내 일정 수정</small><strong>${escapeHtml(item.title)}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="planner-dialog-body"><div class="planner-dialog-fields"><label><span>날짜</span><select data-edit-day>${dayOptions(item.day)}</select></label><label><span>시작 시간</span><input type="time" data-edit-time value="${escapeHtml(item.time)}"></label><label><span>머무는 시간(분)</span><input type="number" min="0" step="15" data-edit-duration value="${Number(item.duration || 0)}"></label><label class="full"><span>가이드에 표시할 메모</span><textarea data-edit-note placeholder="이 장소를 고른 이유나 다른 여행자에게 알려줄 팁을 적어보세요.">${escapeHtml(item.note || '')}</textarea></label></div></div><footer><button class="ui-button" type="button" data-planner-cancel>취소</button><button class="ui-button primary" type="button" data-planner-confirm>변경사항 적용</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-planner-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-planner-confirm]').addEventListener('click', () => {
      item.day = Number(dialog.querySelector('[data-edit-day]').value);
      item.time = dialog.querySelector('[data-edit-time]').value || item.time;
      item.duration = Math.max(0, Number(dialog.querySelector('[data-edit-duration]').value || 0));
      item.note = dialog.querySelector('[data-edit-note]').value.trim();
      state.selectedDay = item.day;
      state.mapDay = item.day;
      render();
      scheduleAutosave();
      showToast(`${item.title} 일정을 수정했습니다.`);
      close();
    });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };

  const applyDestination = (nextId, createNew = false) => {
    const previous = structuredClone(state);
    if (createNew) {
      savePlan();
      state.id = `trip_plan_${Date.now()}`;
    }
    state.destinationId = nextId;
    state.title = `${destination().name} ${dayCount() - 1}박 ${dayCount()}일`;
    state.items = templateItems();
    state.selectedDay = 1;
    render();
    scheduleAutosave();
    showUndo(`${destination().name} 기준 추천 일정으로 변경했습니다.`, previous);
  };

  root.addEventListener('change', (event) => {
    const name = event.target.name;
    if (!['title', 'startDate', 'endDate', 'travelers'].includes(name)) return;
    const nextValue = event.target.value;
    if (name === 'title' || name === 'travelers' || !state.items.length) {
      state[name] = nextValue;
      render();
      scheduleAutosave();
      return;
    }
    const nextStart = name === 'startDate' ? nextValue : state.startDate;
    let nextEnd = name === 'endDate' ? nextValue : state.endDate;
    if (parseDate(nextEnd) <= parseDate(nextStart)) nextEnd = addDays(nextStart, name === 'startDate' ? 4 : 1);
    const nextDays = dayCountFor(nextStart, nextEnd);
    const affected = state.items.filter((item) => item.day > nextDays).length;
    render();
    openPlannerDialog({
      title: '여행 날짜를 변경할까요?',
      message: `<p>기존 일정 ${state.items.length}개를 유지하면서 날짜를 변경합니다.</p><div class="planner-change-impact"><span>새 일정</span><strong>${nextDays - 1}박 ${nextDays}일</strong><span>마지막 날로 이동</span><strong>${affected}개</strong></div><p>범위를 벗어나는 항목은 삭제하지 않고 마지막 날짜로 이동합니다.</p>`,
      confirmLabel: '날짜 변경',
      onConfirm: () => {
        const previous = structuredClone(state);
        state.startDate = nextStart;
        state.endDate = nextEnd;
        state.items = state.items.map((item) => ({ ...item, day: Math.min(item.day, nextDays) }));
        state.selectedDay = Math.min(state.selectedDay, nextDays);
        render();
        scheduleAutosave();
        showUndo('여행 날짜를 변경했습니다.', previous);
      }
    });
  });
  root.addEventListener('change', (event) => {
    const move = event.target.closest('[data-move-day]');
    if (!move) return;
    const instance = event.target.closest('[data-instance-id]')?.dataset.instanceId;
    const item = state.items.find((candidate) => candidate.instanceId === instance);
    if (item) {
      item.day = Number(move.value);
      state.selectedDay = item.day;
      render();
      scheduleAutosave();
    }
  });
  root.addEventListener('input', (event) => {
    const search = event.target.closest('[data-catalog-search]');
    if (!search) return;
    state.catalogSearch = search.value;
    const normalized = search.value.trim().toLowerCase();
    root.querySelectorAll('[data-catalog-item]').forEach((card) => {
      card.hidden = normalized ? !card.textContent.toLowerCase().includes(normalized) : false;
    });
  });
  root.addEventListener('click', (event) => {
    const destinationButton = event.target.closest('[data-destination-id]');
    if (destinationButton) {
      const nextId = destinationButton.dataset.destinationId;
      if (nextId === state.destinationId) return;
      const nextDestination = catalog.destinations.find((item) => item.id === nextId);
      openPlannerDialog({
        title: `${nextDestination.name}(으)로 여행지를 바꿀까요?`,
        message: `<p>현재 ${destination().name} 일정 ${state.items.length}개가 ${nextDestination.name} 추천 일정으로 바뀝니다.</p><div class="planner-change-impact"><span>현재 일정</span><strong>${state.items.length}개</strong><span>변경 후 추천</span><strong>${nextDestination.template.filter((item) => item.day <= dayCount()).length}개</strong></div><p>기존 일정은 별도 여행으로 저장하거나, 변경 후 10초 안에 되돌릴 수 있습니다.</p>`,
        confirmLabel: '기존 일정 변환',
        alternateLabel: '새 여행으로 만들기',
        onConfirm: () => applyDestination(nextId),
        onAlternate: () => applyDestination(nextId, true)
      });
      return;
    }
    const dayButton = event.target.closest('[data-day]');
    if (dayButton) {
      state.selectedDay = Number(dayButton.dataset.day);
      state.mapDay = state.selectedDay;
      render();
      return;
    }
    const mapDayButton = event.target.closest('[data-map-day]');
    if (mapDayButton) {
      state.mapDay = mapDayButton.dataset.mapDay === 'ALL' ? 'ALL' : Number(mapDayButton.dataset.mapDay);
      if (state.mapDay !== 'ALL') state.selectedDay = state.mapDay;
      render();
      return;
    }
    const nearbyButton = event.target.closest('[data-nearby-item]');
    if (nearbyButton) {
      const source = itemById(nearbyButton.dataset.nearbyItem);
      if (source) openCatalogItem(source);
      return;
    }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      state.category = categoryButton.dataset.category;
      render();
      return;
    }
    const addButton = event.target.closest('[data-add-item], [data-view-item]');
    if (addButton) {
      const card = addButton.closest('[data-catalog-item]');
      const source = itemById(card.dataset.catalogItem);
      if (source) openCatalogItem(source);
      return;
    }
    const editButton = event.target.closest('[data-edit-item]');
    if (editButton) {
      const instance = editButton.closest('[data-instance-id]')?.dataset.instanceId;
      const item = state.items.find((candidate) => candidate.instanceId === instance);
      if (item) openItemEditor(item);
      return;
    }
    const removeButton = event.target.closest('[data-remove-item]');
    if (removeButton) {
      const instance = removeButton.closest('[data-instance-id]').dataset.instanceId;
      const previous = structuredClone(state);
      const removed = state.items.find((item) => item.instanceId === instance);
      state.items = state.items.filter((item) => item.instanceId !== instance);
      render();
      scheduleAutosave();
      showUndo(`${removed?.title || '일정'}을(를) 일정에서 제외했습니다.`, previous);
      return;
    }
    if (event.target.closest('[data-clear-plan]')) {
      openPlannerDialog({
        title: '전체 일정을 비울까요?',
        message: `<p>현재 일정 ${state.items.length}개가 편집기에서 제외됩니다. 변경 후 10초 안에는 되돌릴 수 있습니다.</p>`,
        confirmLabel: '일정 비우기',
        onConfirm: () => {
          const previous = structuredClone(state);
          state.items = [];
          render();
          scheduleAutosave();
          showUndo('전체 일정을 비웠습니다.', previous);
        }
      });
      return;
    }
    if (event.target.closest('[data-fill-template]')) {
      openPlannerDialog({
        title: '추천 일정으로 다시 구성할까요?',
        message: `<p>현재 일정 ${state.items.length}개 대신 ${destination().name} 기본 추천 일정을 채웁니다.</p>`,
        confirmLabel: '추천 일정 적용',
        onConfirm: () => {
          const previous = structuredClone(state);
          state.items = templateItems();
          state.selectedDay = 1;
          render();
          scheduleAutosave();
          showUndo(`${destination().name} 추천 일정을 적용했습니다.`, previous);
        }
      });
      return;
    }
    if (event.target.closest('[data-save-plan]')) savePlan();
    if (event.target.closest('[data-share-plan]')) {
      savePlan();
      location.href = `trip-publish.html?tripId=${encodeURIComponent(state.id)}`;
    }
  });

  const initialize = async () => {
    catalog = await api.get('trip-planner-catalog.json');
    const dates = defaultDates();
    const destinationId = findDestinationId(query.get('destination'));
    const storedTrip = query.get('tripId') ? api.list('trips').find((item) => item.id === query.get('tripId')) : null;
    state = {
      id: storedTrip?.id || `trip_plan_${Date.now()}`,
      title: storedTrip?.title || `${catalog.destinations.find((item) => item.id === destinationId)?.name || '다낭'} 4박 5일`,
      destinationId: storedTrip?.destinationId || findDestinationId(storedTrip?.destination || destinationId),
      startDate: storedTrip?.startDate || query.get('startDate') || query.get('checkIn') || dates.start,
      endDate: storedTrip?.endDate || query.get('endDate') || query.get('checkOut') || dates.end,
      travelers: storedTrip?.travelers || query.get('travelers') || '성인 2명',
      sourceType: storedTrip?.sourceType || (query.get('mode') === 'ai' ? 'AI_DRAFT' : 'USER_CREATED'),
      sourceTripId: storedTrip?.sourceTripId || null,
      sourceGuideId: storedTrip?.sourceGuideId || (storedTrip?.sourceType === 'COMMUNITY_COPY' ? storedTrip?.sourceTripId : null) || null,
      sourceGuideTitle: storedTrip?.sourceGuideTitle || (storedTrip?.sourceType === 'COMMUNITY_COPY' ? String(storedTrip?.title || '').replace(/\s*·\s*내 버전$/, '') : null) || null,
      sourceAuthor: storedTrip?.sourceAuthor || null,
      sourcePublishedVersion: storedTrip?.sourcePublishedVersion || null,
      category: 'ALL',
      catalogSearch: '',
      selectedDay: 1,
      mapDay: 'ALL',
      focusLocationId: '',
      items: []
    };
    const focusedId = query.get('focus');
    if (focusedId && !itemById(focusedId) && query.get('candidateTitle')) {
      const typeMap = { HOTEL: 'STAY', PLACE: 'LANDMARK', RESTAURANT: 'FOOD', VEHICLE: 'TRANSPORT' };
      destination().items.unshift({
        id: focusedId,
        category: typeMap[query.get('candidateType')] || query.get('candidateType') || 'LANDMARK',
        title: query.get('candidateTitle'),
        area: destination().name,
        image: destination().cover,
        description: '이전 화면에서 선택한 후보입니다. 날짜와 시간을 정한 뒤 일정에 추가하고 상세 정보를 다시 확인하세요.',
        duration: 90,
        recommendedTime: '10:00',
        price: 0,
        priceLabel: '가격 재확인',
        bookingType: 'INFORMATION_ONLY',
        status: 'CHECK_REQUIRED'
      });
    }
    state.items = storedTrip?.items?.length
      ? storedTrip.items.map(normalizeStoredItem)
      : templateItems();
    const focusedItem = itemById(query.get('focus'));
    if (focusedItem) state.category = focusedItem.category;
    render();
  };

  window.addEventListener('beforeunload', () => {
    if (state && autosaveTimer) savePlan({ silent: true });
  });

  initialize().catch(() => {
    root.innerHTML = '<div class="empty-state"><strong>여행 일정 데이터를 불러오지 못했습니다.</strong><p>로컬 서버 또는 GitHub Pages에서 다시 열어 주세요.</p></div>';
  });
})();
