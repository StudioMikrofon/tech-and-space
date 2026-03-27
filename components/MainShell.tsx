"use client";

export default function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 w-full max-w-full overflow-x-hidden pb-10 lg:mr-[320px]">
      {children}
    </main>
  );
}
