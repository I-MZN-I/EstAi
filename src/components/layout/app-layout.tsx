
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 pb-32">{children}</main>
            <Footer />
        </div>
    );
}
