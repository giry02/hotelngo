(() => {
  const form = document.querySelector('[data-guided-form]');
  if (!form) return;

  const query = new URLSearchParams(location.search);
  const state = {
    step: 1,
    maxStep: 1,
    destination: query.get('destination') || '',
    interests: [],
    prompt: query.get('prompt') || '',
    selectedCourseId: query.get('preset') || ''
  };
  let catalog = null;
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
  const destinationData = () => catalog?.destinations?.find((item) => item.name === state.destination || item.id === state.destination);
  const recommendedCourses = () => destinationData()?.recommendedCourses || [];
  const selectedCourse = () => recommendedCourses().find((item) => item.id === state.selectedCourseId) || recommendedCourses()[0] || null;
  const chooseBestCourse = () => {
    const courses = recommendedCourses();
    if (!courses.length || courses.some((item) => item.id === state.selectedCourseId)) return;
    if (state.interests.includes('골프')) state.selectedCourseId = courses.find((item) => item.id.includes('golf'))?.id || courses[0].id;
    else if (form.elements.pace.value === 'RELAXED' || (state.interests.includes('스파') && state.interests.includes('바다'))) state.selectedCourseId = courses.find((item) => item.id.includes('slow'))?.id || courses[0].id;
    else state.selectedCourseId = courses[0].id;
  };
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
      mode: 'recommended'
    });
    if (state.selectedCourseId) params.set('preset', state.selectedCourseId);
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
    chooseBestCourse();
    const course = selectedCourse();
    document.querySelector('[data-guided-summary]').innerHTML = `<strong>${state.destination} · ${nightsCount}박 ${nightsCount + 1}일</strong><span>${formatDate(startInput.value)} 출발 · ${form.elements.travelers.value} · ${state.interests.join(' · ')} · ${selectedPaceLabel()}</span><div class="guided-draft-sources"><b>완성 코스에 반영되는 기준</b><span>대표 랜드마크</span><span>숙소와 식사</span><span>체류·이동시간</span><span>도착·귀국 여유</span></div>`;
    const list = document.querySelector('[data-guided-courses]');
    if (!recommendedCourses().length) {
      list.innerHTML = '<p class="guided-course-loading">추천 코스를 불러오는 중입니다.</p>';
      document.querySelector('[data-guided-course-preview]').innerHTML = '';
      return;
    }
    list.innerHTML = recommendedCourses().map((item) => `<button type="button" class="guided-course-card${item.id === course?.id ? ' is-selected' : ''}" data-course-id="${item.id}" aria-pressed="${item.id === course?.id}"><img src="${item.image}" alt=""><span><small>${item.badge}</small><strong>${item.name}</strong><em>${item.tags.join(' · ')}</em></span><b>${item.id === course?.id ? '선택됨' : '이 코스 보기'}</b></button>`).join('');
    document.querySelector('[data-guided-course-preview]').innerHTML = `<header><div><small>선택한 추천안</small><h3>${course.name}</h3><p>${course.summary}</p></div><span>${course.pace}</span></header><div class="guided-course-reason"><b>왜 이렇게 구성했나요?</b><p>${course.reason}</p></div><div class="guided-days">${course.days.slice(0, nightsCount + 1).map((day) => `<article class="guided-day"><b>DAY ${day.day}</b><div><strong>${day.title}</strong><small>${day.summary}</small></div></article>`).join('')}</div><p class="guided-course-notice">아직 예약되거나 결제되는 항목은 없습니다. 다음 화면에서 장소를 빼고, 다른 후보로 교체하고, 시간을 바꿀 수 있습니다.</p>`;
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
      return;
    }
    const course = event.target.closest('[data-course-id]');
    if (course) {
      state.selectedCourseId = course.dataset.courseId;
      renderSummary();
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
  fetch('data/mock/trip-planner-catalog.json')
    .then((response) => {
      if (!response.ok) throw new Error('catalog');
      return response.json();
    })
    .then((payload) => {
      catalog = payload;
      chooseBestCourse();
      if (state.step === 4) renderSummary();
    })
    .catch(() => {
      if (state.step === 4) document.querySelector('[data-guided-courses]').innerHTML = '<p class="guided-course-loading">추천 코스를 불러오지 못했습니다. GitHub Pages에서 다시 열어주세요.</p>';
    });
})();
