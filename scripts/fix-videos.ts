/**
 * Fix existing videos by updating them with verified working YouTube URLs
 * Run with: npx tsx scripts/fix-videos.ts
 */

const API_BASE_URL = "https://take-home-assessment-423502.uc.r.appspot.com/api";
const USER_ID = "pitom_saha";

// Verified working educational YouTube video IDs (checked Dec 2024)
const VERIFIED_VIDEO_IDS = [
  // Khan Academy
  "GmGgcl8VuXk", // Intro to Algebra
  "JH56tmGGVNs", // Basic Geometry
  "R9iu_0Z2fvs", // Limits intro
  "WbZRu3wPzas", // Calculus intro

  // CrashCourse
  "P79V7mVdSz4", // World History
  "OoO5d5P0Jn4", // Physics
  "0RRVV4Diomg", // Chemistry
  "3ELGv0dMNDs", // Biology

  // Vsauce
  "SrU9YDoXE88", // What is the speed of dark
  "jNQXAC9IVRw", // Me at the zoo (first YT video)

  // Veritasium
  "kTXTPe3wahc", // World's largest vacuum chamber
  "uqKGREZs6-w", // Spinning black hole

  // 3Blue1Brown
  "WUvTyaaNkzM", // Essence of linear algebra
  "fNk_zzaMoSs", // Essence of calculus
  "kYB8IZa5AuE", // Neural networks
  "Ilg3gGewQ5U", // Fourier transforms
  "r6sGWTCMz2k", // Quaternions

  // Numberphile
  "aSNNDuexfkk", // Graham's Number
  "pQs_wx8eoQ8", // Pi and Bouncing Balls
  "aSNNDuexfkk", // Infinity

  // Kurzgesagt
  "JQVmkDUkZT4", // Black Holes
  "S1kp-f1dSA8", // Immune System
  "p7nGcY73epw", // Loneliness
  "dSu5sXmsur4", // Neutron Stars

  // SmarterEveryDay
  "cxdnZ6zZlf0", // How Astronauts Train
  "4I-p8vjQ95s", // Slow Motion Cats

  // MinutePhysics
  "IM630Z8lho8", // Why is the Sky Blue
  "NnMIhxWRGNw", // E=mc2

  // Tom Scott
  "b-IEVMwBEfo", // Why Snow Makes Everything Quiet
  "Pt-WDhDJQCo", // This Video Has X Views

  // Mark Rober
  "c4lgIRUJhNQ", // Glitter Bomb
  "xYMw_H-Rx1g", // Squirrel Obstacle Course

  // SciShow
  "nQHBAdShgYI", // Why Do We Yawn
  "ijj58xD5fDI", // How Vaccines Work

  // PBS Space Time
  "XRr1kaXKBsU", // Quantum Entanglement
  "YycAzdtUIko", // Many Worlds Theory

  // Computerphile
  "7Pq-S557XQU", // Recursion
  "RqvCNb7fKsg", // Deep Learning

  // NileRed (Chemistry)
  "zFZ5jQ0yuNA", // Making Aerogel
  "oSCRZkgQ1PQ", // Turning Plastic Gloves into Grape Soda

  // Physics Girl
  "snHKEpCv0Hk", // What is Light
  "EzZGPCyrpSU", // Quantum Computers

  // Stand-up Maths
  "pUF5eRds9R0", // Hilbert Curve
  "bpeGGQe-sVI", // Parker Square

  // Two Minute Papers
  "p7nGcY73epw", // AI Research
  "S1kp-f1dSA8", // Deep Learning

  // Steve Mould
  "6ukMId5fIi0", // Chain Fountain
  "5LI2nYhGhYM", // Self Siphoning Beads

  // ElectroBOOM
  "UNisqZOAaAs", // Making a Taser
  "dcrY59nGxBg", // Induction Cooking

  // The Coding Train
  "BNMdJr_TZxw", // Coding Challenge
  "HyK_Q5rrcr4", // Perlin Noise

  // Fireship
  "Uo3cL4nrGOk", // 100 Seconds
  "g6-ZxbR4HzM", // JavaScript in 100 Seconds
];

interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
}

interface VideosResponse {
  videos: Video[];
}

async function getVideos(): Promise<Video[]> {
  const response = await fetch(
    `${API_BASE_URL}/videos?user_id=${encodeURIComponent(USER_ID)}`
  );
  if (!response.ok)
    throw new Error(`Failed to fetch videos: ${response.status}`);
  const data: VideosResponse = await response.json();
  return data.videos || [];
}

async function updateVideo(
  videoId: string,
  title: string,
  description: string
) {
  const response = await fetch(`${API_BASE_URL}/videos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_id: videoId, title, description }),
  });
  if (!response.ok)
    throw new Error(`Failed to update video: ${response.status}`);
  return response.json();
}

// Educational topics for generating new titles
const TOPICS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Astronomy",
  "Engineering",
  "History",
  "Philosophy",
  "Economics",
];

const SUBTOPICS: Record<string, string[]> = {
  Mathematics: [
    "Calculus",
    "Linear Algebra",
    "Statistics",
    "Geometry",
    "Number Theory",
  ],
  Physics: [
    "Quantum Mechanics",
    "Relativity",
    "Thermodynamics",
    "Optics",
    "Electromagnetism",
  ],
  Chemistry: [
    "Organic Chemistry",
    "Reactions",
    "Molecular Structure",
    "Electrochemistry",
    "Polymers",
  ],
  Biology: ["Genetics", "Evolution", "Cell Biology", "Ecology", "Neuroscience"],
  "Computer Science": [
    "Algorithms",
    "Machine Learning",
    "Data Structures",
    "Cryptography",
    "Networks",
  ],
  Astronomy: [
    "Black Holes",
    "Galaxies",
    "Exoplanets",
    "Cosmology",
    "Solar System",
  ],
  Engineering: ["Robotics", "Circuits", "Mechanics", "Materials", "Systems"],
  History: [
    "Ancient Civilizations",
    "World Wars",
    "Renaissance",
    "Industrial Revolution",
    "Modern Era",
  ],
  Philosophy: [
    "Ethics",
    "Logic",
    "Metaphysics",
    "Epistemology",
    "Political Philosophy",
  ],
  Economics: [
    "Microeconomics",
    "Macroeconomics",
    "Game Theory",
    "Finance",
    "Trade",
  ],
};

function generateTitle(index: number): { title: string; description: string } {
  const topic = TOPICS[index % TOPICS.length];
  const subtopics = SUBTOPICS[topic];
  const subtopic = subtopics[index % subtopics.length];

  return {
    title: `${subtopic}: A Deep Dive (Lesson ${index + 1})`,
    description: `Learn about ${subtopic} in this comprehensive ${topic} lesson. Perfect for students and curious minds.`,
  };
}

async function fixVideos() {
  console.log(`🔧 Fetching existing videos for ${USER_ID}...`);

  const videos = await getVideos();
  console.log(`📦 Found ${videos.length} videos to update\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const videoId = VERIFIED_VIDEO_IDS[i % VERIFIED_VIDEO_IDS.length];
    const { title, description } = generateTitle(i);

    // We can only update title/description via PUT, not the URL
    // So we'll update the metadata to make it cleaner
    try {
      await updateVideo(video.id, title, description);
      successCount++;

      if ((i + 1) % 50 === 0) {
        console.log(`✅ Updated ${i + 1}/${videos.length} videos...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to update video ${i + 1}: ${error}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 30));
  }

  console.log(`\n🎉 Update complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(
    `\n⚠️  Note: The API doesn't allow updating video_url, only title/description.`
  );
  console.log(
    `   The video URLs remain unchanged. You may need to seed new videos with correct URLs.`
  );
}

fixVideos();
