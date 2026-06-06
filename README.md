# GSHEET CRM `v2.0.0`

**GSHEET CRM** is a lightweight Chrome extension that turns **Google Sheets** into a powerful, interactive CRM built directly on top of **Google Voice**. 

By embedding custom contact profiles, target lists, automated messaging campaigns, and live lead-capture forms directly inside your active Google Voice tab, GSHEET CRM eliminates the need to constantly switch tabs between your chat sessions and spreadsheets. 

While **Google Sheets is the preferred and recommended database** (allowing cross-device sync, cloud backups, and easy spreadsheet reporting), GSHEET CRM also supports a fully-functional **offline fallback** that stores 100% of your data locally in your browser.

---

### 💡 Why GSHEET CRM?
* **Zero Tab Switching**: Manage contact history, update lead statuses, and trigger webhooks inline while chat panels are active.
* **Hybrid Storage Architecture**: Choose between storing 100% of your data locally in your browser (`chrome.storage.local`) or connecting to a Google Sheet via a custom Apps Script backend. **(Google Sheets sync is highly preferred for robust cloud backups, cross-device support, and reporting)**.
* **Automated Campaigns**: Send personalized bulk SMS/MMS messages to target lists with randomized delay pacing and rate-limit detection to mimic human behavior.
* **Interactive Forms & Webhooks**: Submit live lead captures to external systems (Zapier, Make, custom endpoints) directly from the Google Voice window.

---


## ✨ Features

### 📇 CRM Contact & List Management
- **Rich Contact Profiles** — Add/edit contacts with name, phone, email, tags, status, category, lead source, membership level, and notes.
- **Target Outreach Lists** — Group contacts together into custom lists to organize your segments and track list-specific statuses (e.g., *Prospect*, *Confirmed*, *Declined*).
- **Filter & Search** — Filter by status, membership, source, category, list status, or tag. Sort contacts, freeze columns, and jump straight into a conversation in one click.
- **Bulk Actions** — Set status, add to list, remove from list, or bulk delete selected contacts.

### 🔒 Privacy & Security (Passcode Screen Lock)
- **Lock Screen Protection** — Configure a passcode lock during onboarding or in Settings to keep your CRM workspace secure.
- **Instant Locking** — Lock the CRM panel instantly via the lock button (`🔒`) in the navigation bar.
- **Secure Overlay** — An animated overlay prevents any workspace access or viewing until the correct passcode is entered.

### 🔌 Storage Modes: Local & Google Sheets Sync
- **Google Sheets Cloud Sync (Highly Recommended)** — Synchronize contacts, lists, and memberships directly to a Google Sheets document via an Apps Script Web App. This is the **preferred storage mode** as it ensures your data is backed up, accessible across different computers, and easily editable directly in Google Sheets.
- **100% Local Storage** — All data lives in `chrome.storage.local`. Nothing leaves your device, providing a secure, privacy-first offline experience. (Note: Data is confined to your current browser installation).
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
- **Mass Outreach Campaigns** — Launch automated dispatches to target lists using one of two modes:
  - **💬 SMS Broadcast** — Automate sending of personalized outbound text messages (with optional image/MMS attachments) to list members directly through Google Voice.
  - **📋 Form Sync** — Automate webhook/form submissions in bulk for all contacts in a list, pushing their details to your external API endpoints.
- **Real-Time HUD** — Monitor dispatch status, queue progress, and execution logs in real time.
- **Dynamic Personalization** — Personalize messages using template tokens:
  - `{{name}}` — First name of the contact
  - `{{phone}}` — Contact phone number
  - `{{email}}` — Contact email address
  - `{{handle}}` — Contact social handle
- **Rate-Limit & Spam Safety** — Randomize delays between messages using customizable Min/Max pacing limits in Settings. Campaigns automatically pause and notify you if Google Voice signals a rate limit.
- **Campaign Controls** — Pause, resume, retry failed contacts only, or duplicate campaigns for new target batches.

### 🤖 Google Voice Tab Enhancements
- **Inline Context Widget** — Automatically detects the active contact you are chatting with in Google Voice. Shows their CRM profile inline, and lets you add them to a list, edit details, or run custom forms on the fly.
- **Preset Replies (Reusable Templates)** — Save frequently used message templates (supporting token personalization) and insert them into chats with a single click to speed up communication.
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
5. Go to [voice.google.com](https://voice.google.com) — the **GSHEET CRM** widget will appear on the screen

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

## 📋 Google Sheets Backend Integration

If you choose the recommended **Google Sheets Cloud Sync** mode, you will need to host a Google Apps Script Web App that handles backend database operations. The backend script file is located at [gvcrm-appscript.gs](./gvcrm-appscript.gs).

This Apps Script handles GET/POST requests and interacts with four core spreadsheet tabs:
* **`Contacts`** — Stores name, phone, email, handle, status, category, lead source, location, and notes.
* **`ContactLists`** — Stores metadata about custom contact lists/segments.
* **`ContactListMembers`** — Tracks memberships mapping contacts to lists.
* **`DataSnapshots`** — Saves configuration snapshots, form templates, and logs.

For detailed request payloads, required spreadsheet column structures, deployment guides, and API endpoint specs, please refer to the [INTEGRATION-GSHEET.md](./INTEGRATION-GSHEET.md) specification file.

---

## 📖 Quick Start

1. Click the **GSHEET CRM** tab on the right side of Google Voice.
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
| **🔌 Storage & Sync** | Toggle Local/GSHEET modes, configure Apps Script URL, enable auto-sync, or reset database. |
| **💾 Data & Backup** | Trigger local/cloud state backups & restores, download CSV/JSON lists, and import files or raw text. |
| **⚙ System Settings** | Toggle layout options (e.g. Hide GV Sidebar) and customize Campaign pacing min/max delays. |

---

## 📄 License

MIT — use and modify freely.
