import "./globals.css";

export const metadata = {
  title: "STARZ-OS",
  description: "More Traffik, More Sales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}