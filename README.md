# CSOD Email Review Summary

A userscript for **Cornerstone OnDemand (CSOD)** administrators. It reads the email template you have open and builds an editable, reviewer-ready summary of its settings and content at the bottom of the page. Copy it into Outlook, Teams, or Word, or download it as a Word document. Send it to a stakeholder, and they can mark up revisions and return it. When the revisions come back, you can apply content changes straight to the Cornerstone message editor.

No more screenshots or copying fields by hand to get an email template reviewed.

---

## Features

### Email template summary
When an individual email is open for editing, the summary includes:

- **Title and subtitle**: the email title, with the email action (for example, *Assign Training* or *Training is Due*) on its own line
- **Overview**: Learning Object, Prepared by, Generated date/time, and Page URL
- **Email Settings** table:
  - Email Title (shown in **bold**)
  - Active
  - From Address
  - Reply-To Address
  - Type (reminder timing included, for example *Reminder – 14 day(s), 0 hour(s), 0 min(s) After Event*)
  - Default Language
  - Send To and Cc (each recipient on its own line, labeled **(role)** or **(user)**)
  - Availability Criteria (each criterion, with whether *Include Subordinates* is checked)
  - Subject (shown in **bold**)
- **Notification Content**: the formatted email body, including unsaved edits in the editor, in a bordered box with a blue accent on the left so it stands apart from the rest of the summary
- **Recent Modification History**: the last 5 entries
- **Reviewer areas**: a yellow *Requested Revision* column for every setting, a content revision box, a comments box, and a *Reviewed by / Date* line

### Training Emails tab summary
On a training's **Emails** step (for example, `ManageTrainingEditCombined.aspx`), the script produces an **Email Setup Overview** instead:

- Email option (System Defaults / Custom Emails / No Emails)
- Whether *Include Inactive Emails* is checked
- A table of every email action with its type, description, and whether it has emails
- If you expand the actions before generating, it lists each email under its action

### Panel tools
| Button | What it does |
|---|---|
| **Copy Rich Text** | Copies the summary with formatting, ready to paste into Outlook, Teams, or Word |
| **Download for Word** | Saves the summary as a `.doc` file named after the email |
| **Refresh** | Rebuilds the summary from the current page (asks before discarding your edits) |
| **Copy Debug HTML** | Copies the live page HTML, including same-origin pop-up frames, for troubleshooting |
| **Hide / Show** | Collapses or expands the summary |

### Notification Content tools
These buttons sit just above the Notification Content box:

| Button | What it does |
|---|---|
| **View HTML / View Formatted** | Switches Notification Content between formatted view and HTML source |
| **Copy HTML** | Copies the Notification Content HTML source (shown while viewing HTML) |
| **Apply to Message** | Replaces the message in the Cornerstone editor with the content of the box (asks first; does not save) |

The summary box is fully editable, so you can add notes before sending it. These buttons are left out of copied and downloaded output.

### Applying revisions back to Cornerstone
**Apply to Message** writes the Notification Content into the real message editor:

- Works in either view. In formatted view it applies the formatted content; in HTML view it applies the HTML as you've edited it.
- Asks for confirmation before replacing the message.
- **Doesn't save anything.** Review the message, then click **Save** in Cornerstone to keep the changes.
- Line breaks the summary adds after images for display are not written back, so the email's real layout is unchanged.
- If the editor is in plain-text mode, the content is applied as plain text.

### Content clean-up
- Removes scripts, event handlers, and elements injected by browser extensions
- Converts relative image and link URLs to absolute URLs so they keep working after pasting
- Adds line breaks after aligned images so text doesn't wrap beside them (display only)

---

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open `csod-email-review-summary.user.js` in this repository and click **Raw**. Your userscript manager will offer to install it.
   - Or create a new script in your manager and paste in the file contents.
3. Reload your Cornerstone page.

### Pages where it runs
```
https://*.csod.com/*Emails.aspx*
https://*.csod.com/*Email*.aspx*
https://*.csod.com/Email/*
https://*.csod.com/*/Email/*
https://*.csod.com/*EmailEdit*.aspx*
https://*.csod.com/LMS/Admin/NewUI/ManageTrainingEditCombined.aspx*
https://*.csod.com/*ManageTraining*.aspx*
```
On multi-step training pages, the panel appears only while an email step is on screen and disappears when you move to another step.

