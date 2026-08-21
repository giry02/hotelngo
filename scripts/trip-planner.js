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
    plus: '<path d="M12 5v14M5 12h14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'
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
  let routeAnimationFrame = null;
  let autosaveTimer = null;
  let saveStatus = 'saved';
  let mapRenderToken = 0;
  const roadRouteCache = new Map();

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
  const recommendedCourse = () => destination().recommendedCourses?.find((item) => item.id === state.presetId) || destination().recommendedCourses?.[0] || null;
  const itemById = (id) => destination().items.find((item) => item.id === id);
  const dayDate = (day) => addDays(state.startDate, day - 1);
  const dateLabel = (day) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(parseDate(dayDate(day)));
  const money = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const categoryLabel = (category) => categoryMeta[category]?.[0] || category;
  const bookingTypeLabel = (type) => ({ INSTANT: '바로 예약 가능', REQUEST: '업체 확인 후 확정', INFORMATION_ONLY: '방문 정보 제공' }[type] || '예약 조건 확인');
  const landmarkIntroduction = (item) => item?.introduction || item?.description || '';
  const landmarkHighlights = (item) => Array.isArray(item?.highlights) && item.highlights.length
    ? item.highlights
    : [item?.area ? `${item.area} 대표 동선` : '도시 대표 동선', item?.duration ? `권장 체류 ${item.duration}분` : '방문 전 체류시간 확인'];
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
  const templateItems = () => (recommendedCourse()?.template || destination().template)
    .filter((entry) => entry.day <= dayCount())
    .map((entry, index) => makeInstance(entry.itemId, entry.day, entry.time, index))
    .filter(Boolean);
  const tripCardItems = () => {
    const requested = new Set(String(query.get('cardIds') || '').split(',').filter(Boolean));
    return (api.list('trip-card', []) || []).filter((item) => item.destinationId === state.destinationId && (!requested.size || requested.has(item.sourceId)));
  };
  const tripCardSourceIds = () => new Set(tripCardItems().map((item) => item.sourceId));
  const recommendedDraftItems = () => {
    const card = query.get('fromCard') === '1' ? tripCardItems() : [];
    const savedIds = new Set(card.map((item) => item.sourceId));
    const base = templateItems().filter((item) => !savedIds.has(item.sourceId));
    let landmarkIndex = 0;
    const preferred = card.map((saved, index) => {
      let source = itemById(saved.sourceId);
      if (!source) {
        source = {
          id: saved.sourceId,
          category: canonicalCategory(saved.category || saved.sourceType),
          title: saved.title,
          area: saved.area || destination().name,
          image: saved.image || destination().cover,
          description: saved.description || '내 여행 카드에서 가져온 장소입니다.',
          duration: Number(saved.duration || 60),
          recommendedTime: saved.recommendedTime || '10:00',
          price: Number(saved.basePrice || saved.price || 0),
          priceLabel: saved.priceLabel || '조건 확인',
          bookingType: saved.bookingType || 'INFORMATION_ONLY',
          status: saved.status || 'CHECK_REQUIRED',
          lat: Number(saved.lat) || null,
          lng: Number(saved.lng) || null
        };
        destination().items.push(source);
      }
      const preferredDay = source.category === 'LANDMARK' ? 0 : Number(saved.options?.preferredDay || 0);
      const day = preferredDay || (source.category === 'LANDMARK'
        ? Math.min(dayCount(), 2 + (landmarkIndex++ % Math.max(1, dayCount() - 1)))
        : source.category === 'STAY' || source.category === 'TRANSPORT' ? 1 : Math.min(dayCount(), 2 + (index % Math.max(1, dayCount() - 1))));
      return makeInstance(source.id, day, saved.options?.preferredTime || source.recommendedTime, index);
    }).filter(Boolean);
    return autoScheduleItems([...preferred, ...base]);
  };
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

  const warnings = (day = state.selectedDay) => {
    const results = [];
    const items = state.items;
    if (!items.some((item) => item.category === 'STAY')) results.push(['error', '숙소가 없습니다. 체크인·체크아웃과 숙박 위치를 먼저 정하세요.']);
    if (!items.some((item) => item.category === 'FOOD')) results.push(['warning', '식사 일정이 없습니다. 이동 동선과 영업시간에 맞는 식당을 추가하세요.']);
    const dayItems = items.filter((item) => item.day === day);
    if (!dayItems.length) results.push(['suggestion', `DAY ${day}는 자유 일정으로 비워두었습니다. 필요한 경우 장소를 추가하세요.`]);
    if (!results.length && !scheduleDiagnostics(day).length) results.push(['suggestion', `DAY ${day} 일정에는 현재 시간 또는 이동 충돌이 없습니다.`]);
    return results.slice(0, 3);
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
  const timeToMinutes = (value = '00:00') => {
    const [hours, minutes] = String(value).split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };
  const minutesToTime = (value) => {
    const normalized = ((Number(value || 0) % 1440) + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
  };
  const travelEstimate = (from, to) => {
    if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;
    const distance = distanceKm(from, to);
    const minutes = Math.max(5, Math.ceil(((distance / 25) * 60 + 8) / 5) * 5);
    return { distance, minutes };
  };
  const roundToFiveMinutes = (value) => Math.ceil(Number(value || 0) / 5) * 5;
  const suggestPlacement = (candidate, requestedDay, requestedTime, items = state.items, excludeInstanceId = '') => {
    const candidateDuration = Math.max(0, Number(candidate?.duration || 0));
    const firstDay = Math.max(1, Math.min(dayCount(), Number(requestedDay) || 1));
    const originalMinutes = Math.max(7 * 60, timeToMinutes(requestedTime || candidate?.recommendedTime || '10:00'));
    for (let day = firstDay; day <= dayCount(); day += 1) {
      let proposedStart = day === firstDay ? originalMinutes : 9 * 60;
      const dayItems = items
        .filter((item) => item.day === day && item.instanceId !== excludeInstanceId)
        .sort((a, b) => a.time.localeCompare(b.time));
      for (const existing of dayItems) {
        const existingStart = timeToMinutes(existing.time);
        const existingEnd = existingStart + Math.max(0, Number(existing.duration || 0));
        const travelAfterCandidate = travelEstimate(candidate, existing)?.minutes || 0;
        if (proposedStart + candidateDuration + travelAfterCandidate <= existingStart) break;
        const travelAfterExisting = travelEstimate(existing, candidate)?.minutes || 0;
        proposedStart = Math.max(proposedStart, existingEnd + travelAfterExisting);
      }
      proposedStart = roundToFiveMinutes(proposedStart);
      if (proposedStart + candidateDuration <= 23 * 60 + 30) {
        return {
          day,
          time: minutesToTime(proposedStart),
          adjusted: day !== firstDay || proposedStart !== originalMinutes,
          requestedDay: firstDay,
          requestedTime: minutesToTime(originalMinutes)
        };
      }
    }
    return { day: firstDay, time: minutesToTime(originalMinutes), adjusted: false, requestedDay: firstDay, requestedTime: minutesToTime(originalMinutes) };
  };
  const autoScheduleItems = (items) => {
    const scheduled = [];
    [...items]
      .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
      .forEach((item) => {
        const placement = suggestPlacement(item, item.day, item.time, scheduled);
        scheduled.push({ ...item, day: placement.day, time: placement.time });
      });
    return scheduled;
  };
  const scheduleDiagnostics = (day) => {
    const items = state.items.filter((item) => item.day === day).sort((a, b) => a.time.localeCompare(b.time));
    const diagnostics = [];
    items.slice(1).forEach((item, index) => {
      const previous = items[index];
      const travel = travelEstimate(previous, item);
      if (!travel) return;
      const previousEnd = timeToMinutes(previous.time) + Number(previous.duration || 0);
      const nextStart = timeToMinutes(item.time);
      const available = nextStart - previousEnd;
      if (available < travel.minutes) {
        const recommendedStart = minutesToTime(previousEnd + travel.minutes);
        const overlap = Math.max(0, previousEnd - nextStart);
        diagnostics.push({
          tone: 'error',
          message: overlap
            ? `DAY ${day} ${previous.title}은 ${minutesToTime(previousEnd)}에 끝나지만 ${item.title}이 ${item.time}에 시작해 ${overlap}분 겹칩니다. 이동 약 ${travel.minutes}분까지 고려해 ${recommendedStart} 이후로 옮겨주세요.`
            : `DAY ${day} ${previous.title} 종료 후 ${item.title}까지 ${available}분 비어 있지만 이동에는 약 ${travel.minutes}분이 필요합니다. ${recommendedStart} 이후 시작을 권장합니다.`
        });
      }
    });
    if (items.length && !items.some((item) => ['LANDMARK', 'TOUR'].includes(item.category))) diagnostics.push({ tone: 'suggestion', message: `DAY ${day}는 랜드마크나 투어 없이 식사·휴식·서비스 중심으로 구성되어 있습니다. 의도한 일정이라면 그대로 저장해도 됩니다.` });
    return diagnostics;
  };
  const visibleCatalogItems = () => {
    const normalized = String(state.catalogSearch || '').trim().toLowerCase();
    const landmarkStage = state.activeStep === 2;
    const matches = destination().items.filter((item) => {
      const stageMatches = landmarkStage ? item.category === 'LANDMARK' : item.category !== 'LANDMARK';
      const categoryMatches = state.category === 'ALL' || item.category === state.category;
      const searchMatches = !normalized || `${item.title} ${item.area} ${item.description}`.toLowerCase().includes(normalized);
      return stageMatches && categoryMatches && searchMatches;
    });
    const savedIds = tripCardSourceIds();
    matches.sort((a, b) => Number(savedIds.has(b.id)) - Number(savedIds.has(a.id)));
    if (state.activeStep === 4) {
      const focus = focusedMapSource();
      if (focus) matches.sort((a, b) => {
        const savedDifference = Number(savedIds.has(b.id)) - Number(savedIds.has(a.id));
        if (savedDifference) return savedDifference;
        const distanceA = a.lat && a.lng ? distanceKm(focus, a) : Number.POSITIVE_INFINITY;
        const distanceB = b.lat && b.lng ? distanceKm(focus, b) : Number.POSITIVE_INFINITY;
        return distanceA - distanceB;
      });
    }
    return matches;
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
  const requestRoadRoute = async (group) => {
    if (group.length <= 1) return null;
    const key = group.map((item) => `${Number(item.lng).toFixed(6)},${Number(item.lat).toFixed(6)}`).join(';');
    if (!roadRouteCache.has(key)) {
      const request = fetch(`https://router.project-osrm.org/route/v1/driving/${key}?alternatives=false&steps=false&overview=full&geometries=geojson`)
        .then((response) => {
          if (!response.ok) throw new Error(`route response ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          const route = payload?.routes?.[0];
          const coordinates = route?.geometry?.coordinates;
          if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
          return {
            coordinates: coordinates.map(([lng, lat]) => [lat, lng]),
            distance: Number(route.distance || 0),
            duration: Number(route.duration || 0)
          };
        })
        .catch(() => null);
      roadRouteCache.set(key, request);
    }
    const result = await roadRouteCache.get(key);
    if (!result) roadRouteCache.delete(key);
    return result;
  };
  const animateRoadRoute = (activeMap, route) => {
    if (route.length <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const segmentLengths = route.slice(1).map((item, index) => distanceKm(
      { lat: route[index][0], lng: route[index][1] },
      { lat: item[0], lng: item[1] }
    ));
    const totalLength = segmentLengths.reduce((sum, value) => sum + value, 0) || 1;
    const traveler = window.L.marker(route[0], {
      zIndexOffset: 1200,
      icon: window.L.divIcon({ className: 'planner-route-traveler-wrap', html: '<span class="planner-route-traveler">➜</span>', iconSize: [38, 38], iconAnchor: [19, 19] })
    }).addTo(activeMap);
    const startedAt = performance.now();
    const animate = (now) => {
      if (mapInstance !== activeMap) return;
      let distanceAt = (((now - startedAt) % 12000) / 12000) * totalLength;
      let segmentIndex = 0;
      while (segmentIndex < segmentLengths.length - 1 && distanceAt > segmentLengths[segmentIndex]) {
        distanceAt -= segmentLengths[segmentIndex];
        segmentIndex += 1;
      }
      const from = route[segmentIndex];
      const to = route[segmentIndex + 1];
      const ratio = Math.min(1, distanceAt / (segmentLengths[segmentIndex] || 1));
      traveler.setLatLng([
        from[0] + (to[0] - from[0]) * ratio,
        from[1] + (to[1] - from[1]) * ratio
      ]);
      routeAnimationFrame = requestAnimationFrame(animate);
    };
    routeAnimationFrame = requestAnimationFrame(animate);
  };
  const renderMap = () => {
    const element = root.querySelector('[data-planner-map]');
    if (!element) return;
    if (routeAnimationFrame) {
      cancelAnimationFrame(routeAnimationFrame);
      routeAnimationFrame = null;
    }
    const points = mapDayItems();
    if (!window.L) {
      element.innerHTML = '<div class="planner-map-fallback"><strong>지도를 불러오지 못했습니다.</strong><span>일정 목록의 장소명과 좌표는 그대로 저장됩니다. 네트워크 연결 후 다시 열어 주세요.</span></div>';
      return;
    }
    const renderToken = ++mapRenderToken;
    mapInstance = window.L.map(element, { zoomControl: true, scrollWheelZoom: false });
    const activeMap = mapInstance;
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
    const bounds = [];
    const scheduledSourceIds = new Set(points.map((item) => item.sourceId));
    if ([2, 4].includes(state.activeStep)) {
      visibleCatalogItems().filter((item) => item.lat && item.lng && !scheduledSourceIds.has(item.id)).forEach((item) => {
        const marker = window.L.marker([item.lat, item.lng], {
          icon: window.L.divIcon({
            className: 'planner-candidate-marker-wrap',
            html: `<span class="planner-candidate-marker" style="--marker-color:${categoryMeta[item.category]?.[1] || '#2f6bff'}">${icon(categoryIcons[item.category])}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        }).addTo(mapInstance);
        const popup = document.createElement('div');
        popup.className = 'planner-map-popup';
        popup.innerHTML = `<small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(landmarkIntroduction(item))}</p><span>${item.duration ? `권장 체류 ${item.duration}분` : `${dayCount() - 1}박`} · ${escapeHtml(item.priceLabel)}</span>`;
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = state.activeStep === 2 ? '랜드마크 일정에 담기' : '상세 확인 후 담기';
        button.addEventListener('click', () => openCatalogItem(item));
        popup.append(button);
        marker.bindPopup(popup);
        marker.on('click', () => { state.focusLocationId = item.id; });
        bounds.push([item.lat, item.lng]);
      });
    }
    points.forEach((item, index) => {
      const color = categoryMeta[item.category]?.[1] || '#2f6bff';
      const marker = window.L.marker([item.lat, item.lng], {
        icon: window.L.divIcon({ className: 'planner-map-marker-wrap', html: `<span class="planner-map-marker${state.focusLocationId === item.sourceId ? ' is-active' : ''}" style="--marker-color:${color}">${index + 1}</span>`, iconSize: [34, 42], iconAnchor: [17, 38] })
      }).addTo(mapInstance);
      marker.bindTooltip(`${index + 1}. ${item.title}`, {
        className: 'planner-route-tooltip',
        direction: 'top',
        offset: [0, -28],
        opacity: 0.96
      });
      marker.on('click', () => {
        state.focusLocationId = item.sourceId;
        state.selectedDay = item.day;
        render();
      });
      bounds.push([item.lat, item.lng]);
    });
    const routeGroups = state.mapDay === 'ALL'
      ? [...new Set(points.map((item) => item.day))].map((day) => points.filter((item) => item.day === day))
      : [points];
    const routeColors = ['#2f6bff', '#10a58f', '#ef8d32', '#8b5cf6', '#e34d73', '#3276d9'];
    const animationGroup = state.mapDay === 'ALL'
      ? routeGroups.find((group) => group[0]?.day === state.selectedDay) || routeGroups.find((group) => group.length > 1)
      : routeGroups[0];
    const routeMetricElement = root.querySelector('.planner-route-metric');
    const routableGroups = routeGroups.filter((group) => group.length > 1);
    if (routableGroups.length && routeMetricElement) routeMetricElement.textContent = '도로 경로 계산 중…';
    Promise.all(routeGroups.map(async (group, index) => ({
      group,
      index,
      road: await requestRoadRoute(group)
    }))).then((results) => {
      if (mapInstance !== activeMap || renderToken !== mapRenderToken) return;
      let totalRoadDistance = 0;
      let totalRoadDuration = 0;
      let failedRoutes = 0;
      results.forEach(({ group, index, road }) => {
        if (group.length <= 1) return;
        if (!road) {
          failedRoutes += 1;
          return;
        }
        const color = routeColors[index % routeColors.length];
        totalRoadDistance += road.distance;
        totalRoadDuration += road.duration;
        window.L.polyline(road.coordinates, { color: '#ffffff', weight: 8, opacity: .94 }).addTo(activeMap);
        window.L.polyline(road.coordinates, { color, weight: 4, opacity: .92 }).addTo(activeMap);
        const middle = road.coordinates[Math.floor(road.coordinates.length / 2)];
        window.L.marker(middle, {
          interactive: false,
          icon: window.L.divIcon({ className: 'planner-route-arrow-wrap', html: `<span class="planner-route-arrow" style="--route-color:${color}">›</span>`, iconSize: [24, 24], iconAnchor: [12, 12] })
        }).addTo(activeMap);
        if (group === animationGroup) animateRoadRoute(activeMap, road.coordinates);
      });
      if (routeMetricElement && routableGroups.length) {
        routeMetricElement.textContent = failedRoutes
          ? '도로 경로 일부를 불러오지 못해 해당 구간은 핀만 표시합니다.'
          : `도로 기준 약 ${(totalRoadDistance / 1000).toFixed(1)}km · 차량 약 ${Math.max(1, Math.round(totalRoadDuration / 60))}분`;
      }
    });
    if (!bounds.length) {
      const fallback = destination().items.find((item) => item.lat && item.lng);
      mapInstance.setView(fallback ? [fallback.lat, fallback.lng] : [16.0544, 108.2022], 11);
    } else {
      mapInstance.fitBounds(bounds, { padding: [34, 34], maxZoom: 13 });
    }
    const renderedMap = mapInstance;
    setTimeout(() => {
      if (!renderedMap || mapInstance !== renderedMap) return;
      renderedMap.invalidateSize();
      const focus = itemById(state.focusLocationId);
      const lat = Number(focus?.lat);
      const lng = Number(focus?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) renderedMap.flyTo([lat, lng], 14, { duration: .55 });
    }, 0);
  };

  const render = () => {
    if (mapInstance) { mapInstance.remove(); mapInstance = null; }
    const currentDestination = destination();
    const totalsData = totals();
    const days = Array.from({ length: dayCount() }, (_, index) => index + 1);
    root.dataset.activeStep = String(state.activeStep || 1);
    const selectedItems = state.items
      .filter((item) => item.day === state.selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
    const visibleCatalog = visibleCatalogItems();
    const mapFocus = focusedMapSource();
    const routePoints = mapDayItems();
    const routeGroups = state.mapDay === 'ALL'
      ? [...new Set(routePoints.map((item) => item.day))].map((day) => routePoints.filter((item) => item.day === day))
      : [routePoints];
    const routeMetric = state.mapDay === 'ALL'
      ? `${dayCount()}일 · 지도 장소 ${routePoints.length}곳 · 도로 경로 표시`
      : `DAY ${state.mapDay} · ${routePoints.length}곳 · 도로 경로 표시`;
    const landmarkItems = state.items.filter((item) => item.category === 'LANDMARK');
    const landmarkDays = new Set(landmarkItems.map((item) => item.day));
    const selectedDiagnostics = scheduleDiagnostics(state.selectedDay);
    const allDiagnostics = days.flatMap((day) => scheduleDiagnostics(day));
    const selectedConflicts = selectedDiagnostics.filter((item) => item.tone === 'error');
    const allConflicts = allDiagnostics.filter((item) => item.tone === 'error');
    const categoryCounts = state.items.reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + 1;
      return accumulator;
    }, {});
    const stepLabels = ['기본정보', '랜드마크', '시간·동선', '상세 서비스', '저장·공유'];
    const cardCount = tripCardItems().length;
    const cardLandmarkCount = tripCardItems().filter((item) => canonicalCategory(item.category || item.sourceType) === 'LANDMARK').length;
    const mapSearchTitle = state.activeStep === 2 ? (cardLandmarkCount ? '내 여행 카드의 랜드마크부터 확인하세요' : '추천 랜드마크를 바꾸거나 더 담으세요') : '선택한 서비스를 확인하고 일정에 배치하세요';
    const mapSearchDescription = state.activeStep === 2
      ? `${cardLandmarkCount ? `여행 카드 ${cardCount}곳 중 랜드마크 ${cardLandmarkCount}곳을 먼저 보여줍니다. ` : ''}추천 초안에서 빼거나 바꾸고 싶은 장소만 수정하면 됩니다.`
      : `${mapFocus?.title || `${currentDestination.name} 일정`}을 기준으로 숙소·식사·골프·스파·투어를 찾습니다.`;
    const categoryTabs = catalog.categories.filter((category) => state.activeStep === 2 ? category.id === 'ALL' : category.id !== 'LANDMARK');
    const focusedCandidate = visibleCatalog.find((item) => item.id === state.focusLocationId) || visibleCatalog[0] || null;
    const focusedCandidateHighlights = landmarkHighlights(focusedCandidate);
    const candidatePreview = focusedCandidate ? `<article class="planner-selected-place" data-catalog-item="${escapeHtml(focusedCandidate.id)}"><img src="${escapeHtml(focusedCandidate.image)}" alt="${escapeHtml(focusedCandidate.title)}"><div class="planner-selected-place-copy"><small>${escapeHtml(categoryLabel(focusedCandidate.category))} · ${escapeHtml(focusedCandidate.area)}</small><h4>${escapeHtml(focusedCandidate.title)}</h4><p>${escapeHtml(landmarkIntroduction(focusedCandidate))}</p><ul>${focusedCandidateHighlights.slice(0, 3).map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}</ul><div><span><b>추천 시간</b>${escapeHtml(focusedCandidate.recommendedTime || '시간 확인')}</span><span><b>체류 시간</b>${focusedCandidate.duration ? `${focusedCandidate.duration}분` : '일정에 맞춰 선택'}</span><span><b>예상 비용</b>${escapeHtml(focusedCandidate.priceLabel)}</span></div></div><footer><button type="button" data-view-item>상세 소개 보기</button><button type="button" data-add-item>${icon('plus')}DAY ${state.selectedDay}에 담기</button></footer></article>` : '';
    const focusedRouteItem = routePoints.find((item) => item.sourceId === state.focusLocationId)
      || routePoints.find((item) => item.day === state.selectedDay)
      || routePoints[0]
      || null;
    const focusedRouteSource = focusedRouteItem ? itemById(focusedRouteItem.sourceId) : null;
    const focusedRouteHighlights = landmarkHighlights(focusedRouteSource).slice(0, 3);
    const routeDetailPanel = focusedRouteItem && focusedRouteSource ? `<aside class="planner-route-detail" data-instance-id="${escapeHtml(focusedRouteItem.instanceId)}">
      <div class="planner-route-detail-visual"><img src="${escapeHtml(focusedRouteSource.image)}" alt="${escapeHtml(focusedRouteSource.title)}"><span>지도 ${Math.max(1, routePoints.indexOf(focusedRouteItem) + 1)}번</span></div>
      <div class="planner-route-detail-body">
        <small>DAY ${focusedRouteItem.day} · ${escapeHtml(focusedRouteItem.time)} · ${escapeHtml(categoryLabel(focusedRouteItem.category))}</small>
        <h3>${escapeHtml(focusedRouteSource.title)}</h3>
        <p>${escapeHtml(landmarkIntroduction(focusedRouteSource))}</p>
        <ul>${focusedRouteHighlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}</ul>
        <dl><div><dt>권장 체류</dt><dd>${focusedRouteItem.duration ? `${focusedRouteItem.duration}분` : '시간 확인'}</dd></div><div><dt>예상 비용</dt><dd>${escapeHtml(focusedRouteItem.priceLabel)}</dd></div><div><dt>지역</dt><dd>${escapeHtml(focusedRouteItem.area)}</dd></div></dl>
      </div>
      <div class="planner-route-detail-check"><strong>DAY ${focusedRouteItem.day} 동선 점검</strong>${scheduleDiagnostics(focusedRouteItem.day).map((item) => `<p class="${item.tone}">${escapeHtml(item.message)}</p>`).join('') || '<p class="success">현재 체류시간과 이동시간 기준으로 겹치는 일정이 없습니다.</p>'}</div>
      <footer><button class="ui-button" type="button" data-map-view-item>장소 상세 보기</button><button class="ui-button primary" type="button" data-map-edit-item>날짜·시간 수정</button></footer>
    </aside>` : `<aside class="planner-route-check"><small>시간·동선 확인</small><strong>표시할 장소가 없습니다</strong><div><p class="warning">이전 단계에서 랜드마크를 일정에 담아 주세요.</p></div><button type="button" class="ui-button" data-planner-step="2">랜드마크 다시 선택</button></aside>`;
    const candidateCards = visibleCatalog.filter((item) => item.id !== focusedCandidate?.id).slice(0, 12).map((item) => {
      const proximity = mapFocus && item.lat && item.lng ? distanceKm(mapFocus, item) : null;
      return `
      <article class="planner-search-result" data-catalog-item="${escapeHtml(item.id)}">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
        <div><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}${proximity !== null ? ` · 기준 장소에서 약 ${proximity.toFixed(1)}km` : ''}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span><em>${escapeHtml(item.priceLabel)} · ${item.duration ? `${item.duration}분` : `${dayCount() - 1}박`}</em></div>
        <footer><button type="button" data-focus-catalog-item>${icon('pin')}소개·지도 확인</button><button type="button" data-add-item>${icon('plus')}날짜·시간 정해 담기</button></footer>
      </article>`;
    }).join('');
    const timeline = selectedItems.length ? selectedItems.map((item, index) => {
      const previous = selectedItems[index - 1];
      const travel = previous ? travelEstimate(previous, item) : null;
      return `${travel ? `<div class="planner-travel-segment"><span>이동</span><strong>차량 약 ${travel.minutes}분</strong><small>${travel.distance.toFixed(1)}km · 직선거리 기반 예상</small></div>` : ''}
        <article class="planner-stop" style="--category-color:${categoryMeta[item.category]?.[1] || '#2f6bff'}" data-instance-id="${escapeHtml(item.instanceId)}">
          <time>${escapeHtml(item.time)}</time><span class="planner-stop-line"></span>
          <div class="planner-stop-copy"><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.priceLabel)} · ${item.duration ? `${item.duration}분 체류` : `${dayCount() - 1}박`} · ${escapeHtml(bookingTypeLabel(item.bookingType))}</span></div>
          <div class="planner-stop-actions"><button type="button" data-edit-item>${icon('calendar')}<span>시간·날짜 수정</span></button><button type="button" data-remove-item>${icon('trash')}<span>삭제</span></button></div>
        </article>`;
    }).join('') : '<div class="planner-empty-day"><strong>이 날짜에는 아직 일정이 없습니다.</strong><span>이전 단계에서 랜드마크를 추가하거나 상세 서비스 단계에서 주변 장소를 담아보세요.</span></div>';
    root.innerHTML = `
      ${state.sourceGuideId ? `<section class="planner-remix-banner"><div><span>REMIXED GUIDE</span><strong>${escapeHtml(state.sourceGuideTitle || '다른 여행자의 일정')}을 바탕으로 만든 내 여행입니다.</strong><p>여기서 변경한 내용은 원본 가이드에 영향을 주지 않습니다.</p></div><a href="trip-guide-detail.html?id=${encodeURIComponent(state.sourceGuideId)}">원본 가이드 보기</a></section>` : ''}
      ${state.sourceType === 'AI_DRAFT' ? `<section class="planner-remix-banner planner-ai-draft-banner"><div><span>AI DRAFT REVIEW</span><strong>AI가 제안한 초안을 편집기로 가져왔습니다.</strong><p>아직 예약된 내용은 없습니다. 날짜·시간·장소와 지도 동선을 확인하고 원하는 대로 수정하세요.</p></div><a href="ai-travel.html${state.sourcePrompt ? `?prompt=${encodeURIComponent(state.sourcePrompt)}` : ''}">AI 조건 다시 만들기</a></section>` : ''}
      ${['RECOMMENDED_DRAFT','CARD_RECOMMENDATION'].includes(state.sourceType) ? `<section class="planner-remix-banner planner-ai-draft-banner planner-course-banner"><div><span>${state.sourceType === 'CARD_RECOMMENDATION' ? 'MY TRAVEL CARD DRAFT' : 'HOTELNGO CURATED COURSE'}</span><strong>${state.sourceType === 'CARD_RECOMMENDATION' ? `내 여행 카드 ${tripCardItems().length}곳을 먼저 반영했습니다.` : `${escapeHtml(recommendedCourse()?.name || '선택한 취향의 추천 일정')}을 자동으로 채웠습니다.`}</strong><p>${state.sourceType === 'CARD_RECOMMENDATION' ? '저장한 장소와 추천 동선을 함께 배치했습니다.' : escapeHtml(recommendedCourse()?.reason || '체류시간과 이동시간을 반영해 겹치지 않게 배치했습니다.')} 처음부터 만들지 말고 필요 없는 곳만 빼거나 교체하세요.</p>${recommendedCourse()?.tags?.length ? `<div class="planner-course-tags">${recommendedCourse().tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}</div><a href="${state.sourceType === 'CARD_RECOMMENDATION' ? `cart.html?destination=${encodeURIComponent(state.destinationId)}` : `trip-create.html?destination=${encodeURIComponent(destination().name)}&preset=${encodeURIComponent(state.presetId || '')}`}">${state.sourceType === 'CARD_RECOMMENDATION' ? '여행 카드 확인' : '다른 추천 코스 보기'}</a></section>` : ''}
      <section class="planner-hero">
        <div class="planner-hero-row">
          <div><span class="page-eyebrow">LANDMARK FIRST TRIP BUILDER</span><h1>랜드마크부터 고르면,<br>시간과 동선은 쉽게 이어집니다</h1><p>여행의 목적이 되는 장소를 날짜별로 먼저 정하고, 이동 가능한 시간 안에서 숙소·식사·활동을 차례로 붙입니다.</p></div>
          <a class="ui-button" href="community.html">${icon('users')}<span>다른 여행자 가이드 보기</span></a>
        </div>
      </section>
      <nav class="planner-stepper" aria-label="여행 일정 만들기 단계">${stepLabels.map((label, index) => { const step = index + 1; return `<button type="button" data-planner-step="${step}" class="${state.activeStep === step ? 'is-active' : ''}${state.activeStep > step ? ' is-complete' : ''}" aria-current="${state.activeStep === step ? 'step' : 'false'}"><span>${state.activeStep > step ? '✓' : step}</span><strong>${label}</strong></button>`; }).join('')}</nav>
      <section class="planner-setup${state.activeStep === 1 ? '' : ' is-hidden-step'}" aria-labelledby="planner-setup-title">
        <div class="planner-setup-head"><h2 id="planner-setup-title">1. 어디로, 언제, 누구와 가나요?</h2><span>이 정보가 호텔·즐길거리·AI 추천에 공통으로 적용됩니다.</span></div>
        <div class="planner-fields">
          <label class="planner-field"><span>여행 이름</span><input name="title" value="${escapeHtml(state.title)}"></label>
          <label class="planner-field"><span>출발일</span><input name="startDate" type="date" value="${escapeHtml(state.startDate)}"></label>
          <label class="planner-field"><span>귀국일</span><input name="endDate" type="date" value="${escapeHtml(state.endDate)}"></label>
          <label class="planner-field"><span>여행 인원</span><select name="travelers"><option${state.travelers === '혼자' ? ' selected' : ''}>혼자</option><option${state.travelers === '성인 2명' ? ' selected' : ''}>성인 2명</option><option${state.travelers === '가족 4명' ? ' selected' : ''}>가족 4명</option><option${state.travelers === '친구 4명' ? ' selected' : ''}>친구 4명</option></select></label>
        </div>
        <div class="planner-date-assist"><div><strong>빠른 기간 선택</strong><span data-duration-summary>${dayCount() - 1}박 ${dayCount()}일 · ${escapeHtml(state.startDate)}부터 ${escapeHtml(state.endDate)}까지</span></div><div><button type="button" data-trip-nights="3">3박 4일</button><button type="button" data-trip-nights="4">4박 5일</button><button type="button" data-trip-nights="5">5박 6일</button></div></div>
        <div class="destination-strip" aria-label="여행지 선택">${catalog.destinations.map((item) => `<button class="destination-choice${item.id === state.destinationId ? ' is-active' : ''}" type="button" data-destination-id="${escapeHtml(item.id)}"><img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}"><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.country)} · ${escapeHtml(item.summary)}</small></span></button>`).join('')}</div>
        <footer class="planner-stage-actions"><span>다음 단계에서는 숙소나 식당보다 먼저 핵심 랜드마크를 고릅니다.</span><button class="ui-button primary" type="button" data-planner-step="2">다음: 랜드마크 선택</button></footer>
      </section>
      <section class="planner-context${state.activeStep === 1 ? ' is-hidden-step' : ''}">
        <div class="planner-context-main"><span class="planner-context-pin" aria-hidden="true">⌖</span><div><strong>${escapeHtml(currentDestination.name)} · ${dayCount() - 1}박 ${dayCount()}일 · ${escapeHtml(state.travelers)}</strong><span>${escapeHtml(state.startDate)}–${escapeHtml(state.endDate)} · 일정 ${state.items.length}개 · 현지 도착 후 시작 기준</span></div></div>
        <button type="button" data-planner-step="1">여행 정보 변경</button>
      </section>
      <section class="planner-route${[2,3,4].includes(state.activeStep) ? '' : ' is-hidden-step'}" aria-labelledby="planner-route-title">
        <div class="planner-route-head"><div><span class="page-eyebrow">${state.activeStep === 2 ? 'STEP 2 · LANDMARKS FIRST' : state.activeStep === 3 ? 'STEP 3 · TIME & ROUTE' : 'STEP 4 · SERVICES NEAR YOUR ROUTE'}</span><h2 id="planner-route-title">${state.activeStep === 2 ? '날짜별 핵심 랜드마크를 먼저 고르세요' : state.activeStep === 3 ? '선택한 순서대로 실제 가능한지 확인하세요' : '확정한 랜드마크 동선에 서비스를 붙이세요'}</h2><p>${state.activeStep === 2 ? `${dayCount()}일 동안 방문하고 싶은 장소를 날짜와 시간에 담으면 지도가 자동으로 연결됩니다.` : state.activeStep === 3 ? '장소 사이의 예상 이동시간과 체류시간을 비교해 겹치는 일정을 알려드립니다.' : '숙소·식사·골프·스파·투어는 핵심 동선이 정해진 뒤 추가합니다.'}</p></div><div class="planner-route-controls"><span class="planner-route-metric">${escapeHtml(routeMetric)}</span><div class="planner-map-days"><button class="${state.mapDay === 'ALL' ? 'is-active' : ''}" type="button" data-map-day="ALL">전체</button>${days.map((day) => `<button class="${state.mapDay === day ? 'is-active' : ''}" type="button" data-map-day="${day}">DAY ${day}</button>`).join('')}</div></div></div>
        <div class="planner-route-legend"><span><i class="route-number"></i>일정에 담은 장소</span><span><i class="route-candidate"></i>검색 후보</span><span><i class="route-motion">➜</i>도로 기준 예상 이동</span></div>
        <div class="planner-route-grid"><div class="planner-map" data-planner-map aria-label="${escapeHtml(currentDestination.name)} 일정 지도"></div>${[2,4].includes(state.activeStep) ? `<aside class="planner-map-search"><div class="planner-map-search-head"><small>${state.activeStep === 2 ? `랜드마크 탐색·일정 추가 · 선택 완료 ${landmarkDays.size}/${dayCount()}일` : `기준 장소 ${mapFocus ? escapeHtml(mapFocus.title) : '일정 전체'}`}</small><h3>${mapSearchTitle}</h3><p>${mapSearchDescription}</p></div><ol class="planner-use-guide">${state.activeStep === 2 ? '<li><b>1</b><span><strong>검색 또는 후보 선택</strong><br>장소를 먼저 찾습니다.</span></li><li><b>2</b><span><strong>소개와 지도 위치 확인</strong><br>갈 곳인지 판단합니다.</span></li><li><b>3</b><span><strong>DAY·시간을 정해 담기</strong><br>지도 동선에 반영합니다.</span></li>' : '<li><b>1</b><span><strong>서비스 내용 확인</strong><br>가격·체류시간을 확인합니다.</span></li><li><b>2</b><span><strong>DAY·시간 선택</strong><br>방문할 날짜와 시간을 정합니다.</span></li><li><b>3</b><span><strong>일정에 담기</strong><br>지도 동선과 충돌 여부를 확인합니다.</span></li>'}</ol><label class="planner-catalog-search"><span>${state.activeStep === 2 ? '1. 랜드마크 찾기' : '다른 서비스 찾기'}</span><input type="search" data-catalog-search placeholder="장소명·지역 검색" value="${escapeHtml(state.catalogSearch || '')}"></label>${state.activeStep === 4 ? `<div class="planner-category-tabs">${categoryTabs.map((category) => `<button class="${category.id === state.category ? 'is-active' : ''}" type="button" data-category="${escapeHtml(category.id)}">${icon(categoryIcons[category.id])}<span>${escapeHtml(category.label)}</span></button>`).join('')}</div>` : ''}${focusedCandidate ? `<div class="planner-selected-place-label"><b>2</b><span><strong>${state.activeStep === 2 ? '선택한 랜드마크 확인' : '선택한 서비스 확인'}</strong><small>소개를 읽고 아래 버튼에서 날짜와 시간을 정해 담으세요.</small></span></div>` : ''}${candidatePreview}<div class="planner-search-list-title"><strong>${state.activeStep === 2 ? '다른 랜드마크 선택' : '주변 추천 서비스'}</strong><span>${visibleCatalog.length}곳</span></div><div class="planner-search-results">${candidateCards || '<div class="planner-catalog-empty"><strong>검색 결과가 없습니다.</strong><span>다른 검색어를 입력해 보세요.</span></div>'}</div></aside>` : `<aside class="planner-route-check"><small>DAY ${state.selectedDay} 시간 검토</small><strong>${selectedConflicts.length ? `${selectedConflicts.length}개 조정 필요` : '이동 가능한 일정입니다'}</strong><div>${selectedDiagnostics.map((item) => `<p class="${item.tone}">${escapeHtml(item.message)}</p>`).join('') || '<p class="success">현재 좌표와 체류시간 기준으로 겹치는 구간이 없습니다.</p>'}</div><button type="button" class="ui-button" data-planner-step="2">랜드마크 다시 선택</button></aside>`}</div>
        ${state.activeStep === 2 ? `<footer class="planner-stage-actions"><span>랜드마크 ${landmarkItems.length}곳 · ${landmarkDays.size}일에 배치됨</span><button class="ui-button primary" type="button" data-planner-step="3" ${landmarkItems.length ? '' : 'disabled'}>랜드마크 선택 완료 · 동선 확인</button></footer>` : state.activeStep === 4 ? `<footer class="planner-stage-actions"><button class="ui-button" type="button" data-planner-step="3">이전: 동선 확인</button><button class="ui-button primary" type="button" data-planner-step="5">다음: 전체 일정 저장</button></footer>` : ''}
      </section>
      <div class="planner-workspace${[3,5].includes(state.activeStep) ? '' : ' is-hidden-step'}">
        <section class="planner-board" aria-labelledby="planner-board-title">
          <div class="planner-board-head"><div><span class="page-eyebrow">${state.activeStep === 5 ? 'STEP 5 · REVIEW & SHARE' : 'DAY BY DAY'}</span><h2 id="planner-board-title">${state.activeStep === 5 ? '전체 일정을 검토하고 저장하세요' : '날짜별 시간표'}</h2><p>일정을 누르면 날짜·시간·체류시간을 다시 조정할 수 있습니다.</p></div><div class="planner-summary" aria-label="일정 구성 요약">${Object.entries(categoryCounts).map(([category, count]) => `<span style="--summary-color:${categoryMeta[category]?.[1] || '#2f6bff'}">${icon(categoryIcons[category])}<b>${escapeHtml(categoryLabel(category))}</b><em>${count}</em></span>`).join('') || `<span class="is-empty">${icon('calendar')}<b>아직 일정 없음</b></span>`}</div></div>
          <nav class="planner-day-tabs" aria-label="여행 일자">${days.map((day) => `<button class="planner-day-tab${day === state.selectedDay ? ' is-active' : ''}" type="button" data-day="${day}"><strong>DAY ${day}</strong><small>${escapeHtml(dateLabel(day))} · ${state.items.filter((item) => item.day === day).length}개</small></button>`).join('')}</nav>
          <div class="planner-day-title"><strong>DAY ${state.selectedDay} · ${escapeHtml(dateLabel(state.selectedDay))}</strong><span>시간순 자동 정렬</span></div>
          <div class="planner-timeline">${timeline}</div>
          <div class="planner-validation">${[...selectedDiagnostics.map((item) => [item.tone, item.message]), ...warnings(state.selectedDay)].map(([tone, message]) => `<article class="${tone}">${escapeHtml(message)}</article>`).join('')}</div>
          <div class="planner-booking-readiness"><article><span>바로 예약 가능</span><strong>${totalsData.instant}</strong></article><article><span>업체 확인 필요</span><strong>${totalsData.request}</strong></article><article><span>방문 정보</span><strong>${totalsData.info}</strong></article></div>
          <footer class="planner-board-footer"><div class="planner-cost"><small>표시된 참고가격 합계 · 인원과 옵션에 따라 달라질 수 있음</small><strong>${money(totalsData.total)}</strong><span class="planner-save-status" data-save-status data-state="${saveStatus}">${saveStatus === 'saving' ? '변경사항 저장 중…' : saveStatus === 'error' ? '저장 실패 · 다시 시도해 주세요' : allConflicts.length ? `자동 저장됨 · 시간 조정 필요 ${allConflicts.length}건` : '자동 저장됨 · 시간 충돌 없음'}</span></div><div class="planner-footer-actions">${state.activeStep === 3 ? `<button class="ui-button" type="button" data-planner-step="2">${icon('pin')}<span>랜드마크 수정</span></button><button class="ui-button primary" type="button" data-planner-step="4">${icon('plus')}<span>다음: 주변 서비스 추가</span></button>` : `<button class="ui-button" type="button" data-planner-step="4">${icon('plus')}<span>서비스 더 담기</span></button><button class="ui-button" type="button" data-share-plan>${icon('users')}<span>가이드 공유</span></button><button class="ui-button primary" type="button" data-save-plan>${icon('save')}<span>내 여행 저장</span></button>`}</div></footer>
        </section>
      </div>`;
    if (state.activeStep === 3) {
      const routeCheck = root.querySelector('.planner-route-check');
      if (routeCheck) routeCheck.outerHTML = routeDetailPanel;
    }
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
      sourcePrompt: state.sourcePrompt || null,
      sourceTripId: state.sourceTripId || null,
      sourceGuideId: state.sourceGuideId || null,
      sourceGuideTitle: state.sourceGuideTitle || null,
      sourceAuthor: state.sourceAuthor || null,
      sourcePublishedVersion: state.sourcePublishedVersion || null,
      presetId: state.presetId || null,
      presetName: recommendedCourse()?.name || state.presetName || null,
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
    const requestedTime = time || source.recommendedTime || '10:00';
    const placementItems = source.category === 'STAY' ? state.items.filter((item) => item.category !== 'STAY') : state.items;
    const placement = suggestPlacement(source, selectedDay, requestedTime, placementItems);
    if (source.category === 'STAY') state.items = placementItems;
    const instance = makeInstance(source.id, placement.day, placement.time);
    if (instance) state.items.push(instance);
    state.selectedDay = placement.day;
    state.mapDay = placement.day;
    if (['LANDMARK', 'TOUR'].includes(source.category)) state.focusLocationId = source.id;
    render();
    scheduleAutosave();
    showToast(placement.adjusted
      ? `${source.title}은(는) 기존 일정과 겹치지 않도록 DAY ${placement.day} ${placement.time}에 배치했습니다.`
      : `${source.title}을(를) DAY ${placement.day} ${placement.time}에 추가했습니다.`);
  };
  const openCatalogItem = (source) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'planner-dialog planner-add-dialog';
    const highlights = landmarkHighlights(source);
    const placementItems = () => source.category === 'STAY' ? state.items.filter((item) => item.category !== 'STAY') : state.items;
    const initialPlacement = suggestPlacement(source, state.selectedDay, source.recommendedTime, placementItems());
    const placementMessage = (placement) => placement.adjusted
      ? `기존 일정의 체류시간과 이동시간을 반영해 ${placement.requestedTime} 대신 DAY ${placement.day} · ${placement.time} 시작을 제안합니다.`
      : `DAY ${placement.day} ${placement.time}은 현재 일정과 겹치지 않는 시간입니다.`;
    dialog.innerHTML = `<header><div><small>${source.category === 'LANDMARK' ? 'LANDMARK GUIDE · ' : ''}${escapeHtml(categoryLabel(source.category))} · ${escapeHtml(source.area)}</small><strong>${escapeHtml(source.title)}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="planner-dialog-body"><img src="${escapeHtml(source.image)}" alt="${escapeHtml(source.title)}"><section class="planner-dialog-introduction"><h3>장소 소개</h3><p>${escapeHtml(landmarkIntroduction(source))}</p><ul>${highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join('')}</ul>${source.visitTip ? `<div><strong>방문 팁</strong><span>${escapeHtml(source.visitTip)}</span></div>` : ''}</section><div class="planner-dialog-facts"><span><small>추천 시작</small><strong>${escapeHtml(source.recommendedTime || '시간 확인')}</strong></span><span><small>권장 체류</small><strong>${source.duration ? `${source.duration}분` : `${dayCount() - 1}박`}</strong></span><span><small>예상 비용</small><strong>${escapeHtml(source.priceLabel)}</strong></span></div><div class="planner-dialog-howto"><strong>내 일정에 담는 방법</strong><span>날짜를 선택하면 기존 일정의 체류시간과 이동시간을 계산해 겹치지 않는 시작 시각을 먼저 제안합니다.</span></div><div class="planner-dialog-fields"><label><span>추가할 날짜</span><select data-dialog-day>${dayOptions(initialPlacement.day)}</select></label><label><span>충돌 없는 시작 시간</span><input type="time" data-dialog-time value="${escapeHtml(initialPlacement.time)}"></label></div><p class="planner-dialog-auto-time" data-dialog-auto-note>${escapeHtml(placementMessage(initialPlacement))}</p></div><footer><button class="ui-button" type="button" data-planner-cancel>취소</button><button class="ui-button primary" type="button" data-planner-confirm>${icon('plus')}DAY ${initialPlacement.day} ${initialPlacement.time}에 추가</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-planner-cancel]').addEventListener('click', close);
    const confirmButton = dialog.querySelector('[data-planner-confirm]');
    const daySelect = dialog.querySelector('[data-dialog-day]');
    const timeInput = dialog.querySelector('[data-dialog-time]');
    const autoNote = dialog.querySelector('[data-dialog-auto-note]');
    const updatePlacementPreview = ({ replaceTime = false } = {}) => {
      const placement = suggestPlacement(source, Number(daySelect.value), timeInput.value || source.recommendedTime, placementItems());
      if (replaceTime) {
        daySelect.value = String(placement.day);
        timeInput.value = placement.time;
      }
      autoNote.textContent = placementMessage(placement);
      confirmButton.innerHTML = `${icon('plus')}DAY ${placement.day} ${placement.time}에 추가`;
      return placement;
    };
    daySelect.addEventListener('change', () => {
      timeInput.value = source.recommendedTime || '10:00';
      updatePlacementPreview({ replaceTime: true });
    });
    timeInput.addEventListener('change', () => updatePlacementPreview({ replaceTime: true }));
    confirmButton.addEventListener('click', () => {
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
      const requestedDay = Number(dialog.querySelector('[data-edit-day]').value);
      const requestedTime = dialog.querySelector('[data-edit-time]').value || item.time;
      const nextDuration = Math.max(0, Number(dialog.querySelector('[data-edit-duration]').value || 0));
      const placement = suggestPlacement({ ...item, duration: nextDuration }, requestedDay, requestedTime, state.items, item.instanceId);
      item.day = placement.day;
      item.time = placement.time;
      item.duration = nextDuration;
      item.note = dialog.querySelector('[data-edit-note]').value.trim();
      state.selectedDay = item.day;
      state.mapDay = item.day;
      render();
      scheduleAutosave();
      showToast(placement.adjusted
        ? `${item.title}은(는) 겹치지 않도록 DAY ${placement.day} ${placement.time}으로 조정했습니다.`
        : `${item.title} 일정을 수정했습니다.`);
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
    state.items = ['ai', 'guided', 'recommended'].includes(query.get('mode')) || query.get('fromCard') === '1' ? recommendedDraftItems() : [];
    state.selectedDay = 1;
    state.mapDay = 1;
    state.category = 'ALL';
    state.focusLocationId = '';
    render();
    scheduleAutosave();
    showUndo(`${destination().name} 랜드마크 선택 단계로 변경했습니다.`, previous);
  };

  root.addEventListener('change', (event) => {
    const name = event.target.name;
    if (!['title', 'startDate', 'endDate', 'travelers'].includes(name)) return;
    const nextValue = event.target.value;
    if (!state.items.length) {
      state[name] = nextValue;
      if (name === 'startDate' || name === 'endDate') {
        const summary = root.querySelector('[data-duration-summary]');
        if (summary) {
          const validRange = state.startDate && state.endDate && parseDate(state.endDate) > parseDate(state.startDate);
          summary.textContent = validRange
            ? `${dayCount() - 1}박 ${dayCount()}일 · ${state.startDate}부터 ${state.endDate}까지`
            : '귀국일을 출발일보다 뒤의 날짜로 선택해 주세요.';
          summary.dataset.state = validRange ? 'valid' : 'error';
        }
      }
      scheduleAutosave();
      return;
    }
    if (name === 'title' || name === 'travelers') {
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
    const nightsButton = event.target.closest('[data-trip-nights]');
    if (nightsButton) {
      const startInput = root.querySelector('[name="startDate"]');
      const endInput = root.querySelector('[name="endDate"]');
      const nights = Number(nightsButton.dataset.tripNights || 4);
      const startDate = startInput?.value || state.startDate;
      const endDate = addDays(startDate, nights);
      state.startDate = startDate;
      state.endDate = endDate;
      if (endInput) endInput.value = endDate;
      const summary = root.querySelector('[data-duration-summary]');
      if (summary) summary.textContent = `${nights}박 ${nights + 1}일 · ${startDate}부터 ${endDate}까지`;
      root.querySelectorAll('[data-trip-nights]').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.tripNights) === nights));
      scheduleAutosave();
      return;
    }
    const stepButton = event.target.closest('[data-planner-step]');
    if (stepButton) {
      const nextStep = Math.max(1, Math.min(5, Number(stepButton.dataset.plannerStep || 1)));
      if (nextStep === 2) {
        const startInput = root.querySelector('[name="startDate"]');
        const endInput = root.querySelector('[name="endDate"]');
        const titleInput = root.querySelector('[name="title"]');
        const travelerInput = root.querySelector('[name="travelers"]');
        const startDate = startInput?.value || state.startDate;
        const endDate = endInput?.value || state.endDate;
        if (!startDate || !endDate || parseDate(endDate) <= parseDate(startDate)) {
          showToast('귀국일은 출발일보다 뒤의 날짜로 선택해 주세요.');
          return;
        }
        state.startDate = startDate;
        state.endDate = endDate;
        state.title = titleInput?.value.trim() || state.title;
        state.travelers = travelerInput?.value || state.travelers;
      }
      if (nextStep >= 3 && !state.items.some((item) => item.category === 'LANDMARK')) {
        showToast('먼저 지도에서 핵심 랜드마크를 하나 이상 일정에 담아 주세요.');
        return;
      }
      state.activeStep = nextStep;
      if (nextStep === 2) state.category = 'ALL';
      if (nextStep === 4 && state.category === 'LANDMARK') state.category = 'ALL';
      if ([2,3,4].includes(nextStep) && state.mapDay === 'ALL') state.mapDay = state.selectedDay;
      render();
      root.querySelector('.planner-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const destinationButton = event.target.closest('[data-destination-id]');
    if (destinationButton) {
      const nextId = destinationButton.dataset.destinationId;
      if (nextId === state.destinationId) return;
      const nextDestination = catalog.destinations.find((item) => item.id === nextId);
      if (!state.items.length) {
        state.destinationId = nextId;
        state.title = `${nextDestination.name} ${dayCount() - 1}박 ${dayCount()}일`;
        state.category = 'ALL';
        state.focusLocationId = '';
        render();
        scheduleAutosave();
        return;
      }
      openPlannerDialog({
        title: `${nextDestination.name}(으)로 여행지를 바꿀까요?`,
        message: `<p>현재 ${destination().name} 일정 ${state.items.length}개를 비우고 ${nextDestination.name} 랜드마크 선택부터 다시 시작합니다.</p><div class="planner-change-impact"><span>현재 일정</span><strong>${state.items.length}개</strong><span>변경 후</span><strong>랜드마크 선택</strong></div><p>변경 후 10초 안에 이전 일정으로 되돌릴 수 있습니다.</p>`,
        confirmLabel: '여행지 변경',
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
    const focusCandidateButton = event.target.closest('[data-focus-catalog-item]');
    if (focusCandidateButton) {
      const card = focusCandidateButton.closest('[data-catalog-item]');
      state.focusLocationId = card?.dataset.catalogItem || '';
      render();
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
    const mapViewButton = event.target.closest('[data-map-view-item]');
    if (mapViewButton) {
      const instance = mapViewButton.closest('[data-instance-id]')?.dataset.instanceId;
      const item = state.items.find((candidate) => candidate.instanceId === instance);
      const source = item ? itemById(item.sourceId) : null;
      if (source) openCatalogItem(source);
      return;
    }
    const mapEditButton = event.target.closest('[data-map-edit-item]');
    if (mapEditButton) {
      const instance = mapEditButton.closest('[data-instance-id]')?.dataset.instanceId;
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
          state.items = autoScheduleItems(templateItems());
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
      title: storedTrip?.title || (catalog.destinations.find((item) => item.id === destinationId)?.recommendedCourses?.find((item) => item.id === query.get('preset'))?.name || `${catalog.destinations.find((item) => item.id === destinationId)?.name || '다낭'} 4박 5일`),
      destinationId: storedTrip?.destinationId || findDestinationId(storedTrip?.destination || destinationId),
      startDate: storedTrip?.startDate || query.get('startDate') || query.get('checkIn') || dates.start,
      endDate: storedTrip?.endDate || query.get('endDate') || query.get('checkOut') || dates.end,
      travelers: storedTrip?.travelers || query.get('travelers') || '성인 2명',
      sourceType: storedTrip?.sourceType || (query.get('mode') === 'ai' ? 'AI_DRAFT' : query.get('fromCard') === '1' ? 'CARD_RECOMMENDATION' : ['guided','recommended'].includes(query.get('mode')) ? 'RECOMMENDED_DRAFT' : 'USER_CREATED'),
      sourcePrompt: storedTrip?.sourcePrompt || query.get('prompt') || null,
      sourceTripId: storedTrip?.sourceTripId || null,
      sourceGuideId: storedTrip?.sourceGuideId || (storedTrip?.sourceType === 'COMMUNITY_COPY' ? storedTrip?.sourceTripId : null) || null,
      sourceGuideTitle: storedTrip?.sourceGuideTitle || (storedTrip?.sourceType === 'COMMUNITY_COPY' ? String(storedTrip?.title || '').replace(/\s*·\s*내 버전$/, '') : null) || null,
      sourceAuthor: storedTrip?.sourceAuthor || null,
      sourcePublishedVersion: storedTrip?.sourcePublishedVersion || null,
      presetId: storedTrip?.presetId || query.get('preset') || null,
      presetName: storedTrip?.presetName || null,
      category: 'ALL',
      catalogSearch: '',
      activeStep: query.get('focus') ? 2 : storedTrip ? 3 : (['ai','guided','recommended'].includes(query.get('mode')) || query.get('fromCard') === '1') ? 3 : 1,
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
        image: query.get('candidateImage') || destination().cover,
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
      : (['ai', 'guided', 'recommended'].includes(query.get('mode')) || query.get('fromCard') === '1') ? recommendedDraftItems() : [];
    if (['AI_DRAFT', 'RECOMMENDED_DRAFT', 'CARD_RECOMMENDATION'].includes(state.sourceType)) {
      state.items = autoScheduleItems(state.items);
    }
    const focusedItem = itemById(query.get('focus'));
    if (focusedItem) {
      state.category = focusedItem.category;
      state.activeStep = focusedItem.category === 'LANDMARK' ? 2 : 4;
    }
    render();
  };

  window.addEventListener('beforeunload', () => {
    if (state && autosaveTimer) savePlan({ silent: true });
  });

  initialize().catch(() => {
    root.innerHTML = '<div class="empty-state"><strong>여행 일정 데이터를 불러오지 못했습니다.</strong><p>로컬 서버 또는 GitHub Pages에서 다시 열어 주세요.</p></div>';
  });
})();
