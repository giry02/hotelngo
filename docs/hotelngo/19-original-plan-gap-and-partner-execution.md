# 원문 계획 대조 및 파트너·업종별 실행 결과

검토 기준: `C:\Users\Giry\Downloads\HotelNGo_Codex_통합_프로젝트_계획서.md` 1~30장  
검토일: 2026-07-23 KST

## 1. 결론

원문이 요구한 제품은 호텔 예약 페이지만이 아니라 B2C, 독립 파트너센터, 플랫폼 관리자, 미입점 업체 선등록, 업체 페이지 소유권 인수, 업종별 공급 운영, 콘텐츠·일정·커머스·AI를 묶는 여행 플랫폼이다. 이번 보완으로 누락이 컸던 **독립 파트너 계정과 6개 업종 운영 경로**를 JSON Mock 프로토타입에 추가했다.

Hotel_PMS 계정과 데이터는 재사용하지 않는다. `HOTELNGO_PARTNER`는 B2C 회원, `HOTELNGO_ADMIN`, PMS 직원과 다른 인증 영역이며, Hotel_PMS는 이후 채널 API를 통해 호텔 공급 정보만 제공한다.

## 2. 원문 요구사항 대조표

| 원문 범위 | 현재 구현 | 판정 | 다음 실구현 |
|---|---|---|---|
| 2~5장 사업 구조·Provider/Place/Product/Offer·권한 | 독립 B2C/파트너/관리자/PMS 채널 셸과 Mock 세션, Provider·Place fixture | 프로토타입 충족 | 서버 DB, tenant/partner/provider 강제 격리 |
| 6~10장 B2C·메인·스토리·랜드마크·호텔 | 홈, 검색, 발견, 스토리, 랜드마크, 호텔 검색/상세, 예약 UI | 프로토타입 충족 | 검색·지도·미디어·실재고 API |
| 11장 PMS/독립 호텔 | PMS 채널 조회 Mock과 `PARTNER_MANAGED` 독립 호텔 화면 분리 | 부분 충족 | 채널 API, 독립 호텔 재고/예약 DB |
| 12장 파트너 공통 기능 | 대시보드, 공개정보, 가격·재고, 예약, 정산, 직원·권한, 설정, 프로모션·문의 | 프로토타입 충족 | RBAC, 감사, 파일, 알림, 정산 원장 |
| 12.2 가입·심사 | 회원가입 → 업체 정보 → 증빙·정산 → 심사 상태 | JSON Mock 구현 | 이메일 검증, 문서 저장, 심사 SLA·감사 |
| 13.1 호텔 | 객실·요금제·날짜별 재고·판매정책 | 업종 Mock 구현 | 실제 객실/Offer/Inventory API |
| 13.2 골프 | 코스·시설·티타임·요금·결합상품 | 업종 Mock 구현 | 티타임 수용량·예약 상태 머신 |
| 13.3 차량 | 차량·조건·지역·픽업·배차 상태 | 업종 Mock 구현 | 기사/차량 배정·운행 API |
| 13.4 음식점·카페 | 운영시간·좌석·메뉴·예약 슬롯·공지 | 업종 Mock 구현 | 지점/메뉴/좌석 슬롯 DB |
| 13.5 마사지·스파 | 프로그램·룸·치료사 수용량·슬롯 | 업종 Mock 구현 | 자원 수용량·예약 API |
| 13.6 투어·체험 | 일정·집결·언어·옵션·바우처 | 업종 Mock 구현 | 출발편·가이드·바우처 API |
| 14장 미입점 선등록 | 관리자의 6개 업종 Provider·Place 선등록, 출처·예약 방식 기록 | JSON Mock 구현 | CSV 파싱, 지오코딩, 중복 탐지·병합 |
| 15장 소유권 인수 | 기존 업체 선택 → 증빙 유형 → 요청 → 관리자 승인 상태 | JSON Mock 구현 | 공식 채널 OTP, 증빙 검수, 권한 이전 트랜잭션 |
| 16장 최신성·품질 | 출처·검수 상태·최근 검수일과 정보형/예약형 구분 | 표시 구현 | 재검수 작업 큐, 만료 정책, 변경 이력 |
| 17장 직접 여행 만들기 | 저장·내 여행·일정 Mock, 장소 담기 | 부분 충족 | 드래그 편집, 이동/영업시간 충돌 계산 |
| 18장 통합 커머스 | 카트·주문·예약·결제·부분 상태 UI | 화면/상태 Mock | 서버 주문 원장, PG, hold, 멱등성 |
| 19~21장 AI/RAG | 규칙형 AI 일정과 운영 리포트 | 제한적 Mock | LLM 도구, RAG 인덱스, 근거·평가 게이트 |
| 22장 관리자 | 회원, 파트너 심사, 선등록, 소유권, 카탈로그, 콘텐츠, 거래, AI, 시스템 | 화면/JSON Mock | 관리자 RBAC·MFA·감사 API |
| 24~25장 API/PMS | 문서 계약과 PMS 채널 콘솔 | 설계+조회 Mock | 실제 서비스 API·토큰·rate limit·trace |
| 26~30장 비기능·단계·MVP·테스트 | 문서, 반응형, 정적/브라우저 회귀 | 프로토타입 수준 | 보안·성능·접근성·계약/E2E CI |

