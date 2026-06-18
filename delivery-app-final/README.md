# 배달 앱 최종

컴퓨터과학개론 기말 프로젝트용 배달앱입니다.

## 주요 기능

- 회원가입 / 로그인 / 로그아웃
- 식당 및 메뉴 목록 보기
- 장바구니 담기
- 주문하기
- 내 주문 내역 보기

## 사용 기술

- Next.js
- PostgreSQL
- Neon
- Vercel

## 데이터베이스 구조

- users: 회원 정보 저장
- restaurants: 식당 정보 저장
- menus: 식당별 메뉴 정보 저장
- cart_items: 사용자의 장바구니 항목 저장
- orders: 주문 한 건의 전체 정보 저장
- order_items: 주문에 포함된 메뉴 상세 저장

orders와 order_items를 나눈 이유는 하나의 주문 안에 여러 메뉴가 들어갈 수 있기 때문입니다.
