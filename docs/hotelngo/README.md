# HotelNGo 요구사항·설계·실행 문서

이 디렉터리는 첨부된 `HotelNGo_Codex_통합_프로젝트_계획서.md`, 기존 실행계획, PMS 연동 가이드와 실제 `Hotel_PMS` 저장소 분석 결과를 하나의 구현 기준으로 통합한 문서다.

## 문서 순서

1. `00-requirements-specification.md` — 전체 제품·기능·비기능 요구사항의 단일 기준
2. `01-current-architecture.md` — 현재 HotelNGo/Hotel_PMS에서 코드로 확인한 사실
3. `02-target-architecture.md` — 목표 시스템 경계, 데이터 흐름, 배포 구조
4. `03-domain-model.md` — Partner, Provider, Place, Product, Offer, Booking 등의 책임과 상태
5. `04-api-plan.md` — 공개·파트너·관리자·연동·AI API 계약
6. `05-screen-and-menu-map.md` — B2C·파트너센터·플랫폼 관리자 화면
7. `06-permission-matrix.md` — 인증 영역, 역할, 데이터 격리와 권한
8. `07-pms-integration.md` — INTERNAL_PMS Mock/실연동/예약 연결 가이드
9. `08-ai-rag-architecture.md` — RAG, 실시간 도구, 일정 생성과 AI 검수
10. `09-implementation-roadmap.md` — 릴리스·작업 패키지·진입/완료 게이트
11. `10-test-strategy.md` — 단위·계약·통합·E2E·회귀·보안 테스트
12. `11-requirements-traceability-matrix.md` — 요구사항과 설계·릴리스·테스트의 추적표
13. `12-design-system.md` — 게이트·위치 핀 로고, 색상 토큰, 반응형·컴포넌트 기준

## 문서 사용 규칙

- `00-requirements-specification.md`의 요구사항 ID가 우선한다.
- 구현 전에 관련 상세 문서와 추적표를 확인한다.
- 요구사항을 변경하면 `00`의 ID·인수 조건과 `11`의 추적 상태, 상세 문서, 테스트를 함께 갱신한다.
- `확인된 사실`과 `목표/가정`을 혼합하지 않는다.
- Mock 결과를 실연동 완료로 보고하지 않는다.
- 외부 공급자, 지도, 결제, 메시지, 검색, 미디어, AI는 항상 어댑터 경계를 통한다.
