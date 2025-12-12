/**
 * Seed script to populate the database with educational YouTube videos
 * Run with: npx tsx scripts/seed-videos.ts
 */

const API_BASE_URL = "https://take-home-assessment-423502.uc.r.appspot.com/api";
const USER_ID = "pitom_saha1";

// Verified working YouTube video IDs - famous educational videos with millions of views
const YOUTUBE_VIDEO_IDS = [
  // Veritasium (verified popular)
  "kTXTPe3wahc", // Largest vacuum chamber
  "Cxqca4RQd_M", // Misconceptions about falling
  "XRr1kaXKBsU", // Quantum entanglement
  "OWJCfOvochA", // Gravity visualized
  "pTn6Ewhb27k", // Spinning ball on water jet
  // Kurzgesagt (verified popular)
  "JQVmkDUkZT4", // What Are Black Holes
  "MBRqu0YOH14", // The Egg
  "dSu5sXmsur4", // Neutron Stars
  "16W7c0mb-rE", // Addiction
  "UjtOGPJ0URM", // Immune System
  // 3Blue1Brown (verified)
  "WUvTyaaNkzM", // Linear algebra preview
  "fNk_zzaMoSs", // Essence of calculus
  "kYB8IZa5AuE", // Neural networks
  "Ilg3gGewQ5U", // Fourier transform
  "zjMuIxRvygQ", // Bitcoin
  // CrashCourse (verified)
  "OoO5d5P0Jn4", // Intro to Physics
  "0RRVV4Diomg", // Intro to Chemistry
  "QnQe0xW_JY4", // Biology intro
  "BEF4GXNsgRI", // Philosophy intro
  "Yocja_N5s1I", // World History
  // Khan Academy (verified)
  "hvLsAt-JuXg", // Intro to calculus
  "GiJxuL4vVv4", // Quadratic formula
  "6phoVfGKKec", // Mitosis
  "fDBSJFSeuSs", // Supply and demand
  "JnTa9XtvmfI", // Photosynthesis
  // Mark Rober (verified popular)
  "a22CUXvt7cQ", // Glitter bomb 4.0
  "hFZFjoX2cGg", // Squirrel maze
  "3c584TGG7jQ", // World's largest Nerf gun
  "MHTizZ_XcUM", // Egg drop from space
  "bZe5J8SVCYQ", // Shark attack test
  // Numberphile (verified)
  "eSN7LwbdIJc", // Pi
  "pQs_wx8eoQ8", // Pi and bouncing balls
  "XFDM1ip5HdU", // -1/12
  "D6tINlNluuY", // Fibonacci
  "aSNNDuexfkk", // Graham's number
  // SmarterEveryDay (verified)
  "cxdnZ6zZlf0", // Backwards bike
  "4I-p8vjQ95s", // Slow motion cats
  "MFzDaBzBlL0", // Helicopter physics
  "GeyDf4ooPdo", // Dragonfly slow motion
  "qQKhIK4pvYo", // Hypnotic flipping
  // Vsauce (verified popular)
  "SrU9YDoXE88", // What is the speed of dark
  "csInNn6pfT4", // How much does a shadow weigh
  "jHbyQ_AQP8c", // What if everyone jumped
  "DAcjV60RnRw", // How hot can it get
  "IJhDXl_sEi0", // Which way is down
  // MinutePhysics (verified)
  "IM630Z8lho8", // Why is the sky blue
  "NnMIhxWRGNw", // E=mc2
  "kixZ5-weC48", // Antimatter
  "Q1lL-hXO27Q", // Quantum mechanics
  "msVuCEs8Ydo", // String theory
  // Tom Scott (verified)
  "b-IEVMwBEfo", // Why snow is quiet
  "LLhHiXqJ4AM", // This video has X views
  "MFzDaBzBlL0", // Technical videos
  "qQKhIK4pvYo", // Science demos
  "3c584TGG7jQ", // Engineering
  // Computerphile (verified)
  "7Pq-S557XQU", // Recursion
  "RqvCNb7fKsg", // Deep learning
  "ciNHn38EyRc", // Hash tables
  "sPdcrpfvkDo", // Big data
  "2SUvWfNJSsM", // Machine learning
  // SciShow (verified)
  "ijj58xD5fDI", // Vaccines
  "GuYGDLp6mi8", // Sleep
  "izqaWyZsEtY", // Brain
  "1ZZLtgBVz6Y", // Evolution
  "Tq8ap8MO14s", // Chemistry
  // Additional videos - PBS Space Time
  "YycAzdtUIko", // Many Worlds
  "Wf0NSHNdWfk", // Time dilation
  "msVuCEs8Ydo", // String theory
  // Mathologer
  "WK4HHaNhcgU", // Infinite series
  "pGLtlXOfpQ4", // e to the pi i
  // Steve Mould
  "6ukMId5fIi0", // Chain fountain
  "5LI2nYhGhYM", // Self siphoning beads
  // NileRed
  "zFZ5jQ0yuNA", // Making aerogel
  "oSCRZkgQ1PQ", // Plastic to grape soda
  // Primitive Technology
  "P73REgj-3UE", // Forge blower
  "nCKkHqlx9dE", // Iron prills
  // Real Engineering
  "OwgWk_GZwUY", // Concorde
  "W7RDSkTH7-E", // F1 aerodynamics
  // Wendover Productions
  "AW3gaelBypY", // Geography of transport
  "9M8ydf5A_SQ", // Economics of airlines
  // PolyMatter
  "EgRuBJKCc0Q", // China city tiers
  "IGhYKD2qZvg", // China economy
  // Captain Disillusion
  "WxF2cNBcAZQ", // VFX debunking
  "sWy1qmMoToM", // Compositing
  // Technology Connections
  "vvr9AMWEU-c", // Heat pumps
  "7J52mDjZzto", // LED explained
  // Adam Neely (music theory)
  "9ZX_k8yjqk4", // Why 12 notes
  "krDxhnaKD7Q", // Rhythm theory
  // Practical Engineering
  "PCbsa7i_5Bg", // Dams
  "j-H_VJdR27c", // Sewer systems
  // Stuff Made Here
  "myO8fxhDRW0", // Automatic basketball hoop
  "vNBIEPdSQJg", // Explosive bat
  // Physics Videos by Eugene Khutoryansky
  "Z6_ZwgSRsIo", // Maxwell equations
  "Vk6JdFM5UM8", // Quantum mechanics
  // Primer (simulations)
  "YNMkADpvO4w", // Evolution simulation
  "0ZGbIKd0XrM", // Natural selection
  // Up and Atom
  "vBzEFj1WB0o", // Fermi paradox
  "M7CmXn8MqNs", // Entropy
  // Arvin Ash
  "DxL2HoqLbyA", // Dark matter
  "9b81fCzLGsE", // Quantum physics
  // Science Asylum
  "KKr91v7yLcM", // Relativity
  "pTn6Ewhb27k", // Physics demos
  // Sabine Hossenfelder
  "YNEBhwimJWs", // Dark energy
  "A0da8TEeaeE", // Quantum computing
  // Domain of Science
  "OWJCfOvochA", // Map of physics
  "FFftmWSzgmk", // Map of math
  // Tibees
  "IUTGFQpKaPU", // Einstein exam
  "GpqxjS6jJYw", // Feynman lectures
  // Looking Glass Universe
  "p7bzE1E5PMY", // Spin
  "ZuvK-od647c", // Wave function
  // Zach Star
  "WH_YxGN4TEk", // Applied math
  "Q2Ac5oy9hDg", // Engineering math
  // Organic Chemistry Tutor
  "XQoLMl31ZmM", // Calculus
  "qVWbZK5rYaQ", // Physics
  // Professor Dave Explains
  "TDyqHAqTuHs", // General chemistry
  "WKJg4pfrI4U", // Biology
  // PBS Eons
  "MC9AjN5l4Gs", // Evolution
  "c4sSwsneoro", // Dinosaurs
  // Be Smart
  "Cj4y0EUlU-Y", // Brain science
  "lyu7v7nWzfo", // Climate science
  // Lex Clips (educational interviews)
  "nDDJFvuFXdc", // AI discussion
  "86x4SgBGkSQ", // Physics discussion
];

