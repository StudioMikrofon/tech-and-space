"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { playSound } from "@/lib/sounds";

type LocType = "capital" | "city" | "river" | "mountain" | "landmark" | "lake" | "desert" | "strait";

interface Location {
  name: string;
  country: string;
  lat: number;
  lon: number;
  type: LocType;
}

// ── Capitals (every inhabited continent) ────────────────────────────────────
const CAPITALS: Location[] = [
  // Europe
  { name: "London", country: "United Kingdom", lat: 51.51, lon: -0.13, type: "capital" },
  { name: "Paris", country: "France", lat: 48.86, lon: 2.35, type: "capital" },
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.41, type: "capital" },
  { name: "Madrid", country: "Spain", lat: 40.42, lon: -3.70, type: "capital" },
  { name: "Rome", country: "Italy", lat: 41.90, lon: 12.50, type: "capital" },
  { name: "Warsaw", country: "Poland", lat: 52.23, lon: 21.01, type: "capital" },
  { name: "Vienna", country: "Austria", lat: 48.21, lon: 16.37, type: "capital" },
  { name: "Athens", country: "Greece", lat: 37.98, lon: 23.73, type: "capital" },
  { name: "Stockholm", country: "Sweden", lat: 59.33, lon: 18.07, type: "capital" },
  { name: "Oslo", country: "Norway", lat: 59.91, lon: 10.75, type: "capital" },
  { name: "Helsinki", country: "Finland", lat: 60.17, lon: 24.94, type: "capital" },
  { name: "Prague", country: "Czech Republic", lat: 50.08, lon: 14.44, type: "capital" },
  { name: "Budapest", country: "Hungary", lat: 47.50, lon: 19.04, type: "capital" },
  { name: "Bucharest", country: "Romania", lat: 44.43, lon: 26.10, type: "capital" },
  { name: "Kyiv", country: "Ukraine", lat: 50.45, lon: 30.52, type: "capital" },
  { name: "Lisbon", country: "Portugal", lat: 38.72, lon: -9.14, type: "capital" },
  { name: "Copenhagen", country: "Denmark", lat: 55.68, lon: 12.57, type: "capital" },
  { name: "Dublin", country: "Ireland", lat: 53.35, lon: -6.26, type: "capital" },
  { name: "Reykjavik", country: "Iceland", lat: 64.15, lon: -21.94, type: "capital" },
  // Asia
  { name: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, type: "capital" },
  { name: "Beijing", country: "China", lat: 39.91, lon: 116.39, type: "capital" },
  { name: "Seoul", country: "South Korea", lat: 37.57, lon: 126.98, type: "capital" },
  { name: "New Delhi", country: "India", lat: 28.61, lon: 77.23, type: "capital" },
  { name: "Bangkok", country: "Thailand", lat: 13.76, lon: 100.50, type: "capital" },
  { name: "Jakarta", country: "Indonesia", lat: -6.21, lon: 106.85, type: "capital" },
  { name: "Hanoi", country: "Vietnam", lat: 21.03, lon: 105.85, type: "capital" },
  { name: "Manila", country: "Philippines", lat: 14.60, lon: 120.98, type: "capital" },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.14, lon: 101.69, type: "capital" },
  { name: "Islamabad", country: "Pakistan", lat: 33.69, lon: 73.04, type: "capital" },
  { name: "Tehran", country: "Iran", lat: 35.69, lon: 51.39, type: "capital" },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.69, lon: 46.72, type: "capital" },
  { name: "Ankara", country: "Turkey", lat: 39.93, lon: 32.86, type: "capital" },
  { name: "Ulaanbaatar", country: "Mongolia", lat: 47.90, lon: 106.92, type: "capital" },
  { name: "Astana", country: "Kazakhstan", lat: 51.18, lon: 71.45, type: "capital" },
  { name: "Kathmandu", country: "Nepal", lat: 27.71, lon: 85.31, type: "capital" },
  { name: "Dhaka", country: "Bangladesh", lat: 23.81, lon: 90.41, type: "capital" },
  // Americas
  { name: "Washington D.C.", country: "United States", lat: 38.91, lon: -77.04, type: "capital" },
  { name: "Ottawa", country: "Canada", lat: 45.42, lon: -75.70, type: "capital" },
  { name: "Mexico City", country: "Mexico", lat: 19.43, lon: -99.13, type: "capital" },
  { name: "Brasilia", country: "Brazil", lat: -15.79, lon: -47.88, type: "capital" },
  { name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, type: "capital" },
  { name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, type: "capital" },
  { name: "Lima", country: "Peru", lat: -12.05, lon: -77.04, type: "capital" },
  { name: "Bogota", country: "Colombia", lat: 4.71, lon: -74.07, type: "capital" },
  { name: "Havana", country: "Cuba", lat: 23.11, lon: -82.37, type: "capital" },
  { name: "Caracas", country: "Venezuela", lat: 10.49, lon: -66.88, type: "capital" },
  { name: "Quito", country: "Ecuador", lat: -0.22, lon: -78.51, type: "capital" },
  { name: "La Paz", country: "Bolivia", lat: -16.50, lon: -68.15, type: "capital" },
  { name: "Asuncion", country: "Paraguay", lat: -25.29, lon: -57.65, type: "capital" },
  // Africa
  { name: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24, type: "capital" },
  { name: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82, type: "capital" },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.03, lon: 38.75, type: "capital" },
  { name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, type: "capital" },
  { name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, type: "capital" },
  { name: "Rabat", country: "Morocco", lat: 34.02, lon: -6.84, type: "capital" },
  { name: "Abuja", country: "Nigeria", lat: 9.07, lon: 7.40, type: "capital" },
  { name: "Algiers", country: "Algeria", lat: 36.75, lon: 3.05, type: "capital" },
  { name: "Pretoria", country: "South Africa", lat: -25.74, lon: 28.19, type: "capital" },
  { name: "Khartoum", country: "Sudan", lat: 15.60, lon: 32.53, type: "capital" },
  { name: "Luanda", country: "Angola", lat: -8.83, lon: 13.24, type: "capital" },
  { name: "Kampala", country: "Uganda", lat: 0.32, lon: 32.58, type: "capital" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.20, type: "capital" },
  { name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.59, type: "capital" },
  // Oceania
  { name: "Canberra", country: "Australia", lat: -35.28, lon: 149.13, type: "capital" },
  { name: "Wellington", country: "New Zealand", lat: -41.29, lon: 174.78, type: "capital" },
  { name: "Suva", country: "Fiji", lat: -18.14, lon: 178.44, type: "capital" },
  { name: "Port Moresby", country: "Papua New Guinea", lat: -9.44, lon: 147.18, type: "capital" },
];

