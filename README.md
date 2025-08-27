# Gmail OTP Reader (Node.js + Express)

A simple web app that connects to your Gmail inbox, extracts OTP codes from the last 2 days, and shows them in a web UI.

## 🚀 Setup
1. Clone or download this project
2. Run:
   ```bash
   npm install
   ```
3. Copy `.env.example` → `.env` and fill in your **Google OAuth Client ID** and **Secret**
4. Start the server:
   ```bash
   npm start
   ```
5. Open http://localhost:3000 in your browser

## 🔑 Google Setup
- Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth Client ID
- Application type: **Web application**
- Authorized redirect URI:
  ```
  http://localhost:3000/oauth2callback
  ```

## 📌 Notes
- Uses `gmail.readonly` scope only
- Auto-refreshes every 5s
- Includes in-memory login audit log
