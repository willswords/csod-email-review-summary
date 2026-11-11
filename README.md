MIT License

Copyright (c) 2026 willswords

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Features

### Email template summary
When an individual email is open for editing, the summary includes:

- **Title and subtitle**: the email title, with the email action (for example, *Assign Training* or *Training is Due*) on its own line
- **Overview**: Learning Object, Languages (when the email has translations), Prepared by, Generated date/time, and Page URL
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
- **Localised versions**: one section per translated language (see below)
- **Recent Modification History**: the last 5 entries
- **Reviewer areas**: a yellow *Requested Revision* column for every setting, a content revision box, a comments box, and a *Reviewed by / Date* line

### Localised (translated) emails
When an email has translations, the summary adds:

- A **Languages** row in the Overview, listing the default language and each translated language
- The default language in the *Email Settings* and *Notification Content* headings, for example *Notification Content – English (US) (default)*
- A **Localised Version** section for each translated language, with:
  - Its translated Email Title and Subject (bold), or *(not translated – the default text is used)*
  - Its own Notification Content box with View HTML, Copy HTML, and Apply to Message buttons
  - Its own yellow revision areas
- A note that addresses, type, recipients, and availability are shared with the default version

Translated titles and subjects are read straight from the page. Cornerstone only loads the message body for the language picked in the Message **Language** dropdown, so the script switches that dropdown to each language and back to collect them (see **Load Translations** below). Nothing is saved while it does this.

If a language's content hasn't been loaded, its box says so, and copying or downloading the summary shows a reminder to click **Load Translations** first.

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
| **Load Translations** | Switches the Message language to each language and back so every translation's content is included. Shown when the email has a Language dropdown. Nothing is saved. |
| **Copy Debug HTML** | Copies the live page HTML, including same-origin pop-up frames, for troubleshooting |
| **Hide / Show** | Collapses or expands the summary |

### Notification Content tools
These buttons sit just above each Notification Content box (the default one and each translated one):

| Button | What it does |
|---|---|
| **View HTML / View Formatted** | Switches that box between formatted view and HTML source |
| **Copy HTML** | Copies that box's HTML source (shown while viewing HTML) |
| **Apply to Message** | Replaces the message in the Cornerstone editor with the content of that box (asks first; does not save) |

The summary box is fully editable, so you can add notes before sending it. These buttons are left out of copied and downloaded output.

### Applying revisions back to Cornerstone
**Apply to Message** writes a Notification Content box into the real message editor:

- Works in either view. In formatted view it applies the formatted content; in HTML view it applies the HTML as you've edited it.
- Asks for confirmation before replacing the message.
- **Doesn't save anything.** Review the message, then click **Save** in Cornerstone to keep the changes.
- **Only applies a box to its own language.** The editor holds one language at a time. If you click Apply on the Spanish box while the editor is showing English, it stops and asks you to switch the Message **Language** dropdown to Spanish first.
- Won't run while translations are loading; wait for loading to finish, then try again.
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
3. If the email has translations, wait for them to load (or click **Load Translations**).
4. Optionally edit the summary or add notes.
5. Click **Copy Rich Text** and paste it into an email or Teams message, or click **Download for Word** and attach the file.
6. The reviewer fills in the yellow *Requested Revision* areas and returns it.

### Apply content revisions
1. Open the same email in Cornerstone.
2. For a translated version, switch the Message **Language** dropdown to that language.
3. Edit the text in the matching **Notification Content** box, or switch to **View HTML** and paste in revised HTML.
4. Click **Apply to Message** and confirm.
5. Check the message in the Cornerstone editor, then click **Save**.
6. Save before switching to another language or clicking **Load Translations**. Cornerstone may discard unsaved changes when the language changes.

---

## Configuration

Near the top of the script:

```js
// Set to true to also show Action (trigger) and Email Format rows.
const SHOW_EXTRAS = false;

// Settings whose values are shown in bold in the summary.
const BOLD_VALUES = ['Email Title', 'Subject'];

// Load translated content automatically when an email with translations opens.
const AUTO_LOAD_TRANSLATIONS = true;

// When clicking Load Translations: true = every language in the dropdown;
// false = only languages that have a translated title or subject.
const LOAD_ALL_LANGUAGES = true;
```

- Add any setting name from the Email Settings table to `BOLD_VALUES` (for example, `'Send To'`) to make its value bold. Values showing `(blank)` or *(not translated…)* are never bolded.
- Automatic loading always opens **only** the languages that have a translated title or subject, whatever `LOAD_ALL_LANGUAGES` is set to. `LOAD_ALL_LANGUAGES` affects the **Load Translations** button only.

---

## Troubleshooting

| Problem | What to try |
|---|---|
| Panel doesn't appear | Make sure the URL matches one of the patterns above and the script is enabled. On training pages, open the Emails step. |
| Settings show `(blank)` | You may be on the Emails list rather than an individual email. Open the email to see full settings. |
| Recipients are missing | Click **Copy Debug HTML** with the email open and include the output in an issue. |
| Summary didn't update after changes | Click **Refresh**. If you've edited the summary, it doesn't auto-refresh, so your edits aren't overwritten. |
| Email editor opens in a pop-up | Pop-ups aren't captured by *Save Page As*. Use **Copy Debug HTML** instead. |
| A language says its content isn't loaded | Click **Load Translations**, or switch the Message **Language** dropdown to that language. |
| Load Translations is slow | It switches through every language in the dropdown. Set `LOAD_ALL_LANGUAGES = false` to load only languages with translations. |
| Load Translations warns about unsaved changes | You used Apply to Message without saving. Click **Save** in Cornerstone first, or continue and risk losing those changes. |
| Apply to Message says the editor is showing another language | Switch the Message **Language** dropdown to the language of the box you're applying, then try again. |
| **Apply to Message** says it can't find the editor | Make sure the email's message editor is on screen, not just the Emails list. Then click **Refresh** and try again. |
| Applied changes disappeared | Apply doesn't save. Click **Save** in Cornerstone after applying, and before changing languages. |

---

## Privacy

The script runs entirely in your browser and doesn't collect or transmit any data. It reads the current Cornerstone page and doesn't contact any outside services. Loading translations uses Cornerstone's own language switch on the page, the same as choosing a language from the dropdown yourself. Clipboard access happens only when you click a copy button. The message content is changed only when you click **Apply to Message** and confirm, and nothing is saved to Cornerstone until you click **Save** yourself.

---

## Limitations

- Cornerstone layouts vary by page and release. Fields are found by control ID first, then by on-screen label.
- Content inside cross-origin frames can't be read or updated.
- *Download for Word* produces an HTML-based `.doc` file. Word opens it normally but may show a compatibility notice.
- After **Apply to Message**, relative image and link addresses in the message become full web addresses (for example, `https://yourcompany.csod.com/...`). They still work.
- The **Load Translations** button appears on any email with a Language dropdown, even when the email has no translations.
- If a page opens in a language other than the default and the page doesn't say which language is the default, the summary may treat the wrong language as the main one.

---

## Credits

Localisation support was contributed by Luke Brown and merged in v1.17.

---

## Changelog

| Version | Changes |
|---|---|
| 1.18 | Automatic loading opens only languages with translations; shorter wait on empty languages; warning before Load Translations if applied changes aren't saved; Apply to Message blocked while translations load |
| 1.17 | Localisation: Languages row, Localised Version sections, Load Translations button, `AUTO_LOAD_TRANSLATIONS` and `LOAD_ALL_LANGUAGES` settings; per-language View HTML / Copy HTML / Apply to Message; Apply limited to the language in the editor; titles spelled "E-mail" recognised |
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
