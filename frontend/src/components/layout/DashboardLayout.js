import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';

export const DashboardLayout = ({ children, title }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <MobileSidebar 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
            />
            
            <div className="md:ml-64">
                <Header 
                    title={title} 
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    isMobileMenuOpen={isMobileMenuOpen}
                />
                <main className="p-4 md:p-6 lg:p-8" data-testid="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};
