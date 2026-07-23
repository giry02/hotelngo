# Hotel_PMS 연동 운영 경계와 화면 경로

## 세 영역은 서로 다르다

| 영역 | 시작 경로 | 책임 |
|---|---|---|
| Hotel_PMS 원천 | `E:\AI_Project\Hotel_PMS` | Tenant, RoomType, Room, Reservation, Guest, Folio 운영 |
| HotelNGo PMS 채널 운영 | `channel-login.html` → `channel-dashboard.html` | 공개 모델 매핑, 조회 최신성, shadow 비교, 예약 대사 |
| HotelNGo 플랫폼 관리자 | `admin-login.html` → `admin-dashboard.html` | 공개 카탈로그, 콘텐츠, 파트너, 거래, AI 정책 |
| HotelNGo 파트너센터 | `partner-login.html` → `partner-dashboard.html` | PARTNER_MANAGED 업체의 공개정보·상품·재고 운영 |

PMS 채널 운영 콘솔은 Hotel_PMS를 대체하는 어드민이 아니다. Hotel_PMS 내부 호실·직원·Guest·Folio를 복제하지 않으며 B2C에 노출하지 않는다.

HotelnGo 회원도 PMS 회원을 재사용하지 않는다. HotelnGo 회원·여행자 프로필은 플랫폼 소유이고 PMS Guest는 호텔 tenant 소유다. 예약 이행에 필요한 최소 여행자 스냅샷만 API로 전달하며, 향후 기존 고객을 구분할 때는 계정 병합이 아닌 `PmsGuestLink`를 사용한다.

## 현재 구현된 파일

- 공급 Fixture: `data/mock/supply/internal-pms.json`
- 표시 코드: `scripts/channel-console.js`
- 공통 Shell: `scripts/backoffice-shell.js`의 `channel` Realm
- 대시보드: `channel-dashboard.html`
- 호텔·객실 매핑: `channel-mappings.html`
- 동기화·대사: `channel-monitor.html`

현재 연결 모드는 `FIXTURE`, 신뢰 상태는 `MOCK_ONLY`다. Hotel_PMS 파일이나 Local Storage를 런타임에 직접 읽지 않는다.

## 실제 연동 시 교체 지점

1. `HotelNGoMockAPI.get('supply/internal-pms.json')` 호출을 Channel API client로 교체한다.
2. Hotel_PMS 서버에 운영 API와 분리된 `/api/v1/channel/*`을 만든다.
3. channel 인증, tenant 식별, trace ID, rate limit, 감사 로그를 적용한다.
4. 공개정보·객실유형·요금·가용재고 조회부터 shadow 비교한다.
5. 예약은 hold·멱등성·timeout·reconcile 정책이 검증된 뒤 별도로 연다.

## 예약 명령의 현재 상태

`holdRoomInventory`, `releaseRoomInventory`, `createHotelBooking`, `modifyHotelBooking`, `cancelHotelBooking`, `getHotelBookingStatus`, `reconcileHotelBooking`은 실제 서버가 없어 모두 `UNSUPPORTED_OPERATION`이다. UI의 변경·취소 화면은 Mock 작업 요청만 저장하고 PMS 예약은 변경하지 않는다.
