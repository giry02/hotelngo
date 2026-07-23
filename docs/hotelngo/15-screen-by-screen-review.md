# HotelNGo 화면별 기능·디자인 점검 리포트

기준일: 2026-07-23  
검토 대상: 루트 제품 화면 187개 (`sample.html` 제외)

이번 기준선에서는 기존 77개 화면에 계획서상 누락 화면 89개를 추가했다. 아래 기존 화면 표는 수작업 상세 점검 결과이고, 추가 화면은 공통 JSON 화면 계약과 동일한 검증 기준을 적용한다.

| 영역 | 화면 수 | 구현 상태 |
|---|---:|---|
| B2C 공개·회원·예약·지원 | 81 | 화면·링크·폼·목록·상태 Mock 구현 |
| 파트너센터 | 38 | 독립 인증 경계·업종·입점·상품·운영 Mock 구현 |
| 플랫폼 관리자 | 36 | 독립 관리자 경계·심사·카탈로그·거래·보안 Mock 구현 |
| PMS 채널 운영 | 11 | Hotel_PMS와 분리된 조회·매핑·대사 Mock 구현 |
| 호텔 콘텐츠센터·회원 일정·업종별 판매 보완 | 21 | PMS/B2C 소유권 분리, 다중 사진, 회원 일정 복사, 자원·슬롯·결합혜택 Mock |
| 합계 | 187 | 역할별 추가 유즈케이스 화면을 포함한 현재 기준선 |

추가 89개 화면은 `data/mock/workflow-pages.json`, `scripts/workflow-pages.js`, `styles/workflow-pages.css`를 공통으로 사용한다. 실제 서버 기능이 없는 화면은 이를 숨기지 않고 `Mock`, `미연결`, `외부 시스템에는 전송하지 않음`으로 표시한다.

## 판정 기준

- **동작**: 현재 브라우저에서 사용자 입력에 반응하거나 화면 간 흐름이 이어진다.
- **Mock 동작**: JSON Fixture, Session/Local Storage 또는 규칙 기반 데이터로 동작한다.
- **외부 의존**: 서버 API, 공급자, 결제, 지도, 메시지 발송 등 계약이 있어야만 완성할 수 있다.
- 화면에서 `준비중`이라는 모호한 표현은 제거하고, 없는 기능은 `미연결`, `Mock`, `UNSUPPORTED_OPERATION`으로 표시한다.

## B2C 공개·탐색

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `index.html` | 해외 우선 홈, 검색·광고 캐러셀·콘텐츠 진입 동작. 사용하지 못하는 국내 탭 제거 | 운영 CMS, 개인화, 실시간 상품 |
| `discover.html` | 스토리·테마·랜드마크 탐색과 저장 UI 동작 | 콘텐츠 CMS, 추천 랭킹 |
| `search.html` | 여행지·호텔명 통합 자동완성, 로그인 회원의 과거 숙박 호텔 제안과 직접 상세 진입 | 서버 검색 인덱스, 개인화 랭킹 |
| `hotels.html` | 필터, 정렬, 목록/지도 Mock 전환 구현 | 실제 지도 좌표, 검색/요금 API |
| `hotel-detail.html` | 호텔 8장과 객실유형별 4~5장 사진 Dialog, 면적·침대·정원·전망·욕실·편의시설, PMS 요금·재고 합성 | PMS Channel 조회, 원본 사진 CDN |
| `landmark.html` | 장소 정보·일정 저장, 외부 지도 검색 연결 | 지도 SDK, 운영시간·혼잡도 |
| `story.html` | 감성 콘텐츠, 저장·일정화·공유 진입 | CMS, 작성자/권리 관리 |
| `experiences.html` | 경험 목록·카테고리 탐색 | 경험 공급 계약, 실시간 재고 |
| `experience-detail.html` | 정보와 일정 저장 기능을 명시 | 예약·결제 API 없음 |
| `flights.html` | 직항/최대요금 필터, 운임 조건 펼침, 일정 저장 구현 | GDS/NDC 운임·좌석·발권 |
| `packages.html` | 유형 필터와 일정 저장 구현 | 패키지 계약·재고·결제 |
| `benefits.html` | 혜택·멤버십 설명 화면 | 회원등급/쿠폰 정책 API |
| `company.html` | 회사·서비스 경계 안내 | 확정 법인·고객센터 정보 |
| `terms.html` | 약관 문서 화면 | 법무 승인·버전 이력 |
| `privacy.html` | 개인정보처리방침 화면 | 실제 처리 항목·수탁사 확정 |
| `style-guide.html` | 공통 로고·색·폰트·컴포넌트 기준 | 접근성 자동 회귀 게이트 |

