import { ReactNode } from "react";

interface Props {
  className?: string;
  children: ReactNode
}

export default function FieldsWrapper({ className, children }: Props) {
  return (
    <div className={`grid gap-4${className ? ' ' + className : ''}`}>
      {children}
    </div>
  );
}