// ── Major non-capital cities ──────────────────────────────────────────────────
const CITIES: Location[] = [
  { name: "New York", country: "United States", lat: 40.71, lon: -74.01, type: "city" },
  { name: "Los Angeles", country: "United States", lat: 34.05, lon: -118.24, type: "city" },
  { name: "Chicago", country: "United States", lat: 41.88, lon: -87.63, type: "city" },
  { name: "São Paulo", country: "Brazil", lat: -23.55, lon: -46.63, type: "city" },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.91, lon: -43.17, type: "city" },
  { name: "Mumbai", country: "India", lat: 19.08, lon: 72.88, type: "city" },
  { name: "Shanghai", country: "China", lat: 31.23, lon: 121.47, type: "city" },
  { name: "Hong Kong", country: "China", lat: 22.32, lon: 114.17, type: "city" },
  { name: "Singapore", country: "Singapore", lat: 1.36, lon: 103.82, type: "city" },
  { name: "Sydney", country: "Australia", lat: -33.87, lon: 151.21, type: "city" },
  { name: "Melbourne", country: "Australia", lat: -37.81, lon: 144.96, type: "city" },
  { name: "Toronto", country: "Canada", lat: 43.65, lon: -79.38, type: "city" },
  { name: "Vancouver", country: "Canada", lat: 49.25, lon: -123.12, type: "city" },
  { name: "Lagos", country: "Nigeria", lat: 6.45, lon: 3.40, type: "city" },
  { name: "Casablanca", country: "Morocco", lat: 33.59, lon: -7.62, type: "city" },
  { name: "Mombasa", country: "Kenya", lat: -4.06, lon: 39.67, type: "city" },
  { name: "Cape Town", country: "South Africa", lat: -33.93, lon: 18.42, type: "city" },
  { name: "Osaka", country: "Japan", lat: 34.69, lon: 135.50, type: "city" },
  { name: "Guangzhou", country: "China", lat: 23.13, lon: 113.26, type: "city" },
  { name: "Karachi", country: "Pakistan", lat: 24.86, lon: 67.01, type: "city" },
  { name: "Istanbul", country: "Turkey", lat: 41.01, lon: 28.96, type: "city" },
  { name: "Barcelona", country: "Spain", lat: 41.39, lon: 2.15, type: "city" },
  { name: "Milan", country: "Italy", lat: 45.47, lon: 9.19, type: "city" },
  { name: "Hamburg", country: "Germany", lat: 53.55, lon: 10.00, type: "city" },
  { name: "Medellín", country: "Colombia", lat: 6.25, lon: -75.57, type: "city" },
  { name: "Guadalajara", country: "Mexico", lat: 20.66, lon: -103.35, type: "city" },
  { name: "Montréal", country: "Canada", lat: 45.50, lon: -73.57, type: "city" },
  { name: "Kinshasa", country: "DR Congo", lat: -4.32, lon: 15.32, type: "city" },
  { name: "Johannesburg", country: "South Africa", lat: -26.20, lon: 28.04, type: "city" },
  { name: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82, type: "city" },
  { name: "Kano", country: "Nigeria", lat: 12.00, lon: 8.52, type: "city" },
];

