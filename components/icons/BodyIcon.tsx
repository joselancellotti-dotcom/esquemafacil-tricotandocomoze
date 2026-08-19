import React from 'react';

export const BodyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M15.5 6.5c1.5-1.5 4-1.5 5.5 0" />
    <path d="M3 20.5v-7c0-2.2 1.8-4 4-4h1" />
    <path d="M16 13.5h1c2.2 0 4 1.8 4 4v7" />
    <path d="M8.5 6.5c-1.5-1.5-4-1.5-5.5 0" />
    <path d="M12 11.5V14h-1c-2.2 0-4-1.8-4-4v-1" />
    <path d="M12 11.5V14h1c2.2 0 4-1.8 4-4v-1" />
  </svg>
);
