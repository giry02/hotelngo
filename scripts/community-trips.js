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

  const tripSnapshot = (trip) => trip ? {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    destinationId: trip.destinationId,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    duration: trip.duration,
    sourceType: trip.sourceType,
    sourceGuideId: trip.sourceGuideId || null,
    sourceGuideTitle: trip.sourceGuideTitle || null,
    sourceAuthor: trip.sourceAuthor || null,
    items: (trip.items || []).map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      type: item.type,
      category: item.category,
      day: item.day,
      time: item.time,
      title: item.title,
      area: item.area,
      image: item.image,
      duration: item.duration,
      priceLabel: item.priceLabel,
      bookingType: item.bookingType,
      status: item.status,
      note: item.note,
      lat: item.lat,
      lng: item.lng
    }))
  } : null;

  const icons = {
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    comment: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-3.9M8.7 13.3l6.6 3.9"/></svg>',
    route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c-2.2 0-4-1.8-4-4s1.8-4 4-4h12a4 4 0 0 0 0-8h-1"/><path d="m7 15-4 4 4 4M17 1l4 2-4 2"/></svg>'
  };
  const showToast = (message) => {
    const toast = document.querySelector('[data-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };
  const returnToLogin = () => {
    const returnUrl = `${route}${location.search}${location.hash}`;
    location.href = `login.html?returnUrl=${encodeURIComponent(returnUrl)}`;
  };
  const engagementId = (userId, tripId) => `${userId}_${tripId}`;
  const engagement = (tripId) => {
    const currentSession = session();
    if (!currentSession) return null;
    return api.list('community-engagements').find((item) => item.id === engagementId(currentSession.user.id, tripId)) || null;
  };
  const metrics = (trip, seedComments = []) => {
    const records = api.list('community-engagements').filter((item) => item.tripId === trip.id);
    const localComments = api.list('community-comments').filter((item) => item.tripId === trip.id);
    return {
      likes: Number(trip.likes || 0) + records.filter((item) => item.liked).length,
      comments: seedComments.filter((item) => item.tripId === trip.id).length + localComments.length,
      scraps: Number(trip.saves || 0) + records.filter((item) => item.scrapped).length,
      copies: Number(trip.copies || 0)
    };
  };
  const toggleEngagement = (tripId, field) => {
    const currentSession = session();
    if (!currentSession) {
      returnToLogin();
      return null;
    }
    const current = engagement(tripId) || { id: engagementId(currentSession.user.id, tripId), userId: currentSession.user.id, tripId, liked: false, scrapped: false };
    const next = api.upsert('community-engagements', { ...current, [field]: !current[field] });
    api.appendAudit({ actor: currentSession.user.id, action: `COMMUNITY_${field.toUpperCase()}_${next[field] ? 'ADDED' : 'REMOVED'}`, entityType: 'COMMUNITY_TRIP', entityId: tripId });
    return next;
  };
  const shareTrip = async (trip) => {
    const url = new URL(`trip-guide-detail.html?id=${encodeURIComponent(trip.id)}`, location.href).href;
    try {
      if (navigator.share) await navigator.share({ title: trip.title, text: trip.summary, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast('여행기 링크를 복사했습니다.');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') showToast('공유 링크를 복사하지 못했습니다.');
    }
  };
  const copyTrip = (source) => {
    const currentSession = session();
    if (!currentSession) {
      returnToLogin();
      return;
    }
    const trip = normalizeTrip(source);
    const copy = {
      id: `trip_copy_${Date.now()}`,
      ownerId: currentSession.user.id,
      title: `${trip.title} · 내 버전`,
      destination: trip.destination,
      destinationId: trip.destinationId,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers,
      duration: trip.duration,
      status: 'DRAFT',
      sourceType: 'COMMUNITY_COPY',
      sourceTripId: trip.id,
      sourceGuideId: trip.guideId || trip.id,
      sourceGuideTitle: trip.title,
      sourceAuthor: trip.author,
      sourcePublishedVersion: trip.publishedVersion || 1,
      items: trip.items.map((item) => ({ ...item, id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` })),
      updatedAt: new Date().toISOString()
    };
    api.upsert('trips', copy);
    api.appendAudit({ actor: currentSession.user.id, action: 'COMMUNITY_TRIP_COPIED', entityType: 'TRIP', entityId: copy.id, payload: { sourceTripId: trip.id } });
    location.href = `trip-planner.html?tripId=${encodeURIComponent(copy.id)}&copied=1`;
  };

  const creatorAvatar = (name = '여행자') => escapeHtml(name.trim().slice(0, 1) || '여');

  const feed = document.querySelector('[data-community-feed]');
  if (feed) catalog().then(({ trips, comments = [] }) => {
    const localStories = api.list('stories').filter((story) => ['PUBLISHED', 'PENDING_REVIEW'].includes(story.status)).map((story) => ({
      ...(story.tripSnapshot || {}),
      id: story.id,
      title: story.title,
      summary: story.summary,
      cover: story.cover,
      destination: story.destination,
      duration: story.duration || '일정 초안',
      tags: story.tags || [],
      author: { id: story.authorId, displayName: story.authorName, verifiedTrips: 0 },
      saves: story.saves || 0,
      copies: story.copies || 0,
      allowCopy: story.allowCopy !== false
    }));
    const allTrips = [...localStories, ...trips];
    let activeFilter = '추천';
    const renderFeed = (filter = activeFilter) => {
      activeFilter = filter;
      const visible = filter === '추천'
        ? allTrips
        : allTrips.filter((trip) => `${trip.destination} ${(trip.tags || []).join(' ')}`.includes(filter));
      feed.innerHTML = visible.length ? visible.map((trip) => {
        const state = engagement(trip.id) || {};
        const count = metrics(trip, comments);
        const dayCount = trip.days?.length || new Set((trip.items || []).map((item) => item.day)).size;
        return `
          <article class="community-card">
            <div class="community-card-author"><span class="creator-avatar">${creatorAvatar(trip.author?.displayName)}</span><span><strong>${escapeHtml(trip.author?.displayName || '회원 가이드')}</strong><small>공개 여행 ${trip.author?.verifiedTrips || 0}개</small></span></div>
            <a class="community-card-cover" href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}"><img src="${escapeHtml(trip.cover)}" alt="${escapeHtml(trip.title)}"><span>${dayCount || '?'}일 일정</span></a>
            <div class="community-card-body">
              <span class="page-eyebrow">${escapeHtml(trip.destination)} · ${escapeHtml(trip.duration)}</span>
              <h2><a href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}">${escapeHtml(trip.title)}</a></h2>
              <p>${escapeHtml(trip.summary)}</p>
              <div class="community-tags">${(trip.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
              <div class="community-card-actions" aria-label="여행기 반응">
                <button type="button" class="${state.liked ? 'is-active' : ''}" aria-pressed="${Boolean(state.liked)}" data-community-action="like" data-trip-id="${escapeHtml(trip.id)}">${icons.heart}<span>${count.likes.toLocaleString('ko-KR')}</span><b>좋아요</b></button>
                <a href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}#comments">${icons.comment}<span>${count.comments.toLocaleString('ko-KR')}</span><b>댓글</b></a>
                <button type="button" class="${state.scrapped ? 'is-active' : ''}" aria-pressed="${Boolean(state.scrapped)}" data-community-action="scrap" data-trip-id="${escapeHtml(trip.id)}">${icons.bookmark}<span>${count.scraps.toLocaleString('ko-KR')}</span><b>스크랩</b></button>
                <button type="button" data-community-action="share" data-trip-id="${escapeHtml(trip.id)}">${icons.share}<b>공유</b></button>
              </div>
              <div class="community-card-cta"><a class="ui-button" href="trip-guide-detail.html?id=${encodeURIComponent(trip.id)}">여행기 보기</a>${trip.allowCopy === false ? '' : `<button class="ui-button primary" type="button" data-community-action="copy" data-trip-id="${escapeHtml(trip.id)}">${icons.route}내 여행에 담기</button>`}</div>
            </div>
          </article>`;
      }).join('') : '<div class="empty-state"><strong>해당 주제의 공개 여행기가 아직 없습니다.</strong><p>첫 여행을 만들고 여행기로 공유해 보세요.</p></div>';
    };
    renderFeed();
    document.querySelector('.community-filter')?.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      document.querySelectorAll('.community-filter button').forEach((item) => item.classList.toggle('is-active', item === button));
      renderFeed(button.textContent.trim());
    });
    feed.addEventListener('click', (event) => {
      const control = event.target.closest('[data-community-action]');
      if (!control) return;
      const trip = allTrips.find((item) => item.id === control.dataset.tripId);
      if (!trip) return;
      if (control.dataset.communityAction === 'like') {
        if (toggleEngagement(trip.id, 'liked')) renderFeed();
      } else if (control.dataset.communityAction === 'scrap') {
        const next = toggleEngagement(trip.id, 'scrapped');
        if (next) {
          showToast(next.scrapped ? '여행기를 저장·찜에 스크랩했습니다.' : '스크랩을 해제했습니다.');
          renderFeed();
        }
      } else if (control.dataset.communityAction === 'share') shareTrip(trip);
      else if (control.dataset.communityAction === 'copy') copyTrip(trip);
    });
  });

  const detail = document.querySelector('[data-community-detail]');
  if (detail) catalog().then(({ trips, comments = [] }) => {
    const id = new URLSearchParams(location.search).get('id') || trips[0].id;
    const localStory = api.list('stories').find((story) => story.id === id);
    const catalogTrip = trips.find((item) => item.id === id);
    const sourceTrip = localStory?.tripSnapshot
      || (localStory?.tripTemplateId ? api.list('trips').find((item) => item.id === localStory.tripTemplateId) : null)
      || (localStory?.tripTemplateId ? trips.find((item) => item.id === localStory.tripTemplateId) : null);
    const localTrip = localStory ? {
      ...(sourceTrip || {}),
      id: localStory.id,
      guideId: localStory.id,
      title: localStory.title,
      summary: localStory.summary,
      cover: localStory.cover,
      destination: localStory.destination,
      duration: localStory.duration || sourceTrip?.duration || '일정 초안',
      tags: localStory.tags || [],
      author: { displayName: localStory.authorName || '회원 가이드', verifiedTrips: 0 },
      saves: localStory.saves || 0,
      copies: localStory.copies || 0,
      allowCopy: localStory.allowCopy !== false,
      publishedVersion: localStory.publishedVersion || 1
    } : null;
    const trip = normalizeTrip(localTrip || catalogTrip || trips[0]);
    const days = trip.days?.length ? trip.days : Object.values(trip.items.reduce((groups, item) => {
      groups[item.day] ||= { day: item.day, dateLabel: '', items: [] };
      groups[item.day].items.push(item);
      return groups;
    }, {}));
    const renderDetail = () => {
      const state = engagement(trip.id) || {};
      const count = metrics(trip, comments);
      const localComments = api.list('community-comments').filter((item) => item.tripId === trip.id);
      const tripComments = [...comments.filter((item) => item.tripId === trip.id), ...localComments]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const currentSession = session();
      const followId = currentSession ? `${currentSession.user.id}_${trip.author?.id || trip.id}` : '';
      const following = Boolean(followId && api.list('community-follows').find((item) => item.id === followId)?.following);
      detail.innerHTML = `
        <header class="community-detail-hero">
          <img src="${escapeHtml(trip.cover)}" alt="${escapeHtml(trip.title)}">
          <div>
            <span class="page-eyebrow">${escapeHtml(trip.destination)} · TRAVEL STORY</span>
            <h1>${escapeHtml(trip.title)}</h1>
            <p>${escapeHtml(trip.summary)}</p>
            <div class="creator-line"><span class="creator-avatar">${creatorAvatar(trip.author?.displayName)}</span><span><strong>${escapeHtml(trip.author?.displayName || '회원 가이드')}</strong><small>공개 여행 ${trip.author?.verifiedTrips || 0}개</small></span><button type="button" class="creator-follow ${following ? 'is-active' : ''}" data-community-action="follow" aria-pressed="${following}">${following ? '팔로잉' : '팔로우'}</button></div>
            ${trip.sourceGuideId ? `<div class="guide-attribution"><span>원본 여행기 기반</span><a href="trip-guide-detail.html?id=${encodeURIComponent(trip.sourceGuideId)}">${escapeHtml(trip.sourceGuideTitle || '원본 일정')} 보기</a></div>` : ''}
            <div class="community-tags">${(trip.tags || []).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
            <div class="community-detail-actions" aria-label="여행기 반응">
              <button type="button" class="${state.liked ? 'is-active' : ''}" data-community-action="like" aria-pressed="${Boolean(state.liked)}">${icons.heart}<span>좋아요</span><b>${count.likes.toLocaleString('ko-KR')}</b></button>
              <a href="#comments">${icons.comment}<span>댓글</span><b>${count.comments.toLocaleString('ko-KR')}</b></a>
              <button type="button" class="${state.scrapped ? 'is-active' : ''}" data-community-action="scrap" aria-pressed="${Boolean(state.scrapped)}">${icons.bookmark}<span>스크랩</span><b>${count.scraps.toLocaleString('ko-KR')}</b></button>
              <button type="button" data-community-action="share">${icons.share}<span>공유</span></button>
            </div>
            <div class="page-head-actions">${trip.allowCopy === false ? '<span class="guide-copy-note">작성자가 일정 복사를 허용하지 않았습니다.</span>' : `<button class="ui-button primary" type="button" data-community-action="copy">${icons.route}이 일정 내 여행에 담기</button>`}</div>
          </div>
        </header>
        <div class="community-detail-layout">
          <section>
            <div class="content-section-head"><div><h2>날짜별 일정</h2><p>내 여행에 담은 뒤 날짜·인원·장소를 내 방식대로 바꿀 수 있습니다.</p></div></div>
            ${days.length ? days.map((day) => `<article class="community-day"><header><strong>DAY ${day.day}</strong><span>${escapeHtml(day.dateLabel || '')}</span></header><div>${(day.items || []).map((item) => {
              const [label, tone] = statusLabel(item);
              return `<div class="community-stop"><time>${escapeHtml(item.time)}</time><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.note || '')}</small></span><em class="${tone}">${label}</em></div>`;
            }).join('')}</div></article>`).join('') : '<div class="empty-state"><strong>작성자가 세부 일정을 정리하고 있습니다.</strong></div>'}
          </section>
          <aside class="community-side">
            <strong>내 여행에 담으면</strong>
            <ol><li>원본과 별개인 내 일정으로 복사</li><li>날짜·인원·장소 자유롭게 변경</li><li>운영시간·이동·재고 다시 확인</li><li>예약 항목은 별도 선택 후 결제</li></ol>
            <p>수정해도 원본 여행기는 바뀌지 않으며, 다시 공유할 때 원작자 출처가 표시됩니다.</p>
            <a class="ui-button" href="community.html">다른 여행기 보기</a>
          </aside>
        </div>
        <section class="community-comments" id="comments">
          <div class="content-section-head"><div><h2>댓글 ${count.comments.toLocaleString('ko-KR')}</h2><p>직접 다녀온 팁과 궁금한 점을 나눠보세요.</p></div></div>
          <form class="community-comment-form" data-comment-form><span class="creator-avatar">${creatorAvatar(currentSession?.user?.displayName || '게스트')}</span><label><span class="sr-only">댓글 내용</span><textarea name="comment" maxlength="300" required placeholder="${currentSession ? '여행자에게 도움이 될 댓글을 남겨보세요.' : '로그인 후 댓글을 남길 수 있습니다.'}" ${currentSession ? '' : 'readonly'}></textarea></label><button class="ui-button primary" type="submit">등록</button></form>
          <div class="community-comment-list">${tripComments.length ? tripComments.map((comment) => `<article><span class="creator-avatar">${creatorAvatar(comment.authorName)}</span><div><header><strong>${escapeHtml(comment.authorName)}</strong><time>${escapeHtml(comment.createdLabel || new Date(comment.createdAt).toLocaleDateString('ko-KR'))}</time></header><p>${escapeHtml(comment.body)}</p></div></article>`).join('') : '<div class="empty-state"><strong>첫 댓글을 남겨보세요.</strong><p>일정에 대한 질문과 실제 방문 팁이 여행기를 더 풍부하게 만듭니다.</p></div>'}</div>
        </section>`;
    };
    renderDetail();
    detail.addEventListener('click', (event) => {
      const control = event.target.closest('[data-community-action]');
      if (!control) return;
      const action = control.dataset.communityAction;
      if (action === 'like') {
        if (toggleEngagement(trip.id, 'liked')) renderDetail();
      } else if (action === 'scrap') {
        const next = toggleEngagement(trip.id, 'scrapped');
        if (next) {
          showToast(next.scrapped ? '여행기를 저장·찜에 스크랩했습니다.' : '스크랩을 해제했습니다.');
          renderDetail();
        }
      } else if (action === 'share') shareTrip(trip);
      else if (action === 'copy') copyTrip(trip);
      else if (action === 'follow') {
        const currentSession = session();
        if (!currentSession) returnToLogin();
        else {
          const id = `${currentSession.user.id}_${trip.author?.id || trip.id}`;
          const current = api.list('community-follows').find((item) => item.id === id);
          api.upsert('community-follows', { id, userId: currentSession.user.id, authorId: trip.author?.id || trip.id, following: !current?.following });
          renderDetail();
        }
      }
    });
    detail.addEventListener('submit', (event) => {
      const form = event.target.closest('[data-comment-form]');
      if (!form) return;
      event.preventDefault();
      const currentSession = session();
      if (!currentSession) {
        returnToLogin();
        return;
      }
      const body = String(new FormData(form).get('comment') || '').trim();
      if (!body) return;
      api.upsert('community-comments', { id: `comment_${Date.now()}`, tripId: trip.id, userId: currentSession.user.id, authorName: currentSession.user.displayName, body, createdAt: new Date().toISOString() });
      api.appendAudit({ actor: currentSession.user.id, action: 'COMMUNITY_COMMENT_CREATED', entityType: 'COMMUNITY_TRIP', entityId: trip.id });
      renderDetail();
      document.querySelector('#comments')?.scrollIntoView({ block: 'start' });
      showToast('댓글을 등록했습니다.');
    });
  });

  const publishForm = document.querySelector('[data-trip-publish-form]');
  if (publishForm) {
    const tripId = new URLSearchParams(location.search).get('tripId');
    const sourceTrip = api.list('trips').find((item) => item.id === tripId);
    if (sourceTrip) {
      const titleDuration = String(sourceTrip.title || '').match(/\d+박\s*\d+일/)?.[0] || '';
      publishForm.elements.title.value = sourceTrip.title;
      publishForm.elements.summary.value = `${sourceTrip.destination}에서 날짜별로 만든 ${sourceTrip.items?.length || 0}개 장소의 여행 가이드입니다. 복사한 뒤 숙소와 식사, 활동을 자유롭게 바꿀 수 있습니다.`;
      publishForm.elements.destination.value = sourceTrip.destination || '';
      publishForm.elements.duration.value = sourceTrip.duration || titleDuration || '기간 미정';
      publishForm.elements.companions.value = sourceTrip.travelers || '인원 미정';
      publishForm.elements.tags.value = `${sourceTrip.destination || ''}, 일정가이드, ${sourceTrip.items?.some((item) => item.category === 'GOLF') ? '골프,' : ''} 자유편집`;
      const covers = [...new Set((sourceTrip.items || []).map((item) => item.image).filter(Boolean))];
      if (!covers.length) covers.push('assets/images/landmark-kyoto.jpg');
      const coverInput = publishForm.elements.cover;
      const coverPreview = publishForm.querySelector('[data-publish-cover-preview]');
      const coverOptions = publishForm.querySelector('[data-publish-cover-options]');
      const selectCover = (cover) => {
        coverInput.value = cover;
        if (coverPreview) coverPreview.src = cover;
        coverOptions?.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.cover === cover));
      };
      if (coverOptions) {
        coverOptions.innerHTML = covers.slice(0, 6).map((cover, index) => `<button type="button" data-cover="${escapeHtml(cover)}" aria-label="대표 이미지 ${index + 1}"><img src="${escapeHtml(cover)}" alt=""></button>`).join('');
        coverOptions.addEventListener('click', (event) => {
          const button = event.target.closest('[data-cover]');
          if (button) selectCover(button.dataset.cover);
        });
      }
      selectCover(covers[0]);
    }
  }

  const renderPublishPreview = () => {
    if (!publishForm) return;
    const preview = document.querySelector('[data-publish-preview]');
    if (!preview) return;
    const values = Object.fromEntries(new FormData(publishForm).entries());
    preview.hidden = false;
    preview.innerHTML = `<img src="${escapeHtml(values.cover || 'assets/images/landmark-kyoto.jpg')}" alt=""><span>${escapeHtml(values.destination || '여행지')} · 가이드 미리보기</span><strong>${escapeHtml(values.title || '가이드 제목')}</strong><p>${escapeHtml(values.summary || '한 줄 소개를 입력해 주세요.')}</p><div>${String(values.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => `<em>#${escapeHtml(tag)}</em>`).join('')}</div>`;
    preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  document.querySelector('[data-preview-guide]')?.addEventListener('click', renderPublishPreview);

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
      tripSnapshot: tripSnapshot(api.list('trips').find((item) => item.id === tripId)),
      allowCopy: values.allowCopy === 'on',
      publishedVersion: 1,
      publishedAt: new Date().toISOString()
    });
    api.appendAudit({ actor: story.authorId, action: 'STORY_PUBLISH_REQUESTED', entityType: 'STORY', entityId: story.id, payload: { visibility: story.visibility } });
    const result = document.querySelector('[data-publish-result]');
    if (result) {
      result.hidden = false;
      result.innerHTML = `<strong>${story.status === 'PENDING_REVIEW' ? '가이드 공개 검수를 요청했습니다.' : '링크로 공유할 가이드를 만들었습니다.'}</strong><p>발행 당시 일정이 별도 버전으로 저장되었으며, 예약번호와 여권 정보는 공개 데이터에 포함하지 않습니다.</p><a class="ui-button primary" href="trip-guide-detail.html?id=${encodeURIComponent(story.id)}">발행 결과 보기</a>`;
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
      <div class="booking-plan-action"><div><strong>여러 공급자의 예약은 각각 처리합니다.</strong><p>한 항목의 실패를 전체 성공으로 표시하지 않고 예약별 상태와 정산을 분리합니다.</p></div><a class="ui-button primary" href="booking-cart.html">예약 카트 확인</a></div>`;

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
      panel.innerHTML = `<div class="content-section-head"><div><h2>장소별 일정 편집</h2><p>변경 내용은 내 여행에 즉시 저장됩니다.</p></div><a class="ui-button" href="trip-booking-plan.html?tripId=${encodeURIComponent(current.id)}">예약할 서비스 선택</a></div>${(current.items || []).map((item) => {
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
