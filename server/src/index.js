const http = require("http");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connect } = require("./db");
const { initSocket } = require("./socket");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/users",    require("./routes/users"));
app.use("/api/groups",   require("./routes/groups"));
app.use("/api/posts",    require("./routes/posts"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/stats",    require("./routes/stats"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "social-network-api" });
});

// Unknown route — must come after all route mounts
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler — formats Mongoose errors so stack traces never reach the client
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ error: message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ error: `${field} already taken` });
  }
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

connect()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`API server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
