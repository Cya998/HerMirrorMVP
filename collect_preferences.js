import 'dotenv/config';
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function getEmbedding(text) {
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function matchArchetype(clientText) {
  const clientEmbedding = await getEmbedding(clientText);
  const { data: archetypes } = await supabase.from("archetypes").select("*");

  function cosineSim(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; normA += a[i]*a[i]; normB += b[i]*b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  let bestMatch = { name: null, score: -1 };
  for (let arc of archetypes) {
    const sim = cosineSim(clientEmbedding, arc.embedding);
    if (sim > bestMatch.score) bestMatch = { name: arc.name, score: sim };
  }

  return bestMatch.name;
}

export async function saveMirrorUser(clientInput, clientPrefs) {
  const archetype = await matchArchetype(clientInput);
  const embedding = await getEmbedding(clientInput);

  const { data, error } = await supabase
    .from("mirror_users")
    .insert({
      feeling: clientInput,
      mirror_phase: archetype,
      color_palette: clientPrefs.colorPalette,
      art_style: clientPrefs.artStyle,
      growth: clientPrefs.growth,
      goal: clientPrefs.goal,
      tone_preference: clientPrefs.tonePreference,
      user_embedding: embedding
    })
    .select('id')
    .single();

  if (error) throw error;

  return data.id;  // return userId for next step
}
