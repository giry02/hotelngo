# HotelNGo 역할별 E2E 프로세스 검증 및 실행 경계

검증일: 2026-07-23  
대상: `C:\Users\Giry\Documents\HotelnGO` 정적 웹 프로토타입

## 1. 결론

현재 제품 화면 191개 중 실제 업무 상호작용 화면 189개는 `scripts/mock-api.js`와 `scripts/platform-flows.js`를 공통으로 사용한다. `partner-hotel.html`은 호텔 콘텐츠센터로 이동시키는 안내 브리지이고, `style-guide.html`은 디자인 문서라서 상태 저장 대상에서 제외했다.

브라우저에서 저장하는 값은 공통 JSON 계약과 같은 구조를 사용하는 `localStorage`/`sessionStorage` Mock 상태다. 따라서 화면 코드가 PMS 파일이나 다른 솔루션의 `localStorage`를 직접 읽는 구조는 아니다. 향후에는 `HotelNGoMockAPI.get/list/upsert/request`의 전송 계층을 REST API 클라이언트로 교체하고, PMS는 별도 `/api/v1/channel/*` 어댑터로 연결해야 한다.

현재 완료된 것은 “브라우저에서 역할별 업무 흐름을 검증할 수 있는 JSON Mock 프로토타입”이다. 실서버 DB, 실결제·환불·지급, Hotel_PMS 서버 API, 외부 공급자 API, LLM/RAG, 지도·경로 API가 완료된 것은 아니다.

## 2. 데이터·API 경계

| 구분 | 현재 구동 | 실서비스 교체 |
|---|---|---|
| B2C 회원 | `data/mock/users.json` + 회원 로컬 상태 + B2C 세션 | 인증 API, 암호화 DB, 이메일 확인, 토큰 회전 |
| 파트너 | `partner-users.json`, 파트너 신청·상품·자원·슬롯 상태 | 파트너 API, 사업자·계좌 검증, RBAC |
| 호텔 콘텐츠센터 | `hotel-users.json`, `hotel-content.json` | HotelNGo 호텔 콘텐츠 API |
| 플랫폼 관리자 | `admin-users.json`, 예약·문의·정산 공통 상태 | 관리자 API, MFA, 감사 원장 |
| PMS 채널 운영 | `channel-users.json`, `supply/internal-pms.json` | Hotel_PMS `/api/v1/channel/*` |
| 예약·문의·정산 | `platform-state.json`을 초기값으로 쓰는 공통 상태 | Booking/Support/Settlement DB와 이벤트 |
| AI 여행 | `ai/travel-knowledge.json` 규칙 랭커 | LLM Tool Gateway, RAG, 지도, 영업시간, 실재고 |

PMS `Tenant → RoomType/Rate/Room/Reservation`은 HotelNGo `hotel → product → offer → inventory` 공개 모델로 변환한다. B2C에는 물리 호실, PMS 직원, Guest, Folio를 노출하지 않는다. PMS 회원과 HotelNGo B2C 회원은 합치지 않는다.

## 3. 실제 브라우저 프로세스 검증 결과

### B2C 회원

1. 데모 계정 로그인 후 마이 화면 진입을 확인했다.
2. 골프·호텔·이동 3개 항목, 총 795,200원을 카트에 담고 예약자 `KIM JIHO` 정보가 검토·결제 단계까지 유지되는 것을 확인했다.
3. 결제 Demo 승인 후 `PENDING_SUPPLIER` 예약이 생성되는 것을 확인했다.
4. 취소 확인 Dialog를 승인한 뒤 목록과 상세 상태가 `CANCEL_REQUESTED`로 바뀌는 것을 확인했다.
5. 공급 불가 예약에서 사유와 문의 연결을 확인했다.
6. 공개 여행과 AI 일정을 독립 사본으로 복사하고, 구조화 일정에서 항목을 교체·삭제한 결과가 `trips` 상태에 유지되는 것을 확인했다.
7. 스토리 찜과 일정 담기는 각각 `saved-items`, `trips`에 저장된다.

### 고객센터·플랫폼 관리자

1. 고객이 예약 `HNG-2026-000003`에 연결된 문의 `INQ-2026-2890`을 생성했다.
2. 관리자는 문의 목록에서 예약 상태와 문의 SLA를 함께 확인했다.
3. 관리자가 대안 시간을 답변하자 문의 상태가 `OPEN → ANSWERED`로 바뀌었다.
4. 고객 문의 상세에서 같은 답변과 연결 예약을 확인했다.
5. 운영 통계에서 예약 확정률, 불가·취소, 문의 SLA, 총매출·수수료·취소·조정·순지급액, 스토리·일정·AI 복사 이벤트를 확인했다.

### 액티비티 업체

