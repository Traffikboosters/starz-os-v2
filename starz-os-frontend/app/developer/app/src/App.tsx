import { useState, useEffect } from 'react';
import './App.css';
import { RicoChat } from './components/RicoChat';
import { Sidebar } from './components/Sidebar';
import { WorkOrdersPanel } from './components/WorkOrdersPanel';
import { EnginesPanel } from './components/EnginesPanel';
import { TeamPanel } from './components/TeamPanel';
import { DeliverablesPanel } from './components/DeliverablesPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { Toaster } from '../../../../components/ui/sonner';

export type ViewType = 'dashboard' | 'workorders' | 'engines' | 'team' | 'deliverables';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const renderPanel = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPanel onNavigate={setCurrentView} />;
      case 'workorders':
        return <WorkOrdersPanel />;
      case 'engines':
        return <EnginesPanel />;
      case 'team':
        return <TeamPanel />;
      case 'deliverables':
        return <DeliverablesPanel />;
      default:
        return <DashboardPanel onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#030508] text-white transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 grid-pattern opacity-50" />
      </div>

      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderPanel()}
        </main>
      </div>

      {/* Rico Chat Widget */}
      <RicoChat />

      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(12, 16, 28, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
