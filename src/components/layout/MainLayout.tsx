import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
}

export function MainLayout({ children, title, subtitle, headerAction }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} headerAction={headerAction} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
