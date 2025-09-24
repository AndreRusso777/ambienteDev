interface Props {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function EmailInput({ id, name, value, defaultValue, placeholder, required = false, readOnly = false }: Props) {
  return (
    <input 
      className="text-sm leading-3 p-3 border border-slate-200 rounded-md placeholder:text-slate-500 focus:outline-none focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm read-only:bg-gray-100 read-only:pointer-events-none read-only:shadow-none"
      type="email" 
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      readOnly={readOnly}
    />
  );
}