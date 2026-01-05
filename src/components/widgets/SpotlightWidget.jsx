import WidgetTemplate from "./WidgetTemplate";

/* eslint-disable react/prop-types */
export default function SpotlightWidget() {
  return (
    <WidgetTemplate title="Spotlight">
      <div style={{ opacity: 0.75 }}>
        Highlight a key message, hero copy, or featured section.
      </div>
    </WidgetTemplate>
  );
}

SpotlightWidget.widgetMeta = {
  name: "Spotlight",
  icon: "S",
};