## 3. 이번에 연결한 실행 흐름

### 신규 파트너

`partner-signup.html` → `partner-application.html` → `partner-application-status.html` → `admin-partners.html` 승인 → 업종별 파트너 화면

- 계정 상태: `DRAFT / REVIEW_REQUESTED / UNDER_REVIEW / APPROVED / REJECTED / SUSPENDED / CLOSED`
- 업종: `HOTEL / GOLF / VEHICLE / RESTAURANT / SPA / TOUR`
- 파트너 세션 키와 사용자 fixture는 B2C·관리자·PMS와 분리한다.
- 승인 전에는 상품·가격·재고 운영 화면으로 진입할 수 없다.
- 현재 계정과 다른 업종 화면은 구조 미리보기만 제공하고 편집 버튼을 비활성화한다.

### 기존 업체 인수

`places.html` 또는 `place-detail.html` → `partner-claim.html` → `admin-provider-claims.html`

- 플랫폼 선등록 업체는 파트너 계정 없이 존재할 수 있다.
- 승인 전에는 신청자가 기존 업체 정보를 수정할 수 없다.
- 인수는 새 Place를 만들지 않고 기존 Provider·Place 관계를 유지하는 전제다.
- Mock은 소유권 상태만 저장하며 실제 증빙 검증과 권한 이전은 서버 트랜잭션으로 구현해야 한다.

### 플랫폼 선등록

`admin-providers.html`에서 6개 업종의 Provider·Place를 `PLATFORM_CURATED / UNCLAIMED`로 등록한다. 즉시예약은 허용하지 않고 `INFORMATION_ONLY / CONTACT_REQUEST / PHONE_OR_MESSENGER / EXTERNAL_LINK`만 선택할 수 있다. 브라우저 Mock에 저장된 항목은 B2C `places.html`에 함께 표시된다.

## 4. 데이터와 파일 책임

- 파트너 계정: `data/mock/partner-users.json`, `scripts/partner-auth.js`
- 입점·Provider·Place·Claim: `data/mock/partner-platform.json`
- 업종별 운영 구조: `data/mock/partner-businesses.json`
- 파트너 상태/운영 UI: `scripts/partner-portal.js`
- 관리자 심사/선등록/Claim: `scripts/admin-partner-ops.js`
- B2C 장소 표현: `scripts/places.js`
- 공통 운영 셸: `scripts/backoffice-shell.js`, `styles/backoffice.css`

브라우저 Local/Session Storage는 API 교체 전의 화면 동작 검증용이다. 실서비스 데이터 저장소나 보안 구현으로 간주하지 않는다.

## 5. 구현 가능한 것과 외부 기반이 필요한 것

현재 저장소에서 구현 가능한 것은 화면, 입력 검증, JSON fixture, 독립 세션, 상태 전이 시뮬레이션, 반응형, 로컬 회귀 검사다. 다음은 별도 서버·계약·외부 서비스가 있어야 완료할 수 있다.

1. 서버 인증, 이메일 확인, 비밀번호 토큰, MFA, RBAC와 감사 로그
2. 사업자 문서 암호화 저장, 바이러스 검사, 보존·삭제 정책
3. Provider/Place/Product/Offer/Inventory/Booking 데이터베이스와 테넌트 격리
4. 결제·환불·정산 원장과 PG 웹훅
5. 지도·지오코딩·검색·메시지·미디어 파이프라인
6. Hotel_PMS `/api/v1/channel/*` 조회·예약·대사 API
7. 실제 LLM/RAG, 실시간 공급 도구 호출, 근거 저장과 평가

## 6. 다음 개발 순서

1. 파트너/관리자 인증 API와 데이터 스키마를 먼저 고정한다.
2. 입점 신청·증빙·심사·Claim을 서버 상태 머신으로 이전한다.
3. 독립 호텔의 Product/Offer/Inventory/Booking을 첫 실거래 업종으로 구현한다.
4. 골프 → 차량 → 스파 → 음식점 → 투어 순으로 업종 어댑터를 확장한다.
5. PMS 채널은 독립 호텔 흐름과 동일한 공급 계약으로 조회부터 연결한다.
6. 공급·결제 기반이 안정화된 뒤 AI가 같은 공개 검색/일정 API만 호출하도록 연결한다.