// ── Major rivers (notable midpoint or mouth) ──────────────────────────────────
const RIVERS: Location[] = [
  { name: "Amazon River", country: "South America", lat: -3.10, lon: -60.01, type: "river" },
  { name: "Nile River", country: "Africa", lat: 16.10, lon: 32.50, type: "river" },
  { name: "Yangtze River", country: "China", lat: 31.00, lon: 110.00, type: "river" },
  { name: "Mississippi River", country: "United States", lat: 35.00, lon: -90.00, type: "river" },
  { name: "Congo River", country: "DR Congo", lat: -3.00, lon: 16.00, type: "river" },
  { name: "Mekong River", country: "Southeast Asia", lat: 15.00, lon: 105.00, type: "river" },
  { name: "Volga River", country: "Russia", lat: 52.00, lon: 47.00, type: "river" },
  { name: "Niger River", country: "West Africa", lat: 9.00, lon: 4.00, type: "river" },
  { name: "Danube River", country: "Central Europe", lat: 45.85, lon: 26.80, type: "river" },
  { name: "Ganges River", country: "India", lat: 25.00, lon: 84.00, type: "river" },
  { name: "Zambezi River", country: "Southern Africa", lat: -16.00, lon: 26.00, type: "river" },
  { name: "Ob River", country: "Russia", lat: 62.00, lon: 73.00, type: "river" },
  { name: "Rhine River", country: "Western Europe", lat: 50.50, lon: 7.60, type: "river" },
  { name: "Orinoco River", country: "Venezuela", lat: 6.00, lon: -67.00, type: "river" },
  { name: "Indus River", country: "Pakistan", lat: 28.00, lon: 68.00, type: "river" },
  { name: "Murray River", country: "Australia", lat: -34.50, lon: 140.00, type: "river" },
  { name: "Mackenzie River", country: "Canada", lat: 64.00, lon: -128.00, type: "river" },
  { name: "Tigris River", country: "Iraq", lat: 33.50, lon: 44.50, type: "river" },
  { name: "Euphrates River", country: "Iraq/Syria", lat: 35.00, lon: 40.00, type: "river" },
  { name: "Colorado River", country: "United States", lat: 36.50, lon: -113.00, type: "river" },
];

