/**
 * ============================================================================
 *  GV-CRM / GSHEET APPSCRIPT
 * ============================================================================
 *
 *  Google Apps Script Web App API acting as the cloud database for GV-CRM.
 *  Handles transactional contact saving, list memberships, and configuration 
 *  state snapshots. Row values are indexed dynamically by header name,
 *  meaning sheet columns can be safely reordered or customized.
 *
 *  ─── REQUIRED SHEET TABS ───────────────────────────────────────────────────
 *
 *  Tab: "Contacts"
 *    CRM-style contact table.
 *
 *    Required columns:
 *      Contact ID, Name, Phone, Email, Status, Category,
 *      Membership Level, Location,
 *      Lead Source, Handle, Note, Created At, Modified At
 *
 *    Status values:
 *      Active, Inactive, Review, Banned
 *
 *    Category values:
 *      Regular, VIP
 *
 *    Membership Level values:
 *      Basic, Plus, Pro
 *
 *  Tab: "ContactLists"
 *    Contact list/group table.
 *
 *    Required columns:
 *      List ID, Name, Description, Status, Created At, Modified At
 *
 *    Status values:
 *      Active, Inactive
 *
 *  Tab: "ContactListMembers"
 *    Many-to-many assignments between contacts and lists.
 *
 *    Required columns:
 *      List ID, Contact ID, Status, Created At, Modified At
 *
 *    Status values:
 *      Active, Inactive
 *
 *  Tab: "DataSnapshots"
 *    Stores arbitrary JSON snapshots sent by the client.
 *
 *    Required columns:
 *      Snapshot ID, Snapshot Type, Snapshot Name, Payload JSON,
 *      Payload Size, Created At, Modified At, Note
 *
 *  ─── API FIELD NAMES ───────────────────────────────────────────────────────
 *
 *  Use canonical camelCase API fields only.
 *
 *  Contact fields:
 *    contactId, name, phone, email, status, category,
 *    membershipLevel, location, leadSource, handle, note
 *
 *  Contact list fields:
 *    listId, name, description, status
 *
 *  Contact-list membership fields:
 *    listId, contactId
 *
 *  Data snapshot fields:
 *    snapshotId, snapshotType, snapshotName, snapshotMode, data, note
 *
 *  Do not send old aliases such as:
 *    code, count, role, comment, event_id, attendee_code, guest_count,
 *    lead_source
 *
 *  ─── DEPLOYMENT ────────────────────────────────────────────────────────────
 *
 *  1. Create a Google Sheet.
 *  2. Open Extensions → Apps Script.
 *  3. Paste this file.
 *  4. Deploy → New deployment → Web app.
 *       Execute as:    Me
 *       Who has access: Anyone
 *  5. Copy the Web App URL into the client app.
 *
 *  After modifying this script, redeploy a new Web App version:
 *    Deploy → Manage deployments → Edit → Version → New version → Deploy
 *
 *  POST requests should use:
 *    Content-Type: text/plain
 *
 *  The body is still JSON. This avoids Apps Script CORS preflight issues.
 *
 *  ─── RESPONSE SHAPE ────────────────────────────────────────────────────────
 *
 *  Success:
 *    { ok: true, ... }
 *
 *  Error:
 *    { ok: false, error: "<message>" }
 *
 *
 *  ─── CONTACT ENDPOINTS ─────────────────────────────────────────────────────
 *
 *
 *  saveContacts
 *    Method: POST
 *    Bulk creates or updates contacts.
 *
 *    Body:
 *      {
 *        action: "saveContacts",
 *        contacts: [
 *          {
 *            contactId: "optional-existing-id",
 *            name: "Sarah Chen",
 *            phone: "7045551234",
 *            email: "sarah@example.com",
 *            status: "Active",
 *            category: "VIP",
 *            membershipLevel: "Standard",
 *            location: "Charlotte",
 *            leadSource: "CSV Import",
 *            handle: "sarahchen",
 *            note: "Imported contact",
 *            assignedLists: [
 *              { listId: "vip-list-id", status: "Prospect" }
 *            ]
 *          }
 *        ]
 *      }
 *
 *    Behavior:
 *      Each contact is processed independently.
 *      Missing contactId creates a new contact.
 *      Existing contactId updates that contact.
 *      Unknown contactId creates a new contact with that ID.
 *      assignedLists is optional.
 *      If assignedLists is omitted, list assignments are not changed.
 *      If assignedLists is [], all assignments for that contact are deleted.
 *      If assignedLists has items, assignments are replaced with that set.
 *
 *    Returns:
 *      {
 *        ok,
 *        total,
 *        created,
 *        updated,
 *        failed,
 *        results: [...]
 *      }
 *
 *  readContacts
 *    Method: GET
 *    Returns all contacts.
 *
 *    Params:
 *      includeLists optional
 *
 *    Examples:
 *      ?action=readContacts
 *      ?action=readContacts&includeLists=true
 *
 *    Behavior:
 *      By default, returns contacts only.
 *      When includeLists=true, each contact includes assigned lists.
 *
 *    Returns:
 *      {
 *        ok,
 *        contacts: [
 *          {
 *            contactId,
 *            name,
 *            phone,
 *            email,
 *            status,
 *            category,
 *            membershipLevel,
 *            location,
 *            leadSource,
 *            handle,
 *            note,
 *            createdAt,
 *            modifiedAt,
 *            lists?: [
 *              {
 *                listId,
 *                name,
 *                description,
 *                listStatus,
 *                membership: {
 *                  status,
 *                  createdAt,
 *                  modifiedAt
 *                }
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *
 *  ─── CONTACT LIST ENDPOINTS ────────────────────────────────────────────────
 *
 *  saveContactLists
 *    Method: POST
 *    Bulk creates or updates contact lists.
 *
 *    Body:
 *      {
 *        action: "saveContactLists",
 *        lists: [
 *          {
 *            listId: "optional-existing-id",
 *            name: "VIP Guests",
 *            description: "High-value contacts",
 *            status: "Active"
 *          },
 *          {
 *            name: "Charlotte Leads",
 *            description: "People from Charlotte events",
 *            status: "Active"
 *          }
 *        ]
 *      }
 *
 *    Behavior:
 *      Each list is processed independently.
 *      Missing listId creates a new list.
 *      Existing listId updates that list.
 *      Unknown listId creates a new list with that ID.
 *      Only provided fields are updated on existing lists.
 *      Created At is set on create.
 *      Modified At is updated on create/update.
 *
 *    Create rules:
 *      name is required when creating a new list.
 *      status defaults to "Active" when omitted.
 *
 *    Update rules:
 *      listId itself is not changed.
 *      name, description, and status can be updated.
 *
 *    Status values:
 *      Active, Inactive
 *
 *    Returns:
 *      {
 *        ok,
 *        total,
 *        created,
 *        updated,
 *        failed,
 *        results: [
 *          {
 *            index,
 *            ok,
 *            mode: "created" | "updated",
 *            listId,
 *            updatedFields?
 *          },
 *          {
 *            index,
 *            ok: false,
 *            error
 *          }
 *        ]
 *      }
 *
 *
 *  deleteContactList
 *    Method: POST
 *    Permanently deletes a contact list and all matching membership rows.
 *
 *    Body:
 *      {
 *        action: "deleteContactList",
 *        listId: "list-id"
 *      }
 *
 *    Behavior:
 *      Deletes the matching row from ContactLists.
 *      Deletes all ContactListMembers rows where List ID matches listId.
 *      Rows are deleted permanently, not marked Inactive.
 *      If the list row is missing, matching membership rows are still deleted.
 *
 *    Returns:
 *      {
 *        ok,
 *        mode: "deleted" | "not_found",
 *        listId,
 *        deletedList,
 *        deletedMemberships
 *      }
 *
 *
 *  readContactLists
 *    Method: GET
 *
 *    Example:
 *      ?action=readContactLists
 *
 *    Returns:
 *      { ok, lists: [...] }
 *
 *
 *  readContactsByList
 *    Method: GET
 *
 *    Example:
 *      ?action=readContactsByList&listId=LIST_ID
 *
 *    Returns:
 *      { ok, listId, contacts: [{ ...contact, membership }] }
 *
 *  readListsForContact
 *    Method: GET
 *
 *    Example:
 *      ?action=readListsForContact&contactId=CONTACT_ID
 *
 *    Returns:
 *      { ok, contactId, lists: [{ ...list, membership }] }
 *
 *  ─── DATA SNAPSHOT ENDPOINTS ───────────────────────────────────────────────
 *
 *  saveDataSnapshot
 *    Method: POST
 *    Stores arbitrary JSON sent by the client.
 *    It does not read current sheet data automatically.
 *
 *    Body:
 *      {
 *        action: "saveDataSnapshot",
 *        snapshotType: "form_state",
 *        snapshotName: "Form Builder State",
 *        snapshotMode: "append",
 *        data: { "any": "json" },
 *        note: "Optional note"
 *      }
 *
 *    snapshotMode:
 *      append   Always creates a new snapshot row. Default.
 *      replace  Updates existing row by Snapshot Type + Snapshot Name.
 *               If no match exists, creates a new row.
 *
 *    Returns:
 *      { ok, mode, snapshotId, snapshotType, snapshotName, payloadSize, createdAt?, modifiedAt? }
 *
 *  readDataSnapshots
 *    Method: GET
 *    Returns snapshot metadata only, not full payload JSON.
 *
 *    Example:
 *      ?action=readDataSnapshots
 *
 *    Returns:
 *      { ok, snapshots: [...] }
 *
 *  readDataSnapshot
 *    Method: GET
 *    Returns one snapshot with parsed data.
 *
 *    Example:
 *      ?action=readDataSnapshot&snapshotId=SNAPSHOT_ID
 *
 *    Returns:
 *      { ok, snapshot: { snapshotId, snapshotType, snapshotName, payloadSize, createdAt, modifiedAt, note, data } }
 *
 *  ─── DESIGN NOTES ──────────────────────────────────────────────────────────
 *
 *  Contacts and lists:
 *    Contacts can belong to multiple lists through ContactListMembers.
 *    Membership rows are marked Inactive instead of deleted.
 *
 *  Snapshots:
 *    DataSnapshots stores client-sent JSON. For very large payloads, use
 *    chunking or Google Drive storage instead of one large sheet cell.
 *
 *  Locking:
 *    Write endpoints use LockService to reduce concurrent write conflicts.
 *    Normal writes use a short lock timeout. Maintenance/setup actions use
 *    a longer timeout.
 *
 *  Phone formatting:
 *    7045551234   -> (704) 555-1234
 *    17045551234  -> 1 (704) 555-1234
 *    +17045551234 -> +1 (704) 555-1234
 *
 *  Auth:
 *    This script assumes the Web App is deployed anonymously. For private
 *    events, add authentication before exposing the Web App URL.
 *
 * ============================================================================
 */

