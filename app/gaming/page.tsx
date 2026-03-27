import GamingDashboard from "./GamingDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming Intel — Live Gaming Analytics",
  description: "Real-time gaming intelligence: hype index, release radar, player spikes, indie spotlight.",
};

export default function GamingPage() {
  return <GamingDashboard />;
}
