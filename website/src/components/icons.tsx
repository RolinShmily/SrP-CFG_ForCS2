"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faSteam, faBilibili } from "@fortawesome/free-brands-svg-icons";

export function GithubIcon({ className = "w-4 h-4", ...props }: { className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} {...props}>
      <FontAwesomeIcon icon={faGithub} className="w-full h-full" />
    </span>
  );
}

export function SteamIcon({ className = "w-4 h-4", ...props }: { className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} {...props}>
      <FontAwesomeIcon icon={faSteam} className="w-full h-full" />
    </span>
  );
}

export function BilibiliIcon({ className = "w-4 h-4", ...props }: { className?: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} {...props}>
      <FontAwesomeIcon icon={faBilibili} className="w-full h-full" />
    </span>
  );
}
