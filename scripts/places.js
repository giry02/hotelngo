(() => {
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const typeLabel = { HOTEL: '호텔', GOLF: '골프', VEHICLE: '차량·픽업', RESTAURANT: '맛집·카페', SPA: '마사지·스파', TOUR: '투어·체험' };
  const typeImage = { HOTEL: 'hero-hotel.jpg', GOLF: 'stay-gapyeong.jpg', VEHICLE: 'landmark-bangkok.jpg', RESTAURANT: 'landmark-bangkok.jpg', SPA: 'landmark-bali.jpg', TOUR: 'landmark-kyoto.jpg' };
  const readLocal = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const load = async () => {
    const fixture = await window.HotelNGoMockAPI.get('partner-platform.json');
    const ownership = readLocal('hotelngo.admin.mock.provider-ownership-overrides.v1', {});
    const providers = [...fixture.providers, ...readLocal('hotelngo.admin.mock.providers.v1')].map((item) => ({ ...item, ownershipStatus: ownership[item.id] || item.ownershipStatus }));
    const list = document.querySelector('[data-place-catalog]');
    if (list) {
      list.innerHTML = providers.map((item) => `<article class="place-market-card" data-place-type="${h(item.businessType)}"><img src="assets/images/${h(typeImage[item.businessType])}" alt=""><div><span class="status-chip ${item.partnerId ? '' : 'muted'}">${item.partnerId ? 'HotelnGo 인증 업체' : '정보 제공 장소'}</span><small>${h(typeLabel[item.businessType])} · ${h(item.city)}</small><h2>${h(item.name)}</h2><p>${item.partnerId ? '업체가 직접 최신 정보를 관리합니다.' : `최근 확인일 ${h(item.lastVerifiedAt || '미검수')} · 실시간 예약 미지원`}</p><div class="place-market-actions"><a class="ui-button primary" href="place-detail.html?id=${encodeURIComponent(item.id)}">상세 보기</a><button class="ui-button" type="button" data-save-item>저장</button></div></div></article>`).join('');
      document.querySelectorAll('[data-place-filter]').forEach((button) => button.addEventListener('click', () => {
        const type = button.dataset.placeFilter;
        document.querySelectorAll('[data-place-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
        list.querySelectorAll('[data-place-type]').forEach((card) => { card.hidden = type !== 'ALL' && card.dataset.placeType !== type; });
      }));
      const requestedType = new URLSearchParams(location.search).get('category')?.toUpperCase();
      const requestedFilter = requestedType && document.querySelector(`[data-place-filter="${requestedType}"]`);
      requestedFilter?.click();
    }
    const detail = document.querySelector('[data-place-detail]');
    if (detail) {
      const id = new URLSearchParams(location.search).get('id') || providers[0]?.id;
      const item = providers.find((provider) => provider.id === id);
      if (!item) { detail.innerHTML = '<div class="state-banner">장소를 찾지 못했습니다.</div>'; return; }
      detail.innerHTML = `<section class="place-detail-hero"><img src="assets/images/${h(typeImage[item.businessType])}" alt="${h(item.name)}"><div><span class="page-eyebrow">${h(typeLabel[item.businessType])} · ${h(item.city)}</span><h1>${h(item.name)}</h1><p>${item.partnerId ? 'HotelNGo 인증 파트너가 운영정보를 관리하는 장소입니다.' : '플랫폼이 출처를 확인해 제공하는 미입점 정보성 장소입니다.'}</p><div class="state-banner"><div><strong>${item.partnerId ? '업체 직접 관리' : '실시간 예약 미지원'}</strong><p>${item.partnerId ? h(item.bookingMode) : '일정에 저장하거나 공식 연락처로 문의할 수 있습니다.'}</p></div></div><div class="place-market-actions"><button class="ui-button primary" type="button" data-add-trip>내 여행에 담기</button><button class="ui-button" type="button" data-save-item>저장</button></div></div></section><section class="content-section"><div class="summary-cards"><div class="summary-card"><small>MANAGEMENT</small><strong>${h(item.managementType)}</strong><span>${h(item.ownershipStatus)}</span></div><div class="summary-card"><small>VERIFICATION</small><strong>${h(item.verificationStatus)}</strong><span>${h(item.sourceName)}</span></div><div class="summary-card"><small>LAST VERIFIED</small><strong>${h(item.lastVerifiedAt)}</strong><span>정보 최신성 기준일</span></div></div><div class="identity-boundary"><strong>이 업체의 운영자이신가요?</strong><span>새 페이지를 만들지 않고 기존 리뷰·저장·스토리 연결을 유지한 채 소유권을 요청할 수 있습니다.</span><a class="ui-button" href="partner-claim.html">업체 페이지 인수 요청</a></div></section>`;
      if (item.partnerId || item.ownershipStatus === 'CLAIMED') {
        const identity = detail.querySelector('.identity-boundary');
        identity.querySelector('strong').textContent = '업체 운영 권한이 확인되었습니다.';
        identity.querySelector('span').textContent = '기존 리뷰·저장·스토리 관계를 유지한 채 인증 파트너가 최신 운영정보를 관리합니다.';
        identity.querySelector('a')?.remove();
      }
    }
  };
  load();
})();