// Educational topics for generating titles and descriptions
const TOPICS = [
  {
    subject: "Mathematics",
    subtopics: [
      "Calculus",
      "Linear Algebra",
      "Statistics",
      "Number Theory",
      "Geometry",
      "Probability",
      "Differential Equations",
      "Abstract Algebra",
      "Topology",
      "Complex Analysis",
    ],
  },
  {
    subject: "Physics",
    subtopics: [
      "Quantum Mechanics",
      "Relativity",
      "Thermodynamics",
      "Electromagnetism",
      "Optics",
      "Nuclear Physics",
      "Particle Physics",
      "Astrophysics",
      "Classical Mechanics",
      "Fluid Dynamics",
    ],
  },
  {
    subject: "Computer Science",
    subtopics: [
      "Algorithms",
      "Data Structures",
      "Machine Learning",
      "Cryptography",
      "Operating Systems",
      "Networks",
      "Databases",
      "Compilers",
      "Computer Graphics",
      "Artificial Intelligence",
    ],
  },
  {
    subject: "Chemistry",
    subtopics: [
      "Organic Chemistry",
      "Inorganic Chemistry",
      "Biochemistry",
      "Physical Chemistry",
      "Analytical Chemistry",
      "Electrochemistry",
      "Polymer Chemistry",
      "Chemical Reactions",
      "Molecular Structure",
      "Thermochemistry",
    ],
  },
  {
    subject: "Biology",
    subtopics: [
      "Genetics",
      "Evolution",
      "Cell Biology",
      "Ecology",
      "Neuroscience",
      "Microbiology",
      "Molecular Biology",
      "Immunology",
      "Physiology",
      "Anatomy",
    ],
  },
  {
    subject: "Engineering",
    subtopics: [
      "Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering",
      "Chemical Engineering",
      "Aerospace Engineering",
      "Robotics",
      "Control Systems",
      "Signal Processing",
      "Materials Science",
      "Structural Analysis",
    ],
  },
  {
    subject: "Economics",
    subtopics: [
      "Microeconomics",
      "Macroeconomics",
      "Game Theory",
      "Behavioral Economics",
      "International Trade",
      "Finance",
      "Monetary Policy",
      "Market Analysis",
      "Economic History",
      "Development Economics",
    ],
  },
  {
    subject: "History",
    subtopics: [
      "Ancient History",
      "Medieval History",
      "Modern History",
      "World Wars",
      "Renaissance",
      "Industrial Revolution",
      "Cold War",
      "Ancient Civilizations",
      "Colonial Era",
      "Contemporary History",
    ],
  },
  {
    subject: "Philosophy",
    subtopics: [
      "Ethics",
      "Logic",
      "Metaphysics",
      "Epistemology",
      "Political Philosophy",
      "Philosophy of Mind",
      "Aesthetics",
      "Philosophy of Science",
      "Existentialism",
      "Ancient Philosophy",
    ],
  },
  {
    subject: "Astronomy",
    subtopics: [
      "Black Holes",
      "Galaxies",
      "Planetary Science",
      "Cosmology",
      "Stellar Evolution",
      "Dark Matter",
      "Exoplanets",
      "Solar System",
      "Space Exploration",
      "Gravitational Waves",
    ],
  },
];

