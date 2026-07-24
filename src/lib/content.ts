// All site content data — single source of truth

export const aboutMe = {
  name: "Jeremy Liu",
  title: "",
  bio: "Building Straw. Hackathons for Agents",
  currentActivities: [
    "Building personal tools & student projects",
    "Expanding my knowledge in object-oriented programming",
    "Learning full-stack web dev",
    "Exploring robotics and AI",
  ],
};

export const skills = {
  programmingLanguages: "Python, C, JavaScript, TypeScript, MATLAB, SQL",
  webUI: "React, Next.js, HTML, CSS, Bootstrap, Tailwind, Vite",
  roboticsSystems: "ROS2, Linux (Ubuntu), Arduino, OpenCV",
  dataML:
    "Pytorch, Scikit-learn, Matplotlib, Pandas, NumPy, OpenCV, BeautifulSoup, Selenium",
  developerTools:
    "Git, Node.js, AWS, PostgreSQL, Postman, VS Code, Claude, Cursor.ai",
  improvingBy: [
    "Applying knowledge to create useful projects",
    "Learning more back-end frameworks",
    "Using AI to create smarter applications",
  ],
};

export interface Project {
  title: string;
  description: string;
  front?: string;
  back?: string;
  image?: string;
  github?: string;
  website?: string;
  additionalInfo?: string;
}

export const projects: Project[] = [
  {
    title: "Ensemble",
    description: "Turn your audience's phones into an orchestra.",
    image: "Ensemble",
    github: "https://github.com/Jeremyliu-621/ensemble",
  },
  {
    title: "Paper Cuts",
    description: "Super Smash Bros that lets you doodle.",
    image: "Paper-Cuts",
    website: "https://doodletown.io/",
  },
  {
    title: "Aucctopus",
    description: "Agent swarm predicts product virality.",
    image: "aucctopus",
    github: "https://github.com/Jeremyliu-621/ensemble",
  },
  {
    title: "Leetmeow",
    description: "LeetCode-gated website blocker.",
    image: "leetmeow",
    website: "https://leetmeow.vercel.app/",
  },
  {
    title: "Opticat",
    description: "Turn any repo into an AI-narrated onboarding tour.",
    front: "Next.js 15, TypeScript, Tailwind CSS",
    back: "Supabase, NextAuth, Octokit, Google Gemini",
    image: "opticat",
    github: "https://github.com/Jeremyliu-621/opticat",
    website: "https://opticat-teal.vercel.app",
  },
  {
    title: "BeaverTrail",
    description: "AI travel itinerary planner for exploring Canada.",
    front: "Next.js, TypeScript, Tailwind CSS",
    back: "Vercel AI SDK, Google Gemini",
    image: "beavertrail",
    github: "https://github.com/Jeremyliu-621/beavertrail",
    website: "https://beavertrail.vercel.app",
  },
  {
    title: "Sinatra",
    description:
      "A DAW that turns your voice into any instrument of your choice.",
    front: "React, TypeScript, Vite, Tailwind CSS, Three.js",
    back: "Python, FastAPI, Supabase (PostgreSQL, Auth), Spotify Basic Pitch, Gradium",
    image: "sinatra",
    github: "https://github.com/e-yang6/sinatra",
    website: "https://sinatra-daw.vercel.app/",
    additionalInfo:
      "Built an AI-assisted DAW that turns voices into instrument tracks with BPM-alignment and chord generation." +
      "Implemented a FastAPI pipeline that detects drum BPM (librosa), transcribes vocals to MIDI (Spotify's Basic Pitch), and renders MIDI to WAV (FluidSynth)." +
      "Used Gradium speech-to-text and Gemini API to create \u201cFrank\u201d, an in-app assistant that responds to natural-language prompts to create chord progressions, rearrange music, and give compositional feedback",
  },
  {
    title: "LockBlock",
    description:
      "A smart security system using Arduino and computer vision to block deadbolts when unknown faces are detected.",
    front: "JavaScript, Phantom Wallet",
    back: "Python, Flask, OpenCV, Solana, SQLite, Arduino",
    image: "lockblock",
    github: "https://github.com/Jeremyliu-621/lockblock",
    additionalInfo:
      "Designed a smart security system using Arduino and CV to block two deadbolts when unknown faces are detected. " +
      "Used OpenCV YuNet (face detection) and SFace (embedding similarity) to classify known vs unknown faces locally with no cloud dependency for faster processing. " +
      "Developed a Flask backend with SQLite-based face embedding storage, whitelist management, and REST endpoints coordinating CV inference, authentication, and lock state. " +
      "Integrated a Solana wallet authentication using Ed25519 signature verification to allow doors to unlock remotely.",
  },
  {
    title: "UFC Index website",
    description: "A website that shows scraped stats for UFC Fighters.",
    front: "Next.js, React, Typescript, Tailwind",
    back: "Python, Pandas, BeautifulSoup",
    image: "ufc-search",
    github: "https://github.com/Jeremyliu-621/UFC-Elo-Calculator",
    website: "https://ufc-elo-calculator.vercel.app/",
    additionalInfo:
      "A website that calculates and ranks statistics for UFC Fighters." +
      " Organized Pandas dataframes with information scraped from the UFC website by Beautifulsoup." +
      " Used React, Javascript, and TailwindCSS to build an aesthetic UI that interacts with user's cursors.",
  },
];

export const hobbies =
  "I create origami, train Brazilian Jiu-Jitsu, write (legal) graffiti, and longboard.";

export interface ThanksItem {
  name: string;
  description: string;
  link: string | null;
}

export const thanks: ThanksItem[] = [
  {
    name: "98-components",
    description:
      "For providing the amazing Windows 98 UI components that make this website possible.",
    link: "https://github.com/jdan/98.css",
  },
  {
    name: "Cursor.ai",
    description:
      "For helping me build and iterate on this website with AI assistance.",
    link: "https://www.cursor.com/",
  },
  {
    name: "win98icons",
    description: "For providing real art for my project.",
    link: "https://win98icons.alexmeub.com/",
  },
  {
    name: "lunospace",
    description: "For giving me inspiration for featuresfor this project.",
    link: "https://lostlove.neocities.org/",
  },
  {
    name: "colorhunt.co",
    description: "For giving me cool colour palettes for this project.",
    link: "https://colorhunt.co/",
  },
  {
    name: "buttered_official",
    description: "For giving me the idea for a windows 98 website.",
    link: "https://www.instagram.com/buttered_official/",
  },
  {
    name: "Kibuns",
    description: "For their cookie clicker gif online!.",
    link: "https://github.com/Kibuns/Cookie_Clicker_Bot",
  },
];

export const ASSET_IMAGES = [
  "bear.mp4",
  "cruisesunset.JPG",
  "do you even lift like a boss GIF.mp4",
  "directory_computer.png",
  "portfolio-website-cover.png",
  "rref_calculator.PNG",
  "slot-machine.PNG",
  "ufc_elo.webp",
];

export const socialLinks = [
  {
    href: "https://www.linkedin.com/in/jmyl",
    icon: "linkedin-icon",
    label: "LinkedIn",
  },
  { href: "mailto:jeremyliu621@gmail.com", icon: "email-icon", label: "Email" },
  {
    href: "https://github.com/Jeremyliu-621",
    icon: "github-icon",
    label: "Github",
  },
];
