(async () => {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const amenityIcons = {
    '해변': '<circle cx="6" cy="6" r="2.5"/><path d="M2 14c2-1.7 4-1.7 6 0s4 1.7 6 0 4-1.7 6 0M3 18c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0"/>',
    '수영장': '<path d="M3 7h8a3 3 0 0 1 3 3v1"/><path d="M7 7V4.5a2.5 2.5 0 0 1 5 0"/><path d="M2 14c2-1.7 4-1.7 6 0s4 1.7 6 0 4-1.7 6 0M2 18c2-1.4 4-1.4 6 0s4 1.4 6 0 4-1.4 6 0"/>',
    '키즈클럽': '<path d="M5 4h5v5H5zM14 4h5v5h-5zM5 14h5v5H5z"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    '피트니스': '<path d="M6 9v6M3.5 10.5v3M18 9v6M20.5 10.5v3M6 12h12"/>',
    '스파': '<path d="M12 20c-4.2-2.2-6.5-5.1-6.5-8.5 3.1 0 5.2 1 6.5 3.1 1.3-2.1 3.4-3.1 6.5-3.1 0 3.4-2.3 6.3-6.5 8.5Z"/><path d="M12 14.6c-2.2-2.1-2.7-5.2 0-8.6 2.7 3.4 2.2 6.5 0 8.6Z"/>',
    '공항 픽업': '<path d="M3 16.5h18M5 16.5l1.3-5h9.4l2.3 5"/><path d="M7 11.5l1.2-3h5.7l1.8 3"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/><path d="M16 5l4-2-1.5 3.5L21 8l-5-.5-3 2 .8-3-2.8-1 5-.5Z"/>',
    '무료 Wi-Fi': '<path d="M3.5 9.5a12.5 12.5 0 0 1 17 0M6.5 13a8 8 0 0 1 11 0M9.5 16.5a3.8 3.8 0 0 1 5 0"/><circle cx="12" cy="20" r="1"/>',
    '조식 레스토랑': '<path d="M6 3v8M3.5 3v5a2.5 2.5 0 0 0 5 0V3M6 11v10M15 3v18M15 3c4 1.5 4 8 0 9"/>',
    '휠체어 접근': '<circle cx="11" cy="4.5" r="2"/><path d="M10 8l-1 6 5 1 2.5 5M9.5 10H15M9 12.5a5 5 0 1 0 5.5 6.8"/>'
  };
  const amenityIcon = (amenity) => {
    const key = Object.keys(amenityIcons).find((label) => amenity.includes(label)) || '해변';
    return `<svg class="amenity-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${amenityIcons[key]}</svg>`;
  };
  const reviewCard = (review) => `<article class="hotel-review-card" data-review-traveler="${escapeHtml(review.travelerType)}" data-review-room="${escapeHtml(review.roomType)}" data-review-score="${review.score}">
    <div class="review-card-head"><b>${review.score.toFixed(1)}</b><div><strong>${escapeHtml(review.title)}</strong><span>${review.verified ? '✓ 예약 확인' : '일반 후기'} · ${escapeHtml(review.travelerType)}</span></div></div>
    <p>${escapeHtml(review.body)}</p>
    <footer><span>${escapeHtml(review.author)} · ${escapeHtml(review.roomType)} · ${escapeHtml(review.stayDate)} 숙박</span><a href="review-detail.html?id=${encodeURIComponent(review.id)}">상세 보기</a></footer>
  </article>`;
  const reviewOverview = (summary, reviews) => `<div class="review-overview">
    <div class="review-score-panel"><span>${escapeHtml(summary.label)}</span><strong>${summary.score.toFixed(1)}</strong><small>${summary.count.toLocaleString('ko-KR')}개 후기</small></div>
    <div class="review-category-bars">${summary.categories.map((category) => `<div><span>${escapeHtml(category.label)} <b>${category.score.toFixed(1)}</b></span><i><em style="width:${category.score * 10}%"></em></i></div>`).join('')}</div>
  </div><div class="hotel-review-grid">${reviews.map(reviewCard).join('')}</div>`;
  const getContent = async () => {
    const baseContent = await window.HotelNGoMockAPI.get('hotel-content.json');
    try {
      const stored = localStorage.getItem('hotelngo.hotel.mock.content.v1');
      if (stored) {
        const localContent = JSON.parse(stored);
        return {
          ...baseContent,
          ...localContent,
          reviewSummary: localContent.reviewSummary || baseContent.reviewSummary,
          reviews: localContent.reviews || baseContent.reviews || []
        };
      }
    } catch {}
    return baseContent;
  };
  const openGallery = (title, images, details = '') => {
    const dialog = document.createElement('dialog');
    dialog.className = 'gallery-dialog room-gallery-dialog';
    dialog.innerHTML = `<header class="gallery-dialog-head"><div><strong>${escapeHtml(title)}</strong><span>${images.length}장의 등록 사진 · HotelNGo 공개 콘텐츠</span></div><button type="button" aria-label="갤러리 닫기">×</button></header>${details ? `<div class="room-gallery-facts">${details}</div>` : ''}<div class="gallery-dialog-grid">${images.map((image) => `<figure><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}"><figcaption>${escapeHtml(image.alt)}</figcaption></figure>`).join('')}</div>`;
    document.body.append(dialog);
    dialog.querySelector('header button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };
  const content = await getContent();
  const property = content.property;

  const propertyGallery = document.querySelector('[data-property-gallery]');
  if (propertyGallery) {
    propertyGallery.innerHTML = property.media.slice(0, 5).map((image, index) => `<figure><img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}">${index === 0 ? `<button type="button" data-property-gallery-open>사진 ${property.media.length}장 모두 보기</button>` : ''}</figure>`).join('');
    propertyGallery.querySelector('[data-property-gallery-open]')?.addEventListener('click', () => openGallery(`${property.name} 사진`, property.media));
  }
  const amenityGrid = document.querySelector('[data-property-amenities]');
  if (amenityGrid) amenityGrid.innerHTML = property.amenities.map((amenity) => `<span class="amenity-item">${amenityIcon(amenity)}<span class="amenity-label">${escapeHtml(amenity)}</span></span>`).join('');
  const reviewSummary = content.reviewSummary;
  const reviews = content.reviews || [];
  const reviewSummaryTarget = document.querySelector('[data-property-review-summary]');
  if (reviewSummaryTarget && reviewSummary) reviewSummaryTarget.innerHTML = reviewOverview(reviewSummary, reviews.slice(0, 2));

  const reviewOverviewTarget = document.querySelector('[data-hotel-review-overview]');
  if (reviewOverviewTarget && reviewSummary) reviewOverviewTarget.innerHTML = reviewOverview(reviewSummary, []);
  const reviewListTarget = document.querySelector('[data-hotel-review-list]');
  const renderReviewList = () => {
    if (!reviewListTarget) return;
    const traveler = document.querySelector('[data-review-filter="traveler"]')?.value || '전체';
    const room = document.querySelector('[data-review-filter="room"]')?.value || '전체';
    const sort = document.querySelector('[data-review-filter="sort"]')?.value || 'recent';
    let filtered = reviews.filter((review) => (traveler === '전체' || review.travelerType === traveler) && (room === '전체' || review.roomType === room));
    if (sort === 'high') filtered = [...filtered].sort((a, b) => b.score - a.score);
    if (sort === 'helpful') filtered = [...filtered].sort((a, b) => b.helpful - a.helpful);
    reviewListTarget.innerHTML = filtered.length ? filtered.map(reviewCard).join('') : '<div class="empty-state"><strong>선택한 조건의 후기가 없습니다.</strong><p>다른 여행 유형이나 객실을 선택해 보세요.</p></div>';
    document.querySelector('[data-review-result-count]')?.replaceChildren(document.createTextNode(`${filtered.length}개 대표 후기`));
  };
  document.querySelectorAll('[data-review-filter]').forEach((select) => select.addEventListener('change', renderReviewList));
  renderReviewList();

  const offers = document.querySelector('[data-room-offers]');
  if (offers) {
    offers.innerHTML = content.roomTypes.map((room) => `<article class="offer-card room-offer-card">
      <div class="offer-photo room-photo-stack">
        <button type="button" data-room-gallery="${escapeHtml(room.pmsRoomTypeId)}" aria-label="${escapeHtml(room.name)} 사진 ${room.images.length}장 보기"><img src="${escapeHtml(room.images[0].src)}" alt="${escapeHtml(room.images[0].alt)}"><span class="room-photo-count">사진 ${room.images.length}장</span></button>
        <div class="room-photo-thumbs" aria-hidden="true">${room.images.slice(1, 4).map((image) => `<img src="${escapeHtml(image.src)}" alt="">`).join('')}</div>
      </div>
      <div class="offer-info">
        <div class="room-title-line"><h3>${escapeHtml(room.name)}</h3><button type="button" class="room-detail-link" data-room-gallery="${escapeHtml(room.pmsRoomTypeId)}">객실 자세히</button></div>
        <small>${room.sizeM2}㎡ · ${escapeHtml(room.bed)} · ${escapeHtml(room.occupancy)} · ${escapeHtml(room.view)}</small>
        <div class="offer-bullets">${room.highlights.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
        <div class="room-amenity-preview">${room.amenities.slice(0, 4).map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      </div>
      <div class="offer-price">
        <span class="stock">${room.available > 0 ? `잔여 ${room.available}객실` : '매진'}</span><small>3박 총액</small><strong>${room.total.toLocaleString('ko-KR')}원</strong><em>1박 평균 ${room.rate.toLocaleString('ko-KR')}원</em>
        <span class="room-data-source">PMS 재고 · ${new Date(room.inventoryCheckedAt).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})} 확인</span>
        <a class="ui-button primary${room.available < 1 ? ' is-disabled' : ''}" href="${room.available > 0 ? `booking-guests.html?roomTypeId=${encodeURIComponent(room.pmsRoomTypeId)}` : '#'}" ${room.available < 1 ? 'aria-disabled="true"' : ''}>${room.available > 0 ? '예약 화면 보기' : '현재 매진'}</a>
      </div>
    </article>`).join('');
    offers.addEventListener('click', (event) => {
      const button = event.target.closest('[data-room-gallery]');
      if (!button) return;
      const room = content.roomTypes.find((item) => item.pmsRoomTypeId === button.dataset.roomGallery);
      if (!room) return;
      const facts = `<span><b>${room.sizeM2}㎡</b> 객실 크기</span><span><b>${escapeHtml(room.bed)}</b> 침대</span><span><b>${escapeHtml(room.occupancy)}</b> 정원</span><span><b>${escapeHtml(room.view)}</b> 전망</span><span><b>${escapeHtml(room.bathroom)}</b> 욕실</span>`;
      openGallery(room.name, room.images, facts);
    });
  }
})();
