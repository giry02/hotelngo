(() => {
  const root = document.querySelector('[data-discover-context]');
  const api = window.HotelNGoMockAPI;
  if (!root || !api?.get) return;
  const params = new URLSearchParams(location.search);
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const destinationHero = {
    danang: {
      image: 'assets/images/hero-hotel.jpg',
      alt: '다낭 해변 리조트와 수영장',
      eyebrow: 'BEACH TO OLD TOWN · DANANG',
      title: '바다에서 시작해,<br>호이안의 불빛으로',
      description: '미케 비치의 아침, 18홀 라운드와 로컬 점심, 스파와 호이안의 저녁을 4박 5일 안에서 연결해 보세요.'
    },
    bangkok: {
      image: 'assets/images/landmark-bangkok.jpg',
      alt: '방콕 차이나타운의 저녁',
      eyebrow: 'RIVER TO NIGHT MARKET · BANGKOK',
      title: '강변의 오후부터,<br>뜨거운 미식의 밤까지',
      description: '왕궁과 수상교통, 골프와 스파, 차이나타운의 늦은 저녁을 이동 부담에 맞춰 한 여행으로 조합합니다.'
    },
    bali: {
      image: 'assets/images/landmark-bali.jpg',
      alt: '발리 사원과 자연 풍경',
      eyebrow: 'SLOW MORNING · BALI',
      title: '알람 없이 시작하는,<br>발리의 느린 하루',
      description: '우붓의 자연과 사원, 리조트에서의 휴식과 스파를 서두르지 않는 일정으로 이어보세요.'
    }
  };

  const destinationDiscovery = {
    danang: {
      stories: [
        { image: 'assets/images/hero-hotel.jpg', alt: '미케 비치의 아침', byline: '@COAST.ROUTE · DANANG 07:10', title: '파도 소리로 시작하는<br>미케 비치의 아침', meta: '4 SPOTS · BEACH DAY · 저장 13.8K', href: 'trip-planner.html?destination=다낭&focus=LANDMARK' },
        { image: 'assets/images/marketplace/golf-course.jpg', alt: '다낭 해안 골프 코스', byline: '@GREEN.DIARY · DANANG 09:00', title: '바다를 보며 라운드하는<br>다낭 18홀의 하루', meta: '18 HOLES · GOLF DAY · 저장 9.6K', href: 'experiences.html?destination=다낭&focus=GOLF' },
        { image: 'assets/images/marketplace/restaurant-dining.jpg', alt: '다낭 로컬 다이닝', byline: '@TASTE.DANANG · HOI AN 19:20', title: '호이안의 불빛을 따라<br>천천히 이어지는 저녁', meta: '3 PLATES · NIGHT ROUTE · 저장 11.4K', href: 'experiences.html?destination=다낭&focus=FOOD' }
      ],
      creators: [
        ['CR', '@coast.route', '다낭 · 팔로워 31K', '해변 산책과 카페, 리조트에서 시작하는 아침을 기록합니다.'],
        ['GD', '@green.danang', '다낭 · 팔로워 18K', '18홀 코스와 티오프 시간, 라운드 뒤 식당을 함께 소개합니다.'],
        ['TF', '@taste.fromhere', '다낭 · 팔로워 26K', '미케 비치부터 호이안까지 하루 세 끼의 동선을 만듭니다.'],
        ['HS', '@hoian.sunset', '다낭 · 팔로워 22K', '호이안의 골목과 강변이 가장 아름다운 시간을 찾습니다.']
      ],
      landmarks: [
        ['assets/images/hero-hotel.jpg', '미케 비치', '다낭 · 오전 07:00 추천 · 90분', 'trip-planner.html?destination=다낭&focus=LANDMARK'],
        ['assets/images/landmark-bali.jpg', '오행산', '다낭 · 오전 10:30 추천 · 120분', 'trip-planner.html?destination=다낭&focus=LANDMARK'],
        ['assets/images/landmark-bangkok.jpg', '호이안 올드타운', '다낭 · 오후 16:30 추천 · 240분', 'trip-planner.html?destination=다낭&focus=TOUR']
      ],
      hotelTitle: '다낭 해변 숙소에서 시작하는 4박 5일',
      hotelRoute: '미케 비치 07:10 → 18홀 라운드 09:00 → 스파 17:30 → 호이안 19:20',
      hotelHref: 'hotels.html?destination=다낭'
    },
    bangkok: {
      stories: [
        { image: 'assets/images/landmark-bangkok.jpg', alt: '방콕 차이나타운의 밤', byline: '@TASTE.ROUTE · BANGKOK 21:10', title: '한입씩 따라가는<br>방콕의 뜨거운 밤', meta: '8 SPOTS · FOOD WALK · 저장 14.7K', href: 'experiences.html?destination=방콕&focus=FOOD' },
        { image: 'assets/images/marketplace/tour-bamboo.jpg', alt: '방콕 강변 투어', byline: '@RIVER.NOTE · BANGKOK 15:40', title: '수상교통으로 이어지는<br>왕궁과 강변의 오후', meta: '5 SPOTS · RIVER DAY · 저장 12.1K', href: 'trip-planner.html?destination=방콕&focus=TOUR' },
        { image: 'assets/images/marketplace/spa-room.jpg', alt: '방콕 스파', byline: '@SLOW.BANGKOK · BANGKOK 18:00', title: '걷고 먹은 하루를 푸는<br>도심 스파의 저녁', meta: '90 MIN · RELAX · 저장 8.9K', href: 'experiences.html?destination=방콕&focus=SPA' }
      ],
      creators: [
        ['TR', '@taste.route', '방콕 · 팔로워 41K', '한 도시를 다섯 끼로 기억하는 야시장 전문 가이드입니다.'],
        ['RN', '@river.note', '방콕 · 팔로워 24K', '배와 도보를 연결해 왕궁과 강변을 편하게 여행합니다.'],
        ['GB', '@green.bangkok', '방콕 · 팔로워 17K', '도심에서 이동 부담이 적은 골프 코스를 큐레이션합니다.'],
        ['SN', '@slow.night', '방콕 · 팔로워 29K', '마사지와 루프톱, 늦은 저녁을 한 동선으로 소개합니다.']
      ],
      landmarks: [
        ['assets/images/marketplace/tour-bamboo.jpg', '왕궁과 왓 포', '방콕 · 오전 09:00 추천 · 180분', 'trip-planner.html?destination=방콕&focus=LANDMARK'],
        ['assets/images/landmark-bangkok.jpg', '야오와랏 차이나타운', '방콕 · 오후 19:00 추천 · 150분', 'trip-planner.html?destination=방콕&focus=FOOD'],
        ['assets/images/marketplace/spa-room.jpg', '통로 스파 거리', '방콕 · 오후 17:30 추천 · 120분', 'trip-planner.html?destination=방콕&focus=SPA']
      ],
      hotelTitle: '짜오프라야 강변 숙소에서 시작하는 하루',
      hotelRoute: '왕궁 09:00 → 강변 점심 13:00 → 스파 17:30 → 차이나타운 20:00',
      hotelHref: 'hotels.html?destination=방콕'
    },
    bali: {
      stories: [
        { image: 'assets/images/landmark-bali.jpg', alt: '발리 사원의 아침', byline: '@ISLAND.NOTES · BALI 06:20', title: '알람 없이 눈뜨는<br>발리의 느린 아침', meta: '4 SPOTS · SLOW TRIP · 저장 11.9K', href: 'trip-planner.html?destination=발리&focus=LANDMARK' },
        { image: 'assets/images/marketplace/spa-treatment.jpg', alt: '발리 리조트 스파', byline: '@REST.IN.BALI · UBUD 16:20', title: '초록빛 우붓에서 쉬는<br>스파와 티타임', meta: '120 MIN · WELLNESS · 저장 10.7K', href: 'experiences.html?destination=발리&focus=SPA' },
        { image: 'assets/images/marketplace/restaurant-interior.jpg', alt: '발리 선셋 다이닝', byline: '@SUNSET.TABLE · BALI 18:10', title: '해가 지는 속도에 맞춘<br>짐바란의 저녁', meta: '3 PLATES · SUNSET · 저장 9.8K', href: 'experiences.html?destination=발리&focus=FOOD' }
      ],
      creators: [
        ['IN', '@island.notes', '발리 · 팔로워 19K', '조용한 숙소와 이른 아침의 사원, 느린 하루를 소개합니다.'],
        ['WB', '@wellness.bali', '발리 · 팔로워 23K', '요가와 스파, 자연 속 휴식을 하루 동선으로 연결합니다.'],
        ['UT', '@ubud.table', '발리 · 팔로워 16K', '우붓의 로컬 식당과 커피 농장을 기록합니다.'],
        ['SS', '@sunset.south', '발리 · 팔로워 27K', '남부 해변과 선셋을 가장 좋은 시간에 안내합니다.']
      ],
      landmarks: [
        ['assets/images/landmark-bali.jpg', '울룬다누 브라딴 사원', '발리 · 오전 07:00 추천 · 80분', 'trip-planner.html?destination=발리&focus=LANDMARK'],
        ['assets/images/marketplace/tour-bamboo.jpg', '우붓 라이스 테라스', '발리 · 오전 09:30 추천 · 120분', 'trip-planner.html?destination=발리&focus=TOUR'],
        ['assets/images/marketplace/restaurant-interior.jpg', '짐바란 선셋', '발리 · 오후 17:30 추천 · 150분', 'trip-planner.html?destination=발리&focus=FOOD']
      ],
      hotelTitle: '우붓 리조트에서 시작하는 느린 하루',
      hotelRoute: '라이스 테라스 08:30 → 로컬 점심 12:30 → 스파 15:30 → 선셋 18:00',
      hotelHref: 'hotels.html?destination=발리'
    }
  };

  const applySelectedHero = (selected) => {
    const hero = destinationHero[selected?.id];
    const stage = document.querySelector('.discovery-stage');
    if (!hero || !stage) return;
    const image = stage.querySelector(':scope > img');
    const eyebrow = stage.querySelector('.discovery-copy small');
    const heading = stage.querySelector('.discovery-copy h1');
    const description = stage.querySelector('.discovery-copy p');
    const action = stage.querySelector('.discovery-actions a');
    if (image) {
      image.src = hero.image;
      image.alt = hero.alt;
    }
    if (eyebrow) eyebrow.textContent = hero.eyebrow;
    if (heading) heading.innerHTML = hero.title;
    if (description) description.textContent = hero.description;
    if (action) {
      action.href = `trip-planner.html?destination=${encodeURIComponent(selected.name)}`;
      action.textContent = `${selected.name} 4박 5일 구성 보기`;
    }
  };

  const applySelectedDiscovery = (selected) => {
    const focus = destinationDiscovery[selected?.id];
    if (!focus) return;

    document.querySelector('#themes .section-line-head h2').textContent = `${selected.name}에서 가장 많이 저장한 장면`;
    document.querySelector('#themes .section-line-head p').textContent = '선택한 도시 안에서 숙소와 식사, 활동까지 이어지는 장면입니다.';
    document.querySelectorAll('.mood-story-card').forEach((card, index) => {
      const story = focus.stories[index];
      if (!story) return;
      const image = card.querySelector('img');
      image.src = story.image;
      image.alt = story.alt;
      card.querySelector('button').setAttribute('aria-label', `${story.alt} 저장`);
      const link = card.querySelector('a.copy');
      link.href = story.href;
      link.querySelector('small').textContent = story.byline;
      link.querySelector('h3').innerHTML = story.title;
      link.querySelector('p').textContent = story.meta;
    });

    document.querySelectorAll('.creator-card').forEach((card, index) => {
      const creator = focus.creators[index];
      if (!creator) return;
      card.querySelector('.creator-avatar').textContent = creator[0];
      card.querySelector('strong').textContent = creator[1];
      card.querySelector('small').textContent = creator[2];
      card.querySelector('p').textContent = creator[3];
    });

    document.querySelectorAll('.nearby-card').forEach((card, index) => {
      const landmark = focus.landmarks[index];
      if (!landmark) return;
      card.href = landmark[3];
      const image = card.querySelector('img');
      image.src = landmark[0];
      image.alt = landmark[1];
      card.querySelector('strong').textContent = landmark[1];
      card.querySelector('small').textContent = landmark[2];
    });

    const hotelCard = document.querySelector('#hotel-start .result-map-card');
    if (hotelCard) {
      hotelCard.href = focus.hotelHref;
      hotelCard.querySelector('strong').textContent = focus.hotelTitle;
      hotelCard.querySelector('small').textContent = focus.hotelRoute;
      document.querySelector('#hotel-start .section-line-head a').href = focus.hotelHref;
    }

    const destinationParam = encodeURIComponent(selected.name);
    const tabs = document.querySelectorAll('.discover-tabs a');
    if (tabs[3]) tabs[3].href = `discover.html?destination=${destinationParam}#landmarks`;
    if (tabs[5]) tabs[5].href = `experiences.html?destination=${destinationParam}&focus=GOLF`;
    if (tabs[6]) tabs[6].href = `experiences.html?destination=${destinationParam}&focus=FOOD`;
    const landmarkMore = document.querySelector('#landmarks .section-line-head a');
    if (landmarkMore) landmarkMore.href = `experiences.html?destination=${destinationParam}&focus=LANDMARK`;
  };

  api.get('trip-planner-catalog.json').then((catalog) => {
    const requested = String(params.get('destination') || '').toLowerCase();
    const selected = catalog.destinations.find((item) => [item.id, item.name].some((value) => String(value).toLowerCase() === requested));
    applySelectedHero(selected);
    applySelectedDiscovery(selected);
    root.innerHTML = `
      <div class="discover-context-copy"><span class="page-eyebrow">${selected ? 'DESTINATION FOCUS' : 'DISCOVER BEFORE YOU DECIDE'}</span><strong>${selected ? `${escapeHtml(selected.name)} 여행을 발견하는 중` : '아직 목적지가 정해지지 않았나요?'}</strong><p>${selected ? `${escapeHtml(selected.summary)} 아래 콘텐츠도 ${escapeHtml(selected.name)}의 숙소·식사·활동·랜드마크를 중심으로 정렬했습니다.` : '여행 발견은 예약 목록이 아니라 도시와 장면을 고르는 곳입니다. 도시를 선택하면 호텔·즐길거리·일정이 같은 위치로 이어집니다.'}</p></div>
      <div class="discover-context-actions">
        ${catalog.destinations.map((item) => `<a class="${selected?.id === item.id ? 'is-active' : ''}" href="discover.html?destination=${encodeURIComponent(item.name)}">${escapeHtml(item.name)}</a>`).join('')}
        <a href="ai-travel.html">도시 추천받기</a>
      </div>
      ${selected ? `<div class="discover-city-cta"><a href="trip-planner.html?destination=${encodeURIComponent(selected.name)}">4박 5일 일정 만들기</a><a href="experiences.html?destination=${encodeURIComponent(selected.name)}">즐길거리 보기</a><a href="hotels.html?destination=${encodeURIComponent(selected.name)}">호텔 보기</a><button type="button" data-clear-destination>다른 도시 둘러보기</button></div>` : ''}`;
    root.querySelector('[data-clear-destination]')?.addEventListener('click', () => { location.href = 'discover.html'; });
  });
})();
