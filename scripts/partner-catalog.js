(() => {
  const RESOURCE_KEY = 'hotelngo.partner.mock.resources.v1';
  const SCHEDULE_KEY = 'hotelngo.partner.mock.schedules.v1';
  const BUNDLE_KEY = 'hotelngo.partner.mock.bundles.v1';
  const PRODUCT_KEY = 'hotelngo.partner.mock.products.v1';
  const defaults = {
    GOLF: {
      resources:[
        {id:'res_ocean_course',name:'Ocean Course',kind:'18홀 코스',capacity:'티타임당 4명',detail:'Par 72 · 6,940yd · 카트 필수',status:'ACTIVE'},
        {id:'res_mountain_course',name:'Mountain Course',kind:'18홀 코스',capacity:'티타임당 4명',detail:'Par 71 · 7,080yd · 상급',status:'ACTIVE'},
        {id:'res_club_set',name:'클럽 대여 세트',kind:'대여 장비',capacity:'12세트',detail:'남성 8 · 여성 4',status:'ACTIVE'}
      ],
      schedules:[
        {id:'sch_0710',resource:'Ocean Course',date:'2026-08-14',time:'07:10',capacity:4,available:4,product:'Ocean 18홀',price:'178,000원'},
        {id:'sch_0830',resource:'Ocean Course',date:'2026-08-14',time:'08:30',capacity:4,available:2,product:'Ocean 18홀',price:'178,000원'},
        {id:'sch_1140',resource:'Mountain Course',date:'2026-08-14',time:'11:40',capacity:4,available:4,product:'Mountain 18홀',price:'196,000원'}
      ]
    },
    VEHICLE:{resources:[{id:'res_sedan_01',name:'프리미엄 세단 01',kind:'차량',capacity:'3명·수하물 2',detail:'기사·기본보험 포함',status:'ACTIVE'}],schedules:[]},
    RESTAURANT:{resources:[{id:'res_table_window',name:'창가 2인 테이블',kind:'좌석 그룹',capacity:'6테이블',detail:'17:00–21:00',status:'ACTIVE'}],schedules:[]},
    SPA:{resources:[{id:'res_couple_room',name:'리버뷰 커플룸',kind:'트리트먼트 룸',capacity:'2룸',detail:'동시 4명',status:'ACTIVE'}],schedules:[]},
    TOUR:{resources:[{id:'res_guide_ko',name:'한국어 가이드 팀',kind:'가이드',capacity:'2명',detail:'회차당 최대 8명',status:'ACTIVE'}],schedules:[]}
  };
  const defaultProducts = {
    GOLF: [
      {id:'golf_ocean_18',name:'Ocean Course 18홀',productKind:'18홀 라운드',description:'해안 절벽과 바다 전망을 따라 플레이하는 Par 72 챔피언십 코스',priceType:'FIXED',price:178000,unit:'1인',resourceId:'res_ocean_course',includes:['그린피','캐디피','2인 1카트'],policy:'티오프 72시간 전까지 무료 취소',status:'ACTIVE'},
      {id:'golf_mountain_18',name:'Mountain Course 18홀',productKind:'18홀 라운드',description:'긴 전장과 경사 변화가 있는 상급자 선호 Par 71 코스',priceType:'FROM',price:196000,unit:'1인',resourceId:'res_mountain_course',includes:['그린피','캐디피','2인 1카트'],policy:'티오프 96시간 전까지 무료 취소',status:'ACTIVE'},
      {id:'golf_ocean_9',name:'Ocean Twilight 9홀',productKind:'9홀 라운드',description:'오후 늦게 가볍게 즐기는 9홀 상품',priceType:'FIXED',price:98000,unit:'1인',resourceId:'res_ocean_course',includes:['그린피','캐디피'],policy:'당일 취소 환불 불가',status:'DRAFT'}
    ],
    VEHICLE: [
      {id:'vehicle_sedan_day',name:'프리미엄 세단 10시간',productKind:'기사 포함 렌터카',description:'공항·호텔 픽업과 시내 이동을 포함한 기사 포함 차량',priceType:'FIXED',price:128000,unit:'차량 1대',resourceId:'res_sedan_01',includes:['기사','기본 보험','생수'],policy:'이용 24시간 전까지 무료 취소',status:'ACTIVE'}
    ],
    RESTAURANT: [
      {id:'restaurant_seafood_course',name:'다낭 시푸드 코스',productKind:'코스 요리',description:'랍스터·새우·생선구이를 포함한 2인 코스',priceType:'FROM',price:89000,unit:'2인',resourceId:'res_table_window',includes:['웰컴 드링크','코스 6종'],policy:'예약 시간 15분 경과 시 좌석 보장 불가',status:'ACTIVE'}
    ],
    SPA: [
      {id:'spa_aroma_90',name:'아로마 오일 90분',productKind:'마사지',description:'개인실에서 진행하는 전신 아로마 오일 마사지',priceType:'FIXED',price:62000,unit:'1인',resourceId:'res_couple_room',includes:['웰컴 티','호텔 픽업'],policy:'이용 12시간 전까지 무료 취소',status:'ACTIVE'}
    ],
    TOUR: [
      {id:'tour_hoian_evening',name:'호이안 올드타운 야경 투어',productKind:'그룹 투어',description:'한국어 가이드와 함께하는 야시장·소원배 일정',priceType:'FIXED',price:72000,unit:'1인',resourceId:'res_guide_ko',includes:['한국어 가이드','호텔 픽업','소원배'],policy:'출발 48시간 전까지 무료 취소',status:'ACTIVE'}
    ]
  };
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));
  const session = window.HotelNGoPartnerAuth?.getSession?.();
  const type = session?.user?.businessType || 'GOLF';
  const source = defaults[type] || defaults.GOLF;
  let resources = read(RESOURCE_KEY, source.resources);
  let schedules = read(SCHEDULE_KEY, source.schedules);
  let bundles = read(BUNDLE_KEY, [{id:'bundle_golf_hotel',name:'하얏트 리젠시 다낭 + Ocean 18홀',condition:'제휴 호텔 같은 일정에 포함',benefit:'1인 18,000원 할인',settlement:'파트너 9,000원 · 플랫폼 9,000원 부담',status:'ACTIVE'}]);
  let products = read(PRODUCT_KEY, defaultProducts[type] || []);
  const toast = (message) => {
    const target = document.querySelector('[data-bo-toast]');
    if (!target) return;
    target.textContent = message; target.classList.add('is-visible');
    setTimeout(() => target.classList.remove('is-visible'), 2200);
  };
  const resourceBody = document.querySelector('[data-partner-resource-list]');
  const scheduleBody = document.querySelector('[data-partner-schedule-list]');
  const bundleBody = document.querySelector('[data-partner-bundle-list]');
  const productBody = document.querySelector('[data-partner-product-list]');
  const productEmpty = document.querySelector('[data-partner-product-empty]');
  const render = () => {
    if (resourceBody) resourceBody.innerHTML = resources.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.kind)}</td><td>${escapeHtml(item.capacity)}</td><td>${escapeHtml(item.detail)}</td><td><span class="bo-status">${escapeHtml(item.status)}</span></td><td><button class="bo-button" type="button" data-resource-edit="${item.id}">편집</button></td></tr>`).join('');
    if (scheduleBody) scheduleBody.innerHTML = schedules.map((item) => `<tr><td>${escapeHtml(item.date)}</td><td><strong>${escapeHtml(item.time)}</strong><small>${escapeHtml(item.resource)}</small></td><td>${escapeHtml(item.product)}</td><td>${item.available}/${item.capacity}</td><td>${escapeHtml(item.price)}</td><td><button class="bo-button" type="button" data-schedule-edit="${item.id}">변경</button></td></tr>`).join('');
    if (bundleBody) bundleBody.innerHTML = bundles.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.condition)}</td><td>${escapeHtml(item.benefit)}</td><td>${escapeHtml(item.settlement)}</td><td><span class="bo-status">${escapeHtml(item.status)}</span></td></tr>`).join('');
    if (productBody) productBody.innerHTML = products.map((item) => {
      const priceLabel = item.priceType === 'REQUEST' ? '가격 요청' : `${item.priceType === 'FROM' ? '최저 ' : ''}${Number(item.price || 0).toLocaleString('ko-KR')}원 / ${escapeHtml(item.unit)}`;
      return `<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></td><td>${escapeHtml(item.productKind)}</td><td>${priceLabel}</td><td>${escapeHtml(item.resourceId || '미연결')}</td><td>${escapeHtml((item.includes || []).join(' · '))}</td><td><span class="bo-status ${item.status === 'DRAFT' ? 'warn' : ''}">${escapeHtml(item.status)}</span></td><td><a class="bo-button" href="partner-product-detail.html?id=${encodeURIComponent(item.id)}">상세</a></td></tr>`;
    }).join('');
    if (productEmpty) productEmpty.hidden = products.length > 0;
  };
  render();

  document.querySelector('[data-resource-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    resources.unshift({id:`res_local_${Date.now()}`,name:String(form.get('name')),kind:String(form.get('kind')),capacity:String(form.get('capacity')),detail:String(form.get('detail')),status:'DRAFT'});
    write(RESOURCE_KEY, resources); render(); event.currentTarget.reset(); toast('예약 자원을 Mock 저장했습니다.');
  });
  document.querySelector('[data-schedule-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    const capacity = Number(form.get('capacity'));
    schedules.unshift({id:`sch_local_${Date.now()}`,resource:String(form.get('resource')),date:String(form.get('date')),time:String(form.get('time')),capacity,available:capacity,product:String(form.get('product')),price:`${Number(form.get('price')).toLocaleString('ko-KR')}원`});
    write(SCHEDULE_KEY, schedules); render(); event.currentTarget.reset(); toast('운영 슬롯을 Mock 저장했습니다.');
  });
  document.querySelector('[data-bundle-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    bundles.unshift({id:`bundle_local_${Date.now()}`,name:String(form.get('name')),condition:String(form.get('condition')),benefit:String(form.get('benefit')),settlement:String(form.get('settlement')),status:'DRAFT'});
    write(BUNDLE_KEY, bundles); render(); event.currentTarget.reset(); toast('호텔 결합 혜택을 Mock 저장했습니다.');
  });
  document.querySelector('[data-partner-product-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const form = new FormData(event.currentTarget);
    products.unshift({
      id:`product_local_${Date.now()}`, providerId:session?.user?.providerId || null, businessType:type,
      name:String(form.get('name')), productKind:String(form.get('productKind')), description:String(form.get('description')),
      priceType:String(form.get('priceType')), price:Number(form.get('price') || 0), unit:String(form.get('unit')),
      resourceId:String(form.get('resourceId')), includes:String(form.get('includes')).split('\n').map((item) => item.trim()).filter(Boolean),
      policy:String(form.get('policy')), status:'DRAFT', createdAt:new Date().toISOString()
    });
    write(PRODUCT_KEY, products);
    toast('업종별 상품 초안을 저장했습니다.');
    setTimeout(() => { location.href = 'partner-products.html'; }, 350);
  });
})();
