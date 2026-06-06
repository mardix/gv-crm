# Google Sheets Integration Guide

This guide details how to integrate **GSHEET CRM** with **Google Sheets** for robust, cross-device database synchronization and cloud backups.

The backend integration is powered by **Google Apps Script** running as a Web App API over a target Google Sheet. It dynamically manages contacts, list segments, list memberships, and gzipped state backups.

---

## 🚀 Deployment Instructions

To set up your Google Sheets backend:

1. **Create a Google Sheet** inside your Google Drive.
2. Open the spreadsheet, and navigate to **Extensions** ➔ **Apps Script**.
3. Clear any default code in the editor.
4. Copy the entire contents of the [gvcrm-appscript.gs](./gvcrm-appscript.gs) script file from this repository and paste it into the editor.
5. **Set up Google Drive Folder (Highly Recommended)**:
   - Large snapshots and database backups will exceed Google Sheets cell limits. To prevent these from cluttering your Google Drive root folder, create a new folder in Drive.
   - Copy the Folder ID from the URL (e.g., the string of characters after `folders/` in the URL: `https://drive.google.com/drive/u/0/folders/YOUR_FOLDER_ID`).
   - Near the top of the Apps Script code, update the `SNAPSHOT_DRIVE_FOLDER_ID` constant:
     ```javascript
     const SNAPSHOT_DRIVE_FOLDER_ID = "YOUR_FOLDER_ID";
     ```
6. Click the **Save** (disk) icon.
7. Deploy the script:
   - Click **Deploy** ➔ **New deployment** (top-right).
   - Click the gear icon next to "Select type" and select **Web app**.
   - Configure the deployment:
     - **Description**: `GSHEET CRM Web App Database API`
     - **Execute as**: `Me (your-email@gmail.com)`
     - **Who has access**: `Anyone` (this allows the extension to make POST/GET requests without complex OAuth login flows).
   - Click **Deploy**.
   - Grant permissions when prompted (Google may warn you the app is unverified; click *Advanced* ➔ *Go to GSHEET CRM (unsafe)* to proceed).
8. Copy the generated **Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).
9. Paste this URL into the **Storage & Sync** tab inside the GSHEET CRM extension Settings, or use it during the onboarding setup.

---

## 📊 Database Schema & Sheet Structures

When you configure the extension for the first time or manually run the sync, GSHEET CRM triggers the `initSchema` action. The script automatically generates the necessary tables and headers. 

> [!NOTE]
> Do not modify the required column header names. However, you can add extra custom columns or reorder the existing ones as columns are looked up dynamically by header text.

The script maintains four database sheets (tabs):

### 1. `Contacts`
Stores primary customer/lead details.
* **Columns**:
  - `Contact ID` (String, Primary Key)
  - `Name` (String)
  - `Phone` (String, Formatted as `(XXX) XXX-XXXX`)
  - `Email` (String)
  - `Status` (String, Default: `Active`, `Inactive`, `Review`, `Banned`)
  - `Category` (String, Default: `Regular`, `VIP`)
  - `Membership Level` (String, Default: `Basic`, `Plus`, `Pro`)
  - `Location` (String)
  - `Lead Source` (String)
  - `Handle` (String)
  - `Note` (String)
  - `Created At` (Datetime ISO String)
  - `Modified At` (Datetime ISO String)

### 2. `ContactLists`
Stores list segment directories.
* **Columns**:
  - `List ID` (String, Primary Key)
  - `Name` (String)
  - `Description` (String)
  - `Status` (String: `Active`, `Inactive`)
  - `Created At` (Datetime ISO String)
  - `Modified At` (Datetime ISO String)

### 3. `ContactListMembers`
A lookup table managing contact assignments to list segments (Many-to-Many).
* **Columns**:
  - `List ID` (String, Foreign Key)
  - `Contact ID` (String, Foreign Key)
  - `Status` (String, tracks list-specific status e.g., `Prospect`, `Lead`, `Confirmed`, `Cancelled`, `Rejected`, `Inactive`)
  - `Created At` (Datetime ISO String)
  - `Modified At` (Datetime ISO String)

### 4. `DataSnapshots`
Handles workspace configuration backups, campaign logs, and form templates.
* **Columns**:
  - `Snapshot ID` (String, Primary Key)
  - `Snapshot Type` (String, e.g., `form_state`, `app_backup`)
  - `Snapshot Name` (String)
  - `Storage Mode` (String: `sheet` or `drive_gzip`)
  - `Payload JSON` (String, stored in sheet cell if payload size < 40KB)
  - `Drive File ID` (String, Google Drive file ID if payload size >= 40KB)
  - `Payload Size` (Number of characters)
  - `Compressed Size` (Number of bytes)
  - `Created At` (Datetime ISO String)
  - `Modified At` (Datetime ISO String)
  - `Note` (String)

