(() => {
  const root = document.querySelector('[data-trip-card-root]');
  const store = window.HotelNGoTripCard;
  const api = window.HotelNGoMockAPI;
  if (!root || !store || !api) return;
  const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const labels = { STAY: '숙소', LANDMARK: '랜드마크', FOOD: '식사·카페', GOLF: '골프', SPA: '마사지·스파', TOUR: '투어·체험', TRANSPORT: '이동' };
  const icons = { STAY: '▣', LANDMARK: '⌖', FOOD: '♨', GOLF: '⚑', SPA: '✦', TOUR: '◇', TRANSPORT: '↗' };
  const destinationNames = { danang: '다낭', bangkok: '방콕', bali: '발리' };
  let catalog;
  let activeDestination = 'danang';
  let selected = new Set();
  let selectionInitialized = false;

  const catalogDestination = () => catalog.destinations.find((item) => item.id === activeDestination) || catalog.destinations[0];
  const records = () => store.list().filter((item) => item.destinationId === activeDestination);
  const catalogItem = (sourceId) => catalogDestination().items.find((item) => item.id === sourceId);
  const displayPrice = (item) => item.priceLabel || (item.basePrice ? `기본 ${Number(item.basePrice).toLocaleString('ko-KR')}원` : '무료·현장 확인');
  const recommendedLists = () => catalog.destinations.map((destination) => ({
    id: destination.id,
    title: `${destination.name} ${destination.recommendedNights}박 ${destination.recommendedNights + 1}일 추천 여행`,
    description: destination.summary,
    cover: destination.cover,
    count: new Set(destination.template.map((entry) => entry.itemId)).size,
    badges: destination.items.filter((item) => item.category === 'LANDMARK').slice(0, 3).map((item) => item.title)
  }));
  const addTemplate = (destinationId) => {
    const destination = catalog.destinations.find((item) => item.id === destinationId);
    destination.template.forEach((entry) => {
      const item = destination.items.find((candidate) => candidate.id === entry.itemId);
      if (!item) return;
      store.add({ ...item, sourceId: item.id, destinationId, destination: destination.name, options: { preferredDay: entry.day, preferredTime: entry.time } });
    });
    activeDestination = destinationId;
    selectionInitialized = false;
    render();
  };
  const optionFields = (item) => ({
    STAY: [['객실', ['디럭스 오션뷰', '패밀리룸', '스위트']], ['식사', ['조식 포함', '객실만']], ['취소', ['무료 취소', '특가·환불 불가']]],
    GOLF: [['라운드', ['18홀', '9홀']], ['포함', ['캐디·카트 포함', '그린피만']], ['희망 시간', ['오전', '오후']]],
    FOOD: [['이용', ['테이블 예약', '코스·세트 상담']], ['시간', ['점심', '저녁']]],
    SPA: [['프로그램', ['아로마 90분', '타이 60분', '커플 120분']], ['픽업', ['호텔 픽업 요청', '직접 방문']]],
    TOUR: [['유형', ['그룹 투어', '프라이빗']], ['언어', ['한국어', '영어']]],
    TRANSPORT: [['차량', ['세단', 'SUV', '밴']], ['이용', ['편도', '왕복', '시간 대절']]],
    LANDMARK: [['방문 시간', ['오전', '오후', '저녁']], ['속도', ['핵심만', '여유롭게']]]
  }[item.category] || [['선호', ['기본 추천', '직접 상담']]]);
  const openOptions = (item) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'trip-card-dialog';
    const fields = optionFields(item);
    dialog.innerHTML = `<form method="dialog"><header><div><small>${labels[item.category] || '여행 장소'} 선호 설정</small><h2>${escapeHtml(item.title)}</h2></div><button value="cancel" aria-label="닫기">×</button></header><div class="trip-card-dialog-body"><img src="${escapeHtml(item.image)}" alt=""><p>${escapeHtml(item.description || '일정에 담을 조건을 선택해 두면 추천 동선을 만들 때 우선 반영합니다.')}</p><div class="trip-card-option-grid">${fields.map(([label, options], index) => `<label><span>${label}</span><select name="option${index}">${options.map((value) => `<option>${value}</option>`).join('')}</select></label>`).join('')}</div><div class="trip-card-boundary"><strong>지금은 여행 선호를 정하는 단계입니다.</strong><span>객실 재고·최종 가격·취소 조건은 실제 예약할 때 다시 확인합니다.</span></div></div><footer><button class="ui-button" value="cancel">취소</button><button class="ui-button primary" value="save">선호 저장</button></footer></form>`;
    document.body.append(dialog);
    dialog.addEventListener('close', () => {
      if (dialog.returnValue === 'save') {
        const values = Object.fromEntries(new FormData(dialog.querySelector('form')).entries());
        api.upsert(store.domain, { ...item, options: values });
        render();
      }
      dialog.remove();
    });
    dialog.showModal();
  };
  const render = () => {
    const all = store.list();
    if (!all.some((item) => item.destinationId === activeDestination) && all[0]) activeDestination = all[0].destinationId;
    const items = records();
    selected = selectionInitialized ? new Set(items.filter((item) => selected.has(item.id)).map((item) => item.id)) : new Set(items.map((item) => item.id));
    selectionInitialized = true;
    const countBy = (category) => items.filter((item) => item.category === category).length;
    const estimated = items.filter((item) => selected.has(item.id)).reduce((sum, item) => sum + Number(item.basePrice || 0), 0);
    const selectedSourceIds = items.filter((item) => selected.has(item.id)).map((item) => item.sourceId).join(',');
    root.innerHTML = `<header class="trip-card-hero"><div><span class="page-eyebrow">MY TRAVEL CARD</span><h1>가고 싶은 곳을 담아두면,<br>추천 동선부터 만들어드려요</h1><p>랜드마크·호텔·맛집·골프·스파를 한곳에 모으세요. 여행 카드는 예약 목록이 아니라 나만의 여행 재료 보관함입니다.</p></div><a class="ui-button" href="discover.html">장소 더 둘러보기</a></header>
      <nav class="trip-card-destinations" aria-label="여행 지역">${catalog.destinations.map((destination) => `<button type="button" class="${destination.id === activeDestination ? 'is-active' : ''}" data-destination="${destination.id}"><strong>${destination.name}</strong><span>${store.list().filter((item) => item.destinationId === destination.id).length}개 담음</span></button>`).join('')}</nav>
      <section class="trip-card-layout"><div class="trip-card-content">
        <div class="trip-card-section-head"><div><span class="page-eyebrow">SAVED FIRST</span><h2>${destinationNames[activeDestination] || catalogDestination().name}에서 내가 담은 곳</h2><p>내가 담은 랜드마크를 우선 배치하고 빈 시간은 다른 여행자 데이터와 HotelnGo 추천으로 채웁니다.</p></div><span class="trip-card-count">${items.length}곳</span></div>
        ${items.length ? `<div class="trip-card-items">${items.map((item) => `<article class="trip-card-item ${selected.has(item.id) ? 'is-selected' : ''}"><label class="trip-card-select"><input type="checkbox" data-select="${escapeHtml(item.id)}" ${selected.has(item.id) ? 'checked' : ''}><span>일정 초안에 포함</span></label><img src="${escapeHtml(item.image)}" alt=""><div class="trip-card-item-copy"><small>${icons[item.category] || '•'} ${labels[item.category] || item.category} · ${escapeHtml(item.area)}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || '담아둔 장소를 추천 동선에 우선 반영합니다.')}</p><div><b>${escapeHtml(displayPrice(item))}</b><span>${item.options && Object.keys(item.options).length ? '선호 옵션 저장됨' : '기본 조건'}</span></div></div><div class="trip-card-item-actions"><button class="ui-button" type="button" data-options="${escapeHtml(item.id)}">옵션·선호</button><button class="text-button" type="button" data-remove="${escapeHtml(item.id)}">삭제</button></div></article>`).join('')}</div>` : `<div class="trip-card-empty"><span>＋</span><h3>아직 ${catalogDestination().name}에서 담은 곳이 없어요</h3><p>처음부터 하나씩 고르지 않아도 됩니다. 아래 추천 여행을 통째로 담은 뒤 빼거나 바꿔보세요.</p></div>`}
        <section class="trip-card-recommend"><div class="trip-card-section-head"><div><span class="page-eyebrow">START WITH A GOOD DRAFT</span><h2>다른 여행자와 HotelnGo가 만든 추천 리스트</h2><p>완성된 여행을 먼저 담고 내 취향에 맞게 수정하는 가장 쉬운 시작입니다.</p></div><a href="community.html">여행자 가이드 더 보기</a></div><div class="trip-card-recommend-grid">${recommendedLists().map((list) => `<article><img src="${escapeHtml(list.cover)}" alt=""><div><small>${list.id === activeDestination ? '이 지역 추천' : '다른 지역'}</small><h3>${escapeHtml(list.title)}</h3><p>${escapeHtml(list.description)}</p><div class="trip-card-chips">${list.badges.map((badge) => `<span>${escapeHtml(badge)}</span>`).join('')}</div><button class="ui-button ${list.id === activeDestination ? 'primary' : ''}" type="button" data-add-list="${list.id}">추천 리스트 ${list.count}개 담기</button></div></article>`).join('')}</div></section>
      </div><aside class="trip-card-summary"><span class="page-eyebrow">ROUTE DRAFT</span><h2>${catalogDestination().name} 추천 일정 만들기</h2><div class="trip-card-summary-counts"><div><span>랜드마크</span><strong>${countBy('LANDMARK')}</strong></div><div><span>숙소</span><strong>${countBy('STAY')}</strong></div><div><span>서비스</span><strong>${items.length - countBy('LANDMARK') - countBy('STAY')}</strong></div></div><p>선택한 ${selected.size}곳을 우선 배치하고, 이동거리·영업시간·빈 식사 시간을 고려해 초안을 만듭니다.</p><div class="trip-card-estimate"><span>기본 표시 금액 합계</span><strong>${estimated.toLocaleString('ko-KR')}원</strong><small>객실·인원·서비스 옵션에 따라 달라집니다.</small></div><a class="ui-button primary${selected.size ? '' : ' is-disabled'}" href="${selected.size ? `trip-planner.html?destination=${activeDestination}&mode=recommended&fromCard=1&cardIds=${encodeURIComponent(selectedSourceIds)}` : '#'}" ${selected.size ? '' : 'aria-disabled="true"'}>추천 일정 먼저 만들기</a><a class="ui-button" href="trip-create.html?destination=${encodeURIComponent(catalogDestination().name)}">날짜·인원부터 정하기</a><div class="trip-card-booking-boundary"><strong>실제 예약은 따로 진행합니다</strong><p>일정이 완성된 뒤 객실·티타임·프로그램을 선택하면 예약 카트로 이동합니다.</p><a href="booking-cart.html">예약 카트 보기</a></div></aside></section>`;
  };
  root.addEventListener('click', (event) => {
    const destination = event.target.closest('[data-destination]'); if (destination) { activeDestination = destination.dataset.destination; selectionInitialized = false; render(); return; }
    const addList = event.target.closest('[data-add-list]'); if (addList) { addTemplate(addList.dataset.addList); return; }
    const remove = event.target.closest('[data-remove]'); if (remove) { store.remove(remove.dataset.remove); selected.delete(remove.dataset.remove); render(); return; }
    const options = event.target.closest('[data-options]'); if (options) { const item = store.list().find((candidate) => candidate.id === options.dataset.options); if (item) openOptions(item); }
  });
  root.addEventListener('change', (event) => { if (event.target.matches('[data-select]')) { event.target.checked ? selected.add(event.target.dataset.select) : selected.delete(event.target.dataset.select); render(); } });
  api.get('trip-planner-catalog.json').then((data) => { catalog = data; const query = new URLSearchParams(location.search); activeDestination = query.get('destination') || store.list()[0]?.destinationId || 'danang'; render(); });
})();
