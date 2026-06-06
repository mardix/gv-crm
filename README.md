# GV-CRM `v2.0.0`

A lightweight Chrome extension that builds a powerful **CRM** directly into *Google Voice* to manage contacts, build lists, and run automated text messaging campaigns — without ever leaving the tab.

---

## ✨ Features

### 📇 CRM Contact & List Management
- **Rich Contact Profiles** — Add/edit contacts with name, phone, email, tags, status, category, lead source, membership level, and notes.
- **Custom Categorization** — Organize your contacts dynamically using custom contact statuses, categories, lead sources, and membership levels.
- **Target Outreach Lists** — Organize contacts into named lists and track list-specific statuses (e.g., *Prospect*, *Confirmed*, *Declined*).
- **Filter & Search** — Filter by status, membership, source, category, list status, or tag. Sort contacts, freeze columns, and jump straight into a conversation in one click.
- **Bulk Actions** — Set status, add to list, remove from list, or bulk delete selected contacts.

### 🔒 Privacy & Security (Passcode Screen Lock)
- **Lock Screen Protection** — Configure a passcode lock during onboarding or in Settings to keep your CRM workspace secure.
- **Instant Locking** — Lock the CRM panel instantly via the lock button (`🔒`) in the navigation bar.
- **Secure Overlay** — An animated overlay prevents any workspace access or viewing until the correct passcode is entered.

### 🔌 Storage Modes: Local & Google Sheets Sync
- **100% Local (Default)** — All data lives in `chrome.storage.local`. Nothing leaves your device, providing a secure, privacy-first offline experience.
- **Google Sheets Cloud Sync** — Synchronize contacts, lists, and memberships directly to a Google Sheets document via an Apps Script Web App.
  - **Auto-Sync** — Optionally push individual contact or list updates to your Google Sheet instantly.
  - **Full Sync** — Manually trigger full bidirectional sync.
  - **Cloud State Snapshots** — Backup your full database or configurations directly to Google Sheets, generating unique Snapshot IDs that can be used to restore your exact workspace state on any machine.

### 📋 Custom Interaction Forms & Webhooks
- **Form Builder** — Design custom input forms to capture lead data during live calls or conversations.
- **Supported Fields** — Short Text, Long Text, Number, Dropdowns (comma-separated options), and Hidden Inputs.
- **Auto-Fill & Static Values** — Auto-fill fields from contact details (Name, Phone, Email, Handle, Location, Contact ID) or assign static values to Hidden Inputs (e.g., campaign identifiers).
- **Webhook Integration** — POST form payloads in JSON or plain text formats directly to any webhook or API endpoint (e.g., Zapier, Make, custom servers).
- **Inline Runner** — Access and submit your custom forms directly from the active contact widget.

### 📣 Campaigns & Google Voice Integration
- **Automated Text Campaigns** — Send personalized texts to target lists. Support for image attachments (MMS) and real-time delivery HUD.
- **Dynamic Personalization** — Personalize messages using template tokens:
  - `{{name}}` — First name of the contact
  - `{{phone}}` — Contact phone number
  - `{{email}}` — Contact email address
  - `{{handle}}` — Contact social handle
- **Rate-Limit & Spam Safety** — Randomize delays between messages using customizable Min/Max pacing limits in Settings. Campaigns automatically pause and notify you if Google Voice signals a rate limit.
- **Campaign Controls** — Pause, resume, retry failed contacts only, or duplicate campaigns for new target batches.

### 🤖 Google Voice Tab Enhancements
- **Inline Context Widget** — Auto-detects the active caller in your Google Voice chat panel and surfaces their CRM details inline (tags, notes, status, lists, categories, sources, custom forms).
- **Preset Replies** — Manage quick-insert message templates (supporting token personalization) and drop them into chats with a single click.
- **Draft Stash** — Saves unsent message drafts if you accidentally navigate away, restoring them when you return.
- **Do Not Contact (DND)** — Flag off-limits contacts to automatically exclude them from campaigns.
- **Sidebar Synchronizer** — Extract and sync contact details from the active Google Voice conversations roster.
- **Interface Toggles** — Collapse Google Voice's native right sidebar for a cleaner, wider workspace.

### 💾 Import & Export
- **Flexible Data Import** — Drag-and-drop or select CSV/JSON files, or copy/paste raw text (either raw phone numbers or comma-separated rows with headers). Assign contacts to lists during import.
- **Format Reference** — In-app format guides make mapping custom spreadsheets simple.
- **Export Formats** — Download all contacts or specific target lists as standard CSV or JSON files.
- **State Backups** — Download or load entire CRM state configurations via local JSON files.

---

## 🚀 Installation

### Option A — Use the pre-built extension (easiest)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the **`dist/`** folder from this repository
5. Go to [voice.google.com](https://voice.google.com) — the **GV-CRM** widget will appear on the screen

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
2. Complete onboarding by choosing **Local** or **Google Sheets Sync** and setting an optional **Passcode**.
3. Go to **Settings** → **Customization** to configure your statuses, categories, sources, and preset replies.
4. Go to **Contacts** → click **+ Add Contact** to add your first contact (or import them under **Data & Backup**).
5. Go to **Lists** → create a list and assign contacts to it.
6. Go to **Campaigns** → create a campaign, select your list, compose your message (using tags like `{{name}}`), and hit **▶ Launch**.

---

## ⚙️ App Settings Structure

| Settings Tab | Features |
|---|---|
| **🎨 Customization** | Edit Contact/List statuses, Membership levels, Lead sources, Categories, and Preset Texts. |
| **🔌 Storage & Sync** | Toggle Local/GSheet modes, configure Apps Script URL, enable auto-sync, or reset database. |
| **💾 Data & Backup** | Trigger local/cloud state backups & restores, download CSV/JSON lists, and import files or raw text. |
| **⚙ System Settings** | Toggle layout options (e.g. Hide GV Sidebar) and customize Campaign pacing min/max delays. |

---

## 📄 License

MIT — use and modify freely.
