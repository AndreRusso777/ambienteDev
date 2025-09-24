import Field from "@/components/ui/forms/field";
import FieldError from "@/components/ui/forms/field-error";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import EmailInput from "@/components/ui/forms/inputs/email-input";
import TextInput from "@/components/ui/forms/inputs/text-input";
import Label from "@/components/ui/forms/label";
import FormRow from "@/components/ui/forms/row";
import Button from "@/components/ui/shared/button";
import { FormState } from "@/types/form";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginCard() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [sendAgain, setSendAgain] = useState<boolean>(false);

  const handleLogin = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendAgain(false);
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const { email } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const responseData = await response.json();

      if(response.ok) {
        setCodeSent(true);
        setIsLoading(false);
      } else {
        setFormState(responseData);
        setIsLoading(false);
      }
    } catch(err) {
      setIsLoading(false);
      console.log(err);
    }
  }

  const handleOtp = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const { email, code } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/auth/validate-otp', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, code })
      });

      const responseData = await response.json();
      
      if(response.ok) {
        setCodeSent(true);
        setIsLoading(false);
        router.push('/dashboard');
      } else {
        setFormState(responseData);
        setIsLoading(false);
      }
    } catch(err) {
      setIsLoading(false);
      console.log(err);
    }
  }

  const handleResendCode = () => {
    setSendAgain(true);
    setCodeSent(false);
  }
  
  return (
    <div className="w-full max-w-md border border-slate-200 rounded-lg grid gap-6 p-6 bg-white">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          {!codeSent ? "Entrar" : "Verifique sua identidade"}
        </h1>
        <p className="text-sm font-normal text-slate-500 mt-1">
          {!codeSent ? "Insira seu email abaixo para acessar sua conta" : `O código foi enviado para seu email`}
        </p>
      </div>
      <Form state={formState} onSubmit={!codeSent ? handleLogin : handleOtp}>
        <FieldsWrapper>
          <FormRow>
            <Field>
              <Label 
                htmlFor="email" 
                title="Email"
                required
              />
              <EmailInput 
                id="email"
                name="email"
                placeholder="Digite seu email"
                readOnly={codeSent}
                required
              />
              <FieldError error={formState?.errors?.email} />
            </Field>
          </FormRow>
          {codeSent && (
            <FormRow>
              <Field>
                <Label 
                  htmlFor="code" 
                  title="Código"
                  required
                />
                <TextInput 
                  id="code"
                  name="code"
                  placeholder="Digite o código"
                  required
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                />
                <FieldError error={formState?.errors?.password} />
              </Field>
            </FormRow>
          )}
        </FieldsWrapper>
        <div className="grid gap-4">
          <Button loading={isLoading}>
            <span>{!sendAgain ? "Entrar" : "Reenviar Código" }</span>
          </Button>
          {codeSent && (
            <div className="text-sm text-center">
              <span>Não recebeu um email?</span> <button className="inline font-semibold" onClick={handleResendCode}>Enviar novamente</button>
            </div>
          )}
        </div>
      </Form>
    </div>
  );
}