import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    icon?: React.ReactNode;
}

const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap";

const variants: Record<Variant, string> = {
    primary: "bg-accent text-accent-ink hover:bg-accent-2",
    secondary: "bg-surface-2 text-ink border border-line-2 hover:border-faint",
    ghost: "text-muted hover:bg-surface-2 hover:text-ink",
    danger: "bg-surface-2 text-danger border border-line-2 hover:border-danger"
};

const sizes: Record<Size, string> = {
    sm: "text-[0.8rem] px-2.5 py-1.5",
    md: "text-[0.85rem] px-3.5 py-2"
};

export default function Button({
    variant = "primary",
    size = "md",
    icon,
    className = "",
    children,
    ...rest
}: ButtonProps) {
    return (
        <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
            {icon}
            {children}
        </button>
    );
}
