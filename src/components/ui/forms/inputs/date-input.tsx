import { Calendar } from "lucide-react";

interface Props {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function DateInput({ id, name, value, defaultValue, required = false, readOnly = false }: Props) {
  return (
    <div className="relative">
      <input 
        className="w-full text-sm leading-3 py-3 pl-3 pr-6 border border-slate-200 rounded-md placeholder:text-slate-500 focus:outline-none focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm read-only:bg-gray-100 read-only:pointer-events-none read-only:shadow-none"
        type="date" 
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        required={required}
        readOnly={readOnly}
      />
      <Calendar className="w-4 h-auto shrink-0 absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none" />
    </div>
    
  );
}
