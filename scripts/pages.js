(() => {
  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  const showToast = (message) => {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };

  document.querySelectorAll('[data-save-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const saved = button.classList.toggle('is-saved');
      const textMode = button.hasAttribute('data-text-save');
      button.textContent = textMode ? (saved ? '저장됨' : '저장') : (saved ? '♥' : '♡');
      button.setAttribute('aria-pressed', String(saved));
      showToast(saved ? '내 여행에 저장했습니다.' : '저장에서 제외했습니다.');
    });
  });

  document.querySelectorAll('[data-follow]').forEach((button) => {
    button.addEventListener('click', () => {
      const following = button.classList.toggle('is-following');
      button.textContent = following ? '팔로잉' : '팔로우';
      showToast(following ? '가이드를 팔로우합니다.' : '팔로우를 취소했습니다.');
    });
  });

  const hotelCards = [...document.querySelectorAll('[data-hotel-card]')];
  const updateHotelFilters = () => {
    if (!hotelCards.length) return;
    const checked = [...document.querySelectorAll('[data-hotel-filter]:checked')].map((input) => input.value);
    let visible = 0;
    hotelCards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ');
      const show = checked.every((value) => tags.includes(value));
      card.hidden = !show;
      if (show) visible += 1;
    });
    const count = document.querySelector('[data-result-count]');
    if (count) count.textContent = String(visible);
  };
  document.querySelectorAll('[data-hotel-filter]').forEach((input) => input.addEventListener('change', updateHotelFilters));
  document.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
    document.querySelectorAll('[data-hotel-filter]').forEach((input) => { input.checked = false; });
    updateHotelFilters();
  });
  document.querySelector('[data-filter-toggle]')?.addEventListener('click', () => {
    document.querySelector('.filter-panel')?.classList.toggle('is-open');
  });

  document.querySelectorAll('[data-search-page]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const destination = new FormData(form).get('destination') || '선택한 지역';
      showToast(`${destination}의 최신 요금과 재고를 다시 확인했습니다.`);
    });
  });

  const searchParams = new URLSearchParams(window.location.search);
  const destinationFromQuery = searchParams.get('destination');
  const hotelSearchForm = document.querySelector('[data-search-page]');
  if (hotelSearchForm && destinationFromQuery) {
    hotelSearchForm.elements.destination.value = destinationFromQuery;
    const destinationTitle = document.querySelector('[data-search-destination]');
    if (destinationTitle) destinationTitle.textContent = destinationFromQuery;
  }
  ['checkIn', 'checkOut'].forEach((name) => {
    const value = searchParams.get(name);
    if (hotelSearchForm?.elements[name] && value) hotelSearchForm.elements[name].value = value;
  });

  document.querySelectorAll('[data-add-trip]').forEach((button) => {
    button.addEventListener('click', () => {
      button.textContent = '일정에 담김';
      button.classList.add('soft');
      button.setAttribute('aria-pressed', 'true');
      showToast('교토 저녁 산책 일정에 추가했습니다.');
    });
  });

  const prompt = document.querySelector('[data-ai-prompt]');
  document.querySelectorAll('[data-prompt-example]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!prompt) return;
      prompt.value = button.dataset.promptExample;
      prompt.focus();
    });
  });
  document.querySelector('[data-ai-generate]')?.addEventListener('click', () => {
    const result = document.querySelector('[data-ai-result]');
    if (!prompt?.value.trim()) {
      showToast('원하는 여행을 한 문장으로 알려주세요.');
      prompt?.focus();
      return;
    }
    result?.removeAttribute('hidden');
    showToast('운영시간과 이동시간을 반영해 일정을 만들었습니다.');
    result?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.querySelectorAll('[data-disabled-booking]').forEach((button) => {
    button.addEventListener('click', () => showToast('현재는 요금·재고 조회 단계입니다. 예약 기능은 PMS 쓰기 연동 후 열립니다.'));
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
