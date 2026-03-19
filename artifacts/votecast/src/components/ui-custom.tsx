import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BOLD ATHLETIC BUTTON
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95",
      outline: "border-2 border-border bg-transparent hover:border-primary hover:text-primary active:scale-95",
      ghost: "bg-transparent hover:bg-secondary active:scale-95",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95"
    };

    const sizes = {
      sm: "h-10 px-4 text-xs",
      md: "h-12 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      xl: "h-16 px-10 text-lg"
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// INDUSTRIAL INPUT
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-14 w-full border-2 border-border bg-background px-4 py-2 font-sans text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-bold uppercase tracking-widest text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

// BRUTALIST CARD
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-card border-2 border-border p-6 sm:p-8 relative overflow-hidden group", className)} {...props}>
      <div className="absolute top-0 left-0 w-1 h-full bg-primary transform origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-300 ease-out" />
      {children}
    </div>
  );
}

// SCREEN LOADER
export function ScreenLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-muted rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="font-display text-2xl tracking-widest text-muted-foreground mt-8 animate-pulse">
        Loading Data...
      </h2>
    </div>
  );
}

// STATUS BADGE
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    draft: "bg-secondary text-secondary-foreground border-secondary",
    nomination: "bg-blue-500/10 text-blue-500 border-blue-500/50",
    voting: "bg-primary/10 text-primary border-primary",
    results: "bg-green-500/10 text-green-500 border-green-500/50",
    closed: "bg-muted text-muted-foreground border-muted"
  };

  return (
    <span className={cn(
      "px-3 py-1 text-xs font-bold uppercase tracking-widest border-2",
      config[status] || config.draft
    )}>
      {status}
    </span>
  );
}
