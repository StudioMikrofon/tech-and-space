export type PersonaSlug =
  | "neural-echo"
  | "bytejest"
  | "orbital-mind"
  | "circuit-dossier"
  | "vital-signal"
  | "civic-mirror"
  | "steel-pulse";

type PersonaDisplay = {
  name: string;
  roleEn: string;
  roleHr: string;
  avatar: string;
  taglinesEn: string[];
  taglinesHr: string[];
};

const PERSONAS: Record<PersonaSlug, PersonaDisplay> = {
  "neural-echo": {
    name: "NEURAL ECHO",
    roleEn: "AI editor",
    roleHr: "AI urednik",
    avatar: "/images/authors/neural-echo.svg",
    taglinesEn: [
      "Has opinions about every benchmark and a spreadsheet for the rest.",
      "Still thinks a model should explain itself before it ships.",
      "Raised on prompt logs, failure modes, and suspiciously neat graphs.",
      "Can quote a hallucination and then debug the footnote.",
      "Treats every model release like a courtroom transcript.",
      "Always asks whether the metric matters outside the slide deck.",
      "Collects paper cuts from bad prompts and turns them into rules.",
      "Can smell synthetic confidence before the first paragraph ends.",
      "Loves a clean benchmark almost as much as a messy reality check.",
      "Believes the first draft of truth is usually buried in the logs.",
    ],
    taglinesHr: [
      "Ima mišljenje o svakom benchmarku i tablicu za ostalo.",
      "Još uvijek vjeruje da se model prvo mora objasniti, pa tek onda isporučiti.",
      "Odrastao na prompt logovima, failure modeovima i sumnjivo urednim grafovima.",
      "Može citirati halucinaciju i onda debugirati fusnotu.",
      "Svako model izdanje tretira kao sudski zapisnik.",
      "Uvijek pita vrijedi li metrika izvan prezentacije.",
      "Skuplja ogrebotine od loših promptova i pretvara ih u pravila.",
      "Namiriše sintetičko samopouzdanje prije nego što završi prvi odlomak.",
      "Voli čist benchmark skoro kao i grubi reality check.",
      "Vjeruje da je prvi nacrt istine obično skriven u logovima.",
    ],
  },
  bytejest: {
    name: "BYTEJEST",
    roleEn: "Gaming editor",
    roleHr: "Gaming urednik",
    avatar: "/images/authors/bytejest.svg",
    taglinesEn: [
      "Has probably tested the patch before the patch notes existed.",
      "Raised on lag, loot, and arguments that start with 'actually...'.",
      "Can smell a fake leak from three servers away.",
      "Treats a balance patch like a community referendum.",
      "Knows the difference between a buff and a forum tantrum.",
      "Has seen more patch notes than some dev teams have seen sleep.",
      "Can tell you which meta died before the dev blog finished loading.",
      "Still believes the real difficulty is surviving the queue.",
      "Finds the real story where the hype dies and the players stay.",
      "Thinks every boss fight is secretly a product brief.",
    ],
    taglinesHr: [
      "Vjerojatno je patch probao prije nego što su patch notesi postojali.",
      "Odrastao na lagu, lootu i raspravama koje kreću s 'zapravo...'.",
      "Lažni leak nanjuši s tri servera udaljenosti.",
      "Balance patch tretira kao referendum zajednice.",
      "Zna razliku između buffa i forumaškog sloma živaca.",
      "Vidjel je više patch notesa nego što su neki timovi vidjeli sna.",
      "Može reći koji je meta umro prije nego što se dev blog učitao.",
      "I dalje vjeruje da je prava težina u preživljavanju queuea.",
      "Pravu priču nađe tamo gdje hype umre, a igrači ostanu.",
      "Misli da je svaki boss fight zapravo product brief.",
    ],
  },
  "orbital-mind": {
    name: "ORBITAL MIND",
    roleEn: "Space editor",
    roleHr: "Urednik za svemir",
    avatar: "/images/authors/orbital-mind.svg",
    taglinesEn: [
      "Treats every launch like a timeline puzzle and every anomaly like homework.",
      "Can turn orbital mechanics into a coffee break conversation.",
      "Still gets excited when the numbers line up and the physics behaves.",
      "Has a habit of making mission control sound almost too calm.",
      "Will read a flight plan for fun and call it research.",
      "Can turn a probe update into a story about orbital patience.",
      "Believes the universe is mostly a scheduling problem with excellent lighting.",
      "Never meets an anomaly without asking what came before it.",
      "Knows that a clean timeline is half the science and all the trust.",
      "Still smiles when the telemetry finally says the quiet part out loud.",
    ],
    taglinesHr: [
      "Svako lansiranje tretira kao puzzle, a svaku anomaliju kao zadaću.",
      "Orbitalnu mehaniku pretvara u razgovor uz kavu.",
      "Još uvijek se razveseli kad se brojevi slože i fizika posluša.",
      "Mission control uspije učiniti gotovo previše mirnim.",
      "Flight plan čita iz zabave i zove to istraživanjem.",
      "Ažuriranje sonde pretvara u priču o orbitalnom strpljenju.",
      "Vjeruje da je svemir uglavnom problem rasporeda s odličnim osvjetljenjem.",
      "Anomaliju nikad ne gleda bez pitanja što je došlo prije nje.",
      "Zna da je uredna timeline polovica znanosti i sva povjerenja.",
      "I dalje se nasmije kad telemetry napokon izgovori tihi dio naglas.",
    ],
  },
  "circuit-dossier": {
    name: "CIRCUIT DOSSIER",
    roleEn: "Technology editor",
    roleHr: "Urednik za tehnologiju",
    avatar: "/images/authors/circuit-dossier.svg",
    taglinesEn: [
      "Sleeps with a spec sheet under the pillow and a teardown video in queue.",
      "Will always ask what the product does after the demo ends.",
      "Believes every feature needs a price, a tradeoff, and a footnote.",
      "Keeps a mental checklist of hidden costs nobody put on the box.",
      "Can read a spec sheet like some people read bedtime stories.",
      "Thinks every product should survive the second question, not just the launch.",
      "Will find the tradeoff before the marketing team finishes smiling.",
      "Treats feature lists as clues, not conclusions.",
      "Knows that a glossy demo is just the opening act.",
      "Always asks what breaks when the battery runs out and the applause stops.",
    ],
    taglinesHr: [
      "Spava s datasheetom pod jastukom i teardown videom u queueu.",
      "Uvijek pita što proizvod radi nakon što demo završi.",
      "Vjeruje da svaka funkcija treba cijenu, kompromis i fusnotu.",
      "U glavi nosi checklistu skrivenih troškova koje nitko nije stavio na kutiju.",
      "Datasheet čita kao što neki ljudi čitaju priču za laku noć.",
      "Misli da proizvod mora preživjeti drugo pitanje, ne samo lansiranje.",
      "Tradeoff pronađe prije nego marketinški tim završi osmijeh.",
      "Popis funkcija tretira kao tragove, ne zaključke.",
      "Sjajni demo vidi kao prvi čin, ne završetak.",
      "Uvijek pita što puca kad nestane baterije i aplauza.",
    ],
  },
  "vital-signal": {
    name: "VITAL SIGNAL",
    roleEn: "Medicine editor",
    roleHr: "Urednik za medicinu",
    avatar: "/images/authors/vital-signal.svg",
    taglinesEn: [
      "Shows up with a calmer pen and a very strict evidence filter.",
      "Never confuses promising data with actual care.",
      "Treats sample size like the headline it actually is.",
      "Can spot a weak study design before the abstract is finished.",
      "Reads the limits before the conclusion and the caveats before the cheer.",
      "Believes a promising result is just a promise until it survives the clinic.",
      "Keeps one eye on what was measured and the other on what was missed.",
      "Knows the difference between hope and evidence is usually the methods section.",
      "Will never let a glossy chart outrun the sample size.",
      "Treats the evidence ladder like a map, not a slogan.",
    ],
    taglinesHr: [
      "Dolazi sa smirenijom olovkom i vrlo strogim filterom dokaza.",
      "Nikad ne miješa obećavajuće podatke sa stvarnom skrbi.",
      "Veličinu uzorka tretira kao ono što stvarno jest: naslov.",
      "Slab dizajn studije nanjuši prije nego što završi sažetak.",
      "Prvo čita ograničenja, pa tek onda zaključak i aplauz.",
      "Obećavajući rezultat smatra obećanjem dok ne preživi kliniku.",
      "Jednim okom prati što je mjereno, drugim što je propušteno.",
      "Zna da je razlika između nade i dokaza obično u methods sekciji.",
      "Nikad ne pušta sjajan graf da pretrči veličinu uzorka.",
      "Ljestvicu dokaza tretira kao mapu, a ne kao slogan.",
    ],
  },
  "civic-mirror": {
    name: "CIVIC MIRROR",
    roleEn: "Society editor",
    roleHr: "Urednik za društvo",
    avatar: "/images/authors/civic-mirror.svg",
    taglinesEn: [
      "Always looking for the hidden cost nobody wanted on page one.",
      "Turns public outrage into actual context, not just noise.",
      "Can spot the real winners and losers before lunch.",
      "Reads the fine print where everyone else stops at the headline.",
      "Knows that public anger is not the same thing as public truth.",
      "Has a habit of finding who pays before anyone asks who profits.",
      "Turns social panic into structure instead of shouting back.",
      "Looks for the person left holding the bill.",
      "Finds the human consequence hiding in the corporate statement.",
      "Will always ask who gets convenience and who gets the cleanup.",
    ],
    taglinesHr: [
      "Uvijek traži skriveni trošak koji nitko nije htio na naslovnici.",
      "Javno nezadovoljstvo pretvara u kontekst, ne samo buku.",
      "Prepoznaje stvarne pobjednike i gubitnike prije ručka.",
      "Sitna slova čita tamo gdje svi drugi stanu na naslovu.",
      "Zna da javni bijes nije isto što i javna istina.",
      "Uvijek prvo nađe tko plaća prije nego itko pita tko profitira.",
      "Društvenu paniku pretvara u strukturu umjesto da joj viče natrag.",
      "Traži onoga kome ostaje račun.",
      "U korporativnoj izjavi nađe ljudsku posljedicu.",
      "Uvijek pita tko dobiva pogodnost, a tko čišćenje.",
    ],
  },
  "steel-pulse": {
    name: "STEEL PULSE",
    roleEn: "Robotics editor",
    roleHr: "Urednik za robotiku",
    avatar: "/images/authors/steel-pulse.svg",
    taglinesEn: [
      "Was probably soldering servo motors before most kids learned to ride a bike.",
      "Has the kind of robot obsession that turns every demo into a stress test.",
      "Still thinks the important question is whether the machine survives Tuesday.",
      "Built an emotional attachment to actuators and never really grew out of it.",
      "Treats a walking robot like most people treat a new coffee machine.",
      "Can spot a fake deployment from the sound of the press release.",
      "Believes every robot story should answer one simple question: does it work in the mud?",
      "Has been waiting for the lab demo to meet the loading dock his whole life.",
      "Knows the difference between clever choreography and actual field survival.",
      "Would rather test a robot in the rain than admire it in a showroom.",
    ],
    taglinesHr: [
      "Vjerojatno je lemljenje servo motora počeo prije nego što je većina klinaca naučila voziti bicikl.",
      "Ima onu vrstu robot-fiksacije koja svaki demo pretvara u stres-test.",
      "Još uvijek misli da je najvažnije pitanje preživi li stroj utorak.",
      "Aktuatorima je razvio emotivnu vezu i nikad nije stvarno prestao.",
      "Hodajućeg robota tretira kao što drugi ljudi tretiraju novu kavu.",
      "Lažni deployment nanjuši po zvuku priopćenja za tisak.",
      "Vjeruje da svaka robotska priča mora odgovoriti na jedno pitanje: radi li u blatu?",
      "Cijeli život čeka da lab demo napokon upozna loading dock.",
      "Zna razliku između pametne koreografije i stvarnog preživljavanja na terenu.",
      "Radije bi robota testirao na kiši nego ga gledao u showroomu.",
    ],
  },
};

function pickStableIndex(key: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
}

export function getPersonaDisplay(
  slug?: string | null,
  articleKey?: string | null,
  locale: "en" | "hr" = "en",
) {
  const persona = slug && slug in PERSONAS ? PERSONAS[slug as PersonaSlug] : undefined;
  if (!persona) return null;
  const taglines = locale === "hr" ? persona.taglinesHr : persona.taglinesEn;
  const tagline = taglines[pickStableIndex(String(articleKey || slug || persona.name), taglines.length)];
  return {
    name: persona.name,
    role: locale === "hr" ? persona.roleHr : persona.roleEn,
    avatar: persona.avatar,
    tagline,
  };
}