const APPSCRIPT_VERSION = "2.6.0"

const QUICK_LOCK_TIMEOUT_MS = 3000;
const MAINTENANCE_LOCK_TIMEOUT_MS = 15000;

// TABS;
const CONTACTS_TAB = "Contacts";
const CONTACT_LISTS_TAB = "ContactLists";
const CONTACT_LIST_MEMBERS_TAB = "ContactListMembers";
const DATA_SNAPSHOTS_TAB = "DataSnapshots";

// Keep this safely below common sheet cell limits.
const SNAPSHOT_SHEET_MAX_CHARS = 40000;

// Optional. Leave blank to save snapshot files in My Drive root.
// Put a Drive folder ID here if you want all snapshot files in one folder.
// ie: https://drive.google.com/drive/u/0/folders/xxxxxxxx
const SNAPSHOT_DRIVE_FOLDER_ID = ""; // -> xxxxxxxxx

// SCHEMAS TO AUTO CREATE THE NECESSARY SHEETS
const SHEET_SCHEMAS = {

  [CONTACTS_TAB]: [
    "Contact ID",
    "Name",
    "Phone",
    "Email",
    "Status",
    "Category",
    "Membership Level",
    "Location",
    "Lead Source",
    "Handle",
    "Note",
    "Created At",
    "Modified At"
  ],

  [CONTACT_LISTS_TAB]: [
    "List ID",
    "Name",
    "Description",
    "Status",
    "Created At",
    "Modified At"
  ],

  [CONTACT_LIST_MEMBERS_TAB]: [
    "List ID",
    "Contact ID",
    "Status",
    "Created At",
    "Modified At"
  ],

[DATA_SNAPSHOTS_TAB]: [
  "Snapshot ID",
  "Snapshot Type",
  "Snapshot Name",
  "Storage Mode",
  "Payload JSON",
  "Drive File ID",
  "Payload Size",
  "Compressed Size",
  "Created At",
  "Modified At",
  "Note"
]
  
};

/**
* To create a simple uid
*/
const uid = (len = 16) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.random() * 36 | 0];
  return s;
};

/**
 * Handle GET requests from the web app.
 *
 * GET requests are intended for read-only actions such as readEvent,
 * readEventAttendees, readContacts, readContactLists, readContactsByList, and
 * readListsForContact. Query parameters are passed to handleRequest().
 *
 * @param {Object} e Apps Script event object.
 * @returns {TextOutput} JSON response.
 */
function doGet(e) {
  return handleRequest((e && e.parameter) || {});
}

/**
 * Handle POST requests from the web app.
 *
 * The client should send JSON as a text/plain body to avoid CORS preflight
 * issues in Apps Script. This function parses the JSON body and passes the
 * payload to handleRequest().
 *
 * @param {Object} e Apps Script event object.
 * @returns {TextOutput} JSON response.
 */
function doPost(e) {
  let payload = {};

  try {
    const body = e && e.postData ? e.postData.contents : "";
    payload = JSON.parse(body || "{}");
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: "Invalid JSON body"
    });
  }

  return handleRequest(payload);
}


/**
 * Route an API request to the matching action handler.
 *
 * @param {Object} params Request query params or parsed POST body.
 * @returns {TextOutput} JSON response.
 */
function handleRequest(params) {
  params = params || {};

  const action = params.action;

  try {

    // init -> initSchema
    if (action === "initSchema") return initSchema();

    // contacts 
    if (action === "saveContacts") return saveContacts(params);
    if (action === "readContacts") return readContacts(params.includeLists);

    // contacts list 
    if (action === "saveContactLists") return saveContactLists(params);
    if (action === "readContactLists") return readContactLists();
    if (action === "readContactsByList") return readContactsByList(params.listId);
    if (action === "readListsForContact") return readListsForContact(params.contactId);
    if (action === "deleteContactList") return deleteContactList(params);

    // data snapshot, to save any arbitrary data
    if (action === "saveDataSnapshot") return saveDataSnapshot(params);
    if (action === "readDataSnapshots") return readDataSnapshots();
    if (action === "readDataSnapshot") return readDataSnapshot(params.snapshotId);

    return jsonResponse({
      ok: false,
      error: "Unknown action: " + action
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

/**
 * Create a JSON HTTP response.
 *
 * @param {Object} obj Object to serialize as JSON.
 * @returns {TextOutput} JSON response.
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Return a sheet tab by name.
 *
 * @param {string} name Sheet tab name.
 * @returns {Sheet} Google Sheets tab.
 */
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);

  if (!sheet) {
    throw new Error("Missing tab: " + name);
  }

  return sheet;
}

function testDrivePermission() {
  const folder = getSnapshotDriveFolder_();
  Logger.log(folder.getName());
}

/**
 * Parse a boolean-like API parameter.
 *
 * Supports:
 *   true, "true", "1", "yes"
 *
 * @param {*} value Raw parameter value.
 * @returns {boolean} Parsed boolean.
 */
function parseBooleanParam_(value) {
  if (value === true) return true;

  const raw = String(value || "").trim().toLowerCase();

  return raw === "true" || raw === "1" || raw === "yes";
}

/**
 * Check whether an object owns a field.
 *
 * This distinguishes omitted fields from fields intentionally sent as "".
 *
 * @param {Object} obj Source object.
 * @param {string} key Field name.
 * @returns {boolean} True when key exists directly on obj.
 */
function hasOwn_(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

/**
 * Normalize a sheet header for case-insensitive lookup.
 *
 * @param {*} value Header value.
 * @returns {string} Normalized header key.
 */
function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Normalize an attendee code for case-insensitive comparison.
 *
 * @param {*} value Attendee code.
 * @returns {string} Normalized attendee code key.
 */
function normalizeCode_(value) {
  return String(value || "").trim().toUpperCase();
}

/**
 * Normalize an event ID for case-insensitive comparison.
 *
 * @param {*} value Event ID.
 * @returns {string} Normalized event ID key.
 */
function normalizeEventId_(value) {
  return String(value || "").trim().toUpperCase();
}

/**
 * Read the first row of a sheet and build a header index map.
 *
 * @param {Sheet} sheet Google Sheets tab.
 * @param {string} tabName Human-readable tab name for errors.
 * @returns {{headers: string[], headerMap: Object}} Header metadata.
 */
function getHeaderInfo_(sheet, tabName) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    throw new Error(tabName + " tab must have a header row");
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const headers = headerRow.map(normalizeHeader_);
  const headerMap = {};

  for (let i = 0; i < headers.length; i++) {
    const key = headers[i];

    if (key && !hasOwn_(headerMap, key)) {
      headerMap[key] = i;
    }
  }

  return {
    headers: headers,
    headerMap: headerMap
  };
}

/**
 * Get a column index by header name.
 *
 * @param {Object} headerMap Header map from getHeaderInfo_().
 * @param {string} label Header label.
 * @returns {number} Zero-based column index, or -1 when not found.
 */
function getColumnIndex_(headerMap, label) {
  const key = normalizeHeader_(label);

  return hasOwn_(headerMap, key) ? headerMap[key] : -1;
}

/**
 * Require one or more columns to exist in a sheet.
 *
 * @param {Object} headerMap Header map from getHeaderInfo_().
 * @param {string} tabName Sheet tab name.
 * @param {string[]} labels Required header labels.
 */
function requireColumns_(headerMap, tabName, labels) {
  const missing = [];

  labels.forEach(label => {
    if (getColumnIndex_(headerMap, label) < 0) {
      missing.push(label);
    }
  });

  if (missing.length > 0) {
    throw new Error(tabName + " tab missing required columns: " + missing.join(", "));
  }
}

/**
 * Build a sheet row using the current header order.
 *
 * Any sheet header not present in fieldMap is written as a blank cell. This
 * allows column order to change without breaking writes.
 *
 * @param {string[]} headers Normalized sheet headers.
 * @param {Object} fieldMap Map of normalized header labels to values.
 * @returns {Array} Row values matching the sheet header order.
 */
function buildRowFromHeaders_(headers, fieldMap) {
  return headers.map(header => {
    const key = normalizeHeader_(header);

    return hasOwn_(fieldMap, key) ? fieldMap[key] : "";
  });
}

/**
 * Format a phone number for display in the sheet.
 *
 * Behavior:
 *   7045551234     -> (704) 555-1234
 *   17045551234    -> 1 (704) 555-1234
 *   +17045551234   -> +1 (704) 555-1234
 *
 * Invalid or non-US-like phone numbers are returned as originally entered.
 *
 * @param {string|number} value Raw phone value.
 * @returns {string} Formatted phone number.
 */
function formatPhoneNumber(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    const d = digits.slice(1);
    const prefix = raw.startsWith("+") ? "+1" : "1";

    return prefix + " (" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  return raw;
}

/**
 * Convert a value to a positive integer.
 *
 * @param {*} value Raw value.
 * @param {number} defaultValue Fallback integer.
 * @returns {number} Positive integer.
 */
function parsePositiveInt_(value, defaultValue) {
  const parsed = parseInt(value, 10);

  if (!parsed || parsed < 1) {
    return defaultValue;
  }

  return parsed;
}

/**
 * Convert a date-like value to an ISO string for API responses.
 *
 * @param {*} value Date object, date string, or other value.
 * @returns {string} ISO-ish string value.
 */
function toIsoString_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value || "");
}

