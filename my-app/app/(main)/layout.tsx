export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen p-4">{children}</main>
  );
}
