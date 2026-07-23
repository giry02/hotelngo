# HotelNGo API 및 계약 계획

## 1. 목적과 적용 범위

이 문서는 `API-*`, `PMS-*`, `AIR-*`, `COM-*` 요구사항을 개발 가능한 HTTP·어댑터 계약으로 구체화한다. Release 1에서는 공개 호텔 조회 API와 동일한 형태의 프런트 서비스 계층을 구현하고, Release 2부터 아래 HTTP 경계를 실제 서버 API로 제공한다.

## 2. 공통 규칙

| 항목 | 규칙 |
|---|---|
| 기본 경로 | `/api/v1` |
| 공개 API | `/api/v1/public/*` |
| 로그인 사용자 | `/api/v1/me/*`, `/api/v1/cart`, `/api/v1/orders`, `/api/v1/bookings` |
| 파트너 | `/api/v1/partner/*` |
| 플랫폼 관리자 | `/api/v1/admin/*` |
| 공급 연동 | 내부 어댑터 및 `/api/v1/integrations/*` |
| PMS 채널 | PMS 측 `/api/v1/channel/*` |
| AI 내부 도구 | `/api/v1/internal/ai/tools/*`; 외부 공개 금지 |
| 식별자 | 공개 식별자는 UUID/불투명 문자열. PMS 물리 호실 ID와 내부 직원 ID는 반환 금지 |
| 날짜 | 숙박일은 `YYYY-MM-DD`, 시각은 ISO 8601 UTC, 숙소 시간대는 별도 필드 |
| 금액 | `{ amount: "123000", currency: "KRW" }`; 부동소수점 금지 |
| 페이지 | 커서 기반 `{items, nextCursor, hasNext}` 기본 |
| 언어 | `Accept-Language`; 저장 콘텐츠는 원문 언어와 번역 상태 보존 |
| 추적 | 모든 응답에 `traceId`; 공급 호출은 `supplierRequestId`도 기록 |
| 멱등성 | 예약·결제·환불·상태 변경 명령에 `Idempotency-Key` 필수 |
| 낙관적 잠금 | 변경 요청에 `version` 또는 `If-Match` 사용 |

표준 성공 응답은 `{ data, meta: { traceId, generatedAt } }`, 표준 오류 응답은 `{ error: { code, message, details, retryable }, meta: { traceId } }`로 한다. 공개 오류의 `message`에는 내부 스택, 토큰, 공급자 원문 개인정보를 포함하지 않는다.

## 3. 공개/B2C API

### 3.1 홈·콘텐츠·검색

| Method | Path | 기능 | 주요 요구사항 |
|---|---|---|---|
| GET | `/public/home` | 추천·인기·신규·테마·스토리 홈 피드 | B2C-001~003 |
| GET | `/public/search/suggestions` | 장소·숙소·스토리 자동완성 | B2C-004 |
| GET | `/public/stories` | 공개 스토리 검색/목록 | STO-001~006 |
| GET | `/public/stories/{storyId}` | 블록형 스토리 상세 | STO-003~005 |
| GET | `/public/landmarks` | 랜드마크·명소 검색 | PLC-001~005 |
| GET | `/public/places/{placeId}` | 장소 공개 상세 | DOM-004, PLC-003 |

### 3.2 호텔

| Method | Path | 기능 | 필수 입력/출력 |
|---|---|---|---|
| GET | `/public/hotels` | 호텔 검색 | `destination/checkIn/checkOut/adults/children/rooms`, 가격·등급·편의·정책 필터; 호텔별 최저가와 신뢰 상태 |
| GET | `/public/hotels/{hotelId}` | 호텔 상세 | 공개정보, 위치, 정책, 편의시설, 미디어, 공급 방식, 마지막 확인시각 |
| GET | `/public/hotels/{hotelId}/offers` | 객실유형별 요금·재고 | 날짜/인원, 세금 포함 여부, 취소 규칙, 잔여 수량, `verifiedAt`, `freshnessStatus` |
| GET | `/public/hotels/{hotelId}/reviews` | 리뷰 목록 | 검증 상태와 집계 |

`offers`는 물리 호실을 반환하지 않는다. 같은 객실유형의 날짜별 요금/재고를 묶어 판매 가능한 `Offer`로 제공하고, 모든 숙박일을 충족하지 못하면 판매 가능으로 표시하지 않는다.

### 3.3 기타 업종·여정·거래

