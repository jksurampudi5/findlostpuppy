import type { SVGProps } from "react";

export function AlignJustifyIcon({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <g fill="none" stroke="currentColor" strokeDasharray="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M12 5h6M12 5h-6">
          <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.2s" values="8;0" />
        </path>
        <path strokeDashoffset="8" d="M12 10h6M12 10h-6">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.2s" dur="0.2s" to="0" />
        </path>
        <path strokeDashoffset="8" d="M12 15h6M12 15h-6M12 20h6M12 20h-6">
          <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.2s" to="0" />
        </path>
      </g>
    </svg>
  );
}
