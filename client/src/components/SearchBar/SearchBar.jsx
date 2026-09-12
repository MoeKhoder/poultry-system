import { SearchIcon } from "../Icons/Icons";
import "./SearchBar.css";

export default function SearchBar({ placeholder, value, onChange }) {
  return (
    <div className="search-bar">
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-bar-input"
      />
      <span className="search-bar-icon">
        <SearchIcon />
      </span>
    </div>
  );
}
