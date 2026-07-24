(() => {
  const h = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));

  const typeLabel = {
    HOTEL: '호텔·리조트',
    GOLF: '골프장',
    VEHICLE: '차량·공항 픽업',
    RESTAURANT: '맛집·카페',
    SPA: '마사지·스파',
    TOUR: '투어·체험'
  };

  const bookingLabel = {
    INSTANT_BOOKING: '즉시 예약',
    INFORMATION_ONLY: '정보 확인 후 예약',
    CONTACT_REQUEST: '배차 요청',
    PHONE_OR_MESSENGER: '테이블 예약 요청',
    REQUEST_BOOKING: '예약 요청',
    EXTERNAL_LINK: '일정 확인 후 예약'
  };

  const readLocal = (key, fallback = []) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const money = (value, currency = 'KRW') => {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) return '가격 문의';
    return `${Number(value).toLocaleString('ko-KR')}${currency === 'KRW' ? '원' : ` ${currency}`}`;
  };

  const imageGallery = (profile) => {
    const images = profile.gallery?.slice(0, 5) || [profile.cover];
    return `<div class="place-gallery-strip">${images.map((src, index) => (
      `<button type="button" data-gallery-image="${h(src)}" aria-label="${h(profile.name)} 사진 ${index + 1} 크게 보기"><img src="${h(src)}" alt="${h(profile.name)} ${index + 1}번째 사진"></button>`
    )).join('')}</div>`;
  };

  const facts = (profile) => [
    ['주소', profile.address],
    ['운영시간', profile.hours],
    ['문의', profile.contact],
    ['지원 언어', profile.languages],
    ['예약 방식', profile.booking],
    ['주변 이동', profile.nearby]
  ].map(([label, value]) => (
    `<article class="place-fact"><small>${h(label)}</small><strong>${h(value)}</strong></article>`
  )).join('');

  const optionPrice = (option) => {
    if (option.priceType === 'REQUEST_QUOTE') return '견적 요청';
    if (option.priceType === 'TO_BE_CONFIRMED') return '추후 확정';
    if (option.priceType === 'PAY_ON_SITE') return '현장 결제';
    return money(option.price);
  };

  const marketplaceOptions = (catalog, profile) => {
    if (!catalog?.options?.length) return '';
    return `<section class="content-section place-service-section">
      <div class="content-section-head">
        <div>
          <span class="page-eyebrow">SERVICES & PRICES</span>
          <h2>상품과 이용 가격</h2>
          <p>서비스 구성과 포함 사항, 가능한 시간을 비교해 선택할 수 있습니다.</p>
        </div>
        <a class="ui-button primary" href="${h(profile.detailHref)}">전체 옵션과 예약 보기</a>
      </div>
      <div class="place-service-preview-grid">
        ${catalog.options.map((option) => `<article class="place-service-preview">
          <img src="${h(option.image)}" alt="${h(option.name)}">
          <div>
            <small>${h(option.unit)}</small>
            <h3>${h(option.name)}</h3>
            <p>${h(option.description)}</p>
            <div class="offer-bullets">${option.includes.map((item) => `<span>${h(item)}</span>`).join('')}</div>
            <div class="place-service-price"><strong>${h(optionPrice(option))}</strong><span>${h(option.slots?.[0] || '일정 확인 후 예약')}</span></div>
          </div>
        </article>`).join('')}
      </div>
    </section>`;
  };

  const hotelOptions = (hotel, profile) => {
    if (!hotel?.roomTypes?.length) return '';
    return `<section class="content-section place-service-section">
      <div class="content-section-head">
        <div>
          <span class="page-eyebrow">ROOMS & RATES</span>
          <h2>객실과 요금</h2>
          <p>객실 사진과 정원, 남은 수량, PMS 기준 요금을 확인할 수 있습니다.</p>
        </div>
        <a class="ui-button primary" href="${h(profile.detailHref)}">객실 전체 보기</a>
      </div>
      <div class="place-service-preview-grid">
        ${hotel.roomTypes.map((room) => `<article class="place-service-preview">
          <img src="${h(room.images?.[0]?.src || profile.cover)}" alt="${h(room.images?.[0]?.alt || room.name)}">
          <div>
            <small>${h(room.sizeM2)}㎡ · ${h(room.bed)} · ${h(room.occupancy)}</small>
            <h3>${h(room.name)}</h3>
            <p>${h(room.view)} · ${h(room.bathroom)}</p>
            <div class="offer-bullets">${room.highlights.slice(0, 3).map((item) => `<span>${h(item)}</span>`).join('')}</div>
            <div class="place-service-price"><strong>${money(room.rate, room.currency)}부터</strong><span>${room.available > 0 ? `남은 객실 ${h(room.available)}개` : '현재 매진'}</span></div>
          </div>
        </article>`).join('')}
      </div>
    </section>`;
  };

  const bindGallery = (root) => {
    const heroImage = root.querySelector('[data-place-hero-image]');
    root.querySelectorAll('[data-gallery-image]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!heroImage) return;
        heroImage.src = button.dataset.galleryImage;
        root.querySelectorAll('[data-gallery-image]').forEach((item) => item.classList.toggle('is-active', item === button));
      });
    });
    root.querySelector('[data-gallery-image]')?.classList.add('is-active');
  };

  const load = async () => {
    const [fixture, profileData, marketData, hotelData] = await Promise.all([
      window.HotelNGoMockAPI.get('partner-platform.json'),
      window.HotelNGoMockAPI.get('place-profiles.json'),
      window.HotelNGoMockAPI.get('marketplace-catalog.json'),
      window.HotelNGoMockAPI.get('hotel-content.json')
    ]);
    const ownership = readLocal('hotelngo.admin.mock.provider-ownership-overrides.v1', {});
    const providers = [...fixture.providers, ...readLocal('hotelngo.admin.mock.providers.v1')]
      .map((item) => ({
        ...item,
        ownershipStatus: ownership[item.id] || item.ownershipStatus,
        profile: profileData.profiles[item.id],
        catalog: marketData.products[item.businessType]
      }))
      .filter((item) => item.profile);

    const list = document.querySelector('[data-place-catalog]');
    if (list) {
      list.innerHTML = providers.map((item) => {
        const profile = item.profile;
        return `<article class="place-market-card" data-place-type="${h(item.businessType)}">
          <a class="place-market-cover" href="place-detail.html?id=${encodeURIComponent(item.id)}">
            <img src="${h(profile.cover)}" alt="${h(item.name)} 대표 이미지">
          </a>
          <div>
            <span class="status-chip ${item.partnerId ? '' : 'muted'}">${item.partnerId ? 'HotelnGo 인증 업체' : '정보 확인 업체'}</span>
            <small>${h(profile.typeLabel || typeLabel[item.businessType])} · ${h(item.city)}</small>
            <h2><a href="place-detail.html?id=${encodeURIComponent(item.id)}">${h(item.name)}</a></h2>
            <p>${h(profile.tagline)}</p>
            <div class="place-market-meta"><strong>${h(profile.priceLine)}</strong><span>${h(bookingLabel[item.bookingMode] || profile.booking)}</span></div>
            <div class="place-market-actions">
              <a class="ui-button primary" href="place-detail.html?id=${encodeURIComponent(item.id)}">상세 보기</a>
              <button class="ui-button" type="button" data-save-item data-save-id="${h(item.id)}">저장</button>
            </div>
          </div>
        </article>`;
      }).join('');

      document.querySelectorAll('[data-place-filter]').forEach((button) => button.addEventListener('click', () => {
        const type = button.dataset.placeFilter;
        document.querySelectorAll('[data-place-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
        list.querySelectorAll('[data-place-type]').forEach((card) => {
          card.hidden = type !== 'ALL' && card.dataset.placeType !== type;
        });
      }));
      const requestedType = new URLSearchParams(location.search).get('category')?.toUpperCase();
      const requestedFilter = requestedType && document.querySelector(`[data-place-filter="${requestedType}"]`);
      requestedFilter?.click();
    }

    const detail = document.querySelector('[data-place-detail]');
    if (!detail) return;
    const id = new URLSearchParams(location.search).get('id') || providers[0]?.id;
    const item = providers.find((provider) => provider.id === id);
    if (!item) {
      detail.innerHTML = '<div class="empty-state"><strong>업체를 찾지 못했습니다.</strong><p>목록에서 다른 업체를 선택해 주세요.</p><a class="ui-button primary" href="places.html">업체 목록 보기</a></div>';
      return;
    }

    const profile = item.profile;
    const catalog = item.catalog;
    const score = item.businessType === 'HOTEL' ? hotelData.reviewSummary : catalog;
    const scoreValue = score?.score || score?.rating;
    const reviewCount = score?.count || score?.reviews;
    const services = item.businessType === 'HOTEL'
      ? hotelOptions(hotelData, profile)
      : marketplaceOptions(catalog, profile);
    const isClaimed = Boolean(item.partnerId) || item.ownershipStatus === 'CLAIMED';

    document.title = `${item.name} · HotelnGo`;
    detail.innerHTML = `<section class="place-detail-hero place-public-hero">
        <div>
          <img src="${h(profile.cover)}" alt="${h(item.name)} 대표 이미지" data-place-hero-image>
          ${imageGallery(profile)}
        </div>
        <div>
          <span class="page-eyebrow">${h(profile.typeLabel || typeLabel[item.businessType])} · ${h(item.city)}</span>
          <h1>${h(item.name)}</h1>
          <p class="place-detail-tagline">${h(profile.tagline)}</p>
          ${scoreValue ? `<div class="hotel-score"><span><strong>${h(scoreValue >= 9 ? '여행자 추천' : '후기 평점')}</strong><small>${Number(reviewCount || 0).toLocaleString('ko-KR')}개 후기</small></span><b>${h(scoreValue)}</b></div>` : ''}
          <div class="place-price-line"><strong>${h(profile.priceLine)}</strong><span>${h(bookingLabel[item.bookingMode] || profile.booking)}</span></div>
          <div class="place-market-actions">
            <button class="ui-button primary" type="button" data-add-trip data-place-id="${h(item.id)}">내 여행에 담기</button>
            <button class="ui-button" type="button" data-save-item data-save-id="${h(item.id)}">저장</button>
            <a class="ui-button" href="${h(profile.detailHref)}">${item.businessType === 'HOTEL' ? '객실 예약 보기' : '옵션 예약 보기'}</a>
          </div>
        </div>
      </section>
      <section class="content-section">
        <div class="content-section-head"><div><span class="page-eyebrow">VISITOR INFORMATION</span><h2>방문 전 확인하세요</h2></div></div>
        <div class="place-public-facts">${facts(profile)}</div>
      </section>
      <section class="content-section place-overview-grid">
        <div>
          <span class="page-eyebrow">ABOUT</span>
          <h2>업체 소개</h2>
          <p>${h(profile.description)}</p>
        </div>
        <div>
          <h3>이곳을 선택하는 이유</h3>
          <ul class="place-detail-list">${profile.highlights.map((value) => `<li>${h(value)}</li>`).join('')}</ul>
        </div>
        <div>
          <h3>시설·제공 서비스</h3>
          <div class="facility-chips">${profile.facilities.map((value) => `<span>${h(value)}</span>`).join('')}</div>
        </div>
      </section>
      ${services}
      <section class="content-section place-policy-section">
        <div class="content-section-head"><div><span class="page-eyebrow">POLICIES</span><h2>예약·이용 안내</h2></div></div>
        <ul class="place-detail-list">${profile.policies.map((value) => `<li>${h(value)}</li>`).join('')}</ul>
      </section>
      <section class="content-section place-source-note">
        <div>
          <small>정보 출처·확인 기준</small>
          <strong>${h(profile.sourceLabel)}</strong>
          <p>${h(profile.sourceNote)}</p>
        </div>
        <div>
          <small>최근 확인</small>
          <strong>${h(item.lastVerifiedAt || '확인 중')}</strong>
          <p>실제 예약 가능 여부와 최종 가격은 예약 단계에서 다시 확인합니다.</p>
        </div>
      </section>
      <section class="identity-boundary">
        <strong>${isClaimed ? '업체 운영 권한이 확인되었습니다.' : '이 업체의 운영자이신가요?'}</strong>
        <span>${isClaimed ? '업체가 공개 정보와 상품을 직접 관리합니다.' : '기존 후기·저장·스토리를 유지한 채 업체 정보 관리 권한을 요청할 수 있습니다.'}</span>
        ${isClaimed ? '' : '<a class="ui-button" href="partner-claim.html">업체 페이지 인수 요청</a>'}
      </section>`;

    bindGallery(detail);
  };

  load().catch((error) => {
    console.error(error);
    const root = document.querySelector('[data-place-catalog], [data-place-detail]');
    if (root) root.innerHTML = '<div class="empty-state"><strong>업체 정보를 불러오지 못했습니다.</strong><p>새로고침 후 다시 시도해 주세요.</p></div>';
  });
})();
