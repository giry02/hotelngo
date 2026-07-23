(() => {
  const root = document.querySelector('[data-marketplace-detail]');
  if (!root) return;
  const type = document.body.dataset.marketplaceType;
  const priceText = (option) => {
    if (option.priceType === 'REQUEST_QUOTE') return '요청 후 견적';
    if (option.priceType === 'TO_BE_CONFIRMED') return '추후 확정';
    if (option.priceType === 'PAY_ON_SITE') return '현장 결제';
    return `${option.priceType === 'FROM_PRICE' ? '' : ''}${option.price.toLocaleString('ko-KR')}원`;
  };
  const load = async () => {
    const catalog = await window.HotelNGoMockAPI.get('marketplace-catalog.json');
    const data = catalog.products[type];
    if (!data) return;
    document.title = `${data.name} · HotelnGo`;
    root.innerHTML = `<section class="marketplace-hero"><img src="${data.cover}" alt="${data.name}"><div><span class="page-eyebrow">${type} · VERIFIED PLACE</span><h1>${data.name}</h1><p>${data.location}</p><div class="hotel-score"><span><strong>여행자 추천</strong><small>${data.reviews.toLocaleString('ko-KR')}개 후기</small></span><b>${data.rating}</b></div><p class="marketplace-summary">${data.summary}</p><div class="page-head-actions"><button class="ui-button" type="button" data-save-item>저장</button><a class="ui-button primary" href="#choose">옵션 선택</a></div></div></section>
      <nav class="detail-anchor-nav"><div class="shell"><a href="#choose">상품·옵션</a><a href="#bundle">호텔 결합 혜택</a><a href="#policy">예약 방식</a></div></nav>
      <section class="marketplace-section" id="choose"><div class="content-section-head"><div><span class="page-eyebrow">CHOOSE YOUR OPTION</span><h2>무엇을 예약할까요?</h2><p>업종에 맞는 상품, 포함사항과 가능한 시간을 비교해 선택하세요.</p></div></div><div class="marketplace-options">${data.options.map((option, index) => `<article class="marketplace-option"><img src="${option.image}" alt="${option.name}"><div class="marketplace-option-copy"><span class="status-chip">${option.priceType.replaceAll('_',' ')}</span><h3>${option.name}</h3><p>${option.description}</p><div class="offer-bullets">${option.includes.map((item) => `<span>${item}</span>`).join('')}</div><label>예약 가능 시간<select data-slot-select><option value="">시간을 선택하세요</option>${option.slots.map((slot) => `<option>${slot}</option>`).join('')}</select></label></div><div class="marketplace-option-price"><small>${option.unit}</small><strong>${priceText(option)}</strong><div class="option-extras"><span>추가 선택</span>${data.extras.map((extra) => `<label><input type="checkbox" value="${extra.id}" data-extra-price="${extra.price}"> ${extra.name}${extra.price ? ` +${extra.price.toLocaleString('ko-KR')}원` : ''}</label>`).join('')}</div><button class="ui-button primary" type="button" data-add-marketplace="${option.id}" data-option-name="${option.name}" data-price="${option.price}">여행 카트에 담기</button></div></article>`).join('')}</div></section>
      <section class="marketplace-section bundle-section" id="bundle"><div><span class="page-eyebrow">STAY + EXPERIENCE</span><h2>${data.bundle.title}</h2><p>${data.bundle.description}</p></div><span class="bundle-value">${typeof data.bundle.value === 'number' ? `${data.bundle.value.toLocaleString('ko-KR')}원` : data.bundle.value}</span></section>
      <section class="marketplace-section" id="policy"><div class="content-section-head"><div><h2>예약과 가격 확정 방식</h2><p>고정가·시작가·견적요청을 구분하고 확정되지 않은 가격을 임의 표시하지 않습니다.</p></div></div><div class="marketplace-policy-grid"><article><strong>즉시예약</strong><p>선택한 슬롯과 수용량을 다시 확인한 뒤 카트·결제로 이동합니다.</p></article><article><strong>요청예약·견적</strong><p>업체 확인 전에는 예약 완료나 결제 확정으로 표시하지 않습니다.</p></article><article><strong>정산 연결</strong><p>이용 완료 후 판매가, 할인, 수수료, 세금과 파트너 지급액을 분리합니다.</p></article></div></section>`;
    root.querySelectorAll('[data-add-marketplace]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('.marketplace-option');
      const slot = card.querySelector('[data-slot-select]').value;
      if (!slot) { card.querySelector('[data-slot-select]').focus(); return window.HotelNGoUI?.toast?.('예약 시간 또는 확인 방식을 선택해 주세요.'); }
      const extras = [...card.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.parentElement.textContent.trim());
      let cart = [];
      try { cart = JSON.parse(localStorage.getItem('hotelngo.marketplace.cart.v1') || '[]'); } catch {}
      cart.push({ type, providerId:data.providerId, placeId:data.placeId, productId:button.dataset.addMarketplace, name:button.dataset.optionName, slot, extras, price:Number(button.dataset.price), status:'DRAFT', addedAt:new Date().toISOString() });
      localStorage.setItem('hotelngo.marketplace.cart.v1', JSON.stringify(cart));
      window.HotelNGoUI?.toast?.(`${button.dataset.optionName}을 여행 카트에 담았습니다.`);
    }));
  };
  load().catch(() => { root.innerHTML = '<div class="empty-state"><strong>상품 정보를 불러오지 못했습니다.</strong><p>새로고침 후 다시 시도해 주세요.</p></div>'; });
})();
