import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/triage", label: "Intake Triage" },
  { href: "/assistant", label: "Knowledge Assistant" },
];

export function Nav() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          LLM Assessment
        </Link>
        <nav className="flex gap-4 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
