interface FacebookIconProps {
  className?: string;
}

export const FacebookIcon = ({ className = "w-4 h-4" }: FacebookIconProps) => {
  return (
    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="messengerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#00c6ff", stopOpacity: 1 }} />
          <stop offset="25%" style={{ stopColor: "#0072ff", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#7928ca", stopOpacity: 1 }} />
          <stop offset="75%" style={{ stopColor: "#ff0080", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#ff6b6b", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="512" cy="512" r="512" fill="url(#messengerGradient)"/>
      <path d="M512 160c-176 0-320 136-320 304 0 96 48 181 123 237v125l120-66c32 9 66 14 101 14 176 0 320-136 320-304s-144-304-320-304zm32 410l-82-88-160 88 176-187 84 88 158-88-176 187z" fill="white"/>
    </svg>
  );
};