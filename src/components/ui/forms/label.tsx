interface Props {
  className?: string;
  htmlFor?: string;
  title: string;
  required?: boolean;
  children?: React.ReactNode;
  onClick?: VoidFunction;
}

export default function Label({ className, htmlFor, title, required = false, children, onClick }: Props) {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`text-sm font-medium leading-4${children ? ' relative border px-2 py-1.5 rounded-md hover:border-slate-950 transition-colors cursor-pointer' : ''}${className ? ' ' + className : ''}`}
      onClick={onClick ? onClick : undefined}
    >
      {!children && <span>{title}</span>}
      {children ? children : required && <span className="text-red-500">*</span>}
      {children && <span>{title}</span>}
    </label>
  );
}