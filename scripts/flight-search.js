(() => {
  const api = window.HotelNGoMockAPI;
  const form = document.querySelector('[data-flight-search]');
  const list = document.querySelector('[data-flight-list]');
  if (!api || !form || !list) return;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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

  const updateVisibleCount = () => {
    const directOnly = document.querySelector('[data-flight-direct]')?.checked;
    const max = Number(document.querySelector('[data-flight-max]')?.value || Infinity);
    let count = 0;
    list.querySelectorAll('[data-flight-card]').forEach((card) => {
      const visible = (!directOnly || card.dataset.direct === 'true') && Number(card.dataset.price) <= max;
      card.hidden = !visible;
      if (visible) count += 1;
    });
    const target = document.querySelector('[data-flight-count]');
    if (target) target.textContent = String(count);
  };

  const render = (catalog, requestedDestination, requestedDate) => {
    const destination = catalog.destinations[requestedDestination] || catalog.destinations['다낭'];
    const destinationName = catalog.destinations[requestedDestination] ? requestedDestination : '다낭';
    const origin = catalog.origin;
    form.elements.origin.value = `${origin.name} (${origin.code})`;
    form.elements.destination.value = `${destinationName} (${destination.code})`;
    form.elements.departDate.value = requestedDate;
    form.elements.returnDate.value = formatDate(addDays(new Date(`${requestedDate}T12:00:00`), 3));
    document.querySelectorAll('[data-flight-destination]').forEach((element) => { element.textContent = destinationName; });
    document.querySelectorAll('[data-flight-route]').forEach((element) => { element.textContent = `${origin.name} 출발 · ${destinationName} 왕복 · 이코노미`; });
    const hero = document.querySelector('[data-flight-hero]');
    if (hero) {
      hero.src = destination.hero;
      hero.alt = `${destinationName} 여행 풍경`;
    }
    list.innerHTML = destination.flights.map((flight) => `
      <article class="flight-card" data-flight-card data-direct="${flight.direct}" data-price="${flight.price}">
        <div class="flight-brand"><strong>${escapeHtml(flight.airline)}</strong><small>${escapeHtml(flight.flightNo)} · ${flight.direct ? '직항' : '경유'}</small></div>
        <div class="flight-times"><div><strong>${escapeHtml(flight.depart)}</strong><small>${escapeHtml(origin.code)} · ${escapeHtml(requestedDate.slice(5).replace('-', '.'))}</small></div><div class="flight-line"></div><div><strong>${escapeHtml(flight.arrive)}</strong><small>${escapeHtml(destination.code)} · ${escapeHtml(flight.duration)}</small></div></div>
        <div class="flight-price"><small>왕복 1인 Mock 예상</small><strong>${Number(flight.price).toLocaleString('ko-KR')}원~</strong><button class="ui-button" type="button" data-flight-toggle>운임 조건</button></div>
        <div class="flight-detail" hidden><span>${escapeHtml(flight.baggage)}</span><span>${escapeHtml(flight.changeFee)}</span><span>실시간 좌석·최종 운임은 공급자 연결 후 확인</span><button class="ui-button soft" type="button" data-add-trip data-trip-title="${escapeHtml(`${destinationName} ${flight.airline} 항공`)}" data-trip-type="FLIGHT" data-trip-id="${escapeHtml(flight.id)}">내 여행에 담기</button></div>
      </article>`).join('');
    document.title = `${destinationName} 항공편 비교 · HotelnGo`;
    updateVisibleCount();
  };

  const initialize = async () => {
    const catalog = await api.get('flights.json');
    const params = new URLSearchParams(location.search);
    const destination = params.get('destination') || '다낭';
    const today = new Date();
    const requestedDate = params.get('depart') === 'today'
      ? formatDate(today)
      : params.get('depart') || formatDate(addDays(today, 7));
    render(catalog, destination, requestedDate);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const typed = form.elements.destination.value.replace(/\s*\([^)]*\)\s*$/, '').trim();
      const nextDestination = catalog.destinations[typed] ? typed : destination;
      render(catalog, nextDestination, form.elements.departDate.value || requestedDate);
    });
    document.querySelector('[data-flight-direct]')?.addEventListener('change', updateVisibleCount);
    document.querySelector('[data-flight-max]')?.addEventListener('change', updateVisibleCount);
    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-flight-toggle]');
      if (!button) return;
      const detail = button.closest('[data-flight-card]')?.querySelector('.flight-detail');
      if (!detail) return;
      detail.hidden = !detail.hidden;
      button.textContent = detail.hidden ? '운임 조건' : '조건 닫기';
    });
  };

  initialize().catch(() => {
    list.innerHTML = '<div class="empty-state"><strong>항공편 Mock 데이터를 불러오지 못했습니다.</strong><p>잠시 후 다시 시도해 주세요.</p></div>';
  });
})();
