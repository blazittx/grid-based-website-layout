const titleCase = (value) => {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

export const getWidgetMeta = (widgetType, component) => {
  const meta = component?.widgetMeta || {};
  const name =
    meta.name ||
    component?.displayName ||
    component?.name ||
    titleCase(widgetType);
  const icon = meta.icon || component?.icon || "??";

  return { name, icon };
};
