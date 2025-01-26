import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import * as Progress from "@radix-ui/react-progress";
import { Spinner } from "./spinner";

const loadingVariants = cva(
  "animate-fade-in",
  {
    variants: {
      variant: {
        spinner: "",
        shimmer: "w-full",
        skeleton: "rounded bg-gray-200",
        progress: "w-full"
      },
      size: {
        sm: "h-6 w-6",
        default: "h-12 w-12",
        lg: "h-16 w-16"
      }
    },
    defaultVariants: {
      variant: "spinner",
      size: "default"
    }
  }
);

const skeletonVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function Loading({
  className,
  variant = "spinner",
  size = "default",
  message,
  lines = 1,
  progress = 0
}) {
  return (
    <div 
      className="flex flex-col items-center gap-4"
      role="status"
      aria-busy="true"
      aria-label={message || "Loading"}
    >
      {variant === 'spinner' && (
        <Spinner 
          size={size === 'sm' ? 24 : size === 'lg' ? 48 : 32}
          className={cn(loadingVariants({ variant, size, className }))}
        />
      )}
      
      {variant === 'shimmer' && (
        <Progress.Root
          className="relative overflow-hidden w-full h-2 bg-gray-200 rounded-full"
          value={progress}
        >
          <Progress.Indicator
            className="bg-primary h-full w-full transition-all duration-500 ease-out"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress.Root>
      )}

      {variant === 'skeleton' && (
        <div className="w-full space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              variants={skeletonVariants}
              initial="initial"
              animate="animate"
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

      {variant === 'progress' && (
        <Progress.Root
          className="relative overflow-hidden w-full h-4 bg-gray-200 rounded-full"
          value={progress}
        >
          <Progress.Indicator
            className="bg-primary h-full transition-all duration-300 ease-out flex items-center justify-center text-xs text-white font-medium"
            style={{ transform: `translateX(-${100 - progress}%)` }}
          >
            {progress}%
          </Progress.Indicator>
        </Progress.Root>
      )}
      
      {message && (
        <p 
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}