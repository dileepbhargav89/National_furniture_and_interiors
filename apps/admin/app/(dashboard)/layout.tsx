import { AuthProvider } from '../../providers/auth-provider';
import { AuthGuard } from '../../providers/auth-guard';
import { AdminSidebar } from '../../components/admin-sidebar';
import { AdminHeader } from '../../components/admin-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        {/* Full-viewport shell — sidebar and header are fixed, only main scrolls */}
        <div className="admin-shell">
          <AdminHeader />
          <div className="admin-body">
            <AdminSidebar />
            <main className="admin-main">
              <div className="max-w-[1400px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6 min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
}
