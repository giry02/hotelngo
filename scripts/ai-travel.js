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

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const detectDestination = (text) => {
    const normalized = text.toLowerCase();
    return knowledge.destinations.find((destination) =>
      [destination.name, ...(destination.aliases || [])].some((name) => normalized.includes(String(name).toLowerCase()))
    ) || knowledge.destinations[0];
  };

  const detectPreferences = (text) => {
    const keywords = ['감성', '골목', '야경', '사진', '미식', '바다', '휴양', '가족', '자연', '시장', '가이드', '데이트'];
    return keywords.filter((keyword) => text.includes(keyword));
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

  const buildPlan = () => {
    const text = prompt.value.trim();
    const destination = detectDestination(text);
    const preferences = detectPreferences(text);
    const pace = document.querySelector('[name="pace"]')?.value || 'BALANCED';
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
    const days = Array.from({ length: nights }, (_, dayIndex) => {
      const items = Array.from({ length: stopsPerDay }, (_, stopIndex) =>
        rotated[(dayIndex * stopsPerDay + stopIndex) % rotated.length]
      ).filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
      return { day: dayIndex + 1, items };
    });
    return {
      id: `ai_plan_${Date.now()}`,
      title: `${destination.name} ${nights}박 · 취향 기반 여행 초안`,
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

  const render = () => {
    currentPlan = buildPlan();
    const destination = knowledge.destinations.find((item) => item.name === currentPlan.destination);
    output.classList.remove('ai-result-empty');
    output.innerHTML = `
      <div class="ai-result-head">
        <div>
          <h2>${escapeHtml(currentPlan.title)}</h2>
          <p>${escapeHtml(currentPlan.preferences.join(' · ') || '기본 추천')} · ${escapeHtml(currentPlan.pace)} · ${escapeHtml(currentPlan.budget)}</p>
        </div>
        <span class="status-chip warning">규칙 기반 Mock</span>
      </div>
      <div class="ai-plan-explanation">
        <strong>어떻게 정렬했나요?</strong>
        <p>도시의 장소 JSON에서 기본 점수와 요청 문장의 취향 태그를 합산했습니다. 운영시간·지도 이동시간·실재고는 연결 전이므로 별도 신뢰 상태로 표시합니다.</p>
      </div>
      ${currentPlan.days.map((day) => `
        <article class="ai-day">
          <div class="ai-day-label"><strong>DAY ${day.day}</strong><span>후보 ${day.items.length}곳</span></div>
          <div class="ai-stops">
            ${day.items.map((place, stopIndex) => {
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
            }).join('')}
          </div>
        </article>
      `).join('')}
      <div class="supplier-notice"><strong>확정 전 재검증:</strong> ${escapeHtml(knowledge.dataPolicy.safeResultPolicy)}</div>
      <div class="ai-evidence">
        <strong>데이터 사용</strong>
        <span>장소·태그 JSON</span><span>규칙 점수화</span><span>예약 가능성 분리</span><span>${escapeHtml(knowledge.plannerVersion)}</span>
      </div>
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
    if (version) version.textContent = `${knowledge.plannerVersion} · 외부 AI 미연결`;
  };

  generateButton.addEventListener('click', () => {
    if (!prompt.value.trim()) {
      prompt.focus();
      prompt.setAttribute('aria-invalid', 'true');
      return;
    }
    prompt.removeAttribute('aria-invalid');
    render();
  });

  document.querySelectorAll('[data-prompt-example]').forEach((button) => {
    button.addEventListener('click', () => {
      prompt.value = button.dataset.promptExample || '';
      prompt.focus();
    });
  });

  output.addEventListener('click', (event) => {
    const replaceButton = event.target.closest('[data-ai-replace]');
    if (replaceButton) replacePlace(replaceButton);
    const regenerateButton = event.target.closest('[data-ai-regenerate]');
    if (regenerateButton) {
      const destination = detectDestination(prompt.value);
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
