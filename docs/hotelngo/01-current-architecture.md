# 현재 아키텍처와 구현 가능성

## 1. 확인된 사실

### HotelNGo

- 저장소에는 Git 메타데이터만 있고 애플리케이션, 패키지, 문서, 테스트가 없다.
- 따라서 기존 HotelNGo 기술 스택이나 호환성을 유지해야 할 코드가 없다.

### Hotel_PMS

- 정적 HTML/CSS/JavaScript 기반의 Dashboard와 Admin 화면이다.
- `package.json`은 테스트 스크립트를 제공하지만 `npm start`가 가리키는 `server.js`는 존재하지 않는다.
- `dashboard/common/js/api/api-core.js`의 `PmsMockApi`가 `/api/v1/*` 경로를 정적 JSON 파일로 변환한다.
- GET은 `dashboard/data/api/v1/**`를 fetch하고 POST/PATCH/DELETE는 브라우저 `localStorage` overlay에 저장한다.
- 예약 조회·저장도 정적 seed와 `pms_reservations`를 병합하는 브라우저 로직이다.
- 중앙 DB, 서버 트랜잭션, 동시성 제어, 원자적 hold가 없다.
- 로그인은 정적 계정과 `sessionStorage` 플래그이며 서버 세션이나 토큰 검증이 없다.
- 역할·메뉴 제한도 브라우저에서 수행된다.
- Mock tenant가 `TENANT-GRAND-SAIGON`으로 고정되어 실제 멀티테넌트 격리를 검증할 수 없다.

## 2. 데이터 적합성 문제

- 객실유형 마스터의 `DLX-CITY`, `DLX-OCEAN`과 요금·가용성의 `DLX`가 불일치한다.
- 요금과 가용성 fixture의 날짜 범위가 짧고 서로 일치하지 않는다.
- 호찌민 호텔에 `Asia/Seoul` 시간대가 사용된다.
- B2C 판매에 필요한 세금 포함 여부, 취소정책, 최소박, CTA/CTD, 충분한 미디어·편의시설이 없다.
- 가용성 데이터가 물리 `roomId`, `roomNo`를 포함한다.
- API 버전 표기가 상위 코드, Mock dispatcher, fixture에서 서로 다르다.
- Mock 날짜를 현재 날짜에 맞춰 이동하고 `generatedAt`도 갱신하므로 실제 신선도 증거가 아니다.
- 일부 예약의 고객 참조와 Folio의 예약 참조가 완전하지 않다.

## 3. 재사용 가능한 항목

- 객실·객실유형·예약·요금의 논리 필드와 기존 업무 용어
- 정적 페이지·ES 모듈·JSON envelope 스타일
- 날짜·객실 상태·예약 기간 충돌 로직의 테스트 사례
- API 응답의 `success/data/meta/requestId` 방향
- 기존 PMS 예약·그룹·객실·운영 회귀 스크립트와 테스트 증적

## 4. 직접 재사용하면 안 되는 항목

- PMS 정적 JSON을 HotelNGo 런타임 원천으로 사용하는 방식
- 브라우저 `localStorage`를 중앙 예약·재고로 사용하는 방식
- `sessionStorage` 로그인과 클라이언트 전용 권한 검사
- 물리 호실을 공개 재고로 전달하는 응답
- PMS 기본가 fallback을 B2C 실제 판매가로 간주하는 방식
- Mock `generatedAt`을 실데이터 검수시각으로 간주하는 방식

## 5. 현재 구현 가능성

| 기능 | 현재 가능 여부 | 조건 |
|---|---|---|
| B2C 정적 화면 | 가능 | HotelNGo 독립 구현 |
| 독립 PMS Mock 조회 | 가능 | canonical fixture와 어댑터 |
| 관리자·파트너 Mock 흐름 | 가능 | 실서비스로 표기 금지 |
| 실제 멀티테넌트 파트너 운영 | 불가 | 서버·DB·인증 필요 |
| PMS 실시간 요금·재고 | 불가 | 채널 서버 API 필요 |
| PMS 예약 생성·변경·취소 | 불가 | DB·hold·멱등 API 필요 |
| 결제·정산 | 불가 | 결제·회계·보안 경계 필요 |
| AI/RAG | 조건부 | 콘텐츠·실시간 도구·검증 계층 선행 |

## 6. 현재 테스트 기준선

- PMS에는 페이지·상호작용·데이터·예약·그룹·업무 E2E 회귀 스크립트가 존재한다.
- 최신 보고서는 일부 선택 재실행 PASS와 전체 실행의 FAIL/BLOCKED가 혼재한다.
- 따라서 현재 PMS를 전체 PASS로 간주하지 않고, 채널 변경 전 기준선과 변경 후 결과를 같은 케이스로 비교한다.
- HotelNGo는 별도 CI를 구축하고 PMS 테스트 결과를 복사해 성공으로 보고하지 않는다.

## 7. 결론

첫 구현은 정적 UI와 독립 Mock 수직슬라이스로 진행할 수 있다. 실제 사업 요구사항을 만족하려면 HotelNGo API·DB와 PMS 채널 서버를 순차적으로 도입해야 한다. Mock과 실연동 사이에는 명시적인 활성화 게이트를 둔다.

