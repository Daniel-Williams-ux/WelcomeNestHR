// src/components/ui/button.tsx
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function Button({ children, ...props }: Props) {
  return (
    <button
      {...props}
      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
    >
      {children}
    </button>
  );
}
