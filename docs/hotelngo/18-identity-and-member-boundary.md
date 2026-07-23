# HotelnGo 회원·관리자·PMS 고객 독립 경계

## 1. 확정 원칙

| 영역 | 계정 소유자 | 로그인·세션 | 다른 영역 계정 사용 |
|---|---|---|---|
| `HOTELNGO_B2C` | HotelnGo 개인 회원 | HotelnGo 인증 | 금지 |
| `HOTELNGO_ADMIN` | HotelnGo 운영 구성원 | 관리자 SSO/MFA | 금지 |
| `HOTELNGO_PARTNER` | 파트너 직원 | 파트너 인증 | 금지 |
| `HOTEL_PMS` | 호텔 tenant의 직원·Guest | PMS 정책 | HotelnGo 로그인에 사용 금지 |

각 솔루션은 독립 배포·DB·인증 경계를 가진다. 서로의 사용자 테이블, 비밀번호, 토큰, 세션을 읽지 않으며 업무 API 계약으로만 연동한다.

## 2. HotelnGo 회원 모델

- `Member`: 이메일, 이름, locale, 거주 국가, 기본 통화, 동의 이력과 B2C 자격증명
- `TravelerProfile`: 여권 영문명, 국적, 생년월일, 성별, 여권 발행국·만료일 등 예약 입력 기본값
- `TravelerSnapshot`: 주문·예약 당시 선택된 여행자 정보를 불변 복사
- 여권 원문은 별도 암호화 저장소에 보관하고 일반 회원·관리자 API에는 마스킹 값만 반환한다.

여권번호·국적은 PMS에서 기존 고객을 구분하는 보조 키가 될 수 있지만 HotelnGo 로그인 ID는 아니다.

## 3. PMS Guest 연결

선택적 `PmsGuestLink` 필드:

- `providerId`, `tenantId`, `travelerProfileId`, `pmsGuestId`
- `matchMethod`: `PMS_MEMBER_NUMBER`, `PASSPORT_TOKEN`, `MANUAL_VERIFIED` 등
- `confidence`, `verifiedAt`, `consentReference`, `lastSeenAt`

원문 여권번호를 연결 키로 평문 저장하지 않는다. 가능한 경우 호텔별 salt를 둔 토큰/HMAC 또는 PMS가 발급한 고객번호를 사용한다. 이름·생년월일·국적만으로 후보가 여러 명이면 자동 확정하지 않고 새 Guest 생성 또는 수동 확인으로 보낸다.

## 4. 예약 연동 흐름

1. HotelnGo 회원이 여행자 프로필을 선택한다.
2. 주문 시 `TravelerSnapshot`을 만든다.
3. 동의와 목적 범위에 맞는 최소 필드만 `HotelSupplyAdapter` 명령에 담는다.
4. PMS가 기존 Guest를 반환하거나 새 Guest를 만들 수 있다.
5. 반환된 ID는 호텔·tenant 범위의 `PmsGuestLink`로 보관한다.
6. HotelnGo 예약과 PMS 예약은 `PmsReservationLink`로 별도 연결한다.

어떤 단계에서도 PMS의 비밀번호나 세션을 HotelnGo가 수용하지 않는다.

## 5. 현재 Mock 구현

- B2C: `users.json`, `member-profile.json`, `auth.js`; 회원가입·로그인·비밀번호 재설정·변경
- 관리자: `admin-users.json`, `admin-auth.js`; B2C와 다른 Session Storage 키와 가드
- 관리자 회원: `admin-members.html`, `admin-member-detail.html`; B2C 회원과 마스킹 여행자 값만 표시
- PMS 연동: `internal-pms.json`; 읽기 전용 fixture이며 Guest·예약 쓰기는 아직 미연결

## 6. 실서비스 전 필수 작업

- 서버 DB, 이메일 확인, 비밀번호 정책, 세션 회전·폐기, brute-force 방어
- 관리자 SSO/MFA/RBAC와 모든 민감정보 접근 감사
- 여권 전용 암호화 저장소, 키 회전, 보존·파기, 국가별 개인정보 규정 검토
- 명시적 동의와 목적 제한, PMS별 데이터 처리 계약
- `PmsGuestLink` 후보 매칭·충돌·분리·수동 검증 정책과 계약 테스트
