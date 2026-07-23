# HotelnGo 디자인 시스템 v1.0

## 1. 브랜드 기준

현재 적용 로고 표기는 `HotelnGo`이며 확정안은 **03 · Ocean Route**다. 홈페이지와 하위 페이지 헤더는 `assets/brand/n-color-types.html#color-03`의 실제 헤더 SVG 마크업을 그대로 사용한다.

- 차콜 `Hotel`, `g`: 안정적인 고딕 워드마크
- 아쿠아·블루 경로형 `n`: 호텔과 다음 목적지를 연결하는 여행 경로
- 블루 지도 마커 `O`: 브랜드의 가장 강한 시각적 강조점
- 지도 핀 형태의 마지막 `O`: 목적지를 찾고 선택하는 행동
- 핀 안의 화살표: 다음 장소로 이동하는 여정
- 슬로건: `STAY HERE. GO ANYWHERE.`

아이덴티티는 지도 마커형 `O`에 집중하고 `n`은 여행 경로와 연결을 보조한다. 현재 화면 정본은 `index.html`과 `scripts/site-shell.js`의 동일 SVG 마크업이며, 고정 보관본은 `assets/brand/n-color-types-v10-ocean-route.html#color-03`이다.

## 2. 한국 사용자를 위한 해외여행 UX 원칙

1. **해외 검색 우선** — 첫 화면에서 해외 도시, 일정, 인원과 검색 버튼을 즉시 찾을 수 있어야 한다.
2. **먼저 느끼고 다음에 예약** — 검색과 서비스 진입 직후 현지의 시간·소리·동선·사람이 느껴지는 몰입형 콘텐츠를 배치해 여행 욕구를 만든다.
3. **감성은 구체적으로** — 막연한 수식어 대신 실제 장소, 시간대, 현지 가이드의 시선, 이동 순서와 체류 경험으로 “가보지 않아도 가본 듯한” 장면을 전달한다.
4. **한국어 우선** — 영문 장식 문구와 세리프 서체를 지양하고 짧고 직접적인 한국어를 사용한다.
5. **빠른 비교** — 숙소명, 위치, 평점·평가 수, 할인 가격을 한 카드에서 비교할 수 있게 한다.
6. **친근하지만 가볍지 않게** — 둥근 카드와 선명한 카테고리 색을 사용하되 과도한 캐릭터·장식을 피한다.
7. **상태를 숨기지 않기** — 최신 가격, 확인 중, 매진, 잔여 수량을 명시하고 확인되지 않은 재고를 판매 가능처럼 표현하지 않는다.

8. **해외 우선 범위** — 펜션, 캠핑, 글램핑, 대실과 국내 상품은 1차 내비게이션에서 제외한다.
9. **결정 정보는 정확하게** — 감성 콘텐츠로 관심을 만든 뒤 쿠폰 금액, 가격, 취소 조건, 잔여 객실과 데이터 확인 시각을 숨김없이 제공한다.
10. **사람의 취향을 연결** — 테마 가이드에는 크리에이터, 저장·반응, 장소 수, 코스 거리와 순서를 함께 보여주어 소셜 탐색과 예약을 연결한다.

## 3. 메인 정보 구조

1. 상단 서비스 내비게이션
2. 추천 여행·이벤트 자동 순환 광고 캐러셀
3. 해외 숙소 검색
4. 호텔·항공·패키지·투어 핵심 서비스와 4개 보조 테마 탐색
5. 현지 장면·소리·크리에이터 동선을 결합한 몰입형 테마 가이드
6. 해외 쿠폰·근거리 해외·글로벌 호텔 특가
7. SNS형 랜드마크 스토리 피드
8. 해외 인기 여행지와 유형별 추천 호텔
9. 회원가 및 앱 전환 배너
10. 사업자·고객센터 정보

## 4. 색상 토큰

정본은 `styles/tokens.css`다. 페이지와 컴포넌트는 의미 토큰을 사용한다.

| 토큰 | 기본값 | 용도 |
|---|---:|---|
| `--brand-primary` | `#2F6BFF` | GO 로고, 내비게이션 선택, 주요 CTA |
| `--brand-primary-deep` | `#1F55D5` | 호버, 강조 배경 |
| `--brand-primary-soft` | `#EDF3FF` | 선택·회원 혜택 배경 |
| `--brand-journey` | `#159A8C` | 로고의 연결자 `n`, 여행 발견 보조 강조 |
| `--brand-accent` | `#2F6BFF` | 검색과 핵심 행동 |
| `--brand-accent-strong` | `#1F55D5` | CTA 호버 |
| `--surface-soft` | `#F6F8F8` | 지역·보조 섹션 배경 |
| `--text-strong` | `#202624` | 제목과 가격 |
| `--text-body` | `#505957` | 일반 본문 |
| `--text-muted` | `#8A9492` | 보조 정보 |

