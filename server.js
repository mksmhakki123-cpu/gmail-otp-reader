// server.js
import express from "express";
import session from "express-session";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Session setup
app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true,
  })
);

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/oauth2callback"
);

// Routes
app.get("/", (req, res) => {
  if (!req.session.tokens) {
    res.send('<a href="/login">Login with Google</a>');
  } else {
    res.send('<a href="/inbox">📩 View Inbox</a>');
  }
});

app.get("/login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
  });
  res.redirect(url);
});

app.get("/oauth2callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("❌ No code returned.");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    oauth2Client.setCredentials(tokens);
    res.send("✅ Login successful! <a href='/inbox'>Go to Inbox</a>");
  } catch (err) {
    console.error("❌ Error getting tokens:", err);
    res.send("❌ Authentication failed.");
  }
});

app.get("/inbox", async (req, res) => {
  if (!req.session.tokens) {
    return res.send("❌ Not logged in. <a href='/login'>Login</a>");
  }

  oauth2Client.setCredentials(req.session.tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return res.send("📭 Inbox is empty.");
    }

    let inboxHtml = "<h2>📩 Your Inbox</h2><ul>";

    for (let msg of response.data.messages) {
      try {
        const message = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        if (!message.data.payload || !message.data.payload.headers) {
          console.log("⚠️ Skipping message (no headers)", msg.id);
          continue;
        }

        const headers = message.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
        const from =
          headers.find((h) => h.name === "From")?.value || "(Unknown Sender)";
        const snippet = message.data.snippet || "";

        inboxHtml += `<li><b>From:</b> ${from} <br> <b>Subject:</b> ${subject} <br> <i>${snippet}</i></li><hr>`;
      } catch (msgErr) {
        console.error("❌ Error fetching message:", msgErr.response?.data || msgErr.message);
      }
    }

    inboxHtml += "</ul>";
    res.send(inboxHtml);
  } catch (err) {
    console.error("❌ Inbox Error:", err.response?.data || err.message);
    res.send("❌ Error fetching inbox. Check console logs.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
