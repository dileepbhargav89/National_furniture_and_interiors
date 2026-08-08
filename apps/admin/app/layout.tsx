// Root layout — required by Next.js App Router (docs/07_technology_decision_record.md §3).
// No admin UI exists yet (Sprint 1+); this is the minimal contract the framework itself requires.
export const metadata = {
  title: 'National Furniture & Interiors — Admin',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
