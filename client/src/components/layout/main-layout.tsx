import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        isCollapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-0'}`}>
        <Header 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-hidden h-full">
          {children}
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
