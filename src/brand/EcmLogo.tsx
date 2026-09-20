import { EcmStatorMark } from "./EcmStatorMark";

export function EcmLogo(props: { className?: string }) {
  return (
    <span className={props.className ?? "ecm-logo"}>
      <EcmStatorMark className="ecm-logo-mark" />
      <span className="ecm-word">ECM</span>
    </span>
  );
}