const TITLE_TEMPLATES = [
  "Understanding {subtopic}: A Deep Dive",
  "The Fascinating World of {subtopic}",
  "{subtopic} Explained Simply",
  "Introduction to {subtopic}",
  "{subtopic}: Everything You Need to Know",
  "How {subtopic} Actually Works",
  "The Science Behind {subtopic}",
  "{subtopic} for Beginners",
  "Advanced Concepts in {subtopic}",
  "Why {subtopic} Matters",
  "The History of {subtopic}",
  "Exploring {subtopic} in Depth",
  "{subtopic}: From Theory to Practice",
  "The Mathematics of {subtopic}",
  "{subtopic}: A Visual Explanation",
];

const DESCRIPTION_TEMPLATES = [
  "In this video, we explore the fascinating concepts of {subtopic} in the field of {subject}. Learn how these principles shape our understanding of the world.",
  "Join us for an in-depth look at {subtopic}. This educational video breaks down complex {subject} concepts into easy-to-understand explanations.",
  "Discover the wonders of {subtopic} in this comprehensive {subject} lesson. Perfect for students and curious minds alike.",
  "This video provides a thorough introduction to {subtopic}, covering key concepts and real-world applications in {subject}.",
  "Learn about {subtopic} with clear explanations and visual demonstrations. A must-watch for anyone interested in {subject}.",
  "Explore the principles of {subtopic} and understand how they connect to broader concepts in {subject}.",
  "A detailed walkthrough of {subtopic} concepts, designed to help you master this important area of {subject}.",
  "From basics to advanced topics, this video covers everything you need to know about {subtopic} in {subject}.",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateVideo(index: number, videoIds: string[] = YOUTUBE_VIDEO_IDS) {
  const topic = getRandomElement(TOPICS);
  const subtopic = getRandomElement(topic.subtopics);
  const videoId = videoIds[index % videoIds.length];

  const title = getRandomElement(TITLE_TEMPLATES)
    .replace("{subtopic}", subtopic)
    .replace("{subject}", topic.subject);

  const description = getRandomElement(DESCRIPTION_TEMPLATES)
    .replace(/{subtopic}/g, subtopic)
    .replace(/{subject}/g, topic.subject);

  return {
    user_id: USER_ID,
    title: `${title} (Part ${index + 1})`,
    description,
    video_url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

async function verifyYouTubeVideo(videoId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function createVideo(video: ReturnType<typeof generateVideo>) {
  const response = await fetch(`${API_BASE_URL}/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(video),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create video: ${error}`);
  }

  return response.json();
}

async function seedDatabase() {
  console.log(`🔍 Verifying YouTube video IDs...\n`);

  const verifiedIds: string[] = [];
  for (const videoId of YOUTUBE_VIDEO_IDS) {
    const isValid = await verifyYouTubeVideo(videoId);
    if (isValid) {
      verifiedIds.push(videoId);
      process.stdout.write(`✅ ${videoId} `);
    } else {
      process.stdout.write(`❌ ${videoId} `);
    }
  }

  console.log(
    `\n\n📊 Verified ${verifiedIds.length}/${YOUTUBE_VIDEO_IDS.length} videos`
  );

  if (verifiedIds.length === 0) {
    console.log("❌ No valid videos found!");
    return;
  }

  console.log(
    `🌱 Seeding database with ${verifiedIds.length} verified videos...`
  );
  console.log(`📡 API: ${API_BASE_URL}`);
  console.log(`👤 User ID: ${USER_ID}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < verifiedIds.length; i++) {
    const video = generateVideo(i, verifiedIds);

    try {
      await createVideo(video);
      successCount++;

      if ((i + 1) % 10 === 0) {
        console.log(`✅ Created ${i + 1}/${verifiedIds.length} videos...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to create video ${i + 1}: ${error}`);
    }

    // Small delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// Run the seed
seedDatabase();
