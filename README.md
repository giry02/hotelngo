# HotelnGo

> **브랜드 로고 잠금:** 새 UI 작업 전에 `assets/brand/brand-config.json`과 `docs/hotelngo/13-brand-logo-style-guide.md`를 먼저 확인한다. 웹 헤더는 `n-color-types.html#color-03`에서 확정된 SVG 마크업만 사용한다.

해외 숙소 검색에서 시작해 호텔, 항공, 패키지, 투어, 랜드마크 스토리와 AI 여행을 연결하는 B2C 여행 플랫폼의 JSON Mock 프로토타입이다. 국내 상품은 이후 확장 범위다.

## 실행

의존성이나 빌드 없이 정적 서버로 실행한다.

```powershell
python -m http.server 8791
```

브라우저에서 `http://127.0.0.1:8791/`을 연다.

## 현재 구현

- Ocean Route의 actual SVG 원본을 메인·하위 페이지 헤더에 126px로 적용하고 v10 HTML을 동일 바이트로 별도 보관
- 웹 스타일 가이드와 메인 포함 B2C 공통 헤더·푸터·모바일 탭 셸
- 통합검색·여행 발견·스토리·랜드마크·호텔 검색/상세·즐길거리 목록/상세·항공·패키지 화면
- 규칙형 AI 여행·로그인 전용 내 여행·저장·예약 조회·마이 화면
- 여행 카트부터 예약자 입력, 최종 확인, 결제, 접수 완료, 주문·예약 상세까지 이어지는 거래 피드백 화면
- JSON 계정·브라우저 세션으로 동작하는 B2C 로그인·회원가입·비밀번호 재설정/변경, 여행자 기본값과 회사소개·약관·개인정보처리방침 화면
- B2C·관리자·PMS와 분리된 파트너 회원가입·로그인·비밀번호 재설정, 업체 입점 신청·상태·기존 페이지 소유권 요청 Mock 흐름
- PMS와 분리된 호텔 콘텐츠센터에서 호텔 소개·정책·편의시설·사진과 객실유형별 다중 이미지를 관리하는 Mock 흐름
- 골프장·차량·음식점·카페·마사지·스파·투어·체험의 업종별 상품·자원·수용량·운영 슬롯·호텔 결합 할인·예약·정산 화면
- 회원이 일정을 공개하고 다른 회원이 독립 초안으로 복사한 뒤 예약 가능 항목을 분류하는 여행 가이드 흐름
- 별도 관리자 계정·세션을 사용하는 관리자 대시보드·B2C 회원·파트너 가입 심사·Provider/Place 선등록·소유권 요청·콘텐츠·예약거래·AI/RAG·감사시스템 화면
- 플랫폼 관리자와 분리된 JSON 계정·세션의 PMS 채널 운영 로그인, 대시보드·호텔/객실 매핑·동기화/대사 화면
- 공식 로고·심볼을 `assets/brand/official/`, 원본을 `source/`, 이전 SVG 시도를 `archive/legacy-svg/`로 분리 관리
- 동일한 조형에 Open Sans ExtraBold 800을 적용한 폰트 비교용 로고
- 폰트형·게이트형·포털형·브리지형·루트형 `n` 로고 비교 보드
- 첨부 레퍼런스를 재해석한 `n` 심볼 9종의 블루그레이·뉴트럴 그레이 및 실제 헤더 크기 비교 보드
- 동일한 추출형 `n` 심볼을 1.45배 확대한 뒤 웜 선셋·아쿠아 바이올렛 등 색상만 바꾼 9종 비교 보드
- 첨부 이미지의 비례를 바탕으로 Hotel·g를 매끈한 곡선 SVG로 그리고 n만 색상을 바꾼 비폰트 벡터 비교 보드
- 프로젝트에 포함한 Pretendard Variable 한국어 웹폰트
- 해외 숙소 우선 검색. 국내 상품은 현재 내비게이션에서 제외
- 해외호텔·항공·패키지·투어 핵심 카드와 골프·미식·랜드마크·AI 보조 탐색
- 추천 여행·이벤트 3종 자동 순환 광고 캐러셀
- 현지 시간·소리·크리에이터 코스를 담은 몰입형 테마 가이드
- SNS형 랜드마크 스토리와 해외 인기 여행지
- 쿠폰·특가와 유형별 해외 추천 호텔
- 검색 탭, 지역 탭, 숙소 필터, 찜 인터랙션
- 데스크톱/태블릿/모바일 반응형 레이아웃
- 모바일 메뉴와 하단 내비게이션

색상은 `styles/tokens.css`, B2C 레이아웃은 `styles/main.css`와 `styles/pages.css`, 운영 화면은 `styles/backoffice.css`에서 관리한다. 공통 B2C 영역은 `scripts/site-shell.js`, 파트너·관리자·PMS 채널 영역은 `scripts/backoffice-shell.js`가 생성한다.

## 주요 진입점

- B2C 홈: `index.html`
- 전체 화면·스타일 가이드: `style-guide.html`
- 호텔 콘텐츠센터: `hotel-dashboard.html`
- 액티비티 파트너센터: `partner-dashboard.html`
- 파트너 회원가입: `partner-signup.html`
- 현지 업체·장소: `places.html`
- 플랫폼 관리자: `admin-dashboard.html`
- PMS 채널 운영: `channel-dashboard.html`

화면 검증용 B2C 데모 계정은 `demo@hotelngo.test` / `Hotelngo!2026`이다.

관리자 데모 계정은 `admin.ops@hotelngo.test` / `Admin!2026`이며 B2C 회원·파트너 직원·PMS 직원 계정과 세션을 공유하지 않는다.

호텔 콘텐츠센터 데모 계정은 `content@dananghotel.test` / `Hotel!2026`이다. PMS 직원 계정과 별개이며 PMS 요금·재고는 읽기 전용으로 표시한다.

승인된 액티비티 파트너 데모 계정은 `ops@dananghillsgolf.test` / `Partner!2026`이다. 호텔을 제외한 골프장·차량·음식점·스파·투어 업체가 업종을 선택해 계정을 만든 뒤 입점 심사를 제출한다.

PMS 채널 운영 데모 계정은 `channel.ops@hotelngo.test` / `Channel!2026`이다. 플랫폼 관리자·호텔 콘텐츠 담당자·PMS 직원과 분리된 채널 운영 Realm이며 로그아웃 후 채널 화면 직접 접근을 차단한다.

B2C 로그인·회원가입·비밀번호와 파트너·호텔·관리자·채널 로그인은 서로 다른 JSON Fixture와 브라우저 Session/Local Storage로 동작한다. 실제 서버 토큰, 이메일 발송, 예약 쓰기, 금전 거래, 파트너·PMS 채널 API는 연결하지 않았다. HotelnGo 회원과 PMS Guest는 독립 엔티티이며 PMS 데이터는 독립 Mock 표현만 사용한다. Hotel_PMS 파일이나 브라우저 저장소를 런타임 공급 데이터 원천으로 읽지 않는다.

데모 숙소 사진은 [Unsplash](https://unsplash.com/) 이미지를 사용하며 실제 판매 숙소와 무관하다.

기능 요구사항과 향후 연동 계획은 `docs/hotelngo`를 참조한다.
