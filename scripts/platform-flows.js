(() => {
  const api = window.HotelNGoMockAPI;
  if (!api?.list || !api?.upsert) return;

  const route = location.pathname.split('/').pop() || 'index.html';
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('hotelngo.mock.session.v1') || 'null'); } catch { return null; }
  })();
  const memberId = session?.user?.id || 'usr_demo_jiho';
  let seeds = null;
  let toastTimer;
  let pendingCancellation = null;

  if (!document.querySelector('link[data-platform-flows]')) {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'styles/platform-flows.css?v=2';
    style.dataset.platformFlows = '';
    document.head.append(style);
  }

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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

  const selectedCartItems = () => [...document.querySelectorAll('[data-cart-select]:checked')].map((input, index) => {
    const card = input.closest('.cart-item');
    return {
      id: card?.dataset.marketplaceCartIndex != null ? `marketplace_${card.dataset.marketplaceCartIndex}` : `cart_${index + 1}`,
      title: card?.querySelector('.cart-copy strong')?.textContent.trim() || input.getAttribute('aria-label') || '선택 상품',
      description: card?.querySelector('.cart-copy small')?.textContent.trim() || '',
      supplier: card?.querySelector('.cart-copy span')?.textContent.trim() || '',
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
      if (!session) {
        location.href = `login.html?returnUrl=${encodeURIComponent(`${route}${location.search}`)}`;
        return;
      }
      const title = tripButton.dataset.tripTitle
        || document.querySelector('h1')?.textContent.trim()
        || tripButton.closest('article')?.querySelector('h2, h3, strong')?.textContent.trim()
        || document.title;
      const trip = await addToTrip({
        title,
        type: tripButton.dataset.tripType || 'PLACE',
        sourceId: tripButton.dataset.tripId || `${route}:${new URLSearchParams(location.search).get('id') || 'page'}`
      });
      tripButton.textContent = '일정에 담김';
      tripButton.classList.add('soft');
      tripButton.setAttribute('aria-pressed', 'true');
      showToast(`‘${trip.title}’ 일정에 추가했습니다.`);
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
        api.upsert('bookings', {
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
    const main = document.querySelector('main .shell');
    if (!main || main.querySelector('[data-platform-trip-list]')) return;
    const trips = api.list('trips').filter((item) => item.ownerId === memberId);
    const head = main.querySelector('.page-head, .content-section-head');
    const html = `<section class="platform-trip-list" data-platform-trip-list><div class="content-section-head"><div><span class="page-eyebrow">MY TRIP JSON</span><h2>저장된 나의 여행</h2><p>직접 만든 일정, 공개 가이드에서 복사한 일정, AI가 만든 초안을 같은 구조로 편집합니다.</p></div><a class="ui-button primary" href="trip-editor.html">새 여행 만들기</a></div>${trips.map((trip) => `<article><div><strong>${escapeHtml(trip.title)}</strong><small>${escapeHtml(trip.sourceType)} · ${trip.items?.length || 0}개 일정 · ${escapeHtml(trip.status)}</small></div><div><a class="ui-button" href="trip-booking-plan.html?tripId=${encodeURIComponent(trip.id)}">예약 준비도</a><a class="ui-button primary" href="trip-editor.html?tripId=${encodeURIComponent(trip.id)}">편집</a></div></article>`).join('') || '<div class="empty-state"><strong>아직 저장된 여행이 없습니다.</strong><p>AI 여행 또는 공개 여행에서 초안을 만들어 보세요.</p></div>'}</section>`;
    if (head) head.insertAdjacentHTML('afterend', html);
    else main.insertAdjacentHTML('afterbegin', html);
  };

  const renderBookingState = async () => {
    if (!['booking-detail.html', 'booking-complete.html'].includes(route)) return;
    await seedDomains();
    const checkout = api.list('checkout', []).find((item) => item.id === 'active');
    const id = new URLSearchParams(location.search).get('id') || checkout?.bookingId || 'HNG-2026-000001';
    const booking = api.list('bookings').find((item) => item.id === id);
    const main = document.querySelector('main .shell');
    if (!booking || !main || main.querySelector('[data-live-booking-state]')) return;
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
      if (title) title.textContent = booking.title;
      if (lead) lead.textContent = `${booking.product || ''} · ${booking.startAt ? new Date(booking.startAt).toLocaleString('ko-KR') : ''}`;
      const detailMain = main.querySelector('.checkout-main');
      if (detailMain) {
        detailMain.innerHTML = `
          <div class="state-banner"><div><strong>${booking.status === 'UNAVAILABLE' ? '예약 불가 · 대안 선택 필요' : escapeHtml(booking.status)}</strong><p>${escapeHtml(booking.supplierBookingId ? `공급자 번호 ${booking.supplierBookingId}` : '공급자 예약번호 미수신 또는 확인 대기')}</p></div><span class="status-chip warning">${escapeHtml(booking.status)}</span></div>
          <section class="checkout-card"><div class="checkout-card-head"><div><h2>예약 정보</h2><p>예약번호 ${escapeHtml(booking.id)}</p></div></div><div class="info-list">
            <div class="info-row"><strong>고객 선택</strong><div>${escapeHtml(booking.title)}<br>${escapeHtml(booking.product || '')}</div></div>
            <div class="info-row"><strong>이용 일정</strong><div>${escapeHtml(booking.startAt ? new Date(booking.startAt).toLocaleString('ko-KR') : '일정 미정')}${booking.endAt ? ` – ${escapeHtml(new Date(booking.endAt).toLocaleString('ko-KR'))}` : ''}</div></div>
            <div class="info-row"><strong>예약자</strong><div>${escapeHtml(`${booking.guest?.familyName || ''} ${booking.guest?.givenName || ''}`.trim() || '회원 프로필')} · ${escapeHtml(booking.guest?.email || '-')}</div></div>
            <div class="info-row"><strong>취소·환불</strong><div>${booking.cancellation ? `무료 취소 ${escapeHtml(booking.cancellation.freeUntil || '-')}까지 · 예상 환불 ${Number(booking.cancellation.estimatedRefund || 0).toLocaleString('ko-KR')}원` : '공급자 정책 확인 필요'}</div></div>
            <div class="info-row"><strong>결제·정산</strong><div>${escapeHtml(booking.paymentStatus || '-')} · ${escapeHtml(booking.settlementStatus || '-')} · ${Number(booking.amount || 0).toLocaleString('ko-KR')}원</div></div>
          </div></section>
          ${(booking.items || []).length ? `<section class="checkout-card"><div class="checkout-card-head"><div><h2>복수 공급자 선택 항목</h2><p>각 항목은 공급자별로 별도 확정·취소·정산합니다.</p></div></div><div class="info-list">${booking.items.map((item) => `<div class="info-row"><strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(item.description || '')}<br>${Number(item.amount || 0).toLocaleString('ko-KR')}원</div></div>`).join('')}</div></section>` : ''}
          <section class="checkout-card"><div class="checkout-card-head"><div><h2>처리 이력</h2><p>고객 상태와 공급자 상태를 함께 기록합니다.</p></div></div><ol class="order-timeline">${(booking.timeline || []).map((item) => `<li><time>${escapeHtml(new Date(item.at).toLocaleString('ko-KR'))}</time><strong>${escapeHtml(item.label || item.status)}</strong></li>`).join('')}</ol></section>`;
      }
      const side = main.querySelector('.checkout-side');
      if (side) {
        const sideTitle = side.querySelector('.checkout-product strong');
        const sideCopy = side.querySelector('.checkout-product small');
        const price = side.querySelector('.price-lines strong');
        if (sideTitle) sideTitle.textContent = booking.title;
        if (sideCopy) sideCopy.innerHTML = `${escapeHtml(booking.providerType || '공급자')}<br>${escapeHtml(booking.startAt ? new Date(booking.startAt).toLocaleString('ko-KR') : '일정 미정')}`;
        if (price) price.textContent = `${Number(booking.amount || 0).toLocaleString('ko-KR')}원`;
      }
      main.querySelectorAll('a[href="booking-change.html"]').forEach((link) => { link.href = `booking-change.html?id=${encodeURIComponent(booking.id)}`; });
      main.querySelectorAll('a[href="booking-cancel.html"]').forEach((link) => { link.href = `booking-cancel.html?id=${encodeURIComponent(booking.id)}`; });
    }
    main.insertAdjacentHTML('afterbegin', `<section class="platform-booking-strip" data-live-booking-state><div><small>JSON LOCAL API MOCK · ${escapeHtml(booking.id)}</small><strong>${escapeHtml(booking.status)}</strong><span>${escapeHtml(booking.title)} · ${Number(booking.amount || 0).toLocaleString('ko-KR')}원</span></div><div><a class="ui-button" href="inquiry-create.html?bookingId=${encodeURIComponent(booking.id)}">이 예약 문의</a><a class="ui-button" href="booking-detail.html?id=${encodeURIComponent(booking.id)}">상태 새로 보기</a></div></section>`);
  };

  const renderCheckoutState = () => {
    if (!['booking-guests.html', 'booking-review.html', 'checkout.html'].includes(route)) return;
    const checkout = api.list('checkout', []).find((item) => item.id === 'active');
    if (!checkout) return;
    const main = document.querySelector('main .shell');
    if (!main) return;
    if (route === 'booking-guests.html') {
      const form = main.querySelector('[data-flow-form]');
      if (!form || form.dataset.checkoutHydrated) return;
      form.dataset.checkoutHydrated = 'true';
      const textInputs = [...form.querySelectorAll('input:not([type]), input[type="text"]')];
      if (checkout.guest?.familyName) textInputs[0].value = checkout.guest.familyName;
      if (checkout.guest?.givenName) textInputs[1].value = checkout.guest.givenName;
      if (checkout.guest?.email) form.querySelector('input[type="email"]').value = checkout.guest.email;
      if (checkout.guest?.phone) form.querySelector('input[type="tel"]').value = checkout.guest.phone;
      return;
    }
    if (main.querySelector('[data-checkout-state]')) return;
    const total = (checkout.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-checkout-state><header><div><small>CHECKOUT JSON STATE</small><h2>이전 단계에서 유지된 선택</h2></div><strong>${Number(total).toLocaleString('ko-KR')}원</strong></header><div class="platform-checkout-summary"><div><strong>예약자</strong><span>${escapeHtml(`${checkout.guest?.familyName || ''} ${checkout.guest?.givenName || ''}`.trim() || '입력 확인 필요')} · ${escapeHtml(checkout.guest?.email || '-')}</span></div>${(checkout.items || []).map((item) => `<div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description || '')} · ${Number(item.amount || 0).toLocaleString('ko-KR')}원</span></div>`).join('')}</div></section>`);
  };

  const renderRoleState = async () => {
    await seedDomains();
    const main = document.querySelector('.bo-main, main .shell');
    if (!main || main.querySelector('[data-platform-role-state]')) return;

    if (['bookings.html', 'orders.html'].includes(route)) {
      const records = api.list('bookings').filter((item) => item.memberId === memberId);
      main.insertAdjacentHTML('afterbegin', `<section class="platform-state-panel" data-platform-role-state><header><div><small>BOOKING JSON STATE</small><h2>내 예약·주문 실제 Mock 상태</h2></div><span>${records.length}건</span></header><div class="platform-table-wrap"><table><thead><tr><th>예약</th><th>상품</th><th>이용일</th><th>금액</th><th>상태</th><th>관리</th></tr></thead><tbody>${records.map((item) => `<tr><td><strong>${escapeHtml(item.id)}</strong><small>${escapeHtml(item.providerType)}</small></td><td>${escapeHtml(item.title)}<small>${escapeHtml(item.product || '')}</small></td><td>${escapeHtml(item.startAt ? new Date(item.startAt).toLocaleDateString('ko-KR') : '-')}</td><td>${Number(item.amount || 0).toLocaleString('ko-KR')}원</td><td><span class="workflow-badge ${item.status === 'CONFIRMED' ? 'success' : item.status === 'UNAVAILABLE' ? 'danger' : 'warn'}">${escapeHtml(item.status)}</span></td><td><a class="workflow-button" href="booking-detail.html?id=${encodeURIComponent(item.id)}">상세</a></td></tr>`).join('')}</tbody></table></div></section>`);
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
    const main = document.querySelector('main .shell');
    if (!main || main.querySelector('[data-landmark-alternatives]')) return;
    const knowledge = await api.get('ai/travel-knowledge.json').catch(() => null);
    const destination = knowledge?.destinations?.find((item) => item.name === '교토');
    if (!destination) return;
    const ranked = [...destination.landmarks].sort((a, b) => b.score - a.score);
    const hero = main.querySelector('.landmark-hero');
    hero?.insertAdjacentHTML('afterend', `<section class="landmark-alternatives" data-landmark-alternatives><div class="content-section-head"><div><span class="page-eyebrow">AI LANDMARK OPTIONS · JSON</span><h2>같은 여행지의 다른 장면</h2><p>장소 점수와 취향 태그를 기준으로 정렬했습니다. 운영시간·지도 이동시간은 실제 연결 전까지 재확인 상태입니다.</p></div><a class="ui-button" href="ai-travel.html">AI 일정에서 조합하기</a></div><div>${ranked.map((item, index) => `<article><span>${index + 1}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.reason)}</small><em>${escapeHtml(item.tags.join(' · '))} · ${item.score}점 · ${escapeHtml(item.confidence)}</em></div><button class="ui-button" type="button" data-add-trip data-trip-title="${escapeHtml(item.name)}" data-trip-type="${escapeHtml(item.type)}" data-trip-id="${escapeHtml(item.id)}">이 후보 담기</button></article>`).join('')}</div></section>`);
  };

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
