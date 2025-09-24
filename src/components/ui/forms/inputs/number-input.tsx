import { useRef } from "react";

interface Props {
  id?: string;
  name: string;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function NumberInput({ id, name, min, max, placeholder, required = false, readOnly = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputValue = (e: React.FormEvent<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.value = e.currentTarget.value.replace(/\D/g, '');
    }
  };

  return (
    <input 
      ref={inputRef}
      className="text-sm leading-3 p-3 border border-slate-200 rounded-md placeholder:text-slate-500 focus:outline-none focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm read-only:bg-gray-100 read-only:pointer-events-none read-only:shadow-none"
      type="text" 
      id={id}
      name={name}
      min={min}
      max={max}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
      onInput={handleInputValue}
    />
  );
}