/**
 * Convert a date-like value to a Date object for sorting.
 *
 * @param {*} value Date object or date string.
 * @returns {Date} Parsed Date.
 */
function toSortDate_(value) {
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);

  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}


/**
 * Generate a unique ID using uid() and an existing-ID set.
 *
 * @param {Set<string>} takenIds Existing IDs.
 * @returns {string} Unique ID.
 */
function generateUniqueId_(takenIds) {
  let id = uid();

  while (takenIds.has(String(id).trim())) {
    id = uid();
  }

  return id;
}

// ----------------------------------------------------------------------------
// === CONTACTS & LIST

/**
 * Normalize a contact's status inside a specific list.
 *
 * This is different from Contacts.Status.
 *
 * Examples:
 *   prospect  -> Prospect
 *   lead      -> Lead
 *   confirmed -> Confirmed
 *
 * Unknown custom statuses are preserved after trimming.
 *
 * @param {*} value Raw membership status.
 * @returns {string} Normalized list membership status.
 */
function normalizeAssignmentStatus_(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "Prospect";
  }

  const key = raw.toLowerCase();

  const statuses = {
    prospect: "Prospect",
    lead: "Lead",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    rejected: "Rejected",
    inactive: "Inactive"
  };

  return hasOwn_(statuses, key) ? statuses[key] : raw;
}

/**
 * Build a map of contacts by Contact ID.
 *
 * @returns {Object} Map of contactId -> contact object.
 */
function getContactsById_() {
  const sheet = getSheet(CONTACTS_TAB);
  const info = getHeaderInfo_(sheet, CONTACTS_TAB);

  requireColumns_(info.headerMap, CONTACTS_TAB, [
    "Contact ID",
    "Name",
    "Phone",
    "Email",
    "Status",
    "Category",
    "Membership Level",
    "Location",
    "Lead Source",
    "Handle",
    "Note",
    "Created At",
    "Modified At"
  ]);

  const values = sheet.getDataRange().getValues();
  const idxContactId = getColumnIndex_(info.headerMap, "Contact ID");
  const idxName = getColumnIndex_(info.headerMap, "Name");
  const idxPhone = getColumnIndex_(info.headerMap, "Phone");
  const idxEmail = getColumnIndex_(info.headerMap, "Email");
  const idxStatus = getColumnIndex_(info.headerMap, "Status");
  const idxCategory = getColumnIndex_(info.headerMap, "Category");
  const idxMembershipLevel = getColumnIndex_(info.headerMap, "Membership Level");
  const idxLocation = getColumnIndex_(info.headerMap, "Location");
  const idxLeadSource = getColumnIndex_(info.headerMap, "Lead Source");
  const idxHandle = getColumnIndex_(info.headerMap, "Handle");
  const idxNote = getColumnIndex_(info.headerMap, "Note");
  const idxCreatedAt = getColumnIndex_(info.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(info.headerMap, "Modified At");

  const contactsById = {};

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const contactId = String(row[idxContactId] || "").trim();

    if (!contactId) {
      continue;
    }

    contactsById[contactId] = {
      contactId: contactId,
      name: String(row[idxName] || ""),
      phone: String(row[idxPhone] || ""),
      email: String(row[idxEmail] || ""),
      status: String(row[idxStatus] || ""),
      category: String(row[idxCategory] || ""),
      membershipLevel: String(row[idxMembershipLevel] || ""),
      location: String(row[idxLocation] || ""),
      leadSource: String(row[idxLeadSource] || ""),
      handle: String(row[idxHandle] || ""),
      note: String(row[idxNote] || ""),
      createdAt: toIsoString_(row[idxCreatedAt]),
      modifiedAt: toIsoString_(row[idxModifiedAt])
    };
  }

  return contactsById;
}


/**
 * Bulk create/update contacts in the Contacts tab.
 *
 * Endpoint action:
 *   saveContacts
 *
 * Body:
 *   {
 *     action: "saveContacts",
 *     contacts: [
 *       {
 *         contactId: "optional-existing-id",
 *         name: "Sarah Chen",
 *         phone: "7045551234",
 *         email: "sarah@example.com",
 *         status: "Active",
 *         category: "Male",
 *         membershipLevel: "Standard",
 *         location: "Charlotte",
 *         leadSource: "Event RSVP",
 *         handle: "sarahchen",
 *         note: "Met at event",
 *         assignedLists: [
 *           { listId: "vip-list-id", status: "Prospect" },
 *           { listId: "confirmed-list-id", status: "Confirmed" }
 *         ]
 *       }
 *     ]
 *   }
 *
 * Behavior:
 *   - Creates contacts when contactId is missing or not found.
 *   - Updates contacts when contactId already exists.
 *   - Only provided fields are updated for existing contacts.
 *   - Created At is set only on create.
 *   - Modified At is updated on create/update.
 *   - If assignedLists is omitted, list assignments are not changed.
 *   - If assignedLists is [], all list assignments for that contact are deleted.
 *   - If assignedLists contains list/status objects, assignments are replaced.
 *   - Processes each contact independently and returns per-row results.
 *
 * Returns:
 *   {
 *     ok: true,
 *     total: number,
 *     created: number,
 *     updated: number,
 *     failed: number,
 *     results: [{
 *       index,
 *       ok,
 *       mode,
 *       contactId,
 *       updatedFields?,
 *       listSync?,
 *       error?
 *     }]
 *   }
 *
 * @param {Object} p Request payload.
 * @param {Object[]} p.contacts Contacts to create/update.
 * @returns {TextOutput} JSON response.
 */
