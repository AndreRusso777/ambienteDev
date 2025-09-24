interface Props {
  error: {
    message: string 
  } | null | undefined;
}

export default function FieldError({ error }: Props) {
  return error?.message ? (
    <span className="text-red-500 text-xs font-normal italic leading-none">
      {error.message}
    </span>
  ) : null;
}