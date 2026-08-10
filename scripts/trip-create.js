(() => {
  const form = document.querySelector('[data-guided-form]');
  if (!form) return;

  const query = new URLSearchParams(location.search);
  const state = {
    step: 1,
    maxStep: 1,
    destination: query.get('destination') || '',
    interests: [],
    prompt: query.get('prompt') || ''
  };
  const addDays = (value, days) => {
    const date = value instanceof Date ? new Date(value) : new Date(`${value}T12:00:00`);
    date.setDate(date.getDate() + days);
    return date;
  };
  const formatInputDate = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };
  const formatDate = (value) => new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T12:00:00`));
  const startInput = form.elements.startDate;
  const endInput = form.elements.endDate;
  const start = query.get('startDate') || query.get('checkIn') || formatInputDate(addDays(new Date(), 7));
  const nights = Math.max(1, Math.min(14, Number(query.get('nights') || 4)));
  startInput.value = start;
  endInput.value = query.get('endDate') || query.get('checkOut') || formatInputDate(addDays(start, nights));
  startInput.min = formatInputDate(new Date());
  endInput.min = formatInputDate(addDays(startInput.value, 1));

  if (/혼자/.test(state.prompt)) form.elements.travelers.value = '혼자';
  if (/가족|아이/.test(state.prompt)) form.elements.travelers.value = '가족 4명';
  if (['RELAXED', 'BALANCED', 'ACTIVE'].includes(query.get('pace'))) form.elements.pace.value = query.get('pace');
  const interestKeywords = { 바다: /바다|해변|휴양/, 미식: /맛집|음식|미식|카페/, 랜드마크: /명소|관광|랜드마크/, 골프: /골프/, 스파: /마사지|스파/, 쇼핑: /쇼핑|시장/ };
  state.interests = Object.entries(interestKeywords).filter(([, pattern]) => pattern.test(state.prompt)).map(([key]) => key);
  if (!state.interests.length && query.get('source') === 'ai') state.interests = ['랜드마크', '미식'];

  const selectedPaceLabel = () => ({ RELAXED: '여유롭게', BALANCED: '적당하게', ACTIVE: '알차게' }[form.elements.pace.value]);
  const dateDiff = () => Math.max(1, Math.round((new Date(`${endInput.value}T12:00:00`) - new Date(`${startInput.value}T12:00:00`)) / 86400000));
  const setChoiceState = () => {
    document.querySelectorAll('[data-choice="destination"]').forEach((button) => {
      const selected = button.dataset.value === state.destination;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
      button.setAttribute('role', 'radio');
    });
    document.querySelectorAll('[data-interest]').forEach((button) => {
      const selected = state.interests.includes(button.dataset.interest);
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  };
  const validateStep = () => {
    if (state.step === 1 && !state.destination) {
      document.querySelector('[data-error="destination"]').textContent = '여행지를 하나 선택해주세요.';
      return false;
    }
    if (state.step === 2) {
      const error = document.querySelector('[data-error="dates"]');
      if (!startInput.value || !endInput.value || dateDiff() < 1) {
        error.textContent = '귀국일은 출발일보다 하루 이상 뒤여야 합니다.';
        return false;
      }
      error.textContent = '';
    }
    if (state.step === 3 && !state.interests.length) {
      document.querySelector('[data-error="interests"]').textContent = '하고 싶은 일을 한 가지 이상 선택해주세요.';
      return false;
    }
    return true;
  };
  const buildHref = (target) => {
    const params = new URLSearchParams({
      destination: state.destination,
      startDate: startInput.value,
      endDate: endInput.value,
      travelers: form.elements.travelers.value,
      mode: 'guided'
    });
    if (state.prompt) params.set('prompt', state.prompt);
    if (state.interests.length) params.set('interests', state.interests.join(','));
    if (target === 'hotels') {
      const guestCount = /4명/.test(form.elements.travelers.value) ? '4' : /혼자/.test(form.elements.travelers.value) ? '1' : '2';
      return `hotels.html?${new URLSearchParams({ destination: state.destination, checkIn: startInput.value, checkOut: endInput.value, guests: guestCount }).toString()}`;
    }
    return `trip-planner.html?${params.toString()}`;
  };
  const renderSummary = () => {
    const nightsCount = dateDiff();
    document.querySelector('[data-guided-summary]').innerHTML = `<strong>${state.destination} · ${nightsCount}박 ${nightsCount + 1}일</strong><span>${formatDate(startInput.value)} 출발 · ${form.elements.travelers.value} · ${state.interests.join(' · ')} · ${selectedPaceLabel()}</span>`;
    const interestLabels = {
      바다: ['바다에서 쉬는 날', '해변과 가까운 장소를 여유 있게 둘러봐요.'],
      미식: ['현지 음식 즐기는 날', '이동이 짧은 맛집과 카페를 함께 묶어요.'],
      랜드마크: ['대표 명소 보는 날', '운영시간과 이동거리를 확인해 핵심 장소를 골라요.'],
      골프: ['골프 일정', '티타임과 왕복 이동시간을 먼저 확인해요.'],
      스파: ['휴식과 스파', '일정 중간에 쉬어갈 시간을 남겨둬요.'],
      쇼핑: ['시장과 쇼핑', '귀가 동선과 가까운 시장·쇼핑 지역을 찾아요.']
    };
    const dayCount = nightsCount + 1;
    const days = Array.from({ length: dayCount }, (_, index) => {
      if (index === 0) return ['도착·체크인', '공항 이동과 숙소 체크인 후 가까운 곳만 둘러봐요.'];
      if (index === dayCount - 1) return ['체크아웃·귀국', '짐 보관과 공항 이동시간을 확인해요.'];
      return interestLabels[state.interests[(index - 1) % state.interests.length]];
    });
    document.querySelector('[data-guided-days]').innerHTML = days.map((day, index) => `<article class="guided-day"><b>DAY ${index + 1}</b><div><strong>${day[0]}</strong><small>${day[1]}</small></div></article>`).join('');
    document.querySelector('[data-open-plan]').href = buildHref('plan');
    document.querySelector('[data-open-advanced]').href = buildHref('plan');
    document.querySelector('[data-find-hotels]').href = buildHref('hotels');
  };
  const render = () => {
    document.querySelectorAll('[data-step]').forEach((section) => { section.hidden = Number(section.dataset.step) !== state.step; });
    const progressButtons = [...document.querySelectorAll('[data-step-jump]')];
    progressButtons.forEach((button) => {
      const step = Number(button.dataset.stepJump);
      button.classList.toggle('is-active', step === state.step);
      button.classList.toggle('is-done', step < state.step);
      button.disabled = step > state.maxStep;
      button.setAttribute('aria-current', step === state.step ? 'step' : 'false');
    });
    document.querySelectorAll('.guided-progress i').forEach((line, index) => line.classList.toggle('is-done', index + 1 < state.step));
    document.querySelector('[data-prev]').hidden = state.step === 1;
    const next = document.querySelector('[data-next]');
    next.hidden = state.step === 4;
    next.textContent = state.step === 3 ? '초안 확인' : '다음';
    if (state.step === 4) renderSummary();
    setChoiceState();
    const heading = document.querySelector(`[data-step="${state.step}"] h2`);
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  };

  form.addEventListener('click', (event) => {
    const destination = event.target.closest('[data-choice="destination"]');
    if (destination) {
      state.destination = destination.dataset.value;
      document.querySelector('[data-error="destination"]').textContent = '';
      setChoiceState();
      return;
    }
    const interest = event.target.closest('[data-interest]');
    if (interest) {
      const value = interest.dataset.interest;
      state.interests = state.interests.includes(value) ? state.interests.filter((item) => item !== value) : [...state.interests, value];
      document.querySelector('[data-error="interests"]').textContent = '';
      setChoiceState();
    }
  });
  document.querySelector('[data-next]').addEventListener('click', () => {
    if (!validateStep()) return;
    state.step = Math.min(4, state.step + 1);
    state.maxStep = Math.max(state.maxStep, state.step);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.querySelector('[data-prev]').addEventListener('click', () => {
    state.step = Math.max(1, state.step - 1);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.querySelectorAll('[data-step-jump]').forEach((button) => button.addEventListener('click', () => {
    const step = Number(button.dataset.stepJump);
    if (step <= state.maxStep) { state.step = step; render(); }
  }));
  startInput.addEventListener('change', () => {
    endInput.min = formatInputDate(addDays(startInput.value, 1));
    if (!endInput.value || endInput.value <= startInput.value) endInput.value = formatInputDate(addDays(startInput.value, nights));
  });

  setChoiceState();
  render();
})();