// ── Major mountains ────────────────────────────────────────────────────────────
const MOUNTAINS: Location[] = [
  { name: "Mount Everest", country: "Nepal/China", lat: 27.99, lon: 86.93, type: "mountain" },
  { name: "K2", country: "Pakistan/China", lat: 35.88, lon: 76.51, type: "mountain" },
  { name: "Kangchenjunga", country: "Nepal/India", lat: 27.70, lon: 88.15, type: "mountain" },
  { name: "Lhotse", country: "Nepal/China", lat: 27.96, lon: 86.94, type: "mountain" },
  { name: "Aconcagua", country: "Argentina", lat: -32.65, lon: -70.01, type: "mountain" },
  { name: "Denali", country: "United States (Alaska)", lat: 63.07, lon: -151.01, type: "mountain" },
  { name: "Mount Kilimanjaro", country: "Tanzania", lat: -3.07, lon: 37.35, type: "mountain" },
  { name: "Mont Blanc", country: "France/Italy", lat: 45.83, lon: 6.86, type: "mountain" },
  { name: "Mount Elbrus", country: "Russia", lat: 43.35, lon: 42.44, type: "mountain" },
  { name: "Pico de Orizaba", country: "Mexico", lat: 19.03, lon: -97.27, type: "mountain" },
  { name: "Mount Logan", country: "Canada", lat: 60.57, lon: -140.41, type: "mountain" },
  { name: "Vinson Massif", country: "Antarctica", lat: -78.53, lon: -85.62, type: "mountain" },
  { name: "Puncak Jaya", country: "Indonesia", lat: -4.08, lon: 137.19, type: "mountain" },
  { name: "Mount Fuji", country: "Japan", lat: 35.36, lon: 138.73, type: "mountain" },
  { name: "Matterhorn", country: "Switzerland/Italy", lat: 45.98, lon: 7.66, type: "mountain" },
  { name: "Mount Olympus", country: "Greece", lat: 40.09, lon: 22.36, type: "mountain" },
  { name: "Vesuvius", country: "Italy", lat: 40.82, lon: 14.43, type: "mountain" },
  { name: "Popocatepetl", country: "Mexico", lat: 19.02, lon: -98.62, type: "mountain" },
  { name: "Mount Kenya", country: "Kenya", lat: -0.15, lon: 37.31, type: "mountain" },
  { name: "Mount Cook", country: "New Zealand", lat: -43.59, lon: 170.14, type: "mountain" },
];

// ── Historical landmarks ──────────────────────────────────────────────────────
const LANDMARKS: Location[] = [
  { name: "Machu Picchu", country: "Peru", lat: -13.16, lon: -72.54, type: "landmark" },
  { name: "Pyramids of Giza", country: "Egypt", lat: 29.98, lon: 31.13, type: "landmark" },
  { name: "Colosseum", country: "Italy", lat: 41.89, lon: 12.49, type: "landmark" },
  { name: "Stonehenge", country: "United Kingdom", lat: 51.18, lon: -1.83, type: "landmark" },
  { name: "Angkor Wat", country: "Cambodia", lat: 13.41, lon: 103.87, type: "landmark" },
  { name: "Chichen Itza", country: "Mexico", lat: 20.68, lon: -88.57, type: "landmark" },
  { name: "Taj Mahal", country: "India", lat: 27.17, lon: 78.04, type: "landmark" },
  { name: "Great Wall", country: "China", lat: 40.43, lon: 116.57, type: "landmark" },
  { name: "Eiffel Tower", country: "France", lat: 48.85, lon: 2.29, type: "landmark" },
  { name: "Sagrada Familia", country: "Spain", lat: 41.40, lon: 2.17, type: "landmark" },
];