1. 파트너 전용 JSON 계정으로 로그인했다.
2. 골프 상품의 코스·홀·가격·포함 서비스·옵션·호텔 결합·정산 기준을 편집하고 상태에 저장했다.
3. 상품, 자원, 운영시간·티타임, 수용량, 예약이 분리된 화면과 데이터 책임을 가진다.
4. `UNAVAILABLE` 예약에서 “예약 확인”을 눌러도 확정으로 바뀌지 않고 대안 제시가 필요하다는 안내가 나오는 것을 확인했다.
5. 파트너 정산과 관리자 정산은 같은 예약·정산 상태를 읽어 총매출, 수수료, 환불·취소, 조정, 순지급액을 표시한다.

### 호텔

1. PMS 회원과 분리된 호텔 콘텐츠센터 계정으로 로그인했다.
2. PMS 원천의 Tenant/RoomType 매핑은 읽기 전용으로 표시하고, B2C 소개·정책·편의시설·객실 설명·다중 이미지는 HotelNGo 콘텐츠 상태로 분리했다.
3. 실제 PMS 파일이나 PMS `localStorage`를 직접 읽거나 수정하지 않는다.

### PMS 채널 운영

1. `channel-users.json`의 채널 전용 계정으로 로그인했다.
2. 채널 대시보드에 계정명과 로그아웃이 표시되는 것을 확인했다.
3. 로그아웃 후 `channel-inventory.html`을 직접 열면 원래 `returnUrl`을 보존한 채 채널 로그인으로 이동하는 것을 확인했다.
4. 현재 조회 데이터는 독립 Fixture다. 실제 PMS 조회·예약 명령은 외부 의존으로 남아 있다.

## 4. AI 여행·랜드마크·스토리 처리 방식

현재 AI 여행은 실제 생성형 AI 호출이 아니라 재현 가능한 규칙 랭커다.

1. 사용자가 도시, 기간, 선호를 입력한다.
2. 도시별 랜드마크 카탈로그에서 태그, 기본 점수, 선호 일치 보너스로 후보를 정렬한다.
3. 일정 카드에 선택 이유, 점수, 데이터 신뢰 상태, 예약 방식을 표시한다.
4. 각 항목마다 다른 후보를 선택해 즉시 교체할 수 있다.
5. “내 여행에 독립 사본 만들기”를 누르면 원본과 분리된 `trips` JSON이 만들어진다.
6. 여행 편집기에서 항목 교체·삭제 후 다시 나만의 여행으로 저장한다.

실제 AI로 전환할 때도 LLM이 가격·재고·영업시간을 지어내게 하면 안 된다. LLM은 의도 해석과 설명만 담당하고, 다음 도구의 결과만 조합해야 한다.

- 콘텐츠/RAG 검색: 랜드마크·스토리·가이드·권리·출처
- 통합 검색: 호텔명·여행지·장소·상품
- 지도/경로: 좌표, 이동시간, 운영시간, 휴무
- 공급 조회: 호텔/골프/차량/음식점/스파/투어 가격·슬롯·재고
- 일정 검증: 시간 충돌, 이동 불가, 예산 초과, 예약 불가
- 예약 도구: hold, create, modify, cancel, status, reconcile

모든 AI 결과에는 사용한 데이터 시각, 근거, 신뢰도, 변경 가능한 대안, 예약 가능 상태를 남겨야 한다.

## 5. 자동·정적 검증 결과

| 검증 | 결과 |
|---|---:|
| 제품 HTML 도달성 | 191 / 191 |
| 내부 HTML 링크 | 515 |
| 누락 파일 링크 | 0 |
| 깨진 앵커 | 0 |
| `#`, `javascript:void`, 준비중 placeholder 링크 | 0 |
| 버튼 | 185 |
| 분류되지 않은 버튼 | 0 |
| 핵심 브라우저 흐름 | 11 PASS |
| 외부 의존 흐름 | 3 |
| 업무 유스케이스 | 18 |
| 로컬 Mock 통과 | 17 |
| 실 PMS 의존 | 1 |

검증 산출물:

- `outputs/20260723_process_qa/navigation-audit.json`
- `outputs/20260723_process_qa/interaction-audit.json`
- `outputs/20260723_process_qa/browser-reachability.json`
- `outputs/20260723_process_qa/critical-flow-results.json`
- `data/mock/process-use-cases.json`

## 6. 실서비스 전 반드시 남은 항목

1. 서버 인증, MFA, RBAC, 감사 로그, 개인정보 암호화
2. Provider/Place/Product/Offer/Inventory/Booking 관계형 DB와 테넌트 격리
3. Hotel_PMS `/api/v1/channel/*` 조회와 hold/create/modify/cancel/reconcile
4. 외부 골프·렌터카·음식점·스파·투어 Adapter와 실시간 슬롯
5. PG 승인·환불·Webhook, 정산 원장, 세금 문서, 실지급
6. 지도·경로·영업시간, 검색 인덱스, 알림
7. LLM Tool Gateway, RAG 근거, 평가·승인, 환각 차단
8. 서버 단위·계약·동시성·장애·PMS 회귀 CI

이 8개는 화면이 존재하거나 Mock이 동작한다는 이유로 완료 처리하면 안 된다.
