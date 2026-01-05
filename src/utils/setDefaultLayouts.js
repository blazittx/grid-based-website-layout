// Utility helpers for working with default layouts.

export const DEFAULT_HOMEPAGE_LAYOUT = [
  {
    id: "spotlight",
    type: "spotlight",
    col: 0,
    row: 0,
    w: 20,
    h: 5,
    locked: false,
    pinned: true,
    settings: {},
  },
  {
    id: "block-1",
    type: "block",
    col: 0,
    row: 5,
    w: 20,
    h: 7,
    locked: false,
    pinned: false,
    settings: {},
  },
  {
    id: "block-2",
    type: "block",
    col: 20,
    row: 0,
    w: 14,
    h: 12,
    locked: false,
    pinned: false,
    settings: {},
  },
];

export const DEFAULT_HOMEPAGE_LAYOUT_MOBILE = [
  {
    id: "spotlight",
    type: "spotlight",
    col: 0,
    row: 0,
    w: 8,
    h: 4,
    locked: false,
    pinned: true,
    settings: {},
  },
  {
    id: "block-1",
    type: "block",
    col: 0,
    row: 4,
    w: 8,
    h: 8,
    locked: false,
    pinned: false,
    settings: {},
  },
  {
    id: "block-2",
    type: "block",
    col: 0,
    row: 12,
    w: 8,
    h: 8,
    locked: false,
    pinned: false,
    settings: {},
  },
];

export const DEFAULT_TEMPLATE_PAGE_LAYOUT = [
  {
    id: "spotlight",
    type: "spotlight",
    col: 0,
    row: 0,
    w: 18,
    h: 5,
    locked: false,
    pinned: true,
    settings: {},
  },
  {
    id: "block-1",
    type: "block",
    col: 0,
    row: 5,
    w: 18,
    h: 8,
    locked: false,
    pinned: false,
    settings: {},
  },
  {
    id: "block-2",
    type: "block",
    col: 18,
    row: 0,
    w: 16,
    h: 13,
    locked: false,
    pinned: false,
    settings: {},
  },
];

export const DEFAULT_TEMPLATE_PAGE_LAYOUT_MOBILE = [
  {
    id: "spotlight",
    type: "spotlight",
    col: 0,
    row: 0,
    w: 8,
    h: 4,
    locked: false,
    pinned: true,
    settings: {},
  },
  {
    id: "block-1",
    type: "block",
    col: 0,
    row: 4,
    w: 8,
    h: 8,
    locked: false,
    pinned: false,
    settings: {},
  },
  {
    id: "block-2",
    type: "block",
    col: 0,
    row: 12,
    w: 8,
    h: 8,
    locked: false,
    pinned: false,
    settings: {},
  },
];

/**
 * Set the default layouts for both main page and template page
 * This function can be called from the browser console or imported
 */
export const formatLayoutSnippet = (layout, exportName) => {
  const formatted = JSON.stringify(layout, null, 2);
  return `export const ${exportName} = ${formatted};`;
};

export const copyLayoutSnippet = async (layout, exportName) => {
  const snippet = formatLayoutSnippet(layout, exportName);
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(snippet);
  }
  return snippet;
};

// If running in browser console, expose the helpers
if (typeof window !== "undefined") {
  window.formatLayoutSnippet = formatLayoutSnippet;
  window.copyLayoutSnippet = copyLayoutSnippet;
}
