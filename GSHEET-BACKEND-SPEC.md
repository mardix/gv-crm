
 ============================================================================
  LLX - Events Manager + TheDoorApp — Apps Script Backend
 ============================================================================

  HTTP API for the event/contact manager and party-admission web app.
  Data is stored in Google Sheets tabs. Column order can change because
  columns are looked up by header name.


  Tab: "Contacts"
    CRM-style contact table.

    Required columns:
      Contact ID, Name, Phone, Email, Status, Category,
      Membership Status, Membership Level, Gender, Location,
      Lead Source, Handle, Note, Created At, Modified At

    Status values:
      Active, Inactive, Review, Banned

    Category values:
      Regular, VIP

    Membership Status values:
      Active, Inactive, Review, Banned

    Membership Level values:
      Basic, Plus, Pro

  Tab: "ContactLists"
    Contact list/group table.

    Required columns:
      List ID, Name, Description, Status, Created At, Modified At

    Status values:
      Active, Inactive

  Tab: "ContactListMembers"
    Many-to-many assignments between contacts and lists.

    Required columns:
      List ID, Contact ID, Status, Created At, Modified At

    Status values:
      Active, Inactive

  Tab: "DataSnapshots"
    Stores arbitrary JSON snapshots sent by the client.

    Required columns:
      Snapshot ID, Snapshot Type, Snapshot Name, Payload JSON,
      Payload Size, Created At, Modified At, Note

  ─── API FIELD NAMES ───────────────────────────────────────────────────────

  Use canonical camelCase API fields only.

  Event attendee fields:
    eventId, attendeeCode, guestCount, attendeeRole, name, phone, email,
    paymentStatus, paymentAmount, paymentMethod, category, handle, note

  Event admission fields:
    eventId, attendeeCode, op, admittedCount, admittedAt, deviceId

  Contact fields:
    contactId, name, phone, email, status, category, membershipStatus,
    membershipLevel, gender, location, leadSource, handle, note

  Contact list fields:
    listId, name, description, status

  Contact-list membership fields:
    listId, contactId

  Data snapshot fields:
    snapshotId, snapshotType, snapshotName, snapshotMode, data, note

