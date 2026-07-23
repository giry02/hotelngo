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
  const openPageConfirm = ({ title, message, confirmLabel = '확인', onConfirm }) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'page-confirm-dialog';
    dialog.innerHTML = `<header><div><small>HOTELNGO CONFIRM</small><strong>${title}</strong></div><button type="button" aria-label="닫기">×</button></header><div class="page-confirm-body">${message}</div><footer><button class="ui-button" type="button" data-dialog-cancel>취소</button><button class="ui-button primary" type="button" data-dialog-confirm>${confirmLabel}</button></footer>`;
    document.body.append(dialog);
    const close = () => dialog.close();
    dialog.querySelector('header button').addEventListener('click', close);
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', close);
    dialog.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
      onConfirm();
      close();
    });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
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
  document.querySelectorAll('[data-hotel-view]').forEach((button) => button.addEventListener('click', () => {
    const mapMode = button.dataset.hotelView === 'map';
    document.querySelectorAll('[data-hotel-view]').forEach((item) => item.classList.toggle('is-active', item === button));
    const list = document.querySelector('.hotel-result-list');
    const map = document.querySelector('[data-hotel-map]');
    if (list) list.hidden = mapMode;
    if (map) map.hidden = !mapMode;
  }));
  document.querySelector('[data-hotel-sort]')?.addEventListener('change', (event) => {
    const list = document.querySelector('.hotel-result-list');
    if (!list) return;
    const cards = [...list.querySelectorAll('[data-hotel-card]')];
    if (event.target.value === 'price') cards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    if (event.target.value === 'rating') cards.sort((a, b) => Number(b.dataset.rating) - Number(a.dataset.rating));
    cards.forEach((card) => list.append(card));
  });
  document.querySelectorAll('.active-filters button').forEach((button) => button.addEventListener('click', () => {
    button.remove();
    showToast('선택한 검색 조건을 해제했습니다.');
  }));
  document.querySelectorAll('.map-price-pin').forEach((button, index) => button.addEventListener('click', () => {
    const query = new URLSearchParams({ from: 'map', result: String(index + 1), price: button.textContent.trim() });
    location.href = `hotel-detail.html?${query.toString()}`;
  }));

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
    document.querySelectorAll('[data-search-destination]').forEach((element) => { element.textContent = destinationFromQuery; });
    document.title = `${destinationFromQuery} 호텔 검색 · HotelnGo`;
  }
  ['checkIn', 'checkOut'].forEach((name) => {
    const value = searchParams.get(name);
    if (hotelSearchForm?.elements[name] && value) hotelSearchForm.elements[name].value = value;
  });

  document.querySelectorAll('[data-add-trip]').forEach((button) => {
    button.addEventListener('click', () => {
      if (window.HotelNGoAuth && !window.HotelNGoAuth.isAuthenticated()) {
        const current = `${location.pathname.split('/').pop()}${location.search}${location.hash}`;
        location.href = `login.html?returnUrl=${encodeURIComponent(current)}`;
        return;
      }
      button.textContent = '일정에 담김';
      button.classList.add('soft');
      button.setAttribute('aria-pressed', 'true');
      showToast('교토 저녁 산책 일정에 추가했습니다.');
    });
  });

  document.querySelectorAll('[data-disabled-booking]').forEach((button) => {
    button.addEventListener('click', () => showToast('현재는 요금·재고 조회 단계입니다. 예약 기능은 PMS 쓰기 연동 후 열립니다.'));
  });

  document.querySelectorAll('[data-page-action]').forEach((button) => {
    button.addEventListener('click', () => showToast(button.dataset.pageAction || '피드백용 화면 동작입니다.'));
  });

  document.querySelectorAll('[data-persist-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const persist = () => {
        const key = form.dataset.persistForm;
        const value = Object.fromEntries(new FormData(form).entries());
        if (key === 'account') delete value.passportNumber;
        localStorage.setItem(`hotelngo.mock.form.${key}`, JSON.stringify({ value, savedAt: new Date().toISOString() }));
        showToast(form.dataset.successMessage || '이 브라우저의 Mock 데이터에 저장했습니다.');
      };
      if (form.dataset.confirmTitle) {
        openPageConfirm({
          title: form.dataset.confirmTitle,
          message: form.dataset.confirmMessage || '입력한 내용으로 작업을 진행합니다.',
          confirmLabel: form.dataset.confirmLabel || '확인',
          onConfirm: persist
        });
      } else {
        persist();
      }
    });
  });

  document.querySelectorAll('[data-share-page]').forEach((button) => {
    button.addEventListener('click', async () => {
      const shareData = { title: document.title, text: 'HotelnGo에서 만든 여행을 확인해 보세요.', url: location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (error) { if (error.name !== 'AbortError') showToast('공유를 완료하지 못했습니다.'); }
      } else {
        await navigator.clipboard?.writeText(location.href);
        showToast('여행 링크를 클립보드에 복사했습니다.');
      }
    });
  });

  document.querySelector('[data-trip-edit]')?.addEventListener('click', (event) => {
    const editing = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(editing));
    event.currentTarget.textContent = editing ? '편집 저장' : '일정 편집';
    document.querySelectorAll('.trip-item > span:nth-child(2) > strong').forEach((title) => { title.contentEditable = String(editing); });
    showToast(editing ? '일정 제목을 직접 수정할 수 있습니다.' : '수정한 일정을 브라우저 Mock 상태에 저장했습니다.');
  });

  const updateFlights = () => {
    const cards = [...document.querySelectorAll('[data-flight-card]')];
    const directOnly = document.querySelector('[data-flight-direct]')?.checked;
    const max = Number(document.querySelector('[data-flight-max]')?.value || Infinity);
    let count = 0;
    cards.forEach((card) => {
      const visible = (!directOnly || card.dataset.direct === 'true') && Number(card.dataset.price) <= max;
      card.hidden = !visible;
      if (visible) count += 1;
    });
    const target = document.querySelector('[data-flight-count]');
    if (target) target.textContent = String(count);
  };
  document.querySelector('[data-flight-direct]')?.addEventListener('change', updateFlights);
  document.querySelector('[data-flight-max]')?.addEventListener('change', updateFlights);
  document.querySelectorAll('[data-flight-toggle]').forEach((button) => button.addEventListener('click', () => {
    const detail = button.closest('[data-flight-card]')?.querySelector('.flight-detail');
    if (!detail) return;
    detail.hidden = !detail.hidden;
    button.textContent = detail.hidden ? '운임 조건' : '조건 닫기';
  }));

  document.querySelectorAll('[data-package-filter]').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.packageFilter;
    document.querySelectorAll('[data-package-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('[data-package-card]').forEach((card) => {
      card.hidden = category !== 'all' && !(card.dataset.category || '').split(' ').includes(category);
    });
  }));

  document.querySelector('[data-gallery-open]')?.addEventListener('click', () => {
    const images = [...document.querySelectorAll('.hotel-gallery img')];
    const dialog = document.createElement('dialog');
    dialog.className = 'gallery-dialog';
    dialog.innerHTML = `<div class="gallery-dialog-head"><div><strong>호텔 사진</strong><span>${images.length}개 Mock 이미지</span></div><button type="button" aria-label="갤러리 닫기">×</button></div><div class="gallery-dialog-grid">${images.map((image) => `<img src="${image.src}" alt="${image.alt}">`).join('')}</div>`;
    document.body.append(dialog);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  });

  document.querySelectorAll('[data-audio-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      const playing = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(playing));
      button.textContent = playing ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', playing ? '기온 빗소리 일시정지' : '기온 빗소리 재생');
      showToast(playing ? '오디오 미리보기 재생 UI입니다.' : '오디오 미리보기를 멈췄습니다.');
    });
  });

  document.querySelectorAll('button:not([type="submit"]):not([disabled])').forEach((button) => {
    if (Object.keys(button.dataset).length || button.closest('[data-site-header]')) return;
    button.addEventListener('click', () => showToast(`${button.textContent.trim()} 화면 동작은 피드백용 프로토타입입니다.`));
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
