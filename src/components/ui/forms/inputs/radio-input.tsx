interface Props {
  id?: string;
  name: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
}

export default function RadioInput({ id, name, value, required = false, readOnly = false }: Props) {
  return (
    <input 
      className="hidden absolute top-0 left-0"
      type="radio" 
      id={id}
      name={name}
      value={value}
      required={required}
      readOnly={readOnly}
    />
  );
}