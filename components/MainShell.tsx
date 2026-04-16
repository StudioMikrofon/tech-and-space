"use client";

export default function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full max-w-full overflow-x-hidden pb-10">
      {children}
    </main>
  );
}
