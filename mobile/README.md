# HotelnGo Mobile

PC 웹의 반응형 화면이 아니라 별도로 설계한 모바일 웹 앱입니다.

## 실행

- 웹 확인: 저장소 루트에서 정적 서버를 실행한 후 `/mobile/`로 접속
- 공통 자산 준비: `npm run mobile:assets`
- 네이티브 동기화: `npm run mobile:sync`
- Android Studio 열기: `npm run mobile:android`
- iOS Xcode 열기: `npm run mobile:ios` (macOS와 Xcode 필요)

## 모바일 라우트

- `#home`: 홈과 이어 만들기
- `#discover`: 지역·랜드마크·서비스 발견
- `#community`: 사용자 여행기 피드
- `#story/{id}`: 여행기 상세·댓글·스크랩·공유
- `#card`: 여행 카드와 AI 일정 초안
- `#plan`: 날짜별 지도·시간·동선 편집
- `#hotels`: 모바일 호텔 탐색
- `#trips`: 내 여행, 예약, 저장·활동 진입
- `#login`: 모바일 로그인

## 구현 경계

- 모바일 화면과 스타일은 이 폴더에서만 관리합니다.
- 원천 fixture와 브랜드·이미지는 `scripts/build-mobile.mjs`가 복사합니다.
- 네이티브 기능은 `scripts/native-bridge.js`를 통해 호출합니다.
- 실제 서버 전환 시 브라우저 저장소 키를 동일 도메인의 API 명령으로 교체합니다.
