(() => {
  const cache = new Map();
  const fallback = {
    'users.json': { users: [{ id: 'usr_demo_jiho', email: 'demo@hotelngo.test', passwordHash: 'fb0f89287e8ec5c3cfa13868d989360fc74b89bc597209bc1db36f6956790eeb', name: '김지호', displayName: '지호', roles: ['TRAVELER'] }] },
    'member-dashboard.json': { summary: { upcomingTrips: 2, savedPlaces: 12, orders: 2, orderBreakdown: '확정 1 · 공급 확인 1' } },
    'member-profile.json': {
      member: { id: 'usr_demo_jiho', email: 'demo@hotelngo.test', name: '김지호', locale: 'ko-KR', currency: 'KRW', residenceCountry: 'KR', nationality: 'KR' },
      travelerProfiles: [{ id: 'traveler_primary', memberId: 'usr_demo_jiho', isPrimary: true, passportName: 'KIM JIHO', nationality: 'KR', birthDate: '1992-05-14', passport: { maskedNumber: 'M12••••45', issuingCountry: 'KR', expiresOn: '2031-04-03' }, pmsGuestLinks: [] }]
    },
    'admin-users.json': { users: [{ id: 'adm_ops_001', email: 'admin.ops@hotelngo.test', passwordHash: '57127107cb3c3485963a863fe980010c8c9d112e481313d383864cdc674c9485', name: '운영 관리자', displayName: 'admin.ops', realm: 'HOTELNGO_ADMIN', roles: ['PLATFORM_ADMIN', 'MEMBER_READ'] }] }
    ,
    'partner-users.json': { users: [{ id: 'pusr_owner_001', realm: 'HOTELNGO_PARTNER', email: 'ops@dananghillsgolf.test', passwordHash: '4fe049260ab400c4ad1ea025f85a2863b90ad791ddd2241968b7a4296133886d', name: 'Nguyen Minh', displayName: '다낭 힐스 골프 클럽', partnerId: 'ptn_golf_011', providerId: 'prv_golf_011', businessType: 'GOLF', partnerStatus: 'APPROVED', roles: ['PARTNER_OWNER'] }] },
    'partner-platform.json': {
      businessTypes: [{ code: 'HOTEL', label: '호텔·리조트' }, { code: 'GOLF', label: '골프장' }, { code: 'VEHICLE', label: '렌터카·기사 차량' }, { code: 'RESTAURANT', label: '음식점·카페' }, { code: 'SPA', label: '마사지·스파' }, { code: 'TOUR', label: '투어·체험' }],
      applications: [
        { id: 'app_kyoto_001', partnerId: 'ptn_pending_014', businessType: 'TOUR', legalName: 'Kyoto Walks Inc.', contactName: 'Sato Rina', email: 'rina@kyotowalks.test', country: 'JP', city: 'Kyoto', status: 'UNDER_REVIEW', documents: ['법인등록증', '영업보험'], submittedAt: '2026-07-23T08:10:00+09:00' },
        { id: 'app_golf_002', partnerId: 'ptn_pending_015', businessType: 'GOLF', legalName: 'Danang Hills Golf', contactName: 'Tran Phuc', email: 'ops@dananghillsgolf.test', country: 'VN', city: 'Da Nang', status: 'REVIEW_REQUESTED', documents: ['사업자등록증', '골프장영업허가'], submittedAt: '2026-07-23T09:35:00+09:00' }
      ],
      providers: [
        { id: 'prv_hotel_001', placeId: 'plc_hotel_001', name: '다낭 오션 리조트', businessType: 'HOTEL', country: 'VN', city: 'Da Nang', managementType: 'PARTNER_MANAGED', ownershipStatus: 'VERIFIED', bookingMode: 'INSTANT_BOOKING', verificationStatus: 'PARTNER_VERIFIED', sourceName: 'Partner submitted', lastVerifiedAt: '2026-07-22', partnerId: 'ptn_001' },
        { id: 'prv_golf_011', placeId: 'plc_golf_011', name: '다낭 힐스 골프 클럽', businessType: 'GOLF', country: 'VN', city: 'Da Nang', managementType: 'PLATFORM_CURATED', ownershipStatus: 'UNCLAIMED', bookingMode: 'INFORMATION_ONLY', verificationStatus: 'BASIC_VERIFIED', sourceName: 'Official website', lastVerifiedAt: '2026-06-12', partnerId: null },
        { id: 'prv_vehicle_021', placeId: 'plc_vehicle_021', name: 'ABC 다낭 트랜스퍼', businessType: 'VEHICLE', country: 'VN', city: 'Da Nang', managementType: 'PLATFORM_CURATED', ownershipStatus: 'INVITED', bookingMode: 'CONTACT_REQUEST', verificationStatus: 'BASIC_VERIFIED', sourceName: 'Airport transport directory', lastVerifiedAt: '2026-05-24', partnerId: null },
        { id: 'prv_restaurant_031', placeId: 'plc_restaurant_031', name: '짜오 비치 키친', businessType: 'RESTAURANT', country: 'VN', city: 'Da Nang', managementType: 'PLATFORM_CURATED', ownershipStatus: 'UNCLAIMED', bookingMode: 'PHONE_OR_MESSENGER', verificationStatus: 'PLATFORM_VERIFIED', sourceName: 'On-site verification', lastVerifiedAt: '2026-07-15', partnerId: null },
        { id: 'prv_spa_041', placeId: 'plc_spa_041', name: 'Bangkok Riverside Spa', businessType: 'SPA', country: 'TH', city: 'Bangkok', managementType: 'HYBRID_MANAGED', ownershipStatus: 'CLAIM_REQUESTED', bookingMode: 'REQUEST_BOOKING', verificationStatus: 'PLATFORM_VERIFIED', sourceName: 'Official social channel', lastVerifiedAt: '2026-06-05', partnerId: null },
        { id: 'prv_tour_051', placeId: 'plc_tour_051', name: 'Arashiyama Local Walk', businessType: 'TOUR', country: 'JP', city: 'Kyoto', managementType: 'PLATFORM_CURATED', ownershipStatus: 'UNCLAIMED', bookingMode: 'EXTERNAL_LINK', verificationStatus: 'BASIC_VERIFIED', sourceName: 'Kyoto tourism board', lastVerifiedAt: '2026-04-18', partnerId: null }
      ],
      claims: [{ id: 'clm_001', providerId: 'prv_spa_041', providerName: 'Bangkok Riverside Spa', partnerId: 'ptn_pending_024', requester: 'Anong Chai', evidence: ['사업자 문서', '공식 전화 OTP'], status: 'CLAIM_UNDER_REVIEW', requestedAt: '2026-07-23T11:30:00+09:00' }]
    },
    'partner-businesses.json': {
      businesses: {
        HOTEL: { label: '독립 호텔', metrics: [['객실 유형', '3'], ['오늘 가용 객실', '18'], ['예약 승인', '자동'], ['최신성', '96%']], sections: [{ title: '객실·요금제', items: ['디럭스 오션뷰 · 2인 · 조식 포함', '패밀리 스위트 · 4인 · 무료 취소', '풀빌라 · 4인 · 요청 확정'] }, { title: '캘린더 일괄 수정', items: ['판매 객실 수·주중/주말/성수기 요금', '최소 숙박·체크인/체크아웃 제한', '판매 중지·조식·추가 인원 요금'] }, { title: '판매 정책', items: ['무료 취소 7일 전', '노쇼 100%', '15:00 체크인 · 11:00 체크아웃'] }] },
        GOLF: { label: '골프장', metrics: [['코스', '2'], ['오늘 티타임', '24'], ['가용 슬롯', '9'], ['외국인 요금', '설정']], sections: [{ title: '코스·시설', items: ['Ocean 18홀 · Par 72 · 중급', 'Mountain 18홀 · Par 71 · 상급', '드레스 코드·클럽하우스·연습장'] }, { title: '티타임·요금', items: ['07:10 · 4명 · 캐디/카트 포함', '10:40 · 2명 · 주중 외국인 요금', '그린피·캐디피·카트비 분리'] }, { title: '결합 상품', items: ['호텔 픽업 포함', '리조트 2박 + 1라운드', '다회 라운드 패스'] }] },
        VEHICLE: { label: '렌터카·기사 차량', metrics: [['운영 차량', '14'], ['오늘 배차', '8'], ['기사 대기', '4'], ['공항 픽업', '운영']], sections: [{ title: '차량·조건', items: ['세단 · 3인/수하물 2개 · 기사 포함', '밴 · 7인/수하물 6개 · 보험 포함', 'SUV · 일일 대절 · 10시간'] }, { title: '서비스', items: ['다낭 공항 → 시내 호텔', '다낭 ↔ 호이안 지역 간 이동', '시간제·일일 대절'] }, { title: '배차 상태', items: ['CONFIRMED → DRIVER_ASSIGNED', 'VEHICLE_ASSIGNED → PICKUP_READY', 'IN_PROGRESS → COMPLETED'] }] },
        RESTAURANT: { label: '음식점·카페', metrics: [['메뉴', '28'], ['오늘 예약', '17'], ['18시 잔여석', '12'], ['공지', '정상']], sections: [{ title: '운영시간·좌석', items: ['11:30–22:00 · 브레이크 15:00–17:00', '테이블 18 · 룸 3 · 단체 24명', '매주 월요일 휴무'] }, { title: '메뉴·상품', items: ['시그니처 해산물 플래터 · ₫890,000', '2인 선셋 세트 · 온라인 결제', '식사권·쿠폰·픽업 주문'] }, { title: '예약 슬롯·공지', items: ['17:30 · 12석 / 18:00 · 8석', '임시휴무·재료소진 공지', '현장결제·온라인결제 구분'] }] },
        SPA: { label: '마사지·스파', metrics: [['프로그램', '9'], ['오늘 예약', '22'], ['커플룸', '3'], ['픽업', '제공']], sections: [{ title: '프로그램', items: ['아로마 90분 · THB 1,800', '타이 마사지 60분 · THB 950', '커플 패키지 120분 · 호텔 픽업'] }, { title: '수용량', items: ['싱글룸 6 · 커플룸 3', '치료사 동시 12명', '아동 동반 가능 시간 별도'] }, { title: '예약·정책', items: ['30분 단위 예약 슬롯', '2시간 전 무료 취소', '호텔별 픽업 범위'] }] },
        TOUR: { label: '투어·체험', metrics: [['판매 상품', '12'], ['오늘 출발', '6'], ['가이드', '8'], ['바우처', '자동']], sections: [{ title: '일정·집결', items: ['호이안 반일 · 14:00 출발 · 5시간', '바나힐 종일 · 07:30 출발 · 10시간', '호텔 픽업 범위 8개 지역'] }, { title: '상품 조건', items: ['최소 2명·최대 12명', '한국어·영어·베트남어 가이드', '입장료 포함·개인 식비 불포함'] }, { title: '옵션·바우처', items: ['프라이빗 차량 업그레이드', '아동 요금·연령 제한', 'QR 바우처·취소 마감'] }] }
      }
    }
  };

  const get = async (path) => {
    const cleanPath = String(path).replace(/^\/+/, '');
    if (cache.has(cleanPath)) return cache.get(cleanPath);
    try {
      const response = await fetch(new URL(`data/mock/${cleanPath}`, document.baseURI), { cache: 'no-store' });
      if (!response.ok) throw new Error(`Mock API ${response.status}`);
      const data = await response.json();
      cache.set(cleanPath, data);
      return data;
    } catch (error) {
      const data = fallback[cleanPath];
      if (!data) throw error;
      console.info(`[HotelnGo Mock API] ${cleanPath} JSON을 읽지 못해 내장 fallback을 사용합니다.`);
      return data;
    }
  };

  const STATE_PREFIX = 'hotelngo.api.state.v1.';
  const AUDIT_DOMAIN = 'audit-events';

  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
  const readState = (domain, seed = []) => {
    const key = `${STATE_PREFIX}${domain}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {
      // Storage can be unavailable in privacy modes. The in-memory seed remains usable.
    }
    const initial = clone(seed);
    try { localStorage.setItem(key, JSON.stringify(initial)); } catch {}
    return initial;
  };
  const writeState = (domain, value, metadata = {}) => {
    const next = clone(value);
    try { localStorage.setItem(`${STATE_PREFIX}${domain}`, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent('hotelngo:data-change', {
      detail: { domain, value: clone(next), at: new Date().toISOString(), ...metadata }
    }));
    return next;
  };
  const list = (domain, seed = []) => readState(domain, seed);
  const replace = (domain, value, metadata) => writeState(domain, value, metadata);
  const upsert = (domain, record, options = {}) => {
    const idField = options.idField || 'id';
    const collection = readState(domain, options.seed || []);
    const records = Array.isArray(collection) ? collection : [];
    const id = record[idField] || `${domain}_${Date.now()}`;
    const normalized = { ...record, [idField]: id, updatedAt: new Date().toISOString() };
    const index = records.findIndex((item) => item?.[idField] === id);
    if (index >= 0) records[index] = { ...records[index], ...normalized };
    else if (options.append) records.push(normalized);
    else records.unshift(normalized);
    writeState(domain, records, { operation: index >= 0 ? 'UPDATE' : 'CREATE', recordId: id });
    return normalized;
  };
  const remove = (domain, id, options = {}) => {
    const idField = options.idField || 'id';
    const records = readState(domain, options.seed || []);
    const next = Array.isArray(records) ? records.filter((item) => item?.[idField] !== id) : records;
    writeState(domain, next, { operation: 'DELETE', recordId: id });
    return next;
  };
  const appendAudit = (event) => upsert(AUDIT_DOMAIN, {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    actor: event.actor || 'LOCAL_DEMO_USER',
    action: event.action || 'UNKNOWN',
    entityType: event.entityType || 'UNKNOWN',
    entityId: event.entityId || null,
    payload: event.payload || {},
    occurredAt: new Date().toISOString()
  });
  const request = async (method, path, body) => {
    const verb = String(method || 'GET').toUpperCase();
    const normalizedPath = String(path || '').replace(/^\/+|\/+$/g, '');
    const match = normalizedPath.match(/^(?:api\/v1\/)?mock-state\/([^/]+)(?:\/([^/]+))?$/);
    if (!match) {
      if (verb === 'GET') return get(normalizedPath.replace(/^api\/v1\/fixtures\//, ''));
      throw new Error(`UNSUPPORTED_MOCK_ENDPOINT: ${method} ${path}`);
    }
    const [, domain, id] = match;
    if (verb === 'GET') {
      const records = list(domain);
      return id && Array.isArray(records) ? records.find((item) => item.id === id) || null : records;
    }
    if (verb === 'POST' || verb === 'PUT' || verb === 'PATCH') {
      return upsert(domain, { ...(body || {}), ...(id ? { id } : {}) });
    }
    if (verb === 'DELETE') return remove(domain, id);
    throw new Error(`UNSUPPORTED_MOCK_METHOD: ${verb}`);
  };
  const resetState = (domain) => {
    try { localStorage.removeItem(`${STATE_PREFIX}${domain}`); } catch {}
    window.dispatchEvent(new CustomEvent('hotelngo:data-change', { detail: { domain, operation: 'RESET' } }));
  };

  window.HotelNGoMockAPI = {
    get,
    list,
    replace,
    upsert,
    remove,
    request,
    appendAudit,
    resetState,
    mode: 'JSON_LOCAL_API_MOCK',
    contractVersion: '1.0',
    futureTransport: 'REST_API'
  };
})();