// ── Major lakes ───────────────────────────────────────────────────────────────
const LAKES: Location[] = [
  { name: "Lake Baikal", country: "Russia", lat: 53.5, lon: 108.17, type: "lake" },
  { name: "Lake Victoria", country: "Uganda/Kenya", lat: -1.0, lon: 33.0, type: "lake" },
  { name: "Lake Titicaca", country: "Bolivia/Peru", lat: -15.9, lon: -69.3, type: "lake" },
  { name: "Caspian Sea", country: "Kazakhstan", lat: 42.0, lon: 51.0, type: "lake" },
  { name: "Lake Superior", country: "USA/Canada", lat: 47.7, lon: -87.1, type: "lake" },
];

// ── Deserts ───────────────────────────────────────────────────────────────────
const DESERTS: Location[] = [
  { name: "Sahara Desert", country: "Algeria", lat: 23.0, lon: 5.0, type: "desert" },
  { name: "Gobi Desert", country: "Mongolia", lat: 42.5, lon: 103.5, type: "desert" },
  { name: "Atacama Desert", country: "Chile", lat: -24.5, lon: -69.2, type: "desert" },
  { name: "Arabian Desert", country: "Saudi Arabia", lat: 24.0, lon: 44.0, type: "desert" },
];

// ── Straits & waterways ──────────────────────────────────────────────────────
const STRAITS: Location[] = [
  { name: "Strait of Gibraltar", country: "Spain", lat: 35.97, lon: -5.64, type: "strait" },
  { name: "Bosphorus", country: "Turkey", lat: 41.1, lon: 29.06, type: "strait" },
  { name: "Panama Canal", country: "Panama", lat: 9.08, lon: -79.68, type: "strait" },
  { name: "Suez Canal", country: "Egypt", lat: 30.68, lon: 32.35, type: "strait" },
];

const ALL_LOCATIONS: Location[] = [...CAPITALS, ...CITIES, ...RIVERS, ...MOUNTAINS, ...LANDMARKS, ...LAKES, ...DESERTS, ...STRAITS];

const TOTAL_ROUNDS = 12;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistributedQuestions(n: number): Location[] {
  // Ensure diversity: at least some of each type
  const capitals  = shuffle(CAPITALS).slice(0, 3);
  const cities    = shuffle(CITIES).slice(0, 2);
  const rivers    = shuffle(RIVERS).slice(0, 2);
  const mountains = shuffle(MOUNTAINS).slice(0, 1);
  const landmarks = shuffle(LANDMARKS).slice(0, 2);
  const lakes     = shuffle(LAKES).slice(0, 1);
  const deserts   = shuffle(DESERTS).slice(0, 1);
  const straits   = shuffle(STRAITS).slice(0, 1);
  return shuffle([...capitals, ...cities, ...rivers, ...mountains, ...landmarks, ...lakes, ...deserts, ...straits]).slice(0, n);
}

function questionText(loc: Location): string {
  switch (loc.type) {
    case "river":    return `Where does the ${loc.name} flow?`;
    case "mountain": return `Where is ${loc.name} located?`;
    case "landmark": return `Where is ${loc.name}?`;
    case "lake":     return `Where is ${loc.name}?`;
    case "desert":   return `Where is the ${loc.name}?`;
    case "strait":   return `Where is the ${loc.name}?`;
    default:         return `Where is this city located?`;
  }
}

function answerLabel(loc: Location): string {
  return `${loc.name}, ${loc.country}`;
}

interface GlobeQuizProps {
  onFlyTo?: (lat: number, lon: number) => void;
  onClose: () => void;
}

