# CSOD Email Review Summary

A userscript for **Cornerstone OnDemand (CSOD)** administrators. It reads the email template currently open in Cornerstone and builds an editable, reviewer-ready summary of its settings and Notification Content at the bottom of the page.

**Current version:** 1.31

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open [csod-mp4-video-link.user.js](https://raw.githubusercontent.com/willswords/csod-email-review-summary/main/csod-email-review-summary.user.js)
   and click Install.

## Features

- **Email settings summary:** captures Email Title, Subject, Send To, CC, Availability Criteria, Default Language, and email Type. Email Title and Subject values are bold.
- **Requested Revision column:** gives reviewers a clearly shaded place to enter requested changes.
- **Notification Content preview:** displays the message body in an editable rich-text box that closely matches the Cornerstone editor.
  - Bulleted and numbered lists retain bullets, numbering, and nesting.
  - Headings, centered content, horizontal rules, and images retain their layout.
  - Hyperlinks are underlined.
- **View HTML:** switches an individual Notification Content box between the rendered message and editable HTML source.
- **Copy HTML:** copies the HTML for an individual Notification Content box.
- **Lint HTML:** formats an individual Notification Content box for easier review without stripping styling or changing the Cornerstone editor. It also supports non-destructive warning checks for common HTML and email-quality problems.
- **Apply to Message:** writes the reviewed Notification Content back to the matching language in the Cornerstone editor.
- **Localized emails:** lists available languages and creates a separate review section for each translated title, subject, and message body.
- **Load Translations:** cycles through Cornerstone's language selector to load translated content, then returns to the original language. Nothing is saved by loading translations.
- **Email list setup:** on a training's Emails page, the script unchecks **Include Inactive Emails** when the page loads, so only active emails are listed. If you then check the box yourself, the reload Cornerstone does for that keeps your choice.
- **Copy and download:** copies the full rich-text review summary or downloads it for sharing.
- **Movable panel:** the review panel can be repositioned to make comparison with the Cornerstone form easier.
- **Resizable original message editor:** drag the resize handle on the original Cornerstone message editor to increase or reduce its width and height. The feature supports Telerik RadEditor, editable iframe/contenteditable editors, and plain textarea variants.

## Lint HTML

The **Lint HTML** button is intended as a non-destructive HTML review tool. It improves source readability while preserving the markup that controls the appearance of the email.

### What Lint HTML changes

- Removes HTML comments.
- Formats the source with line breaks and two-space indentation.
- Keeps simple inline phrasing together where splitting it could introduce visible whitespace.

### What Lint HTML preserves

Lint HTML deliberately preserves styling and content, including:

- `style`, `class`, `id`, `align`, and other attributes
- `<span>`, `<font>`, `<strong>`, `<em>`, and other formatting elements
- Tables and table-layout markup used by HTML email
- Links and `href` values
- Images and `src` values
- Non-breaking spaces and other spacing that can affect rendering

Lint HTML does **not** attempt to modernize legacy email markup simply because it is old-fashioned. Elements such as tables and `<font>` may still be necessary for compatibility with email clients.

### Warning checks

Linting can flag review issues without automatically modifying them. Warning checks are intended to include:

| Check | Warning condition | Why it matters |
|---|---|---|
| **Image alt text** | An `<img>` is missing `alt` | Screen readers need useful alternatives; decorative images should normally use `alt=""`. |
| **Empty links** | An `<a>` has no meaningful text/content | Recipients and assistive technology may not know the link purpose. |
| **Missing/invalid link target** | An anchor is missing `href` or uses an obviously malformed value | Helps catch broken calls to action before an email is sent. |
| **Duplicate IDs** | The same `id` occurs more than once | Duplicate IDs are invalid HTML and can cause selectors or scripting to target the wrong element. |
| **Heading order** | Heading levels jump unexpectedly, such as `h1` directly to `h3` | Better heading structure improves accessibility and reviewability. |
| **Empty formatting elements** | A formatting element contains no meaningful content | Often indicates leftover editor markup that adds noise. |
| **Potentially unsafe/unsupported elements** | Elements such as `script`, `iframe`, `object`, or form controls appear in email content | Many email clients strip or block active/embedded content. |
| **Potentially unsafe URLs** | A URL uses schemes such as `javascript:` | Such URLs should not be present in email content. |
| **Missing image source** | An `<img>` lacks a usable `src` | The image cannot render for the recipient. |
| **Table accessibility** | A data-like table has no identifiable header cells | Table headers can make structured content easier for screen readers to interpret. Layout tables may be intentionally exempt. |

Warnings are advisory. **Lint HTML should not silently “fix” a warning when doing so could alter formatting, layout, wording, links, or email-client compatibility.** The reviewer decides whether a flagged item should be changed.

### Recommended lint workflow

1. Open the email template in Cornerstone.
2. Click **Lint HTML** on the relevant Notification Content.
3. Review any lint warnings.
4. Click **View HTML** to inspect the formatted source.
5. Correct only the issues that are appropriate for the email.
6. Compare the rendered view with the original.
7. Click **Apply to Message** only when the reviewed result is acceptable.
8. Save the email in Cornerstone.

## Panel buttons

| Button | Purpose |
|---|---|
| **Refresh** | Rebuilds the summary from the current Cornerstone page. |
| **Load Translations** | Loads localized content through Cornerstone's language selector. |
| **Copy Summary** | Copies the complete reviewer-ready summary as rich text. |
| **Download** | Downloads the complete summary for sharing or archiving. |
| **View HTML** | Toggles one Notification Content box between rendered and source views. |
| **Copy HTML** | Copies the HTML from one Notification Content box. |
| **Lint HTML** | Formats HTML for review and surfaces non-destructive warnings without stripping styling. |
| **Apply to Message** | Writes one Notification Content box back to the active Cornerstone message editor. |

## Installation

1. Install a userscript manager such as Tampermonkey.
2. Create a new userscript.
3. Replace the default contents with `csod-email-review-summary-v1.24.user.js`.
4. Save the userscript.
5. Reload the applicable Cornerstone email or training Emails page.

## Configuration

The following settings are near the top of the script:

| Setting | Default | Description |
|---|---:|---|
| `SHOW_EXTRAS` | `false` | Shows additional fields that are not part of the standard review summary. |
| `BOLD_VALUES` | `['Email Title', 'Subject']` | Controls which setting values are bold in the summary. |
| `AUTO_LOAD_TRANSLATIONS` | `true` | Automatically loads translated content when translations are detected. |
| `LOAD_ALL_LANGUAGES` | `true` | Makes the manual Load Translations action visit every available language. |
| `AUTO_LIST_SETUP` | `true` | On email list pages, unchecks **Include Inactive Emails** when the page loads (not after you check it yourself). |

## Important usage notes

- **Apply to Message is language-specific.** The language displayed in the Cornerstone editor must match the Notification Content section being applied.
- **Save before changing languages.** Applied changes can be lost if Cornerstone switches languages before the email is saved.
- **Wait for translation loading to finish.** Apply to Message is blocked while translated content is being loaded.
- **Cleaning can affect appearance.** Inline styles, classes, IDs, and span wrappers may be responsible for intentional formatting. Inspect the result before applying it.
- **Email HTML often uses tables.** Clean HTML preserves structural table cells, image sources, links, and other attributes not included in the selected cleaning rules.

## Troubleshooting

| Problem | What to do |
|---|---|
| The panel does not appear | Confirm the userscript is enabled, then reload the Cornerstone page. |
| Notification Content differs from the Cornerstone editor | Click **Refresh**. If translations are involved, use **Load Translations** and wait for it to finish. |
| The source is not indented | Run **Lint HTML** first. View HTML by itself displays the current source without lint formatting. |
| The original message editor has no resize handle | Reload the page and confirm v1.24 is enabled. The handle appears at the lower-right edge of supported Telerik RadEditor, editable iframe, contenteditable, and textarea editors. |
| The editor size resets | Cornerstone may replace or reset the editor during navigation or a full page reload. Resize it again after the new editor loads. |
| Apply to Message reports the wrong language | Select the matching language in Cornerstone, then apply that language's Notification Content again. |
| A translation says its content was not loaded | Click **Load Translations**, wait for completion, and refresh the summary if needed. |
| Inactive emails are hidden | This is the email list setup feature, which runs when the page loads. Check **Include Inactive Emails** afterwards to show them; the script leaves that choice alone. Set `AUTO_LIST_SETUP` to `false` to turn the feature off. |
| Applied content disappears after switching languages | Save the Cornerstone email immediately after applying content and before changing the language selector. |

## Privacy

The userscript runs in the browser on matching Cornerstone pages. It reads the visible page and Cornerstone editor content to build the review summary. Translation loading uses Cornerstone's own language selector. The script does not intentionally send template content to an external service.

## Credits

Localization support, including translated titles, subjects, Notification Content, and the Load Translations feature, was contributed by **Luke Brown**.

## Changelog

| Version | Changes |
|---|---|
| **1.31** | Removed the automatic **Expand/Collapse All** click. The email list setup now only unchecks **Include Inactive Emails**. |
| **1.30** | The email list setup now runs only when the page is opened or refreshed. Checking **Include Inactive Emails** or clicking **Expand/Collapse All** yourself no longer triggers it again on the reload that follows. |
| **1.29** | Email list pages now automatically uncheck **Include Inactive Emails** and click **Expand/Collapse All** on load (skipped if the list is already expanded). Set `AUTO_LIST_SETUP` to `false` to turn this off. |
| **1.28** | Reframed Clean HTML as **Lint HTML**: preserves style-bearing markup and spacing, removes comments, pretty-prints source, and documents advisory warning checks for common HTML/email issues. |
| **1.27** | Made cleanup conservative so style-bearing tags and attributes are preserved. |
| **1.26** | Reworked Cornerstone editor resizing with a dedicated drag handle while preserving WYSIWYG/HTML mode switching. |
| **1.25** | Fixed a regression where resize styling could interfere with WYSIWYG/HTML visibility switching. |
| **1.24** | Added horizontal and vertical resizing to the original Cornerstone message editor, with support for Telerik RadEditor, editable iframe/contenteditable, and textarea variants. Resize support is reapplied after dynamic editor reloads. |
| **1.23** | Clean HTML now pretty-prints the cleaned source with line breaks and two-space indentation while keeping simple inline phrasing together. |
| **1.22** | Added Clean HTML. It removes inline styles, classes, IDs, comments, span wrappers, successive non-breaking spaces, and common one-NBSP spacer elements. Cleaning operates on the review copy until Apply to Message is used. |
| **1.21** | Underlined hyperlinks in the Notification Content preview. |
| **1.20** | Improved the preview of headings, centered content, horizontal rules, and images. |
| **1.19** | Improved bulleted, numbered, and nested list rendering. |
| **1.18** | Improved translation loading performance and added safeguards for unsaved or wrong-language changes. |
| **1.17** | Added localized email support and translation loading. |
| **1.16 and earlier** | Added the core review summary, editable content, HTML controls, applying revisions, copying, downloading, and training email overview features. |
