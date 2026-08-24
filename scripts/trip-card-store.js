(() => {
  if (window.HotelNGoTripCard) return;
  const DOMAIN = 'trip-card';
  const SESSION_KEY = 'hotelngo.mock.session.v1';
  const api = () => window.HotelNGoMockAPI;
  const categoryMap = { HOTEL: 'STAY', PLACE: 'LANDMARK', RESTAURANT: 'FOOD', VEHICLE: 'TRANSPORT' };
  const session = () => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  };
  const memberId = () => session()?.user?.id || '';
  const requireLogin = () => {
    const returnUrl = `${location.pathname.split('/').pop() || 'cart.html'}${location.search}${location.hash}`;
    location.href = `login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
    return false;
  };
  const normalize = (record = {}) => {
    const ownerId = record.ownerId || memberId();
    const sourceId = record.sourceId || record.itemId || record.placeId || record.id || `place_${Date.now()}`;
    const category = categoryMap[record.category || record.type] || record.category || record.type || 'LANDMARK';
    const destinationId = record.destinationId || String(record.destination || record.city || 'danang').toLowerCase().replaceAll(' ', '-');
    return {
      id: record.cardId || record.id || `${ownerId}_${destinationId}_${sourceId}`,
      ownerId,
      sourceId,
      sourceType: category,
      destinationId,
      destination: record.destination || record.city || destinationId,
      category,
      title: record.title || record.name || '여행 장소',
      area: record.area || record.location || '',
      image: record.image || 'assets/images/landmark-bali.jpg',
      description: record.description || record.introduction || '',
      duration: Number(record.duration || 60),
      recommendedTime: record.recommendedTime || '10:00',
      basePrice: Number(record.basePrice ?? record.price ?? 0),
      priceLabel: record.priceLabel || (Number(record.basePrice ?? record.price) ? `기본 ${Number(record.basePrice ?? record.price).toLocaleString('ko-KR')}원` : '무료·현장 확인'),
      bookingType: record.bookingType || 'INFORMATION_ONLY',
      status: record.status || 'SAVED',
      lat: Number(record.lat) || null,
      lng: Number(record.lng) || null,
      options: record.options || {},
      href: record.href || '',
      addedAt: record.addedAt || new Date().toISOString()
    };
  };
  const list = () => {
    const ownerId = memberId();
    if (!ownerId) return [];
    return (api()?.list(DOMAIN, []) || []).map(normalize).filter((item) => item.ownerId === ownerId);
  };
  const add = (record) => {
    const ownerId = memberId();
    if (!ownerId) return null;
    const normalized = normalize({ ...record, ownerId });
    api()?.upsert(DOMAIN, normalized);
    window.dispatchEvent(new CustomEvent('hotelngo:trip-card-change', { detail: { action: 'ADD', item: normalized } }));
    return normalized;
  };
  const remove = (id) => {
    if (!memberId() || !list().some((item) => item.id === id)) return;
    api()?.remove(DOMAIN, id);
    window.dispatchEvent(new CustomEvent('hotelngo:trip-card-change', { detail: { action: 'REMOVE', id } }));
  };
  const has = (sourceId, destinationId) => list().some((item) => item.sourceId === sourceId && (!destinationId || item.destinationId === destinationId));
  const fromDataset = (button) => {
    const scope = button.closest('[data-trip-card-item], [data-hotel-card], article') || button;
    const read = (key) => button.dataset[key] || scope.dataset[key] || '';
    return normalize({
      sourceId: read('tripCardId') || read('hotelId'),
      category: read('tripCardCategory') || (read('hotelId') ? 'STAY' : ''),
      destinationId: read('tripCardDestinationId'), destination: read('tripCardDestination'),
      title: read('tripCardTitle') || scope.querySelector('h2,h3,strong')?.textContent?.trim(),
      area: read('tripCardArea'), image: read('tripCardImage') || scope.querySelector('img')?.getAttribute('src'),
      description: read('tripCardDescription') || scope.querySelector('p')?.textContent?.trim(),
      price: read('tripCardPrice'), priceLabel: read('tripCardPriceLabel'), duration: read('tripCardDuration'),
      recommendedTime: read('tripCardTime'), bookingType: read('tripCardBookingType'),
      lat: read('tripCardLat'), lng: read('tripCardLng'), href: read('tripCardHref')
    });
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-trip-card-add]');
    if (!button) return;
    event.preventDefault();
    if (!memberId()) return requireLogin();
    const item = fromDataset(button);
    if (has(item.sourceId, item.destinationId)) {
      button.textContent = '이미 여행 카드에 있어요';
      return;
    }
    if (!add(item)) return;
    button.classList.add('is-saved');
    button.textContent = '여행 카드에 담았어요';
    document.querySelector('[data-toast]')?.replaceChildren(document.createTextNode(`${item.title}을(를) 여행 카드에 담았습니다.`));
  });
  window.HotelNGoTripCard = { domain: DOMAIN, normalize, list, add, remove, has, isAuthenticated: () => Boolean(memberId()), requireLogin };
})();
