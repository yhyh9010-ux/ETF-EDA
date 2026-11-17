# ETF Atlas

네이버 금융의 [ETF 목록 API](https://finance.naver.com/api/sise/etfItemList.nhn)를 조회해 운용사, 시장, 상품별 현황을 보여주는 HTML 대시보드입니다.

## 실행

`index.html`을 브라우저에서 열면 됩니다. Node.js 설치나 로컬 서버가 필요하지 않습니다.

GitHub Pages에 배포할 때는 `main` 브랜치의 `/ (root)`를 게시 원본으로 설정합니다.

## 구성

- `index.html`, `styles.css`, `app.js`: 운용사 및 시장 집계, 상승·하락 상품, 검색·필터·정렬·상세 보기를 제공합니다. 네이버 금융의 JSONP 응답을 브라우저에서 직접 읽으며, 화면은 30초마다 갱신합니다.

ETF 목록 API에는 운용사 필드가 없습니다. 대시보드는 상품명 맨 앞의 브랜드를 운용사에 매핑하며, 인식하지 못한 브랜드는 `미분류`로 표시합니다. 시장 분류는 API의 `etfTabCode`를 사용합니다. 시세는 네이버 금융의 제공 시점에 따라 지연될 수 있습니다.
