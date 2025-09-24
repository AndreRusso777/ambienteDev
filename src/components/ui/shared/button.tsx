import { Ellipsis } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  form?: string;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: VoidFunction;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  type?: "button" | "submit" | "reset";
}

export default function Button({ form, className, loading = false, disabled = false, children, onClick, type = "button" }: Props) {
  return (
    <button 
      tabIndex={-1}
      form={form && !onClick ? form : undefined}
      className={`bg-white hover:border-slate-950 border py-2.5 px-3 rounded-md text-black text-sm font-semibold disabled:opacity-50 disabled:bg-opacity-100${loading ? ' opacity-70 pointer-events-none' : ''}${ className ? ' ' + className : ''}`}
      type={onClick ? "button" : "submit"}
      disabled={loading || disabled}
      onClick={onClick ? onClick : undefined}
    >
      {!loading ? children : <Ellipsis className="mx-auto h-5 w-auto" />}
    </button>
  );
}