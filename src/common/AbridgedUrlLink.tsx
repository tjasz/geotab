import { FC } from "react";

export interface IAbridgedUrlProps {
  length: number;
  href: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export const AbridgedUrlLink: FC<IAbridgedUrlProps> = (props) => {
  // determine how many characters can be on either side of the "..."
  const firstHalfLength = Math.floor((props.length - 3) / 2);
  const secondHalfLength =
    props.length % 2 ? firstHalfLength : firstHalfLength + 1;
  // create the abridged link by splitting off the protocol and replacing excessive characters with "..."
  const withoutProtocol = props.href.split("//")[1];
  const abridged =
    withoutProtocol.length > props.length
      ? `${withoutProtocol.slice(0, firstHalfLength)}...${withoutProtocol.slice(-secondHalfLength)}`
      : withoutProtocol;
  return (
    <a target={props.target} rel={props.rel} href={props.href}>
      {abridged}
    </a>
  );
};

export default AbridgedUrlLink;