---

## 💾 Google Drive Storage for Large Snapshots

To optimize sheets storage and performance, the Apps Script utilizes a hybrid storage mechanism:
- **Small Snapshots** (under 40,000 characters) are saved directly in the `DataSnapshots` sheet under the `Payload JSON` column.
- **Large Snapshots** (over 40,000 characters) are compressed using Gzip, stored as `.json.gz` files in your designated Google Drive folder, and the resulting file reference is logged in the `Drive File ID` column. 

When restoring a state, the script dynamically detects the storage mode, pulls the file from Google Drive if necessary, decompresses it, and serves the JSON payload back to the Chrome extension.

---

## ⚡ API Endpoint Specification & Payloads

All requests are formatted as HTTP GET or POST requests to the deployment Web App URL. To prevent Apps Script CORS preflight issues, POST requests utilize a `Content-Type: text/plain` payload containing JSON.

All responses follow the shape:
- **Success**: `{ "ok": true, ... }`
- **Error**: `{ "ok": false, "error": "<message>" }`

### 1. `initSchema`
Creates missing tabs/columns in the active spreadsheet.
* **Method**: GET or POST
* **Payload**:
  ```json
  { "action": "initSchema" }
  ```
* **Response**:
  ```json
  {
    "ok": true,
    "initialized": true,
    "tabs": [
      {
        "tabName": "Contacts",
        "created": false,
        "initializedHeaders": true,
        "addedColumns": [],
        "renamedColumns": []
      }
    ]
  }
  ```

---

### 2. `saveContacts`
Bulk creates or updates contacts and updates their list assignments.
* **Method**: POST
* **Payload**:
  ```json
  {
    "action": "saveContacts",
    "contacts": [
      {
        "contactId": "opt-existing-id-to-update",
        "name": "Sarah Chen",
        "phone": "7045551234",
        "email": "sarah@example.com",
        "status": "Active",
        "category": "VIP",
        "membershipLevel": "Plus",
        "location": "Charlotte",
        "leadSource": "CSV Import",
        "handle": "sarahchen",
        "note": "Imported contact",
        "assignedLists": [
          { "listId": "vip-list-id", "status": "Prospect" }
        ]
      }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "ok": true,
    "total": 1,
    "created": 1,
    "updated": 0,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "ok": true,
        "mode": "created",
        "contactId": "abcdefg123456",
        "listSync": {
          "added": 1,
          "updated": 0,
          "removed": 0,
          "kept": 0
        }
      }
    ]
  }
  ```

---

### 3. `readContacts`
Returns all contacts.
* **Method**: GET
* **Params**: `action=readContacts` (optional: `&includeLists=true`)
* **Response**:
  ```json
  {
    "ok": true,
    "contacts": [
      {
        "contactId": "abcdefg123456",
        "name": "Sarah Chen",
        "phone": "(704) 555-1234",
        "email": "sarah@example.com",
        "status": "Active",
        "category": "VIP",
        "membershipLevel": "Plus",
        "location": "Charlotte",
        "leadSource": "CSV Import",
        "handle": "sarahchen",
        "note": "Imported contact",
        "createdAt": "2026-06-06T12:00:00.000Z",
        "modifiedAt": "2026-06-06T12:00:00.000Z",
        "lists": [
          {
            "listId": "vip-list-id",
            "name": "VIP Outreach",
            "description": "High-priority segment",
            "listStatus": "Active",
            "membership": {
              "status": "Prospect",
              "createdAt": "2026-06-06T12:00:00.000Z",
              "modifiedAt": "2026-06-06T12:00:00.000Z"
            }
          }
        ]
      }
    ]
  }
  ```

---

### 4. `saveContactLists`
Bulk creates or updates contact list directories.
* **Method**: POST
* **Payload**:
  ```json
  {
    "action": "saveContactLists",
    "lists": [
      {
        "listId": "optional-id",
        "name": "VIP Outreach",
        "description": "High-priority segment",
        "status": "Active"
      }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "ok": true,
    "total": 1,
    "created": 1,
    "updated": 0,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "ok": true,
        "mode": "created",
        "listId": "vip-list-id"
      }
    ]
  }
  ```

---