## 로그인·회원

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `login.html` | JSON 계정 검증, Session 세션, returnUrl, 데모 계정 자동 입력 구현 | 서버 인증, 토큰 회전, OAuth, MFA |
| `signup.html` | PMS와 독립된 B2C Mock 계정, 거주 국가·국적 기본값 생성·자동 로그인 | 이메일 확인, 중복/위험 검증, 약관 이력 |
| `password-reset.html` | 존재하는 B2C 계정 확인과 10분 Mock 인증번호 발급 | 이메일/SMS 발송, 서버 재설정 토큰 |
| `password-reset-confirm.html` | 인증번호 검증과 브라우저 비밀번호 해시 변경 | 일회성 서버 토큰, 시도 제한·폐기 |
| `password-change.html` | 로그인 가드, 현재 비밀번호 검증과 새 비밀번호 변경 | 재인증, 전체 세션 폐기, 변경 알림 |
| `my.html` | 로그인 가드, JSON 요약 수치와 사용자명, 계정 설정 진입 구현 | 회원 API, 서버 저장 |
| `account-settings.html` | B2C 계정·여행자 기본값 분리, 여권 원문 제거·마스킹, PmsGuestLink 상태 구현 | 암호화 PII 저장소, 동의·접근 감사 API |
| `saved.html` | 로그인 가드와 저장 콘텐츠 목록 | 서버 동기화, 폴더/정렬 |
| `trips.html` | 로그인 가드, 제목 편집, Web Share/클립보드 공유 구현 | 서버 일정 저장, 협업 초대 |
| `orders.html` | 로그인 가드, 예약 상세·후기 진입 | 주문/환불 API |
| `review-write.html` | 완료 예약 기반 후기 Mock 저장 구현 | 이미지 업로드, 검수, 공개 API |

로그아웃 상태의 상단·모바일 메뉴에서는 `내 여행`을 숨긴다. `내 여행에 담기`는 로그인 후 원래 화면으로 돌아온다.

## 카트·예약·결제

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `cart.html` | 항목 선택·수량/합계·삭제 확인 Dialog·체크아웃 흐름 Mock | 서버 카트, 재고 hold |
| `booking-guests.html` | 투숙객 입력과 다음 단계 흐름 | PII 암호화·검증 |
| `booking-review.html` | 조건 확인과 주문 검토 | 최신 재고·가격 재검증 |
| `checkout.html` | 결제 입력·승인 Mock | PG 토큰화, 3DS, 영수증 |
| `booking-complete.html` | 주문 결과와 상태 구분 | PMS 예약 생성 결과, 알림 |
| `bookings.html` | 비회원 예약번호 조회 Mock | 예약 조회 API, 본인 확인 |
| `booking-detail.html` | 회원·비회원 조회 흐름 공용, 처리 이력, 변경·취소 화면 연결 | 본인 확인 토큰, 공급자 최종 상태 조회 |
| `booking-change.html` | 변경 요청을 Mock 작업함에 저장 | modify API, 차액 결제/환불 |
| `booking-cancel.html` | 예상 수수료·환불액 확인 Dialog와 Mock 요청 저장 | cancel API, 최종 환불 계산 |

`checkout`의 승인은 실제 결제가 아니다. PMS 예약 명령은 모두 미지원이며 Hotel_PMS 데이터는 변경하지 않는다.

## 파트너센터

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `partner-login.html`, `partner-signup.html`, `partner-password-reset.html` | `HOTELNGO_PARTNER` 독립 Realm, 업종 선택 가입, Mock 비밀번호 갱신 | 서버 인증·이메일 토큰·MFA |
| `partner-dashboard.html` | 영업/재고/작업 요약 | 파트너 API |
| `partner-onboarding.html`, `partner-application.html`, `partner-application-status.html` | 계정→업체→심사→활성화 안내, 사업자·증빙 참조·정산 제출, 상태 전이 | 암호화 문서 저장·심사 SLA·감사 |
| `partner-claim.html` | 기존 Provider·Place 선택, 공식 채널·증빙 유형 기반 소유권 요청 Mock | OTP·증빙 검수·권한 이전 트랜잭션 |
| `partner-property.html` | 공개 정보 폼 | 검수·버전·미리보기 API |
| `partner-inventory.html` | 가격·재고 캘린더 | 동시성 제어·서버 저장 |
| `partner-bookings.html` | 예약/변경/취소 목록 | 예약 명령·알림 |
| `partner-hotel.html` | 독립 호텔 객실·요금제·재고·판매정책 구조 | 호텔 Product/Offer/Inventory API |
| `partner-golf.html` | 코스·티타임·그린피·결합상품 구조 | 티타임 수용량·예약 API |
| `partner-vehicle.html` | 차량·서비스 지역·공항 픽업·배차 상태 구조 | 차량/기사 배정·운행 API |
| `partner-restaurant.html` | 메뉴·운영시간·좌석·예약 슬롯·공지 구조 | 지점/메뉴/슬롯 API |
| `partner-spa.html` | 프로그램·룸·치료사 수용량·예약 슬롯 구조 | 자원 수용량·예약 API |
| `partner-tour.html` | 출발 일정·집결·언어·옵션·바우처 구조 | 출발편·가이드·바우처 API |
| `partner-operations.html` | 쿠폰·프로모션·공지 Mock 저장과 리뷰·문의 구조 | 승인/발행·메시지 API |
| `partner-finance.html` | 정산/통계 표 | 원장·세금계산서·지급 |
| `partner-members.html` | 직원/권한 표 | 초대·RBAC·감사 로그 |
| `partner-settings.html` | 연동/알림 설정 | API key·webhook secret 관리 |

