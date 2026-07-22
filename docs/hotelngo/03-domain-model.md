# 도메인 모델

## 1. 식별·소유 구조

```text
Partner ──< PartnerMember
   │
   └── manages ──> Provider ──< Place
                         │          │
                         │          └── PublicProfile / OpeningHours / Media
                         └──< SupplyConnection

Place ──< Product ──< Offer ──< Availability
                         │
                         └──< BookingItem >── Booking >── Order
```

모든 공개 ID는 HotelNGo가 발급한 불투명 ID다. PMS·외부 공급자 ID는 SupplyConnection의 내부 매핑으로만 보존한다.

## 2. 계정·파트너

### Partner

- 계약·정산·조직 주체
- 상태: `DRAFT`, `REVIEW_REQUESTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`, `CLOSED`
- 문서, 계약, 초대, 멤버, 권한을 소유

### PartnerMember

- userId, partnerId, provider/place scope, role, status
- 동일 사용자가 여러 Partner에 참여할 수 있으나 활성 컨텍스트를 명시해야 함

## 3. Provider·Place·품질

### Provider

- 법적명·표시명·업종·사업자 식별정보
- ownershipStatus: `UNCLAIMED`, `CLAIMED`, `VERIFIED`, `SUSPENDED`, `CLOSED`
- managementType: `PLATFORM_CURATED`, `PARTNER_MANAGED`, `EXTERNAL_API`, `HYBRID_MANAGED`

### Place

- Provider와 독립 생성 가능
- 국가·도시·지역·주소·좌표·시간대
- 카테고리·태그·운영시간·연락처·미디어·관계
- 랜드마크는 Provider가 없는 Place로 표현 가능

### SourceRecord·VerificationRecord

- sourceType, sourceName, sourceUrl/reference, note, collectedAt
- lastVerifiedAt, verifiedBy, nextReviewAt, confidence, status
- 가격·재고 신선도와 편집 콘텐츠 검수일을 구분

### ClaimRequest

- 상태: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `WITHDRAWN`
- 승인 시 신규 엔티티를 만들지 않고 membership·권한·관리방식을 연결

## 4. 공개 콘텐츠

### PublicProfile

- 이름·소개·미디어·편의시설·실용정보·SEO·다국어
- 운영정보와 플랫폼 편집정보의 수정 권한을 분리

### TravelStory

- 상태: `DRAFT`, `REVIEW_REQUESTED`, `APPROVED`, `PUBLISHED`, `ARCHIVED`
- StoryBlock은 type, order, content, referenced entity, source를 저장
- StoryRelation으로 호텔·장소·상품·일정을 연결

### MediaAsset

- 소유권·출처·라이선스·변형·대체텍스트·검수상태를 저장

## 5. 상품·공급

### Product

- productType, providerId, placeId, 상태, 옵션, 기준 인원·시간
- 공통 필드와 업종 확장 데이터를 분리

### Offer

- Product, 유효 기간, 가격, 통화, 세금, 취소정책, 포함사항
- confirmationMode, 최소/최대 인원, 최소박, CTA/CTD, 판매 중지
- 상태: `DRAFT`, `REVIEW_REQUESTED`, `APPROVED`, `ON_SALE`, `PAUSED`, `ARCHIVED`
- `SOLD_OUT`은 Availability에서 계산되는 파생 상태

### Availability

- product/offer, local date 또는 time slot, capacity, held, sold, closed
- 현재 판매 가능 수량은 `capacity - held - sold`, 음수 금지
- 숙박은 `[checkIn, checkOut)` 전 일자의 최솟값으로 가용 수량 계산

### SupplyConnection

- supplyMode, provider/place scope, external IDs, contractVersion
- status, lastSyncAt, lastSuccessAt, error, freshness policy
- credential은 별도 secret store에 보관

## 6. 일정

### Itinerary

- owner, city, 기간, 인원, 통화, 상태
- `ItineraryDay`, `ItineraryItem`, `Version`, `Share`, `ValidationResult` 소유

### ItineraryItem

- Place/Product/Offer/Booking 중 하나를 참조 가능
- 제목·위치·시간·예상비용 snapshot 보존
- informationOnly, bookable, source, timezone 표시

### ValidationResult

- severity: `ERROR`, `WARNING`, `SUGGESTION`
- code, message, itemIds, suggested alternatives, checkedAt

## 7. 커머스·예약

### Cart·Order

- Cart 상태: `ACTIVE`, `CHECKOUT_STARTED`, `ORDERED`, `EXPIRED`, `ABANDONED`
- Order 상태: `PENDING`, `PROCESSING`, `PARTIALLY_CONFIRMED`, `CONFIRMED`, `FAILED`, `PARTIALLY_CANCELLED`, `CANCELLED`, `COMPLETED`
- OrderItem은 상품·가격·정책 snapshot을 저장

### Booking

- providerId + supplyConnectionId + confirmationMode별 생성
- 상태: `PENDING_SUPPLIER`, `CONFIRMED`, `REJECTED`, `EXPIRED`, `REQUIRES_RECONCILIATION`, `CANCEL_PENDING`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- HotelNGo bookingId와 supplier bookingId를 분리
- INTERNAL_PMS는 PmsReservationLink로 연결

### Hold

- offerId, quantity, expiresAt, status, idempotencyKey
- 상태: `ACTIVE`, `CONSUMED`, `RELEASED`, `EXPIRED`

### Payment·Refund·Settlement

- Payment: `PENDING`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `VOIDED`, `PARTIALLY_REFUNDED`, `REFUNDED`
- Settlement: `PENDING`, `READY`, `PAID`, `HELD`, `ADJUSTED`
- booking item별 금액 배분과 환불·정산 연결을 유지

## 8. 운영·AI

### OutboxEvent·SyncJob·ReconciliationResult

- 외부 호출, 검색 projection, 알림, 대사 작업을 재시도 가능하게 기록
- operation key와 idempotency key를 보존

### KnowledgeSource·Document·Chunk

- 출처, 권한, 검수, 언어, 지역, 유효기간, embedding version 저장
- 비공개·삭제·검수 만료 데이터는 검색에서 제외

### AIRequest·AIResult

- 구조화 입력, prompt version, tool calls, source IDs, 결과 JSON, 검증 결과, 사용자 피드백을 저장
- 민감정보·credential·물리 호실을 저장하지 않음

## 9. 공통 불변조건

- Place는 Partner 없이 존재 가능하다.
- Product는 Provider/Place 없이 판매 상태가 될 수 없다.
- Instant booking은 검증된 Offer·Availability·정책·SupplyConnection이 모두 필요하다.
- stale 가격·재고는 판매 가능으로 사용할 수 없다.
- claim·merge는 공개 식별자와 관계를 보존해야 한다.
- AI는 직접 Booking·Payment 상태를 변경할 수 없다.
- 외부 공급자 결과 불명 상태를 성공 또는 실패로 임의 확정하지 않는다.

