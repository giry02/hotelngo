# 목표 아키텍처

## 1. 시스템 경계

```text
B2C Web ───────────────┐
Partner Center ────────┼── HotelNGo API / Application Services
Platform Admin ────────┘              │
                                      ├── Identity & Tenant
                                      ├── Provider / Place / Catalog
                                      ├── Content / Story / Itinerary
                                      ├── Cart / Order / Booking
                                      ├── Operations / Audit / Jobs
                                      └── AI Tool Gateway / RAG
                                                  │
                   ┌──────────────────────────────┼─────────────────────────┐
                   │                              │                         │
             Hotel supply                  External services        Search / Media
       INTERNAL_PMS / PARTNER / API       Map / Payment / Message    Vector / CDN
```

## 2. 단계별 런타임

### Release 1: 정적 기반

- 정적 B2C·관리자 shell과 ES 모듈
- 브라우저 내부 Mock API
- HotelNGo 전용 canonical fixture
- 공급 어댑터와 동일 DTO
- 실제 예약·권한·멀티테넌트 기능으로 표기하지 않음

### Release 2 이후: 운영 기반

- Node ESM 기반 모듈러 API
- PostgreSQL 운영 DB와 버전 관리 마이그레이션
- 세션·토큰 인증과 서버 RBAC
- outbox·비동기 작업 큐·대사 작업
- 객체 저장소/CDN, 지도, 결제, 메시지, 검색 어댑터
- B2C·Partner·Admin은 동일 API 기반의 별도 인증 realm 사용

## 3. 애플리케이션 모듈

| 모듈 | 책임 |
|---|---|
| Identity | B2C·파트너·관리자 계정, 인증, 세션, 동의 |
| Partner | 가입, 계약, 멤버, 문서, 권한, 초대 |
| Provider/Place | 사업자, 지점, 출처, 검수, claim, 병합 |
| Catalog | Product, Option, Offer, 정책, 공개 상태 |
| Supply | 공급 연결, 어댑터, 외부 ID, 캐시·신선도 |
| Inventory | 일자·시간대 가용성, hold, 판매 제한 |
| Booking | 공급자별 예약, 상태, 변경·취소, 대사 |
| Commerce | Cart, Order, Payment, Refund, Settlement |
| Content | 랜드마크, 스토리, 블록, 미디어, 다국어 |
| Itinerary | 일정, 일자·항목, 버전, 공유, 검증 |
| Operations | 알림, 문의, 리뷰, 신고, 감사, 작업 큐 |
| AI/RAG | 지식, 검색, 대화, 도구, 결과, 승인 |

모듈은 하나의 초기 배포 단위로 운영하되 데이터 소유권과 서비스 인터페이스를 분리한다. 예약·결제·AI 부하 또는 조직 경계가 실제로 분리될 때만 별도 서비스로 추출한다.

## 4. 데이터 소유권

- PMS는 INTERNAL_PMS 호텔 운영 데이터의 원천이다.
- HotelNGo는 공개 프로필, 콘텐츠 관계, 공급 연결, 캐시·projection, HotelNGo 예약을 소유한다.
- PARTNER_MANAGED 공급은 HotelNGo가 상품·요금·재고·예약 원천을 소유한다.
- 외부 API 데이터는 원천 ID와 snapshot·신선도를 보존한다.
- RAG는 설명·맥락만 저장하고 실시간 가격·재고·상태를 저장하지 않는다.

## 5. 동기·비동기 경계

### 동기

- 공개 검색·상세
- checkout 직전 가격·재고 재검증
- hold 생성·해제
- 사용자 요청에 대한 예약 상태 조회

### 비동기

- 공급자 예약 결과 확인과 재시도
- 캐시·검색 projection 갱신
- 알림·메일·메시지
- CSV import·중복 탐지
- 미디어 처리
- 임베딩·재임베딩
- 예약·결제·정산 대사

외부 호출과 로컬 트랜잭션은 outbox와 saga로 연결한다.

## 6. 공개 검색 모델

- 콘텐츠 검색 모델과 실시간 공급 모델을 분리한다.
- 검색 문서는 호텔·장소·스토리의 공개 필드, 관계, 검수 상태를 포함한다.
- 가격·재고는 검색 결과 후보를 만든 뒤 어댑터로 조회한다.
- stale 또는 공급자 오류는 판매 가능 상태로 추정하지 않는다.
- 플랫폼 curated 장소는 정보·저장·문의만 제공한다.

## 7. 보안 경계

- 공개 요청에서 tenantId·partnerId를 신뢰하지 않는다.
- 서버가 로그인·공급 연결에서 tenant 범위를 결정한다.
- Partner와 Admin 권한을 API 라우트뿐 아니라 애플리케이션 서비스에서 재검증한다.
- 개인정보·물리 호실·공급 credential은 검색문서·공개 캐시·AI 프롬프트에 넣지 않는다.
- 결제정보는 결제사 토큰 외에는 저장하지 않는다.
- 주요 변경은 actor, scope, before/after, requestId를 감사한다.

## 8. 배포·관측

- 환경: local → preview → staging → production
- 기능 플래그: surface, tenant, provider, supply mode 단위
- 로그: requestId, actor, tenant, provider, operation, outcome, latency, freshness
- 지표: adapter 오류·timeout·stale, shadow 불일치, claim 대기, 검수 만료, 예약 대사 큐, AI 검증 실패
- 장애 시 신규 판매를 중지하고 이미 생성된 예약은 자동 삭제하지 않고 대사한다.

