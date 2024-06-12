import AbridgedUrlLink from "../common/AbridgedUrlLink";
import { Feature } from "../geojson-types";

type FeaturePopupProps = {
  feature: Feature;
}

export function FeaturePopup({ feature }: FeaturePopupProps) {
  return (
    <div style={{ height: "200px", overflow: "auto" }}>
      <table>
        <tbody>
          {Object.entries(feature.properties).map(([key, value]) => (
            <tr key={key}>
              <th>{key}</th>
              <td>
                {value === "" ? undefined : typeof value === "string" &&
                  value.startsWith("http") ? (
                  <AbridgedUrlLink target="_blank" href={value} length={21} />
                ) : typeof value === "string" || typeof value === "number" ? (
                  value
                ) : (
                  JSON.stringify(value)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}