색상 변경은 이 토큰에서 관리한다. 브랜드는 차콜과 블루를 기본으로 하며 할인·오류 상태만 별도 의미색을 사용한다.

## 5. 타이포그래피와 형태

- 인터페이스: 로컬 가변 폰트를 `Pretendard` 패밀리명으로 제공하고 시스템 폴백을 연결한다.
- 영문 로고: `n-color-types.html#color-03`의 actual SVG 마크업만 그대로 사용하며 다시 그리거나 추적하지 않는다.
- 본문: `16px / 400 / 24px`, 자간 `normal`
- 메인 광고 제목: `32px / 700 / 38px`, 자간 `normal`
- 섹션 제목: `18px / 700 / 20px`, 자간 `normal`
- 상품명: `16px / 700 / 24px`, 자간 `normal`
- 실제 정보를 전달하는 텍스트의 최소 크기: `11px`. 배지·메타 정보·사진 수·확인 시각도 이보다 작게 만들지 않는다.
- 메타·보조 정보: `11~12px`, 카드 본문·필드 라벨: `12~14px`, 일반 버튼: `13px`, 검색·핵심 CTA: `14~16px`
- 11px 텍스트는 짧은 보조 정보에만 사용하고 두 줄 이상의 설명문은 최소 12px를 사용한다.
- 전역 `font-variation-settings`로 굵기를 고정하지 않고 각 컴포넌트의 `font-weight`를 사용한다.
- 검색·프로모션: 7~14px radius
- 핵심 서비스: 설명이 있는 4열 카드, 블루 선형 아이콘, 작은 영문 인덱스
- 보조 테마 서비스: 골프·미식·랜드마크·AI를 얇은 탐색선으로 낮춰 핵심 서비스와 위계를 구분
- 몰입형 콘텐츠: 어두운 에디토리얼 배경, 큰 현지 장면, 시간·소리·코스 정보, 크리에이터 프로필을 한 화면에 구성
- 숙소 카드: 사진/시각 영역 → 유형 → 이름 → 위치 → 평점 → 가격 순서
- 주 행동과 선택 상태는 블루, 일반 정보는 차콜과 중성 회색으로 역할을 분리한다.

## 6. 반응형 기준

| 범위 | 기준 |
|---|---|
| 1080px 초과 | 전체 메뉴, 통합 검색 1행, 숙소 4열 |
| 801~1080px | 일부 메뉴 축소, 숙소 2열 |
| 561~800px | 모바일 메뉴, 검색 2열, 지역 3열 |
| 560px 이하 | 검색 1열, 혜택·지역·숙소 가로 스냅, 하단 탭 |

모바일 하단 메뉴는 요구사항과 동일하게 `홈 / 검색 / AI 여행 / 내 여행 / 마이`로 고정한다.

## 7. 접근성·상태

- 검색 탭과 지역 탭은 `role=tab`, `aria-selected`를 함께 갱신한다.
- 메뉴는 `aria-expanded`, `hidden`, Escape 닫기를 지원한다.
- 단일 선택 메뉴는 공통 `ui-select` 컴포넌트로 변환하고 `listbox`, `option`, `aria-expanded`, 방향키, Home/End, Enter/Space, Escape, 바깥 클릭 닫기를 지원한다.
- 원래 `<select>`는 폼 값과 접근성 의미를 유지하며, 공통 컴포넌트 선택값과 `change` 이벤트를 양방향 동기화한다.
- 입력 필드는 시각 제목과 접근 가능한 이름을 함께 제공한다.
- 할인·잔여 수량은 색상뿐 아니라 텍스트로 표시한다.
- 모바일 가로 목록은 터치 스크롤과 스냅을 지원한다.
- `prefers-reduced-motion`에서는 이동 효과를 최소화한다.

## 8. 적용 파일

