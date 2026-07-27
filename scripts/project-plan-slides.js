(() => {
  "use strict";

  const ASSET = "assets/presentation/screens/";
  const ICON_PATHS = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.4 8.6-2 4.8-4.8 2 2-4.8 4.8-2Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    hotel: '<path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M8 7h2M13 7h1M8 11h2M13 11h1M2 21h20M9 21v-5h4v5"/>',
    spark: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    cart: '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H7"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    store: '<path d="M3 9 5 3h14l2 6"/><path d="M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    map: '<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
    golf: '<path d="M5 21 10 3M10 3l8 3-9 3M3 21h8"/>',
    car: '<path d="m5 17-2-2v-5l2-5h14l2 5v5l-2 2"/><path d="M5 17v3M19 17v3M3 12h18M7 15h.01M17 15h.01"/>',
    food: '<path d="M6 2v8M9 2v8M6 6h3M7.5 10v12M16 2v20M16 2c3 2 3 8 0 10"/>',
    spa: '<path d="M12 22c5-3 8-7 8-12-4 0-7 1-8 4-1-3-4-4-8-4 0 5 3 9 8 12Z"/><path d="M12 14c-3-1-5-4-5-8 3 0 5 1 5 4 0-3 2-4 5-4 0 4-2 7-5 8Z"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    api: '<path d="M8 9 4 12l4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    support: '<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v5h3v-6H4M20 13v5h-3v-6h3M17 19c0 2-2 2-5 2"/>',
    review: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'
  };

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] || ICON_PATHS.spark}</svg>`;
  }

  function card(iconName, label, title, text, accent = "") {
    return `<article class="content-card ${accent}"><div class="icon">${icon(iconName)}</div><small>${label}</small><strong>${title}</strong><p>${text}</p></article>`;
  }

  function metric(label, value, text, iconName = "chart") {
    return `<article class="metric-card"><div class="icon">${icon(iconName)}</div><small>${label}</small><strong class="metric-value">${value}</strong><p>${text}</p></article>`;
  }

  function flowNode(iconName, step, title, text) {
    return `<article class="flow-node"><div class="flow-icon">${icon(iconName)}</div><small>${step}</small><strong>${title}</strong><p>${text}</p></article>`;
  }

  function chips(items, tone = "") {
    return `<div class="chip-row">${items.map((item) => `<span class="chip ${tone}">${item}</span>`).join("")}</div>`;
  }

  function screen(src, classes = "", label = "") {
    return `<figure class="screen-frame ${classes}"><span class="screen-browser"><i></i><i></i><i></i></span><img src="${ASSET}${src}" alt="${label}" loading="lazy"></figure>`;
  }

  function standardBody(slide, index) {
    return `
      <div class="slide-shell ${slide.theme || "light"}">
        ${slide.theme && slide.theme !== "light" ? '<div class="slide-grid"></div><i class="slide-orb one"></i><i class="slide-orb two"></i>' : ""}
        <header class="slide-header">
          <div class="slide-heading">
            <p class="slide-kicker">${slide.kicker}</p>
            <h1 class="slide-title">${slide.title}</h1>
            <p class="slide-summary">${slide.summary}</p>
          </div>
          <div class="slide-no"><span>SECTION</span><strong>${String(index).padStart(2, "0")}</strong></div>
        </header>
        <div class="slide-body">${slide.visual}</div>
        <footer class="slide-footer">
          <span class="source">HotelNGo 사업·통합 프로젝트 계획서 · Draft v0.2</span>
          <span class="brand">HOTELnGO · 2026</span>
        </footer>
      </div>`;
  }

  const slides = [
    {
      section: "INTRO",
      title: "HotelNGo 사업·통합 프로젝트 계획서",
      summary: "해외여행 발견에서 다일정 구성, 숙박과 현지 서비스 예약까지 하나의 흐름으로 연결하는 사업·서비스·기술 통합 계획",
      cover: true,
      visual: `
        <div class="slide-shell navy">
          <div class="slide-grid"></div><i class="slide-orb one"></i><i class="slide-orb two"></i>
          <div class="cover-mark">HOTELnGO · BUSINESS & PRODUCT BLUEPRINT</div>
          <div class="cover-main">
            <h1>여행을 발견하고,<em>여정 전체를 예약하다</em></h1>
            <p>감성 콘텐츠와 실거래 데이터를 연결해 숙소·랜드마크·식사·골프·마사지·투어·이동을 날짜별 여행으로 구성합니다.</p>
          </div>
          <div class="cover-bottom">
            <div class="cover-meta">
              <div><small>VERSION</small><strong>Draft v0.2</strong></div>
              <div><small>BASE DATE</small><strong>2026. 07. 27.</strong></div>
              <div><small>SCOPE</small><strong>Business · Product · PMS · AI</strong></div>
            </div>
            <div class="cover-promise"><small>CORE PROMISE</small><p>가보지 않아도 가본 듯,<br>가보고 싶게 만드는 여행 플랫폼</p></div>
          </div>
        </div>`
    },
    {
      section: "BUSINESS",
      kicker: "01 · BUSINESS OVERVIEW",
      title: "호텔 비교를 넘어, 여행 전체를 구성하는 플랫폼",
      summary: "한국인 해외여행객이 목적지를 발견하고 여러 업종을 하나의 다일정으로 조합한 뒤 실제 거래로 전환하도록 지원합니다.",
      visual: `<div class="split-layout">
        <section class="statement-panel"><blockquote>“여행 욕구”를 <em>목적지·일정·예약</em>으로 이어주는 하나의 여정</blockquote><footer><span>초기 시장</span><strong>동남아 주요 도시 · 해외호텔 중심</strong>${chips(["호텔", "랜드마크", "골프", "차량", "식사", "스파", "투어"], "dark")}</footer></section>
        <div class="metric-grid" style="grid-template-columns:1fr 1fr">
          ${metric("TARGET", "B2C", "한국인 해외 자유여행 고객", "users")}
          ${metric("ANCHOR", "PMS", "Hotel_PMS 호텔 공급", "hotel")}
          ${metric("COMPOSITION", "7종", "여행에 조합할 핵심 카테고리", "calendar")}
          ${metric("LAUNCH", "해외", "국내 숙박은 후속 확장", "compass")}
        </div>
      </div>`
    },
    {
      section: "PROBLEM",
      kicker: "02 · WHY NOW",
      title: "고객·공급자·운영자의 단절을 동시에 해결",
      summary: "검색과 예약이 흩어져 있고, 현지 공급자는 온라인 판매가 어렵고, 운영자는 여러 공급 방식의 품질과 거래를 통합하기 어렵습니다.",
      visual: `<div class="cards-3" style="height:100%">
        ${card("users", "TRAVELER", "전체 일정이 보이지 않는다", "호텔·맛집·골프·마사지·이동을 서로 다른 사이트에서 찾아 시간·거리·운영시간까지 직접 맞춰야 합니다.", "accent")}
        ${card("store", "SUPPLIER", "상품화와 판매 운영이 어렵다", "현지 업체는 사진·서비스·가격·자원·슬롯을 구조화하고 예약·정산까지 운영할 도구가 부족합니다.")}
        ${card("support", "OPERATOR", "부분 실패와 품질 책임이 남는다", "PMS·파트너·외부 API를 함께 다루며 오래된 정보, 취소, 환불, 대사와 고객지원을 해결해야 합니다.")}
      </div>`
    },
    {
      section: "VISION",
      kicker: "03 · VISION & GOALS",
      title: "감성적 발견과 실제 예약을 하나의 데이터로 연결",
      summary: "콘텐츠가 목적지 선택을 만들고, 일정이 상품 탐색을 만들며, 신뢰 가능한 재고와 운영이 예약을 완성하는 구조를 지향합니다.",
      theme: "navy",
      visual: `<div class="split-layout wide-left">
        <section class="statement-panel" style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15)"><blockquote>가보지 않아도<br><em>가본 듯한 여행</em></blockquote><footer><strong>Discover → Compose → Validate → Book → Share</strong><span>영감·구성·검증·거래·공유의 순환</span></footer></section>
        <div class="cards-2">
          <article class="glass-card"><strong>서비스 목표</strong><p>목적지 미정 고객에게 영감을 제공하고, 목적지 확정 고객에게 편집 가능한 전체 여행을 제공합니다.</p></article>
          <article class="glass-card"><strong>사업 목표</strong><p>호텔을 앵커 공급으로 삼고 현지 서비스를 결합해 예약당 거래액과 수익원을 확장합니다.</p></article>
          <article class="glass-card"><strong>운영 목표</strong><p>공급 방식과 무관하게 동일한 품질·예약·정산·고객지원 상태를 관리합니다.</p></article>
          <article class="glass-card"><strong>신뢰 목표</strong><p>AI 제안, 검증된 카탈로그, 실시간 거래 정보를 명확히 구분합니다.</p></article>
        </div>
      </div>`
    },
    {
      section: "CUSTOMER",
      kicker: "04 · CUSTOMER SCENARIOS",
      title: "여행 준비 단계가 다른 다섯 고객을 연결",
      summary: "목적지 선택 전부터 공급자의 판매 운영까지 서로 다른 출발점을 하나의 플랫폼 흐름으로 연결합니다.",
      visual: `<div class="cards-5" style="height:100%">
        ${card("pin", "01", "목적지 확정형", "도시·기간을 정하고 호텔과 즐길거리를 찾습니다.")}
        ${card("compass", "02", "목적지 탐색형", "스토리와 랜드마크로 가고 싶은 곳을 발견합니다.")}
        ${card("calendar", "03", "직접 계획형", "날짜별로 숙소·식사·활동·이동을 직접 배치합니다.")}
        ${card("spark", "04", "AI 도움형", "취향을 말하고 초안을 받은 뒤 대화로 수정합니다.")}
        ${card("store", "05", "공급 고객", "호텔·업체가 콘텐츠·상품·예약·정산을 운영합니다.", "accent")}
      </div>`
    },
    {
      section: "DIFFERENTIATION",
      kicker: "05 · CORE DIFFERENTIATORS",
      title: "발견에서 거래까지 끊기지 않는 일곱 가지 차별점",
      summary: "가격 비교만으로 경쟁하지 않고 감성 콘텐츠, 다일정 구성, 공급 데이터와 거래 운영을 하나의 경험으로 설계합니다.",
      visual: `<div class="number-list" style="grid-template-columns:1fr 1fr">
        ${[
          ["01","여행 욕구를 먼저 만든다","가격 카드 전에 스토리·랜드마크·시간대의 감성을 제공합니다."],
          ["02","하나가 아닌 여행 전체","숙소·식사·활동·이동을 날짜별 한 여행으로 구성합니다."],
          ["03","발견·일정·예약을 연결","저장한 콘텐츠를 일정과 카트로 끊김 없이 가져갑니다."],
          ["04","PMS와 독립 입점을 동시 지원","Hotel_PMS 호텔과 파트너 관리 상품을 같은 계약으로 표현합니다."],
          ["05","미입점 업체를 수요부터 만든다","정보형 장소를 먼저 보여주고 관심·문의를 입점 근거로 사용합니다."],
          ["06","회원 일정이 다시 탐색 경로가 된다","공개 일정 복사·수정·공유로 콘텐츠와 거래가 순환합니다."],
          ["07","AI 설명과 거래 사실을 분리","근거·확인 시각·예약 방식을 명시해 신뢰를 지킵니다."]
        ].map(([n,t,p]) => `<article class="number-item"><span>${n}</span><div><strong>${t}</strong><p>${p}</p></div></article>`).join("")}
      </div>`
    },
    {
      section: "ARCHITECTURE",
      kicker: "06 · BUSINESS SYSTEM",
      title: "독립된 다섯 시스템을 공통 계약으로 연결",
      summary: "B2C, 호텔 콘텐츠, 액티비티 파트너, 플랫폼 관리자, PMS 채널은 계정·권한·데이터 책임을 분리하고 API로 연동합니다.",
      visual: `<div class="realm-map">
        <article class="realm-card"><strong>B2C 여행 플랫폼</strong><p>발견·검색·일정·AI·카트·예약·내 여행</p>${chips(["Customer", "Trip", "Order"])}</article>
        <article class="realm-card"><strong>호텔 콘텐츠센터</strong><p>호텔·객실 사진, 소개, 정책, 편의시설, 공개 매핑</p>${chips(["Hotel content", "Room content"])}</article>
        <article class="realm-card"><strong>액티비티 파트너센터</strong><p>골프·차량·식사·스파·투어 상품과 예약 운영</p>${chips(["Provider", "Product", "Slot"])}</article>
        <article class="realm-card"><strong>플랫폼 관리자 · PMS 채널</strong><p>심사·콘텐츠·거래·정산·대사와 Hotel_PMS 연동</p>${chips(["Admin", "Audit", "Channel"])}</article>
      </div>`
    },
    {
      section: "REVENUE",
      kicker: "07 · REVENUE MODEL",
      title: "거래 수수료를 중심으로 다층 수익 구조를 확장",
      summary: "초기에는 호텔과 현지 서비스 거래 수수료에 집중하고, 공급자 가치가 검증된 이후 광고·제휴·B2B 기능을 확대합니다.",
      visual: `<div class="revenue-layout">
        <div class="donut-wrap"><div class="donut"></div></div>
        <div>
          <div class="legend-list">
            <div class="legend-item"><i style="--color:#356dff"></i><strong>호텔·액티비티 거래 수수료</strong><span>핵심</span></div>
            <div class="legend-item"><i style="--color:#16c4d8"></i><strong>요청 예약·견적 전환</strong><span>리드/확정</span></div>
            <div class="legend-item"><i style="--color:#7b61ff"></i><strong>호텔+현지 서비스 결합 상품</strong><span>객단가</span></div>
            <div class="legend-item"><i style="--color:#ff8a4c"></i><strong>프로모션·광고·제휴 링크</strong><span>보조</span></div>
            <div class="legend-item"><i style="--color:#d7e0ef"></i><strong>향후 B2B·콘텐츠 API</strong><span>확장</span></div>
          </div>
          <div class="trust-strip" style="grid-template-columns:repeat(3,1fr)">
            <div class="trust-item"><i></i>광고 표시 분리</div><div class="trust-item"><i></i>할인 부담 주체 기록</div><div class="trust-item"><i></i>정산 기준 명확화</div>
          </div>
        </div>
      </div>`
    },
    {
      section: "MARKET",
      kicker: "08 · MARKET & GROWTH",
      title: "한 도시의 공급 밀도와 거래를 검증한 뒤 반복 확장",
      summary: "거대한 시장 수치보다 도시 단위의 공급·수요·운영 재현성을 먼저 확인하고, 콘텐츠와 공개 일정으로 유기적 유입을 만듭니다.",
      visual: `<div class="split-layout">
        <div class="flywheel">
          <div class="flywheel-core">CITY<br>FLYWHEEL</div>
          <article class="flywheel-item"><strong>감성 콘텐츠</strong><p>도시·스토리·랜드마크로 수요 형성</p></article>
          <article class="flywheel-item"><strong>앵커 공급</strong><p>PMS 호텔과 핵심 현지 업체 확보</p></article>
          <article class="flywheel-item"><strong>일정·공유</strong><p>회원 일정이 검색과 추천 자산으로 축적</p></article>
          <article class="flywheel-item"><strong>거래 데이터</strong><p>예약·문의로 다음 공급과 도시를 결정</p></article>
        </div>
        <div class="cards-2">
          ${card("compass","MARKET","시장 검토","해외 자유여행·호텔·액티비티·일정 공유·AI 여행·PMS 채널을 동일 기준으로 조사합니다.")}
          ${card("chart","DEMAND","수요 정보","검색·저장·일정·문의·예약 전환을 도시와 테마별로 측정합니다.")}
          ${card("store","SUPPLY","공급 정보","호텔·업체·상품·예약 방식·정보 최신성을 도시별로 집계합니다.")}
          ${card("map","SCALE","확장 원칙","공급 밀도와 공헌이익이 검증된 도시 모델만 복제합니다.","accent")}
        </div>
      </div>`
    },
    {
      section: "SUPPLY",
      kicker: "09 · SUPPLY ACQUISITION",
      title: "선등록에서 소유권 인수, 판매 운영까지 단계화",
      summary: "업체가 아직 입점하지 않아도 정보형 장소로 수요를 만들고, 소유권 인수와 심사를 거쳐 예약 가능한 상품으로 전환합니다.",
      visual: `<div>
        <div class="flow-band" style="--count:5">
          ${flowNode("map","STEP 1","장소 선등록","공개 출처·운영자 조사")}
          ${flowNode("review","STEP 2","정보 검수","출처·확인일·권리 기록")}
          ${flowNode("store","STEP 3","소유권 인수","업체 인증·담당자 연결")}
          ${flowNode("shield","STEP 4","입점 심사","계약·정책·정산 확인")}
          ${flowNode("cart","STEP 5","상품 판매","가격·자원·슬롯 운영")}
        </div>
        <div class="cards-3" style="margin-top:1.2cqw">
          ${card("hotel","INTERNAL PMS","Hotel_PMS 호텔","채널 API로 호텔·객실·요금·재고를 공급합니다.")}
          ${card("store","PARTNER MANAGED","독립 파트너","파트너센터에서 콘텐츠와 예약 가능 상품을 직접 관리합니다.")}
          ${card("link","EXTERNAL / CURATED","외부·정보형 장소","외부 API·제휴 또는 정보 제공 장소로 구분합니다.")}
        </div>
      </div>`
    },
    {
      section: "JOURNEY",
      kicker: "10 · END-TO-END JOURNEY",
      title: "목적지 발견부터 여행 후 공유까지 하나의 흐름",
      summary: "목적지 미정·확정·AI 이용 고객의 출발점은 달라도 최종적으로 일정, 카트, 예약, 내 여행과 후기에서 합쳐집니다.",
      visual: `<div class="flow-band" style="--count:8">
        ${flowNode("spark","01","욕구 형성","스토리·테마")}
        ${flowNode("compass","02","목적지 발견","도시·랜드마크")}
        ${flowNode("calendar","03","조건 확정","기간·인원")}
        ${flowNode("map","04","일정 구성","날짜·시간")}
        ${flowNode("shield","05","가능성 검증","거리·영업·재고")}
        ${flowNode("cart","06","카트·거래","예약·결제")}
        ${flowNode("support","07","여행 관리","바우처·변경")}
        ${flowNode("review","08","후기·공유","스토리·공개 일정")}
      </div>`
    },
    {
      section: "B2C IA",
      kicker: "11 · INFORMATION ARCHITECTURE",
      title: "고객의 목적에 따라 메뉴 역할을 명확히 분리",
      summary: "발견은 영감, 일정은 구성, 호텔·즐길거리는 상품 탐색, AI는 초안 생성, 내 여행은 예약 이후 관리를 담당합니다.",
      visual: `<div class="menu-map">
        <section class="menu-column"><header>${icon("compass")}여행 발견</header><ul><li>추천 여행·이벤트</li><li>스토리·테마</li><li>랜드마크</li><li>공개 일정</li></ul></section>
        <section class="menu-column"><header>${icon("calendar")}여행 일정</header><ul><li>목적지·기간·인원</li><li>날짜별 편집</li><li>지도·동선</li><li>검증·저장·공유</li></ul></section>
        <section class="menu-column"><header>${icon("hotel")}호텔·즐길거리</header><ul><li>도시·호텔명 검색</li><li>업종별 필터</li><li>상세·갤러리</li><li>상품·가격·예약</li></ul></section>
        <section class="menu-column"><header>${icon("spark")}AI 여행</header><ul><li>자연어 요청</li><li>일정 초안</li><li>대화형 수정</li><li>근거·검증</li></ul></section>
        <section class="menu-column"><header>${icon("users")}내 여행</header><ul><li>저장·찜</li><li>카트·예약</li><li>바우처·변경</li><li>후기·공개 일정</li></ul></section>
      </div>`
    },
    {
      section: "DISCOVERY",
      kicker: "12 · DISCOVERY & STORY",
      title: "가보지 않아도 가본 듯한 감성으로 목적지를 선택",
      summary: "홈의 추천·이벤트에서 몰입형 스토리, 랜드마크, 호텔과 일정으로 이어지는 콘텐츠 기반 탐색 경험을 제공합니다.",
      visual: `<div class="story-visual">
        <section class="story-hero"><img src="${ASSET}discover.png" alt="여행 발견 화면"><div class="story-copy"><small>FEEL FIRST · BOOK NEXT</small><strong>한 장면이<br>여행의 시작이 됩니다</strong><p>현지의 시간대·분위기·사람의 취향을 보여준 뒤 도시와 일정 선택으로 연결합니다.</p></div></section>
        <div class="story-side">
          ${screen("home.png","","HotelNGo 홈")}
          <div class="cards-2">${card("pin","LANDMARK","장소에서 일정으로","저장·주변 보기·다른 장면·일정 담기를 제공합니다.")}${card("review","STORY","회원 콘텐츠 순환","공개 일정과 여행 이야기가 다음 고객의 탐색 경로가 됩니다.","accent")}</div>
        </div>
      </div>`
    },
    {
      section: "TRIP",
      kicker: "13 · MULTI-DAY ITINERARY",
      title: "하나의 상품이 아니라 여행 전체를 날짜별로 구성",
      summary: "4박 5일 안에 숙소·랜드마크·식사·골프·스파·이동을 여러 개 배치하고 시간·거리·영업시간·예약 상태를 검증합니다.",
      visual: `<div class="itinerary-board">
        <section class="day-timeline"><div class="day-tabs"><span class="day-tab active">DAY 1</span><span class="day-tab">DAY 2</span><span class="day-tab">DAY 3</span><span class="day-tab">DAY 4</span><span class="day-tab">DAY 5</span></div>
          <div class="schedule-item"><time>15:00</time><div><strong>다낭 오션 리조트 체크인</strong><small>숙소 · 4박 · 예약 필요</small></div><i class="type-dot"></i></div>
          <div class="schedule-item"><time>17:30</time><div><strong>미케 비치 산책</strong><small>랜드마크 · 90분 · 무료</small></div><i class="type-dot"></i></div>
          <div class="schedule-item"><time>19:30</time><div><strong>선짜 해산물 디너</strong><small>식사 · 요청 예약</small></div><i class="type-dot"></i></div>
          <div class="schedule-item"><time>21:30</time><div><strong>리버사이드 마사지</strong><small>스파 · 60분 · 확인 필요</small></div><i class="type-dot"></i></div>
        </section>
        <aside class="recommendation-stack"><small class="slide-kicker">ADD TO YOUR DAYS</small>
          <div class="recommend-card"><img src="${ASSET}hotel-detail.png" alt=""><div><small>숙소</small><strong>객실 대안 비교</strong><p>가격·위치·취소 조건</p></div></div>
          <div class="recommend-card"><img src="${ASSET}discover.png" alt=""><div><small>랜드마크</small><strong>바나힐 또는 호이안</strong><p>이동시간과 혼잡도 반영</p></div></div>
          <div class="recommend-card"><img src="${ASSET}trip-planner.png" alt=""><div><small>일정 검증</small><strong>충돌·공백·숙소 누락</strong><p>저장 전 자동 확인</p></div></div>
        </aside>
      </div>`
    },
    {
      section: "HOTEL",
      kicker: "14 · HOTEL SEARCH & BOOKING",
      title: "PMS 판매 데이터와 B2C 콘텐츠를 결합한 호텔 경험",
      summary: "도시와 호텔명을 함께 검색하고, 다중 이미지·객실·편의시설·후기·정책·요금·재고를 확인한 뒤 일정과 예약으로 연결합니다.",
      visual: `<div class="desktop-collage">
        ${screen("hotel-detail.png","main-screen","호텔 상세 화면")}
        <div class="side-screens">${screen("home.png","","호텔 검색")}${screen("cart.png","","여행 카트")}</div>
      </div>`
    },
    {
      section: "ACTIVITIES",
      kicker: "15 · LOCAL CATALOG",
      title: "업종별 선택 기준을 갖춘 현지 서비스 카탈로그",
      summary: "업체명만 보여주는 목록이 아니라 고객이 실제로 비교하고 일정에 담을 수 있도록 서비스·가격·자원·시간·예약 방식을 구조화합니다.",
      visual: `<div class="catalog-grid">
        <article class="catalog-card"><span class="icon">${icon("golf")}</span><strong>골프</strong><p>18/27홀, 티타임, 카트·캐디, 클럽 대여, 픽업, 결합 할인</p></article>
        <article class="catalog-card"><span class="icon">${icon("car")}</span><strong>차량·픽업</strong><p>차종, 승차 인원, 기사, 대여시간, 수령·반납, 보험</p></article>
        <article class="catalog-card"><span class="icon">${icon("food")}</span><strong>음식점·카페</strong><p>요리·코스·식사권, 가격대, 좌석, 운영시간, 예약 정책</p></article>
        <article class="catalog-card"><span class="icon">${icon("spa")}</span><strong>마사지·스파</strong><p>서비스 종류, 시간, 룸, 테라피스트, 픽업, 요청 예약</p></article>
        <article class="catalog-card"><span class="icon">${icon("compass")}</span><strong>투어·체험</strong><p>일정, 출발지, 언어, 포함·불포함, 최소 인원, 취소 규정</p></article>
        <article class="catalog-card"><span class="icon">${icon("cart")}</span><strong>가격·예약</strong><p>즉시예약, 요청예약, 문의, 외부예약, 정보제공을 명확히 구분</p></article>
      </div>`
    },
    {
      section: "AI & RAG",
      kicker: "16 · AI TRIP PLANNER",
      title: "AI는 일정 초안을 만들고, 실데이터와 규칙이 가능성을 검증",
      summary: "자연어 선호를 구조화하고 RAG와 도구로 장소·상품·운영시간·거리·재고를 조회한 뒤 근거와 신뢰 상태를 함께 제시합니다.",
      theme: "ink",
      visual: `<div>
        <div class="pipeline">
          <article class="pipeline-step"><small>01 · INPUT</small><strong>자연어 요청</strong><p>도시·기간·동행·예산·분위기·꼭 하고 싶은 일</p></article>
          <article class="pipeline-step"><small>02 · RETRIEVE</small><strong>근거 검색</strong><p>장소·상품·정책·스토리·후기·실시간 도구</p></article>
          <article class="pipeline-step"><small>03 · GENERATE</small><strong>일정 초안</strong><p>날짜·시간대·이동·식사·숙소를 함께 구성</p></article>
          <article class="pipeline-step"><small>04 · VALIDATE</small><strong>가능성 검증</strong><p>영업·거리·중복·재고·가격·예약 방식을 확인</p></article>
          <article class="pipeline-step"><small>05 · EDIT</small><strong>대화형 수정</strong><p>“둘째 날 골프 대신 스파”처럼 부분 변경</p></article>
        </div>
        <div class="trust-strip"><div class="trust-item"><i></i>AI 제안 표시</div><div class="trust-item"><i></i>출처·확인 시각</div><div class="trust-item"><i></i>실가격·재고 재검증</div><div class="trust-item"><i></i>평가·차단·감사</div></div>
      </div>`
    },
    {
      section: "MEMBER",
      kicker: "17 · MEMBER & SUPPORT",
      title: "독립 회원을 중심으로 후기와 고객지원을 연결",
      summary: "HotelNGo 회원은 PMS 회원과 분리하며, 여행자 프로필·예약·일정·후기·문의 데이터를 독립적으로 소유합니다.",
      visual: `<div class="flow-band" style="--count:5">
        ${flowNode("users","ACCOUNT","회원·프로필","이메일·SNS·국적·여권 정보")}
        ${flowNode("calendar","MY TRIP","여행·예약","저장 일정·예약·바우처")}
        ${flowNode("review","REVIEW","검증된 후기","실제 이용 연결·사진·신고")}
        ${flowNode("support","CS","고객센터","문의·취소·분쟁·증빙")}
        ${flowNode("shield","PRIVACY","권리 관리","동의·마스킹·삭제·감사")}
      </div>`
    },
    {
      section: "COMMERCE",
      kicker: "18 · CART, ORDER & BOOKING",
      title: "여러 공급자의 예약을 하나의 여행 주문에서 관리",
      summary: "즉시예약·요청예약·문의·외부예약을 구분하고, 부분 성공·취소·환불·정산·대사가 가능한 거래 상태를 설계합니다.",
      visual: `<div>
        <div class="state-flow">
          <article class="state"><small>01</small><strong>여행 카트</strong><p>날짜·인원·옵션 유지</p></article>
          <article class="state"><small>02</small><strong>재검증</strong><p>가격·재고·정책</p></article>
          <article class="state"><small>03</small><strong>주문</strong><p>공급자별 하위 예약</p></article>
          <article class="state"><small>04</small><strong>결제</strong><p>금액·통화·쿠폰</p></article>
          <article class="state"><small>05</small><strong>확정</strong><p>즉시 또는 공급자 승인</p></article>
          <article class="state"><small>06</small><strong>사후관리</strong><p>변경·취소·환불·정산</p></article>
        </div>
        <div class="status-lanes">
          <div class="status-lane good">CONFIRMED · 모든 항목 확정</div>
          <div class="status-lane wait">PENDING SUPPLIER · 공급자 응답 대기</div>
          <div class="status-lane risk">REQUIRES RECONCILIATION · 부분 실패·대사 필요</div>
        </div>
        <div class="cards-4" style="margin-top:.9cqw">
          ${card("hotel","INSTANT","즉시예약","실시간 가격·재고를 재검증합니다.")}
          ${card("support","REQUEST","요청예약","SLA 안에 공급자가 확정합니다.")}
          ${card("link","EXTERNAL","외부예약","거래와 지원 범위를 표시합니다.")}
          ${card("map","INFO","정보 제공","가격·예약 불가 상태를 숨기지 않습니다.")}
        </div>
      </div>`
    },
    {
      section: "HOTEL CENTER",
      kicker: "19 · HOTEL CONTENT CENTER",
      title: "PMS가 다루지 않는 공개 판매 콘텐츠를 호텔이 관리",
      summary: "PMS의 운영 데이터는 그대로 두고, B2C에 필요한 사진·소개·편의시설·정책·객실 콘텐츠와 공개 매핑을 별도 시스템에서 운영합니다.",
      visual: `<div class="ops-collage">
        ${screen("channel-dashboard.png","main-screen","호텔 콘텐츠센터")}
        <div class="ops-side">
          <div class="ops-kpi"><div><small>공개 콘텐츠</small><strong>92%</strong></div><div><small>객실 매핑</small><strong>8/8</strong></div><div><small>검수 대기</small><strong>3</strong></div><div><small>최신 확인</small><strong>D-2</strong></div></div>
          ${card("hotel","CONTENT","관리 항목","호텔·객실 갤러리, 소개, 편의시설, 정책, 체크인, 위치, 다국어")}
          ${card("link","BOUNDARY","책임 경계","PMS 재고·요금·예약은 채널 API, 공개 콘텐츠는 콘텐츠센터가 소유합니다.","accent")}
        </div>
      </div>`
    },
    {
      section: "PARTNER CENTER",
      kicker: "20 · ACTIVITY PARTNER CENTER",
      title: "업종별 상품·자원·슬롯·예약·정산을 파트너가 운영",
      summary: "호텔을 제외한 골프·차량·음식점·스파·투어 업체가 가입과 심사를 거쳐 실제 판매 정보를 등록하고 거래를 처리합니다.",
      visual: `<div class="ops-collage">
        ${screen("partner-dashboard.png","main-screen","액티비티 파트너센터")}
        <div class="ops-side">
          <div class="ops-kpi"><div><small>신규 요청</small><strong>18</strong></div><div><small>응답 SLA</small><strong>94%</strong></div><div><small>이번 달 GMV</small><strong>₩24M</strong></div><div><small>정산 예정</small><strong>D+7</strong></div></div>
          ${card("store","ONBOARDING","가입→승인→판매","사업자·담당자·계약·정산 계좌를 검증한 뒤 상품을 공개합니다.")}
          ${card("calendar","OPERATIONS","운영 데이터","서비스·가격·자원·슬롯·예약·변경·취소·쿠폰·정산을 관리합니다.","accent")}
        </div>
      </div>`
    },
    {
      section: "ADMIN",
      kicker: "21 · PLATFORM ADMIN",
      title: "공급·콘텐츠·거래·정산·신뢰를 한 운영 체계로 관리",
      summary: "관리자 화면에 모든 것을 몰아넣지 않고 각 주체의 운영 화면을 두되, 플랫폼 관리자는 심사·정책·감사·예외 처리를 통제합니다.",
      visual: `<div class="ops-collage">
        ${screen("admin-dashboard.png","main-screen","플랫폼 관리자")}
        <div class="ops-side">
          <div class="ops-kpi"><div><small>심사 대기</small><strong>12</strong></div><div><small>대사 필요</small><strong>4</strong></div><div><small>CS SLA</small><strong>97%</strong></div><div><small>콘텐츠 만료</small><strong>28</strong></div></div>
          ${card("shield","CONTROL","핵심 업무","회원·파트너·업체·콘텐츠·상품·예약·결제·환불·정산·감사를 관리합니다.")}
          ${card("spark","AI GOVERNANCE","AI·RAG 검수","근거 품질, 금칙어, 평가 결과, 비용, 오류와 사용자 피드백을 관측합니다.","accent")}
        </div>
      </div>`
    },
    {
      section: "PMS",
      kicker: "22 · HOTEL_PMS CHANNEL",
      title: "Hotel_PMS를 INTERNAL_PMS 공급 원천으로 연동",
      summary: "B2C가 PMS 파일이나 localStorage를 직접 읽지 않고 HotelSupplyAdapter와 별도 채널 API를 통해 조회·예약·대사를 수행합니다.",
      visual: `<div>
        <div class="mapping-board">
          <section class="mapping-column"><header>HOTEL_PMS</header><ul><li>Tenant</li><li>RoomType</li><li>요금 캘린더</li><li>Room 상태 + Reservation</li><li>PMS Reservation</li></ul></section>
          <div class="mapping-arrow">→</div>
          <section class="mapping-column"><header>HOTELnGO PUBLIC MODEL</header><ul><li>공개 호텔</li><li>객실 상품</li><li>날짜별 Offer</li><li>객실유형별 가용 수량</li><li>PmsReservationLink</li></ul></section>
        </div>
        <div class="status-lanes">
          <div class="status-lane good">1단계 · 독립 fixture와 조회 Mock</div>
          <div class="status-lane wait">2단계 · /api/v1/channel 조회 + Shadow</div>
          <div class="status-lane risk">3단계 · hold/create/modify/cancel/reconcile</div>
        </div>
      </div>`
    },
    {
      section: "DOMAIN",
      kicker: "23 · DOMAIN OWNERSHIP",
      title: "도메인과 데이터 소유권을 시스템별로 명확히 분리",
      summary: "HotelNGo 회원, PMS 고객, 공급자, 여행, 거래, 공개 콘텐츠를 별도 엔티티로 유지하고 필요한 식별자만 링크합니다.",
      visual: `<div class="cards-5" style="height:100%">
        ${card("users","IDENTITY","Customer","HotelNGo 독립 회원·프로필·동의·여권 정보")}
        ${card("store","SUPPLY","Provider · Place","업체·장소·소유권·검수·공급 방식")}
        ${card("calendar","COMPOSE","Trip · Item","여행·날짜·시간·항목·검증·공개 설정")}
        ${card("cart","COMMERCE","Product · Offer · Order","상품·가격·재고·카트·주문·예약·정산")}
        ${card("link","CHANNEL","PMS Link","PMS 호텔·객실·예약 식별자와 동기화 상태","accent")}
      </div>`
    },
    {
      section: "API",
      kicker: "24 · API & INTEGRATION",
      title: "공개·파트너·관리자·공급 API를 계약 중심으로 구축",
      summary: "채널 구현을 교체해도 B2C 표현이 바뀌지 않도록 공급 어댑터를 중심에 두고 인증·멱등성·추적·버전·오류 계약을 공통화합니다.",
      visual: `<div class="adapter-hub">
        <div class="adapter-core">HotelSupplyAdapter<br><small>COMMON CONTRACT</small></div>
        <article class="adapter-satellite"><strong>B2C Public API</strong><p>검색·상세·오퍼·일정·카트·예약·회원</p></article>
        <article class="adapter-satellite"><strong>Partner API</strong><p>업체·상품·자원·슬롯·예약·정산</p></article>
        <article class="adapter-satellite"><strong>Admin API</strong><p>심사·권한·감사·대사·CS·AI 운영</p></article>
        <article class="adapter-satellite"><strong>External Adapters</strong><p>PG·지도·날씨·메시지·환율·미디어</p></article>
        <article class="adapter-satellite"><strong>PMS Channel API</strong><p>호텔·객실·요금·재고·예약·대사</p></article>
      </div>`
    },
    {
      section: "DESIGN",
      kicker: "25 · BRAND & EXPERIENCE",
      title: "한국형 상용 여행 서비스의 밀도와 감성 콘텐츠를 결합",
      summary: "신뢰감 있는 블루를 주색으로 사용하고, HotelnGo의 n 심볼과 지도 마커 O를 아이덴티티로 유지하며 화면별 목적과 전환을 명확히 합니다.",
      visual: `<div class="split-layout wide-left">
        <div class="desktop-collage">${screen("home.png","main-screen","데스크톱 홈")}<div class="side-screens">${screen("mobile-home.png","","모바일 홈")}${screen("mobile-trip.png","","모바일 일정")}</div></div>
        <div>
          <div class="metric-grid" style="grid-template-columns:1fr 1fr">
            <div class="metric-card"><small>PRIMARY</small><strong style="color:#356dff">#356DFF</strong><p>행동과 신뢰</p></div>
            <div class="metric-card"><small>ACCENT</small><strong style="color:#16c4d8">#16C4D8</strong><p>여행과 연결</p></div>
            <div class="metric-card"><small>TYPE</small><strong>Pretendard</strong><p>한국어 정보 밀도</p></div>
            <div class="metric-card"><small>IDENTITY</small><strong>n + map O</strong><p>브랜드 자산</p></div>
          </div>
          ${chips(["명확한 위계", "44px 이상 터치", "공통 컴포넌트", "반응형", "상태 피드백"], "teal")}
        </div>
      </div>`
    },
    {
      section: "QUALITY",
      kicker: "26 · QUALITY & RELIABILITY",
      title: "거래 서비스 수준의 보안·성능·접근성·운영 품질",
      summary: "예약과 개인정보를 다루는 서비스이므로 기능 완성도뿐 아니라 실패를 감지하고 복구하는 운영 품질을 출시 기준에 포함합니다.",
      visual: `<div class="cards-5" style="height:100%">
        ${card("lock","SECURITY","보안","MFA·RBAC·암호화·마스킹·감사·최소수집")}
        ${card("chart","PERFORMANCE","성능","이미지 최적화·캐시·검색 지연·API SLO")}
        ${card("users","ACCESSIBILITY","접근성","키보드·대비·레이블·포커스·오류 안내")}
        ${card("compass","GLOBAL","국제화·SEO","통화·시간대·다국어·구조화 데이터")}
        ${card("shield","OPERATIONS","운영 안정성","관측·알림·재시도·대사·롤백·장애 대응","accent")}
      </div>`
    },
    {
      section: "ROADMAP",
      kicker: "27 · RELEASE ROADMAP",
      title: "공급과 거래 능력을 검증하며 단계적으로 출시",
      summary: "모든 업종의 즉시예약을 한 번에 구축하지 않고 호텔 조회와 요청예약으로 시작해 운영 능력이 검증된 영역부터 확장합니다.",
      visual: `<div class="roadmap">
        <article class="roadmap-phase" data-phase="1"><small>WAVE 1 · FOUNDATION</small><h3>사업·플랫폼·공급 기반</h3><p>0~3단계</p><ul><li>고객·도시·공급 가설 검증</li><li>독립 계정·DB·API·감사</li><li>Provider·Place·claim·콘텐츠</li><li>PMS 호텔 조회·Shadow</li></ul></article>
        <article class="roadmap-phase" data-phase="2"><small>WAVE 2 · DEMAND & COMPOSE</small><h3>발견·일정·요청 예약</h3><p>4~6단계</p><ul><li>홈·스토리·랜드마크·공개 일정</li><li>다일정 편집·지도·검증</li><li>현지 서비스 요청 예약</li><li>복수 업종 조합률 검증</li></ul></article>
        <article class="roadmap-phase" data-phase="3"><small>WAVE 3 · TRANSACTION & SCALE</small><h3>결제·PMS 예약·AI·확장</h3><p>7~10단계</p><ul><li>주문·PG·환불·정산·대사</li><li>PMS hold·예약·변경·취소</li><li>RAG·도구·평가 기반 AI</li><li>도시·다국어·앱·개인화</li></ul></article>
      </div>`
    },
    {
      section: "ORGANIZATION",
      kicker: "28 · OPERATING MODEL",
      title: "사업·공급·거래·제품·기술을 함께 운영하는 조직",
      summary: "기능 구축만이 아니라 공급 심사, 콘텐츠 권리, 예약 예외, 취소·환불·정산, AI 근거와 장애 대응까지 지속 업무로 설계합니다.",
      visual: `<div class="org-chart">
        <article class="org-role"><div class="avatar">${icon("chart")}</div><h3>사업·상품·공급</h3><ul><li>범위·가격·수수료·KPI</li><li>호텔·업체 영업·입점</li><li>도시·콘텐츠·미디어 권리</li></ul></article>
        <article class="org-role"><div class="avatar">${icon("support")}</div><h3>거래·고객 운영</h3><ul><li>예약·변경·취소·분쟁</li><li>환불·정산·파트너 지급</li><li>공급 불가·대체·SLA</li></ul></article>
        <article class="org-role"><div class="avatar">${icon("api")}</div><h3>제품·플랫폼·PMS</h3><ul><li>고객 여정·디자인·접근성</li><li>API·DB·인증·거래</li><li>채널·예약·대사·회귀</li></ul></article>
        <article class="org-role"><div class="avatar">${icon("spark")}</div><h3>Data·AI·QA·Security</h3><ul><li>RAG·일정·평가·관측</li><li>품질·성능·보안</li><li>배포·장애·롤백 문서</li></ul></article>
      </div>`
    },
    {
      section: "KPI",
      kicker: "29 · BUSINESS VALIDATION",
      title: "저장과 일정에서 거래·공헌이익까지 단계별로 검증",
      summary: "허영 지표 대신 발견→구성→거래→공급→유지의 전환과 비용을 연결해 한 도시에서 사업 모델의 반복 가능성을 판단합니다.",
      visual: `<div class="kpi-dashboard">
        <section class="kpi-bars">
          ${[
            ["발견 → 목적지 선택","72%"],["스토리 → 저장","58%"],["여행 초안 생성","66%"],["2개 이상 업종 조합","54%"],["일정 → 카트","46%"],["요청 → 공급자 확정","62%"],["카트 → 결제","38%"],["저장 고객 재방문","49%"]
          ].map(([l,v])=>`<div class="bar-row"><label>${l}</label><span class="bar-track"><i style="--value:${v}"></i></span><strong>${v}</strong></div>`).join("")}
        </section>
        <div class="gate-stack">
          <article class="gate-card"><small>DEMAND</small><strong>발견·저장·목적지 선택</strong><p>감성 콘텐츠가 실제 행동을 만드는지 확인</p></article>
          <article class="gate-card"><small>COMPOSITION</small><strong>여행당 항목·업종 조합</strong><p>전체 일정 구성 가치 확인</p></article>
          <article class="gate-card"><small>TRANSACTION</small><strong>카트·결제·GMV·확정</strong><p>거래 수익과 실패율 확인</p></article>
          <article class="gate-card"><small>ECONOMICS</small><strong>CAC·공헌이익·재구매</strong><p>도시 확장 전 단위경제성 확인</p></article>
        </div>
      </div>`
    },
    {
      section: "ECONOMICS",
      kicker: "30 · COST & UNIT ECONOMICS",
      title: "매출이 아니라 거래당 공헌이익으로 사업성을 판단",
      summary: "수수료와 제휴 수익에서 PG·쿠폰·CS·환불·정산·지도·AI 등 예약당 변동비를 차감하고 CAC 회수 가능성을 검토합니다.",
      visual: `<div class="cost-layout">
        <div><div class="cost-donut"></div>${chips(["개발·인프라", "공급 영업", "콘텐츠", "CS·정산", "마케팅"], "teal")}</div>
        <div>
          <div class="unit-equation"><div><small>호텔 수수료</small><strong>+</strong></div><span>+</span><div><small>액티비티 수익</small><strong>+</strong></div><span>−</span><div><small>거래 변동비</small><strong>= 공헌이익</strong></div></div>
          <div class="cards-3" style="margin-top:1cqw">
            ${card("cart","REVENUE","거래 수익","호텔·액티비티·리드·제휴·광고 수익")}
            ${card("support","VARIABLE COST","변동비","PG·쿠폰·CS·환불·정산·지도·메시지·AI")}
            ${card("chart","CUSTOMER ECONOMICS","고객 단위경제성","생애 공헌이익 − 고객 획득비용","accent")}
          </div>
          <p class="slide-summary" style="font-size:.8cqw">평균 판매가·수수료율·CS·쿠폰·재구매율·손익분기 거래 수는 도시·업종별 근거와 산식으로 확정합니다.</p>
        </div>
      </div>`
    },
    {
      section: "RISK",
      kicker: "31 · RISK MANAGEMENT",
      title: "공급·거래·AI·운영 위험을 출시 단계에서 통제",
      summary: "범위 확대보다 신뢰 가능한 정보와 부분 실패 복구를 우선하며, 도시와 예약 방식별로 위험을 낮춘 뒤 확장합니다.",
      visual: `<div class="risk-matrix">
        <div class="risk-y">영향도 ↑</div>
        <div class="risk-board">
          <div><span class="risk-chip">콘텐츠 권리</span><span class="risk-chip">SEO 의존</span></div>
          <div><span class="risk-chip">공급 밀도 부족</span><span class="risk-chip">오래된 정보</span><span class="risk-chip">현지 SLA</span></div>
          <div><span class="risk-chip">범위 과대</span><span class="risk-chip">외부 API 비용</span></div>
          <div><span class="risk-chip">PMS 지연</span><span class="risk-chip">부분 예약 실패</span><span class="risk-chip">AI 환각</span><span class="risk-chip">개인정보·여권</span><span class="risk-chip">취소·분쟁</span></div>
        </div>
        <div class="risk-x">발생 가능성 →</div>
      </div>`
    },
    {
      section: "DECISION GATES",
      kicker: "32 · GO / HOLD / STOP",
      title: "다섯 개 의사결정 Gate로 투자와 확장을 통제",
      summary: "문제·공급·거래·단위경제성·확장 가설이 순서대로 검증되어야 다음 단계의 범위와 예산을 승인합니다.",
      visual: `<div class="decision-board">
        <article class="decision-gate" data-gate="1"><small>GATE 1</small><strong>문제·고객 검증</strong><p>다일정 어려움, 감성 콘텐츠, 직접·AI 방식 선호</p><span class="decision">INTERVIEW → PROTOTYPE</span></article>
        <article class="decision-gate" data-gate="2"><small>GATE 2</small><strong>공급 검증</strong><p>도시별 공급 밀도, 상품 운영 의사, 요청예약 SLA</p><span class="decision">SUPPLY PILOT</span></article>
        <article class="decision-gate" data-gate="3"><small>GATE 3</small><strong>거래 검증</strong><p>가격·재고 신뢰, 요청 확정, 비호텔 객단가 기여</p><span class="decision">PAID TRANSACTION</span></article>
        <article class="decision-gate" data-gate="4"><small>GATE 4</small><strong>단위경제성</strong><p>공헌이익, CAC 회수, 취소·CS·현지 운영 비용</p><span class="decision">SCALE BUDGET</span></article>
        <article class="decision-gate" data-gate="5"><small>GATE 5</small><strong>도시 확장</strong><p>재방문·공급 안정성·운영 품질의 반복 가능성</p><span class="decision">REPLICATE CITY</span></article>
      </div>`
    },
    {
      section: "OPEN DECISIONS",
      kicker: "33 · ITEMS TO CONFIRM",
      title: "사업 착수 전에 확정해야 할 14개 핵심 항목",
      summary: "도시·공급·거래·정책·기술·법무·AI·조직의 미확정 사항을 책임자와 기한이 있는 의사결정 항목으로 관리합니다.",
      visual: `<div class="decision-board" style="grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr)">
        ${[
          ["01–02","시장·공급","1차 국가·도시와 목표 호텔·업체·상품 수"],
          ["03–04","거래·PMS","실거래 업종·예약 방식과 채널 API 주체·일정"],
          ["05–06","정책","수수료·쿠폰·정산·지급과 취소·환불·노쇼·분쟁"],
          ["07–08","사업자·기술","PG·지도·메시지·미디어·날씨와 백엔드·DB·클라우드"],
          ["09–10","국제·법무","통화·환율·세금과 중개·개인정보·국외이전"],
          ["11–12","AI·조직","모델·평가·운영비 한도와 조직·예산·단계 일정"],
          ["13","KPI","목표값·투자 판단 기준·Gate 승인권자"],
          ["14","브랜드","공식 서비스 도메인·상표·표기 원칙"]
        ].map(([n,t,p])=>`<article class="decision-gate" data-gate="${n}"><small>DECISION ${n}</small><strong>${t}</strong><p>${p}</p></article>`).join("")}
      </div>`
    },
    {
      section: "APPENDIX A",
      kicker: "34 · COMPLETE MENU MAP",
      title: "B2C와 운영 시스템의 전체 메뉴 구조",
      summary: "고객·호텔·액티비티 파트너·플랫폼 관리자·PMS 채널의 역할별 화면을 분리하고 공통 거래 상태로 연결합니다.",
      visual: `<div class="menu-map">
        <section class="menu-column"><header>${icon("users")}B2C</header><ul><li>홈·여행 발견</li><li>여행 일정·AI</li><li>호텔·즐길거리</li><li>카트·예약·결제</li><li>내 여행·후기·CS</li></ul></section>
        <section class="menu-column"><header>${icon("hotel")}호텔 콘텐츠</header><ul><li>호텔·객실 콘텐츠</li><li>갤러리·편의시설</li><li>정책·위치·다국어</li><li>PMS 공개 매핑</li><li>검수·발행</li></ul></section>
        <section class="menu-column"><header>${icon("store")}파트너</header><ul><li>가입·승인</li><li>업체·상품·자원</li><li>가격·슬롯·쿠폰</li><li>예약·변경·취소</li><li>정산·통계·문의</li></ul></section>
        <section class="menu-column"><header>${icon("shield")}관리자</header><ul><li>회원·권한·심사</li><li>장소·콘텐츠·상품</li><li>주문·결제·환불</li><li>정산·CS·감사</li><li>AI·RAG·운영</li></ul></section>
        <section class="menu-column"><header>${icon("link")}PMS 채널</header><ul><li>호텔·객실 매핑</li><li>요금·재고 조회</li><li>동기화·Shadow</li><li>예약 명령·상태</li><li>대사·재처리·로그</li></ul></section>
      </div>`
    },
    {
      section: "APPENDIX B",
      kicker: "35 · REQUIREMENT COVERAGE",
      title: "최초 계획서의 모든 핵심 항목을 본 계획에 연결",
      summary: "사업·공급·고객·B2C·파트너·관리자·데이터·PMS·비기능·로드맵·테스트 항목을 1~35장에 추적 가능하게 배치합니다.",
      visual: `<div class="coverage-board">
        <section class="coverage-list"><h3>사업·고객·서비스</h3>
          ${[["01–06","비전·사업 구조"],["04·17","사용자·회원·권한"],["10–12","B2C·홈·스토리"],["13","직접 일정·공개 일정"],["14","호텔 검색·예약"],["15·20","업종별 상품·파트너"],["16","AI 여행·RAG"],["18","카트·통합 거래"]].map(([n,t])=>`<div class="coverage-item"><span>${n}</span><strong>${t}</strong><i></i></div>`).join("")}
        </section>
        <section class="coverage-list"><h3>공급·기술·운영·검증</h3>
          ${[["09·23","공급·입점·소유권"],["19–21","콘텐츠·파트너·관리자"],["22","Hotel_PMS 연동"],["23–24","데이터·API"],["25–26","디자인·비기능"],["27–28","로드맵·조직"],["29–32","KPI·손익·위험·Gate"],["33–35","확정 항목·메뉴·추적"]].map(([n,t])=>`<div class="coverage-item"><span>${n}</span><strong>${t}</strong><i></i></div>`).join("")}
        </section>
      </div>`
    }
  ];

  const stage = document.querySelector("[data-deck-stage]");
  const currentLabel = document.querySelector("[data-current]");
  const totalLabel = document.querySelector("[data-total]");
  const progress = document.querySelector("[data-progress]");
  const sectionLabel = document.querySelector("[data-section-name]");
  const prevButton = document.querySelector("[data-prev]");
  const nextButton = document.querySelector("[data-next]");
  const overview = document.querySelector("[data-overview]");
  const overviewGrid = document.querySelector("[data-overview-grid]");
  let current = 0;
  let touchStartX = 0;

  function renderSlides() {
    stage.innerHTML = slides.map((slide, index) => `
      <section class="web-slide ${slide.cover ? "cover-slide" : ""}" data-slide="${index}" aria-label="${index + 1} / ${slides.length}: ${slide.title}">
        ${slide.cover ? slide.visual : standardBody(slide, index)}
      </section>`).join("");

    overviewGrid.innerHTML = slides.map((slide, index) => `
      <button type="button" class="overview-card" data-overview-slide="${index}">
        <span class="overview-thumb" data-number="${String(index + 1).padStart(2, "0")}"><strong>${slide.title}</strong></span>
        <span>${slide.section}</span>
      </button>`).join("");

    totalLabel.textContent = String(slides.length).padStart(2, "0");
  }

  function readHash() {
    const match = location.hash.match(/slide-(\d+)/);
    if (!match) return 0;
    return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
  }

  function goTo(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    stage.querySelectorAll(".web-slide").forEach((node, i) => {
      node.classList.toggle("is-active", i === current);
      node.classList.toggle("is-before", i < current);
      node.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
    overviewGrid.querySelectorAll(".overview-card").forEach((node, i) => node.classList.toggle("active", i === current));
    currentLabel.textContent = String(current + 1).padStart(2, "0");
    progress.style.height = `${((current + 1) / slides.length) * 100}%`;
    sectionLabel.textContent = slides[current].section;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    document.title = `${String(current + 1).padStart(2, "0")} · ${slides[current].title} | HotelNGo`;
    if (updateHash) history.replaceState(null, "", `#slide-${current + 1}`);
  }

  function toggleOverview(show) {
    const shouldShow = typeof show === "boolean" ? show : overview.hidden;
    overview.hidden = !shouldShow;
    document.body.classList.toggle("overview-open", shouldShow);
    if (shouldShow) {
      const active = overviewGrid.querySelector(".overview-card.active");
      active?.scrollIntoView({ block: "center" });
      active?.focus({ preventScroll: true });
    }
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }

  renderSlides();
  goTo(readHash(), false);

  prevButton.addEventListener("click", () => goTo(current - 1));
  nextButton.addEventListener("click", () => goTo(current + 1));
  document.querySelector("[data-overview-open]").addEventListener("click", () => toggleOverview(true));
  document.querySelectorAll("[data-overview-close]").forEach((node) => node.addEventListener("click", () => toggleOverview(false)));
  document.querySelector("[data-fullscreen]").addEventListener("click", toggleFullscreen);
  overviewGrid.addEventListener("click", (event) => {
    const target = event.target.closest("[data-overview-slide]");
    if (!target) return;
    goTo(Number(target.dataset.overviewSlide));
    toggleOverview(false);
  });

  window.addEventListener("hashchange", () => goTo(readHash(), false));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overview.hidden) return toggleOverview(false);
    if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      goTo(current + 1);
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goTo(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(slides.length - 1);
    } else if (event.key.toLowerCase() === "o") {
      event.preventDefault();
      toggleOverview();
    } else if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  stage.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  stage.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 48) return;
    goTo(current + (distance < 0 ? 1 : -1));
  }, { passive: true });
})();
