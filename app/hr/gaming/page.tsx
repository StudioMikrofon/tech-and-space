import GamingDashboard from "../../gaming/GamingDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming Pregled — Analitika u stvarnom vremenu",
  description: "Gaming analitika u stvarnom vremenu: hype indeks, radar izdanja, skokovi igrača i indie spotlight.",
};

export default function HrGamingPage() {
  return <GamingDashboard />;
}
