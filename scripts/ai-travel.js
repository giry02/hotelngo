(() => {
  const prompt = document.querySelector('[data-ai-prompt]');
  const output = document.querySelector('[data-ai-output]');
  const generateButton = document.querySelector('[data-ai-generate]');
  if (!prompt || !output || !generateButton) return;

  const api = window.HotelNGoMockAPI;
  const session = () => window.HotelNGoAuth?.getSession?.() || null;
  let knowledge;
  let plannerCatalog;
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
  const addDays = (value, days) => {
    const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date;
  };
  const selectedNights = () => Math.min(10, Math.max(2, Number(document.querySelector('[name="nights"]')?.value || 4)));
  const selectedStartDate = () => document.querySelector('[name="startDate"]')?.value || formatDate(addDays(new Date(), 30));
  const selectedTravelers = () => document.querySelector('[name="travelers"]')?.value || '성인 2명';
  const paceLabel = (value) => ({ RELAXED: '여유롭게', BALANCED: '균형 있게', ACTIVE: '촘촘하게' }[value] || '균형 있게');
  const budgetLabel = (value) => ({ VALUE: '실속', STANDARD: '보통', PREMIUM: '프리미엄' }[value] || '보통');
  const plannerDestinationFor = (destination) => plannerCatalog?.destinations?.find((item) => item.name === destination?.name) || null;
  const compactId = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const plannerItemFor = (destination, place, usedIds = new Set()) => {
    const plannerDestination = plannerDestinationFor(destination);
    if (!plannerDestination) return null;
    const candidates = plannerDestination.items.filter((item) => !usedIds.has(item.id));
    const sourceId = place.sourceId || place.id;
    const exactId = candidates.find((item) => compactId(item.id) === compactId(sourceId));
    if (exactId) return exactId;
    const nameKey = compactId(place.name || place.title);
    const nameMatch = candidates.find((item) => {
      const itemKey = compactId(item.title);
      return itemKey.includes(nameKey) || nameKey.includes(itemKey);
    });
    if (nameMatch) return nameMatch;
    const category = place.type === 'HOTEL' ? 'STAY' : place.type;
    return candidates.find((item) => item.category === category) || null;
  };
  const requestedServiceCategories = (text) => [
    [/숙소|호텔|리조트/, 'STAY'],
    [/공항|픽업|차량|이동/, 'TRANSPORT'],
    [/맛집|식사|음식|미식|카페/, 'FOOD'],
    [/골프/, 'GOLF'],
    [/마사지|스파/, 'SPA']
  ].filter(([pattern]) => pattern.test(text)).map(([, category]) => category);
  const addRequestedServices = (plan, destination, text) => {
    const plannerDestination = plannerDestinationFor(destination);
    if (!plannerDestination) return plan;
    const dayFor = { TRANSPORT: 1, STAY: 1, FOOD: Math.min(2, plan.days.length), GOLF: Math.min(3, plan.days.length), SPA: Math.min(3, plan.days.length) };
    const timeFor = { TRANSPORT: '12:00', STAY: '15:00', FOOD: '18:30', GOLF: '08:00', SPA: '18:30' };
    requestedServiceCategories(text).forEach((category) => {
      const source = plannerDestination.items.find((item) => item.category === category);
      if (!source || plan.days.some((day) => day.items.some((item) => (item.sourceId || item.id) === source.id))) return;
      const day = plan.days.find((item) => item.day === dayFor[category]) || plan.days[0];
      day.items.push({
        id: source.id,
        sourceId: source.id,
        name: source.title,
        type: source.category,
        tags: [category],
        score: 86,
        rankScore: 86,
        estimatedMinutes: Number(source.duration || 60),
        bestTime: source.recommendedTime || timeFor[category],
        bookingType: source.bookingType || 'INFORMATION_ONLY',
        confidence: source.status === 'AVAILABLE' ? 'CATALOG_VERIFIED' : 'INVENTORY_CHECK_REQUIRED',
        reason: source.description || '요청한 여행 조건에 맞춰 일정에 포함했습니다.',
        alternatives: []
      });
      day.items.sort((a, b) => String(a.bestTime).localeCompare(String(b.bestTime)));
    });
    return plan;
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
    const nights = selectedNights();
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
    const plan = {
      id: `ai_plan_${Date.now()}`,
      title: `${destination.name} ${nights}박 ${dayCount}일 · 취향 기반 여행 초안`,
      destination: destination.name,
      pace,
      budget,
      preferences,
      days,
      sourceType: 'AI_RULE_RANKER',
      modelMode: 'RULE_BASED_MOCK',
      startDate: selectedStartDate(),
      endDate: formatDate(addDays(selectedStartDate(), nights)),
      travelers: selectedTravelers(),
      createdAt: new Date().toISOString()
    };
    return addRequestedServices(plan, destination, text);
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
          <p>${escapeHtml(currentPlan.preferences.join(' · ') || '기본 추천')} · ${escapeHtml(paceLabel(currentPlan.pace))} · ${escapeHtml(budgetLabel(currentPlan.budget))}</p>
        </div>
        <button class="ui-button" type="button" data-ai-change-destination>도시 다시 고르기</button>
      </div>
      <section class="ai-review-card" aria-label="AI가 이해한 여행 조건">
        <div><span>AI가 이해한 여행</span><strong>${escapeHtml(currentPlan.destination)} · ${currentPlan.days.length - 1}박 ${currentPlan.days.length}일 · ${escapeHtml(currentPlan.travelers)}</strong><p>${escapeHtml(currentPlan.startDate)} 출발 · ${escapeHtml(paceLabel(currentPlan.pace))} · ${escapeHtml(budgetLabel(currentPlan.budget))} 예산</p></div>
        <button class="ui-button" type="button" data-ai-edit-request>요청 조건 다시 쓰기</button>
      </section>
      <div class="ai-plan-explanation">
        <strong>이렇게 구성했어요</strong>
        <p>랜드마크를 여행의 뼈대로 잡고, 요청한 숙소·공항 이동·식사·골프·스파를 가능한 날짜에 함께 배치했습니다. 아래에서 장소를 바꾸거나 다른 조합을 확인한 뒤 편집기로 넘길 수 있습니다.</p>
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
                ${alternatives.length ? `<div class="ai-alternative">
                  <label>
                    <span>다른 곳으로 변경</span>
                    <select data-ai-alternative>
                      <option value="">대안을 선택하세요</option>
                      ${alternatives.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.reason)}</option>`).join('')}
                    </select>
                  </label>
                  <button class="ui-button" type="button" data-ai-replace>선택한 곳으로 교체</button>
                </div>` : '<div class="ai-stop-fixed"><span>일정 편집기에서 날짜와 시간을 자유롭게 바꿀 수 있습니다.</span></div>'}
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
      <section class="ai-acceptance" aria-label="AI 일정 초안 확인">
        <div><span class="page-eyebrow">STEP 3 · REVIEW</span><h3>이 구성으로 여행을 시작할까요?</h3><p>아직 예약이 아니라 수정 가능한 초안입니다. 다음 화면에서 날짜·시간·장소와 지도 동선을 확인하고 바꿀 수 있습니다.</p></div>
        <ul><li><strong>${currentPlan.days.length}일</strong><span>날짜별 일정</span></li><li><strong>${currentPlan.days.reduce((sum, day) => sum + day.items.length, 0)}개</strong><span>추천 장소·서비스</span></li><li><strong>수정 가능</strong><span>지도·시간·순서</span></li></ul>
      </section>
      <div class="page-head-actions">
        <button class="ui-button primary" type="button" data-ai-copy>이 초안으로 일정 편집 시작</button>
        <button class="ui-button" type="button" data-ai-regenerate>다른 초안 보기</button>
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
    const destination = knowledge.destinations.find((item) => item.name === currentPlan.destination);
    const plannerDestination = plannerDestinationFor(destination);
    if (!plannerDestination) {
      const params = new URLSearchParams({
        destination: currentPlan.destination,
        nights: String(currentPlan.days.length - 1),
        startDate: currentPlan.startDate,
        endDate: currentPlan.endDate,
        travelers: currentPlan.travelers,
        source: 'ai-review',
        pace: currentPlan.pace,
        prompt: prompt.value.trim()
      });
      button.textContent = '단계별 편집 화면 여는 중…';
      button.disabled = true;
      setTimeout(() => { location.href = `trip-create.html?${params.toString()}`; }, 250);
      return;
    }
    const usedSourceIds = new Set();
    const items = currentPlan.days.flatMap((day) => day.items.map((place, index) => {
      const source = plannerItemFor(destination, place, usedSourceIds);
      if (source) usedSourceIds.add(source.id);
      return {
        id: `trip_item_${day.day}_${source?.id || place.id}_${index}`,
        sourceId: source?.id || place.sourceId || place.id,
        type: source?.category || place.type,
        category: source?.category || place.type,
        day: day.day,
        time: place.bestTime,
        title: source?.title || place.name,
        area: source?.area || currentPlan.destination,
        image: source?.image || plannerDestination.cover,
        duration: Number(source?.duration || place.estimatedMinutes || 60),
        price: Number(source?.price || 0),
        priceLabel: source?.priceLabel || '가격 재확인',
        bookingType: source?.bookingType || place.bookingType,
        status: source?.status || 'CHECK_REQUIRED',
        bookingStatus: 'NOT_BOOKED',
        confidence: place.confidence,
        note: place.reason,
        lat: Number(source?.lat) || null,
        lng: Number(source?.lng) || null
      };
    }));
    const trip = {
      id: `trip_ai_${Date.now()}`,
      ownerId: session()?.user?.id || 'LOCAL_GUEST',
      title: currentPlan.title,
      destination: currentPlan.destination,
      destinationId: plannerDestination.id,
      startDate: currentPlan.startDate,
      endDate: currentPlan.endDate,
      travelers: currentPlan.travelers,
      duration: `${currentPlan.days.length - 1}박 ${currentPlan.days.length}일`,
      status: 'DRAFT',
      sourceType: 'AI_DRAFT',
      sourcePlanId: currentPlan.id,
      sourcePrompt: prompt.value.trim(),
      preferences: currentPlan.preferences,
      items,
      updatedAt: new Date().toISOString()
    };
    api.upsert('trips', trip);
    api.appendAudit({
      actor: session()?.user?.id || 'LOCAL_GUEST',
      action: 'AI_DRAFT_ACCEPTED_FOR_EDITING',
      entityType: 'TRIP',
      entityId: trip.id,
      payload: { sourcePlanId: currentPlan.id, itemCount: trip.items.length }
    });
    button.textContent = '초안 적용 중…';
    button.disabled = true;
    setTimeout(() => { location.href = `trip-planner.html?tripId=${encodeURIComponent(trip.id)}&source=ai-review`; }, 350);
  };

  const initialize = async () => {
    [knowledge, plannerCatalog] = await Promise.all([
      api.get('ai/travel-knowledge.json'),
      api.get('trip-planner-catalog.json')
    ]);
    const version = document.querySelector('[data-ai-version]');
    if (version) version.textContent = `${knowledge.plannerVersion} · 여행 조건 기반 일정 설계`;
    const promptFromQuery = new URLSearchParams(location.search).get('prompt');
    if (promptFromQuery) prompt.value = promptFromQuery;
    const startInput = document.querySelector('[name="startDate"]');
    if (startInput) {
      startInput.min = formatDate(new Date());
      startInput.value = new URLSearchParams(location.search).get('startDate') || formatDate(addDays(new Date(), 30));
    }
    const nightsMatch = prompt.value.match(/(\d+)\s*박/);
    const nightsSelect = document.querySelector('[name="nights"]');
    if (nightsSelect && nightsMatch && [...nightsSelect.options].some((option) => option.value === nightsMatch[1])) nightsSelect.value = nightsMatch[1];
  };

  generateButton.addEventListener('click', () => {
    if (!prompt.value.trim()) {
      prompt.focus();
      prompt.setAttribute('aria-invalid', 'true');
      return;
    }
    prompt.removeAttribute('aria-invalid');
    selectedDestinationId = null;
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
    const editRequestButton = event.target.closest('[data-ai-edit-request]');
    if (editRequestButton) {
      prompt.scrollIntoView({ behavior: 'smooth', block: 'center' });
      prompt.focus({ preventScroll: true });
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
