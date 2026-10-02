import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import "./back-button.css";

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function BackButton({ label = "Back", className = "", ...props }: BackButtonProps) {
  return (
    <Button className={`group relative overflow-hidden back-button-root ${className}`.trim()} {...props}>
      <span className="w-20 translate-x-2 transition-opacity duration-500 group-hover:opacity-0 back-button-text">
        {label}
      </span>
      <i className="absolute inset-0 z-10 grid w-1/4 place-items-center bg-primary-foreground/15 transition-all duration-500 group-hover:w-full back-button-icon-strip">
        <ArrowLeft
          className="opacity-60 back-button-icon"
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
      </i>
    </Button>
  );
}
