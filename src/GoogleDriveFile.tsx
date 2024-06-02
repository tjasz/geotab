import CSS from "csstype";

export type DriveFile = {
  id: string;
  mimeType: string;
  name: string;
  modifiedByMeTime: string;
  size: number;
};
type PropertyDefinition = {
  id: string;
  name: string;
  visible: boolean;
  align: CSS.Property.TextAlign;
  display: (v: any) => string;
};
const FileSizePrefixes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
export const driveFileProperties: PropertyDefinition[] = [
  {
    id: "id",
    name: "ID",
    visible: false,
    align: "left",
    display: (v: string) => v,
  },
  {
    id: "mimeType",
    name: "MIME Type",
    visible: false,
    align: "left",
    display: (v: string) => v,
  },
  {
    id: "name",
    name: "Name",
    visible: true,
    align: "left",
    display: (v: string) => v,
  },
  {
    id: "modifiedByMeTime",
    name: "Modified By Me",
    visible: true,
    align: "left",
    display: (v: string) => v,
  },
  {
    id: "size",
    name: "Size",
    visible: true,
    align: "right",
    display: (v: string) => {
      let n = Number(v);
      let powerOf1024 = 0;
      while (n > 1024) {
        n = n / 1024;
        powerOf1024++;
      }
      return Math.round(n).toString() + " " + FileSizePrefixes[powerOf1024];
    },
  },
];