---

## Usage

### Send an email for review
1. In Cornerstone, open an email template (**Email Administration → Edit Email**) or a training's **Emails** step.
2. Scroll to the bottom of the page and find the **Email Review Summary** panel.
3. Optionally edit the summary or add notes.
4. Click **Copy Rich Text** and paste it into an email or Teams message, or click **Download for Word** and attach the file.
5. The reviewer fills in the yellow *Requested Revision* areas and returns it.

### Apply content revisions
1. Open the same email in Cornerstone.
2. Edit the text in the **Notification Content** box, or switch to **View HTML** and paste in revised HTML.
3. Click **Apply to Message** and confirm.
4. Check the message in the Cornerstone editor, then click **Save**.

---

## Configuration

Near the top of the script:

```js
// Set to true to also show Action (trigger) and Email Format rows.
const SHOW_EXTRAS = false;

// Settings whose values are shown in bold in the summary.
const BOLD_VALUES = ['Email Title', 'Subject'];
```

Add any setting name from the Email Settings table to `BOLD_VALUES` (for example, `'Send To'`) to make its value bold. Values showing `(blank)` are never bolded.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Panel doesn't appear | Make sure the URL matches one of the patterns above and the script is enabled. On training pages, open the Emails step. |
| Settings show `(blank)` | You may be on the Emails list rather than an individual email. Open the email to see full settings. |
| Recipients are missing | Click **Copy Debug HTML** with the email open and include the output in an issue. |
| Summary didn't update after changes | Click **Refresh**. If you've edited the summary, it doesn't auto-refresh, so your edits aren't overwritten. |
| Email editor opens in a pop-up | Pop-ups aren't captured by *Save Page As*. Use **Copy Debug HTML** instead. |
| **Apply to Message** says it can't find the editor | Make sure the email's message editor is on screen, not just the Emails list. Then click **Refresh** and try again. |
| Applied changes disappeared | Apply doesn't save. Click **Save** in Cornerstone after applying. |

---

## Privacy

The script runs entirely in your browser. It reads the current Cornerstone page and makes **no network requests**. It doesn't collect or transmit any data. Clipboard access happens only when you click a copy button. The page is changed only when you click **Apply to Message** and confirm, and nothing is saved to Cornerstone until you click **Save** yourself.

---

## Limitations

- Cornerstone layouts vary by page and release. Fields are found by control ID first, then by on-screen label.
- Content inside cross-origin frames can't be read or updated.
- *Download for Word* produces an HTML-based `.doc` file. Word opens it normally but may show a compatibility notice.
- After **Apply to Message**, relative image and link addresses in the message become full web addresses (for example, `https://yourcompany.csod.com/...`). They still work.

---

## Changelog

| Version | Changes |
|---|---|
| 1.16 | **Apply to Message** button writes Notification Content edits back to the Cornerstone message editor |
| 1.15 | Removed the background shading from the Notification Content box (border and accent kept) |
| 1.14 | Notification Content box styled with a border, blue left accent, and rounded corners |
| 1.13 | Email Title and Subject values shown in bold; `BOLD_VALUES` setting |
| 1.12 | View HTML / Copy HTML toggle for Notification Content |
| 1.11 | More robust recipient detection; line break after aligned images; absolute URLs; Copy Debug HTML button |
| 1.10 | Detects recipients shown as removable tags |
| 1.9 | Email Setup Overview for a training's Emails tab; strips leading "Edit" from titles |
| 1.8 | Multiple recipients labeled role/user; title fix; removes extension-injected elements |
| 1.7 | Runs on `ManageTrainingEditCombined.aspx`; shows/hides with the active step |
| 1.6 | Subtitle on its own line |
| 1.5 | Email action subtitle |
| 1.4 | Renamed content section to "Notification Content" |
| 1.3 | Availability Criteria with Include Subordinates |
| 1.2 | Reads Edit Email controls directly; reminder timing; RadEditor content |
| 1.1 | Simplified summary layout |
| 1.0 | Initial release |
