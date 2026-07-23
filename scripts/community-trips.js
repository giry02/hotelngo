(() => {
  const api = window.HotelNGoMockAPI;
  const route = location.pathname.split('/').pop() || '';
  const session = () => window.HotelNGoAuth?.getSession?.() || null;
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const catalog = () => api.get('community-trips.json');
  const statusLabel = (item) => {
    if (item.bookingType === 'INSTANT' && item.status === 'AVAILABLE') return ['즉시예약', 'bookable'];
    if (item.bookingType === 'REQUEST' && item.status === 'AVAILABLE') return ['요청예약', 'request'];
    if (item.bookingType === 'INFORMATION_ONLY') return ['방문정보', 'info'];
    return ['확인 필요', 'check'];
  };

  const normalizeTrip = (trip) => ({
    ...trip,
    items: trip.items || (trip.days || []).flatMap((day) => (day.items || []).map((item) => ({
      id: `item_${day.day}_${item.time}_${item.title}`.replaceAll(/\s+/g, '_'),
      day: day.day,
      ...item,
      bookingStatus: item.status === 'AVAILABLE' ? 'NOT_BOOKED' : item.status
    })))
  });

  const feed = document.querySelector('[data-community-feed]');
  if (feed) catalog().then(({ trips }) => {
    const localStories = api.list('stories').filter((story) => ['PUBLISHED', 'PENDING_REVIEW'].includes(story.status)).map((story) => ({
      id: story.tripTemplateId || story.id,
      title: story.title,
      summary: story.summary,
      cover: story.cover,
      destination: story.destination,
      duration: story.duration || '일정 초안',
      tags: story.tags || [],
      author: { displayName: story.authorName, verifiedTrips: 0 },
      saves: story.saves || 0,
      copies: story.copies || 0
    }));
    const allTrips = [...localStories, ...trips];
    const renderFeed = (filter = '추천') => {
      const visible = filter === '추천'
        ? allTrips
        : allTrips.filter((trip) => `${trip.destination} ${(trip.tags || []).join(' ')}`.includes(filter));
      feed.innerHTML = visible.length ? visible.map((trip) => `
        <article class="community-card">
          <a href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}"><img src="${escapeHtml(trip.cover)}" alt="${escapeHtml(trip.title)}"></a>
          <div>
            <span class="page-eyebrow">${escapeHtml(trip.destination)} · ${escapeHtml(trip.duration)}</span>
            <h2><a href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}">${escapeHtml(trip.title)}</a></h2>
            <p>${escapeHtml(trip.summary)}</p>
            <div class="community-tags">${(trip.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
            <footer><span>by ${escapeHtml(trip.author?.displayName || '회원 가이드')}</span><span>저장 ${Number(trip.saves || 0).toLocaleString('ko-KR')} · 복사 ${Number(trip.copies || 0).toLocaleString('ko-KR')}</span></footer>
          </div>
        </article>`).join('') : '<div class="empty-state"><strong>해당 주제의 공개 일정이 아직 없습니다.</strong><p>첫 일정을 만들고 공유해 보세요.</p></div>';
    };
    renderFeed();
    document.querySelector('.community-filter')?.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      document.querySelectorAll('.community-filter button').forEach((item) => item.classList.toggle('is-active', item === button));
      renderFeed(button.textContent.trim());
    });
  });

  const detail = document.querySelector('[data-community-detail]');
  if (detail) catalog().then(({ trips }) => {
    const id = new URLSearchParams(location.search).get('id') || trips[0].id;
    const trip = normalizeTrip(trips.find((item) => item.id === id) || trips[0]);
    const days = trip.days?.length ? trip.days : Object.values(trip.items.reduce((groups, item) => {
      groups[item.day] ||= { day: item.day, dateLabel: '', items: [] };
      groups[item.day].items.push(item);
      return groups;
    }, {}));
    detail.innerHTML = `
      <header class="community-detail-hero">
        <img src="${escapeHtml(trip.cover)}" alt="${escapeHtml(trip.title)}">
        <div>
          <span class="page-eyebrow">${escapeHtml(trip.destination)} · MEMBER GUIDE</span>
          <h1>${escapeHtml(trip.title)}</h1>
          <p>${escapeHtml(trip.summary)}</p>
          <div class="creator-line"><strong>${escapeHtml(trip.author?.displayName || '회원 가이드')}</strong><span>공개 일정 ${trip.author?.verifiedTrips || 0}개</span></div>
          <div class="community-tags">${(trip.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
          <div class="page-head-actions">
            <button class="ui-button" type="button" data-save-item="${escapeHtml(trip.id)}" data-text-save>저장</button>
            <button class="ui-button primary" type="button" data-copy-trip>내 여행으로 독립 복사</button>
          </div>
        </div>
      </header>
      <div class="community-detail-layout">
        <section>
          <div class="content-section-head"><div><h2>날짜별 일정</h2><p>복사 후 날짜·인원·장소를 바꾸고 재고와 운영시간을 다시 확인합니다.</p></div></div>
          ${days.length ? days.map((day) => `<article class="community-day"><header><strong>DAY ${day.day}</strong><span>${escapeHtml(day.dateLabel || '')}</span></header><div>${(day.items || []).map((item) => {
            const [label, tone] = statusLabel(item);
            return `<div class="community-stop"><time>${escapeHtml(item.time)}</time><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note || '')}</small></span><em class="${tone}">${label}</em></div>`;
          }).join('')}</div></article>`).join('') : '<div class="empty-state"><strong>작성자가 세부 일정을 정리하고 있습니다.</strong></div>'}
        </section>
        <aside class="community-side">
          <strong>복사하면 이렇게 됩니다</strong>
          <ol><li>원본과 독립된 내 여행 초안 생성</li><li>날짜·인원·장소 교체·삭제</li><li>운영시간·이동·재고 재검증</li><li>예약 가능한 항목만 카트에 추가</li></ol>
          <a class="ui-button" href="community.html">다른 일정 보기</a>
        </aside>
      </div>`;

    detail.querySelector('[data-copy-trip]')?.addEventListener('click', () => {
      const currentSession = session();
      if (!currentSession) {
        location.href = `login.html?returnUrl=${encodeURIComponent(`${route}${location.search}`)}`;
        return;
      }
      const copy = {
        id: `trip_copy_${Date.now()}`,
        ownerId: currentSession.user.id,
        title: `${trip.title} · 내 버전`,
        destination: trip.destination,
        status: 'DRAFT',
        sourceType: 'COMMUNITY_COPY',
        sourceTripId: trip.id,
        sourceAuthor: trip.author,
        items: trip.items.map((item) => ({ ...item, id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
        updatedAt: new Date().toISOString()
      };
      api.upsert('trips', copy);
      api.appendAudit({ actor: currentSession.user.id, action: 'COMMUNITY_TRIP_COPIED', entityType: 'TRIP', entityId: copy.id, payload: { sourceTripId: trip.id } });
      location.href = `trip-editor.html?tripId=${encodeURIComponent(copy.id)}&copied=1`;
    });
  });

  const publishForm = document.querySelector('[data-trip-publish-form]');
  publishForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!publishForm.reportValidity()) return;
    const values = Object.fromEntries(new FormData(publishForm).entries());
    const currentSession = session();
    const tripId = new URLSearchParams(location.search).get('tripId');
    const story = api.upsert('stories', {
      id: `story_${Date.now()}`,
      authorId: currentSession?.user?.id || 'guest',
      authorName: currentSession?.user?.displayName || '회원',
      authorType: 'MEMBER',
      title: values.title,
      summary: values.summary,
      destination: values.destination,
      duration: values.duration,
      cover: values.cover || 'assets/images/landmark-kyoto.jpg',
      tags: String(values.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      status: values.visibility === 'PUBLIC' ? 'PENDING_REVIEW' : 'LINK_SHARED',
      visibility: values.visibility,
      saves: 0,
      copies: 0,
      tripTemplateId: tripId || null,
      publishedAt: new Date().toISOString()
    });
    api.appendAudit({ actor: story.authorId, action: 'STORY_PUBLISH_REQUESTED', entityType: 'STORY', entityId: story.id, payload: { visibility: story.visibility } });
    const result = document.querySelector('[data-publish-result]');
    if (result) {
      result.hidden = false;
      result.innerHTML = `<strong>${story.status === 'PENDING_REVIEW' ? '공개 검수를 요청했습니다.' : '링크 공유 스토리를 만들었습니다.'}</strong><p>예약번호와 여권 정보는 공개 데이터에 포함하지 않습니다.</p><a class="ui-button primary" href="my-stories.html">내 스토리 보기</a>`;
    }
  });

  const bookingPlan = document.querySelector('[data-trip-booking-plan]');
  if (bookingPlan) Promise.all([catalog(), api.get('platform-state.json')]).then(([{ trips }, state]) => {
    const tripId = new URLSearchParams(location.search).get('tripId');
    const trip = normalizeTrip(api.list('trips', state.trips).find((item) => item.id === tripId) || api.list('trips')[0] || trips[0]);
    const items = trip.items || [];
    const categories = [
      ['즉시예약', items.filter((item) => item.bookingType === 'INSTANT' && !['UNAVAILABLE', 'CHECK_REQUIRED'].includes(item.status)), 'bookable'],
      ['요청예약', items.filter((item) => item.bookingType === 'REQUEST' && !['UNAVAILABLE', 'CHECK_REQUIRED'].includes(item.status)), 'request'],
      ['방문정보', items.filter((item) => item.bookingType === 'INFORMATION_ONLY' || !item.bookingType), 'info'],
      ['확인 필요', items.filter((item) => ['UNAVAILABLE', 'CHECK_REQUIRED'].includes(item.status) || String(item.confidence).includes('REQUIRED')), 'check']
    ];
    bookingPlan.innerHTML = `
      <header class="booking-plan-head"><div><span class="page-eyebrow">BOOKING READINESS</span><h1>${escapeHtml(trip.title)}</h1><p>일정 항목을 예약 방식별로 분리합니다. 정보형 장소는 예약 완료로 표시하지 않습니다.</p></div><a class="ui-button" href="trips.html">내 여행</a></header>
      <section class="booking-readiness-kpis">${categories.map(([label, list, tone]) => `<article><span class="${tone}">${label}</span><strong>${list.length}</strong><small>항목</small></article>`).join('')}</section>
      ${categories.map(([label, list, tone]) => `<section class="booking-plan-group"><div class="content-section-head"><div><h2>${label}</h2><p>${tone === 'bookable' ? '재고를 다시 확인한 뒤 카트에 추가합니다.' : tone === 'request' ? '업체 확정 전에는 완료로 표시하지 않습니다.' : tone === 'info' ? '방문 정보이며 자동 예약 대상이 아닙니다.' : '운영시간·이동·재고를 확인해야 합니다.'}</p></div></div>${list.length ? list.map((item) => `<article><span>DAY ${item.day} · ${escapeHtml(item.time)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note || item.reason || '')}</small>${tone === 'bookable' ? `<button class="ui-button" type="button" data-plan-add data-item-id="${escapeHtml(item.id)}">카트에 추가</button>` : ''}</article>`).join('') : '<div class="empty-state"><strong>해당 항목이 없습니다.</strong></div>'}</section>`).join('')}
      <div class="booking-plan-action"><div><strong>여러 공급자의 예약은 각각 처리합니다.</strong><p>한 항목의 실패를 전체 성공으로 표시하지 않고 예약별 상태와 정산을 분리합니다.</p></div><a class="ui-button primary" href="cart.html">여행 카트 확인</a></div>`;

    bookingPlan.querySelectorAll('[data-plan-add]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((candidate) => candidate.id === button.dataset.itemId);
      const cart = api.list('trip-cart');
      api.upsert('trip-cart', {
        id: item.id,
        tripId: trip.id,
        title: item.title,
        day: item.day,
        time: item.time,
        bookingType: item.bookingType,
        status: 'SELECTED'
      });
      button.textContent = '추가 완료';
      button.disabled = true;
    }));
  });

  const hydrateEditor = async () => {
    if (route !== 'trip-editor.html') return false;
    const root = document.querySelector('[data-workflow-root]');
    const textareas = [...root?.querySelectorAll('textarea') || []];
    if (!root || !textareas.length || root.dataset.tripHydrated) return false;
    const tripId = new URLSearchParams(location.search).get('tripId');
    const trip = api.list('trips').find((item) => item.id === tripId);
    if (!trip) return false;
    root.dataset.tripHydrated = 'true';
    const byDay = (trip.items || []).reduce((groups, item) => {
      groups[item.day] ||= [];
      groups[item.day].push(item);
      return groups;
    }, {});
    textareas.forEach((textarea, index) => {
      textarea.value = (byDay[index + 1] || []).map((item) => `${item.time || '미정'} ${item.title}`).join('\n');
    });
    const title = root.querySelector('h1');
    if (title) title.textContent = trip.title;
    root.insertAdjacentHTML('afterbegin', `<div class="state-banner"><div><strong>${escapeHtml(trip.sourceType)}에서 만든 독립 일정입니다.</strong><p>아래 구조화 목록에서 장소를 삭제하거나 추천 대안으로 바꿀 수 있습니다. 원본 일정은 변경되지 않습니다.</p></div><a class="ui-button" href="trip-publish.html?tripId=${encodeURIComponent(trip.id)}">공유 설정</a></div><section class="trip-structured-editor" data-trip-structured-editor></section>`);
    const panel = root.querySelector('[data-trip-structured-editor]');
    const knowledge = await api.get('ai/travel-knowledge.json').catch(() => ({ destinations: [] }));
    const places = knowledge.destinations.flatMap((destination) => destination.landmarks);

    const renderItems = () => {
      const current = api.list('trips').find((item) => item.id === trip.id) || trip;
      panel.innerHTML = `<div class="content-section-head"><div><h2>구조화 일정 편집</h2><p>변경 내용은 trips JSON Mock 상태에 즉시 저장됩니다.</p></div><a class="ui-button" href="trip-booking-plan.html?tripId=${encodeURIComponent(current.id)}">예약 준비도 확인</a></div>${(current.items || []).map((item) => {
        const candidates = places.filter((place) => place.id !== item.sourceId).slice(0, 6);
        return `<article data-trip-item="${escapeHtml(item.id)}"><div><small>DAY ${item.day} · ${escapeHtml(item.time || '미정')} · ${escapeHtml(item.type || 'PLACE')}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.bookingStatus || 'NOT_BOOKED')}</span></div><div><select data-trip-replacement><option value="">다른 장소 선택</option>${candidates.map((place) => `<option value="${escapeHtml(place.id)}">${escapeHtml(place.name)} · ${escapeHtml(place.reason)}</option>`).join('')}</select><button class="ui-button" type="button" data-trip-replace>교체</button><button class="ui-button" type="button" data-trip-remove>삭제</button></div></article>`;
      }).join('') || '<div class="empty-state"><strong>일정 항목이 없습니다.</strong></div>'}`;
    };
    renderItems();
    panel.addEventListener('click', (event) => {
      const itemNode = event.target.closest('[data-trip-item]');
      if (!itemNode) return;
      const current = api.list('trips').find((item) => item.id === trip.id);
      const index = current.items.findIndex((item) => item.id === itemNode.dataset.tripItem);
      if (index < 0) return;
      if (event.target.closest('[data-trip-remove]')) {
        current.items.splice(index, 1);
        api.upsert('trips', current);
        api.appendAudit({ actor: session()?.user?.id, action: 'TRIP_ITEM_REMOVED', entityType: 'TRIP', entityId: current.id });
        renderItems();
      }
      if (event.target.closest('[data-trip-replace]')) {
        const select = itemNode.querySelector('[data-trip-replacement]');
        const place = places.find((candidate) => candidate.id === select.value);
        if (!place) {
          select.focus();
          return;
        }
        current.items[index] = {
          ...current.items[index],
          title: place.name,
          type: place.type,
          sourceId: place.id,
          bookingType: place.bookingType,
          confidence: place.confidence,
          reason: place.reason,
          alternatives: place.alternatives,
          bookingStatus: 'NOT_BOOKED'
        };
        api.upsert('trips', current);
        api.appendAudit({ actor: session()?.user?.id, action: 'TRIP_ITEM_REPLACED', entityType: 'TRIP', entityId: current.id, payload: { to: place.id } });
        renderItems();
      }
    });
    return true;
  };

  if (route === 'trip-editor.html') {
    hydrateEditor().then((done) => {
      if (done) return;
      const root = document.querySelector('[data-workflow-root]');
      if (!root) return;
      const observer = new MutationObserver(() => {
        hydrateEditor().then((hydrated) => { if (hydrated) observer.disconnect(); });
      });
      observer.observe(root, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 5000);
    });
  }
})();
