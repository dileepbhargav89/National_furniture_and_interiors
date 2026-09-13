import { AdminLoginForm } from '../../../features/auth/components/login-form';

export default function AdminLoginPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[#3A1F0F]">
          National Furniture & Interiors
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your corporate credentials to access the admin portal
        </p>
      </div>
      <AdminLoginForm />
    </>
  );
}
