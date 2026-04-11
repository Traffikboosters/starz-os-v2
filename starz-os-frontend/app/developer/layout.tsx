import Sidebar from '@/components/Sidebar';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}