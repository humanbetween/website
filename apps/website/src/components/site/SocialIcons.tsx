import type { SocialLinks } from "@/lib/site-settings";

const ICON_CLS = "h-4 w-4";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.65.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.65.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.212 8.8 2.2 12 2.2zm0 1.8c-3.155 0-3.5.012-4.736.068-1.045.048-1.612.222-1.99.37-.5.195-.857.426-1.232.801-.375.375-.606.732-.801 1.232-.148.378-.322.945-.37 1.99C3.812 8.5 3.8 8.845 3.8 12s.012 3.5.068 4.736c.048 1.045.222 1.612.37 1.99.195.5.426.857.801 1.232.375.375.732.606 1.232.801.378.148.945.322 1.99.37 1.236.056 1.58.068 4.736.068s3.5-.012 4.736-.068c1.045-.048 1.612-.222 1.99-.37.5-.195.857-.426 1.232-.801.375-.375.606-.732.801-1.232.148-.378.322-.945.37-1.99.056-1.236.068-1.58.068-4.736s-.012-3.5-.068-4.736c-.048-1.045-.222-1.612-.37-1.99-.195-.5-.426-.857-.801-1.232-.375-.375-.732-.606-1.232-.801-.378-.148-.945-.322-1.99-.37C15.5 4.012 15.155 4 12 4zm0 3.06A4.94 4.94 0 1 1 7.06 12 4.94 4.94 0 0 1 12 7.06zm0 8.14A3.2 3.2 0 1 0 8.8 12 3.2 3.2 0 0 0 12 15.2zm6.27-8.34a1.15 1.15 0 1 1-1.15-1.15 1.15 1.15 0 0 1 1.15 1.15z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4l6.2 3.6z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.97a8.16 8.16 0 0 0 4.93 1.65V7.16a4.84 4.84 0 0 1-2-.47z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={ICON_CLS}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

const LINK_CLS =
  "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors";

export function SocialIcons({ links }: { links: SocialLinks }) {
  const items: Array<{ url: string; label: string; icon: React.ReactNode }> = [];
  if (links.x) items.push({ url: links.x, label: "X", icon: <XIcon /> });
  if (links.instagram)
    items.push({ url: links.instagram, label: "Instagram", icon: <InstagramIcon /> });
  if (links.youtube)
    items.push({ url: links.youtube, label: "YouTube", icon: <YouTubeIcon /> });
  if (links.tiktok)
    items.push({ url: links.tiktok, label: "TikTok", icon: <TikTokIcon /> });
  if (links.linkedin)
    items.push({ url: links.linkedin, label: "LinkedIn", icon: <LinkedInIcon /> });

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.url}
          target="_blank"
          rel="noreferrer"
          aria-label={it.label}
          className={LINK_CLS}
        >
          {it.icon}
        </a>
      ))}
    </div>
  );
}
