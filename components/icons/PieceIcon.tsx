
import React from 'react';

export const PieceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 7 8.3 14.82a2 2 0 0 0-2.17 2.17L3.95 21" />
    <path d="M16 4h4v4" />
    <path d="m15 19-3 2-3-2" />
    <path d="m12 16 3-2 3 2" />
    <path d="M12 10V7" />
    <path d="m15 10-3-2-3 2" />
  </svg>
);
