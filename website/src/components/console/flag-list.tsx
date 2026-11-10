import { Link } from "react-router";

import { flagPath } from "@/lib/console/paths";

export function FlagList({
  flags,
  links = true,
}: {
  flags: string[];
  links?: boolean;
}) {
  if (!flags.length) return <span className="console-muted">—</span>;
  return (
    <div className="console-flag-list">
      {flags.map((flag) =>
        links ? (
          <Link prefetch="intent" key={flag} className="console-flag" to={flagPath(flag)}>
            {flag}
          </Link>
        ) : (
          <span key={flag} className="console-flag">{flag}</span>
        ),
      )}
    </div>
  );
}
