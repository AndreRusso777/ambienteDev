"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface Props {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function PasswordInput({ id, name, value, defaultValue, placeholder, required = false, readOnly = false }: Props) {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  }

  return (
    <div className="relative isolate">
      <input 
        className="w-full text-sm leading-3 py-3 pl-3 pr-11 border border-slate-200 rounded-md placeholder:text-slate-500 focus:outline-none focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm read-only:bg-gray-100 read-only:pointer-events-none read-only:shadow-none"
        type={!showPassword ? "password" : "text"}
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        readOnly={readOnly}
      />
      <button type="button" className="absolute top-0 right-0 cursor-pointer h-full flex items-center px-3" onClick={handleShowPassword}>
        {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}