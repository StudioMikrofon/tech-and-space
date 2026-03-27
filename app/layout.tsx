import type { Metadata, Viewport } from "next";
import { Chakra_Petch, Space_Grotesk, Fira_Code } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--loaded-font-heading",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--loaded-font-body",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--loaded-font-mono",
  display: "swap",
});
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TerminalBoot from "@/components/TerminalBoot";
import PageTransition from "@/components/PageTransition";
import SpaceStage from "@/components/SpaceStage";
import KonamiCode from "@/components/KonamiCode";
import Ticker from "@/components/Ticker";
import SpaceProSidebar from "@/components/SpaceProSidebar";
import MainShell from "@/components/MainShell";
import AgentPanel from "@/components/AgentPanel";
import AmbientSound from "@/components/AmbientSound";
import { getAllArticles } from "@/lib/content";

export const metadata: Metadata = {
  title: {
    default: "TECH & SPACE — Your Portal to the Future",
    template: "%s | TECH & SPACE",
  },
  description:
    "Tech & space news portal. AI, Gaming, Space, Technology, Medicine, Society, and Robotics — curated from around the globe.",
  icons: {
    icon: "/ts-icon.svg",
    shortcut: "/ts-icon.svg",
  },
  openGraph: {
    title: "TECH & SPACE — Your Portal to the Future",
    description:
      "Tech & space news portal with 3D globe visualization.",
    type: "website",
    locale: "en_US",
    siteName: "TECH & SPACE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const articles = getAllArticles();

  return (
    <html lang="en" className={`dark ${chakraPetch.variable} ${spaceGrotesk.variable} ${firaCode.variable}`}>
      <body
        className="font-body antialiased bg-space-bg text-text-primary"
      >
        <TerminalBoot />
        <SpaceStage />
        <PageTransition />
        <AmbientSound />
        <KonamiCode />
        <div className="relative z-10 nebula-bg min-h-screen w-full max-w-full overflow-x-hidden flex flex-col">
          <Header />
          <div className="flex flex-1 w-full max-w-full overflow-x-hidden">
            <MainShell>{children}</MainShell>
            <SpaceProSidebar />
          </div>
          <Footer />
        </div>
        <Ticker articles={articles} compact />
        {process.env.NEXT_PUBLIC_AGENT_PANEL === "true" && (
          <>
            <AgentPanel />
            <a
              href="/foto-review"
              title="Foto Review"
              className="fixed bottom-6 right-[4.5rem] z-[9998] h-12 px-3 rounded-full bg-space-bg border border-white/15 text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/40 text-xs font-mono flex items-center gap-1.5 transition-all"
              style={{ boxShadow: "0 0 12px rgba(0,0,0,0.4)" }}
            >
              ⊞ Foto Review
            </a>
          </>
        )}
      </body>
    </html>
  );
}
