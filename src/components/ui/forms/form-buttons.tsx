import { useFormStatus } from "react-dom";
import Button from "../shared/button";
import { ReactNode } from "react";

interface Props {
  alignment?: 'full' | 'left' | 'right';
  children?: ReactNode;
}

export default function FormButton({ alignment = 'full', children }: Props) {
  const { pending } = useFormStatus();
  return (
    <div className={`flex items-center ${(alignment === 'right') ? ' justify-end' : 'justify-start'}`}>
      <Button 
        className={`${(alignment === 'left' || alignment === 'right') ? 'w-fit' : 'w-full'}`}
        loading={pending}
      >
        {children}
      </Button>
    </div>
  );
}