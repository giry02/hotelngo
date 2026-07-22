# HotelnGo

> **브랜드 로고 잠금:** 새 UI 작업 전에 `assets/brand/brand-config.json`과 `docs/hotelngo/13-brand-logo-style-guide.md`를 먼저 확인한다. 웹 헤더는 `n-color-types.html#color-03`에서 확정된 SVG 마크업만 사용한다.

해외 숙소 검색에서 시작해 호텔, 항공, 패키지, 투어, 랜드마크 스토리와 AI 여행을 연결하는 B2C 여행 플랫폼 정적 프로토타입이다. 국내 상품은 이후 확장 범위다.

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
- AI 여행·내 여행·저장·예약 조회·마이·로그인 화면
- 별도 공통 셸을 사용하는 파트너센터 대시보드·업체정보·가격재고·예약 운영 화면
- 별도 공통 셸을 사용하는 관리자 대시보드·Provider/Place 카탈로그·심사/클레임·콘텐츠 운영 화면
- 공식 로고·심볼을 `assets/brand/official/`, 원본을 `source/`, 이전 SVG 시도를 `archive/legacy-svg/`로 분리 관리
- 동일한 조형에 Open Sans ExtraBold 800을 적용한 폰트 비교용 로고
- 폰트형·게이트형·포털형·브리지형·루트형 `n` 로고 비교 보드
- 첨부 레퍼런스를 재해석한 `n` 심볼 9종의 블루그레이·뉴트럴 그레이 및 실제 헤더 크기 비교 보드
- 동일한 추출형 `n` 심볼을 1.45배 확대한 뒤 웜 선셋·아쿠아 바이올렛 등 색상만 바꾼 9종 비교 보드
- 첨부 이미지의 비례를 바탕으로 Hotel·g를 매끈한 곡선 SVG로 그리고 n만 색상을 바꾼 비폰트 벡터 비교 보드
- 프로젝트에 포함한 Pretendard Variable 한국어 웹폰트
- 해외 숙소 우선 검색과 국내 숙소 준비중 상태
- 해외호텔·항공·패키지·투어 핵심 카드와 골프·미식·랜드마크·AI 보조 탐색
- 추천 여행·이벤트 3종 자동 순환 광고 캐러셀
- 현지 시간·소리·크리에이터 코스를 담은 몰입형 테마 가이드
- SNS형 랜드마크 스토리와 해외 인기 여행지
- 쿠폰·특가와 유형별 해외 추천 호텔
- 검색 탭, 지역 탭, 숙소 필터, 찜 인터랙션
- 데스크톱/태블릿/모바일 반응형 레이아웃
- 모바일 메뉴와 하단 내비게이션

색상은 `styles/tokens.css`, B2C 레이아웃은 `styles/main.css`와 `styles/pages.css`, 운영 화면은 `styles/backoffice.css`에서 관리한다. 공통 B2C 영역은 `scripts/site-shell.js`, 파트너·관리자 영역은 `scripts/backoffice-shell.js`가 생성한다.

## 주요 진입점

- B2C 홈: `index.html`
- 전체 화면·스타일 가이드: `style-guide.html`
- 파트너센터: `partner-dashboard.html`
- 플랫폼 관리자: `admin-dashboard.html`

예약 쓰기, 결제, 실제 로그인, 파트너/관리자 API는 아직 연결하지 않았다. PMS 데이터는 독립 Mock 표현만 사용하며 Hotel_PMS 파일이나 브라우저 저장소를 런타임 데이터 원천으로 읽지 않는다.

데모 숙소 사진은 [Unsplash](https://unsplash.com/) 이미지를 사용하며 실제 판매 숙소와 무관하다.

기능 요구사항과 향후 연동 계획은 `docs/hotelngo`를 참조한다.
