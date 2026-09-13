import { LoginForm } from '../../../features/auth/components/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign In
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password below to login to your account
        </p>
      </div>
      <LoginForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign Up
        </Link>
      </p>
    </>
  );
}
