# CSOD Email Review Summary

A userscript for **Cornerstone OnDemand (CSOD)** administrators. It reads the email template you have open and builds an editable, reviewer-ready summary of its settings and content at the bottom of the page. You can copy the summary into Outlook, Teams or Word, or download it, and send it to a reviewer.

**Current version:** 1.21

---

## Features

- **Email settings summary:** Email Title, Subject, Send To, CC, Availability Criteria (including whether inactive users are included), Default Language and Type, in a table with a yellow **Requested Revision** column for reviewers. Email Title and Subject values are bold.
- **Subtitle:** shows the email's action under the title (for example, *Assign Training*).
- **Notification Content:** the message body, formatted to match Cornerstone's message editor:
  - Bulleted and numbered lists show their bullets, numbers and indents, including nested lists (v1.19).
  - Headings, centered content, dividers (`<hr>`) and images are laid out the same as in the editor (v1.20).
  - Hyperlinks are underlined (v1.21).
- **Editable:** type changes directly into the summary before sharing it.
- **View HTML / Copy HTML:** switch any Notification Content box to its HTML source and copy it.
- **Apply to Message:** writes a Notification Content box back into the Cornerstone message editor.
- **Localised emails:** a **Languages** row in the Overview, plus a separate section for each translated language with its own Email Title, Subject and Notification Content.
- **Training email overview:** on a training's Emails tab, summarizes the Email Option, the email actions and their emails, and recent modification history.
- **Reviewer sections:** a Reviewer Comments box and a Reviewed by / Date line.

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/).
2. Create a new script and paste in `csod-email-review-summary.user.js`, or open the file with Tampermonkey installed.
3. Save it, then reload a Cornerstone email page.

The script runs on Cornerstone email administration pages, email edit pages, and training (Manage Training) pages on `*.csod.com`.

## Usage

1. Open an email template (or a training's Emails tab) in Cornerstone.
2. Scroll to the **Email Review Summary** panel at the bottom of the page.
3. If the email has translations, wait for them to load, or click **Load Translations**.
4. Make any edits in the summary.
5. Click **Copy Rich Text** and paste it into Outlook, Teams or Word, or click **Download for Word**.

### Applying revisions back to the email

1. Edit the Notification Content box in the summary (or its HTML using **View HTML**).
2. For a translated language, first switch the Cornerstone Message **Language** dropdown to that language.
3. Click **Apply to Message** and confirm.
4. Click **Save Email** in Cornerstone. Nothing is saved until you do.

Save before switching languages or loading translations, or Cornerstone may discard your applied changes.

## Buttons

### Panel

| Button | What it does |
|---|---|
| **Copy Rich Text** | Copies the whole summary for pasting into Outlook, Teams or Word |
| **Download for Word** | Downloads the summary as a file you can open in Word |
| **Refresh** | Rebuilds the summary from the page (warns you if it would discard your edits) |
| **Load Translations** | Switches the Message Language dropdown to each language and back to load its content. Nothing is saved |
| **Copy Debug HTML** | Copies the page's HTML for troubleshooting (downloads it if copying is blocked) |
| **Hide / Show** | Collapses or expands the summary |

### Each Notification Content box

| Button | What it does |
|---|---|
| **View HTML / View Formatted** | Switches between the HTML source and the formatted view |
| **Copy HTML** | Copies the box's HTML (shown while viewing HTML) |
| **Apply to Message** | Replaces the message in the Cornerstone editor with the box's content |

## Configuration

These settings are at the top of the script.

| Setting | Default | What it does |
|---|---|---|
| `SHOW_EXTRAS` | `false` | Also shows the Action (trigger) and Email Format rows |
| `BOLD_VALUES` | `['Email Title', 'Subject']` | Which settings show their values in bold |
| `AUTO_LOAD_TRANSLATIONS` | `true` | Loads translated content automatically when an email with translations opens. Automatic loading only opens languages that have a translation |
| `LOAD_ALL_LANGUAGES` | `true` | When `true`, the **Load Translations** button goes through every language in the dropdown. When `false`, only languages with a translated title or subject |

## Troubleshooting

| Problem | What to do |
|---|---|
| The panel doesn't appear | Make sure the script is turned on in Tampermonkey and the page URL matches one of the `@match` lines. Reload the page |
| Settings or recipients are missing | Click **Refresh**. If they're still missing, click **Copy Debug HTML** and send the result to the script maintainer |
| A language's content wasn't loaded | Click **Load Translations**. Copying or downloading warns you when content is missing |
| Loading translations is slow | Set `LOAD_ALL_LANGUAGES` to `false` so the button only loads translated languages |
| Warning about unsaved applied changes | Click **Save Email** in Cornerstone before loading translations, or continue and lose the applied changes |
| "The Cornerstone editor is currently showing…" | Switch the Message Language dropdown to the language you're applying, then click **Apply to Message** again |
| Notification Content looks different from the editor | The panel restores standard list, heading, divider, image and link formatting, and the email's own inline styles take priority. Send a screenshot and the HTML if something still doesn't match |

## Privacy

The script runs only in your browser, on Cornerstone pages. It doesn't send data anywhere. It reads the page and builds the summary locally. Loading translations uses Cornerstone's own language switch on the page, the same as picking a language from the dropdown yourself. Content only leaves the page when you copy or download it.

## Limitations

- Tested on simulated pages, not on the live Cornerstone site.
- The formatting fixes in v1.19–v1.21 only change how the panel looks. Copied, downloaded and applied HTML is unchanged.
- **Apply to Message** only works on the language showing in the editor, and won't run while translations are loading.
- The **Load Translations** button can appear on emails that have no translations.
- In rare cases, the wrong language may be treated as the default.

## Changelog

| Version | Changes |
|---|---|
| **1.21** | Hyperlinks in Notification Content are underlined, the same as in the message editor. |
| **1.20** | Notification Content shows headings, centered content, dividers (`<hr>`) and images the same as the message editor. Before, an image inside a centered heading ran into the heading text, and dividers were hidden. |
| **1.19** | Lists in Notification Content show bullets, numbers and indents. Nested lists use circle, then square bullets. List `type` settings (such as `<ol type="a">`) still apply. |
| **1.18** | Automatic translation loading only opens translated languages, and the wait on empty languages is shorter. Load Translations warns about unsaved applied changes. Apply to Message waits until loading finishes. |
| **1.17** | Added support for translated emails: translated titles, subjects and content, the Languages row, the Load Translations button, and per-language View HTML / Copy HTML / Apply to Message. |
| **1.16 and earlier** | Email settings summary, Emails-tab overview, recipient detection, bold values, subtitle, View HTML, Copy HTML, Apply to Message, Copy Rich Text and Download for Word. |

## Credits

Localization support (translated titles, subjects and Notification Content, plus the Load Translations feature) was contributed by **Luke Brown**.

## License

MIT
