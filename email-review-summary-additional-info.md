# CSOD Email Review Summary – Additional Info

**Current version:** 1.30

This page supplements the README with more detail about reviewing, cleaning, and applying Notification Content.

## Lint HTML behavior

**Lint HTML** is a review and formatting tool, not a sanitizer. Its priority is to make source HTML easier to inspect without changing the visual design of the email.

### Automatic formatting

Lint HTML:

- removes HTML comments;
- adds readable line breaks and two-space indentation; and
- keeps simple inline phrasing together when additional whitespace could affect rendering.

It preserves styling tags, style attributes, classes, IDs, tables, links, images, alignment attributes, and meaningful spacing.

### Advisory warning checks

Warnings do not automatically change the HTML. They identify items for a reviewer to inspect.

- **Images missing `alt`:** flag images without alternative text. Decorative images can appropriately use `alt=""`.
- **Missing image sources:** flag image elements without a usable `src`.
- **Empty links:** flag anchors without meaningful linked content.
- **Missing or malformed `href`:** flag links that are unlikely to work.
- **Potentially unsafe URL schemes:** flag values such as `javascript:`.
- **Duplicate IDs:** flag IDs reused within the same message.
- **Heading-order jumps:** flag structural jumps such as `h1` to `h3`.
- **Empty formatting elements:** flag markup that appears to be leftover editor debris.
- **Active/embedded content:** flag `script`, `iframe`, `object`, and form controls because email clients commonly block or remove them.
- **Table accessibility:** flag data-like tables without identifiable header cells while avoiding blanket warnings for layout tables.

A warning does not necessarily mean the HTML is wrong. HTML email relies heavily on compatibility-oriented markup, especially tables and inline styling. The linter should prefer a warning over an automatic rewrite whenever a change could alter appearance or email-client behavior.

### Applying linted content

Lint HTML changes the review copy first. Use **View HTML** to inspect it, make any desired corrections, compare the rendered result, and then use **Apply to Message**. Cornerstone is not changed until Apply to Message is used.

## Resizable original message editor

Version 1.24 makes the original Cornerstone message editor resizable. Drag the handle at the lower-right corner of the editor to change both its width and height.

### Supported editor types

- Cornerstone's Telerik RadEditor container
- Editable iframe editors
- Contenteditable editor regions
- Plain textarea editor variants

### Resize behavior

- Minimum width: **320 pixels**
- Minimum height: **160 pixels**
- Maximum width: **100% of the available page width**
- Horizontal and vertical resizing are enabled
- Overflow remains scrollable when content is larger than the resized editor
- Resize support is reapplied after asynchronous Cornerstone editor reloads, such as Message Language changes

Resizing changes only the editor workspace shown in the browser. It does not add dimensions to the email HTML, change the review summary, or affect the message received by learners.

### Limitations

- The resize handle's exact appearance depends on the browser and operating system.
- Cornerstone may reset the selected dimensions after a full page reload, navigation, or replacement of the editor control.
- The editor cannot be widened beyond the available page width by this feature.
- On Telerik RadEditor pages, the script applies resizing to the editor container so the toolbar remains usable.

## Email list setup

On a training's Emails page (the list of email actions), the script prepares the list when the page loads so the summary shows every active email:

1. If **Include Inactive Emails** is checked, the script unchecks it. Cornerstone then refreshes the list.
2. The script waits for that refresh to finish before doing anything else, so the two refreshes do not interrupt each other. If Cornerstone reloads the whole page instead, the script starts again on the reloaded page.
3. If no action is showing its emails yet, the script clicks **Expand/Collapse All**. Because this button toggles, it is not clicked when the list is already expanded.
4. When the emails appear, the summary is rebuilt to include them.

Notes:

- Nothing is saved. The checkbox and expand state are display options only.
- Each action has a detail row that stays empty while collapsed; the script treats the list as expanded only when one of those rows contains emails.
- Your own changes are kept. Checking **Include Inactive Emails** or clicking **Expand/Collapse All** yourself makes Cornerstone reload the page; the script notices that you clicked one of these controls and skips the setup on that reload. The next normal page load (opening the page or refreshing it) runs the setup again.
- To never run the setup, set `AUTO_LIST_SETUP` to `false` near the top of the script.

## Safe review workflow

1. Click **Clean HTML** on the relevant Notification Content section.
2. Click **View HTML** and inspect the indented source.
3. Toggle back to the rendered view to confirm the message still looks correct.
4. Click **Apply to Message** only after the cleaned result is acceptable.
5. Save in Cornerstone immediately.
6. For localized emails, repeat the process with the matching language selected in Cornerstone.

## Limitations

- Removing inline styling can change fonts, colors, spacing, alignment, image sizing, and other intentional presentation.
- Removing classes and IDs can affect formatting supplied by a page or email stylesheet.
- Pretty-printing is designed for readability, not byte-for-byte preservation of the source.
- The formatter keeps inline phrasing together to avoid inserting visible spaces, so not every nested inline element starts on a separate line.
- Cleaning the review copy cannot be undone with a dedicated Undo button. Before Apply to Message, use Refresh or reload the source page to rebuild the summary from Cornerstone.
- Once cleaned content is applied, Cornerstone's own save and navigation behavior determines whether it can be recovered.

## Version history

- **1.30:** the email list setup runs only when the page is opened or refreshed, not on the reload that follows toggling Include Inactive Emails or Expand/Collapse All yourself.
- **1.29:** email list pages automatically uncheck Include Inactive Emails and click Expand/Collapse All on load (`AUTO_LIST_SETUP`).
- **1.28:** renamed Clean HTML to Lint HTML, preserved style-bearing markup and spacing, and documented non-destructive HTML/email warning checks.
- **1.27:** changed cleaning behavior to preserve tags and attributes that can affect styling.
- **1.26:** added the dedicated Cornerstone editor resize handle while preserving editor-mode switching.
- **1.25:** corrected WYSIWYG/HTML visibility interference from the original resizing approach.

- **1.24:** added horizontal and vertical resizing to the original Cornerstone message editor and reapplies resize support after dynamic editor reloads.
- **1.23:** added readable line breaks and two-space indentation to Clean HTML output.
- **1.22:** added Clean HTML and its seven HTML5 Editor-style cleanup operations.
- **1.21:** underlined links in the Notification Content preview.
- **1.20:** improved headings, alignment, dividers, and image layout.
- **1.19:** improved list formatting.
- **1.18:** improved localized-content loading and safeguards.
- **1.17:** introduced localization support contributed by **Luke Brown**.
