export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <h1>Layout Working</h1>
      {children}
    </div>
  )
}