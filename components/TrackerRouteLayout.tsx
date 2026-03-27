"use client";

import { usePathname } from "next/navigation";
import PlanetaryTrackerExperience from "./PlanetaryTrackerExperience";

export default function TrackerRouteLayout() {
  const pathname = usePathname();
  const mode = pathname.includes("weather-tracker") ? "weather" : "space";
  const lang = pathname.startsWith("/hr") ? "hr" : "en";
  return <PlanetaryTrackerExperience mode={mode} lang={lang} />;
}
