import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
  variant?: "full" | "mark";
};

export function Logo({ href = "/", className, variant = "full" }: Props) {
  const src = variant === "full" ? "/brand/logo-full.svg" : "/brand/logo-mark.svg";
  const height = variant === "full" ? "h-[1.8rem]" : "h-[2.1rem]";
  const width = variant === "full" ? "w-auto" : "w-[2.1rem]";
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
