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
  const filterPanel = document.querySelector('.filter-panel');
  const filterToggle = document.querySelector('[data-filter-toggle]');
  const filterScrim = document.querySelector('.filter-scrim');
  const setFilterOpen = (open) => {
    filterPanel?.classList.toggle('is-open', open);
    if (filterScrim) filterScrim.hidden = !open;
    filterToggle?.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('filter-open', open);
    if (open) filterPanel?.querySelector('[data-filter-close]')?.focus();
    else filterToggle?.focus();
  };
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
    const mobileCount = document.querySelector('[data-filter-result-count]');
    if (mobileCount) mobileCount.textContent = String(visible);
  };
  document.querySelectorAll('[data-hotel-filter]').forEach((input) => input.addEventListener('change', updateHotelFilters));
  document.querySelector('[data-filter-reset]')?.addEventListener('click', () => {
    document.querySelectorAll('[data-hotel-filter]').forEach((input) => { input.checked = false; });
    updateHotelFilters();
  });
  filterToggle?.setAttribute('aria-expanded', 'false');
  filterToggle?.addEventListener('click', () => setFilterOpen(!filterPanel?.classList.contains('is-open')));
  document.querySelectorAll('[data-filter-close], [data-filter-apply]').forEach((button) => button.addEventListener('click', () => setFilterOpen(false)));
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
    const targetCard = hotelCards[index];
    const query = new URLSearchParams(location.search);
    query.set('hotelId', targetCard?.dataset.hotelId || '');
    query.set('from', 'map');
    query.set('price', button.textContent.trim());
    location.href = `hotel-detail.html?${query.toString()}`;
  }));

  document.querySelectorAll('[data-search-page]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const next = new URLSearchParams();
      ['destination', 'checkIn', 'checkOut', 'guests'].forEach((name) => {
        const value = data.get(name);
        if (value) next.set(name, value);
      });
      location.href = `hotels.html?${next.toString()}`;
    });
  });

  const searchParams = new URLSearchParams(window.location.search);
  const destinationFromQuery = searchParams.get('destination');
  const hotelSearchForm = document.querySelector('[data-hotel-search]');
  const guestLabel = (value) => {
    const text = String(value || '2');
    const adultMatch = text.match(/성인\s*(\d+)/);
    const adultCount = Number(adultMatch?.[1] || text.match(/^\d+/)?.[0] || 2);
    const childMatch = text.match(/아동\s*(\d+)/);
    const childCount = Number(childMatch?.[1] || (text.includes('-') ? text.split('-')[1] : 0) || 0);
    return `성인 ${adultCount}명${childCount ? ` · 아동 ${childCount}명` : ''}`;
  };
  const formatShortDate = (value) => new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(`${value}T12:00:00`));
  if (hotelSearchForm && destinationFromQuery) {
    hotelSearchForm.elements.destination.value = destinationFromQuery;
    document.querySelectorAll('[data-search-destination]').forEach((element) => { element.textContent = destinationFromQuery; });
    document.title = `${destinationFromQuery} 호텔 검색 · HotelnGo`;
  }
  ['checkIn', 'checkOut'].forEach((name) => {
    const value = searchParams.get(name);
    if (hotelSearchForm?.elements[name] && value) hotelSearchForm.elements[name].value = value;
  });
  if (hotelSearchForm) {
    const checkIn = searchParams.get('checkIn') || hotelSearchForm.elements.checkIn?.value || '';
    const checkOut = searchParams.get('checkOut') || hotelSearchForm.elements.checkOut?.value || '';
    const guests = searchParams.get('guests') || hotelSearchForm.elements.guests?.value || '2';
    if (hotelSearchForm.elements.guests) {
      const guestValue = guests.includes('아동') || guests === '2-1' ? '2-1' : String(guests).match(/성인\s*(\d+)/)?.[1] || String(guests).match(/^\d+/)?.[0] || '2';
      if ([...hotelSearchForm.elements.guests.options].some((option) => option.value === guestValue)) hotelSearchForm.elements.guests.value = guestValue;
    }
    const normalizedGuests = guestLabel(guests);
    const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(`${checkOut}T12:00:00`) - new Date(`${checkIn}T12:00:00`)) / 86400000)) : 1;
    const summary = document.querySelector('[data-hotel-result-summary]');
    if (summary && checkIn && checkOut) {
      summary.textContent = `${checkIn.replaceAll('-', '.')}–${checkOut.replaceAll('-', '.')} · ${nights}박 · ${normalizedGuests} · 세금 포함 총액 기준`;
    }
    const mobileSearchSummary = document.querySelector('[data-mobile-search-summary]');
    if (mobileSearchSummary && checkIn && checkOut) mobileSearchSummary.textContent = `${destinationFromQuery || hotelSearchForm.elements.destination.value} · ${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${normalizedGuests}`;
    const collapsibleSearch = document.querySelector('[data-search-collapsible]');
    const searchExpand = document.querySelector('[data-search-expand]');
    searchExpand?.addEventListener('click', () => {
      const collapsed = collapsibleSearch?.classList.toggle('is-collapsed');
      searchExpand.setAttribute('aria-expanded', String(!collapsed));
      if (!collapsed) hotelSearchForm.elements.destination?.focus();
    });
    const query = new URLSearchParams();
    if (destinationFromQuery) query.set('destination', destinationFromQuery);
    if (checkIn) query.set('checkIn', checkIn);
    if (checkOut) query.set('checkOut', checkOut);
    query.set('guests', String(guests));
    hotelCards.forEach((card) => {
      const nightlyRate = Number(card.dataset.nightlyRate || 0);
      const originalNightlyRate = Number(card.dataset.originalNightlyRate || 0);
      const total = nightlyRate * nights;
      if (total) {
        card.dataset.price = String(total);
        const priceBox = card.querySelector('.result-price');
        const stayCopy = priceBox?.querySelector('small');
        const currentPrice = priceBox?.querySelector('strong');
        const originalPrice = priceBox?.querySelector('del');
        if (stayCopy) stayCopy.textContent = `${nights}박 · ${card.dataset.stayIncludes || '객실만'}`;
        if (currentPrice) currentPrice.textContent = `${total.toLocaleString('ko-KR')}원${card.dataset.hotelId === 'htl_danang_intercontinental' ? '부터' : ''}`;
        if (originalPrice && originalNightlyRate) originalPrice.textContent = `${(originalNightlyRate * nights).toLocaleString('ko-KR')}원`;
      }
      const hotelQuery = new URLSearchParams(query);
      hotelQuery.set('hotelId', card.dataset.hotelId || 'htl_danang_ocean');
      card.querySelectorAll('a[href="hotel-detail.html"]').forEach((link) => {
        link.href = `hotel-detail.html?${hotelQuery.toString()}`;
      });
    });
    document.querySelectorAll('.map-price-pin').forEach((pin, index) => {
      const amount = Number(hotelCards[index]?.dataset.price || 0);
      if (amount) pin.textContent = `${amount.toLocaleString('ko-KR')}원`;
    });
    const today = new Date();
    const todayValue = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const resultRegion = document.querySelector('section[aria-labelledby="result-title"]');
    if (resultRegion && checkIn === todayValue && !resultRegion.querySelector('[data-same-day-hotel-notice]')) {
      resultRegion.querySelector('.result-toolbar')?.insertAdjacentHTML('afterend', '<div class="supplier-notice ai-urgent-notice" data-same-day-hotel-notice><strong>오늘 체크인:</strong> 예약 전에 객실과 체크인 가능 시간을 한 번 더 확인해 주세요.</div>');
    }
  }

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
    button.addEventListener('click', () => showToast('이 객실은 현재 가격을 다시 확인하고 있습니다. 다른 객실을 선택하거나 잠시 후 다시 확인해 주세요.'));
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
    dialog.innerHTML = `<div class="gallery-dialog-head"><div><strong>호텔 사진</strong><span>등록 사진 ${images.length}장</span></div><button type="button" aria-label="갤러리 닫기">×</button></div><div class="gallery-dialog-grid">${images.map((image) => `<img src="${image.src}" alt="${image.alt}">`).join('')}</div>`;
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