| 경계 | 대표 경로 | 설명 |
|---|---|---|
| 투어 | `/public/tours`, `/public/tours/{id}/offers` | 날짜·언어·집결지·정원·포함/불포함 |
| 공연 | `/public/events`, `/public/events/{id}/sessions` | 회차·좌석등급·연령·입장정책 |
| 골프 | `/public/golf-courses`, `/public/golf-courses/{id}/tee-times` | 티타임·인원·카트/캐디·복장정책 |
| 렌터카 | `/public/cars`, `/public/cars/{id}/offers` | 픽업/반납·차급·보험·보증금 |
| 교통 | `/public/transport/routes`, `/public/transport/schedules` | 출도착·운행편·좌석/수하물 |
| 음식점 | `/public/restaurants`, `/public/restaurants/{id}/slots` | 인원·시간·좌석·예약금 |
| 여정 | `/itineraries`, `/itineraries/{id}/items` | 개인 일정과 예약/장소 참조 |
| 장바구니 | `/cart`, `/cart/items` | 서로 다른 업종 항목과 가격 스냅샷 |
| 주문 | `/orders`, `/orders/{id}` | 결제 단위 및 부분확정 상태 |
| 예약 | `/bookings`, `/bookings/{id}` | 업종 공통 예약 조회·취소/변경 진입점 |

Release 4의 기타 업종은 정보 조회만 먼저 제공하고, 실제 슬롯·예약 API는 해당 업종 어댑터가 원자적 재고/예약 계약을 통과한 뒤 활성화한다.

## 4. 파트너 API

모든 요청은 인증 주체의 `partnerId` 범위로 제한하고, 리소스의 `providerId/placeId` 소유권을 다시 검증한다.

| 영역 | 대표 경로 | 명령/조회 |
|---|---|---|
| 온보딩 | `/partner/onboarding`, `/partner/onboarding/documents` | 사업자·정산·담당자 정보 제출, 심사 상태 |
| 공급자 | `/partner/providers`, `/partner/places` | 업체/지점 CRUD, 공개 변경 요청 |
| 상품 | `/partner/products`, `/partner/products/{id}` | 업종별 상품·옵션·정책 관리 |
| 판매 | `/partner/offers`, `/partner/availability` | 가격·재고·판매제한·프로모션 |
| 예약 | `/partner/bookings`, `/partner/bookings/{id}` | 조회·확정·거절·변경·취소; 허용 상태 전이만 |
| 정산 | `/partner/settlements`, `/partner/payout-accounts` | 예상/확정 정산 및 계좌 |
| 콘텐츠 | `/partner/content`, `/partner/media`, `/partner/reviews`, `/partner/inquiries` | 콘텐츠 제출, 리뷰 답변, 문의 처리 |
| 조직 | `/partner/members`, `/partner/roles`, `/partner/invitations` | 구성원과 역할 |
| 통계 | `/partner/analytics/summary` | 매출·예약·전환·취소 집계 |
| 클레임 | `/partner/claims`, `/partner/change-requests` | 장소 소유권 주장과 운영정보 변경 요청 |

파트너가 `PLATFORM_CURATED` 필드를 직접 덮어쓰면 안 된다. 승인 대상 변경은 `ChangeRequest`를 생성하고 관리자 검수 후 원본에 반영한다.

## 5. 플랫폼 관리자 API

| 영역 | 대표 경로 | 핵심 기능 |
|---|---|---|
| 대량 수집 | `/admin/import-jobs`, `/admin/import-jobs/{id}/errors` | CSV/API 수집, 검증, 재처리 |
| 카탈로그 | `/admin/providers`, `/admin/places`, `/admin/duplicates`, `/admin/merges` | 검색·중복 후보·병합·분리 |
| 검증 | `/admin/claims`, `/admin/change-requests`, `/admin/verifications`, `/admin/freshness` | 소유권·변경·최신성 심사 |
| 파트너 | `/admin/partners`, `/admin/partners/{id}/review` | 입점 심사·정지·해제 |
| 상품 | `/admin/products`, `/admin/offers`, `/admin/policies` | 상품/판매정책 검수 |
| 콘텐츠 | `/admin/stories`, `/admin/landmarks`, `/admin/media` | 편집·번역·발행·회수 |
| 거래 | `/admin/orders`, `/admin/bookings`, `/admin/payments`, `/admin/refunds` | 상태 조회와 통제된 복구 |
| 정산 | `/admin/settlements`, `/admin/payouts` | 대사·확정·보류 |
| AI/RAG | `/admin/ai-runs`, `/admin/rag-sources`, `/admin/evaluations` | 실행·근거·평가·차단 |
| 운영 | `/admin/audit-logs`, `/admin/settings`, `/admin/feature-flags` | 감사, 정책, 점진 노출 |

병합·환불·정산확정·예약 강제상태변경·AI 자동발행은 사유 입력과 감사로그를 필수로 한다. 고위험 명령은 권한과 별개로 재인증 또는 2인 승인 정책을 적용할 수 있다.

## 6. 공급 어댑터 계약

```ts
interface HotelSupplyAdapter {
  searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult>;
  getHotelDetail(query: HotelDetailQuery): Promise<PublicHotel>;
  getRoomAvailability(query: RoomAvailabilityQuery): Promise<RoomAvailability[]>;
  getRoomRates(query: RoomRateQuery): Promise<RoomRate[]>;
  holdRoomInventory(command: HoldInventoryCommand): Promise<InventoryHold>;
  releaseRoomInventory(command: ReleaseHoldCommand): Promise<void>;
  createHotelBooking(command: CreateHotelBookingCommand): Promise<SupplierBookingResult>;
  modifyHotelBooking(command: ModifyHotelBookingCommand): Promise<SupplierBookingResult>;
  cancelHotelBooking(command: CancelHotelBookingCommand): Promise<SupplierBookingResult>;
  getHotelBookingStatus(query: SupplierBookingQuery): Promise<SupplierBookingStatus>;
  reconcileHotelBooking(command: ReconcileBookingCommand): Promise<ReconciliationResult>;
}
```

