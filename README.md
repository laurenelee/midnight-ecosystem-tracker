# Midnight Ecosystem Tracker

A lightweight React dashboard for tracking developer activity across the Midnight Network ecosystem on GitHub.

Built by the [Midnight Foundation](https://midnight.network) DevRel team to monitor ecosystem growth and feed the [Electric Capital Developer Report](https://www.developerreport.com) submission pipeline.

## What it does

Runs three parallel GitHub topic searches and surfaces repos in two views:

- **New This Week** - repos created in the last 7 days (EC submission pipeline)
- **Active This Week** - repos with commits or updates in the last 7 days (ecosystem health signal)

### Search tracks

| Topic | Query | Purpose |
|---|---|---|
| `midnightntwrk` | `topic:midnightntwrk` | Primary attribution tag |
| `compact` | `topic:compact midnight` | Compact language builders |
| `midnight` | `topic:midnight zk` | Broader ZK/Midnight builders |

## Getting started

### Prerequisites

- Node.js v18+
- npm v9+

### Install and run
```bash
git clone https://github.com/laurenelee/midnight-ecosystem-tracker.git
cd midnight-ecosystem-tracker
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Rate limits

The GitHub Search API allows **60 requests per hour** unauthenticated. This app makes 3 requests per refresh (one per search track), so you can refresh up to 20 times per hour without a token.

To increase this to 5,000 requests per hour, paste your GitHub personal access token into the token field in the app UI. The token is held in memory only and never stored.


## Add your project

If you're building on Midnight Network, add the `midnightntwrk` GitHub topic to your repository so it shows up in this tracker and gets included in future ecosystem reports.

➜ [How to add a GitHub topic](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)


## Learn more

- [Midnight Network](https://midnight.network)
- [Developer docs](https://docs.midnight.network)
- [Ecosystem report](https://docs.midnight.network/blog/get-your-project-on-the-map)
