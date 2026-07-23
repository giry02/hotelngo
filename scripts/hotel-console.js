(async () => {
  const CONTENT_KEY = 'hotelngo.hotel.mock.content.v1';
  const ACTIONS_KEY = 'hotelngo.hotel.mock.actions.v1';
  const getContent = async () => {
    try {
      const stored = localStorage.getItem(CONTENT_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return window.HotelNGoMockAPI.get('hotel-content.json');
  };
  const saveContent = (content) => localStorage.setItem(CONTENT_KEY, JSON.stringify({ ...content, updatedAt:new Date().toISOString() }));
  const toast = (message) => {
    const target = document.querySelector('[data-bo-toast]');
    if (!target) return;
    target.textContent = message;
    target.classList.add('is-visible');
    setTimeout(() => target.classList.remove('is-visible'), 2200);
  };
  const record = (action, detail) => {
    let actions = [];
    try { actions = JSON.parse(localStorage.getItem(ACTIONS_KEY) || '[]'); } catch {}
    actions.unshift({ action, detail, at:new Date().toISOString() });
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions.slice(0, 40)));
  };
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const content = await getContent();

  document.querySelectorAll('[data-hotel-name]').forEach((target) => { target.textContent = content.property.name; });
  document.querySelectorAll('[data-pms-sync-at]').forEach((target) => { target.textContent = new Date(content.property.lastPmsSyncAt).toLocaleString('ko-KR'); });
  document.querySelectorAll('[data-hotel-completeness]').forEach((target) => {
    const average = Math.round(content.roomTypes.reduce((sum, room) => sum + room.contentCompleteness, 0) / content.roomTypes.length);
    target.textContent = `${average}%`;
  });

  const roomList = document.querySelector('[data-hotel-room-list]');
  if (roomList) {
    roomList.innerHTML = content.roomTypes.map((room) => `<tr><td><strong>${escapeHtml(room.name)}</strong><small>PMS ${escapeHtml(room.pmsRoomTypeId)}</small></td><td><span class="bo-status">${room.contentStatus === 'PUBLISHED' ? '공개' : '검토 필요'}</span></td><td>${room.images.length}장</td><td>${room.contentCompleteness}%</td><td>${room.available}실 · ${room.rate.toLocaleString('ko-KR')}원 <small>PMS 읽기 전용</small></td><td><a class="bo-button" href="hotel-room-edit.html?roomTypeId=${encodeURIComponent(room.pmsRoomTypeId)}">공개정보 편집</a></td></tr>`).join('');
  }

  const propertyForm = document.querySelector('[data-hotel-content-form]');
  if (propertyForm) {
    propertyForm.elements.name.value = content.property.name;
    propertyForm.elements.summary.value = content.property.summary;
    propertyForm.elements.description.value = content.property.description;
    propertyForm.elements.checkIn.value = content.property.checkIn;
    propertyForm.elements.checkOut.value = content.property.checkOut;
    propertyForm.elements.policies.value = content.property.policies.join('\n');
    propertyForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!propertyForm.reportValidity()) return;
      const form = new FormData(propertyForm);
      content.property.summary = String(form.get('summary') || '').trim();
      content.property.description = String(form.get('description') || '').trim();
      content.property.checkIn = String(form.get('checkIn') || '');
      content.property.checkOut = String(form.get('checkOut') || '');
      content.property.policies = String(form.get('policies') || '').split('\n').map((item) => item.trim()).filter(Boolean);
      content.property.contentUpdatedAt = new Date().toISOString();
      saveContent(content);
      record('PROPERTY_CONTENT_SAVED', content.property.hotelId);
      toast('호텔 공개 콘텐츠 Mock을 저장했습니다.');
    });
  }

  const amenityForm = document.querySelector('[data-hotel-amenity-form]');
  if (amenityForm) {
    amenityForm.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = content.property.amenities.includes(input.value); });
    amenityForm.addEventListener('submit', (event) => {
      event.preventDefault();
      content.property.amenities = [...amenityForm.querySelectorAll('input:checked')].map((input) => input.value);
      saveContent(content);
      record('AMENITIES_SAVED', content.property.amenities);
      toast('공개 편의시설을 저장했습니다.');
    });
  }

  const mediaGrid = document.querySelector('[data-hotel-media-grid]');
  const renderMedia = () => {
    if (!mediaGrid) return;
    mediaGrid.innerHTML = content.property.media.map((media, index) => `<article class="bo-media-card"><img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}"><div><strong>${escapeHtml(media.category)}</strong><small>${escapeHtml(media.alt)}</small><span>${media.isCover ? '대표 사진' : `${index + 1}번째`}</span><div class="bo-actions"><button class="bo-button" type="button" data-media-cover="${media.id}">대표 지정</button><button class="bo-button" type="button" data-media-remove="${media.id}">삭제</button></div></div></article>`).join('');
  };
  renderMedia();
  document.querySelector('[data-hotel-media-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    content.property.media.push({ id:`media_local_${Date.now()}`, src:String(data.get('src') || '').trim(), alt:String(data.get('alt') || '').trim(), category:String(data.get('category') || '기타'), isCover:false });
    saveContent(content);
    record('MEDIA_ADDED', data.get('alt'));
    form.reset();
    renderMedia();
    toast('사진을 Mock 라이브러리에 추가했습니다.');
  });
  mediaGrid?.addEventListener('click', (event) => {
    const cover = event.target.closest('[data-media-cover]');
    const remove = event.target.closest('[data-media-remove]');
    if (cover) {
      content.property.media.forEach((media) => { media.isCover = media.id === cover.dataset.mediaCover; });
      saveContent(content); renderMedia(); toast('대표 사진을 변경했습니다.');
    }
    if (remove) {
      const index = content.property.media.findIndex((media) => media.id === remove.dataset.mediaRemove);
      if (index >= 0 && !content.property.media[index].isCover) content.property.media.splice(index, 1);
      else return toast('대표 사진은 다른 사진을 지정한 뒤 삭제할 수 있습니다.');
      saveContent(content); renderMedia(); toast('사진을 삭제했습니다.');
    }
  });

  const roomForm = document.querySelector('[data-hotel-room-form]');
  if (roomForm) {
    const id = new URLSearchParams(location.search).get('roomTypeId') || content.roomTypes[0].pmsRoomTypeId;
    const room = content.roomTypes.find((item) => item.pmsRoomTypeId === id) || content.roomTypes[0];
    document.querySelectorAll('[data-room-name]').forEach((target) => { target.textContent = room.name; });
    document.querySelectorAll('[data-room-mapping]').forEach((target) => { target.textContent = room.pmsRoomTypeId; });
    Object.entries({ name:room.name, sizeM2:room.sizeM2, bed:room.bed, occupancy:room.occupancy, view:room.view, bathroom:room.bathroom, amenities:room.amenities.join(', ') }).forEach(([name,value]) => { if (roomForm.elements[name]) roomForm.elements[name].value = value; });
    const roomMedia = document.querySelector('[data-room-media-list]');
    const renderRoomMedia = () => { roomMedia.innerHTML = room.images.map((image, index) => `<li><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}"><span><strong>${index === 0 ? '대표 · ' : ''}${escapeHtml(image.alt)}</strong><small>${index + 1}번째 사진</small></span><button class="bo-button" type="button" data-room-media-remove="${index}">삭제</button></li>`).join(''); };
    renderRoomMedia();
    document.querySelector('[data-room-media-add]')?.addEventListener('click', () => {
      const src = prompt('Mock 사진 경로', 'assets/images/stay-jeju.jpg');
      if (!src) return;
      const alt = prompt('사진 설명', `${room.name} 추가 사진`) || `${room.name} 추가 사진`;
      room.images.push({ src, alt });
      saveContent(content); renderRoomMedia(); toast('객실 사진을 추가했습니다.');
    });
    roomMedia.addEventListener('click', (event) => {
      const button = event.target.closest('[data-room-media-remove]');
      if (!button) return;
      if (room.images.length <= 1) return toast('객실에는 최소 한 장의 사진이 필요합니다.');
      room.images.splice(Number(button.dataset.roomMediaRemove), 1);
      saveContent(content); renderRoomMedia(); toast('객실 사진을 삭제했습니다.');
    });
    roomForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!roomForm.reportValidity()) return;
      const data = new FormData(roomForm);
      room.sizeM2 = Number(data.get('sizeM2'));
      room.bed = String(data.get('bed') || '');
      room.occupancy = String(data.get('occupancy') || '');
      room.view = String(data.get('view') || '');
      room.bathroom = String(data.get('bathroom') || '');
      room.amenities = String(data.get('amenities') || '').split(',').map((item) => item.trim()).filter(Boolean);
      room.contentCompleteness = Math.min(100, 70 + room.images.length * 5);
      saveContent(content);
      record('ROOM_CONTENT_SAVED', room.pmsRoomTypeId);
      toast('객실 공개정보를 저장했습니다. PMS 원천값은 변경하지 않았습니다.');
    });
  }

  document.querySelector('[data-hotel-review-request]')?.addEventListener('click', () => {
    content.property.publicStatus = 'PENDING_REVIEW';
    saveContent(content);
    record('PUBLICATION_REVIEW_REQUESTED', content.property.hotelId);
    toast('공개 심사를 요청했습니다.');
  });
})();
