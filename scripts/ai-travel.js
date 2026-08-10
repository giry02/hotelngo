(() => {
  const prompt = document.querySelector('[data-ai-prompt]');
  const output = document.querySelector('[data-ai-output]');
  const generateButton = document.querySelector('[data-ai-generate]');
  if (!prompt || !output || !generateButton) return;

  const api = window.HotelNGoMockAPI;
  const session = () => window.HotelNGoAuth?.getSession?.() || null;
  let knowledge;
  let currentPlan;
  let generationOffset = 0;
  let selectedDestinationId = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const detectDestination = (text) => {
    const normalized = text.toLowerCase();
    const explicit = knowledge.destinations.find((destination) =>
      [destination.name, ...(destination.aliases || [])].some((name) => normalized.includes(String(name).toLowerCase()))
    );
    return explicit || knowledge.destinations.find((destination) => destination.id === selectedDestinationId) || null;
  };

  const detectPreferences = (text) => {
    const keywordMap = {
      감성: ['감성', '분위기'],
      골목: ['골목', '로컬'],
      야경: ['야경', '밤'],
      사진: ['사진', '인생샷'],
      미식: ['미식', '맛집', '음식', '먹'],
      바다: ['바다', '해변', '비치'],
      휴양: ['휴양', '쉬', '여유'],
      가족: ['가족', '아이'],
      자연: ['자연', '숲'],
      시장: ['시장', '야시장'],
      가이드: ['가이드', '투어'],
      데이트: ['데이트', '커플'],
      혼자: ['혼자', '나홀로']
    };
    return Object.entries(keywordMap)
      .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
      .map(([keyword]) => keyword);
  };

  const confidenceLabel = (confidence) => ({
    CATALOG_VERIFIED: '카탈로그 확인',
    HOURS_CHECK_REQUIRED: '운영시간 재확인',
    TRANSPORT_CHECK_REQUIRED: '이동시간 재확인',
    INVENTORY_CHECK_REQUIRED: '재고 재확인'
  }[confidence] || '확인 필요');

  const bookingLabel = (bookingType) => ({
    INSTANT: '즉시예약 후보',
    REQUEST: '요청예약 후보',
    INFORMATION_ONLY: '방문정보'
  }[bookingType] || '확인 필요');

  const formatDate = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const hotelSearchHref = () => {
    const params = new URLSearchParams({ destination: currentPlan.destination });
    if (/오늘/.test(prompt.value)) {
      const checkIn = new Date();
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + Math.max(1, currentPlan.days.length - 1));
      params.set('checkIn', formatDate(checkIn));
      params.set('checkOut', formatDate(checkOut));
    }
    return `hotels.html?${params.toString()}`;
  };

  const openFullTripPlanner = (destination) => {
    const text = prompt.value.trim();
    const durationMatch = text.match(/(\d+)\s*박/);
    const nights = Math.min(10, Math.max(2, Number(durationMatch?.[1] || 4)));
    const params = new URLSearchParams({
      destination: destination.name,
      nights: String(nights),
      source: 'ai',
      pace: document.querySelector('[name="pace"]')?.value || 'BALANCED',
      prompt: text
    });
    if (/오늘/.test(text)) {
      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + nights);
      params.set('startDate', formatDate(start));
      params.set('endDate', formatDate(end));
    }
    location.href = `trip-create.html?${params.toString()}`;
  };

  const supportsFullTripPlanner = (destination) =>
    ['다낭', '방콕', '발리'].includes(destination?.name);

  const buildPlan = (destination) => {
    const text = prompt.value.trim();
    const preferences = detectPreferences(text);
    const selectedPace = document.querySelector('[name="pace"]')?.value || 'BALANCED';
    const pace = /여유|빡빡하지|무리 없|많이 걷지|천천히/.test(text) ? 'RELAXED' : selectedPace;
    const budget = document.querySelector('[name="budget"]')?.value || 'STANDARD';
    const stopsPerDay = pace === 'RELAXED' ? 1 : pace === 'ACTIVE' ? 3 : 2;
    const ranked = destination.landmarks
      .map((place) => ({
        ...place,
        rankScore: place.score + place.tags.filter((tag) => preferences.includes(tag)).length * 7
      }))
      .sort((a, b) => b.rankScore - a.rankScore);
    const rotated = [...ranked.slice(generationOffset), ...ranked.slice(0, generationOffset)];
    const durationMatch = text.match(/(\d+)\s*박/);
    const nights = Math.min(5, Math.max(2, Number(durationMatch?.[1] || 3)));
    const dayCount = nights + 1;
    const startsToday = /오늘/.test(text);
    const days = Array.from({ length: dayCount }, (_, dayIndex) => {
      if (startsToday && dayIndex === 0) {
        return { day: 1, items: [], note: '당일 출발 항공편과 현지 도착시간을 확인한 뒤 체크인 중심으로 구성합니다.' };
      }
      const start = (dayIndex - (startsToday ? 1 : 0)) * stopsPerDay;
      const items = rotated.slice(start, start + stopsPerDay);
      return { day: dayIndex + 1, items };
    });
    return {
      id: `ai_plan_${Date.now()}`,
      title: `${destination.name} ${nights}박 ${dayCount}일 · 취향 기반 여행 초안`,
      destination: destination.name,
      pace,
      budget,
      preferences,
      days,
      sourceType: 'AI_RULE_RANKER',
      modelMode: 'RULE_BASED_MOCK',
      createdAt: new Date().toISOString()
    };
  };

  const alternativeOptions = (destination, place, excludedIds = []) => {
    const byId = new Map(destination.landmarks.map((item) => [item.id, item]));
    return (place.alternatives || []).map((id) => byId.get(id)).filter((item) => item && !excludedIds.includes(item.id));
  };

  const destinationMatchScore = (destination, preferences) => destination.landmarks.reduce((score, place) =>
    score + place.tags.filter((tag) => preferences.includes(tag)).length, 0);

  const renderDestinationChoices = () => {
    const text = prompt.value.trim();
    const preferences = detectPreferences(text);
    const southeastAsiaIntent = /동남아|베트남|태국|인도네시아/.test(text);
    const choices = knowledge.destinations
      .filter((destination) => !southeastAsiaIntent || destination.region === 'SOUTHEAST_ASIA')
      .map((destination) => ({ ...destination, matchScore: destinationMatchScore(destination, preferences) }))
      .sort((a, b) => b.matchScore - a.matchScore || b.landmarks[0].score - a.landmarks[0].score)
      .slice(0, 3);
    output.classList.remove('ai-result-empty');
    output.innerHTML = `
      <div class="ai-result-head">
        <div><span class="page-eyebrow">STEP 1 · DESTINATION</span><h2>먼저 여행 도시를 골라볼까요?</h2><p>입력한 취향과 여행 속도에 맞는 ${southeastAsiaIntent ? '동남아 ' : ''}도시를 비교했어요.</p></div>
      </div>
      ${/오늘/.test(text) ? '<div class="supplier-notice ai-urgent-notice"><strong>오늘 출발을 원하시나요?</strong> 항공 좌석·입국 조건·당일 숙소 재고는 실시간 확인이 필요합니다. 지금은 도시와 일정 후보를 먼저 만들고 예약 단계에서 다시 확인합니다.</div>' : ''}
      <div class="ai-destination-grid">
        ${choices.map((destination) => {
          const matchedTags = [...new Set(destination.landmarks.flatMap((place) => place.tags).filter((tag) => preferences.includes(tag)))];
          return `<article class="ai-destination-card">
            <img src="${escapeHtml(destination.cover)}" alt="${escapeHtml(destination.name)} 여행 이미지">
            <div><small>${escapeHtml(destination.country)} · ${destination.landmarks.length}개 장소 데이터</small><strong>${escapeHtml(destination.name)}</strong><p>${escapeHtml(destination.intro)}</p><span>${escapeHtml(matchedTags.length ? `${matchedTags.join(' · ')} 취향과 잘 맞아요` : '대표 장소 중심으로 비교해 보세요')}</span><button class="ui-button primary" type="button" data-ai-destination="${escapeHtml(destination.id)}">이 도시로 일정 만들기</button></div>
          </article>`;
        }).join('')}
      </div>
      <div class="ai-choice-help"><strong>아직 고르기 어렵다면</strong><span>바다는 다낭, 늦은 밤의 미식은 방콕, 자연 속 휴식은 발리를 먼저 비교해 보세요. 선택 후에도 장소를 바꿀 수 있습니다.</span></div>`;
    output.hidden = false;
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const render = () => {
    const destination = detectDestination(prompt.value.trim());
    if (!destination) {
      currentPlan = null;
      renderDestinationChoices();
      return;
    }
    currentPlan = buildPlan(destination);
    output.classList.remove('ai-result-empty');
    output.innerHTML = `
      <div class="ai-result-head">
        <div>
          <span class="page-eyebrow">STEP 2 · ITINERARY</span>
          <h2>${escapeHtml(currentPlan.title)}</h2>
          <p>${escapeHtml(currentPlan.preferences.join(' · ') || '기본 추천')} · ${escapeHtml(currentPlan.pace)} · ${escapeHtml(currentPlan.budget)}</p>
        </div>
        <button class="ui-button" type="button" data-ai-change-destination>도시 다시 고르기</button>
      </div>
      <div class="ai-plan-explanation">
        <strong>이렇게 구성했어요</strong>
        <p>입력한 취향과 여행 속도를 반영하고 같은 장소는 한 번만 넣었습니다. 장소가 없는 날은 이동과 휴식을 위한 여유 일정으로 남겨두었습니다.</p>
      </div>
      ${/오늘/.test(prompt.value) ? '<div class="supplier-notice ai-urgent-notice"><strong>당일 출발 확인 필요:</strong> 항공·입국 조건·당일 객실 재고는 현재 실시간 연결 전입니다. 예약 전 반드시 다시 확인합니다.</div>' : ''}
      ${currentPlan.days.map((day) => `
        <article class="ai-day">
          <div class="ai-day-label"><strong>DAY ${day.day}</strong><span>${day.items.length ? `추천 ${day.items.length}곳` : '여유 일정'}</span></div>
          <div class="ai-stops">
            ${day.items.length ? day.items.map((place, stopIndex) => {
              const alternatives = alternativeOptions(destination, place, day.items.filter((item) => item.id !== place.id).map((item) => item.id));
              return `<div class="ai-stop ai-stop-rich" data-ai-stop data-day="${day.day}" data-index="${stopIndex}" data-place-id="${escapeHtml(place.id)}">
                <time>${escapeHtml(place.bestTime)}</time>
                <span>
                  <strong>${escapeHtml(place.name)}</strong>
                  <small>${escapeHtml(place.reason)}</small>
                  <span class="ai-stop-meta"><i>${bookingLabel(place.bookingType)}</i><i>${confidenceLabel(place.confidence)}</i><i>추천 ${place.rankScore}점</i></span>
                </span>
                <em>${escapeHtml(place.type)}</em>
                <div class="ai-alternative">
                  <label>
                    <span>다른 곳으로 변경</span>
                    <select data-ai-alternative>
                      <option value="">대안을 선택하세요</option>
                      ${alternatives.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.reason)}</option>`).join('')}
                    </select>
                  </label>
                  <button class="ui-button" type="button" data-ai-replace>선택한 곳으로 교체</button>
                </div>
              </div>`;
            }).join('') : `<div class="ai-day-empty"><strong>${day.day === 1 && /오늘/.test(prompt.value) ? '출발·도착 및 체크인' : '숙소와 이동을 위한 여유 시간'}</strong><span>${escapeHtml(day.note || '체크인·공항 이동시간을 확인한 뒤 가까운 장소를 추가할 수 있어요.')}</span></div>`}
          </div>
        </article>
      `).join('')}
      <div class="supplier-notice"><strong>확정 전 재검증:</strong> ${escapeHtml(knowledge.dataPolicy.safeResultPolicy)}</div>
      <div class="ai-evidence">
        <strong>데이터 사용</strong>
        <span>장소·태그 JSON</span><span>규칙 점수화</span><span>예약 가능성 분리</span><span>${escapeHtml(knowledge.plannerVersion)}</span>
      </div>
      <section class="ai-booking-next" aria-label="여행 준비 다음 단계">
        <div><span class="page-eyebrow">STEP 3 · CHECK & BOOK</span><h3>이제 실제 이동과 숙소를 확인하세요</h3><p>일정 후보와 예약 가능한 상품은 분리되어 있습니다. 특히 오늘 출발은 아래 순서로 실시간 가능 여부를 확인해야 합니다.</p></div>
        <ol>
          <li><span>1</span><div><strong>항공편 확인</strong><small>출발 가능 시간과 도착 시각부터 확인</small></div><a class="ui-button" href="flights.html?destination=${encodeURIComponent(currentPlan.destination)}${/오늘/.test(prompt.value) ? '&depart=today' : ''}">항공 보기</a></li>
          <li><span>2</span><div><strong>숙소·당일 재고 확인</strong><small>도착 시각에 맞는 체크인과 객실 비교</small></div><a class="ui-button" href="${hotelSearchHref()}">호텔 보기</a></li>
          <li><span>3</span><div><strong>현지 이동·즐길거리</strong><small>공항 픽업과 장소별 예약 가능성 확인</small></div><a class="ui-button" href="places.html?destination=${encodeURIComponent(currentPlan.destination)}">현지 상품 보기</a></li>
        </ol>
      </section>
      <div class="page-head-actions">
        <button class="ui-button primary" type="button" data-ai-copy>내 여행에 독립 사본 만들기</button>
        <button class="ui-button" type="button" data-ai-regenerate>다른 조합 보기</button>
      </div>`;
    output.hidden = false;
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const replacePlace = (button) => {
    const stop = button.closest('[data-ai-stop]');
    const select = stop?.querySelector('[data-ai-alternative]');
    const alternativeId = select?.value;
    if (!alternativeId) {
      select?.focus();
      return;
    }
    const destination = knowledge.destinations.find((item) => item.name === currentPlan.destination);
    const alternative = destination?.landmarks.find((item) => item.id === alternativeId);
    if (!alternative) return;
    const day = currentPlan.days.find((item) => item.day === Number(stop.dataset.day));
    const index = Number(stop.dataset.index);
    day.items[index] = {
      ...alternative,
      rankScore: alternative.score + alternative.tags.filter((tag) => currentPlan.preferences.includes(tag)).length * 7
    };
    api.appendAudit({
      actor: session()?.user?.id || 'GUEST',
      action: 'AI_ITINERARY_PLACE_REPLACED',
      entityType: 'AI_PLAN',
      entityId: currentPlan.id,
      payload: { day: day.day, from: stop.dataset.placeId, to: alternative.id }
    });
    stop.dataset.placeId = alternative.id;
    stop.querySelector('time').textContent = alternative.bestTime;
    stop.querySelector('span > strong').textContent = alternative.name;
    stop.querySelector('span > small').textContent = alternative.reason;
    stop.querySelector('em').textContent = alternative.type;
    stop.querySelector('.ai-stop-meta').innerHTML = `<i>${bookingLabel(alternative.bookingType)}</i><i>${confidenceLabel(alternative.confidence)}</i><i>추천 ${day.items[index].rankScore}점</i>`;
    const options = alternativeOptions(destination, alternative, day.items.filter((item) => item.id !== alternative.id).map((item) => item.id));
    select.innerHTML = `<option value="">대안을 선택하세요</option>${options.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.reason)}</option>`).join('')}`;
  };

  const copyPlan = async (button) => {
    if (!session()) {
      location.href = `login.html?returnUrl=${encodeURIComponent('ai-travel.html#planner-result')}`;
      return;
    }
    const trip = {
      id: `trip_ai_${Date.now()}`,
      ownerId: session().user.id,
      title: currentPlan.title,
      destination: currentPlan.destination,
      status: 'DRAFT',
      sourceType: 'AI_RULE_RANKER',
      sourcePlanId: currentPlan.id,
      preferences: currentPlan.preferences,
      items: currentPlan.days.flatMap((day) => day.items.map((place) => ({
        id: `trip_item_${day.day}_${place.id}`,
        day: day.day,
        time: place.bestTime,
        type: place.type,
        title: place.name,
        sourceId: place.id,
        bookingType: place.bookingType,
        bookingStatus: 'NOT_BOOKED',
        confidence: place.confidence,
        reason: place.reason,
        alternatives: place.alternatives
      }))),
      updatedAt: new Date().toISOString()
    };
    api.upsert('trips', trip);
    api.appendAudit({
      actor: session().user.id,
      action: 'AI_PLAN_COPIED_TO_TRIP',
      entityType: 'TRIP',
      entityId: trip.id,
      payload: { sourcePlanId: currentPlan.id, itemCount: trip.items.length }
    });
    button.textContent = '내 여행에 저장됨';
    button.disabled = true;
    setTimeout(() => { location.href = `trip-editor.html?tripId=${encodeURIComponent(trip.id)}&source=ai`; }, 350);
  };

  const initialize = async () => {
    knowledge = await api.get('ai/travel-knowledge.json');
    const version = document.querySelector('[data-ai-version]');
    if (version) version.textContent = `${knowledge.plannerVersion} · 여행 조건 기반 일정 설계`;
    const promptFromQuery = new URLSearchParams(location.search).get('prompt');
    if (promptFromQuery) prompt.value = promptFromQuery;
  };

  generateButton.addEventListener('click', () => {
    if (!prompt.value.trim()) {
      prompt.focus();
      prompt.setAttribute('aria-invalid', 'true');
      return;
    }
    prompt.removeAttribute('aria-invalid');
    selectedDestinationId = null;
    const explicitDestination = detectDestination(prompt.value.trim());
    if (supportsFullTripPlanner(explicitDestination)) {
      openFullTripPlanner(explicitDestination);
      return;
    }
    render();
  });

  document.querySelectorAll('[data-prompt-example]').forEach((button) => {
    button.addEventListener('click', () => {
      prompt.value = button.dataset.promptExample || '';
      prompt.focus();
    });
  });

  output.addEventListener('click', (event) => {
    const destinationButton = event.target.closest('[data-ai-destination]');
    if (destinationButton) {
      const destination = knowledge.destinations.find((item) => item.id === destinationButton.dataset.aiDestination);
      if (supportsFullTripPlanner(destination)) {
        openFullTripPlanner(destination);
        return;
      }
      selectedDestinationId = destinationButton.dataset.aiDestination;
      render();
      return;
    }
    const changeDestinationButton = event.target.closest('[data-ai-change-destination]');
    if (changeDestinationButton) {
      selectedDestinationId = null;
      renderDestinationChoices();
      return;
    }
    const replaceButton = event.target.closest('[data-ai-replace]');
    if (replaceButton) replacePlace(replaceButton);
    const regenerateButton = event.target.closest('[data-ai-regenerate]');
    if (regenerateButton) {
      const destination = detectDestination(prompt.value);
      if (!destination) {
        renderDestinationChoices();
        return;
      }
      generationOffset = (generationOffset + 1) % destination.landmarks.length;
      render();
    }
    const copyButton = event.target.closest('[data-ai-copy]');
    if (copyButton) copyPlan(copyButton);
  });

  initialize().catch(() => {
    generateButton.disabled = true;
    output.innerHTML = '<div class="empty-state"><strong>AI 여행 지식 JSON을 불러오지 못했습니다.</strong><p>로컬 서버 또는 GitHub Pages에서 다시 열어 주세요.</p></div>';
  });
})();