## 플랫폼 관리자

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `admin-login.html` | `HOTELNGO_ADMIN` JSON 계정과 B2C와 분리된 Session Mock | SSO·MFA·조건부 접근 |
| `admin-dashboard.html` | 플랫폼 작업·공급 상태 개요 | 운영 집계 API |
| `admin-members.html` | HotelnGo B2C 회원 목록, Realm·국적·마스킹 여권·PMS 연결 수 표시 | 회원 검색/제재/동의 이력 API |
| `admin-member-detail.html` | 회원·여행자 프로필·PmsGuestLink를 분리해 표시 | PII 접근승인·감사, 실제 연결 API |
| `admin-partners.html` | 파트너 신청 목록, 검토·승인과 로컬 계정 상태 연결 | 심사 배정·SLA·감사 API |
| `admin-providers.html` | 6개 업종 미입점 Provider·Place 선등록, 출처·예약방식·최신성 표시 | CSV 파싱·지오코딩·중복 병합 API |
| `admin-provider-claims.html` | 소유권 요청 승인·반려, 기존 Provider 권한 연결 Mock | 증빙 검수·MFA·원자적 권한 이전 |
| `admin-catalog.html` | Provider/Place 심사 표 | 카탈로그 API·병합 트랜잭션 |
| `admin-review.html` | 심사/클레임 큐 | 배정·SLA·감사 사유 |
| `admin-content.html` | 스토리·랜드마크 운영 | CMS·미디어 파이프라인 |
| `admin-commerce.html` | 예약·거래 관제 | 주문·결제·환불 원장 |
| `admin-ai.html` | AI/RAG 정책·평가 화면 | 모델 게이트웨이·평가 저장소 |
| `admin-system.html` | 시스템 경계와 PMS 채널 콘솔 진입 | SSO, feature flag, 감사 API |

## 현지 업체·장소

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `places.html` | 호텔·골프·차량·음식점·스파·투어 카테고리, 인증 파트너/정보형 장소 구분, 관리자 선등록 Mock 반영 | 공개 장소 검색·지도·페이지네이션 API |
| `place-detail.html` | 출처·검수일·관리·소유권·예약 방식 표시, Claim 승인 후 인수 CTA 제거 | 실제 장소 상세·연락·예약 어댑터 |

## PMS 채널 운영 — 플랫폼 관리자와 별도

| 화면 | 점검 결과와 이번 개선 | 남은 외부 의존 |
|---|---|---|
| `channel-login.html` | 별도 PMS 채널 운영 Realm UI | SSO·MFA·공급 권한 |
| `channel-dashboard.html` | JSON Fixture로 연결 방식·신뢰·계약 점검 표시 | 실제 `/api/v1/channel/*` |
| `channel-mappings.html` | Tenant/RoomType 공개 모델 매핑과 가용수량 표시 | 매핑 저장·shadow 비교 API |
| `channel-monitor.html` | 동기화·예약 대사 경계와 원천 경로 표시 | trace, retry, reconciliation worker |

## 공통 디자인 점검

- 모바일 햄버거 메뉴를 우측 Drawer·Scrim·명확한 닫기 동작으로 교체했다.
- 390px 헤더에서 카트·예약 조회가 로고와 겹치던 선택자 우선순위를 수정했다.
- 공개 화면과 백오피스의 단일 `select`를 공통 Custom Select Popover로 변환했다. 선택값 동기화, 방향키·Home/End·Enter·Escape, 바깥 클릭 닫기와 동일한 포커스 스타일을 적용한다.
- 회원 전용 메뉴와 세션 상태를 공통 Shell에서 제어한다.
- Footer는 `site-shell.js`, 관리자/파트너/PMS 채널 Shell은 `backoffice-shell.js`가 담당한다.
- 모바일 관리자 상단바는 메뉴·운영영역·로그아웃만 유지해 링크와 계정명이 세로로 꺾이는 현상을 제거했다.

## 아직 기능이 없는 항목

1. 실제 로그인 서버, 소셜 로그인, 이메일 확인·비밀번호 재설정 발송
2. 호텔 실시간 Channel API와 예약 hold/create/modify/cancel/reconcile
3. PG 결제·환불·정산
4. 항공 GDS/NDC 발권
5. 경험·패키지 실재고와 계약
6. 지도 SDK, 실시간 이동·운영시간·날씨
7. 실제 LLM/RAG, 평가 저장소와 모델 운영 게이트웨이
8. 관리자/파트너/PMS 채널 SSO·MFA·RBAC·감사 API
9. 파트너 입점 문서 보안 저장·심사 워크플로와 업종별 서버 데이터 모델
10. 선등록 CSV·지오코딩·중복 병합과 Claim 검증·권한 이전 트랜잭션

이 항목들은 버튼 문구로 성공한 것처럼 표시하지 않으며, 각 화면에서 Mock 또는 미연결 상태를 노출한다.
