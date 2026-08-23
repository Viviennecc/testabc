import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/hkia-flights", async (req, res) => {
  try {
    const { arrival } = req.query;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Resource URL from Spec [cite: 7, 8]
    const targetUrl = `https://www.hongkongairport.com/flightinfo-rest/rest/flights/past?date=${dateStr}&arrival=${arrival}&cargo=false&lang=en`;

    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data from HKIA" });
  }
});

app.listen(5000, () => console.log("API running on port 5000"));