- 공식 로고·심볼: `assets/brand/official/`
- 원본·작업 이력: `assets/brand/source/`, `assets/brand/archive/legacy-svg/`
- 폰트: `assets/fonts/PretendardVariable.woff2`
- 토큰: `styles/tokens.css`
- 공통 선택 메뉴: `styles/components.css`, `scripts/ui-components.js`
- 레이아웃·컴포넌트: `styles/main.css`
- 메인 화면: `index.html`
- B2C 전체 공통 셸: `scripts/site-shell.js` — 메인·하위 페이지 헤더, 푸터, 모바일 하단 탭
- 파트너·관리자 공통 셸: `scripts/backoffice-shell.js`, `styles/backoffice.css` — 서로 다른 메뉴·인증 경계
- 하위 페이지 컴포넌트: `styles/pages.css`, `scripts/pages.js`
- B2C 인증: `scripts/auth.js` — 회원가입, 로그인, 비밀번호 재설정·변경, 독립 B2C Session Mock
- 관리자 인증: `scripts/admin-auth.js` — `HOTELNGO_ADMIN` 전용 Session Mock과 접근 가드
- 회원 데이터: `scripts/member-data.js`, `scripts/admin-members.js` — 여행자 기본값, 마스킹 여권, 관리자 회원 목록·상세
- 예약·결제 프로토타입 동작: `scripts/commerce.js` — 입력 검증, 카트 합계, 정적 단계 전환과 Mock 작업 안내
- 계획 기준선 공통 화면: `styles/workflow-pages.css`, `scripts/workflow-pages.js`, `data/mock/workflow-pages.json` — 목록·폼·상세·상태·지도·Dialog·Toast를 동일 토큰으로 렌더링
- 여행지·호텔·숙박내역 통합 검색: `scripts/search-autocomplete.js`, `data/mock/search-catalog.json` — 그룹형 제안, 키보드 탐색, 호텔 상세 직접 진입
- 시각 스타일 가이드: `style-guide.html`
- B2C 탐색 화면: `search.html`, `discover.html`, `story.html`, `landmark.html`, `hotels.html`, `hotel-detail.html`, `experiences.html`, `experience-detail.html`, `flights.html`, `packages.html`, `ai-travel.html`, `trips.html`, `saved.html`, `benefits.html`
- B2C 거래 화면: `cart.html`, `booking-guests.html`, `booking-review.html`, `checkout.html`, `booking-complete.html`, `booking-detail.html`, `orders.html`, `bookings.html`
- B2C 계정·정책 화면: `login.html`, `signup.html`, `password-reset.html`, `my.html`, `company.html`, `terms.html`, `privacy.html`
- 파트너 화면: `partner-login.html`, `partner-dashboard.html`, `partner-onboarding.html`, `partner-property.html`, `partner-inventory.html`, `partner-bookings.html`, `partner-finance.html`, `partner-members.html`, `partner-settings.html`
- 관리자 화면: `admin-login.html`, `admin-dashboard.html`, `admin-members.html`, `admin-member-detail.html`, `admin-catalog.html`, `admin-review.html`, `admin-content.html`, `admin-commerce.html`, `admin-ai.html`, `admin-system.html`
- 인터랙션: `scripts/main.js`

호텔 검색 결과, 상세와 Offer 화면에서는 이 기준에 필터, 객실 요금, 취소 조건, 데이터 확인 시각과 공급 상태를 추가한다.

## 9. 파트너·관리자 운영 UI 확장

- 파트너 회원가입과 로그인은 B2C 디자인을 복제하지 않고 운영 도구용 분할 인증 레이아웃을 사용한다.
- 입점 상태는 원형 단계 표시로 `계정 → 업체 제출 → 플랫폼 심사 → 운영 활성화`를 한 화면에서 읽게 한다.
- 업종 운영 화면은 공통 KPI·카드·표·폼 토큰을 재사용하되 호텔, 골프, 차량, 음식점, 스파, 투어의 필드 묶음은 서로 분리한다.
- 다른 업종 화면을 열었을 때는 `READ ONLY` 미리보기 안내와 비활성 편집 버튼으로 권한 범위를 명시한다.
- 플랫폼 선등록 장소와 파트너 인증 장소는 B2C 카드에서 같은 레이아웃을 사용하되 `정보 제공 장소 / HotelnGo 인증 업체`, 최근 검수일, 예약 방식을 텍스트로 구분한다.
- 소유권 요청은 기존 관계를 보존한다는 설명을 항상 함께 표시한다. 새 업체 등록과 기존 업체 인수 CTA를 혼합하지 않는다.
- 960px 이하에서는 운영 사이드바가 Drawer로, 업종 카드가 2열로 바뀌며 600px 이하에서는 단일 열로 바뀐다.

관련 파일은 `partner-*.html`, `admin-partners.html`, `admin-providers.html`, `admin-provider-claims.html`, `places.html`, `place-detail.html`, `scripts/partner-auth.js`, `scripts/partner-portal.js`, `scripts/admin-partner-ops.js`, `scripts/places.js`다.
