/**
 * Minimal stand-in for next/link in unit tests: a plain anchor that runs the
 * onClick handler but does not navigate (jsdom has no App Router).
 */
import type { AnchorHTMLAttributes } from "react";

export default function MockLink({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
      {...props}
    />
  );
}
