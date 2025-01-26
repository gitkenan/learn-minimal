import { motion } from "framer-motion";

export function Spinner({ size = 24, className }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        initial={{ pathLength: 0.75, rotate: 0 }}
        animate={{ 
          pathLength: [0.75, 0.25, 0.75],
          rotate: 360 
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.5, 1]
        }}
      />
    </motion.svg>
  );
}