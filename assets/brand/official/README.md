# HotelnGo 보조 로고 자산

웹 워드마크 정본은 이 폴더의 PNG가 아니라 `../n-color-types.html#color-03`의 actual SVG다. 이 폴더는 파비콘·단독 심볼과 이전 래스터 내보내기를 보관한다.

| 파일 | 용도 | 배경 |
|---|---|---|
| `hotelngo-logo-primary.png` | 이전 래스터 내보내기 · 웹 헤더 사용 금지 | 투명 |
| `hotelngo-symbol-primary.png` | 파비콘·앱 아이콘·작은 배너 | 투명 |
| `hotelngo-symbol-primary.svg` | 확대 출력용 단독 지도 마커 | 투명 |

## 사용 우선순위

- 홈페이지와 하위 페이지는 `../n-color-types.html#color-03`의 actual SVG 마크업을 126px로 표시한다.
- 고정 보관본은 `../n-color-types-v10-ocean-route.html`이다.
- `hotelngo-logo-primary.png`를 웹 헤더나 푸터의 정본으로 사용하지 않는다.
- 로고 비율, 글자 간격, `n` 색상, 지도 마커와 내부 화살표를 개별 수정하지 않는다.
- 배경은 투명이다. 밝은 단색 배경에서 사용하며 사진이나 복잡한 배경에는 흰색 보호 영역을 둔다.

## 자산 구분

- SVG 원본: `../n-color-types.html#color-03`
- 동일 바이트 보관본: `../n-color-types-v10-ocean-route.html`
- 원본 래스터: `../source/hotelngo-logo-approved-raster-white.png`
- 과거 수제 SVG와 자동 변환 시도: `../archive/legacy-svg/`
- 비교 시안: `../n-color-types.html` 등 기존 샘플 페이지

`archive`의 파일은 공식 로고로 사용하지 않는다.
