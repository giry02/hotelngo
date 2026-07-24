(() => {
  const root = document.querySelector('[data-marketplace-detail]');
  if (!root) return;

  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
  const type = document.body.dataset.marketplaceType;
  const typeLabel = {
    GOLF: '골프장',
    VEHICLE: '차량·공항 픽업',
    RESTAURANT: '맛집·카페',
    SPA: '마사지·스파',
    TOUR: '투어·체험'
  };

  const priceText = (option) => {
    if (option.priceType === 'REQUEST_QUOTE') return '요청 후 견적';
    if (option.priceType === 'TO_BE_CONFIRMED') return '추후 확정';
    if (option.priceType === 'PAY_ON_SITE') return '현장 결제';
    return `${Number(option.price).toLocaleString('ko-KR')}원`;
  };

  const profileFacts = (profile) => [
    ['주소', profile.address],
    ['운영시간', profile.hours],
    ['문의', profile.contact],
    ['지원 언어', profile.languages],
    ['예약 방식', profile.booking],
    ['주변 이동', profile.nearby]
  ].map(([label, value]) => (
    `<article class="place-fact"><small>${h(label)}</small><strong>${h(value)}</strong></article>`
  )).join('');

  const load = async () => {
    const [catalog, profiles] = await Promise.all([
      window.HotelNGoMockAPI.get('marketplace-catalog.json'),
      window.HotelNGoMockAPI.get('place-profiles.json')
    ]);
    const data = catalog.products[type];
    const profile = data && profiles.profiles[data.providerId];
    if (!data || !profile) throw new Error('Marketplace detail profile is missing.');

    document.title = `${data.name} · HotelnGo`;
    root.innerHTML = `<section class="marketplace-hero">
        <img src="${h(data.cover)}" alt="${h(data.name)} 대표 이미지">
        <div>
          <span class="page-eyebrow">${h(typeLabel[type])} · ${h(data.location)}</span>
          <h1>${h(data.name)}</h1>
          <p>${h(profile.tagline)}</p>
          <div class="hotel-score"><span><strong>여행자 추천</strong><small>${Number(data.reviews).toLocaleString('ko-KR')}개 후기</small></span><b>${h(data.rating)}</b></div>
          <p class="marketplace-summary">${h(data.summary)}</p>
          <div class="place-price-line"><strong>${h(profile.priceLine)}</strong><span>${h(profile.booking)}</span></div>
          <div class="page-head-actions">
            <button class="ui-button" type="button" data-save-item data-save-id="${h(data.providerId)}">저장</button>
            <a class="ui-button" href="place-detail.html?id=${encodeURIComponent(data.providerId)}">업체 정보</a>
            <a class="ui-button primary" href="#choose">옵션 선택</a>
          </div>
        </div>
      </section>
      <nav class="detail-anchor-nav"><div class="shell">
        <a href="#information">업체 안내</a>
        <a href="#choose">상품·옵션</a>
        <a href="#bundle">호텔 결합 혜택</a>
        <a href="#policy">예약 방식</a>
      </div></nav>
      <section class="marketplace-section" id="information">
        <div class="content-section-head"><div><span class="page-eyebrow">VISITOR INFORMATION</span><h2>업체 이용 안내</h2><p>방문 전 주소, 운영시간과 예약 방식을 확인하세요.</p></div></div>
        <div class="place-public-facts">${profileFacts(profile)}</div>
        <div class="place-overview-grid marketplace-profile-grid">
          <div><span class="page-eyebrow">ABOUT</span><h2>업체 소개</h2><p>${h(profile.description)}</p></div>
          <div><h3>주요 특징</h3><ul class="place-detail-list">${profile.highlights.map((value) => `<li>${h(value)}</li>`).join('')}</ul></div>
          <div><h3>제공 서비스</h3><div class="facility-chips">${profile.facilities.map((value) => `<span>${h(value)}</span>`).join('')}</div></div>
        </div>
      </section>
      <section class="marketplace-section" id="choose">
        <div class="content-section-head"><div><span class="page-eyebrow">CHOOSE YOUR OPTION</span><h2>무엇을 예약할까요?</h2><p>업종에 맞는 상품, 포함사항과 가능한 시간을 비교해 선택하세요.</p></div></div>
        <div class="marketplace-options">${data.options.map((option) => `<article class="marketplace-option">
          <img src="${h(option.image)}" alt="${h(option.name)}">
          <div class="marketplace-option-copy">
            <span class="status-chip">${h(option.priceType.replaceAll('_', ' '))}</span>
            <h3>${h(option.name)}</h3>
            <p>${h(option.description)}</p>
            <div class="offer-bullets">${option.includes.map((item) => `<span>${h(item)}</span>`).join('')}</div>
            <label>예약 가능 시간
              <select data-slot-select>
                <option value="">시간을 선택하세요</option>
                ${option.slots.map((slot) => `<option>${h(slot)}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="marketplace-option-price">
            <small>${h(option.unit)}</small>
            <strong>${h(priceText(option))}</strong>
            <div class="option-extras"><span>추가 선택</span>${data.extras.map((extra) => (
              `<label><input type="checkbox" value="${h(extra.id)}" data-extra-price="${h(extra.price)}"> ${h(extra.name)}${extra.price ? ` +${Number(extra.price).toLocaleString('ko-KR')}원` : ''}</label>`
            )).join('')}</div>
            <button class="ui-button primary" type="button" data-add-marketplace="${h(option.id)}" data-option-name="${h(option.name)}" data-price="${h(option.price)}">여행 카트에 담기</button>
          </div>
        </article>`).join('')}</div>
      </section>
      <section class="marketplace-section bundle-section" id="bundle">
        <div><span class="page-eyebrow">STAY + EXPERIENCE</span><h2>${h(data.bundle.title)}</h2><p>${h(data.bundle.description)}</p></div>
        <span class="bundle-value">${typeof data.bundle.value === 'number' ? `${Number(data.bundle.value).toLocaleString('ko-KR')}원` : h(data.bundle.value)}</span>
      </section>
      <section class="marketplace-section" id="policy">
        <div class="content-section-head"><div><h2>예약과 가격 확정 방식</h2><p>고정가·시작가·견적요청을 구분하고 확정되지 않은 가격을 임의 표시하지 않습니다.</p></div></div>
        <div class="marketplace-policy-grid">
          <article><strong>즉시예약</strong><p>선택한 슬롯과 수용량을 다시 확인한 뒤 카트·결제로 이동합니다.</p></article>
          <article><strong>요청예약·견적</strong><p>업체 확인 전에는 예약 완료나 결제 확정으로 표시하지 않습니다.</p></article>
          <article><strong>정산 연결</strong><p>이용 완료 후 판매가, 할인, 수수료, 세금과 파트너 지급액을 분리합니다.</p></article>
        </div>
        <ul class="place-detail-list marketplace-profile-policies">${profile.policies.map((value) => `<li>${h(value)}</li>`).join('')}</ul>
        <div class="place-source-note marketplace-source-note">
          <div><small>정보 출처·확인 기준</small><strong>${h(profile.sourceLabel)}</strong><p>${h(profile.sourceNote)}</p></div>
          <div><small>최종 확인</small><strong>${h(catalog.updatedAt.slice(0, 10))}</strong><p>가격과 이용 가능 여부는 예약 요청 또는 결제 전에 다시 확인합니다.</p></div>
        </div>
      </section>`;

    root.querySelectorAll('[data-add-marketplace]').forEach((button) => button.addEventListener('click', () => {
      const card = button.closest('.marketplace-option');
      const slot = card.querySelector('[data-slot-select]').value;
      if (!slot) {
        card.querySelector('[data-slot-select]').focus();
        window.HotelNGoUI?.toast?.('예약 시간 또는 확인 방식을 선택해 주세요.');
        return;
      }
      const extras = [...card.querySelectorAll('input[type="checkbox"]:checked')]
        .map((input) => input.parentElement.textContent.trim());
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem('hotelngo.marketplace.cart.v1') || '[]');
      } catch {}
      cart.push({
        type,
        providerId: data.providerId,
        placeId: data.placeId,
        productId: button.dataset.addMarketplace,
        name: button.dataset.optionName,
        slot,
        extras,
        price: Number(button.dataset.price),
        status: 'DRAFT',
        addedAt: new Date().toISOString()
      });
      localStorage.setItem('hotelngo.marketplace.cart.v1', JSON.stringify(cart));
      window.HotelNGoUI?.toast?.(`${button.dataset.optionName}을 여행 카트에 담았습니다.`);
    }));
  };

  load().catch((error) => {
    console.error(error);
    root.innerHTML = '<div class="empty-state"><strong>상품 정보를 불러오지 못했습니다.</strong><p>새로고침 후 다시 시도해 주세요.</p></div>';
  });
})();
