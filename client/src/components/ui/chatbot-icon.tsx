import React from "react";

interface ChatbotIconProps {
  className?: string;
}

export default function ChatbotIcon({ className = "w-6 h-6" }: ChatbotIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="minechat-red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b1950" />
          <stop offset="50%" stopColor="#b33054" />
          <stop offset="100%" stopColor="#b73850" />
        </linearGradient>
      </defs>
      
      {/* Robot head */}
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        fill="url(#minechat-red-gradient)"
      />
      
      {/* Robot antenna */}
      <circle
        cx="12"
        cy="4"
        r="1"
        fill="url(#minechat-red-gradient)"
      />
      <line
        x1="12"
        y1="5"
        x2="12"
        y2="6"
        stroke="url(#minechat-red-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Robot eyes */}
      <circle cx="9" cy="11" r="1.5" fill="white" />
      <circle cx="15" cy="11" r="1.5" fill="white" />
      
      {/* Robot mouth */}
      <path
        d="M10 14 Q12 16 14 14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Robot arms */}
      <rect
        x="2"
        y="8"
        width="2"
        height="4"
        rx="1"
        fill="url(#minechat-red-gradient)"
      />
      <rect
        x="20"
        y="8"
        width="2"
        height="4"
        rx="1"
        fill="url(#minechat-red-gradient)"
      />
      
      {/* Speech bubble indicator */}
      <circle
        cx="18"
        cy="9"
        r="2"
        fill="white"
        stroke="url(#minechat-red-gradient)"
        strokeWidth="1"
      />
      <circle cx="18" cy="9" r="0.5" fill="url(#minechat-red-gradient)" />
    </svg>
  );
}