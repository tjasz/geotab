export function GeotabLogo(props) {
  return (
    <svg height={props.height ?? 24} width={props.width ?? 24} style={{backgroundColor:"white"}} viewBox={"0 0 100 100"}>
    <path id="track" d="M4 96 Q 33 33 50 50 67 67 96 4"
      fillOpacity={0}
      strokeDasharray={"3,3"}
      style={{stroke:"#99cdff", strokeWidth:3}}  />
    <path id="grid" d="M2 2 L2 98 L98 98 L98 2 Z M0 33 L100 33 M0 67 L100 67 M33 0 L33 100 M67 0 L67 100"
      fillOpacity={0}
      style={{stroke:"black", strokeWidth:4}} />
    <path id="pin" d="M24 36 A26 26 180 0 1 76 36 Q76 53 50 90 Q24 53 24 36"
      fillOpacity={1}
      style={{stroke:"black", strokeWidth:1, fill:"#336799"}} />
    <circle id="pincenter" cx="50" cy="36" r="8" stroke="black" strokeWidth="1" fill="black" />
    </svg>
  );
}