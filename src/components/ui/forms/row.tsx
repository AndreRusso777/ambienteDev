import { ReactNode } from "react";

interface Props {
  columns?: "one" | "two";
  children: ReactNode;
}

export default function FormRow({ columns = "one", children }: Props) {
  return (
    <div className={`grid ${columns === 'one' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
      {children}
    </div>
  );
}