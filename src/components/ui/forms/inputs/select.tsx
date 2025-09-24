import React from 'react';
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  name?: string;
  placeholder?: string;
  options: SelectOption[];
  selectedValue?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export default function Select({
  id,
  name,
  placeholder,
  options,
  selectedValue,
  defaultValue,
  required = false,
  onChange,
  className = ""
}: SelectProps) {
  const isControlled = selectedValue !== undefined && onChange !== undefined;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative isolate border border-slate-200 rounded-md focus-within:border-slate-950 transition-colors duration-200 ease-linear shadow-sm overflow-hidden">
      <select
        id={id}
        name={name}
        {...(isControlled 
          ? { value: selectedValue || "" } 
          : { defaultValue: defaultValue || "" }
        )}
        onChange={handleChange}
        required={required}
        className={`w-full px-3 py-2 pr-10 bg-white text-slate-900 focus:outline-none appearance-none cursor-pointer ${className}`}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-slate-500" />
    </div>
  );
}