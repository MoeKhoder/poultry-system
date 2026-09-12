import { ChevDownIcon } from "../Icons/Icons";
import "./SelectWrap.css";

export default function SelectWrap({ icon, value, onChange, children }) {
  return (
    <div className="select-wrap">
      {icon && <span className="select-wrap-leading">{icon}</span>}
      <select value={value} onChange={onChange} style={icon ? undefined : { paddingInlineStart: "14px" }}>
        {children}
      </select>
      <span className="select-wrap-chev">
        <ChevDownIcon />
      </span>
    </div>
  );
}
