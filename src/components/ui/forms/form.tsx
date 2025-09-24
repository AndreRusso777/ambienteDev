"use client";

import { FormState } from "@/types/form";
import { ReactNode, useEffect, useRef } from "react";
import FormMessage from "./form-message";

interface Props {
  id?: string;
  state?: FormState | null;
  className?: string;
  action?: string | ((formData: FormData) => void);
  children: ReactNode;
  preventReset?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function Form({ id, state, className, action, children, preventReset = false, onSubmit }: Props) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if(state?.success && form?.current && !preventReset) {
      form.current.reset();
    }
  }, [state]);

  return onSubmit ? (
    <form
      id={id}
      ref={form}
      className={`grid gap-4${className ? ' ' + className : ''}`} 
      onSubmit={onSubmit}
    >
      {children}
      <FormMessage state={state} />
    </form>
  ) : (
    <form 
      ref={form}
      className={`grid gap-6${className ? ' ' + className : ''}`} 
      action={action}
    >
      {children}
      <FormMessage state={state} />
    </form>
  );
}