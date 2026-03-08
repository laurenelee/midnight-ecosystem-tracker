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