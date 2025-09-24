import { ReactNode } from "react";

interface Props {
  className?: string;
  children: ReactNode;
}

export default function Field({ className, children }: Props) {
  return (
    <div className={`grid gap-2${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}