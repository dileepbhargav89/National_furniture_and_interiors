import { redirect } from 'next/navigation';

// Admin root — redirect to the executive command dashboard.
// The actual UI is rendered by app/(dashboard)/layout.tsx and app/(dashboard)/dashboard/page.tsx.
export default function AdminHomePage() {
  redirect('/dashboard');
}
