import { InputMask } from "@react-input/mask";

interface Props {
  mask?: string;
  id?: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function PhoneInput({ mask = "(__) _____-____", id, name, placeholder = "(00) 00000-0000", defaultValue, required = false, readOnly = false }: Props) {
  return (
    <InputMask
      type="tel"
      mask={mask}
      replacement={{ _: /\d/ }}
      className="text-sm leading-3 p-3 border border-slate-200 rounded-md placeholder:text-slate-500 focus:outline-none focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm read-only:bg-gray-100 read-only:pointer-events-none read-only:shadow-none"
      id={id}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      readOnly={readOnly}
    />
  );
}