### 5. `deleteContactList`
Deletes a contact list and permanently removes its memberships.
* **Method**: POST
* **Payload**:
  ```json
  {
    "action": "deleteContactList",
    "listId": "vip-list-id"
  }
  ```
* **Response**:
  ```json
  {
    "ok": true,
    "mode": "deleted",
    "listId": "vip-list-id",
    "deletedList": true,
    "deletedMemberships": 5
  }
  ```

---

### 6. `readContactLists`
Returns a list of all contact list groups.
* **Method**: GET
* **Params**: `action=readContactLists`
* **Response**:
  ```json
  {
    "ok": true,
    "lists": [
      {
        "listId": "vip-list-id",
        "name": "VIP Outreach",
        "description": "High-priority segment",
        "status": "Active",
        "createdAt": "2026-06-06T12:00:00.000Z",
        "modifiedAt": "2026-06-06T12:00:00.000Z"
      }
    ]
  }
  ```

---

### 7. `readContactsByList`
Returns contacts assigned to a specific `listId` (Active memberships only).
* **Method**: GET
* **Params**: `action=readContactsByList&listId=vip-list-id`
* **Response**:
  ```json
  {
    "ok": true,
    "listId": "vip-list-id",
    "contacts": [
      {
        "contactId": "abcdefg123456",
        "name": "Sarah Chen",
        "phone": "(704) 555-1234",
        "email": "sarah@example.com",
        "membership": {
          "listId": "vip-list-id",
          "contactId": "abcdefg123456",
          "status": "Active",
          "createdAt": "2026-06-06T12:00:00.000Z",
          "modifiedAt": "2026-06-06T12:00:00.000Z"
        }
      }
    ]
  }
  ```

---

### 8. `readListsForContact`
Returns lists that a specific `contactId` belongs to.
* **Method**: GET
* **Params**: `action=readListsForContact&contactId=abcdefg123456`
* **Response**:
  ```json
  {
    "ok": true,
    "contactId": "abcdefg123456",
    "lists": [
      {
        "listId": "vip-list-id",
        "name": "VIP Outreach",
        "description": "High-priority segment",
        "membership": {
          "listId": "vip-list-id",
          "contactId": "abcdefg123456",
          "status": "Active",
          "createdAt": "2026-06-06T12:00:00.000Z",
          "modifiedAt": "2026-06-06T12:00:00.000Z"
        }
      }
    ]
  }
  ```

---

### 9. `saveDataSnapshot`
Saves state configs or logs (modes: `append` or `replace`).
* **Method**: POST
* **Payload**:
  ```json
  {
    "action": "saveDataSnapshot",
    "snapshotType": "form_state",
    "snapshotName": "Form Builder Config",
    "snapshotMode": "replace",
    "data": { "form_field_1": "value" },
    "note": "Optional snapshot note"
  }
  ```
* **Response**:
  ```json
  {
    "ok": true,
    "mode": "replaced",
    "snapshotId": "snapshot12345",
    "snapshotType": "form_state",
    "snapshotName": "Form Builder Config",
    "storageMode": "sheet",
    "payloadSize": 30,
    "compressedSize": 0,
    "modifiedAt": "2026-06-06T12:00:00.000Z"
  }
  ```

---

### 10. `readDataSnapshots`
Lists all snapshot metadata (excluding payload).
* **Method**: GET
* **Params**: `action=readDataSnapshots`
* **Response**:
  ```json
  {
    "ok": true,
    "snapshots": [
      {
        "snapshotId": "snapshot12345",
        "snapshotType": "form_state",
        "snapshotName": "Form Builder Config",
        "storageMode": "sheet",
        "driveFileId": "",
        "payloadSize": 30,
        "compressedSize": 0,
        "createdAt": "2026-06-06T12:00:00.000Z",
        "modifiedAt": "2026-06-06T12:00:00.000Z",
        "note": "Optional snapshot note"
      }
    ]
  }
  ```

---

### 11. `readDataSnapshot`
Fetches and decompresses a specific snapshot by its `snapshotId`.
* **Method**: GET
* **Params**: `action=readDataSnapshot&snapshotId=snapshot12345`
* **Response**:
  ```json
  {
    "ok": true,
    "snapshot": {
      "snapshotId": "snapshot12345",
      "snapshotType": "form_state",
      "snapshotName": "Form Builder Config",
      "payloadSize": 30,
      "createdAt": "2026-06-06T12:00:00.000Z",
      "modifiedAt": "2026-06-06T12:00:00.000Z",
      "note": "Optional snapshot note",
      "data": { "form_field_1": "value" }
    }
  }
  ```