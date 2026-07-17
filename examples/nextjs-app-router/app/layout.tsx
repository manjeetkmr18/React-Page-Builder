import "./globals.css";

export const metadata = {
  title: "react-page-builder - Next.js example",
  description: "Drag-and-drop page builder demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