REQUEST 

  POST requests should use:
    Content-Type: text/plain

  The body is still JSON. This avoids Apps Script CORS preflight issues.

  ─── RESPONSE SHAPE ────────────────────────────────────────────────────────

  Success:
    { ok: true, ... }

  Error:
    { ok: false, error: "<message>" }


  ─── CONTACT ENDPOINTS ─────────────────────────────────────────────────────

  saveContact
    Method: POST
    Creates or updates a contact.

    Body:
      {
        action: "saveContact",
        contactId: "optional-existing-id",
        name: "Sarah Chen",
        phone: "7045551234",
        email: "sarah@example.com",
        status: "Active",
        category: "VIP",
        membershipStatus: "Active",
        membershipLevel: "Basic",
        gender: "Female",
        location: "Charlotte",
        leadSource: "Event RSVP",
        handle: "sarahchen",
        note: "Met at event"
      }

    Behavior:
      If contactId is missing, it is generated automatically.
      If contactId exists, only provided fields are updated.
      If contactId does not exist, a new contact is created with that ID.
      Created At is set on create. Modified At is updated on create/update.

    Returns:
      { ok, mode, contactId, updatedFields? }

  readContacts
    Method: GET
    Returns all contacts.

    Params:
      includeLists optional

    Examples:
      ?action=readContacts
      ?action=readContacts&includeLists=true

    Behavior:
      By default, returns contacts only.
      When includeLists=true, each contact includes assigned lists.

    Returns:
      {
        ok,
        contacts: [
          {
            contactId,
            name,
            phone,
            email,
            status,
            category,
            membershipStatus,
            membershipLevel,
            gender,
            location,
            leadSource,
            handle,
            note,
            createdAt,
            modifiedAt,
            lists?: [
              {
                listId,
                name,
                description,
                listStatus,
                membership: {
                  status,
                  createdAt,
                  modifiedAt
                }
              }
            ]
          }
        ]
      }

  ─── CONTACT LIST ENDPOINTS ────────────────────────────────────────────────


 saveContacts
   Method: POST
   Bulk creates or updates contacts.
   Body:
     {
       action: "saveContacts",
       contacts: [
         {
           contactId: "optional-existing-id",
           name: "Sarah Chen",
           phone: "7045551234",
           email: "sarah@example.com",
           status: "Active",
           category: "VIP",
           membershipStatus: "Active",
           membershipLevel: "Basic",
           gender: "Female",
           location: "Charlotte",
           leadSource: "CSV Import",
           handle: "sarahchen",
           note: "Imported contact",
           assignedLists: [
             { listId: "vip-list-id", status: "Prospect" }
           ]
         }
       ]
     }

   Behavior:
     Each contact is processed independently.
     Missing contactId creates a new contact.
     Existing contactId updates that contact.
     Unknown contactId creates a new contact with that ID.
     assignedLists is optional.
     If assignedLists is omitted, list assignments are not changed.
     If assignedLists is [], all assignments for that contact are deleted.
     If assignedLists has items, assignments are replaced with that set.

   Returns:
     {
       ok,
       total,
       created,
       updated,
       failed,
       results: [...]
     }

 deleteContactList
   Method: POST
   Permanently deletes a contact list and all matching membership rows.

   Body:
     {
       action: "deleteContactList",
       listId: "list-id"
     }

   Behavior:
     Deletes the matching row from ContactLists.
     Deletes all ContactListMembers rows where List ID matches listId.
     Rows are deleted permanently, not marked Inactive.
     If the list row is missing, matching membership rows are still deleted.

   Returns:
     {
       ok,
       mode: "deleted" | "not_found",
       listId,
       deletedList,
       deletedMemberships
     }
 
 ---

  readContactLists
    Method: GET

    Example:
      ?action=readContactLists

    Returns:
      { ok, lists: [...] }

  assignContactToList
    Method: POST
    Assigns one contact to one list.

    Body:
      {
        action: "assignContactToList",
        listId: "list-id",
        contactId: "contact-id"
      }

    Behavior:
      Creates an Active membership.
      If the membership already exists as Inactive, it is reactivated.
      Duplicate Active memberships are not added.

    Returns:
      { ok, mode, listId, contactId }

  removeContactFromList
    Method: POST
    Marks a contact/list membership as Inactive.

    Body:
      {
        action: "removeContactFromList",
        listId: "list-id",
        contactId: "contact-id"
      }

    Returns:
      { ok, mode, listId, contactId }

  readContactsByList
    Method: GET

    Example:
      ?action=readContactsByList&listId=LIST_ID

    Returns:
      { ok, listId, contacts: [{ ...contact, membership }] }

  readListsForContact
    Method: GET

    Example:
      ?action=readListsForContact&contactId=CONTACT_ID

    Returns:
      { ok, contactId, lists: [{ ...list, membership }] }

 saveContactLists
   Method: POST
   Bulk creates or updates contact lists.

   Body:
     {
       action: "saveContactLists",
       lists: [
         {
           listId: "optional-existing-id",
           name: "VIP Guests",
           description: "High-value contacts",
           status: "Active"
         },
         {
           name: "Charlotte Leads",
           description: "People from Charlotte events",
           status: "Active"
         }
       ]
     }

   Behavior:
     Each list is processed independently.
     Missing listId creates a new list.
     Existing listId updates that list.
     Unknown listId creates a new list with that ID.
     Only provided fields are updated on existing lists.
     Created At is set on create.
     Modified At is updated on create/update.

   Create rules:
     name is required when creating a new list.
     status defaults to "Active" when omitted.

   Update rules:
     listId itself is not changed.
     name, description, and status can be updated.

   Status values:
     Active, Inactive

   Returns:
     {
       ok,
       total,
       created,
       updated,
       failed,
       results: [
         {
           index,
           ok,
           mode: "created" | "updated",
           listId,
           updatedFields?
         },
         {
           index,
           ok: false,
           error
         }
       ]
     }
 
  ─── DATA SNAPSHOT ENDPOINTS ───────────────────────────────────────────────

  saveDataSnapshot
    Method: POST
    Stores arbitrary JSON sent by the client.
    It does not read current sheet data automatically.

    Body:
      {
        action: "saveDataSnapshot",
        snapshotType: "form_state",
        snapshotName: "Form Builder State",
        snapshotMode: "append",
        data: { "any": "json" },
        note: "Optional note"
      }

    snapshotMode:
      append   Always creates a new snapshot row. Default.
      replace  Updates existing row by Snapshot Type + Snapshot Name.
               If no match exists, creates a new row.

    Returns:
      { ok, mode, snapshotId, snapshotType, snapshotName, payloadSize, createdAt?, modifiedAt? }

  readDataSnapshots
    Method: GET
    Returns snapshot metadata only, not full payload JSON.

    Example:
      ?action=readDataSnapshots

    Returns:
      { ok, snapshots: [...] }

  readDataSnapshot
    Method: GET
    Returns one snapshot with parsed data.

    Example:
      ?action=readDataSnapshot&snapshotId=SNAPSHOT_ID

    Returns:
      { ok, snapshot: { snapshotId, snapshotType, snapshotName, payloadSize, createdAt, modifiedAt, note, data } }

  ─── DESIGN NOTES ──────────────────────────────────────────────────────────


  Contacts and lists:
    Contacts can belong to multiple lists through ContactListMembers.
    Membership rows are marked Inactive instead of deleted.

  Snapshots:
    DataSnapshots stores client-sent JSON. For very large payloads, use
    chunking or Google Drive storage instead of one large sheet cell.

 ============================================================================
