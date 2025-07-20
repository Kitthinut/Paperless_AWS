import Sidebar from "../components/Sidebar";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <Sidebar />
        <main className="ml-14 p-4">{children}</main>
      </body>
    </html>
  );
}