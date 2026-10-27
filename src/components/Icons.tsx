type P = { size?: number };

const svg = (size: number, d: React.ReactNode, fill = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="square"
    aria-hidden="true"
  >
    {d}
  </svg>
);

export const SearchIcon = ({ size = 18 }: P) =>
  svg(size, <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>);

export const HeartIcon = ({ size = 18, filled = false }: P & { filled?: boolean }) =>
  svg(size, <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" strokeLinejoin="round" />, filled);

export const PinIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.3" /></>);

export const CalIcon = ({ size = 18 }: P) =>
  svg(size, <><rect x="3.5" y="5" width="17" height="15.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>);

export const TicketIcon = ({ size = 18 }: P) =>
  svg(size, <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm11 0v10" strokeDasharray="0" />);

export const ShareIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v8h14v-8" /></>);

export const MenuIcon = ({ size = 20 }: P) => svg(size, <path d="M3 7h18M3 12h18M3 17h18" />);

export const GlobeIcon = ({ size = 18 }: P) =>
  svg(size, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></>);

export const ClockIcon = ({ size = 18 }: P) =>
  svg(size, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>);

export const ArrowIcon = ({ size = 18 }: P) => svg(size, <path d="M4 12h15M13 6l6 6-6 6" />);

export const RefundIcon = ({ size = 18 }: P) =>
  svg(size, <><path d="M4 9h12a4 4 0 0 1 0 8H9" /><path d="M8 5 4 9l4 4" /></>);

export const Mark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 3h8.5a5.5 5.5 0 0 1 2.2 10.55L20 21h-5.6l-3.6-6.8H10V21H5zm5 4.2v3.2h3.2a1.6 1.6 0 0 0 0-3.2z" fill="#ff4a1c" />
  </svg>
);