function saveContacts(p) {
  p = p || {};

  if (!Array.isArray(p.contacts)) {
    return jsonResponse({
      ok: false,
      error: "contacts must be an array"
    });
  }

  if (p.contacts.length === 0) {
    return jsonResponse({
      ok: true,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      results: []
    });
  }

  const sheet = getSheet(CONTACTS_TAB);
  const lock = LockService.getScriptLock();

  lock.waitLock(QUICK_LOCK_TIMEOUT_MS);

  try {
    const info = getHeaderInfo_(sheet, CONTACTS_TAB);

    requireColumns_(info.headerMap, CONTACTS_TAB, [
      "Contact ID",
      "Name",
      "Phone",
      "Email",
      "Status",
      "Category",
      "Membership Level",
      "Location",
      "Lead Source",
      "Handle",
      "Note",
      "Created At",
      "Modified At"
    ]);

    const idxContactId = getColumnIndex_(info.headerMap, "Contact ID");
    const values = sheet.getDataRange().getValues();

    const takenIds = new Set();
    const rowByContactId = {};

    for (let i = 1; i < values.length; i++) {
      const rowContactId = String(values[i][idxContactId] || "").trim();

      if (!rowContactId) {
        continue;
      }

      takenIds.add(rowContactId);
      rowByContactId[rowContactId] = i + 1; // 1-indexed sheet row
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    const results = [];

    p.contacts.forEach((contact, index) => {
      contact = contact || {};

      try {
        if (hasOwn_(contact, "assignedLists") && !Array.isArray(contact.assignedLists)) {
          throw new Error("assignedLists must be an array");
        }

        let contactId = String(contact.contactId || "").trim();

        if (!contactId) {
          contactId = generateUniqueId_(takenIds);
          takenIds.add(contactId);
        }

        const now = new Date();
        const existingRowNumber = rowByContactId[contactId] || -1;

        if (existingRowNumber > 0) {
          const updates = [];

          const addUpdate = (payloadKey, headerLabel, formatter) => {
            if (!hasOwn_(contact, payloadKey)) {
              return;
            }

            const columnIndex = getColumnIndex_(info.headerMap, headerLabel);

            if (columnIndex < 0) {
              return;
            }

            const rawValue = contact[payloadKey];
            const value = formatter ? formatter(rawValue) : rawValue;

            updates.push({
              columnIndex: columnIndex,
              value: value
            });
          };

          addUpdate("name", "Name");
          addUpdate("phone", "Phone", formatPhoneNumber);
          addUpdate("email", "Email");
          addUpdate("status", "Status");
          addUpdate("category", "Category");
          addUpdate("membershipLevel", "Membership Level");
          addUpdate("location", "Location");
          addUpdate("leadSource", "Lead Source");
          addUpdate("handle", "Handle");
          addUpdate("note", "Note");

          updates.push({
            columnIndex: getColumnIndex_(info.headerMap, "Modified At"),
            value: now
          });

          updates.forEach(update => {
            sheet
              .getRange(existingRowNumber, update.columnIndex + 1)
              .setValue(update.value);
          });

          let listSync = null;

          if (hasOwn_(contact, "assignedLists")) {
            listSync = syncContactAssignedLists_(contactId, contact.assignedLists);
          }

          updated++;

          results.push({
            index: index,
            ok: true,
            mode: "updated",
            contactId: contactId,
            updatedFields: updates.length,
            listSync: listSync
          });

          return;
        }

        const fieldMap = {
          "contact id": contactId,
          "name": hasOwn_(contact, "name") ? contact.name : "",
          "phone": hasOwn_(contact, "phone") ? formatPhoneNumber(contact.phone) : "",
          "email": hasOwn_(contact, "email") ? contact.email : "",
          "status": hasOwn_(contact, "status") ? contact.status : "Active",
          "category": hasOwn_(contact, "category") ? contact.category : "Other",
          "membership level": hasOwn_(contact, "membershipLevel") ? contact.membershipLevel : "Standard",
          "location": hasOwn_(contact, "location") ? contact.location : "",
          "lead source": hasOwn_(contact, "leadSource") ? contact.leadSource : "",
          "handle": hasOwn_(contact, "handle") ? contact.handle : "",
          "note": hasOwn_(contact, "note") ? contact.note : "",
          "created at": now,
          "modified at": now
        };

        const newRow = buildRowFromHeaders_(info.headers, fieldMap);

        sheet.appendRow(newRow);

        rowByContactId[contactId] = sheet.getLastRow();
        takenIds.add(contactId);

        let listSync = null;

        if (hasOwn_(contact, "assignedLists")) {
          listSync = syncContactAssignedLists_(contactId, contact.assignedLists);
        }

        created++;

        results.push({
          index: index,
          ok: true,
          mode: "created",
          contactId: contactId,
          listSync: listSync
        });
      } catch (err) {
        failed++;

        results.push({
          index: index,
          ok: false,
          error: String(err && err.message ? err.message : err)
        });
      }
    });

    return jsonResponse({
      ok: failed === 0,
      total: p.contacts.length,
      created: created,
      updated: updated,
      failed: failed,
      results: results
    });
  } finally {
    lock.releaseLock();
  }
}


/**
 * Build a map of contact list memberships grouped by Contact ID.
 *
 * Returns current ContactListMembers rows joined with ContactLists metadata.
 * Since ContactListMembers.Status now represents list-specific status
 * such as Prospect, Lead, or Confirmed, this does not filter by Active.
 *
 * @returns {Object} Map of contactId -> assigned list objects.
 */
function getContactListMembershipsByContactId_() {
  const memberSheet = getSheet(CONTACT_LIST_MEMBERS_TAB);
  const memberInfo = getHeaderInfo_(memberSheet, CONTACT_LIST_MEMBERS_TAB);

  requireColumns_(memberInfo.headerMap, CONTACT_LIST_MEMBERS_TAB, [
    "List ID",
    "Contact ID",
    "Status",
    "Created At",
    "Modified At"
  ]);

  const listsById = getContactListsById_();

  const idxListId = getColumnIndex_(memberInfo.headerMap, "List ID");
  const idxContactId = getColumnIndex_(memberInfo.headerMap, "Contact ID");
  const idxStatus = getColumnIndex_(memberInfo.headerMap, "Status");
  const idxCreatedAt = getColumnIndex_(memberInfo.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(memberInfo.headerMap, "Modified At");

  const values = memberSheet.getDataRange().getValues();
  const membershipsByContactId = {};

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const listId = String(row[idxListId] || "").trim();
    const contactId = String(row[idxContactId] || "").trim();

    if (!listId || !contactId) {
      continue;
    }

    const list = listsById[listId];

    if (!list) {
      continue;
    }

    if (!membershipsByContactId[contactId]) {
      membershipsByContactId[contactId] = [];
    }

    membershipsByContactId[contactId].push({
      listId: listId,
      name: list.name,
      description: list.description,
      listStatus: list.status,
      membership: {
        status: String(row[idxStatus] || ""),
        createdAt: toIsoString_(row[idxCreatedAt]),
        modifiedAt: toIsoString_(row[idxModifiedAt])
      }
    });
  }

  return membershipsByContactId;
}

/**
 * Retrieve all contacts from the Contacts tab.
 *
 * Endpoint action:
 *   readContacts
 *
 * Optional:
 *   includeLists
 *
 * Examples:
 *   ?action=readContacts
 *   ?action=readContacts&includeLists=true
 *
 * Behavior:
 *   - When includeLists is omitted or false, returns contacts only.
 *   - When includeLists=true, each contact includes its assigned lists.
 *
 * Returns:
 *   {
 *     ok: true,
 *     contacts: [...]
 *   }
 *
 * @param {*} includeLists Whether to include assigned contact lists.
 * @returns {TextOutput} JSON response.
 */
function readContacts(includeLists) {
  const contactsById = getContactsById_();
  const contacts = Object.keys(contactsById).map(contactId => contactsById[contactId]);

  if (!parseBooleanParam_(includeLists)) {
    return jsonResponse({
      ok: true,
      contacts: contacts
    });
  }

  const membershipsByContactId = getContactListMembershipsByContactId_();

  const contactsWithLists = contacts.map(contact => {
    return Object.assign({}, contact, {
      lists: membershipsByContactId[contact.contactId] || []
    });
  });

  return jsonResponse({
    ok: true,
    contacts: contactsWithLists
  });
}

/**
 * Check whether a contact exists in the Contacts tab.
 *
 * @param {string} contactId Contact ID.
 * @returns {boolean} True when the contact exists.
 */
function contactExists_(contactId) {
  const contactsById = getContactsById_();
  return hasOwn_(contactsById, String(contactId || "").trim());
}

/**
 * Build a map of contact lists by List ID.
 *
 * @returns {Object} Map of listId -> list object.
 */
function getContactListsById_() {
  const sheet = getSheet(CONTACT_LISTS_TAB);
  const info = getHeaderInfo_(sheet, CONTACT_LISTS_TAB);

  requireColumns_(info.headerMap, CONTACT_LISTS_TAB, [
    "List ID",
    "Name",
    "Description",
    "Status",
    "Created At",
    "Modified At"
  ]);

  const values = sheet.getDataRange().getValues();
  const idxListId = getColumnIndex_(info.headerMap, "List ID");
  const idxName = getColumnIndex_(info.headerMap, "Name");
  const idxDescription = getColumnIndex_(info.headerMap, "Description");
  const idxStatus = getColumnIndex_(info.headerMap, "Status");
  const idxCreatedAt = getColumnIndex_(info.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(info.headerMap, "Modified At");

  const listsById = {};

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const listId = String(row[idxListId] || "").trim();

    if (!listId) {
      continue;
    }

    listsById[listId] = {
      listId: listId,
      name: String(row[idxName] || ""),
      description: String(row[idxDescription] || ""),
      status: String(row[idxStatus] || ""),
      createdAt: toIsoString_(row[idxCreatedAt]),
      modifiedAt: toIsoString_(row[idxModifiedAt])
    };
  }

  return listsById;
}

/**
 * Check whether a contact list exists.
 *
 * @param {string} listId List ID.
 * @returns {boolean} True when the list exists.
 */
function contactListExists_(listId) {
  const listsById = getContactListsById_();
  return hasOwn_(listsById, String(listId || "").trim());
}

/**
 * Replace all list assignments for one contact.
 *
 * This is a destructive replacement:
 *   - Existing memberships not included in assignedLists are deleted.
 *   - Existing memberships included in assignedLists are updated with status.
 *   - Missing memberships are inserted.
 *
 * assignedLists format:
 *   [
 *     { listId: "list-id-1", status: "Prospect" },
 *     { listId: "list-id-2", status: "Confirmed" }
 *   ]
 *
 * @param {string} contactId Contact ID.
 * @param {Object[]} assignedLists New list assignments.
 * @returns {{added:number, updated:number, removed:number, kept:number}} Sync stats.
 */
function syncContactAssignedLists_(contactId, assignedLists) {
  if (!Array.isArray(assignedLists)) {
    throw new Error("assignedLists must be an array");
  }

  const memberSheet = getSheet(CONTACT_LIST_MEMBERS_TAB);
  const memberInfo = getHeaderInfo_(memberSheet, CONTACT_LIST_MEMBERS_TAB);

  requireColumns_(memberInfo.headerMap, CONTACT_LIST_MEMBERS_TAB, [
    "List ID",
    "Contact ID",
    "Status",
    "Created At",
    "Modified At"
  ]);

  const listsById = getContactListsById_();

  const desiredByListId = {};

  assignedLists.forEach((item, index) => {
    item = item || {};

    const listId = String(item.listId || "").trim();

    if (!listId) {
      throw new Error("assignedLists[" + index + "].listId required");
    }

    if (!hasOwn_(listsById, listId)) {
      throw new Error("assignedLists[" + index + "].listId does not exist: " + listId);
    }

    desiredByListId[listId] = {
      listId: listId,
      status: normalizeAssignmentStatus_(item.status)
    };
  });

  const idxListId = getColumnIndex_(memberInfo.headerMap, "List ID");
  const idxContactId = getColumnIndex_(memberInfo.headerMap, "Contact ID");
  const idxStatus = getColumnIndex_(memberInfo.headerMap, "Status");
  const idxModifiedAt = getColumnIndex_(memberInfo.headerMap, "Modified At");

  const values = memberSheet.getDataRange().getValues();
  const existingByListId = {};
  const rowsToDelete = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowListId = String(row[idxListId] || "").trim();
    const rowContactId = String(row[idxContactId] || "").trim();

    if (rowContactId !== contactId) {
      continue;
    }

    const sheetRow = i + 1;

    if (!hasOwn_(desiredByListId, rowListId)) {
      rowsToDelete.push(sheetRow);
      continue;
    }

    existingByListId[rowListId] = {
      rowNumber: sheetRow,
      status: String(row[idxStatus] || "").trim()
    };
  }

  const now = new Date();

  let added = 0;
  let updated = 0;
  let kept = 0;

  Object.keys(desiredByListId).forEach(listId => {
    const desired = desiredByListId[listId];
    const existing = existingByListId[listId];

    if (existing) {
      if (existing.status !== desired.status) {
        memberSheet.getRange(existing.rowNumber, idxStatus + 1).setValue(desired.status);
        memberSheet.getRange(existing.rowNumber, idxModifiedAt + 1).setValue(now);
        updated++;
      } else {
        kept++;
      }

      return;
    }

    const fieldMap = {
      "list id": desired.listId,
      "contact id": contactId,
      "status": desired.status,
      "created at": now,
      "modified at": now
    };

    const newRow = buildRowFromHeaders_(memberInfo.headers, fieldMap);

    memberSheet.appendRow(newRow);
    added++;
  });

  // Delete from bottom to top so row numbers stay valid.
  rowsToDelete.sort((a, b) => b - a).forEach(rowNumber => {
    memberSheet.deleteRow(rowNumber);
  });

  return {
    added: added,
    updated: updated,
    removed: rowsToDelete.length,
    kept: kept
  };
}

