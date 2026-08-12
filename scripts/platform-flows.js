(() => {
  const api = window.HotelNGoMockAPI;
  if (!api?.list || !api?.upsert) return;

  const route = location.pathname.split('/').pop() || 'index.html';
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('hotelngo.mock.session.v1') || 'null'); } catch { return null; }
  })();
  const memberId = session?.user?.id || 'guest_local';
  const BOOKING_ACCESS_KEY = 'hotelngo.mock.booking-access.v1';
  let seeds = null;
  let toastTimer;
  let pendingCancellation = null;
  let landmarkAlternativesState = 'idle';
  let landmarkOptions = [];

  if (!document.querySelector('link[data-platform-flows]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'styles/platform-flows.css?v=4';
    style.dataset.platformFlows = '';
    document.head.append(style);
  }

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const bookingStatusLabel = (value) => ({
    CONFIRMED: '예약 확정',
    PENDING: '확인 중',
    PENDING_SUPPLIER: '업체 확인 중',
    UNAVAILABLE: '예약 불가',
    CANCEL_REQUESTED: '취소 요청',
    CANCELLED: '취소 완료',
    CHANGE_REQUESTED: '변경 요청'
  }[value] || '상태 확인');
  const bookingStatusHelp = (value) => ({
    CONFIRMED: '예약이 확정되었습니다. 이용 전 확인서와 바우처를 확인해주세요.',
    PENDING: '예약 요청을 확인하고 있습니다. 처리 결과를 알림으로 안내합니다.',
    PENDING_SUPPLIER: '예약 요청을 접수했습니다. 업체 확인이 끝나면 알림으로 안내합니다.',
    UNAVAILABLE: '선택한 상품을 확정할 수 없습니다. 결제 취소 또는 대체 상품을 안내합니다.',
    CANCEL_REQUESTED: '취소 요청을 접수했습니다. 환불 금액과 완료 시점을 확인하고 있습니다.',
    CANCELLED: '예약 취소와 환불 처리가 완료되었습니다.',
    CHANGE_REQUESTED: '변경 요청을 접수했습니다. 가능 여부와 차액을 확인하고 있습니다.'
  }[value] || '현재 처리 상태를 확인하고 있습니다.');
  const paymentStatusLabel = (value) => ({
    DEMO_AUTHORIZED: '결제 확인 완료(데모)',
    AUTHORIZED: '결제 승인 완료',
    PAID: '결제 완료',
    REFUND_PENDING: '환불 처리 중',
    REFUNDED: '환불 완료'
  }[value] || '결제 상태 확인 중');
  const providerLabel = (value) => ({ HOTEL: '호텔', MULTI_SUPPLIER: '여행 상품', ACTIVITY: '즐길거리' }[value] || '예약 상품');
  const readBookingAccess = () => {
    try { return JSON.parse(sessionStorage.getItem(BOOKING_ACCESS_KEY) || 'null'); } catch { return null; }
  };
  const grantBookingAccess = (booking) => {
    sessionStorage.setItem(BOOKING_ACCESS_KEY, JSON.stringify({
      bookingId: booking.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }));
  };
  const canAccessBooking = (booking) => {
    if (session && booking.memberId === memberId) return true;
    const access = readBookingAccess();
    return access?.bookingId === booking.id && Date.parse(access.expiresAt || '') > Date.now();
  };
  const formatDateTime = (value) => value
    ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '-';

  const showToast = (message) => {
    let toast = document.querySelector('[data-toast], [data-bo-toast], [data-workflow-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = document.body.dataset.app ? 'bo-toast' : 'toast';
      toast.dataset.toast = '';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };
  const openTripContextDialog = ({ title, message, confirmLabel, onConfirm }) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'page-confirm-dialog';
    dialog.innerHTML = `<header><div><small>ADD TO TRIP</small><strong>${escapeHtml(title)}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="page-confirm-body">${message}</div><footer><button class="ui-button" type="button" data-trip-dialog-cancel>취소</button><button class="ui-button primary" type="button" data-trip-dialog-confirm>${escapeHtml(confirmLabel)}</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-trip-dialog-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-trip-dialog-confirm]').addEventListener('click', () => { onConfirm(); close(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };

  const seedDomains = async () => {
    if (seeds) return seeds;
    try {
      seeds = await api.get('platform-state.json');
    } catch {
      seeds = { bookings: [], settlements: [], inquiries: [], stories: [], trips: [] };
    }
    ['bookings', 'settlements', 'inquiries', 'stories', 'trips'].forEach((domain) => {
      api.list(domain, seeds[domain] || []);
    });
    return seeds;
  };

  const currentBookingId = () => new URLSearchParams(location.search).get('id')
    || document.querySelector('[data-booking-id]')?.dataset.bookingId
    || (route.includes('booking') ? 'HNG-2026-000001' : null);

  const updateBooking = async (id, patch, action) => {
    await seedDomains();
    const current = api.list('bookings').find((item) => item.id === id) || { id, memberId };
    const timeline = [...(current.timeline || []), {
      at: new Date().toISOString(),
      status: patch.status || current.status || 'UPDATED',
      label: action
    }];
    const next = api.upsert('bookings', { ...current, ...patch, timeline });
    api.appendAudit({ actor: memberId, action, entityType: 'BOOKING', entityId: id, payload: patch });
    return next;
  };

  const serializeForm = (form) => {
    const values = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="file"]').forEach((input) => {
      if (input.files?.[0]) values[input.name] = input.files[0].name;
    });
    return values;
  };

  const getMainShell = () => document.querySelector('main > .shell')
    || [...document.querySelectorAll('main .shell')].at(-1)
    || document.querySelector('main');

  const selectedCartItems = () => [...document.querySelectorAll('[data-cart-select]:checked')].map((input, index) => {
    const card = input.closest('.cart-item');
    return {
      id: card?.dataset.marketplaceCartIndex != null ? `marketplace_${card.dataset.marketplaceCartIndex}` : `cart_${index + 1}`,
      title: card?.querySelector('.cart-copy strong')?.textContent.trim() || input.getAttribute('aria-label') || '선택 상품',
      description: card?.querySelector('.cart-copy small')?.textContent.trim() || '',
      supplier: card?.querySelector('.cart-copy span')?.textContent.trim() || '',
      image: card?.querySelector('img')?.getAttribute('src') || '',
      amount: Number(input.dataset.price || 0),
      selected: true
    };
  });

  const saveCheckout = (patch) => {
    const current = api.list('checkout', [{ id: 'active', memberId, items: [], guest: {}, payment: {} }])
      .find((item) => item.id === 'active') || { id: 'active', memberId, items: [], guest: {}, payment: {} };
    return api.upsert('checkout', { ...current, ...patch, id: 'active', memberId });
  };

  const addToTrip = async ({ title, type = 'PLACE', sourceId = null, sourceType = 'PAGE' }) => {
    await seedDomains();
    const trips = api.list('trips');
    let trip = trips.find((item) => item.ownerId === memberId && item.status === 'DRAFT');
    if (!trip) {
      trip = {
        id: `trip_${Date.now()}`,
        ownerId: memberId,
        title: '나만의 여행',
        destination: title,
        status: 'DRAFT',
        sourceType: 'USER_CREATED',
        items: []
      };
    }
    const exists = (trip.items || []).some((item) => item.sourceId === sourceId && sourceId);
    if (!exists) {
      trip.items = [...(trip.items || []), {
        id: `trip_item_${Date.now()}`,
        day: 1,
        time: '미정',
        type,
        title,
        sourceId,
        sourceType,
        bookingStatus: 'NOT_BOOKED'
      }];
    }
    api.upsert('trips', trip);
    api.appendAudit({ actor: memberId, action: 'ADD_TO_TRIP', entityType: 'TRIP', entityId: trip.id, payload: { sourceId, title } });
    return trip;
  };

  document.addEventListener('click', async (event) => {
    const confirmCancellation = event.target.closest('[data-dialog-confirm]');
    if (confirmCancellation && route === 'booking-cancel.html' && pendingCancellation) {
      await updateBooking(pendingCancellation.id, {
        status: 'CANCEL_REQUESTED',
        cancellationRequest: {
          reason: pendingCancellation.reason,
          requestedAt: new Date().toISOString()
        }
      }, 'CUSTOMER_CANCEL_REQUESTED');
      pendingCancellation = null;
      return;
    }

    const saveButton = event.target.closest('[data-save-item]');
    if (saveButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!session) {
        location.href = `login.html?returnUrl=${encodeURIComponent(`${route}${location.search}`)}`;
        return;
      }
      const sourceId = saveButton.dataset.saveItem || `${route}:${new URLSearchParams(location.search).get('id') || 'page'}`;
      const savedItems = api.list('saved-items');
      const existing = savedItems.find((item) => item.id === sourceId && item.memberId === memberId);
      if (existing) {
        api.remove('saved-items', sourceId);
        saveButton.classList.remove('is-saved');
        saveButton.setAttribute('aria-pressed', 'false');
        saveButton.textContent = saveButton.hasAttribute('data-text-save') ? '저장' : '♡';
        showToast('저장 목록에서 제외했습니다.');
      } else {
        const title = document.querySelector('h1')?.textContent.trim()
          || saveButton.closest('article')?.querySelector('h2, h3, strong')?.textContent.trim()
          || document.title;
        api.upsert('saved-items', {
          id: sourceId,
          memberId,
          sourceType: route.includes('story') || route.includes('trip-guide') ? 'STORY_OR_GUIDE' : 'PLACE_OR_PRODUCT',
          title,
          href: `${route}${location.search}`,
          savedAt: new Date().toISOString()
        });
        saveButton.classList.add('is-saved');
        saveButton.setAttribute('aria-pressed', 'true');
        saveButton.textContent = saveButton.hasAttribute('data-text-save') ? '저장됨' : '♥';
        showToast('내 저장 목록에 보관했습니다.');
      }
      return;
    }

    const tripButton = event.target.closest('[data-add-trip]');
    if (tripButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const scope = tripButton.closest('article, section, .detail-panel, .story-route-card') || document;
      const title = tripButton.dataset.tripTitle
        || scope.querySelector('h3, h2, h1, strong')?.textContent.trim()
        || document.querySelector('h1')?.textContent.trim()
        || document.title;
      const sourceId = tripButton.dataset.tripId || `${route}:${new URLSearchParams(location.search).get('id') || 'page'}`;
      let context = {};
      try { context = JSON.parse(localStorage.getItem('hotelngo.trip.context.v1') || '{}'); } catch {}
      const queryDestination = new URLSearchParams(location.search).get('destination');
      const knownCities = ['다낭', '방콕', '발리', '교토', '오사카', '도쿄', '파리'];
      const pageDestination = queryDestination || knownCities.find((city) => scope.textContent.includes(city) || document.title.includes(city));
      const destination = context.destination || pageDestination;
      if (!destination) {
        openTripContextDialog({
          title: '먼저 여행의 도시와 날짜를 정해주세요',
          message: `<p><strong>${escapeHtml(title)}</strong>을(를) 담으려면 어느 여행의 몇 번째 날인지 먼저 정해야 합니다.</p><p>목적지와 기간을 정한 뒤 이 장소를 날짜·시간과 함께 추가할 수 있습니다.</p>`,
          confirmLabel: '새 여행 만들기',
          onConfirm: () => { location.href = 'trip-create.html'; }
        });
        return;
      }
      if (pageDestination && context.destination && pageDestination !== context.destination) {
        openTripContextDialog({
          title: '편집 중인 여행과 도시가 달라요',
          message: `<p><strong>${escapeHtml(title)}</strong>은(는) ${escapeHtml(pageDestination)}의 장소지만, 현재 편집 중인 일정은 ${escapeHtml(context.destination)}입니다.</p><p>잘못된 동선을 만들지 않도록 기존 일정에는 바로 담지 않습니다. ${escapeHtml(pageDestination)} 여행을 새로 만든 뒤 날짜와 시간을 정해주세요.</p>`,
          confirmLabel: `${pageDestination} 여행 새로 만들기`,
          onConfirm: () => { location.href = `trip-create.html?destination=${encodeURIComponent(pageDestination)}`; }
        });
        return;
      }
      const image = scope.querySelector('img')?.getAttribute('src') || document.querySelector('main img')?.getAttribute('src') || '';
      const path = location.pathname.toLowerCase();
      const scopeText = scope.textContent;
      const candidateType = tripButton.dataset.tripType
        || (path.includes('hotel') || /호텔|리조트/.test(scopeText) ? 'HOTEL'
          : path.includes('restaurant') || path.includes('food') || /음식점|맛집|카페|다이닝/.test(scopeText) ? 'RESTAURANT'
            : /골프/.test(scopeText) ? 'GOLF'
              : /마사지|스파/.test(scopeText) ? 'SPA'
                : /차량|픽업|트랜스퍼/.test(scopeText) ? 'VEHICLE'
                  : /투어|체험|크루즈/.test(scopeText) ? 'TOUR'
                    : 'PLACE');
      const next = new URLSearchParams({
        destination,
        focus: sourceId,
        candidateTitle: title,
        candidateType
      });
      if (context.startDate) next.set('startDate', context.startDate);
      if (context.endDate) next.set('endDate', context.endDate);
      if (context.travelers) next.set('travelers', context.travelers);
      if (context.tripId) next.set('tripId', context.tripId);
      if (image) next.set('candidateImage', image);
      openTripContextDialog({
        title: `${destination} 일정에 담을까요?`,
        message: `<p><strong>${escapeHtml(title)}</strong>을(를) 최근 편집 중인 ${escapeHtml(destination)} 여행에 연결합니다.</p><p>다음 화면에서 장소 소개를 확인하고 <strong>DAY와 시작 시간</strong>을 정해야 지도 동선에 반영됩니다. 여행지가 다르면 취소하고 새 여행을 만들어주세요.</p>`,
        confirmLabel: '날짜·시간 정하러 가기',
        onConfirm: () => { location.href = `trip-planner.html?${next.toString()}`; }
      });
      return;
    }

    const checkoutButton = event.target.closest('[data-cart-checkout]');
    if (checkoutButton && checkoutButton.getAttribute('aria-disabled') !== 'true') {
      saveCheckout({ items: selectedCartItems(), step: 'GUEST_DETAILS' });
      api.appendAudit({ actor: memberId, action: 'CHECKOUT_STARTED', entityType: 'CHECKOUT', entityId: 'active' });
    }

    if (route === 'partner-booking-detail.html') {
      const actionButton = event.target.closest('button.bo-button');
      if (actionButton) {
        const label = actionButton.textContent.trim();
        const id = new URLSearchParams(location.search).get('id') || 'HNG-G-10482';
        if (label.includes('예약 확인')) {
          event.stopImmediatePropagation();
          await seedDomains();
          const current = api.list('bookings').find((item) => item.id === id);
          if (current?.status === 'UNAVAILABLE') {
            showToast('예약 불가 상태는 확정할 수 없습니다. 대안 슬롯을 먼저 제시해 주세요.');
            return;
          }
          await updateBooking(id, { status: 'CONFIRMED', supplierBookingId: `SUP-${Date.now()}`, settlementStatus: 'SCHEDULED' }, 'PARTNER_CONFIRMED');
          actionButton.textContent = '확정 완료';
          showToast('예약을 확정하고 고객 상태·정산 예정에 반영했습니다.');
        } else if (label.includes('변경 접수')) {
          event.stopImmediatePropagation();
          await updateBooking(id, { status: 'CHANGE_REVIEW' }, 'PARTNER_CHANGE_RECEIVED');
          showToast('변경 요청을 접수해 처리 이력에 기록했습니다.');
        }
      }
    }
  }, true);

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (route === 'bookings.html' && form.matches('[data-booking-lookup]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!form.reportValidity()) return;
      await seedDomains();
      const values = serializeForm(form);
      const bookingId = String(values.bookingId || '').trim().toUpperCase();
      const email = String(values.email || '').trim().toLowerCase();
      const booking = api.list('bookings').find((item) => item.id.toUpperCase() === bookingId && String(item.guest?.email || '').toLowerCase() === email);
      const feedback = form.querySelector('[data-booking-lookup-feedback]');
      if (!booking) {
        if (feedback) feedback.textContent = '예약번호와 예약자 이메일이 일치하지 않습니다.';
        showToast('예약 정보를 다시 확인해주세요.');
        return;
      }
      if (feedback) feedback.textContent = '';
      grantBookingAccess(booking);
      showToast('예약 정보를 확인했습니다.');
      setTimeout(() => { location.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}`; }, 220);
      return;
    }

    if (form.matches('[data-flow-form]')) {
      const values = serializeForm(form);
      if (route === 'booking-guests.html') {
        const textInputs = [...form.querySelectorAll('input:not([type]), input[type="text"]')];
        saveCheckout({
          guest: {
            familyName: values.familyName || values.lastName || textInputs[0]?.value || '',
            givenName: values.givenName || values.firstName || textInputs[1]?.value || '',
            email: values.email || form.querySelector('input[type="email"]')?.value || '',
            phone: values.phone || values.tel || form.querySelector('input[type="tel"]')?.value || '',
            nationality: values.nationality || form.querySelector('select')?.value || 'KR',
            specialRequest: values.specialRequest || form.querySelector('textarea')?.value || ''
          },
          rawGuestForm: values,
          step: 'REVALIDATION'
        });
      }
      if (route === 'checkout.html') {
        const checkout = saveCheckout({ payment: values, step: 'COMPLETE' });
        const id = `HNG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const first = checkout.items?.[0];
        const createdBooking = api.upsert('bookings', {
          id,
          memberId,
          providerId: 'pending_provider',
          providerType: first?.supplier?.includes('PMS') ? 'HOTEL' : 'MULTI_SUPPLIER',
          supplierBookingId: null,
          status: 'PENDING_SUPPLIER',
          paymentStatus: 'DEMO_AUTHORIZED',
          settlementStatus: 'NOT_READY',
          title: first?.title || '여행 예약',
          product: first?.description || '',
          amount: (checkout.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0),
          currency: 'KRW',
          guest: checkout.guest,
          items: checkout.items,
          timeline: [
            { at: new Date().toISOString(), status: 'RECEIVED', label: 'HotelNGo 예약 접수' },
            { at: new Date().toISOString(), status: 'PENDING_SUPPLIER', label: '공급자 예약 API 확인 대기' }
          ]
        });
        grantBookingAccess(createdBooking);
        saveCheckout({ bookingId: id });
        api.appendAudit({ actor: memberId, action: 'BOOKING_CREATED', entityType: 'BOOKING', entityId: id });
      }
    }

    if (form.matches('[data-persist-form]')) {
      const values = serializeForm(form);
      const id = currentBookingId();
      if (route === 'booking-cancel.html' && id) {
        pendingCancellation = { id, reason: values.reason };
      }
      if (route === 'booking-change.html' && id) {
        await updateBooking(id, {
          status: 'CHANGE_REQUESTED',
          changeRequest: { ...values, requestedAt: new Date().toISOString() }
        }, 'CUSTOMER_CHANGE_REQUESTED');
      }
    }

    if (form.matches('[data-workflow-form]')) {
      const values = serializeForm(form);
      if (route === 'inquiry-create.html') {
        const id = `INQ-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        api.upsert('inquiries', {
          id,
          memberId,
          bookingId: values.orderId || null,
          category: values.type || '기타',
          subject: values.subject,
          message: values.message,
          attachment: values.attachment || null,
          status: 'OPEN',
          priority: values.orderId ? 'HIGH' : 'NORMAL',
          createdAt: new Date().toISOString(),
          slaDueAt: new Date(Date.now() + (values.orderId ? 4 : 24) * 60 * 60 * 1000).toISOString(),
          reply: null
        });
        api.appendAudit({ actor: memberId, action: 'INQUIRY_CREATED', entityType: 'INQUIRY', entityId: id, payload: { bookingId: values.orderId || null } });
      }
      if (route === 'story-create.html' || route === 'story-edit.html') {
        const id = new URLSearchParams(location.search).get('id') || `story_${Date.now()}`;
        api.upsert('stories', {
          id,
          authorId: memberId,
          authorName: session?.user?.displayName || '회원',
          authorType: 'MEMBER',
          title: values.title,
          destination: values.place || '',
          summary: values.scene || '',
          cover: values.cover || 'assets/images/landmark-kyoto.jpg',
          tags: String(values.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
          status: 'DRAFT',
          visibility: 'PRIVATE',
          saves: 0,
          copies: 0
        });
        sessionStorage.setItem('hotelngo.last-story-id', id);
        api.appendAudit({ actor: memberId, action: 'STORY_SAVED', entityType: 'STORY', entityId: id });
      }
      if (route === 'trip-editor.html') {
        const id = new URLSearchParams(location.search).get('tripId') || `trip_${Date.now()}`;
        const current = api.list('trips').find((item) => item.id === id) || {
          id,
          ownerId: memberId,
          title: document.querySelector('h1')?.textContent.trim() || '나만의 여행',
          status: 'DRAFT',
          sourceType: 'USER_CREATED'
        };
        const items = Object.entries(values)
          .filter(([key]) => key.startsWith('day'))
          .flatMap(([key, value]) => String(value).split('\n').filter(Boolean).map((line, index) => {
            const match = line.trim().match(/^(\d{1,2}:\d{2})\s+(.+)$/);
            return {
              id: `${id}_${key}_${index}`,
              day: Number(key.replace(/\D/g, '')) || 1,
              time: match?.[1] || '미정',
              title: match?.[2] || line.trim(),
              type: 'PLACE',
              bookingStatus: 'NOT_BOOKED'
            };
          }));
        api.upsert('trips', { ...current, items, updatedAt: new Date().toISOString() });
        api.appendAudit({ actor: memberId, action: 'TRIP_EDITED', entityType: 'TRIP', entityId: id, payload: { itemCount: items.length } });
      }
    }

    if (form.matches('[data-partner-product-edit-form]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!form.reportValidity()) return;
      const values = serializeForm(form);
      const id = new URLSearchParams(location.search).get('id') || 'product_golf_ocean_18';
      api.upsert('partner-products', {
        id,
        providerId: 'prv_golf_011',
        businessType: 'GOLF',
        name: values.name,
        course: values.course,
        difficulty: values.difficulty,
        description: values.description,
        cover: values.cover,
        price: Number(values.price || 0),
        priceType: values.priceType,
        policy: values.policy,
        resourceId: values.resourceId,
        bookingMode: values.bookingMode,
        includes: String(values.includes || '').split('\n').filter(Boolean),
        options: String(values.options || '').split('\n').filter(Boolean),
        bundle: values.bundle,
        settlement: values.settlement,
        status: 'ACTIVE'
      });
      api.appendAudit({ actor: 'PARTNER_OWNER', action: 'PARTNER_PRODUCT_UPDATED', entityType: 'PRODUCT', entityId: id });
      showToast('상품·예약 자원·정산 기준을 JSON Mock에 저장했습니다.');
    }
  }, true);

  const renderDomainPanel = async () => {
    await seedDomains();
    const root = document.querySelector('[data-workflow-root]');
    if (!root) return;

    if (route === 'inquiry-create.html') {
      const bookingId = new URLSearchParams(location.search).get('bookingId');
      const orderInput = root.querySelector('[name="orderId"]');
      if (bookingId && orderInput && !orderInput.dataset.queryHydrated) {
        orderInput.value = bookingId;
        orderInput.dataset.queryHydrated = 'true';
      }
      return;
    }

    if (root.querySelector('[data-platform-domain-panel]')) return;

    const params = new URLSearchParams(location.search);
    let records = [];
    let title = '';
    let columns = [];
    let row = () => '';

    if (route === 'inquiries.html' || route === 'admin-support.html') {
      records = api.list('inquiries').filter((item) => route === 'admin-support.html' || item.memberId === memberId);
      title = route === 'admin-support.html' ? '실제 Mock 문의·SLA 작업함' : '내 문의 처리 현황';
      columns = ['문의', '예약', '상태·SLA', '보기'];
      row = (item) => `<tr><td><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.id)} · ${escapeHtml(item.category)}</small></td><td>${escapeHtml(item.bookingId || '일반 문의')}</td><td><span class="workflow-badge ${item.status === 'ANSWERED' ? 'success' : 'warn'}">${escapeHtml(item.status)}</span><small>${escapeHtml(item.slaDueAt ? new Date(item.slaDueAt).toLocaleString('ko-KR') : '')}</small></td><td><a class="workflow-button" href="${route === 'admin-support.html' ? 'admin-inquiry-detail.html' : 'inquiry-detail.html'}?id=${encodeURIComponent(item.id)}">상세</a></td></tr>`;
    } else if (route === 'my-stories.html') {
      records = api.list('stories').filter((item) => item.authorId === memberId);
      title = '내가 만든 스토리 JSON 작업함';
      columns = ['스토리', '여행지', '공개 상태', '편집'];
      row = (item) => `<tr><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.destination || '-')}</td><td><span class="workflow-badge">${escapeHtml(item.status)}</span></td><td><a class="workflow-button" href="story-edit.html?id=${encodeURIComponent(item.id)}">편집</a></td></tr>`;
    } else if (route === 'admin-settlements.html') {
      records = api.list('settlements');
      title = '예약 원장과 연결된 정산 Mock';
      columns = ['정산', '업체·기간', '총매출·환불', '순지급·상태'];
      row = (item) => `<tr><td><strong>${escapeHtml(item.id)}</strong><small>${escapeHtml(item.providerType)}</small></td><td>${escapeHtml(item.providerId)}<small>${escapeHtml(item.period)}</small></td><td>${Number(item.gross).toLocaleString('ko-KR')}원<small>환불 ${Number(item.refunds).toLocaleString('ko-KR')}원</small></td><td><strong>${Number(item.net).toLocaleString('ko-KR')}원</strong><small>${escapeHtml(item.status)}</small></td></tr>`;
    } else if (route === 'inquiry-detail.html') {
      const item = api.list('inquiries').find((record) => record.id === params.get('id')) || api.list('inquiries')[0];
      if (!item) return;
      root.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-domain-panel><header><div><small>${escapeHtml(item.id)}</small><h2>${escapeHtml(item.subject)}</h2></div><span class="workflow-badge ${item.status === 'ANSWERED' ? 'success' : 'warn'}">${escapeHtml(item.status)}</span></header><dl><div><dt>연결 예약</dt><dd>${escapeHtml(item.bookingId || '없음')}</dd></div><div><dt>문의 내용</dt><dd>${escapeHtml(item.message)}</dd></div><div><dt>고객센터 답변</dt><dd>${escapeHtml(item.reply || '답변을 준비하고 있습니다.')}</dd></div><div><dt>SLA</dt><dd>${escapeHtml(item.slaDueAt ? new Date(item.slaDueAt).toLocaleString('ko-KR') : '-')}</dd></div></dl></section>`);
      return;
    } else if (route === 'story-preview.html') {
      const id = new URLSearchParams(location.search).get('id') || sessionStorage.getItem('hotelngo.last-story-id');
      const item = api.list('stories').find((record) => record.id === id) || api.list('stories').find((record) => record.authorId === memberId);
      if (!item) return;
      root.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-domain-panel><header><div><small>${escapeHtml(item.id)} · ${escapeHtml(item.status)}</small><h2>${escapeHtml(item.title)}</h2></div><a class="workflow-button" href="story-edit.html?id=${encodeURIComponent(item.id)}">다시 편집</a></header><dl><div><dt>여행지</dt><dd>${escapeHtml(item.destination || '-')}</dd></div><div><dt>첫 장면</dt><dd>${escapeHtml(item.summary || '-')}</dd></div><div><dt>태그</dt><dd>${escapeHtml((item.tags || []).join(' · '))}</dd></div><div><dt>공개 범위</dt><dd>${escapeHtml(item.visibility)} · 공개 전 운영 검수가 필요합니다.</dd></div></dl><div class="form-actions"><a class="workflow-button primary" href="trip-publish.html?storyId=${encodeURIComponent(item.id)}">공개·공유 설정</a><a class="workflow-button" href="my-stories.html">내 스토리 목록</a></div></section>`);
      return;
    } else {
      return;
    }

    root.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-domain-panel><header><div><small>JSON LOCAL API MOCK</small><h2>${escapeHtml(title)}</h2></div><span>${records.length}건</span></header><div class="platform-table-wrap"><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${records.map(row).join('')}</tbody></table></div></section>`);
  };

  const renderTrips = async () => {
    if (route !== 'trips.html') return;
    await seedDomains();
    const main = getMainShell();
    if (!main || main.querySelector('[data-platform-trip-list]')) return;
    const trips = api.list('trips').filter((item) => item.ownerId === memberId);
    const head = main.querySelector('.page-head, .content-section-head');
    const sourceLabels = { USER_CREATED: '직접 만든 일정', AI_DRAFT: 'AI 추천 초안', COMMUNITY_COPY: '공유 가이드에서 복사' };
    const statusLabels = { DRAFT: '작성 중', PUBLISHED: '공개됨', LINK_SHARED: '링크 공유' };
    const html = `<section class="platform-trip-list" data-platform-trip-list><div class="content-section-head"><div><span class="page-eyebrow">MY TRIPS</span><h2>저장된 나의 여행</h2><p>직접 만든 일정, 공개 가이드에서 복사한 일정, AI가 만든 초안을 같은 구조로 편집합니다.</p></div></div>${trips.map((trip) => `<article><div><strong>${escapeHtml(trip.title)}</strong><small>${escapeHtml(sourceLabels[trip.sourceType] || '내 여행')} · ${trip.duration || ''} · ${trip.items?.length || 0}개 장소 · ${escapeHtml(statusLabels[trip.status] || '작성 중')}</small></div><div><a class="ui-button" href="trip-booking-plan.html?tripId=${encodeURIComponent(trip.id)}">예약 준비도</a><a class="ui-button" href="trip-publish.html?tripId=${encodeURIComponent(trip.id)}">공유</a><a class="ui-button primary" href="trip-planner.html?tripId=${encodeURIComponent(trip.id)}">일정 편집</a></div></article>`).join('') || '<div class="empty-state"><strong>아직 저장된 여행이 없습니다.</strong><p>AI 여행 또는 공개 여행에서 초안을 만들어 보세요.</p></div>'}</section>`;
    if (head) head.insertAdjacentHTML('afterend', html);
    else main.insertAdjacentHTML('afterbegin', html);
  };

  const renderBookingState = async () => {
    if (!['booking-detail.html', 'booking-complete.html', 'booking-change.html', 'booking-cancel.html'].includes(route)) return;
    await seedDomains();
    const checkout = api.list('checkout', []).find((item) => item.id === 'active');
    const bookingParams = new URLSearchParams(location.search);
    const id = bookingParams.get('id') || bookingParams.get('bookingId') || (route === 'booking-complete.html' ? checkout?.bookingId : null);
    const booking = api.list('bookings').find((item) => item.id === id);
    const main = getMainShell();
    const protectedMain = document.querySelector('main[data-booking-protected]');
    const accessSurface = protectedMain || document.querySelector('main');
    if (!main || main.querySelector('[data-live-booking-state]')) return;
    if (!booking) {
      if (accessSurface) {
        accessSurface.innerHTML = '<div class="shell"><section class="access-required"><span class="page-eyebrow">BOOKING LOOKUP</span><h1>예약 정보를 찾을 수 없습니다</h1><p>예약번호를 다시 확인하거나 예약 조회 화면에서 본인 확인을 진행해주세요.</p><a class="ui-button primary" href="bookings.html">예약 조회로 이동</a></section></div>';
        accessSurface.hidden = false;
      }
      return;
    }
    if (!canAccessBooking(booking)) {
      if (accessSurface) {
        accessSurface.innerHTML = '<div class="shell"><section class="access-required"><span class="page-eyebrow">PRIVATE BOOKING</span><h1>예약 확인이 필요합니다</h1><p>예약자 정보 보호를 위해 예약번호와 이메일 확인 후 상세 내용을 볼 수 있습니다.</p><a class="ui-button primary" href="bookings.html">예약 확인하기</a><a class="ui-button" href="login.html?returnUrl=orders.html">회원 로그인</a></section></div>';
        accessSurface.hidden = false;
      }
      return;
    }
    if (protectedMain) protectedMain.hidden = false;
    if (route === 'booking-complete.html') {
      const number = main.querySelector('.success-number strong');
      const copy = main.querySelector('[data-copy-booking]');
      const detailLink = [...main.querySelectorAll('a')].find((link) => link.getAttribute('href')?.startsWith('booking-detail.html'));
      if (number) number.textContent = booking.id;
      if (copy) copy.dataset.copyBooking = booking.id;
      if (detailLink) detailLink.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}`;
    }
    if (route === 'booking-detail.html') {
      const title = main.querySelector('.page-title');
      const lead = main.querySelector('.page-lead');
      const breadcrumbParts = [...main.querySelectorAll('.page-breadcrumb > span')];
      if (title) title.textContent = booking.title;
      if (lead) lead.textContent = [booking.product, booking.startAt ? new Date(booking.startAt).toLocaleString('ko-KR') : ''].filter(Boolean).join(' · ');
      if (breadcrumbParts.length) breadcrumbParts[breadcrumbParts.length - 1].textContent = booking.id;
      const detailMain = main.querySelector('.checkout-main');
      if (detailMain) {
        detailMain.innerHTML = `
          <div class="state-banner"><div><strong>${escapeHtml(bookingStatusLabel(booking.status))}</strong><p>${escapeHtml(bookingStatusHelp(booking.status))}</p></div><span class="status-chip ${booking.status === 'CONFIRMED' ? 'success' : booking.status === 'UNAVAILABLE' ? 'danger' : 'warning'}">${escapeHtml(bookingStatusLabel(booking.status))}</span></div>
          <section class="checkout-card"><div class="checkout-card-head"><div><h2>예약 정보</h2><p>예약번호 ${escapeHtml(booking.id)}</p></div></div><div class="info-list">
            <div class="info-row"><strong>고객 선택</strong><div>${escapeHtml(booking.title)}<br>${escapeHtml(booking.product || '')}</div></div>
            <div class="info-row"><strong>이용 일정</strong><div>${escapeHtml(booking.startAt ? formatDateTime(booking.startAt) : '일정 미정')}${booking.endAt ? ` – ${escapeHtml(formatDateTime(booking.endAt))}` : ''}</div></div>
            <div class="info-row"><strong>예약자</strong><div>${escapeHtml(`${booking.guest?.familyName || ''} ${booking.guest?.givenName || ''}`.trim() || '회원 프로필')} · ${escapeHtml(booking.guest?.email || '-')}</div></div>
            <div class="info-row"><strong>취소·환불</strong><div>${booking.cancellation ? `무료 취소 ${escapeHtml(formatDateTime(booking.cancellation.freeUntil))}까지 · 예상 환불 ${Number(booking.cancellation.estimatedRefund || 0).toLocaleString('ko-KR')}원` : '공급자 정책 확인 필요'}</div></div>
            <div class="info-row"><strong>결제 상태</strong><div>${escapeHtml(paymentStatusLabel(booking.paymentStatus))} · ${Number(booking.amount || 0).toLocaleString('ko-KR')}원</div></div>
          </div></section>
          ${(booking.items || []).length ? `<section class="checkout-card"><div class="checkout-card-head"><div><h2>복수 공급자 선택 항목</h2><p>각 항목은 공급자별로 별도 확정·취소·정산합니다.</p></div></div><div class="info-list">${booking.items.map((item) => `<div class="info-row"><strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(item.description || '')}<br>${Number(item.amount || 0).toLocaleString('ko-KR')}원</div></div>`).join('')}</div></section>` : ''}
          <section class="checkout-card"><div class="checkout-card-head"><div><h2>처리 이력</h2><p>고객 상태와 공급자 상태를 함께 기록합니다.</p></div></div><ol class="order-timeline">${(booking.timeline || []).map((item) => `<li><time>${escapeHtml(new Date(item.at).toLocaleString('ko-KR'))}</time><strong>${escapeHtml(item.label || item.status)}</strong></li>`).join('')}</ol></section>`;
      }
      const side = main.querySelector('.checkout-side');
      if (side) {
        const sideTitle = side.querySelector('.checkout-product strong');
        const sideCopy = side.querySelector('.checkout-product small');
        const sideImage = side.querySelector('.checkout-product img');
        const price = side.querySelector('.price-lines strong');
        const firstItem = booking.items?.[0] || {};
        const categoryHint = `${booking.title} ${booking.product || ''} ${firstItem.supplier || ''}`.toLowerCase();
        const fallbackImage = categoryHint.includes('vehicle') || categoryHint.includes('세단') || categoryHint.includes('차량')
          ? 'assets/images/marketplace/vehicle-sedan.jpg'
          : categoryHint.includes('golf') || categoryHint.includes('골프')
            ? 'assets/images/marketplace/golf-course.jpg'
            : categoryHint.includes('spa') || categoryHint.includes('마사지')
              ? 'assets/images/marketplace/spa-treatment.jpg'
              : categoryHint.includes('restaurant') || categoryHint.includes('키친') || categoryHint.includes('식당')
                ? 'assets/images/marketplace/restaurant-dining.jpg'
                : 'assets/images/hero-hotel.jpg';
        if (sideTitle) sideTitle.textContent = booking.title;
        if (sideCopy) sideCopy.innerHTML = `${escapeHtml(providerLabel(booking.providerType))}<br>${escapeHtml(booking.startAt ? formatDateTime(booking.startAt) : '일정 미정')}`;
        if (sideImage) {
          sideImage.src = firstItem.image || fallbackImage;
          sideImage.alt = booking.title;
        }
        if (price) price.textContent = `${Number(booking.amount || 0).toLocaleString('ko-KR')}원`;
      }
      main.querySelectorAll('a[href="booking-change.html"]').forEach((link) => { link.href = `booking-change.html?id=${encodeURIComponent(booking.id)}`; });
      main.querySelectorAll('a[href="booking-cancel.html"]').forEach((link) => { link.href = `booking-cancel.html?id=${encodeURIComponent(booking.id)}`; });
    }
    if (route === 'booking-change.html') {
      const title = main.querySelector('.page-title');
      const lead = main.querySelector('.page-lead');
      const form = main.querySelector('[data-persist-form]');
      const formGrid = form?.querySelector('.form-grid');
      if (title) title.textContent = `${booking.title} 변경 요청`;
      if (lead) lead.textContent = `${booking.product || '선택 옵션'} · 공급자 확정 전에는 변경 요청만 저장됩니다.`;
      if (form) form.dataset.persistForm = `booking-change-${booking.id}`;
      if (formGrid && booking.providerType !== 'HOTEL') {
        formGrid.innerHTML = `<label class="form-field"><span>희망 이용일</span><input type="date" name="requestedDate" required></label><label class="form-field"><span>희망 시간</span><input type="time" name="requestedTime" required></label><label class="form-field"><span>변경 내용</span><input name="requestedOption" value="${escapeHtml(booking.product || '')}" required></label><label class="form-field"><span>변경 사유</span><select name="reason"><option>여행 일정 변경</option><option>이용 인원 변경</option><option>상품 옵션 변경</option><option>기타</option></select></label>`;
      }
      main.querySelectorAll('a[href="booking-detail.html"]').forEach((link) => { link.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}`; });
    }
    if (route === 'booking-cancel.html') {
      const title = main.querySelector('.page-title');
      const lead = main.querySelector('.page-lead');
      const form = main.querySelector('[data-persist-form]');
      const amounts = [...main.querySelectorAll('.price-lines strong')];
      if (title) title.textContent = `${booking.title} 취소 검토`;
      if (lead) lead.textContent = `${booking.product || '선택 옵션'} · 공급자 최종 상태와 환불 규칙 확인 전에는 취소 요청으로 저장됩니다.`;
      if (form) {
        form.dataset.persistForm = `booking-cancel-${booking.id}`;
        form.dataset.confirmMessage = `예상 취소 수수료는 0원, 예상 환불액은 ${Number(booking.amount || 0).toLocaleString('ko-KR')}원입니다. 현재 단계에서는 공급자에 취소 명령을 보내지 않고 Mock 요청만 저장합니다.`;
      }
      if (amounts[0]) amounts[0].textContent = `${Number(booking.amount || 0).toLocaleString('ko-KR')}원`;
      if (amounts[1]) amounts[1].textContent = '0원';
      if (amounts[2]) amounts[2].textContent = `${Number(booking.amount || 0).toLocaleString('ko-KR')}원`;
      main.querySelectorAll('a[href="booking-detail.html"]').forEach((link) => { link.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}`; });
    }
    main.insertAdjacentHTML('afterbegin', `<section class="platform-booking-strip" data-live-booking-state><div><small>화면 검증용 예약 · ${escapeHtml(booking.id)}</small><strong>${escapeHtml(bookingStatusLabel(booking.status))}</strong><span>${escapeHtml(booking.title)} · ${Number(booking.amount || 0).toLocaleString('ko-KR')}원</span></div><div><a class="ui-button" href="inquiry-create.html?bookingId=${encodeURIComponent(booking.id)}">이 예약 문의</a><a class="ui-button" href="booking-detail.html?id=${encodeURIComponent(booking.id)}">상태 새로 보기</a></div></section>`);
  };

  const renderCheckoutState = () => {
    if (!['booking-guests.html', 'booking-review.html', 'checkout.html'].includes(route)) return;
    const bookingParams = new URLSearchParams(location.search);
    const selectedRoomTypeId = bookingParams.get('roomTypeId');
    const roomCatalog = {
      rt_deluxe_ocean: { name: '디럭스 오션뷰', rate: 186400, includes: '2인 조식 포함 · 체크인 3일 전까지 무료 취소' },
      rt_club_ocean: { name: '리젠시 클럽 오션', rate: 262000, includes: '클럽 라운지·조식 포함 · 체크인 7일 전까지 무료 취소' },
      rt_family_suite: { name: '2 베드룸 레지던스', rate: 278000, includes: '4인 조식 포함 · 예약 후 환불 불가' }
    };
    if (route === 'booking-guests.html' && selectedRoomTypeId && roomCatalog[selectedRoomTypeId] && !document.documentElement.dataset.bookingContextSeeded) {
      document.documentElement.dataset.bookingContextSeeded = 'true';
      const room = roomCatalog[selectedRoomTypeId];
      const checkIn = bookingParams.get('checkIn') || '2026-08-14';
      const checkOut = bookingParams.get('checkOut') || '2026-08-17';
      const nights = Math.max(1, Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000));
      const guestValue = bookingParams.get('guests') || '2';
      const adultCount = Number(guestValue.match(/^\d+/)?.[0] || 2);
      const childCount = guestValue.includes('-') ? Number(guestValue.split('-')[1] || 0) : 0;
      saveCheckout({
        items: [{
          id: `hotel_${selectedRoomTypeId}`,
          title: `Hyatt Regency Danang Resort · ${room.name}`,
          description: `${checkIn.replaceAll('-', '.')}–${checkOut.replaceAll('-', '.')} · ${nights}박 · 성인 ${adultCount}명${childCount ? ` · 아동 ${childCount}명` : ''}`,
          supplier: 'Hyatt Regency Danang Resort',
          image: 'assets/images/hero-hotel.jpg',
          amount: room.rate * nights,
          selected: true,
          roomTypeId: selectedRoomTypeId,
          checkIn,
          checkOut,
          guests: guestValue,
          policy: room.includes
        }],
        guest: {},
        bookingContext: { hotelId: bookingParams.get('hotelId') || 'htl_danang_ocean', destination: bookingParams.get('destination') || '다낭', checkIn, checkOut, guests: guestValue },
        step: 'GUESTS'
      });
      const backLink = document.querySelector('[data-booking-back]');
      if (backLink) {
        const backParams = new URLSearchParams({ destination: bookingParams.get('destination') || '다낭', checkIn, checkOut, guests: guestValue, hotelId: bookingParams.get('hotelId') || 'htl_danang_ocean' });
        backLink.href = `hotel-detail.html?${backParams.toString()}#rooms`;
        backLink.textContent = '객실 선택으로 돌아가기';
      }
    }
    const checkout = api.list('checkout', []).find((item) => item.id === 'active');
    if (!checkout) return;
    const main = getMainShell();
    if (!main) return;
    const total = (checkout.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const itemRows = (checkout.items || []).map((item) => `<div class="info-row"><strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(item.description || item.supplier || '선택 옵션')}<br>${Number(item.amount || 0).toLocaleString('ko-KR')}원</div></div>`).join('');
    const itemCards = (checkout.items || []).map((item) => `<article><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description || item.supplier || '선택 옵션')}</small></div><b>${Number(item.amount || 0).toLocaleString('ko-KR')}원</b></article>`).join('');
    const guestName = `${checkout.guest?.familyName || ''} ${checkout.guest?.givenName || ''}`.trim() || '입력 확인 필요';

    if (route === 'booking-guests.html') {
      const form = main.querySelector('[data-flow-form]');
      if (!form || form.dataset.checkoutHydrated) return;
      form.dataset.checkoutHydrated = 'true';
      const textInputs = [...form.querySelectorAll('input:not([type]), input[type="text"]')];
      if (checkout.guest?.familyName) textInputs[0].value = checkout.guest.familyName;
      if (checkout.guest?.givenName) textInputs[1].value = checkout.guest.givenName;
      if (checkout.guest?.email) form.querySelector('input[type="email"]').value = checkout.guest.email;
      if (checkout.guest?.phone) form.querySelector('input[type="tel"]').value = checkout.guest.phone;
      const summary = main.querySelector('[data-checkout-summary]');
      if (summary) {
        summary.innerHTML = `<div class="checkout-selection-items">${itemCards || '<div class="empty-state"><strong>선택한 상품이 없습니다.</strong><p>카트로 돌아가 상품을 선택해 주세요.</p></div>'}</div><div class="price-lines"><div class="total"><span>예상 총액</span><strong>${Number(total).toLocaleString('ko-KR')}원</strong></div></div>`;
      }
      return;
    }

    if (route === 'booking-review.html') {
      const signature = `${checkout.updatedAt || 'checkout'}:${checkout.items?.length || 0}:${total}`;
      if (main.dataset.checkoutReviewHydrated === signature) return;
      main.dataset.checkoutReviewHydrated = signature;
      const banner = main.querySelector('[data-revalidation-banner]');
      if (banner) {
        banner.querySelector('strong').textContent = `${(checkout.items || []).length}개 상품의 Mock 가격과 이용 가능 여부를 확인했습니다`;
        banner.querySelector('p').textContent = `확인 시각 ${new Date().toLocaleString('ko-KR')} · 실제 API 연결 전에는 결제·재고가 확정되지 않습니다.`;
        banner.querySelector('.status-chip').textContent = checkout.items?.length ? '변경 없음' : '선택 없음';
      }
      const selection = main.querySelector('[data-review-selection] .info-list');
      if (selection) {
        selection.innerHTML = `${itemRows || '<div class="empty-state"><strong>선택한 상품이 없습니다.</strong><p>카트에서 상품을 선택해 주세요.</p></div>'}<div class="info-row"><strong>예약자</strong><div>${escapeHtml(guestName)}<br>${escapeHtml(checkout.guest?.email || '이메일 미입력')}</div></div><div class="info-row"><strong>공급자 확인</strong><div>각 상품은 공급자별 예약 가능 여부와 취소 조건을 별도로 확인합니다.</div></div>`;
      }
      const side = main.querySelector('[data-review-side]');
      if (side) {
        const actions = [...side.querySelectorAll('.ui-button')];
        side.querySelector('.empty-state')?.remove();
        side.insertAdjacentHTML('afterbegin', `<div class="checkout-selection-items">${itemCards}</div><div class="price-lines"><div><span>상품 ${checkout.items?.length || 0}개</span><span>${Number(total).toLocaleString('ko-KR')}원</span></div><div class="total"><span>예상 결제금액</span><strong>${Number(total).toLocaleString('ko-KR')}원</strong></div></div>`);
        if (!checkout.items?.length && actions[0]) {
          actions[0].href = 'booking-cart.html';
          actions[0].textContent = '카트에서 상품 선택';
        }
      }
      return;
    }

    if (route === 'checkout.html') {
      const signature = `${checkout.updatedAt || 'checkout'}:${checkout.items?.length || 0}:${total}`;
      if (main.dataset.checkoutPaymentHydrated === signature) return;
      main.dataset.checkoutPaymentHydrated = signature;
      const side = main.querySelector('[data-payment-side]');
      if (side) {
        side.querySelector('.empty-state')?.remove();
        side.insertAdjacentHTML('afterbegin', `<div class="checkout-selection-items">${itemCards || '<div class="empty-state"><strong>선택한 상품이 없습니다.</strong></div>'}</div><div class="price-lines"><div><span>상품 ${checkout.items?.length || 0}개</span><span>${Number(total).toLocaleString('ko-KR')}원</span></div><div><span>쿠폰</span><span>0원</span></div><div class="total"><span>최종 결제</span><strong>${Number(total).toLocaleString('ko-KR')}원</strong></div></div>`);
        const payButton = side.querySelector('button[type="submit"]');
        if (payButton) {
          payButton.textContent = checkout.items?.length ? `${Number(total).toLocaleString('ko-KR')}원 결제 내용 확인` : '상품을 먼저 선택해 주세요';
          payButton.disabled = !checkout.items?.length;
        }
      }
      return;
    }

    if (main.querySelector('[data-checkout-state]')) return;
    main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-checkout-state><header><div><small>CHECKOUT JSON STATE</small><h2>이전 단계에서 유지된 선택</h2></div><strong>${Number(total).toLocaleString('ko-KR')}원</strong></header><div class="platform-checkout-summary"><div><strong>예약자</strong><span>${escapeHtml(`${checkout.guest?.familyName || ''} ${checkout.guest?.givenName || ''}`.trim() || '입력 확인 필요')} · ${escapeHtml(checkout.guest?.email || '-')}</span></div>${(checkout.items || []).map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description || '')} · ${Number(item.amount || 0).toLocaleString('ko-KR')}원</span></div>`).join('')}</div></section>`);
  };

  const renderRoleState = async () => {
    await seedDomains();
    const main = document.querySelector('.bo-main') || getMainShell();
    if (!main || main.querySelector('[data-platform-role-state]')) return;

    if (route === 'orders.html' && session) {
      const records = api.list('bookings').filter((item) => item.memberId === memberId);
      const accountContent = main.querySelector('.account-content') || main;
      accountContent.querySelectorAll(':scope > .checkout-card').forEach((card) => card.remove());
      const cards = records.map((item) => `<article class="platform-booking-card"><div><small>${escapeHtml(providerLabel(item.providerType))} · ${escapeHtml(item.id)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.product || '')}</span></div><dl><div><dt>이용일</dt><dd>${escapeHtml(item.startAt ? new Date(item.startAt).toLocaleDateString('ko-KR') : '일정 미정')}</dd></div><div><dt>금액</dt><dd>${Number(item.amount || 0).toLocaleString('ko-KR')}원</dd></div></dl><footer><span class="workflow-badge ${item.status === 'CONFIRMED' ? 'success' : item.status === 'UNAVAILABLE' ? 'danger' : 'warn'}">${escapeHtml(bookingStatusLabel(item.status))}</span><a class="workflow-button" href="booking-detail.html?id=${encodeURIComponent(item.id)}">예약 상세</a></footer></article>`).join('');
      const html = `<section class="platform-booking-list" data-platform-role-state><header><div><small>MY BOOKINGS</small><h2>내 예약·주문 현황</h2></div><span>${records.length}건</span></header><div class="platform-booking-cards">${cards || '<div class="empty-state"><strong>예약 내역이 없습니다.</strong><p>예약이 완료되면 이곳에서 상태를 확인할 수 있습니다.</p></div>'}</div></section>`;
      const tabs = accountContent.querySelector('.route-tabs');
      if (tabs) tabs.insertAdjacentHTML('afterend', html);
      else accountContent.insertAdjacentHTML('beforeend', html);
    }

    if (route === 'saved.html') {
      const records = api.list('saved-items').filter((item) => item.memberId === memberId);
      main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-role-state><header><div><small>SAVED JSON STATE</small><h2>저장한 장소·스토리·가이드</h2></div><span>${records.length}건</span></header><div class="platform-saved-grid">${records.map((item) => `<article><div><small>${escapeHtml(item.sourceType)}</small><strong>${escapeHtml(item.title)}</strong></div><a class="ui-button" href="${escapeHtml(item.href)}">다시 보기</a></article>`).join('') || '<div class="empty-state"><strong>아직 저장한 항목이 없습니다.</strong></div>'}</div></section>`);
    }

    if (route === 'partner-bookings.html') {
      const records = api.list('bookings');
      main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-role-state><header><div><small>SHARED BOOKING STATE</small><h2>B2C 요청과 연결된 예약 작업함</h2></div><span>${records.length}건</span></header><div class="platform-table-wrap"><table><thead><tr><th>예약</th><th>고객 선택</th><th>상태</th><th>정산</th><th>관리</th></tr></thead><tbody>${records.map((item) => `<tr><td><strong>${escapeHtml(item.id)}</strong><small>${escapeHtml(item.providerType)}</small></td><td>${escapeHtml(item.title)}<small>${escapeHtml(item.product || '')}</small></td><td><span class="workflow-badge">${escapeHtml(item.status)}</span></td><td>${escapeHtml(item.settlementStatus || '-')}</td><td><a class="workflow-button" href="partner-booking-detail.html?id=${encodeURIComponent(item.id)}">처리</a></td></tr>`).join('')}</tbody></table></div></section>`);
    }

    if (route === 'partner-finance.html') {
      const records = api.list('settlements');
      main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-role-state><header><div><small>SETTLEMENT JSON STATE</small><h2>예약·환불·조정 연결 정산</h2></div><span>${records.length}건</span></header><div class="platform-table-wrap"><table><thead><tr><th>정산</th><th>총매출</th><th>수수료</th><th>환불·조정</th><th>순지급</th><th>상태</th></tr></thead><tbody>${records.map((item) => `<tr><td><strong>${escapeHtml(item.id)}</strong><small>${escapeHtml(item.period)}</small></td><td>${Number(item.gross).toLocaleString('ko-KR')}원</td><td>${Number(item.commission).toLocaleString('ko-KR')}원</td><td>${Number(Number(item.refunds || 0) - Number(item.adjustments || 0)).toLocaleString('ko-KR')}원</td><td><strong>${Number(item.net).toLocaleString('ko-KR')}원</strong></td><td>${escapeHtml(item.status)}</td></tr>`).join('')}</tbody></table></div></section>`);
    }

    if (route === 'partner-booking-detail.html') {
      const id = new URLSearchParams(location.search).get('id') || 'HNG-G-10482';
      const booking = api.list('bookings').find((item) => item.id === id);
      if (!booking) return;
      const header = main.querySelector('.bo-page-head');
      const legacy = main.querySelector('.bo-grid.two');
      const notice = main.querySelector('.bo-notice');
      if (header) {
        const heading = header.querySelector('h1');
        const description = header.querySelector('p');
        if (heading) heading.textContent = booking.id;
        if (description) description.textContent = `${booking.title} · ${booking.product || ''}`;
      }
      if (legacy) {
        legacy.hidden = true;
        legacy.style.display = 'none';
      }
      if (notice) {
        notice.hidden = true;
        notice.style.display = 'none';
      }
      header?.insertAdjacentHTML('afterend', `<section class="platform-state-panel" data-platform-role-state><header><div><small>${escapeHtml(booking.providerType)} · ${escapeHtml(booking.id)}</small><h2>${escapeHtml(booking.title)}</h2></div><span class="workflow-badge ${booking.status === 'UNAVAILABLE' ? 'danger' : booking.status === 'CONFIRMED' ? 'success' : 'warn'}">${escapeHtml(booking.status)}</span></header><dl><div><dt>고객 선택</dt><dd>${escapeHtml(booking.product || '-')}</dd></div><div><dt>이용 일정</dt><dd>${escapeHtml(booking.startAt ? new Date(booking.startAt).toLocaleString('ko-KR') : '-')}</dd></div><div><dt>결제·정산</dt><dd>${escapeHtml(booking.paymentStatus || '-')} · ${escapeHtml(booking.settlementStatus || '-')} · ${Number(booking.amount || 0).toLocaleString('ko-KR')}원</dd></div><div><dt>공급자 번호</dt><dd>${escapeHtml(booking.supplierBookingId || '미수신')}</dd></div></dl><div class="content-section-head" style="margin-top:18px"><div><h2>처리 이력</h2><p>고객과 업체가 같은 예약 상태를 조회합니다.</p></div></div><div class="platform-table-wrap"><table><thead><tr><th>시각</th><th>상태</th><th>내용</th></tr></thead><tbody>${(booking.timeline || []).map((item) => `<tr><td>${escapeHtml(new Date(item.at).toLocaleString('ko-KR'))}</td><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.label)}</td></tr>`).join('')}</tbody></table></div></section>`);
    }
  };

  const renderLandmarkAlternatives = async () => {
    if (route !== 'landmark.html') return;
    const main = getMainShell();
    if (!main || main.querySelector('[data-landmark-alternatives]') || landmarkAlternativesState !== 'idle') return;
    landmarkAlternativesState = 'loading';
    try {
      const knowledge = await api.get('ai/travel-knowledge.json');
      const destination = knowledge?.destinations?.find((item) => item.name === '교토');
      const hero = main.querySelector('.landmark-hero');
      if (!destination || !hero) {
        landmarkAlternativesState = 'idle';
        return;
      }
      landmarkOptions = [...destination.landmarks].sort((a, b) => b.score - a.score);
      const confidenceLabel = (value) => ({
        CATALOG_VERIFIED: '기본 정보 확인됨',
        HOURS_CHECK_REQUIRED: '방문 전 운영시간 확인'
      }[value] || '정보 확인 필요');
      hero.insertAdjacentHTML('afterend', `
        <section class="landmark-alternatives" data-landmark-alternatives data-landmark-flow data-stage="browse">
          <div class="landmark-choice-heading">
            <div>
              <span class="page-eyebrow">KYOTO PLACE OPTIONS</span>
              <h2>내 일정에 어울리는 교토의 한 장면</h2>
              <p>사진과 핵심 정보를 비교한 뒤 상세 내용을 확인하고 일정에 담아보세요.</p>
            </div>
            <a class="ui-button" href="ai-travel.html">여행 전체를 추천받기</a>
          </div>
          <ol class="landmark-choice-steps" aria-label="장소 선택 단계">
            <li class="is-active"><span>1</span><strong>후보 비교</strong></li>
            <li><span>2</span><strong>상세 확인</strong></li>
            <li><span>3</span><strong>일정에 담기</strong></li>
          </ol>
          <p class="landmark-flow-status" data-landmark-flow-status>현재 장소와 함께 둘러보기 좋은 후보 4곳을 추천했어요.</p>
          <div class="landmark-choice-grid">
            ${landmarkOptions.map((item) => `
              <article class="landmark-choice-card" data-landmark-card="${escapeHtml(item.id)}">
                <img src="${escapeHtml(item.image || 'assets/images/landmark-kyoto.jpg')}" alt="${escapeHtml(item.name)} 방문 이미지">
                <div class="landmark-choice-card-body">
                  <div class="landmark-choice-meta"><span>${escapeHtml(item.area || '교토')}</span><span>추천 ${item.score}점</span></div>
                  <strong>${escapeHtml(item.name)}</strong>
                  <small>${escapeHtml(item.reason)}</small>
                  <div class="landmark-choice-facts"><span>${escapeHtml(item.bestTime)} 추천</span><span>약 ${item.estimatedMinutes}분</span><span>${escapeHtml(confidenceLabel(item.confidence))}</span></div>
                  <button class="ui-button" type="button" data-landmark-detail="${escapeHtml(item.id)}">상세보기</button>
                </div>
              </article>`).join('')}
          </div>
        </section>`);
      landmarkAlternativesState = 'rendered';
    } catch {
      landmarkAlternativesState = 'idle';
    }
  };

  const openLandmarkDetail = (id) => {
    const item = landmarkOptions.find((option) => option.id === id);
    if (!item) return;
    const confidenceLabel = ({
      CATALOG_VERIFIED: '기본 정보가 확인된 장소입니다.',
      HOURS_CHECK_REQUIRED: '방문 전 당일 운영시간을 확인해야 합니다.'
    })[item.confidence] || '방문 전 최신 정보를 확인해 주세요.';
    let dialog = document.querySelector('[data-landmark-dialog]');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'landmark-choice-dialog';
      dialog.dataset.landmarkDialog = '';
      document.body.append(dialog);
    }
    dialog.innerHTML = `
      <div class="landmark-choice-dialog-visual"><img src="${escapeHtml(item.image || 'assets/images/landmark-kyoto.jpg')}" alt="${escapeHtml(item.name)} 상세 이미지"></div>
      <div class="landmark-choice-dialog-copy">
        <header><div><small>${escapeHtml(item.area || '교토')} · ${escapeHtml(item.tags.join(' · '))}</small><strong>${escapeHtml(item.name)}</strong></div><button type="button" data-landmark-dialog-close aria-label="상세보기 닫기">×</button></header>
        <p>${escapeHtml(item.summary || item.reason)}</p>
        <dl>
          <div><dt>추천 시간</dt><dd>${escapeHtml(item.bestTime)}부터</dd></div>
          <div><dt>권장 체류</dt><dd>약 ${item.estimatedMinutes}분</dd></div>
          <div><dt>운영 안내</dt><dd>${escapeHtml(item.hoursNote || confidenceLabel)}</dd></div>
          <div><dt>추천 이유</dt><dd>${escapeHtml(item.reason)}</dd></div>
        </dl>
        <div class="landmark-choice-tip"><strong>방문 전 확인</strong><span>${escapeHtml(item.visitTip || confidenceLabel)}</span></div>
        <footer><button class="ui-button" type="button" data-landmark-dialog-close>다른 후보 더 보기</button><button class="ui-button primary" type="button" data-add-trip data-landmark-candidate data-trip-title="${escapeHtml(item.name)}" data-trip-type="${escapeHtml(item.type)}" data-trip-id="${escapeHtml(item.id)}">이 장소를 일정에 담기</button></footer>
      </div>`;
    dialog.querySelectorAll('[data-landmark-dialog-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }, { once: true });
    const flow = document.querySelector('[data-landmark-flow]');
    if (flow) {
      flow.dataset.stage = 'detail';
      const status = flow.querySelector('[data-landmark-flow-status]');
      if (status) status.textContent = `‘${item.name}’의 방문 정보와 주의사항을 확인하고 있어요.`;
    }
    dialog.showModal();
  };

  document.addEventListener('click', (event) => {
    const detailButton = event.target.closest('[data-landmark-detail]');
    if (detailButton) {
      event.preventDefault();
      openLandmarkDetail(detailButton.dataset.landmarkDetail);
    }
  });

  const observer = new MutationObserver(() => {
    renderDomainPanel();
    renderTrips();
    renderBookingState();
    renderCheckoutState();
    renderRoleState();
    renderLandmarkAlternatives();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  seedDomains().then(() => {
    renderDomainPanel();
    renderTrips();
    renderBookingState();
    renderCheckoutState();
    renderRoleState();
    renderLandmarkAlternatives();
    setTimeout(() => observer.disconnect(), 5000);
  });

  window.HotelNGoPlatform = {
    seedDomains,
    addToTrip,
    updateBooking,
    getState: (domain) => api.list(domain),
    mode: api.mode
  };
})();
