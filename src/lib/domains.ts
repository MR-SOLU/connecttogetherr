import {
  Plane, Trophy, Music, Code2, Rocket, Gamepad2, BookOpen, Dumbbell, Palette, Clapperboard,
  UtensilsCrossed, GraduationCap, Camera, HandHeart, HeartPulse, Briefcase, Atom, Shirt,
  type LucideIcon,
} from "lucide-react";

export type Tone = 1 | 2 | 3 | 4 | 5 | 6;

export interface Domain {
  slug: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  tone: Tone;
  subtopics: string[];
}

export const DOMAINS: Domain[] = [
  { slug: "travel", name: "Travelling", icon: Plane, tone: 3, tagline: "Plan trips, swap routes, find travel buddies.", subtopics: ["Backpacking", "Weekend trips", "Solo travel", "Road trips", "Treks & hikes", "International", "Budget travel"] },
  { slug: "sports", name: "Sports", icon: Trophy, tone: 1, tagline: "Form teams, find players, talk the game.", subtopics: ["Football", "Cricket", "Basketball", "Badminton", "Volleyball", "Tennis", "Kabaddi", "Esports"] },
  { slug: "music", name: "Music", icon: Music, tone: 2, tagline: "Jam, discover and start a band.", subtopics: ["Jamming", "Discovery", "Singing", "Production", "Instruments", "Concerts"] },
  { slug: "tech", name: "Tech & Coding", icon: Code2, tone: 4, tagline: "Build side projects and learn together.", subtopics: ["Web development", "AI & ML", "Mobile apps", "Open source", "Cybersecurity", "Hackathons"] },
  { slug: "startups", name: "Startups & Business", icon: Rocket, tone: 5, tagline: "Validate ideas and find co-founders.", subtopics: ["Idea validation", "Co-founders", "Marketing", "Freelancing", "Investing", "Side hustles"] },
  { slug: "gaming", name: "Gaming", icon: Gamepad2, tone: 1, tagline: "Squad up and design games.", subtopics: ["Multiplayer", "Game design", "Mobile games", "Console", "Board games", "Streaming"] },
  { slug: "books", name: "Books & Writing", icon: BookOpen, tone: 6, tagline: "Read together, write together.", subtopics: ["Book club", "Writing", "Poetry", "Comics", "Non-fiction"] },
  { slug: "fitness", name: "Fitness", icon: Dumbbell, tone: 3, tagline: "Workout partners and healthy habits.", subtopics: ["Running", "Gym", "Yoga", "Cycling", "Nutrition", "Home workouts"] },
  { slug: "art", name: "Art & Design", icon: Palette, tone: 2, tagline: "Create, critique and collaborate.", subtopics: ["Illustration", "UI & design", "Painting", "Crafts", "Animation"] },
  { slug: "movies", name: "Movies & Shows", icon: Clapperboard, tone: 5, tagline: "Recommendations and filmmaking crews.", subtopics: ["Recommendations", "Filmmaking", "Anime", "Series", "Documentaries"] },
  { slug: "food", name: "Food & Cooking", icon: UtensilsCrossed, tone: 1, tagline: "Recipes, food spots and kitchen stories.", subtopics: ["Home cooking", "Food spots", "Baking", "Healthy eating", "Street food"] },
  { slug: "study", name: "Study & Learning", icon: GraduationCap, tone: 4, tagline: "Study groups and language partners.", subtopics: ["Exam prep", "Languages", "Online courses", "Math & science", "College life"] },
  { slug: "photography", name: "Photography", icon: Camera, tone: 6, tagline: "Photo walks and editing tips.", subtopics: ["Street photography", "Editing", "Nature", "Portraits", "Mobile photography"] },
  { slug: "volunteering", name: "Volunteering & Causes", icon: HandHeart, tone: 3, tagline: "Do good, together.", subtopics: ["Community", "Teaching", "Environment", "Animal welfare", "Fundraising"] },
  { slug: "wellbeing", name: "Mental Wellbeing", icon: HeartPulse, tone: 2, tagline: "Kind conversations and support.", subtopics: ["Support", "Mindfulness", "Motivation", "Stress", "Self-growth"] },
  { slug: "careers", name: "Careers & Jobs", icon: Briefcase, tone: 4, tagline: "Job hunts, mentors and interview prep.", subtopics: ["Job hunting", "Mentorship", "Interviews", "Resume review", "Career switch"] },
  { slug: "science", name: "Science & Space", icon: Atom, tone: 5, tagline: "Big questions and fun experiments.", subtopics: ["Space", "Experiments", "Environment", "Biology", "Physics"] },
  { slug: "fashion", name: "Fashion & Style", icon: Shirt, tone: 6, tagline: "Outfits, thrifting and styling.", subtopics: ["Styling", "Sustainable fashion", "Streetwear", "Accessories", "Skincare"] },
];

export const getDomain = (slug: string | undefined | null) => DOMAINS.find((d) => d.slug === slug);

/** Literal class names so Tailwind keeps them. */
export const TONE_BG: Record<Tone, string> = {
  1: "bg-tone-1", 2: "bg-tone-2", 3: "bg-tone-3", 4: "bg-tone-4", 5: "bg-tone-5", 6: "bg-tone-6",
};
export const TONE_SOFT: Record<Tone, string> = {
  1: "bg-tone-1/15 text-tone-1",
  2: "bg-tone-2/25 text-tone-5",
  3: "bg-tone-3/25 text-tone-4",
  4: "bg-tone-4/15 text-tone-4",
  5: "bg-tone-5/15 text-tone-5",
  6: "bg-tone-6/30 text-tone-5",
};

export const MESSAGE_TOPICS = [
  { value: "thought", label: "A thought", short: "Thought" },
  { value: "idea", label: "An idea", short: "Idea" },
  { value: "plan", label: "A plan", short: "Plan" },
  { value: "experience", label: "My experience", short: "Experience" },
  { value: "question", label: "A question", short: "Question" },
  { value: "mood", label: "My mood", short: "Mood" },
  { value: "team", label: "Team building", short: "Team" },
] as const;
export type MessageTopic = (typeof MESSAGE_TOPICS)[number]["value"];
export const topicLabel = (t: string) => MESSAGE_TOPICS.find((m) => m.value === t)?.short ?? t;
export const TOPIC_STYLE: Record<string, string> = {
  thought: "bg-muted text-muted-foreground",
  idea: "bg-tone-2/30 text-tone-5",
  plan: "bg-tone-3/30 text-tone-4",
  experience: "bg-tone-6/35 text-tone-5",
  question: "bg-tone-1/15 text-tone-1",
  mood: "bg-secondary text-secondary-foreground",
  team: "bg-tone-4/15 text-tone-4",
};

export const MOODS = [
  "Excited", "Curious", "Chill", "Creative", "Energetic", "Focused", "Adventurous",
  "Motivated", "Hopeful", "Relaxed", "Thoughtful", "Low", "Calm", "Playful", "Competitive",
];