/**
 * Bulk create/update contact lists in the ContactLists tab.
 *
 * Endpoint action:
 *   saveContactLists
 *
 * Body:
 *   {
 *     action: "saveContactLists",
 *     lists: [
 *       {
 *         listId: "optional-existing-id",
 *         name: "VIP Guests",
 *         description: "High-value contacts",
 *         status: "Active"
 *       }
 *     ]
 *   }
 *
 * Behavior:
 *   - Creates lists when listId is missing or not found.
 *   - Updates lists when listId already exists.
 *   - Only provided fields are updated for existing lists.
 *   - Created At is set only on create.
 *   - Modified At is updated on create/update.
 *   - Each list is processed independently.
 *
 * Create rules:
 *   - If listId is missing, a new List ID is generated.
 *   - If listId is provided but not found, a new list is created with that ID.
 *   - name is required when creating a new list.
 *
 * Update rules:
 *   - Existing list rows are updated only with provided fields.
 *   - listId itself is not changed.
 *
 * Returns:
 *   {
 *     ok: true,
 *     total: number,
 *     created: number,
 *     updated: number,
 *     failed: number,
 *     results: [{
 *       index,
 *       ok,
 *       mode,
 *       listId,
 *       updatedFields?,
 *       error?
 *     }]
 *   }
 *
 * @param {Object} p Request payload.
 * @param {Object[]} p.lists Lists to create/update.
 * @returns {TextOutput} JSON response.
 */
