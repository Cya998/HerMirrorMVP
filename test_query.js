import 'dotenv/config';
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Load embedding model
console.log("Loading embedding model… 🔥");
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Helper to embed text
async function getEmbedding(text) {
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

// Function to find closest archetype
async function matchArchetype(clientText) {
  const clientEmbedding = await getEmbedding(clientText);

  // Get all archetypes
  const { data: archetypes, error } = await supabase.from("archetypes").select("*");
  if (error) {
    console.log("Error fetching archetypes:", error);
    return;
  }

  // Simple cosine similarity
  function cosineSim(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  let bestMatch = { name: null, score: -1 };
  for (let arc of archetypes) {
    const sim = cosineSim(clientEmbedding, arc.embedding);
    if (sim > bestMatch.score) bestMatch = { name: arc.name, score: sim };
  }

  console.log(`Closest archetype: ${bestMatch.name} (score: ${bestMatch.score.toFixed(3)})`);
  return bestMatch.name;
}

// Example usage
(async () => {
  const clientText = "I feel lost, unsure where to start, and overwhelmed by everything in my life.";
  const archetype = await matchArchetype(clientText);

  // Personalization suggestions
  const personalization = {
    journalPrompt: `For ${archetype}: Try reflecting on one small win each day.`,
    affirmation: `You are growing and finding clarity every moment.`,
    colorPalette: ["soft blue", "lavender"],  // you can extend by asking the client
    soloDateIdea: "Take a reflective walk in nature for 30 minutes."
  };

  console.log("Personalization suggestions:", personalization);
})();
