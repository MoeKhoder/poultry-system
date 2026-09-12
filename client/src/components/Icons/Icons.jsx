const c1 = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" };
const c2 = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };

export const HomeIcon = () => (
  <svg {...c1}><path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1Z" strokeLinejoin="round" /></svg>
);
export const UsersIcon = () => (
  <svg {...c1}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" /><path d="M15.5 6.2a3.2 3.2 0 0 1 0 6.3M17.5 14.2c2.5.6 4.5 2.8 4.5 5.8" strokeLinecap="round" /></svg>
);
export const WarehouseIcon = () => (
  <svg {...c1}><path d="M3 10 12 4l9 6v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" strokeLinejoin="round" /><path d="M9 20v-6h6v6" strokeLinejoin="round" /></svg>
);
export const ReceiptIcon = () => (
  <svg {...c1}><path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-18Z" strokeLinejoin="round" /><path d="M9 8h6M9 12h6" strokeLinecap="round" /></svg>
);
export const TruckIcon = () => (
  <svg {...c1}><path d="M3 7h10v9H3z" strokeLinejoin="round" /><path d="M13 10h4l3 3v3h-7z" strokeLinejoin="round" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
);
export const TagIcon = () => (
  <svg {...c1}><path d="M12 4h6a2 2 0 0 1 2 2v6L11 21l-8-8Z" strokeLinejoin="round" /><circle cx="15" cy="9" r="1.4" fill="currentColor" stroke="none" /></svg>
);
export const WalletIcon = () => (
  <svg {...c1}><path d="M4 7h13a3 3 0 0 1 3 3v7a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11" strokeLinejoin="round" /><circle cx="16.5" cy="13" r="1.3" fill="currentColor" stroke="none" /></svg>
);
export const CarIcon = () => (
  <svg {...c1}><path d="M4 16v-3l2-5h12l2 5v3" strokeLinejoin="round" /><path d="M3 16h18v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" /><circle cx="7.5" cy="16" r="1.3" fill="currentColor" stroke="none" /><circle cx="16.5" cy="16" r="1.3" fill="currentColor" stroke="none" /></svg>
);
export const CalcIcon = () => (
  <svg {...c1}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" /></svg>
);
export const ChartIcon = () => (
  <svg {...c1}><path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" /></svg>
);
export const SettingsIcon = () => (
  <svg {...c1}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-2-3.4-2.3.7a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.3a7.6 7.6 0 0 0-2.6 1.5l-2.3-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3l-1.9 1.5 2 3.4 2.3-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2.3.7 2-3.4Z" strokeLinejoin="round" /></svg>
);
export const SearchIcon = () => (
  <svg {...c1}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.8-3.8" strokeLinecap="round" /></svg>
);
export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
);
export const ChevDownIcon = () => (
  <svg {...c2}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const ChevBackIcon = () => (
  <svg {...c2}><path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const FilterIcon = () => (
  <svg {...c1}><path d="M4 5h16l-6 7.5V19l-4 2v-8.5Z" strokeLinejoin="round" /></svg>
);
export const CalendarIcon = () => (
  <svg {...c1}><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" /></svg>
);
export const EditIcon = () => (
  <svg {...c1}><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17Z" strokeLinejoin="round" /><path d="m14 6.5 3 3" strokeLinecap="round" /></svg>
);
export const EyeIcon = () => (
  <svg {...c1}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinejoin="round" /><circle cx="12" cy="12" r="2.6" /></svg>
);
export const TrashIcon = () => (
  <svg {...c1}><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 11v6M14 11v6" strokeLinecap="round" /></svg>
);
export const XIcon = () => (
  <svg {...c2}><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
);
export const UploadIcon = () => (
  <svg {...c1}><path d="M12 15V4m0 0 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" /></svg>
);
export const PrinterIcon = () => (
  <svg {...c1}><path d="M7 9V4h10v5" strokeLinejoin="round" /><rect x="4" y="9" width="16" height="8" rx="1.5" /><path d="M7 14h10v6H7Z" strokeLinejoin="round" /></svg>
);
export const DownloadIcon = () => (
  <svg {...c1}><path d="M12 4v11m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" /></svg>
);
export const PhoneIcon = () => (
  <svg {...c1}><path d="M6.5 3.5 9 6l-1.6 2.7a12 12 0 0 0 6 6L15 13l3.5 2.5-.6 2.6a2 2 0 0 1-2.1 1.5A16 16 0 0 1 3.4 6.2a2 2 0 0 1 1.5-2.1Z" strokeLinejoin="round" /></svg>
);
export const PinIcon = () => (
  <svg {...c1}><path d="M12 21s7-6.6 7-11.5a7 7 0 0 0-14 0C5 14.4 12 21 12 21Z" strokeLinejoin="round" /><circle cx="12" cy="9.5" r="2.3" /></svg>
);
export const AlertIcon = () => (
  <svg {...c1}><path d="M12 3 2 20h20Z" strokeLinejoin="round" /><path d="M12 10v4" strokeLinecap="round" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" /></svg>
);
export const MenuIcon = () => (
  <svg {...c1}><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>
);
export const ChickenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 12c0-3.5 2.2-6 5-6 2 0 3.3 1.2 3.3 2.6 0 1-.6 1.7-1.6 2" strokeLinecap="round" /><path d="M9 12c-2.3 0-4 1.7-4 3.8 0 2 1.6 3.7 4 4.2 3 .6 6.5-.2 7.6-2.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 8.5c1 0 2-.4 2-1.4" strokeLinecap="round" /><circle cx="12.3" cy="10" r=".7" fill="currentColor" stroke="none" /></svg>
);
export const KeyIcon = () => (
  <svg {...c1}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8m0 0h-4m4 0v4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const DatabaseIcon = () => (
  <svg {...c1}><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5V12c0 1.7 3.6 3 8 3s8-1.3 8-3V5.5" /><path d="M4 12v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V12" /></svg>
);
export const TrendUpIcon = () => (
  <svg {...c2}><path d="m3 17 6-6 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 6h6v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const TrendDownIcon = () => (
  <svg {...c2}><path d="m3 7 6 6 4-4 8 9" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 18h6v-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const RouteIcon = () => (
  <svg {...c1}><circle cx="6" cy="6" r="2.3" /><circle cx="18" cy="18" r="2.3" /><path d="M6 8.3V13a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3" strokeLinecap="round" /></svg>
);
export const PercentIcon = () => (
  <svg {...c1}><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="17" r="2.5" /><path d="M18 6 6 18" strokeLinecap="round" /></svg>
);

export const DocumentIcon = ReceiptIcon;
