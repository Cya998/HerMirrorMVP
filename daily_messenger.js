import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function generateDailyMessage(userId) {
  const { data: user } = await supabase
    .from("mirror_users")
    .select("*")
    .eq("id", userId)
    .single();

  const archetype = user.mirror_phase;
  const message = `
Good morning! 🌸
Today, as a ${archetype}, focus on ${user.growth}.
Enjoy colors: ${user.color_palette.join(", ")} and art style: ${user.art_style.join(", ")}.
Keep your goal in mind: ${user.goal}.
You are growing every day. 💛
`;

  const soloDateIdea = user.solo_date_ideas
    ? user.solo_date_ideas[Math.floor(Math.random() * user.solo_date_ideas.length)]
    : "Take a reflective walk today.";

  return { message, archetype, soloDateIdea };
}
