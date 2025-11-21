import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { saveMirrorUser } from '../collect_preferences.js';
import { generateDailyMessage } from '../daily_messenger.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/process', async (req, res) => {
  const { feeling, colorPalette, artStyle } = req.body;

  // Static growth, goal, tone for MVP
  const clientPrefs = {
    colorPalette,
    artStyle,
    growth: "self-reflection",
    goal: "clarity and motivation",
    tonePreference: "uplifting"
  };

  try {
    // 1️⃣ Save user + archetype
    const userId = await saveMirrorUser(feeling, clientPrefs);

    // 2️⃣ Generate daily message / mood card
    const dailyMessage = await generateDailyMessage(userId);

    res.json({
      status: "success",
      archetype: dailyMessage.archetype,
      clientPrefs,
      dailyMessage: dailyMessage.message,
      soloDateIdea: dailyMessage.soloDateIdea
    });
  } catch (e) {
    res.json({ status: "error", error: e.message });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