모든 구현은 `supplierId`, `supplierType`, `hotelId`, `roomProductId`, 숙박일 범위, 투숙 인원, 통화, 세금 포함 여부, 취소조건, 가용 수량, `verifiedAt`, `freshnessStatus`를 동일 의미로 반환한다. Release 1 Mock은 조회 네 메서드만 지원하며 나머지는 HTTP 501과 `UNSUPPORTED_OPERATION`을 반환한다.

지원 공급 방식은 다음 다섯 값으로 고정한다.

- `INTERNAL_PMS`: Hotel_PMS가 원천인 호텔
- `PARTNER_MANAGED`: HotelNGo 파트너센터에서 관리하는 독립호텔
- `EXTERNAL_API`: 외부 PMS/채널매니저/API
- `PLATFORM_CURATED`: 플랫폼이 수집·검수한 정보성 공급
- `HYBRID_MANAGED`: 공개정보와 거래정보의 원천이 다른 복합 공급

## 7. AI 내부 도구 API

AI는 데이터베이스에 직접 접근하지 않고 다음 허용 도구만 호출한다.

- 장소/랜드마크/스토리 검색
- 호텔·투어·공연·골프·렌터카·교통·음식점 후보 검색
- 호텔 및 업종별 실시간 가격·재고 재조회
- 이동시간·거리 조회
- 일정 초안 생성/수정/검증
- 장바구니 후보 작성과 가격 재검증
- 예약 상태 조회

도구 입력은 JSON Schema로 검증하고, 읽기 도구와 쓰기 도구를 분리한다. AI가 예약·결제·취소를 직접 확정할 수 없으며 사용자의 명시적 확인 후 일반 거래 API가 실행한다.

## 8. 주요 오류 코드

| 코드 | 의미 | 처리 |
|---|---|---|
| `VALIDATION_ERROR` | 입력 오류 | 필드별 오류 표시, 재시도 금지 |
| `FORBIDDEN_SCOPE` | 파트너/테넌트 범위 위반 | 403, 감사 기록 |
| `NOT_FOUND` | 공개 불가 또는 없음 | 404 |
| `STALE_SUPPLY_DATA` | 신뢰기준보다 오래된 공급 데이터 | 판매 차단, 재조회 가능 |
| `SOLD_OUT` | 전 일정 재고 없음 | 대체 객실/날짜 제안 |
| `PRICE_CHANGED` | 재검증 가격 불일치 | 새 가격 확인 요구 |
| `HOLD_EXPIRED` | 홀드 만료 | 재홀드 필요 |
| `UNSUPPORTED_OPERATION` | 해당 공급자가 기능 미지원 | 501 또는 도메인 실패 |
| `SUPPLIER_TIMEOUT` | 공급자 시간초과 | 허위 성공 금지, 제한 재시도 |
| `PENDING_SUPPLIER` | 공급 결과 미확정 | 대사 작업으로 전환 |
| `REQUIRES_RECONCILIATION` | 양측 상태 불일치 | 자동/수동 대사 큐 |
| `IDEMPOTENCY_CONFLICT` | 동일 키에 다른 명령 | 409 |

## 9. 버전과 호환성

- 필드 추가는 선택 필드로 시작하고 제거/의미 변경은 새 API 버전 또는 충분한 폐기 기간을 둔다.
- 공급자 계약은 소비자 주도 계약 테스트를 통과해야 배포할 수 있다.
- OpenAPI 문서, 예제 fixture, JSON Schema는 코드와 같은 저장소에서 변경하고 CI에서 호환성을 검사한다.
- 응답 캐시에는 원천, 마지막 확인시각, 만료시각, 신뢰상태를 함께 저장한다.
## 10. 회원·여행자·관리자 계정 API

### 10.1 B2C 회원과 여행자 프로필

- `POST /api/v1/auth/signup`, `POST /api/v1/auth/login`, `POST /api/v1/auth/password/reset-requests`, `POST /api/v1/auth/password/resets`
- `GET/PATCH /api/v1/me`, `GET/POST/PATCH /api/v1/me/travelers`
- PMS 자격증명이나 PMS Guest ID를 인증 입력으로 받지 않는다.
- 예약 명령은 선택된 `TravelerProfile`을 주문 시점의 `TravelerSnapshot`으로 복사해 공급 어댑터에 전달한다.

### 10.2 관리자 회원 API

- `GET /api/v1/admin/members`, `GET /api/v1/admin/members/{memberId}`
- `GET /api/v1/admin/members/{memberId}/pms-guest-links`
- 여권 원문은 기본 응답에서 제외하고 마스킹 값과 접근 감사 정보만 제공한다.
