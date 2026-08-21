# HotelnGo 로고·브랜드 사용 가이드 v1.6

## 1. 확정 상태

- 상태: **LOCKED / 사용 확정**
- 확정일: 2026-08-21
- 선택안: **05 · Go Capsule**
- 화면 원본: `assets/brand/exploration-20260801/hotelngo-logo-comparison-v14.html`의 05번

새로운 로고 시안은 공식 폴더 밖에서만 만든다. 확정 자산은 사용자 승인 없이 다시 그리거나 덮어쓰지 않는다.

## 2. 공식 파일

| 파일 | 형식 | 용도 | 배경 |
|---|---|---|---|
| `assets/brand/official/hotelngo-logo-go-capsule.svg` | SVG, 420 × 100 viewBox | 웹 헤더·푸터·로그인·운영 화면 정본 | 투명 |
| `assets/brand/n-color-types-v10-ocean-route.html` | HTML | Ocean Route v10 고정 보관본 | 해당 없음 |
| `assets/brand/official/hotelngo-symbol-primary.png` | RGBA PNG, 88 × 88px | 파비콘·작은 배너 | 투명 |
| `assets/brand/official/hotelngo-symbol-primary.svg` | SVG | 인쇄용 단독 심볼 | 투명 |

현재 홈페이지에는 `hotelngo-logo-go-capsule.svg`를 **실제 헤더 144px**로 표시한다. SVG는 `<img>`로 사용하며 HTML 텍스트나 인라인 SVG로 재조립하지 않는다. 디자인 소스는 `assets/brand/exploration-20260801/hotelngo-logo-05-go-capsule.svg`이다.

## 3. 로고 구성

- `Hotel`, `g`: 차콜 `#181B1A`
- 경로형 `n`: 아쿠아·스카이·블루 그라데이션
- 지도 마커 `O`: 블루 `#2F6BFF`
- 마커 내부 원: 불투명 흰색
- 아이덴티티 우선순위: 지도 마커 `O`가 주 포인트이고 `n`은 여행 경로와 연결을 보조한다.

투명 처리 시 바깥 배경과 글자 내부의 빈 공간만 투명하게 하고 지도 마커 안의 흰 원은 유지한다.

## 4. 화면별 크기

| 위치 | 로고 폭 | 컨테이너 기준 |
|---|---:|---:|
| 데스크톱 헤더 | 126px | 비교판의 실제 헤더 크기, 헤더 72px |
| 태블릿 헤더 | 116px | 헤더 62px |
| 모바일 헤더 | 105px | 헤더 62px |
| 푸터 | 126px | 자동 높이 |

`width`만 지정하고 `height:auto`로 원본 비율을 유지한다.

메인·하위 페이지는 `scripts/site-shell.js`를 통해 동일한 PNG를 사용한다. 로그인·관리자·호텔·파트너 화면도 같은 파일을 사용한다.

## 5. 배경과 여백

- 승인된 웹 PNG와 단독 심볼 자산의 배경은 투명이다.
- 흰색 또는 밝은 단색 표면에서 사용한다.
- 사진·복잡한 그라데이션·어두운 배경에서는 흰색 보호 영역을 먼저 둔다.
- 이미지 외부에는 최소 8px의 여백을 확보한다.
- 내부 여백을 제거하려고 임의 크롭하지 않는다.

## 6. 용도별 선택

- 웹 UI: `assets/brand/official/hotelngo-logo-go-capsule.svg`
- 파비콘·작은 아이콘: `hotelngo-symbol-primary.png`
- 비교 화면: `assets/brand/exploration-20260801/hotelngo-logo-comparison-v14.html`의 05번
- 심볼 단독 인쇄: `hotelngo-symbol-primary.svg`

문서·인쇄용 워드마크는 웹 PNG를 확대하지 않고 별도 승인된 벡터 내보내기 자산이 준비될 때까지 보류한다.

## 7. 금지 사항

- `assets/brand/archive/legacy-svg/` 내부 파일 사용
- HTML 텍스트, 웹폰트 조합, 인라인 SVG 또는 CSS 도형으로 로고 재조립
- 서체, 자간, `n`·`g`·지도 마커 간격 변경
- 지도 마커 내부 화살표만 이동하거나 다시 중앙 정렬
- 크롭, 재색상, 늘이기, 찌그러뜨리기, 회전, 그림자, 외곽선, 필터 적용
- 실험 파일로 `official/` 자산 덮어쓰기

## 8. 변경 절차

1. 공식 파일을 수정하지 않고 별도 후보를 만든다.
2. 실제 헤더 126px와 확대 크기를 함께 비교한다.
3. 사용자에게 비교판을 보여주고 명시적으로 승인받는다.
4. 승인 후 공식 파일·해시·버전을 `brand-config.json`과 이 문서에 반영한다.
5. 데스크톱·태블릿·모바일 및 유색 배경에서 확인한다.

## 9. 작업 전 체크리스트

- [ ] `assets/brand/brand-config.json`을 먼저 읽었는가?
- [ ] `assets/brand/n-color-types.html#color-03`의 actual SVG를 기준으로 했는가?
- [ ] 현재 홈페이지에서 승인된 PNG를 126px로 사용하는가?
- [ ] 비율, 승인 폭, 외부 여백을 유지하는가?
- [ ] 마커 내부 흰 원이 불투명하게 유지되는가?
- [ ] `archive/legacy-svg/` 파일을 사용하지 않았는가?

## 10. 관련 파일

- 웹 SVG 정본: `assets/brand/official/hotelngo-logo-go-capsule.svg`
- 디자인 소스: `assets/brand/exploration-20260801/hotelngo-logo-05-go-capsule.svg`
- 시각 가이드: `style-guide.html`
- 기계 판독 설정: `assets/brand/brand-config.json`
