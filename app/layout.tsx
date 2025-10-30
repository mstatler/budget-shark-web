import "./globals.css";

export const metadata = {
  title: "Budget Shark",
  description: "Cleaner budgeting & forecasting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
