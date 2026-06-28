require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { migrate } = require("./db");
const releasesRouter = require("./routes/releases");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/releases", releasesRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
