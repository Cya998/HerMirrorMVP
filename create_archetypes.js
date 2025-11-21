import 'dotenv/config';
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Load embedding model
console.log("Loading free embedding model… this may take a minute 🔥");
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// Full list of archetypes
const archetypes = [
  {
    name: "Fog Phase",
    description: "Feeling overwhelmed, mentally foggy, unsure where to start, struggling with clarity."
  },
  {
    name: "Ember Phase",
    description: "Soft healing, small sparks of hope returning, cautiously optimistic."
  },
  {
    name: "The Reflective Soul",
    description: "Deep thinker, emotionally aware, constantly analyzing life events."
  },
  {
    name: "The Rebuilder",
    description: "Healing, rebuilding identity, finding direction and purpose."
  },
  {
    name: "The Explorer",
    description: "Curious, seeking new experiences, experimenting with self-growth and discovery."
  },
  {
    name: "The Connector",
    description: "Focused on relationships, empathy, building meaningful connections."
  },
  {
    name: "The Flourisher",
    description: "Self-aware, confident, embracing life fully, balanced and thriving."
  }
];

// Convert text to embedding vector
async function getEmbedding(text) {
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data); // store as JSON array
}

// Upload to Supabase
async function uploadArchetypes() {
  for (let arc of archetypes) {
    console.log("Embedding:", arc.name);

    const embedding = await getEmbedding(
      `${arc.name}: ${arc.description}`
    );

    const { error } = await supabase
      .from("archetypes")
      .insert({
        name: arc.name,
        description: arc.description,
        embedding: embedding // JSONB column accepts array
      });

    if (error) console.log("Error uploading", error);
    else console.log(`Uploaded → ${arc.name}`);
  }
}

uploadArchetypes();
