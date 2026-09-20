import { AuthProvider } from '../../providers/auth-provider';
import { AuthGuard } from '../../providers/auth-guard';
import { AdminSidebar } from '../../components/admin-sidebar';
import { AdminHeader } from '../../components/admin-header';
import { RealtimeNotificationProvider } from '../../components/notifications/realtime-notification-provider';
import { NotificationToastContainer } from '../../components/notifications/notification-toast-container';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <RealtimeNotificationProvider>
          {/* Full-viewport shell — sidebar and header are fixed, only main scrolls */}
          <div className="admin-shell">
            <AdminHeader />
            <div className="admin-body">
              <AdminSidebar />
              <main className="admin-main">
                <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 py-5 transition-all duration-300 sm:px-8 sm:py-7">
                  {children}
                </div>
              </main>
            </div>
          </div>
          {/* Floating real-time notification toasts */}
          <NotificationToastContainer />
        </RealtimeNotificationProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
