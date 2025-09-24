"use client";

import { FormState } from "@/types/form";
import { useEffect, useState } from "react";

interface Props {
  state?: FormState | null;
}

export default function FormMessage({ state }: Props) {
  const [error, setError] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if(state?.errors?.global?.message) {
      setError(true);
      setMessage(state.errors.global.message)
    }

    if(state?.message) {
      setError(false);
      setMessage(state.message);
    }
    
    setTimeout(() => { setMessage(''); }, 3000)
  }, [state]);

  return message ? (
    <span className={`${!message ? 'hidden' : 'inline-block'} ${!error ? 'bg-green-500' : 'bg-red-500'} font-medium text-sm text-center text-white rounded-md py-2 px-4`}>
      {message}
    </span>
  ) : null;
}