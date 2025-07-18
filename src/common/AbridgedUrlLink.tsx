import { FC } from "react";

export interface IAbridgedUrlProps {
  length: number;
  href: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export const AbridgedUrlLink: FC<IAbridgedUrlProps> = ({ length, href, target = "_blank", rel = "noopener noreferrer" }) => {
  // determine how many characters can be on either side of the "..."
  const firstHalfLength = Math.floor((length - 3) / 2);
  const secondHalfLength =
    length % 2 ? firstHalfLength : firstHalfLength + 1;
  // create the abridged link by splitting off the protocol and replacing excessive characters with "..."
  const withoutProtocol = href.split("//")[1];
  const abridged =
    withoutProtocol.length > length
      ? `${withoutProtocol.slice(0, firstHalfLength)}...${withoutProtocol.slice(-secondHalfLength)}`
      : withoutProtocol;
  return (
    <a target={target} rel={rel} href={href}>
      {abridged}
    </a>
  );
};

export default AbridgedUrlLink;
