import "./globals.css";

export const metadata = {
  title: "배달 앱 최종",
  description: "컴퓨터과학개론 기말 프로젝트 배달앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