export default function GlobeQuiz({ onFlyTo, onClose }: GlobeQuizProps) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const questionsRef = useRef<Location[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [currentLoc, setCurrentLoc] = useState<Location | null>(null);

  const onFlyToRef = useRef(onFlyTo);
  onFlyToRef.current = onFlyTo;

  const startRound = useCallback((roundIdx: number, questions: Location[]) => {
    if (roundIdx >= TOTAL_ROUNDS) {
      setGameOver(true);
      return;
    }
    const q = questions[roundIdx];
    setCurrentLoc(q);
    onFlyToRef.current?.(q.lat, q.lon);

    // Generate 4 options from the same type pool when possible, otherwise mix
    const sameType = ALL_LOCATIONS.filter(c => c.name !== q.name && c.type === q.type);
    const diffType = ALL_LOCATIONS.filter(c => c.name !== q.name && c.type !== q.type);
    const wrongPool = sameType.length >= 3 ? sameType : [...sameType, ...diffType];
    const wrong = shuffle(wrongPool).slice(0, 3);
    const opts = shuffle([q, ...wrong].map(c => answerLabel(c)));
    setOptions(opts);
    setCorrectAnswer(answerLabel(q));
    setAnswered(null);
  }, []);

  useEffect(() => {
    const questions = pickDistributedQuestions(TOTAL_ROUNDS);
    questionsRef.current = questions;
    startRound(0, questions);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswer = (opt: string) => {
    if (answered !== null) return;
    const isCorrect = opt === correctAnswer;
    setAnswered(isCorrect);

    if (isCorrect) {
      const bonus = streak > 0 ? streak * 5 : 0;
      setScore(s => s + 10 + bonus);
      setStreak(s => s + 1);
      playSound("quizCorrect");
    } else {
      setStreak(0);
      playSound("quizWrong");
    }

    setTimeout(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= TOTAL_ROUNDS) {
        setGameOver(true);
      } else {
        startRound(nextRound, questionsRef.current);
      }
    }, 1500);
  };

  const restart = () => {
    setScore(0);
    setStreak(0);
    setRound(0);
    setGameOver(false);
    setCurrentLoc(null);
    const questions = pickDistributedQuestions(TOTAL_ROUNDS);
    questionsRef.current = questions;
    startRound(0, questions);
  };

  const typeLabel: Record<LocType, string> = {
    capital:  "🏛 Capital",
    city:     "🏙 City",
    river:    "🌊 River",
    mountain: "⛰ Mountain",
    landmark: "🏛 Landmark",
    lake:     "🌊 Lake",
    desert:   "🏜 Desert",
    strait:   "🌊 Strait",
  };

  if (gameOver) {
    return (
      <div className="glass-card p-6 text-center space-y-4 max-w-sm mx-auto">
        <h3 className="font-heading text-2xl font-bold text-accent-amber">Quiz Complete!</h3>
        <p className="text-4xl font-bold font-mono text-text-primary">{score}</p>
        <p className="text-sm text-text-secondary">points</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={restart}
            className="px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-mono text-sm hover:bg-accent-cyan/20 transition-colors cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary font-mono text-sm hover:bg-white/10 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3 max-w-sm mx-auto !hover:transform-none">
      {/* HUD */}
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-text-secondary">Round {round + 1}/{TOTAL_ROUNDS}</span>
        <span className="text-accent-amber font-bold">Score: {score}</span>
        {streak > 1 && (
          <span className="text-red-400 font-bold">Streak x{streak}</span>
        )}
      </div>

      {/* Type badge */}
      {currentLoc && (
        <div className="flex justify-center">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/8 text-text-secondary/60 border border-white/10">
            {typeLabel[currentLoc.type]}
          </span>
        </div>
      )}

      <p className="text-sm text-text-primary font-semibold text-center">
        {currentLoc ? questionText(currentLoc) : "Where is this location?"}
      </p>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt) => {
          let btnClass = "w-full text-left px-3 py-2 rounded-lg border text-sm font-mono transition-all cursor-pointer ";
          if (answered !== null) {
            if (opt === correctAnswer) {
              btnClass += "bg-green-400/20 border-green-400/40 text-green-400";
            } else {
              btnClass += "bg-white/5 border-white/10 text-text-secondary opacity-50";
            }
          } else {
            btnClass += "bg-white/5 border-white/10 text-text-primary hover:bg-accent-cyan/10 hover:border-accent-cyan/30";
          }

          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className={btnClass}
              disabled={answered !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered !== null && (
        <p className={`text-xs font-mono text-center ${answered ? "text-green-400" : "text-red-400"}`}>
          {answered ? "Correct!" : `Wrong! It was ${correctAnswer}`}
        </p>
      )}
    </div>
  );
}
