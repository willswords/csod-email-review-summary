// ==UserScript==
// @name         CSOD Email Review Summary
// @namespace    burnsmcd.csod.tools
// @version      1.16
// @description  Summarizes the email settings and content on Cornerstone email pages into an editable rich text box at the bottom of the page, ready to copy/send for review.
// @match        https://*.csod.com/*Emails.aspx*
// @match        https://*.csod.com/*Email*.aspx*
// @match        https://*.csod.com/Email/*
// @match        https://*.csod.com/*/Email/*
// @match        https://*.csod.com/*EmailEdit*.aspx*
// @match        https://*.csod.com/LMS/Admin/NewUI/ManageTrainingEditCombined.aspx*
// @match        https://*.csod.com/*ManageTraining*.aspx*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Set to true to also show Action (trigger) and Email Format rows.
  const SHOW_EXTRAS = false;

  // Settings whose values are shown in bold in the summary.
  const BOLD_VALUES = ['Email Title', 'Subject'];

  const PANEL_ID = 'er-review-panel';
  const BOX_ID = 'er-review-box';
  let userEdited = false;

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clean = (s) => String(s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const visible = (el) => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  const inPanel = (el) => !!el.closest('#' + PANEL_ID);
  const inDialog = (el) => !!el.closest('[role="dialog"], .modal, .modalBackground');

  function scopeRoot() {
    return document.querySelector('.main-content')
      || document.querySelector('[id$="_masterPageBody"]')
      || document.querySelector('form')
      || document.body;
  }

  function pageTitle() {
    const cands = [
      'h1.material-title',
      '#ctl00_masterPageBody h1', 'main h1',
      '[id$="_mainPanel_titleMiddle"] h1',
      'h1'
    ];
    for (const sel of cands) {
      for (const h of document.querySelectorAll(sel)) {
        if (inPanel(h)) continue;
        const t = clean(h.textContent);
        if (t && t.length <= 150) return t.replace(/\s*-\s*Edit$/i, '').replace(/^Edit\s+(?!Email$)/i, '');
      }
    }
    // Fall back to the browser tab title, e.g. "Manage Email - Realize Your Potential: ..."
    return clean(document.title).split(/\s+-\s+/)[0] || 'Email';
  }

  function currentUser() {
    const el = document.querySelector('[id$="_responsiveNav_lblName"]');
    return clean(el && el.textContent);
  }

  /* ---------- label resolution ---------- */
  function labelFor(el) {
    if (el.id) {
      const lab = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lab) {
        const bold = lab.querySelector('.b, b, strong');
        return { name: clean(bold ? bold.textContent : lab.textContent), desc: bold ? clean(lab.textContent.replace(bold.textContent, '')).replace(/^-\s*/, '') : '' };
      }
    }
    const wrap = el.closest('label');
    if (wrap) return { name: clean(wrap.textContent), desc: '' };
    const lbBy = el.getAttribute('aria-labelledby');
    if (lbBy) {
      const t = lbBy.split(/\s+/).map(id => document.getElementById(id)).filter(Boolean).map(n => n.textContent).join(' ');
      if (clean(t)) return { name: clean(t), desc: '' };
    }
    if (el.getAttribute('aria-label')) return { name: clean(el.getAttribute('aria-label')), desc: '' };
    const td = el.closest('td');
    if (td) {
      let prev = td.previousElementSibling;
      while (prev && !clean(prev.textContent)) prev = prev.previousElementSibling;
      if (prev) return { name: clean(prev.textContent).replace(/[:*]+$/, ''), desc: '' };
      const tr = td.closest('tr');
      const prevRow = tr && tr.previousElementSibling;
      if (prevRow && !prevRow.querySelector('input,select,textarea') && clean(prevRow.textContent)) {
        return { name: clean(prevRow.textContent).replace(/[:*]+$/, ''), desc: '' };
      }
    }
    if (el.title) return { name: clean(el.title), desc: '' };
    const n = (el.name || el.id || 'Field').split(/[$_]/).pop();
    return { name: n.replace(/([a-z])([A-Z])/g, '$1 $2'), desc: '' };
  }

  /* ---------- targeted field extraction ---------- */
  // Cornerstone uses the same control IDs on the system Email Edit page and the
  // learning-object email pages, so match on ID suffix first, then fall back to labels.
  const byId = (suffix) => document.querySelector('[id$="' + suffix + '"]');
  const W = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  const JUNK = /^(x|×|remove|delete|add|select|browse|search|edit|clear|user or|or|\+|-|\*|:|,)$/i;

  function findLabelEl(root, re) {
    const cands = root.querySelectorAll('label, th, td, span, div, b, strong, dt, legend, p');
    for (const el of cands) {
      if (inPanel(el) || inDialog(el) || !visible(el)) continue;
      const own = clean(Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(' '))
        || (el.children.length === 0 ? clean(el.textContent) : '');
      const txt = own.replace(/[:*]+\s*$/, '').trim();
      if (txt && txt.length <= 40 && re.test(txt)) return el;
    }
    return null;
  }

  // The cell that holds the value for a label (label cell -> next cell)
  function valueCell(re) {
    const lab = findLabelEl(scopeRoot(), re);
    if (!lab) return null;
    if (lab.tagName === 'LABEL' && lab.htmlFor) {
      const t = document.getElementById(lab.htmlFor);
      if (t) return t.closest('td, div') || t.parentElement;
    }
    const cell = lab.closest('td, th');
    if (cell && cell.nextElementSibling) return cell.nextElementSibling;
    return lab.nextElementSibling || (lab.parentElement && lab.parentElement.nextElementSibling);
  }

  function inputValue(el) {
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked ? 'Yes (checked)' : 'No (unchecked)';
    if (el.tagName === 'SELECT') {
      const t = Array.from(el.selectedOptions).map(o => clean(o.textContent)).filter(v => v && !/^select$/i.test(v)).join(', ');
      return t;
    }
    return clean(el.value);
  }

  function firstInput(cell, sel) {
    return cell ? cell.querySelector(sel || 'input[type=checkbox], select, input[type=text], input[type=email], input:not([type]), textarea') : null;
  }

  // Recipients are rendered as rows of: [trash link] [name].
  // Roles (Student, User's manager, ...) come from the Add dropdown; anything else is a named user.
  function recipientList(cell, isCc) {
    if (!cell) return '';
    const vals = [];
    const add = (v) => { v = clean(v).replace(/[\s×✕✖]+$/, ''); if (v && !JUNK.test(v) && !vals.includes(v)) vals.push(v); };

    // Prefer the exact repeater for this field (Send To vs Cc), then fall back to any trash-icon rows
    const repeater = isCc ? '[id*="_rptRecipientsCc_"]' : '[id*="_rptRecipients_"]';
    let triggers = Array.from(document.querySelectorAll('a' + repeater));
    if (!triggers.length) triggers = Array.from(cell.querySelectorAll('a[id*="Linkbutton"], i.fa-icon-trash'));
    triggers.forEach(t => {
      const row = t.closest('div') || t.parentElement;
      if (!row || inPanel(row)) return;
      const clone = row.cloneNode(true);
      clone.querySelectorAll('a, i, script, input, select').forEach(n => n.remove());
      add(clone.textContent);
    });
    cell.querySelectorAll('input[type=text]').forEach(i => { if (i.value) i.value.split(/[;,]/).forEach(add); });
    cell.querySelectorAll('input[type=checkbox]:checked').forEach(cb => add(labelFor(cb).name));
    cell.querySelectorAll('select[multiple]').forEach(s => Array.from(s.selectedOptions).forEach(o => add(o.textContent)));

    // Role names = options in this field's "Add" dropdown
    const dd = byId(isCc ? '_lstEmailRecipientCc' : '_lstEmailRecipient') || cell.querySelector('select:not([multiple])');
    const roles = dd ? Array.from(dd.options).map(o => clean(o.textContent).toLowerCase()).filter(Boolean) : [];
    if (!roles.length) return vals.join('\n');
    return vals.map(v => v + (roles.includes(v.toLowerCase()) ? ' (role)' : ' (user)')).join('\n');
  }

  // Newer layout: recipients shown as removable "chips" (e.g. "Student ×") under the field.
  // Scan everything between this field's label and the next field's label.
  const CHIP_X = /^[\s×✕✖xX]+$/;
  const CHIP_CLASS = /chip|pill|tag|token|badge|lozenge|selected|recipient|multi-?value/i;
  const UI_TEXT = /^(select|add|or|user or|or user|dynamic user|send to|cc|bcc|user|search|remove|clear|none|-+)$/i;
  const HELP_TEXT = /separate email|will be copied|each recipient|recipients? listed|please select/i;
  const cls = (el) => { const c = el.className; return (c && c.baseVal !== undefined) ? c.baseVal : (c || ''); };
  const attrs = (el) => ['aria-label', 'title', 'alt', 'src', 'data-icon', 'data-testid', 'role']
    .map(a => el.getAttribute && (el.getAttribute(a) || '')).join(' ') + ' ' + cls(el);

  function chipText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('button, svg, img, i, [role="button"], [aria-hidden="true"]').forEach(n => n.remove());
    return clean(clone.textContent).replace(/[\s×✕✖]+$/, '').replace(/^[\s×✕✖]+/, '').trim();
  }

  function chipsBetween(startEl, endEl) {
    if (!startEl) return [];
    const root = startEl.ownerDocument || document;
    const after = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    const inRange = (el) => !inPanel(el) && after(startEl, el) && (!endEl || after(el, endEl)) && !startEl.contains(el)
      && !el.closest('select, option, script, style, [role="listbox"], [role="option"]');
    const cands = Array.from(root.querySelectorAll('span, div, li, a, button, label, p'))
      .filter(el => inRange(el) && visible(el));

    const hasRemoveCtrl = (el) => Array.from(el.querySelectorAll('*')).some(c => {
      const t = clean(c.textContent);
      return (t && CHIP_X.test(t) && t.length <= 2) ||
        /remove|delete|close|times|clear|dismiss|cancel|icon-x|\bx\b/i.test(attrs(c)) ||
        (c.tagName === 'svg' || c.tagName === 'SVG' || c.tagName === 'BUTTON' || c.getAttribute('role') === 'button');
    });
    const isChip = (el) => {
      const t = chipText(el);
      if (!t || t.length > 80 || UI_TEXT.test(t) || HELP_TEXT.test(t)) return false;
      if (el.querySelector('input, select, textarea')) return false;
      return hasRemoveCtrl(el) || CHIP_CLASS.test(cls(el)) || /\s[×✕✖]$/.test(clean(el.textContent));
    };

    const out = [];
    const chips = cands.filter(isChip);
    chips.forEach(el => {
      if (chips.some(o => o !== el && el.contains(o))) return; // keep innermost
      const t = chipText(el);
      if (t && !out.includes(t)) out.push(t);
    });
    if (out.length) return out;

    // Fallback: short standalone text items in the range (skip labels, buttons and help text)
    cands.forEach(el => {
      if (el.children.length && Array.from(el.children).some(c => clean(c.textContent))) {
        // only consider elements whose text is mostly their own
        const own = clean(Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(' '));
        if (!own) return;
      }
      const t = chipText(el);
      if (!t || t.length > 60 || t.split(' ').length > 6 || UI_TEXT.test(t) || HELP_TEXT.test(t) || /^\(/.test(t)) return;
      if (el.closest('a, button') && !CHIP_CLASS.test(cls(el.closest('a, button')))) return;
      if (!out.includes(t)) out.push(t);
    });
    return out;
  }

  const FIELD_LABELS = [/^send\s*to\b/i, /^cc\b/i, /^subject\b/i, /^availability/i, /^default\s*language\b/i,
                        /^message\b/i, /^email\s*format\b/i, /^type\b/i, /^from\b/i];
  function nextLabelAfter(el) {
    let best = null;
    FIELD_LABELS.forEach(re => {
      const l = findLabelEl(scopeRoot(), re);
      if (l && l !== el && (el.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) &&
          (!best || (l.compareDocumentPosition(best) & Node.DOCUMENT_POSITION_FOLLOWING))) best = l;
    });
    return best;
  }

  function recipientChips(re) {
    const lab = findLabelEl(scopeRoot(), re) || findLabelEl(document.body, re);
    return lab ? chipsBetween(lab, nextLabelAfter(lab)) : [];
  }

  function mergeRecipients(listText, chips) {
    const vals = listText ? listText.split('\n') : [];
    const base = vals.map(v => v.replace(/\s\((role|user)\)$/, '').toLowerCase());
    chips.forEach(c => { if (!base.includes(c.toLowerCase())) vals.push(c); });
    return vals.join('\n');
  }

  function defaultLanguage() {
    const lbl = findLabelEl(scopeRoot(), /^default\s*language\b/i);
    if (lbl) {
      const cell = valueCell(/^default\s*language\b/i);
      const v = cell && (inputValue(firstInput(cell)) || clean(cell.innerText));
      if (v) return v;
    }
    // "Email Title (English (US))" -> English (US)
    const t = byId('_lblEmailTitle') || byId('_lblSubject');
    const m = t && clean(t.textContent).match(/\((.+)\)\s*$/);
    if (m) return m[1];
    const ddn = byId('_messageLanguageSelector_LanguageDDN');
    return ddn ? inputValue(ddn) : '';
  }

  function typeValue() {
    const sel = byId('_lstType') || firstInput(valueCell(/^(email\s*)?type\b/i), 'select');
    let v = inputValue(sel);
    const pnl = byId('_pnlReminder');
    if (/reminder/i.test(v) && pnl && visible(pnl)) {
      const dd = inputValue(byId('_txtDD')) || '0', hh = inputValue(byId('_txtHH')) || '0', mm = inputValue(byId('_txtMM')) || '0';
      const when = document.querySelector('input[name$="rdRemind"]:checked');
      v += ' – ' + dd + ' day(s), ' + hh + ' hour(s), ' + mm + ' min(s)' + (when ? ' ' + labelFor(when).name : '');
    }
    return v;
  }

  // Availability Criteria: each selected OU/group row + whether Include Subordinates is checked
  function availability() {
    const out = [];
    const seen = new Set();
    document.querySelectorAll('#tableSelectedList tr, [id*="OrgUnitFilter"] table tr').forEach(tr => {
      if (inPanel(tr) || seen.has(tr)) return;
      seen.add(tr);
      const cells = Array.from(tr.querySelectorAll(':scope > td'));
      if (cells.length < 2) return;
      // criteria text = the cell without the trash link or the subordinates checkbox
      const textCell = cells.find(td => !td.querySelector('a, input[type=checkbox], select') && clean(td.textContent));
      if (!textCell) return;
      const text = clean(textCell.textContent);
      if (!text || /^select criteria$/i.test(text)) return;
      const sub = tr.querySelector('input[type=checkbox][id$="chkIncludeSubs"], input[type=checkbox]');
      const subTxt = sub ? 'Include Subordinates: ' + (sub.checked ? 'Yes (checked)' : 'No (unchecked)') : 'Include Subordinates: N/A';
      const line = text + ' — ' + subTxt;
      if (!out.includes(line)) out.push(line);
    });
    return out.join('\n');
  }

  // Ordered list of rows to show (matches the reviewed Word layout)
  function extractSettings() {
    const get = (idSuffix, re) => inputValue(byId(idSuffix) || firstInput(valueCell(re)));
    const rows = [
      { label: 'Email Title',      value: get('_txtTitle', /^(email\s*)?(title|name)\b/i) },
      { label: 'Active',           value: get('_chkActive', /^active\b/i) },
      { label: 'From Address',     value: get('_txtReturnAddress', /^from(\s*address)?\b/i) },
      { label: 'Reply-To Address', value: get('_txtReplyToAddress', /^reply[\s-]*to(\s*address)?\b/i) },
      { label: 'Type',             value: typeValue() },
      { label: 'Default Language', value: defaultLanguage() },
      { label: 'Send To',          value: mergeRecipients(recipientList(valueCell(/^send\s*to\b/i), false), recipientChips(/^send\s*to\b/i)), multiline: true },
      { label: 'Cc',               value: mergeRecipients(recipientList(valueCell(/^cc\b/i), true), recipientChips(/^cc\b/i)), multiline: true },
      { label: 'Availability Criteria', value: availability(), multiline: true },
      { label: 'Subject',          value: get('_txtSubject', /^subject\b/i) }
    ];
    if (SHOW_EXTRAS) {
      const action = byId('_lblAction');
      if (action) rows.splice(0, 0, { label: 'Action (Trigger)', value: clean(action.textContent) });
      const mode = document.querySelector('input[name$="rblEmailMode"]:checked');
      if (mode) rows.push({ label: 'Email Format', value: labelFor(mode).name });
    }
    return rows.map(r => ({ label: r.label, value: r.value || (r.label === 'Availability Criteria' ? '(none – available to all)' : '(blank)'), multiline: !!r.multiline }));
  }

  function sanitize(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('script, style, meta, link, iframe, object, embed').forEach(n => n.remove());
    // Custom elements (tag names with a hyphen) are injected by browser extensions, not part of the email
    Array.from(tmp.querySelectorAll('*')).filter(n => n.tagName.includes('-')).forEach(n => n.remove());
    const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_COMMENT);
    const comments = []; while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach(c => c.remove());
    tmp.querySelectorAll('*').forEach(n => {
      Array.from(n.attributes).forEach(a => { if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
    });
    // Make image/link URLs absolute so they still work after pasting into Outlook/Word
    tmp.querySelectorAll('img[src]').forEach(img => {
      try { img.setAttribute('src', new URL(img.getAttribute('src'), location.href).href); } catch (e) { /* keep */ }
    });
    tmp.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (h && !/^(mailto:|tel:|#|javascript:)/i.test(h)) { try { a.setAttribute('href', new URL(h, location.href).href); } catch (e) { /* keep */ } }
    });
    // Images that are floated/aligned let the following text wrap beside them; force a line break after them
    tmp.querySelectorAll('img').forEach(img => {
      const align = (img.getAttribute('align') || '').toLowerCase();
      const flt = (img.style && img.style.cssFloat) || '';
      if (/left|right/.test(align) || /left|right/.test(flt)) {
        const br = document.createElement('br');
        br.setAttribute('data-er-added', '1');
        br.setAttribute('clear', 'all');
        br.style.clear = 'both';
        img.insertAdjacentElement('afterend', br);
      } else {
        // inline image immediately followed by text with no break: start the text on a new line
        const next = img.nextSibling;
        const nextIsText = next && ((next.nodeType === 3 && clean(next.textContent)) ||
          (next.nodeType === 1 && !/^(BR|P|DIV|TABLE|UL|OL|H\d)$/i.test(next.tagName) && clean(next.textContent)));
        const prev = img.previousSibling;
        const standalone = !prev || (prev.nodeType === 3 && !clean(prev.textContent)) || (prev.nodeType === 1 && /^(BR|IMG)$/i.test(prev.tagName));
        if (nextIsText && standalone && (img.width > 60 || parseInt(img.getAttribute('width') || '0', 10) > 60 || !img.getAttribute('width'))) {
          const br2 = document.createElement('br');
          br2.setAttribute('data-er-added', '1');
          img.insertAdjacentElement('afterend', br2);
        }
      }
    });
    return tmp.innerHTML;
  }

  function extractBody() {
    // 1) Telerik RadEditor API (most accurate, reflects unsaved edits)
    try {
      const ed = byId('_radeditorCntrl');
      if (ed && W.$find) {
        const inst = W.$find(ed.id);
        if (inst && inst.get_html) {
          const h = inst.get_html(true);
          if (clean(h.replace(/<[^>]*>/g, ''))) return sanitize(h);
        }
      }
    } catch (e) { /* fall through */ }
    // 2) Editor iframe / contenteditable
    for (const fr of scopeRoot().querySelectorAll('iframe')) {
      if (inPanel(fr) || inDialog(fr) || !visible(fr)) continue;
      try {
        const d = fr.contentDocument;
        if (d && d.body && (d.designMode === 'on' || d.body.isContentEditable) && clean(d.body.textContent)) return sanitize(d.body.innerHTML);
      } catch (e) { /* cross-origin */ }
    }
    // 3) Hidden backing textarea (URL-encoded on page load)
    const ta = byId('ContentHiddenTextarea');
    if (ta && ta.value) {
      let v = ta.value;
      if (/%3c/i.test(v)) { try { v = decodeURIComponent(v); } catch (e) { v = unescape(v); } }
      return sanitize(v);
    }
    // 4) Plain-text mode
    const plain = Array.from(scopeRoot().querySelectorAll('textarea')).find(t => visible(t) && !inPanel(t) && clean(t.value));
    if (plain) return esc(plain.value).replace(/\n/g, '<br>');
    return '';
  }

  function extractHistory(limit) {
    let cells = Array.from(document.querySelectorAll('[id$="_cpModificationHistory_content"] td.plain-text'));
    if (!cells.length) cells = Array.from(document.querySelectorAll('#HistoryTable td.body, [id$="_cspnlHistory_content"] td.body'));
    return cells.map(td => clean(td.textContent))
      .filter(t => t && !/^\*?\s*time zone/i.test(t))
      .slice(0, limit);
  }

  function learningObjectTitle() {
    const t = pageTitle();
    return /^(edit|manage|create|copy)\s+email$/i.test(t) ? 'N/A (system email – not tied to a learning object)' : t;
  }

  /* ---------- build summary HTML ---------- */
  const S = {
    h: 'font-family:Segoe UI,Arial,sans-serif;color:#1048CA;margin:14px 0 6px;font-size:16px;',
    p: 'font-family:Segoe UI,Arial,sans-serif;font-size:13px;',
    tbl: 'border-collapse:collapse;width:100%;font-family:Segoe UI,Arial,sans-serif;font-size:13px;margin-bottom:8px;',
    th: 'border:1px solid #999;background:#e8eefc;padding:6px;text-align:left;vertical-align:top;',
    td: 'border:1px solid #999;padding:6px;vertical-align:top;',
    rev: 'border:1px solid #999;padding:6px;vertical-align:top;background:#fffbe6;min-width:160px;'
  };

  /* ---------- list mode (training Emails tab / email list) ---------- */
  // True when an individual email's edit form is on screen
  function isEmailEditForm() {
    return !!(byId('_txtSubject') || byId('_lstType') || byId('_radeditorCntrl') || byId('ContentHiddenTextarea'));
  }

  function emailOption() {
    const r = document.querySelector('input[type=radio][name$="EmailOption"]:checked');
    if (!r) return '';
    const lab = document.querySelector('label[for="' + CSS.escape(r.id) + '"]');
    const b = lab && lab.querySelector('.b, b, strong');
    return clean(b ? b.textContent : (lab ? lab.textContent : r.value));
  }

  // Each action row: title, type, description, whether emails exist (expand caret shown),
  // and any email rows already expanded beneath it.
  function emailActions() {
    const out = [];
    document.querySelectorAll('span[id$="_eventTitle"]').forEach(sp => {
      if (inPanel(sp)) return;
      const tr = sp.closest('tr');
      if (!tr) return;
      const tds = tr.querySelectorAll(':scope > td');
      const hasCaret = !!tr.querySelector('input[type=image][id$="_img"]');
      const emails = [];
      const detail = tr.nextElementSibling;
      if (detail && detail.classList.contains('emailExBg')) {
        detail.querySelectorAll('tr').forEach(r => {
          const cells = Array.from(r.querySelectorAll(':scope > td')).map(td => clean(td.innerText || td.textContent)).filter(Boolean);
          if (cells.length && !r.querySelector('th')) emails.push(cells.join(' | '));
        });
      }
      out.push({
        action: clean(sp.textContent),
        type: clean(tds[1] && tds[1].textContent),
        desc: clean(tds[2] && tds[2].textContent),
        status: emails.length ? emails.length + ' email(s)' : (hasCaret ? 'Has email(s) – expand to list' : 'No emails'),
        emails
      });
    });
    return out;
  }

  function buildListSummary() {
    const title = pageTitle();
    const opt = emailOption();
    const inactive = byId('_chkIncludeInactive');
    const actions = emailActions();
    const history = extractHistory(5);

    let h = '<h2 style="' + S.h + 'font-size:19px;">Email Review: ' + esc(title) + '</h2>';
    h += '<div style="display:block;margin:0 0 8px;"><h2 style="display:inline;">Email Setup Overview</h2></div>';
    h += '<p style="' + S.p + 'margin:4px 0 10px;"><b>Reviewer instructions:</b> Please review the email setup below. '
      + 'Enter any changes in the yellow <i>Requested Revision</i> column and return this document. Leave blank if no change is needed.</p>';

    h += '<h3 style="' + S.h + '">Overview</h3><table style="' + S.tbl + '">';
    [
      ['Learning Object', title],
      ['Email Option', opt || '(not found)'],
      ['Include Inactive Emails', inactive ? (inactive.checked ? 'Yes (checked)' : 'No (unchecked)') : 'N/A'],
      ['Prepared by', currentUser() || '(unknown)'],
      ['Generated', new Date().toLocaleString()],
      ['Page URL', location.href]
    ].forEach(([k, v]) => {
      h += '<tr><th style="' + S.th + 'width:28%;">' + esc(k) + '</th><td style="' + S.td + '">' + esc(v) + '</td></tr>';
    });
    h += '</table>';

    if (/no emails/i.test(opt)) {
      h += '<p style="' + S.p + '">No emails will be sent for this training.</p>';
    } else if (/system default/i.test(opt)) {
      h += '<p style="' + S.p + '">This training uses the system default email templates. To review a specific email, open it from the Email Administration area.</p>';
    }

    if (actions.length) {
      h += '<h3 style="' + S.h + '">Email Actions</h3><table style="' + S.tbl + '"><tr>'
        + '<th style="' + S.th + '">Action</th><th style="' + S.th + '">Action Type</th>'
        + '<th style="' + S.th + '">Description</th><th style="' + S.th + '">Emails</th>'
        + '<th style="' + S.th + '">Requested Revision</th></tr>';
      actions.forEach(a => {
        const em = a.emails.length ? a.status + '<br>' + a.emails.map(esc).join('<br>') : esc(a.status);
        h += '<tr><td style="' + S.td + '"><b>' + esc(a.action) + '</b></td><td style="' + S.td + '">' + esc(a.type) + '</td>'
          + '<td style="' + S.td + '">' + esc(a.desc) + '</td><td style="' + S.td + '">' + em + '</td>'
          + '<td style="' + S.rev + '">&nbsp;</td></tr>';
      });
      h += '</table>';
      h += '<p style="' + S.p + 'color:#555;font-size:12px;">Tip: open an individual email to generate a full review of its settings and Notification Content.</p>';
    }

    if (history.length) {
      h += '<h3 style="' + S.h + '">Recent Modification History</h3><ul style="' + S.p + 'font-size:12px;color:#444;">';
      history.forEach(x => { h += '<li>' + esc(x.length > 220 ? x.slice(0, 220) + '…' : x) + '</li>'; });
      h += '</ul>';
    }

    h += '<h3 style="' + S.h + '">Reviewer Comments</h3>';
    h += '<div style="border:1px dashed #c9a800;background:#fffbe6;min-height:60px;padding:8px;">&nbsp;</div>';
    h += '<p style="' + S.p + '">Reviewed by: ____________________ &nbsp;&nbsp; Date: ____________</p>';
    return h;
  }

  function buildSummary() {
    if (!isEmailEditForm()) return buildListSummary();

    const title = pageTitle();
    const settings = extractSettings();
    const body = extractBody();
    const et = settings.find(r => r.label === 'Email Title');
    const emailTitle = (et && et.value !== '(blank)') ? et.value : title;
    const history = extractHistory(5);

    let h = '<h2 style="' + S.h + 'font-size:19px;">Email Review: ' + esc(/^(edit|manage|create|copy)\s+email$/i.test(title) ? emailTitle : title) + '</h2>';
    // Subtitle: the email's action/trigger (e.g. "Assign Training"), falling back to Type
    const actEl = byId('_lblAction');
    const typeRow = settings.find(r => r.label === 'Type');
    const subtitle = clean(actEl && actEl.textContent) || (typeRow && typeRow.value !== '(blank)' ? typeRow.value : '');
    if (subtitle) h += '<div style="display:block;margin:0 0 8px;"><h2 style="display:inline;">' + esc(subtitle) + '</h2></div>';
    h += '<p style="' + S.p + 'margin:4px 0 10px;"><b>Reviewer instructions:</b> Please review the settings and content below. '
      + 'Enter any changes in the yellow <i>Requested Revision</i> column (or directly in the content section) and return this document. '
      + 'Leave blank if no change is needed.</p>';

    // Overview
    h += '<h3 style="' + S.h + '">Overview</h3><table style="' + S.tbl + '">';
    [
      ['Learning Object', learningObjectTitle()],
      ['Prepared by', currentUser() || '(unknown)'],
      ['Generated', new Date().toLocaleString()],
      ['Page URL', location.href]
    ].forEach(([k, v]) => {
      h += '<tr><th style="' + S.th + 'width:28%;">' + esc(k) + '</th><td style="' + S.td + '">' + esc(v) + '</td></tr>';
    });
    h += '</table>';

    // Email Settings
    h += '<h3 style="' + S.h + '">Email Settings</h3><table style="' + S.tbl + '"><tr>'
      + '<th style="' + S.th + '">Setting</th><th style="' + S.th + '">Current Value</th>'
      + '<th style="' + S.th + '">Details</th><th style="' + S.th + '">Requested Revision</th></tr>';
    settings.forEach(f => {
      const valHtml = f.multiline ? esc(f.value).replace(/\n/g, '<br>') : esc(f.value);
      const boldVal = BOLD_VALUES.includes(f.label) && f.value !== '(blank)';
      h += '<tr><td style="' + S.td + '"><b>' + esc(f.label) + '</b></td><td style="' + S.td + '">' + (boldVal ? '<b>' + valHtml + '</b>' : valHtml) + '</td>'
        + '<td style="' + S.td + '">&nbsp;</td><td style="' + S.rev + '">&nbsp;</td></tr>';
    });
    h += '</table>';

    // Content
    h += '<h3 style="' + S.h + '">Notification Content</h3>';
    if (body) {
      h += '<div data-er-ui="1" contenteditable="false" style="margin:0 0 6px;">'
        + '<button type="button" data-er-toggle="1" style="padding:3px 10px;border:1px solid #1048CA;border-radius:4px;background:#fff;color:#1048CA;cursor:pointer;font:600 12px Segoe UI,Arial,sans-serif;">View HTML</button>'
        + '<button type="button" data-er-copyhtml="1" style="display:none;margin-left:6px;padding:3px 10px;border:1px solid #1048CA;border-radius:4px;background:#fff;color:#1048CA;cursor:pointer;font:600 12px Segoe UI,Arial,sans-serif;">Copy HTML</button>'
        + '<button type="button" data-er-apply="1" title="Replace the message in the Cornerstone editor with the content of this box" style="margin-left:6px;padding:3px 10px;border:1px solid #1048CA;border-radius:4px;background:#1048CA;color:#fff;cursor:pointer;font:600 12px Segoe UI,Arial,sans-serif;">Apply to Message</button>'
        + '</div>';
    }
    h += '<div data-er-notif="1" data-er-mode="rendered" style="border:1px solid #b8c4dc;border-left:4px solid #1048CA;border-radius:4px;padding:12px;' + S.p + '">' + (body || '(no content found)') + '</div>';
    h += '<p style="' + S.p + 'margin:8px 0 2px;"><b>Requested revisions to content:</b></p>';
    h += '<div style="border:1px dashed #c9a800;background:#fffbe6;min-height:50px;padding:8px;">&nbsp;</div>';

    // History
    if (history.length) {
      h += '<h3 style="' + S.h + '">Recent Modification History</h3><ul style="' + S.p + 'font-size:12px;color:#444;">';
      history.forEach(x => { h += '<li>' + esc(x.length > 220 ? x.slice(0, 220) + '…' : x) + '</li>'; });
      h += '</ul>';
    }

    // Reviewer comments
    h += '<h3 style="' + S.h + '">Reviewer Comments</h3>';
    h += '<div style="border:1px dashed #c9a800;background:#fffbe6;min-height:60px;padding:8px;">&nbsp;</div>';
    h += '<p style="' + S.p + '">Reviewed by: ____________________ &nbsp;&nbsp; Date: ____________</p>';
    return h;
  }

  /* ---------- panel UI ---------- */
  function btn(text, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.style.cssText = 'margin-right:8px;padding:6px 14px;border:1px solid #1048CA;border-radius:4px;background:#fff;color:#1048CA;cursor:pointer;font:600 13px Segoe UI,Arial,sans-serif;';
    b.addEventListener('click', handler);
    return b;
  }

  function flash(msg) {
    const s = document.getElementById('er-status');
    if (!s) return;
    s.textContent = msg;
    setTimeout(() => { s.textContent = ''; }, 3000);
  }

  /* ---------- View HTML toggle ---------- */
  function toggleNotifHtml(box) {
    const content = box.querySelector('[data-er-notif]');
    const btnT = box.querySelector('[data-er-toggle]');
    const btnC = box.querySelector('[data-er-copyhtml]');
    if (!content || !btnT) return;
    if (content.getAttribute('data-er-mode') !== 'html') {
      // Rendered -> HTML source (includes any edits made in the box)
      const src = content.innerHTML.trim();
      content.innerHTML = '';
      const pre = document.createElement('pre');
      pre.setAttribute('data-er-src', '1');
      pre.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-word;font:12px Consolas,Courier New,monospace;background:#f6f8fa;padding:8px;';
      pre.textContent = src;
      content.appendChild(pre);
      content.setAttribute('data-er-mode', 'html');
      btnT.textContent = 'View Formatted';
      if (btnC) btnC.style.display = '';
    } else {
      // HTML source -> rendered (applies any edits made to the HTML)
      const pre = content.querySelector('[data-er-src]');
      const src = pre ? pre.textContent : content.textContent;
      content.innerHTML = sanitize(src);
      content.setAttribute('data-er-mode', 'rendered');
      btnT.textContent = 'View HTML';
      if (btnC) btnC.style.display = 'none';
    }
  }

  async function copyNotifHtml(box) {
    const pre = box.querySelector('[data-er-notif] [data-er-src]');
    if (!pre) return;
    try { await navigator.clipboard.writeText(pre.textContent); flash('Notification HTML copied.'); }
    catch (e) {
      const range = document.createRange(); range.selectNodeContents(pre);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      const ok = document.execCommand('copy'); sel.removeAllRanges();
      flash(ok ? 'Notification HTML copied.' : 'Select the HTML and press Ctrl+C.');
    }
  }

  /* ---------- Apply edits back to the Cornerstone message editor ---------- */
  function notifHtmlForApply(box) {
    const content = box.querySelector('[data-er-notif]');
    if (!content) return null;
    let html;
    if (content.getAttribute('data-er-mode') === 'html') {
      const pre = content.querySelector('[data-er-src]');
      html = pre ? pre.textContent : content.textContent;
    } else {
      html = content.innerHTML;
    }
    // Remove display-only additions and anything unsafe
    const tmp = document.createElement('div');
    tmp.innerHTML = sanitize(html);
    tmp.querySelectorAll('br[data-er-added]').forEach(n => n.remove());
    // sanitize() re-adds breaks; strip those too so the real email layout is unchanged
    return tmp.innerHTML.replace(/<br[^>]*data-er-added="1"[^>]*>/gi, '');
  }

  function writeToEditor(html) {
    // 1) Telerik RadEditor API
    try {
      const ed = byId('_radeditorCntrl');
      if (ed && W.$find) {
        const inst = W.$find(ed.id);
        if (inst && inst.set_html) { inst.set_html(html); return 'editor'; }
      }
    } catch (e) { /* fall through */ }
    // 2) Editable iframe / contenteditable
    for (const fr of scopeRoot().querySelectorAll('iframe')) {
      if (inPanel(fr) || inDialog(fr) || !visible(fr)) continue;
      try {
        const d = fr.contentDocument;
        if (d && d.body && (d.designMode === 'on' || d.body.isContentEditable)) {
          d.body.innerHTML = html;
          d.body.dispatchEvent(new Event('input', { bubbles: true }));
          const ta = byId('ContentHiddenTextarea');
          if (ta) ta.value = encodeURIComponent(html);
          return 'iframe';
        }
      } catch (e) { /* cross-origin */ }
    }
    const ce = Array.from(scopeRoot().querySelectorAll('[contenteditable="true"]')).find(el => !inPanel(el) && visible(el));
    if (ce) { ce.innerHTML = html; ce.dispatchEvent(new Event('input', { bubbles: true })); return 'contenteditable'; }
    // 3) Hidden backing field only
    const ta = byId('ContentHiddenTextarea');
    if (ta) { ta.value = encodeURIComponent(html); return 'hidden'; }
    // 4) Plain-text mode
    const plain = Array.from(scopeRoot().querySelectorAll('textarea')).find(t => visible(t) && !inPanel(t));
    if (plain) {
      const tmp = document.createElement('div'); tmp.innerHTML = html;
      plain.value = tmp.innerText; plain.dispatchEvent(new Event('change', { bubbles: true }));
      return 'plain';
    }
    return '';
  }

  function applyToMessage(box) {
    const html = notifHtmlForApply(box);
    if (html == null || !clean(html.replace(/<[^>]*>/g, ''))) { flash('Nothing to apply.'); return; }
    if (!confirm('Replace the message in the Cornerstone editor with the Notification Content from this summary?\n\nChanges are not saved until you click Save in Cornerstone.')) return;
    const where = writeToEditor(html);
    if (!where) { flash('Could not find the message editor on this page.'); return; }
    flash(where === 'plain'
      ? 'Applied as plain text. Review the message, then click Save in Cornerstone.'
      : 'Applied to the message. Review it, then click Save in Cornerstone.');
  }

  // Summary HTML for export, without the toggle buttons
  function exportHtml(box) {
    const clone = box.cloneNode(true);
    clone.querySelectorAll('[data-er-ui]').forEach(n => n.remove());
    clone.querySelectorAll('[data-er-added]').forEach(n => n.removeAttribute('data-er-added'));
    clone.querySelectorAll('[data-er-notif],[data-er-src]').forEach(n => {
      n.removeAttribute('data-er-notif'); n.removeAttribute('data-er-mode'); n.removeAttribute('data-er-src');
    });
    return clone;
  }

  async function copyRich() {
    const box = document.getElementById(BOX_ID);
    const exp = exportHtml(box);
    const html = exp.innerHTML;
    const text = (function () {
      const tmp = document.createElement('div');
      tmp.style.cssText = 'position:fixed;left:-99999px;top:0;';
      tmp.innerHTML = html; document.body.appendChild(tmp);
      const t = tmp.innerText; tmp.remove(); return t;
    })();
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]);
      flash('Copied as rich text. Paste into Outlook, Teams, or Word.');
    } catch (e) {
      const tmpNode = document.createElement('div');
      tmpNode.style.cssText = 'position:fixed;left:-99999px;top:0;';
      tmpNode.innerHTML = html; document.body.appendChild(tmpNode);
      const range = document.createRange();
      range.selectNodeContents(tmpNode);
      const sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
      const ok = document.execCommand('copy');
      sel.removeAllRanges();
      tmpNode.remove();
      flash(ok ? 'Copied (fallback). Paste into Outlook, Teams, or Word.' : 'Copy failed. Select the box and press Ctrl+C.');
    }
  }

  function downloadDoc() {
    const box = document.getElementById(BOX_ID);
    const tEl = byId('_txtTitle'); const name = ((tEl && tEl.value) || pageTitle() || 'Email Review').replace(/[\\/:*?"<>|]+/g, '').slice(0, 80);
    const doc = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">'
      + '<head><meta charset="utf-8"><title>' + esc(name) + '</title></head><body>' + exportHtml(box).innerHTML + '</body></html>';
    const blob = new Blob(['\ufeff', doc], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Email Review - ' + name + '.doc';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    flash('Word document downloaded.');
  }

  function render(force) {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.style.cssText = 'clear:both;margin:24px auto;max-width:1100px;padding:14px;border:2px solid #1048CA;border-radius:8px;background:#f7f9ff;box-sizing:border-box;';

      const head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px;';
      const title = document.createElement('strong');
      title.textContent = 'Email Review Summary';
      title.style.cssText = 'font:700 16px Segoe UI,Arial,sans-serif;color:#1048CA;margin-right:14px;';
      head.appendChild(title);
      head.appendChild(btn('Copy Rich Text', copyRich));
      head.appendChild(btn('Download for Word', downloadDoc));
      head.appendChild(btn('Refresh', () => {
        if (userEdited && !confirm('Refreshing will discard edits made in the summary box. Continue?')) return;
        userEdited = false; render(true); flash('Summary refreshed.');
      }));
      head.appendChild(btn('Copy Debug HTML', async () => {
        let html = '<!-- URL: ' + location.href + ' -->\n' + document.documentElement.outerHTML;
        document.querySelectorAll('iframe').forEach((fr, i) => {
          try { if (fr.contentDocument) html += '\n<!-- IFRAME ' + i + ': ' + (fr.src || '') + ' -->\n' + fr.contentDocument.documentElement.outerHTML; } catch (e) { /* cross-origin */ }
        });
        try { await navigator.clipboard.writeText(html); flash('Live page HTML copied. Paste it into a .txt file and send it.'); }
        catch (e) {
          const blob = new Blob([html], { type: 'text/plain' });
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'csod-email-debug.html';
          document.body.appendChild(a); a.click(); a.remove(); flash('Live page HTML downloaded.');
        }
      }));
      head.appendChild(btn('Hide / Show', () => {
        const b = document.getElementById(BOX_ID);
        b.style.display = b.style.display === 'none' ? '' : 'none';
      }));
      const status = document.createElement('span');
      status.id = 'er-status';
      status.style.cssText = 'font:12px Segoe UI,Arial,sans-serif;color:#2e7d32;';
      head.appendChild(status);

      const box = document.createElement('div');
      box.id = BOX_ID;
      box.contentEditable = 'true';
      box.spellcheck = true;
      box.style.cssText = 'background:#fff;border:1px solid #bbb;border-radius:4px;padding:14px;min-height:200px;max-height:700px;overflow:auto;outline:none;';
      box.addEventListener('input', () => { userEdited = true; });
      box.addEventListener('click', (ev) => {
        const t = ev.target.closest('[data-er-toggle],[data-er-copyhtml],[data-er-apply]');
        if (!t || !box.contains(t)) return;
        ev.preventDefault();
        if (t.hasAttribute('data-er-toggle')) { toggleNotifHtml(box); userEdited = true; }
        else if (t.hasAttribute('data-er-apply')) applyToMessage(box);
        else copyNotifHtml(box);
      });

      panel.appendChild(head);
      panel.appendChild(box);

      const footer = document.querySelector('footer.df-footer');
      if (footer && footer.parentNode) footer.parentNode.insertBefore(panel, footer);
      else document.body.appendChild(panel);
    }
    if (force || !userEdited) document.getElementById(BOX_ID).innerHTML = buildSummary();
  }

  /* ---------- page detection ---------- */
  // Dedicated email pages always qualify. Multi-step pages (e.g. ManageTrainingEditCombined.aspx)
  // only qualify while email settings/content are actually on screen.
  function isEmailPage() {
    return /email/i.test(location.pathname);
  }

  function hasEmailContent() {
    const sel = [
      '[id$="_txtSubject"]', '[id$="_lstType"]', '[id$="_radeditorCntrl"]', '[id$="_lblAction"]',
      '[id*="loEmailControl"]', '[id$="_UseSystemDefault"]', '[id$="_UseCustomEmails"]'
    ].join(',');
    const el = Array.from(document.querySelectorAll(sel)).find(e => !inPanel(e) && (visible(e) || e.type === 'radio'));
    if (el) return true;
    const tab = document.querySelector('.NewUICsTab-active');
    return !!(tab && /email/i.test(tab.getAttribute('title') || tab.textContent || ''));
  }

  function removePanel() {
    const p = document.getElementById(PANEL_ID);
    if (p) p.remove();
    userEdited = false;
  }

  function update(force) {
    if (isEmailPage() || hasEmailContent()) render(force);
    else removePanel();
  }

  /* ---------- init + ASP.NET partial postback / dynamic step support ---------- */
  function init() {
    update(true);
    try {
      if (W.Sys && W.Sys.WebForms && W.Sys.WebForms.PageRequestManager) {
        W.Sys.WebForms.PageRequestManager.getInstance().add_endRequest(() => setTimeout(() => update(false), 300));
      }
    } catch (e) { /* not an UpdatePanel page */ }

    // Catch steps/tabs that load without a full page refresh
    let timer = null;
    const obs = new MutationObserver(muts => {
      if (muts.every(m => inPanel(m.target.nodeType === 1 ? m.target : m.target.parentElement || document.body))) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const present = !!document.getElementById(PANEL_ID);
        const wanted = isEmailPage() || hasEmailContent();
        if (wanted && !present) render(true);
        else if (!wanted && present) removePanel();
      }, 600);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // Give rich text editors (iframes) time to load their content
  setTimeout(init, 1200);
})();
