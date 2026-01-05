import WidgetTemplate from "./WidgetTemplate";

/* eslint-disable react/prop-types */
export default function BlockWidget() {
  return (
    <WidgetTemplate title="Block">
      <div style={{ opacity: 0.75 }}>
        Add structured content, embeds, or custom components here.
      </div>
    </WidgetTemplate>
  );
}

BlockWidget.widgetMeta = {
  name: "Block",
  icon: "B",
};