function saveContactLists(p) {
  p = p || {};

  if (!Array.isArray(p.lists)) {
    return jsonResponse({
      ok: false,
      error: "lists must be an array"
    });
  }

  if (p.lists.length === 0) {
    return jsonResponse({
      ok: true,
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      results: []
    });
  }

  const sheet = getSheet(CONTACT_LISTS_TAB);
  const lock = LockService.getScriptLock();

  lock.waitLock(QUICK_LOCK_TIMEOUT_MS);

  try {
    const info = getHeaderInfo_(sheet, CONTACT_LISTS_TAB);

    requireColumns_(info.headerMap, CONTACT_LISTS_TAB, [
      "List ID",
      "Name",
      "Description",
      "Status",
      "Created At",
      "Modified At"
    ]);

    const idxListId = getColumnIndex_(info.headerMap, "List ID");
    const values = sheet.getDataRange().getValues();

    const takenIds = new Set();
    const rowByListId = {};

    for (let i = 1; i < values.length; i++) {
      const rowListId = String(values[i][idxListId] || "").trim();

      if (!rowListId) {
        continue;
      }

      takenIds.add(rowListId);
      rowByListId[rowListId] = i + 1; // 1-indexed sheet row
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    const results = [];

    p.lists.forEach((list, index) => {
      list = list || {};

      try {
        let listId = String(list.listId || "").trim();

        if (!listId) {
          listId = generateUniqueId_(takenIds);
          takenIds.add(listId);
        }

        const now = new Date();
        const existingRowNumber = rowByListId[listId] || -1;

        if (existingRowNumber > 0) {
          const updates = [];

          const addUpdate = (payloadKey, headerLabel, formatter) => {
            if (!hasOwn_(list, payloadKey)) {
              return;
            }

            const columnIndex = getColumnIndex_(info.headerMap, headerLabel);

            if (columnIndex < 0) {
              return;
            }

            const rawValue = list[payloadKey];
            const value = formatter ? formatter(rawValue) : rawValue;

            updates.push({
              columnIndex: columnIndex,
              value: value
            });
          };

          addUpdate("name", "Name");
          addUpdate("description", "Description");
          addUpdate("status", "Status");

          updates.push({
            columnIndex: getColumnIndex_(info.headerMap, "Modified At"),
            value: now
          });

          updates.forEach(update => {
            sheet
              .getRange(existingRowNumber, update.columnIndex + 1)
              .setValue(update.value);
          });

          updated++;

          results.push({
            index: index,
            ok: true,
            mode: "updated",
            listId: listId,
            updatedFields: updates.length
          });

          return;
        }

        const name = String(list.name || "").trim();

        if (!name) {
          throw new Error("name required");
        }

        const fieldMap = {
          "list id": listId,
          "name": name,
          "description": hasOwn_(list, "description") ? list.description : "",
          "status": hasOwn_(list, "status") ? list.status : "Active",
          "created at": now,
          "modified at": now
        };

        const newRow = buildRowFromHeaders_(info.headers, fieldMap);

        sheet.appendRow(newRow);

        rowByListId[listId] = sheet.getLastRow();
        takenIds.add(listId);

        created++;

        results.push({
          index: index,
          ok: true,
          mode: "created",
          listId: listId
        });
      } catch (err) {
        failed++;

        results.push({
          index: index,
          ok: false,
          error: String(err && err.message ? err.message : err)
        });
      }
    });

    return jsonResponse({
      ok: failed === 0,
      total: p.lists.length,
      created: created,
      updated: updated,
      failed: failed,
      results: results
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete a contact list and all matching contact-list membership rows.
 *
 * Endpoint action:
 *   deleteContactList
 *
 * Required:
 *   listId
 *
 * Behavior:
 *   - Deletes the matching row from ContactLists.
 *   - Deletes all rows from ContactListMembers where List ID matches listId.
 *   - Deletion is permanent; rows are not marked Inactive.
 *   - If the list row is already missing, matching membership rows are still deleted.
 *
 * Body:
 *   {
 *     action: "deleteContactList",
 *     listId: "list-id"
 *   }
 *
 * Returns:
 *   {
 *     ok: true,
 *     mode: "deleted" | "not_found",
 *     listId,
 *     deletedList,
 *     deletedMemberships
 *   }
 *
 * @param {Object} p Request payload.
 * @returns {TextOutput} JSON response.
 */
function deleteContactList(p) {
  p = p || {};

  const listId = String(p.listId || "").trim();

  if (!listId) {
    return jsonResponse({
      ok: false,
      error: "listId required"
    });
  }

  const listSheet = getSheet(CONTACT_LISTS_TAB);
  const memberSheet = getSheet(CONTACT_LIST_MEMBERS_TAB);
  const lock = LockService.getScriptLock();

  lock.waitLock(MAINTENANCE_LOCK_TIMEOUT_MS);

  try {
    const listInfo = getHeaderInfo_(listSheet, CONTACT_LISTS_TAB);

    requireColumns_(listInfo.headerMap, CONTACT_LISTS_TAB, [
      "List ID"
    ]);

    const memberInfo = getHeaderInfo_(memberSheet, CONTACT_LIST_MEMBERS_TAB);

    requireColumns_(memberInfo.headerMap, CONTACT_LIST_MEMBERS_TAB, [
      "List ID",
      "Contact ID"
    ]);

    const listIdCol = getColumnIndex_(listInfo.headerMap, "List ID");
    const memberListIdCol = getColumnIndex_(memberInfo.headerMap, "List ID");

    const listValues = listSheet.getDataRange().getValues();
    const memberValues = memberSheet.getDataRange().getValues();

    let listRowToDelete = -1;
    const membershipRowsToDelete = [];

    // Find the ContactLists row.
    for (let i = 1; i < listValues.length; i++) {
      const rowListId = String(listValues[i][listIdCol] || "").trim();

      if (rowListId === listId) {
        listRowToDelete = i + 1; // 1-indexed sheet row
        break;
      }
    }

    // Find all ContactListMembers rows for this list.
    for (let i = 1; i < memberValues.length; i++) {
      const rowListId = String(memberValues[i][memberListIdCol] || "").trim();

      if (rowListId === listId) {
        membershipRowsToDelete.push(i + 1); // 1-indexed sheet row
      }
    }

    // Delete membership rows first, bottom-up.
    membershipRowsToDelete
      .sort((a, b) => b - a)
      .forEach(rowNumber => {
        memberSheet.deleteRow(rowNumber);
      });

    // Delete the list row.
    let deletedList = false;

    if (listRowToDelete > 0) {
      listSheet.deleteRow(listRowToDelete);
      deletedList = true;
    }

    return jsonResponse({
      ok: true,
      mode: deletedList ? "deleted" : "not_found",
      listId: listId,
      deletedList: deletedList,
      deletedMemberships: membershipRowsToDelete.length
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Retrieve all contact lists.
 *
 * @returns {TextOutput} JSON response.
 */
function readContactLists() {
  const listsById = getContactListsById_();
  const lists = Object.keys(listsById).map(listId => listsById[listId]);

  return jsonResponse({
    ok: true,
    lists: lists
  });
}

/**
 * Retrieve all active contacts assigned to a list.
 *
 * @param {string} listId List ID.
 * @returns {TextOutput} JSON response.
 */
function readContactsByList(listId) {
  listId = String(listId || "").trim();

  if (!listId) {
    return jsonResponse({
      ok: false,
      error: "listId required"
    });
  }

  const membersSheet = getSheet(CONTACT_LIST_MEMBERS_TAB);
  const membersInfo = getHeaderInfo_(membersSheet, CONTACT_LIST_MEMBERS_TAB);

  requireColumns_(membersInfo.headerMap, CONTACT_LIST_MEMBERS_TAB, [
    "List ID",
    "Contact ID",
    "Status",
    "Created At",
    "Modified At"
  ]);

  const idxListId = getColumnIndex_(membersInfo.headerMap, "List ID");
  const idxContactId = getColumnIndex_(membersInfo.headerMap, "Contact ID");
  const idxStatus = getColumnIndex_(membersInfo.headerMap, "Status");
  const idxCreatedAt = getColumnIndex_(membersInfo.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(membersInfo.headerMap, "Modified At");

  const membersValues = membersSheet.getDataRange().getValues();
  const contactsById = getContactsById_();
  const contacts = [];

  for (let i = 1; i < membersValues.length; i++) {
    const row = membersValues[i];
    const rowListId = String(row[idxListId] || "").trim();
    const rowContactId = String(row[idxContactId] || "").trim();
    const rowStatus = String(row[idxStatus] || "").trim();

    if (rowListId !== listId || rowStatus !== "Active") {
      continue;
    }

    const contact = contactsById[rowContactId];

    if (!contact) {
      continue;
    }

    const contactWithMembership = Object.assign({}, contact, {
      membership: {
        listId: rowListId,
        contactId: rowContactId,
        status: rowStatus,
        createdAt: toIsoString_(row[idxCreatedAt]),
        modifiedAt: toIsoString_(row[idxModifiedAt])
      }
    });

    contacts.push(contactWithMembership);
  }

  return jsonResponse({
    ok: true,
    listId: listId,
    contacts: contacts
  });
}

/**
 * Retrieve all active lists assigned to a contact.
 *
 * @param {string} contactId Contact ID.
 * @returns {TextOutput} JSON response.
 */
function readListsForContact(contactId) {
  contactId = String(contactId || "").trim();

  if (!contactId) {
    return jsonResponse({
      ok: false,
      error: "contactId required"
    });
  }

  const membersSheet = getSheet(CONTACT_LIST_MEMBERS_TAB);
  const membersInfo = getHeaderInfo_(membersSheet, CONTACT_LIST_MEMBERS_TAB);

  requireColumns_(membersInfo.headerMap, CONTACT_LIST_MEMBERS_TAB, [
    "List ID",
    "Contact ID",
    "Status",
    "Created At",
    "Modified At"
  ]);

  const idxListId = getColumnIndex_(membersInfo.headerMap, "List ID");
  const idxContactId = getColumnIndex_(membersInfo.headerMap, "Contact ID");
  const idxStatus = getColumnIndex_(membersInfo.headerMap, "Status");
  const idxCreatedAt = getColumnIndex_(membersInfo.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(membersInfo.headerMap, "Modified At");

  const membersValues = membersSheet.getDataRange().getValues();
  const listsById = getContactListsById_();
  const lists = [];

  for (let i = 1; i < membersValues.length; i++) {
    const row = membersValues[i];
    const rowListId = String(row[idxListId] || "").trim();
    const rowContactId = String(row[idxContactId] || "").trim();
    const rowStatus = String(row[idxStatus] || "").trim();

    if (rowContactId !== contactId || rowStatus !== "Active") {
      continue;
    }

    const list = listsById[rowListId];

    if (!list) {
      continue;
    }

    const listWithMembership = Object.assign({}, list, {
      membership: {
        listId: rowListId,
        contactId: rowContactId,
        status: rowStatus,
        createdAt: toIsoString_(row[idxCreatedAt]),
        modifiedAt: toIsoString_(row[idxModifiedAt])
      }
    });

    lists.push(listWithMembership);
  }

  return jsonResponse({
    ok: true,
    contactId: contactId,
    lists: lists
  });
}

// ----------------------------------------------------------------------------
// === INIT

/**
 * Initialize the Google Sheet schema for the app.
 *
 * Endpoint action:
 *   initSchema
 *
 * Behavior:
 *   - Creates missing tabs.
 *   - Adds headers to empty tabs.
 *   - Adds missing columns to existing tabs.
 *   - Does not delete existing columns.
 *   - Does not reorder existing columns.
 *   - Migrates EventsAttendees column "Comment" to "Note" when needed.
 *
 * @returns {TextOutput} JSON response with setup details.
 */
function initSchema() {
  const lock = LockService.getScriptLock();

  lock.waitLock(MAINTENANCE_LOCK_TIMEOUT_MS);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = [];

    Object.keys(SHEET_SCHEMAS).forEach(tabName => {
      const result = ensureSheetSchema_(ss, tabName, SHEET_SCHEMAS[tabName]);
      results.push(result);
    });

    return jsonResponse({
      ok: true,
      initialized: true,
      tabs: results
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ensure a single sheet tab exists and has the required columns.
 *
 * This function is intentionally non-destructive. It will not remove, reorder,
 * or overwrite existing data. Missing columns are appended to the right.
 *
 * @param {Spreadsheet} ss Active spreadsheet.
 * @param {string} tabName Sheet tab name.
 * @param {string[]} requiredHeaders Required headers for the tab.
 * @returns {Object} Setup result for the tab.
 */
function ensureSheetSchema_(ss, tabName, requiredHeaders) {
  let sheet = ss.getSheetByName(tabName);
  let created = false;
  let initializedHeaders = false;
  const addedColumns = [];
  const renamedColumns = [];

  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    created = true;
  }

  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    formatHeaderRow_(sheet, requiredHeaders.length);

    return {
      tabName: tabName,
      created: created,
      initializedHeaders: true,
      addedColumns: requiredHeaders,
      renamedColumns: []
    };
  }

  let existingHeaders = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(value => String(value || "").trim());

  const hasAnyHeader = existingHeaders.some(header => header);

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    formatHeaderRow_(sheet, requiredHeaders.length);

    return {
      tabName: tabName,
      created: created,
      initializedHeaders: true,
      addedColumns: requiredHeaders,
      renamedColumns: []
    };
  }

  // One-time migration for EventsAttendees: Comment -> Note
  if (tabName === ATTENDEES_TAB) {
    const commentIndex = findHeaderIndex_(existingHeaders, "Comment");
    const noteIndex = findHeaderIndex_(existingHeaders, "Note");

    if (commentIndex >= 0 && noteIndex < 0) {
      sheet.getRange(1, commentIndex + 1).setValue("Note");
      existingHeaders[commentIndex] = "Note";
      renamedColumns.push("Comment -> Note");
    }
  }

  const existingHeaderKeys = new Set(existingHeaders.map(normalizeHeader_));

  requiredHeaders.forEach(header => {
    const key = normalizeHeader_(header);

    if (!existingHeaderKeys.has(key)) {
      const newColumn = sheet.getLastColumn() + 1;
      sheet.getRange(1, newColumn).setValue(header);

      existingHeaderKeys.add(key);
      addedColumns.push(header);
    }
  });

  formatHeaderRow_(sheet, sheet.getLastColumn());

  return {
    tabName: tabName,
    created: created,
    initializedHeaders: initializedHeaders,
    addedColumns: addedColumns,
    renamedColumns: renamedColumns
  };
}

/**
 * Find a header index by case-insensitive header name.
 *
 * @param {string[]} headers Header row values.
 * @param {string} label Header label to find.
 * @returns {number} Zero-based index, or -1 if not found.
 */
function findHeaderIndex_(headers, label) {
  const target = normalizeHeader_(label);

  for (let i = 0; i < headers.length; i++) {
    if (normalizeHeader_(headers[i]) === target) {
      return i;
    }
  }

  return -1;
}

/**
 * Apply basic formatting to the header row.
 *
 * @param {Sheet} sheet Sheet tab.
 * @param {number} columnCount Number of header columns.
 */
function formatHeaderRow_(sheet, columnCount) {
  if (columnCount < 1) {
    return;
  }

  const headerRange = sheet.getRange(1, 1, 1, columnCount);

  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

// ----------------------------------------------------------------------------
// === SNAPSHOTS


/**
 * Return the Drive folder used for large gzipped snapshots.
 *
 * If SNAPSHOT_DRIVE_FOLDER_ID is blank, files are saved in the user's
 * My Drive root folder.
 *
 * @returns {Folder} Google Drive folder.
 */
function getSnapshotDriveFolder_() {
  const folderId = String(SNAPSHOT_DRIVE_FOLDER_ID || "").trim();

  if (folderId) {
    return DriveApp.getFolderById(folderId);
  }

  return DriveApp.getRootFolder();
}

/**
 * Create a safe filename part.
 *
 * @param {*} value Raw value.
 * @returns {string} Safe filename segment.
 */
function safeFileNamePart_(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Build the Drive filename for a snapshot gzip file.
 *
 * @param {string} snapshotId Snapshot ID.
 * @param {string} snapshotType Snapshot type.
 * @param {string} snapshotName Snapshot name.
 * @returns {string} Filename.
 */
function buildSnapshotDriveFileName_(snapshotId, snapshotType, snapshotName) {
  const typePart = safeFileNamePart_(snapshotType) || "custom";
  const namePart = safeFileNamePart_(snapshotName) || "snapshot";
  const idPart = safeFileNamePart_(snapshotId);

  return typePart + "-" + namePart + "-" + idPart + ".json.gz";
}

/**
 * Save a JSON string as a gzipped file in Google Drive.
 *
 * @param {string} payloadJson JSON string.
 * @param {string} snapshotId Snapshot ID.
 * @param {string} snapshotType Snapshot type.
 * @param {string} snapshotName Snapshot name.
 * @returns {{driveFileId:string, compressedSize:number}} Drive file metadata.
 */
function createGzippedSnapshotFile_(payloadJson, snapshotId, snapshotType, snapshotName) {
  const fileName = buildSnapshotDriveFileName_(snapshotId, snapshotType, snapshotName);
  const jsonFileName = fileName.replace(/\.gz$/, "");

  const jsonBlob = Utilities.newBlob(payloadJson, "application/json", jsonFileName);
  const gzipBlob = Utilities.gzip(jsonBlob, fileName);

  const folder = getSnapshotDriveFolder_();
  const file = folder.createFile(gzipBlob);

  return {
    driveFileId: file.getId(),
    compressedSize: gzipBlob.getBytes().length
  };
}

/**
 * Read and ungzip a snapshot file from Google Drive.
 *
 * @param {string} driveFileId Google Drive file ID.
 * @returns {string} Original JSON string.
 */
function readGzippedSnapshotFile_(driveFileId) {
  const file = DriveApp.getFileById(driveFileId);
  const gzipBlob = file.getBlob();
  const jsonBlob = Utilities.ungzip(gzipBlob);

  return jsonBlob.getDataAsString();
}

/**
 * Trash a Drive file if it exists.
 *
 * Used when replacing a drive_gzip snapshot with a new payload.
 * Failure is ignored so the snapshot save does not fail because of cleanup.
 *
 * @param {string} driveFileId Google Drive file ID.
 */
function trashDriveFileIfExists_(driveFileId) {
  driveFileId = String(driveFileId || "").trim();

  if (!driveFileId) {
    return;
  }

  try {
    DriveApp.getFileById(driveFileId).setTrashed(true);
  } catch (err) {
    // Ignore cleanup errors.
  }
}

/**
 * Prepare snapshot storage.
 *
 * Small payloads are stored directly in the sheet.
 * Large payloads are gzipped and stored in Drive.
 *
 * @param {string} payloadJson JSON payload string.
 * @param {string} snapshotId Snapshot ID.
 * @param {string} snapshotType Snapshot type.
 * @param {string} snapshotName Snapshot name.
 * @returns {{storageMode:string,payloadJson:string,driveFileId:string,payloadSize:number,compressedSize:number}}
 */
function prepareSnapshotStorage_(payloadJson, snapshotId, snapshotType, snapshotName) {
  const payloadSize = payloadJson.length;

  if (payloadSize <= SNAPSHOT_SHEET_MAX_CHARS) {
    return {
      storageMode: "sheet",
      payloadJson: payloadJson,
      driveFileId: "",
      payloadSize: payloadSize,
      compressedSize: 0
    };
  }

  const driveInfo = createGzippedSnapshotFile_(
    payloadJson,
    snapshotId,
    snapshotType,
    snapshotName
  );

  return {
    storageMode: "drive_gzip",
    payloadJson: "",
    driveFileId: driveInfo.driveFileId,
    payloadSize: payloadSize,
    compressedSize: driveInfo.compressedSize
  };
}

/**
 * Save arbitrary client-sent JSON as a data snapshot.
 *
 * Endpoint action:
 *   saveDataSnapshot
 *
 * Required:
 *   data
 *
 * Optional:
 *   snapshotType
 *   snapshotName
 *   snapshotMode
 *   note
 *
 * snapshotMode:
 *   append   Always creates a new snapshot row. Default.
 *   replace  Updates an existing row by Snapshot Type + Snapshot Name.
 *            If no matching row exists, creates a new snapshot.
 *
 * Storage behavior:
 *   - Small JSON is stored in Payload JSON.
 *   - Large JSON is gzipped and stored in Google Drive.
 *   - The sheet always stores metadata.
 *
 * Body:
 *   {
 *     action: "saveDataSnapshot",
 *     snapshotType: "form_state",
 *     snapshotName: "Form Builder State",
 *     snapshotMode: "replace",
 *     data: { "any": "json" },
 *     note: "Optional note"
 *   }
 *
 * Returns:
 *   {
 *     ok,
 *     mode,
 *     snapshotId,
 *     snapshotType,
 *     snapshotName,
 *     storageMode,
 *     payloadSize,
 *     compressedSize,
 *     createdAt?,
 *     modifiedAt?
 *   }
 *
 * @param {Object} p Request payload.
 * @returns {TextOutput} JSON response.
 */
function saveDataSnapshot(p) {
  p = p || {};

  if (!hasOwn_(p, "data")) {
    return jsonResponse({
      ok: false,
      error: "data required"
    });
  }

  const sheet = getSheet(DATA_SNAPSHOTS_TAB);
  const lock = LockService.getScriptLock();

  lock.waitLock(QUICK_LOCK_TIMEOUT_MS);

  try {
    const info = getHeaderInfo_(sheet, DATA_SNAPSHOTS_TAB);

    requireColumns_(info.headerMap, DATA_SNAPSHOTS_TAB, [
      "Snapshot ID",
      "Snapshot Type",
      "Snapshot Name",
      "Storage Mode",
      "Payload JSON",
      "Drive File ID",
      "Payload Size",
      "Compressed Size",
      "Created At",
      "Modified At",
      "Note"
    ]);

    const snapshotType = String(p.snapshotType || "custom").trim() || "custom";
    const snapshotName = String(p.snapshotName || "").trim();
    const snapshotMode = String(p.snapshotMode || "append").trim().toLowerCase();

    if (snapshotMode !== "append" && snapshotMode !== "replace") {
      return jsonResponse({
        ok: false,
        error: "snapshotMode must be append or replace"
      });
    }

    if (snapshotMode === "replace" && !snapshotName) {
      return jsonResponse({
        ok: false,
        error: "snapshotName required when snapshotMode is replace"
      });
    }

    const payloadJson = JSON.stringify(p.data);

    if (typeof payloadJson !== "string") {
      return jsonResponse({
        ok: false,
        error: "data must be JSON serializable"
      });
    }

    const now = new Date();

    const idxSnapshotId = getColumnIndex_(info.headerMap, "Snapshot ID");
    const idxSnapshotType = getColumnIndex_(info.headerMap, "Snapshot Type");
    const idxSnapshotName = getColumnIndex_(info.headerMap, "Snapshot Name");
    const idxStorageMode = getColumnIndex_(info.headerMap, "Storage Mode");
    const idxPayloadJson = getColumnIndex_(info.headerMap, "Payload JSON");
    const idxDriveFileId = getColumnIndex_(info.headerMap, "Drive File ID");
    const idxPayloadSize = getColumnIndex_(info.headerMap, "Payload Size");
    const idxCompressedSize = getColumnIndex_(info.headerMap, "Compressed Size");
    const idxModifiedAt = getColumnIndex_(info.headerMap, "Modified At");
    const idxNote = getColumnIndex_(info.headerMap, "Note");

    const values = sheet.getDataRange().getValues();

    if (snapshotMode === "replace") {
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const rowType = String(row[idxSnapshotType] || "").trim();
        const rowName = String(row[idxSnapshotName] || "").trim();

        if (rowType !== snapshotType || rowName !== snapshotName) {
          continue;
        }

        const sheetRow = i + 1;
        let snapshotId = String(row[idxSnapshotId] || "").trim();

        if (!snapshotId) {
          snapshotId = uid();
          sheet.getRange(sheetRow, idxSnapshotId + 1).setValue(snapshotId);
        }

        const oldDriveFileId = String(row[idxDriveFileId] || "").trim();

        const storage = prepareSnapshotStorage_(
          payloadJson,
          snapshotId,
          snapshotType,
          snapshotName
        );

        sheet.getRange(sheetRow, idxStorageMode + 1).setValue(storage.storageMode);
        sheet.getRange(sheetRow, idxPayloadJson + 1).setValue(storage.payloadJson);
        sheet.getRange(sheetRow, idxDriveFileId + 1).setValue(storage.driveFileId);
        sheet.getRange(sheetRow, idxPayloadSize + 1).setValue(storage.payloadSize);
        sheet.getRange(sheetRow, idxCompressedSize + 1).setValue(storage.compressedSize);
        sheet.getRange(sheetRow, idxModifiedAt + 1).setValue(now);

        if (hasOwn_(p, "note")) {
          sheet.getRange(sheetRow, idxNote + 1).setValue(p.note);
        }

        if (oldDriveFileId && oldDriveFileId !== storage.driveFileId) {
          trashDriveFileIfExists_(oldDriveFileId);
        }

        return jsonResponse({
          ok: true,
          mode: "replaced",
          snapshotId: snapshotId,
          snapshotType: snapshotType,
          snapshotName: snapshotName,
          storageMode: storage.storageMode,
          payloadSize: storage.payloadSize,
          compressedSize: storage.compressedSize,
          modifiedAt: now.toISOString()
        });
      }
    }

    const snapshotId = uid();

    const storage = prepareSnapshotStorage_(
      payloadJson,
      snapshotId,
      snapshotType,
      snapshotName
    );

    const fieldMap = {
      "snapshot id": snapshotId,
      "snapshot type": snapshotType,
      "snapshot name": snapshotName,
      "storage mode": storage.storageMode,
      "payload json": storage.payloadJson,
      "drive file id": storage.driveFileId,
      "payload size": storage.payloadSize,
      "compressed size": storage.compressedSize,
      "created at": now,
      "modified at": now,
      "note": p.note || ""
    };

    const newRow = buildRowFromHeaders_(info.headers, fieldMap);

    sheet.appendRow(newRow);

    return jsonResponse({
      ok: true,
      mode: "created",
      snapshotId: snapshotId,
      snapshotType: snapshotType,
      snapshotName: snapshotName,
      storageMode: storage.storageMode,
      payloadSize: storage.payloadSize,
      compressedSize: storage.compressedSize,
      createdAt: now.toISOString(),
      modifiedAt: now.toISOString()
    });
  } finally {
    lock.releaseLock();
  }
}


/**
 * Read snapshot metadata.
 *
 * Endpoint action:
 *   readDataSnapshots
 *
 * This does not return the full payload data.
 *
 * @returns {TextOutput} JSON response.
 */
function readDataSnapshots() {
  const sheet = getSheet(DATA_SNAPSHOTS_TAB);
  const info = getHeaderInfo_(sheet, DATA_SNAPSHOTS_TAB);

  requireColumns_(info.headerMap, DATA_SNAPSHOTS_TAB, [
    "Snapshot ID",
    "Snapshot Type",
    "Snapshot Name",
    "Storage Mode",
    "Drive File ID",
    "Payload Size",
    "Compressed Size",
    "Created At",
    "Modified At",
    "Note"
  ]);

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return jsonResponse({
      ok: true,
      snapshots: []
    });
  }

  const idxSnapshotId = getColumnIndex_(info.headerMap, "Snapshot ID");
  const idxSnapshotType = getColumnIndex_(info.headerMap, "Snapshot Type");
  const idxSnapshotName = getColumnIndex_(info.headerMap, "Snapshot Name");
  const idxStorageMode = getColumnIndex_(info.headerMap, "Storage Mode");
  const idxDriveFileId = getColumnIndex_(info.headerMap, "Drive File ID");
  const idxPayloadSize = getColumnIndex_(info.headerMap, "Payload Size");
  const idxCompressedSize = getColumnIndex_(info.headerMap, "Compressed Size");
  const idxCreatedAt = getColumnIndex_(info.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(info.headerMap, "Modified At");
  const idxNote = getColumnIndex_(info.headerMap, "Note");

  const snapshots = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const snapshotId = String(row[idxSnapshotId] || "").trim();

    if (!snapshotId) {
      continue;
    }

    snapshots.push({
      snapshotId: snapshotId,
      snapshotType: String(row[idxSnapshotType] || ""),
      snapshotName: String(row[idxSnapshotName] || ""),
      storageMode: String(row[idxStorageMode] || ""),
      driveFileId: String(row[idxDriveFileId] || ""),
      payloadSize: row[idxPayloadSize] || 0,
      compressedSize: row[idxCompressedSize] || 0,
      createdAt: toIsoString_(row[idxCreatedAt]),
      modifiedAt: toIsoString_(row[idxModifiedAt]),
      note: String(row[idxNote] || "")
    });
  }

  return jsonResponse({
    ok: true,
    snapshots: snapshots
  });
}

/**
 * Read one snapshot and return its parsed data.
 *
 * Endpoint action:
 *   readDataSnapshot
 *
 * Required:
 *   snapshotId
 *
 * Example:
 *   ?action=readDataSnapshot&snapshotId=abc123
 *
 * @param {string} snapshotId Snapshot ID.
 * @returns {TextOutput} JSON response.
 */
function readDataSnapshot(snapshotId) {
  snapshotId = String(snapshotId || "").trim();

  if (!snapshotId) {
    return jsonResponse({
      ok: false,
      error: "snapshotId required"
    });
  }

  const sheet = getSheet(DATA_SNAPSHOTS_TAB);
  const info = getHeaderInfo_(sheet, DATA_SNAPSHOTS_TAB);

  requireColumns_(info.headerMap, DATA_SNAPSHOTS_TAB, [
    "Snapshot ID",
    "Snapshot Type",
    "Snapshot Name",
    "Storage Mode",
    "Payload JSON",
    "Drive File ID",
    "Payload Size",
    "Compressed Size",
    "Created At",
    "Modified At",
    "Note"
  ]);

  const values = sheet.getDataRange().getValues();

  const idxSnapshotId = getColumnIndex_(info.headerMap, "Snapshot ID");
  const idxSnapshotType = getColumnIndex_(info.headerMap, "Snapshot Type");
  const idxSnapshotName = getColumnIndex_(info.headerMap, "Snapshot Name");
  const idxStorageMode = getColumnIndex_(info.headerMap, "Storage Mode");
  const idxPayloadJson = getColumnIndex_(info.headerMap, "Payload JSON");
  const idxDriveFileId = getColumnIndex_(info.headerMap, "Drive File ID");
  const idxPayloadSize = getColumnIndex_(info.headerMap, "Payload Size");
  const idxCompressedSize = getColumnIndex_(info.headerMap, "Compressed Size");
  const idxCreatedAt = getColumnIndex_(info.headerMap, "Created At");
  const idxModifiedAt = getColumnIndex_(info.headerMap, "Modified At");
  const idxNote = getColumnIndex_(info.headerMap, "Note");

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowSnapshotId = String(row[idxSnapshotId] || "").trim();

    if (rowSnapshotId !== snapshotId) {
      continue;
    }

    const storageMode = String(row[idxStorageMode] || "").trim();
    const driveFileId = String(row[idxDriveFileId] || "").trim();

    let payloadJson = "";

    if (storageMode === "sheet") {
      payloadJson = String(row[idxPayloadJson] || "");
    } else if (storageMode === "drive_gzip") {
      if (!driveFileId) {
        return jsonResponse({
          ok: false,
          error: "Snapshot is missing Drive File ID"
        });
      }

      payloadJson = readGzippedSnapshotFile_(driveFileId);
    } else {
      return jsonResponse({
        ok: false,
        error: "Unknown snapshot storage mode: " + storageMode
      });
    }

    let data = null;

    try {
      data = JSON.parse(payloadJson);
    } catch (err) {
      return jsonResponse({
        ok: false,
        error: "Snapshot payload is not valid JSON"
      });
    }

    return jsonResponse({
      ok: true,
      snapshot: {
        snapshotId: rowSnapshotId,
        snapshotType: String(row[idxSnapshotType] || ""),
        snapshotName: String(row[idxSnapshotName] || ""),
        storageMode: storageMode,
        driveFileId: driveFileId,
        payloadSize: row[idxPayloadSize] || 0,
        compressedSize: row[idxCompressedSize] || 0,
        createdAt: toIsoString_(row[idxCreatedAt]),
        modifiedAt: toIsoString_(row[idxModifiedAt]),
        note: String(row[idxNote] || ""),
        data: data
      }
    });
  }

  return jsonResponse({
    ok: false,
    error: "Snapshot not found"
  });
}

// == EOF