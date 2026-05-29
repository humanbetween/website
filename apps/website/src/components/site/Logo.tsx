import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
  variant?: "full" | "mark";
};

export function Logo({ href = "/", className, variant = "full" }: Props) {
  const src = variant === "full" ? "/brand/logo-full.svg" : "/brand/logo-mark.svg";
  const height = variant === "full" ? "h-6" : "h-7";
  const width = variant === "full" ? "w-auto" : "w-7";
  return (
    <Link href={href} className={`inline-flex items-center ${className ?? ""}`}>
      <img
        src={src}
        alt="Human Between"
        className={`${height} ${width}`}
        draggable={false}
      />
    </Link>
  );
}
