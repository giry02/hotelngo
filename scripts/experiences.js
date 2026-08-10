(() => {
  const api = window.HotelNGoMockAPI;
  const root = document.querySelector('[data-experience-root]');
  if (!api?.get || !root) return;
  const params = new URLSearchParams(location.search);
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const categoryLabels = {
    LANDMARK: '랜드마크',
    FOOD: '식사·카페',
    GOLF: '골프',
    SPA: '마사지·스파',
    TOUR: '투어·체험',
    TRANSPORT: '차량·픽업'
  };
  const bookingLabels = { INSTANT: '바로 예약 가능', REQUEST: '업체 확인 후 확정', INFORMATION_ONLY: '방문 정보 제공' };
  let catalog;
  let destinationId = '';
  let category = categoryLabels[params.get('focus')] ? params.get('focus') : 'ALL';

  const destination = () => catalog.destinations.find((item) => item.id === destinationId);
  const destinationIdFrom = (value) => {
    const normalized = String(value || '').toLowerCase();
    return catalog.destinations.find((item) => [item.id, item.name].some((candidate) => String(candidate).toLowerCase() === normalized))?.id || '';
  };
  const tripHref = (itemId = '') => {
    const selected = destination();
    const next = new URLSearchParams({
      destination: selected.name,
      startDate: params.get('startDate') || '',
      endDate: params.get('endDate') || '',
      tripId: params.get('tripId') || ''
    });
    [...next.keys()].forEach((key) => { if (!next.get(key)) next.delete(key); });
    if (itemId) next.set('focus', itemId);
    return `trip-planner.html?${next.toString()}`;
  };

  const renderDestinationGate = () => {
    document.title = '여행지 선택 · 즐길거리 · HotelnGo';
    root.innerHTML = `
      <section class="experience-destination-gate">
        <div><span class="page-eyebrow">CHOOSE A DESTINATION FIRST</span><h1>어느 도시에서<br>무엇을 해볼까요?</h1><p>서로 다른 도시의 상품을 섞어 보여주지 않습니다. 여행지를 먼저 고르면 그 도시의 랜드마크·식사·골프·스파·투어·이동만 보여드립니다.</p></div>
        <a class="ui-button" href="ai-travel.html">아직 미정이면 AI 추천</a>
      </section>
      <section class="experience-destination-grid" aria-label="여행지 선택">${catalog.destinations.map((item) => `<button type="button" data-destination="${escapeHtml(item.id)}"><img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.name)}"><span><small>${escapeHtml(item.country)}</small><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(item.summary)}</em><b>${item.items.filter((product) => product.category !== 'STAY').length}개 즐길거리</b></span></button>`).join('')}</section>
      <section class="experience-purpose"><article><strong>랜드마크</strong><p>예약 상품이 아니라 방문시간·동선·주변 장소를 확인합니다.</p></article><article><strong>예약형 활동</strong><p>골프·스파·투어는 날짜와 슬롯을 선택해 일정에 넣습니다.</p></article><article><strong>식사와 이동</strong><p>여행 날짜와 숙소 위치를 기준으로 시간 충돌을 확인합니다.</p></article></section>`;
  };

  const renderCatalog = () => {
    const selected = destination();
    const products = selected.items.filter((item) => item.category !== 'STAY' && (category === 'ALL' || item.category === category));
    document.title = `${selected.name} 즐길거리 · HotelnGo`;
    const hotelHref = `hotels.html?destination=${encodeURIComponent(selected.name)}`;
    root.innerHTML = `
      <section class="experience-catalog-hero">
        <img src="${escapeHtml(selected.cover)}" alt="${escapeHtml(selected.name)}">
        <div><span class="page-eyebrow">${escapeHtml(selected.country)} · ${escapeHtml(selected.name)}</span><h1>${escapeHtml(selected.name)}에서<br>무엇을 해볼까요?</h1><p>${escapeHtml(selected.summary)}</p><div class="page-head-actions"><a class="ui-button primary" href="${tripHref()}">이 도시로 일정 만들기</a><a class="ui-button" href="${hotelHref}">호텔 보기</a><button class="ui-button" type="button" data-change-destination>도시 바꾸기</button></div></div>
      </section>
      <div class="experience-context-note"><strong>현재 여행지: ${escapeHtml(selected.name)}</strong><span>일정 날짜가 있으면 운영시간·예약 가능 여부·이동시간 순으로 다시 정렬합니다.</span></div>
      <nav class="experience-category-nav" aria-label="즐길거리 분류"><button class="${category === 'ALL' ? 'is-active' : ''}" type="button" data-category="ALL">전체</button>${Object.entries(categoryLabels).map(([id, label]) => `<button class="${category === id ? 'is-active' : ''}" type="button" data-category="${id}">${escapeHtml(label)}</button>`).join('')}</nav>
      <section class="experience-product-grid">${products.map((item) => `<article class="experience-product-card"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"><div><small>${escapeHtml(categoryLabels[item.category])} · ${escapeHtml(item.area)}</small><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p><dl><div><dt>소요시간</dt><dd>${item.duration ? `${item.duration}분` : '숙박 구간'}</dd></div><div><dt>예상금액</dt><dd>${escapeHtml(item.priceLabel)}</dd></div><div><dt>예약방식</dt><dd>${escapeHtml(bookingLabels[item.bookingType] || '조건 확인')}</dd></div></dl><div class="page-head-actions"><a class="ui-button primary" href="${tripHref(item.id)}">상세 보고 일정에 추가</a><button class="ui-button" type="button" data-save-candidate="${escapeHtml(item.id)}">후보 저장</button></div></div></article>`).join('')}</section>`;
  };

  root.addEventListener('click', (event) => {
    const destinationButton = event.target.closest('[data-destination]');
    if (destinationButton) {
      destinationId = destinationButton.dataset.destination;
      params.set('destination', destination().name);
      history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
      renderCatalog();
      return;
    }
    if (event.target.closest('[data-change-destination]')) {
      destinationId = '';
      params.delete('destination');
      history.replaceState({}, '', location.pathname);
      renderDestinationGate();
      return;
    }
    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      category = categoryButton.dataset.category;
      if (category === 'ALL') params.delete('focus');
      else params.set('focus', category);
      history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
      renderCatalog();
      return;
    }
    const saveButton = event.target.closest('[data-save-candidate]');
    if (saveButton) {
      const item = destination().items.find((candidate) => candidate.id === saveButton.dataset.saveCandidate);
      const saved = api.list('saved-items');
      if (!saved.some((candidate) => candidate.id === item.id)) api.upsert('saved-items', { id: item.id, memberId: 'LOCAL_GUEST', title: item.title, destination: destination().name, type: item.category, image: item.image });
      saveButton.textContent = '저장됨';
      saveButton.disabled = true;
    }
  });

  api.get('trip-planner-catalog.json').then((data) => {
    catalog = data;
    destinationId = destinationIdFrom(params.get('destination'));
    if (destinationId) renderCatalog();
    else renderDestinationGate();
  }).catch(() => {
    root.innerHTML = '<div class="empty-state"><strong>즐길거리 데이터를 불러오지 못했습니다.</strong><p>로컬 서버 또는 GitHub Pages에서 다시 열어 주세요.</p></div>';
  });
})();
