import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "STARZ-OS â€” Business Operating System",
  description: "Traffik Boosters Â· Sales + Marketing + Operations OS",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  )
}