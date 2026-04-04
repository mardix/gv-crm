# GV-CRM `v1.0.0`

A lightweight CRM built directly into [Google Voice](https://voice.google.com) to manage contacts, build lists, and run automated text messaging campaigns — without ever leaving the tab.

---

## ✨ Features

- **📇 Contacts** — Add and manage contacts with name, phone, email, tags, status, and notes. Bulk-edit, filter, sort, and jump straight into a conversation with one click.
- **📋 Lists** — Organize contacts into named lists. Assign each contact a per-list status (e.g. Confirmed, Declined).
- **📣 Campaigns** — Send personalized bulk text messages to any list. Supports `{{name}}` placeholders, image attachments, real-time delivery HUD, pause/resume, retry failed, and CSV export.
- **🤖 Context Widget** — Auto-detects the contact you're viewing in Google Voice and surfaces their CRM info (status, tags, notes) inline.
- **📝 Preset Replies** — Save frequently used message snippets and insert them into any conversation in one click.
- **✏️ Draft Stash** — If you leave a conversation with an unsent message, it's silently saved. Come back and pick up right where you left off.
- **� Do Not Contact (DND)** — Flag contacts as off-limits. DND contacts are automatically excluded from all campaigns.
- **⏸ Auto-Pause Campaigns** — If Google Voice signals a rate limit, the campaign pauses itself automatically and alerts you.
- **💾 Import / Export** — Import contacts from CSV or JSON. Export contacts, or back up your entire workspace as a single JSON snapshot.
- **🔒 100% Local** — All data lives in `chrome.storage.local`. Nothing leaves your device unless you set up a Webhook.

---

## 🚀 Installation

### Option A — Use the pre-built extension (easiest)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the **`dist/`** folder from this repo
5. Go to [voice.google.com](https://voice.google.com) — the **GV-CRM** button appears on the right edge of the screen

### Option B — Build from source

```bash
# 1. Install dependencies
npm install

# 2. Build the extension
npm run build

# 3. Load the dist/ folder into Chrome (same steps as Option A)
```

> Requires **Node.js ≥ 18** and **Google Chrome**.

---

## 📖 Quick Start

1. Click the **GV-CRM** tab on the right side of Google Voice.
2. Go to **Contacts** → click **+ Add Contact** to add your first contact.
3. Go to **Lists** → create a list and assign contacts to it.
4. Go to **Campaigns** → create a campaign, pick your list, write your message, and hit **▶ Launch**.
5. Keep the Google Voice tab open and visible while the campaign runs.

---

## 📣 Campaigns — Tips

| Token | Replaced with |
|---|---|
| `{{name}}` | Contact's first name |
| `{{email}}` | Contact's email |
| `{{phone}}` | Contact's phone number |
| `{{handle}}` | Contact's social handle |

- **Pause / Resume** any time during a campaign.
- **Retry Failed** re-queues only the contacts that didn't go through.
- **Duplicate** a campaign to reuse its message and lists for a new batch.
- Campaign delays are randomized between the min/max values set in Settings to mimic natural pacing.

---

## ⚙️ Settings

| Setting | What it does |
|---|---|
| Contact Statuses | Configure the status labels for contacts (e.g. Lead, VIP) |
| List Statuses | Configure per-list step labels (e.g. Confirmed, Declined) |
| Campaign Pacing | Min/max delay in seconds between messages |
| Preset Texts | Manage quick-insert message snippets |
| Hide GV Sidebar | Collapses Google Voice's right panel for more space |
| Webhook | POST your workspace to an external URL (optional) |

---

## 🔒 Privacy

All data is stored in `chrome.storage.local` and never leaves your device by default. No analytics, no tracking, no cloud.

---

## � License

MIT — use and modify freely.
