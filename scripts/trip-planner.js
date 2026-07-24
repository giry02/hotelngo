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
  const dayCount = () => Math.max(2, Math.min(14, Math.round((parseDate(state.endDate) - parseDate(state.startDate)) / 86400000) + 1));
  const destination = () => catalog.destinations.find((item) => item.id === state.destinationId) || catalog.destinations[0];
  const itemById = (id) => destination().items.find((item) => item.id === id);
  const dayDate = (day) => addDays(state.startDate, day - 1);
  const dateLabel = (day) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(parseDate(dayDate(day)));
  const money = (value) => `${Number(value || 0).toLocaleString('ko-KR')}원`;
  const categoryLabel = (category) => categoryMeta[category]?.[0] || category;
  const showToast = (message) => {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
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
      category: item.category || item.type || source?.category || 'LANDMARK',
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

  const render = () => {
    const currentDestination = destination();
    const totalsData = totals();
    const days = Array.from({ length: dayCount() }, (_, index) => index + 1);
    const selectedItems = state.items
      .filter((item) => item.day === state.selectedDay)
      .sort((a, b) => a.time.localeCompare(b.time));
    const focusedItemId = query.get('focus');
    const visibleCatalog = currentDestination.items.filter((item) => state.category === 'ALL' || item.category === state.category);
    const categoryCounts = state.items.reduce((accumulator, item) => {
      accumulator[item.category] = (accumulator[item.category] || 0) + 1;
      return accumulator;
    }, {});
    const hotelHref = `hotels.html?destination=${encodeURIComponent(currentDestination.name)}&checkIn=${state.startDate}&checkOut=${state.endDate}&tripId=${encodeURIComponent(state.id)}`;
    const experienceHref = `experiences.html?destination=${encodeURIComponent(currentDestination.name)}&startDate=${state.startDate}&endDate=${state.endDate}&tripId=${encodeURIComponent(state.id)}`;
    root.innerHTML = `
      <section class="planner-hero">
        <div class="planner-hero-row">
          <div><span class="page-eyebrow">${query.get('mode') === 'ai' ? 'AI DRAFT · EDIT EVERYTHING' : 'BUILD ONE COMPLETE JOURNEY'}</span><h1>하나를 고르는 예약이 아니라,<br>여행 전체를 날짜별로 만드세요</h1><p>${query.get('mode') === 'ai' ? 'AI가 만든 다카테고리 초안입니다. 모든 항목을 직접 추가·이동·삭제하고 예약 전에 다시 검증할 수 있습니다.' : '목적지와 기간을 먼저 정하고 숙소·랜드마크·식사·골프·스파·이동을 같은 4박 5일 안에 여러 개 조합합니다.'}</p></div>
          <div class="planner-hero-actions"><a class="ui-button" href="community.html">${icon('users')}<span>다른 여행자 일정</span></a><a class="ui-button" href="ai-travel.html?prompt=${encodeURIComponent(`${currentDestination.name} ${dayCount() - 1}박 ${dayCount()}일 전체 여행을 짜줘`)}">${icon('sparkles')}<span>AI로 처음부터 만들기</span></a></div>
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
        <div class="planner-context-main"><span class="planner-context-pin" aria-hidden="true">⌖</span><div><strong>${escapeHtml(currentDestination.name)} · ${dayCount() - 1}박 ${dayCount()}일 · ${escapeHtml(state.travelers)}</strong><span>${escapeHtml(state.startDate)}–${escapeHtml(state.endDate)} · 일정 ${state.items.length}개 · Mock 카탈로그</span></div></div>
        <div class="planner-context-links"><a href="${hotelHref}">${icon('hotel')}<span>이 날짜의 호텔 찾기</span></a><a href="${experienceHref}">${icon('compass')}<span>이 도시의 즐길거리 찾기</span></a></div>
      </section>
      <div class="planner-workspace">
        <section class="planner-board" aria-labelledby="planner-board-title">
          <div class="planner-board-head"><div><span class="page-eyebrow">2. DAY BY DAY</span><h2 id="planner-board-title">날짜별 여행 일정</h2><p>같은 날에 숙소, 관광, 식사와 활동을 여러 개 배치할 수 있습니다.</p></div><div class="planner-summary">${Object.entries(categoryCounts).map(([category, count]) => `<span>${icon(categoryIcons[category])}${categoryLabel(category)} ${count}</span>`).join('') || '<span>아직 일정 없음</span>'}</div></div>
          <nav class="planner-day-tabs" aria-label="여행 일자">${days.map((day) => `<button class="planner-day-tab${day === state.selectedDay ? ' is-active' : ''}" type="button" data-day="${day}"><strong>DAY ${day}</strong><small>${escapeHtml(dateLabel(day))} · ${state.items.filter((item) => item.day === day).length}개</small></button>`).join('')}</nav>
          <div class="planner-day-title"><strong>DAY ${state.selectedDay} · ${escapeHtml(dateLabel(state.selectedDay))}</strong><span>시간순 자동 정렬</span></div>
          <div class="planner-timeline">${selectedItems.length ? selectedItems.map((item) => `
            <article class="planner-stop" style="--category-color:${categoryMeta[item.category]?.[1] || '#2f6bff'}" data-instance-id="${escapeHtml(item.instanceId)}">
              <time>${escapeHtml(item.time)}</time><span class="planner-stop-line"></span>
              <div class="planner-stop-copy"><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.priceLabel)} · ${item.duration ? `${item.duration}분` : `${dayCount() - 1}박`} · ${escapeHtml(item.bookingType)}</span></div>
              <div class="planner-stop-actions"><select aria-label="${escapeHtml(item.title)} 이동할 일자" data-move-day>${dayOptions(item.day)}</select><button type="button" data-remove-item>${icon('trash')}<span>삭제</span></button></div>
            </article>`).join('') : '<div class="planner-empty-day"><strong>이 날짜에는 아직 일정이 없습니다.</strong><span>오른쪽 카탈로그에서 숙소·장소·식사·활동을 여러 개 추가하세요.</span></div>'}</div>
          <div class="planner-validation">${warnings().map(([tone, message]) => `<article class="${tone}">${escapeHtml(message)}</article>`).join('')}</div>
          <div class="planner-booking-readiness"><article><span>즉시예약 Mock</span><strong>${totalsData.instant}</strong></article><article><span>업체 확인 필요</span><strong>${totalsData.request}</strong></article><article><span>방문 정보</span><strong>${totalsData.info}</strong></article></div>
          <footer class="planner-board-footer"><div class="planner-cost"><small>현재 선택 예상비용 · 실시간 가격 아님</small><strong>${money(totalsData.total)}</strong></div><div class="planner-footer-actions"><button class="ui-button" type="button" data-clear-plan>${icon('trash')}<span>일정 비우기</span></button><button class="ui-button" type="button" data-fill-template>${icon('refresh')}<span>추천 일정 다시 채우기</span></button><button class="ui-button primary" type="button" data-save-plan>${icon('save')}<span>이 일정 저장</span></button></div></footer>
        </section>
        <aside class="planner-catalog" aria-labelledby="planner-catalog-title">
          <div class="planner-catalog-head"><div><span class="page-eyebrow">3. ADD TO YOUR DAYS</span><h2 id="planner-catalog-title">${escapeHtml(currentDestination.name)}에서 무엇을 할까요?</h2><p>추가할 날짜와 시간을 선택하세요. 한 날짜에 여러 항목을 담을 수 있습니다.</p></div></div>
          <div class="planner-category-tabs">${catalog.categories.map((category) => `<button class="${category.id === state.category ? 'is-active' : ''}" type="button" data-category="${escapeHtml(category.id)}">${icon(categoryIcons[category.id])}<span>${escapeHtml(category.label)}</span></button>`).join('')}</div>
          <div class="planner-catalog-list">${visibleCatalog.map((item) => `
            <article class="planner-product${focusedItemId === item.id ? ' is-focused' : ''}" data-catalog-item="${escapeHtml(item.id)}">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
              <div class="planner-product-copy"><small>${escapeHtml(categoryLabel(item.category))} · ${escapeHtml(item.area)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span><div class="planner-product-meta"><b>${escapeHtml(item.priceLabel)}</b><span>${item.duration ? `${item.duration}분` : `${dayCount() - 1}박`} · ${escapeHtml(item.bookingType)}</span></div></div><div class="planner-product-add"><select aria-label="${escapeHtml(item.title)} 추가할 일자" data-add-day>${dayOptions(state.selectedDay)}</select><input type="time" aria-label="${escapeHtml(item.title)} 시작 시간" data-add-time value="${escapeHtml(item.recommendedTime)}"><button type="button" data-add-item>${icon('plus')}<span>추가</span></button></div>
            </article>`).join('')}</div>
        </aside>
      </div>`;
    persistContext();
  };

  const savePlan = () => {
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
      sourceType: query.get('mode') === 'ai' ? 'AI_DRAFT' : 'USER_CREATED',
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
      }))
    };
    api.upsert('trips', record);
    api.appendAudit({ actor: record.ownerId, action: 'MULTI_DAY_TRIP_SAVED', entityType: 'TRIP', entityId: record.id, payload: { itemCount: record.items.length, destination: record.destination } });
    showToast(`${record.title}을(를) ${record.items.length}개 일정으로 저장했습니다.`);
  };

  root.addEventListener('change', (event) => {
    const name = event.target.name;
    if (!['title', 'startDate', 'endDate', 'travelers'].includes(name)) return;
    state[name] = event.target.value;
    if (name === 'startDate' && parseDate(state.endDate) <= parseDate(state.startDate)) state.endDate = addDays(state.startDate, 4);
    if (name === 'endDate' && parseDate(state.endDate) <= parseDate(state.startDate)) state.endDate = addDays(state.startDate, 1);
    state.items = state.items.map((item) => ({ ...item, day: Math.min(item.day, dayCount()) }));
    state.selectedDay = Math.min(state.selectedDay, dayCount());
    render();
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
    }
  });
  root.addEventListener('click', (event) => {
    const destinationButton = event.target.closest('[data-destination-id]');
    if (destinationButton) {
      state.destinationId = destinationButton.dataset.destinationId;
      state.title = `${destination().name} ${dayCount() - 1}박 ${dayCount()}일`;
      state.items = templateItems();
      state.selectedDay = 1;
      render();
      return;
    }
    const dayButton = event.target.closest('[data-day]');
    if (dayButton) {
      state.selectedDay = Number(dayButton.dataset.day);
      render();
      return;
    }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      state.category = categoryButton.dataset.category;
      render();
      return;
    }
    const addButton = event.target.closest('[data-add-item]');
    if (addButton) {
      const card = addButton.closest('[data-catalog-item]');
      const source = itemById(card.dataset.catalogItem);
      const selectedDay = Number(card.querySelector('[data-add-day]').value);
      const time = card.querySelector('[data-add-time]').value || source.recommendedTime;
      if (source.category === 'STAY') state.items = state.items.filter((item) => item.category !== 'STAY');
      const instance = makeInstance(source.id, selectedDay, time);
      if (instance) state.items.push(instance);
      state.selectedDay = selectedDay;
      render();
      showToast(`${source.title}을(를) DAY ${selectedDay} ${time}에 추가했습니다.`);
      return;
    }
    const removeButton = event.target.closest('[data-remove-item]');
    if (removeButton) {
      const instance = removeButton.closest('[data-instance-id]').dataset.instanceId;
      state.items = state.items.filter((item) => item.instanceId !== instance);
      render();
      return;
    }
    if (event.target.closest('[data-clear-plan]')) {
      state.items = [];
      render();
      showToast('일정을 비웠습니다. 원하는 항목을 날짜별로 추가하세요.');
      return;
    }
    if (event.target.closest('[data-fill-template]')) {
      state.items = templateItems();
      state.selectedDay = 1;
      render();
      showToast(`${destination().name} ${dayCount() - 1}박 ${dayCount()}일 추천 일정을 채웠습니다.`);
      return;
    }
    if (event.target.closest('[data-save-plan]')) savePlan();
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
      category: 'ALL',
      selectedDay: 1,
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

  initialize().catch(() => {
    root.innerHTML = '<div class="empty-state"><strong>여행 일정 데이터를 불러오지 못했습니다.</strong><p>로컬 서버 또는 GitHub Pages에서 다시 열어 주세요.</p></div>';
  });
})();
