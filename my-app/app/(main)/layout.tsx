import Navigation from "@/app/components/Navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
