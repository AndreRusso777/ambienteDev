import React from "react";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export default function TextArea({ error, className = "", ...props }: Props) {
  return (
    <textarea
      className={`
        flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm 
        ring-offset-white placeholder:text-slate-500 
        focus:outline-none focus:ring-2 focus:ring-transparent focus:border-black 
        disabled:cursor-not-allowed disabled:opacity-50
        resize-none
        ${error ? 'border-red-500 focus:ring-red-500' : ''}
        ${className}
      `.trim()}
      {...props}
    />
  );
}