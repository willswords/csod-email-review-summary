# CSOD Email Review Summary – Additional Info

**Current version:** 1.21

Cornerstone OnDemand (CSOD) email templates are hard to review. The settings are spread across the page, and reviewers outside Cornerstone can't see them. This userscript reads the email template you have open and builds an editable summary of its settings and content in a panel at the bottom of the page. You can then copy it, download it, or send it for review.

---

## Features

- **Settings summary:** shows the Email Title, Subject, recipients, Availability Criteria, and languages for the email that's open. The Email Title and Subject values are bold.
- **Notification Content:** the message body, formatted the same way as in Cornerstone's message editor.
  - Bulleted and numbered lists keep their bullets, numbers, and indents, including nested lists *(v1.19)*.
  - Headings, centered content, dividers (`<hr>`), and images are laid out the same as in the editor *(v1.20)*.
  - Hyperlinks are underlined, the same as in the editor *(v1.21)*.
- **Editable:** you can type revisions straight into the summary before you share it.
- **View HTML / Copy HTML:** switch a content box to its HTML source and copy it.
- **Apply to Message:** copies your edits from a content box back into the Cornerstone message editor. Nothing is saved until you click **Save Email** in Cornerstone.
- **Translated emails:** each translated language gets its own Email Title, Subject, and Notification Content section.

## Panel buttons

| Button | What it does |
|---|---|
| **Copy Rich Text** | Copies the whole summary so you can paste it into Outlook, Teams, or Word |
| **Download for Word** | Downloads the summary as a file you can open in Word |
| **Refresh** | Rebuilds the summary from the page |
| **Load Translations** | Switches the Message Language dropdown to each language and back to load its content. Nothing is saved |
| **Copy Debug HTML** | Copies the page details needed to troubleshoot the script |
| **Hide / Show** | Collapses or expands the panel |
| **View HTML / View Formatted** | Switches a content box between its HTML source and the formatted view |
| **Copy HTML** | Copies a content box's HTML (shown while viewing HTML) |
| **Apply to Message** | Writes a content box back into the Cornerstone editor for that language |

## Settings

These are near the top of the script.

| Setting | Default | What it does |
|---|---|---|
| `SHOW_EXTRAS` | `false` | Also shows the Action (trigger) and Email Format rows |
| `BOLD_VALUES` | `['Email Title', 'Subject']` | Which settings show their values in bold |
| `AUTO_LOAD_TRANSLATIONS` | `true` | Loads translated content automatically when an email with translations opens |
| `LOAD_ALL_LANGUAGES` | `true` | When `true`, Load Translations goes through every language. When `false`, only languages with a translated title or subject |

## Notes and limitations

- **Display only:** the formatting fixes in v1.19–v1.21 only change how the content looks in the panel. They don't change the HTML that's copied, downloaded, or applied to the message.
- **The email's own styles take priority:** inline styles in the email, such as `text-align: center`, `width="340"`, or a custom list style, override the panel's defaults.
- **Apply to Message** only works on the language currently showing in the editor, and it won't run while translations are loading.
- **Save before switching languages:** if you apply changes and then load translations, save first or your applied changes may be lost. The script warns you about this.
- **Testing:** changes have been tested on simulated pages, not on the live Cornerstone site.

## Privacy

The script runs only in your browser, on Cornerstone email pages. It doesn't send data anywhere. It reads the page and builds the summary locally. Content only leaves the page when you copy or download it yourself.

## Changelog

| Version | Changes |
|---|---|
| **1.21** | Hyperlinks in Notification Content are now underlined, the same as in the message editor. |
| **1.20** | Notification Content now shows headings, centered content, dividers (`<hr>`), and images the same way the message editor does. Before, an image inside a centered heading ran into the heading text, and dividers were hidden. |
| **1.19** | Lists in Notification Content now show bullets, numbers, and indents. Nested lists use circle, then square bullets. List `type` settings (such as `<ol type="a">`) still apply. |
| **1.18** | Automatic translation loading only opens translated languages. Added a warning about unsaved applied changes before loading translations. Apply to Message waits until loading finishes. |
| **1.17** | Added support for translated emails: translated titles, subjects, and content, the Load Translations button, and per-language View HTML / Copy HTML / Apply to Message. |

For earlier versions, see the README.
