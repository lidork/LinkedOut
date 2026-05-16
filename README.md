# LinkedOut — Android 2 Final Project

A LinkedIn spoof social network. Professional. Brief. No BS.

Built with Node.js + Express + Socket.IO (server), React Native / Expo SDK 52 (mobile), and MongoDB.

---

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB running locally (`mongod`) or a MongoDB Atlas connection string
- Android Studio (for emulator) or Expo Go on an Android device

---

## Quick Start

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Configure environment variables
```bash
cp server/.env.example server/.env
```
Default values work for a local MongoDB install:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/social_network
JWT_SECRET=change_this_secret_in_production
```

### 3. Start the API server
```bash
npm run api
```
Expected output:
```
MongoDB connected: localhost
API server running on http://localhost:4000
```

### 4. Start the mobile app
In a second terminal:
```bash
npm run android
```

> **Physical device:** replace `10.0.2.2` with your computer's LAN IP in `mobile/src/api/client.js`.

---

## App Rules

- Posts are capped at **280 characters**
- **No URLs** in post content — portfolio links live on your profile, not in posts
- DMs and the `portfolioUrl` profile field are exempt from the URL rule

---

## Features

| Area | What's included |
|------|----------------|
| Auth | Register / Login with JWT, session restored on relaunch |
| Feed | Posts from friends + joined groups, clap reactions, compose/edit/delete |
| Connections | Send / accept / decline friend requests, people search with job title filter |
| Groups | Public (instant join) and private (approval required), admin panel, kick/block |
| Chat | Real-time DMs via Socket.IO |
| Profile | Avatar, job title, portfolio URL, Open to Work badge, dark mode |
| Stats | D3 bar charts — posts per month, members per group |
| Search | Search posts by author/group/date range; search groups by name/privacy/size |

---

## API Overview

All endpoints except `/api/auth/*` require a JWT bearer token:
```
Authorization: Bearer <token>
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Authenticate, returns JWT |
| GET | `/api/users?search=` | Search users |
| GET/PUT/DELETE | `/api/users/:id` | Own profile (self only) |
| GET | `/api/users/:id/friends` | Friend list (self only) |
| DELETE | `/api/users/:id/friends/:friendId` | Remove connection |
| GET | `/api/users/:id/friend-requests` | Pending requests (self only) |
| POST | `/api/users/:id/friend-request` | Send request |
| POST | `/api/users/:id/friend-request/accept` | Accept request |
| DELETE | `/api/users/:id/friend-request` | Decline / cancel request |
| GET | `/api/groups` | List / search groups |
| POST | `/api/groups` | Create group |
| GET/PUT/DELETE | `/api/groups/:id` | Group detail / update / delete |
| POST | `/api/groups/:id/join` | Join (public) or request (private) |
| PUT | `/api/groups/:id/members/:userId/approve` | Approve pending member (admin) |
| DELETE | `/api/groups/:id/members/:userId` | Remove / kick member |
| POST | `/api/groups/:id/members/:userId/block` | Block user (admin) |
| DELETE | `/api/groups/:id/members/:userId/block` | Unblock user (admin) |
| GET | `/api/posts/feed` | Personal feed |
| GET | `/api/posts` | Search posts |
| POST | `/api/posts` | Create post |
| PUT/DELETE | `/api/posts/:id` | Edit / delete own post |
| POST | `/api/posts/:id/clap` | Toggle clap |
| GET | `/api/messages/conversations` | Conversation list |
| GET | `/api/messages?with=:userId` | Message history |
| GET | `/api/stats/posts-per-month` | Chart data |
| GET | `/api/stats/members-per-group` | Chart data |

---

## Project Structure

```
Social_Network/
├── .gitignore
├── package.json              ← monorepo scripts (install:all, api, android)
├── README.md
│
├── server/
│   ├── .env                  ← local config (not committed)
│   ├── .env.example
│   └── src/
│       ├── index.js          ← Express entry, mounts all routers
│       ├── socket.js         ← Socket.IO real-time chat
│       ├── db.js
│       ├── middleware/
│       │   ├── auth.js       ← JWT auth, adminOnly, requireSelf
│       │   └── asyncHandler.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Post.js
│       │   ├── Group.js
│       │   └── Message.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── usersController.js
│       │   ├── groupsController.js
│       │   ├── postsController.js
│       │   └── statsController.js
│       └── routes/
│           ├── auth.js
│           ├── users.js
│           ├── groups.js
│           ├── posts.js
│           ├── messages.js
│           └── stats.js
│
└── mobile/
    ├── App.js                ← Stack navigator, ThemeProvider
    ├── app.json
    └── src/
        ├── api/client.js     ← apiFetch — JWT injection
        ├── context/          ← AuthContext, ThemeContext
        ├── hooks/            ← useToast, useClap, useSearch
        ├── utils/            ← openUrl
        ├── constants/        ← layout (SPACING)
        ├── components/       ← Avatar, Toast, PostCard, ScreenHeader, …
        └── screens/          ← 15 screens
```

---

## Security Notes

- Passwords hashed with **bcrypt** (cost factor 10)
- JWTs expire after **7 days**
- `requireSelf` middleware enforces that users can only access their own data
- Users can only edit/delete their own posts
- Never commit `.env` — it is listed in `.gitignore`
