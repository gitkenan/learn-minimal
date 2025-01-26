import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const loadingVariants = cva(
  "animate-fade-in",
  {
    variants: {
      variant: {
        spinner: "animate-spin rounded-full border-t-2 border-b-2",
        shimmer: "shimmer w-full h-1 bg-accent",
        skeleton: "shimmer rounded bg-gray-200",
      },
      size: {
        sm: "h-6 w-6 border-2",
        default: "h-12 w-12 border-[3px]",
        lg: "h-16 w-16 border-4"
      }
    },
    defaultVariants: {
      variant: "spinner",
      size: "default"
    }
  }
);

export function Loading({
  className,
  variant,
  size,
  message,
  lines = 1
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {variant === 'spinner' && (
        <div
          className={cn(
            loadingVariants({ variant, size, className }),
            "rounded-full border-t-transparent"
          )}
          style={{ borderColor: "currentColor" }}
        />
      )}
      
      {variant === 'shimmer' && (
        <div className="w-full h-1 overflow-hidden bg-gray-200 rounded-full">
          <div
            className={cn(
              loadingVariants({ variant, className }),
              "h-full bg-accent"
            )}
          />
        </div>
      )}

      {variant === 'skeleton' && (
        <div className="w-full space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                loadingVariants({ variant, className }),
                size === 'sm' ? 'h-4 w-24' :
                size === 'lg' ? 'h-8 w-64' :
                'h-6 w-48'
              )}
            />
          ))}
        </div>
      )}
      
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}