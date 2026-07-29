import React from "react";

export const ProducePattern: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full opacity-[0.07] stroke-green-800 dark:stroke-green-400"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Carrot */}
        <g transform="translate(40, 20) scale(1.2)">
          <path d="M20 10 C30 25 35 50 15 70 C5 50 10 25 20 10 Z" />
          <path d="M20 10 L15 0 M20 10 L20 -4 M20 10 L25 -2" />
          <path d="M16 28 Q24 30 28 26" />
          <path d="M14 42 Q22 44 26 40" />
        </g>

        {/* Tomato */}
        <g transform="translate(140, 30) scale(1.1)">
          <circle cx="25" cy="25" r="22" />
          <path d="M25 3 L21 11 L25 9 L29 11 Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M25 3 Q25 -3 22 -6" />
          <path d="M12 18 Q16 12 25 14" />
        </g>

        {/* Broccoli */}
        <g transform="translate(240, 25) scale(1.1)">
          <path d="M20 35 L16 60 Q25 65 34 60 L30 35" />
          <circle cx="15" cy="25" r="12" />
          <circle cx="35" cy="25" r="12" />
          <circle cx="25" cy="15" r="13" />
          <circle cx="25" cy="28" r="10" />
        </g>

        {/* Eggplant */}
        <g transform="translate(350, 20) scale(1.1)">
          <path d="M20 15 C10 30 5 50 15 65 C25 80 40 70 35 50 C30 35 25 20 20 15 Z" />
          <path d="M20 15 Q25 8 28 2 M20 15 Q14 10 12 18" />
        </g>

        {/* Avocado */}
        <g transform="translate(460, 25) scale(1.1)">
          <path d="M22 8 C12 8 8 22 8 36 C8 52 14 62 26 62 C38 62 44 52 44 36 C44 22 32 8 22 8 Z" />
          <circle cx="26" cy="42" r="9" fill="currentColor" fillOpacity="0.2" />
        </g>

        {/* Corn */}
        <g transform="translate(570, 20) scale(1.1)">
          <rect x="18" y="15" width="16" height="45" rx="8" />
          <line x1="26" y1="15" x2="26" y2="60" />
          <line x1="18" y1="28" x2="34" y2="28" />
          <line x1="18" y1="40" x2="34" y2="40" />
          <line x1="18" y1="52" x2="34" y2="52" />
          <path d="M12 60 Q10 35 18 20" />
          <path d="M40 60 Q42 35 34 20" />
        </g>

        {/* Capsicum / Bell Pepper */}
        <g transform="translate(680, 25) scale(1.1)">
          <path d="M12 20 C8 35 10 55 25 58 C40 55 42 35 38 20 C32 15 18 15 12 20 Z" />
          <path d="M25 17 L25 6" />
          <path d="M20 20 Q25 25 30 20" />
          <path d="M25 20 L25 55" strokeDasharray="3 3" />
        </g>

        {/* Radish / Beetroot */}
        <g transform="translate(790, 20) scale(1.1)">
          <circle cx="25" cy="35" r="18" />
          <path d="M25 53 Q25 65 22 72" />
          <path d="M20 18 Q12 5 8 2 M25 17 Q25 2 25 -4 M30 18 Q38 5 42 2" />
        </g>

        {/* Garlic */}
        <g transform="translate(890, 30) scale(1.1)">
          <path d="M25 8 Q12 20 12 35 Q12 50 25 50 Q38 50 38 35 Q38 20 25 8 Z" />
          <path d="M25 8 L25 50" />
          <path d="M25 8 Q18 25 20 48" />
          <path d="M25 8 Q32 25 30 48" />
        </g>

        {/* Lemon / Lime */}
        <g transform="translate(990, 32) scale(1.1)">
          <ellipse cx="28" cy="22" rx="22" ry="16" transform="rotate(-20 28 22)" />
          <path d="M8 28 C6 28 5 26 6 24" />
          <path d="M48 16 C50 16 51 18 50 20" />
        </g>

        {/* Pumpkin */}
        <g transform="translate(1080, 22) scale(1.1)">
          <ellipse cx="30" cy="38" rx="24" ry="18" />
          <path d="M30 20 C20 20 15 28 15 38 C15 48 20 56 30 56 C40 56 45 48 45 38 C45 28 40 20 30 20 Z" />
          <path d="M30 20 Q30 10 35 4" />
        </g>
      </svg>
    </div>
  );
};
