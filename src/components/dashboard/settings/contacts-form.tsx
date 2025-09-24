import Field from "@/components/ui/forms/field";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import EmailInput from "@/components/ui/forms/inputs/email-input";
import PhoneInput from "@/components/ui/forms/inputs/phone-input";
import Label from "@/components/ui/forms/label";
import FormRow from "@/components/ui/forms/row";
import Button from "@/components/ui/shared/button";
import { FormState } from "@/types/form";
import User from "@/types/user";
import { useState } from "react";

interface Props {
  user: User;
}

export default function ContactsForm({ user }: Props) {
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget);
    const {
      phone
    } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "contacts-update",
          email: user.email,
          phone
        })
      });

      const responseData: FormState = await response.json();
      
      if(response.ok) {
        setIsLoading(false);
        setFormState(responseData);
      } else {
        setFormState(responseData);
        setIsLoading(false);
      }
    } catch(err) {
      setIsLoading(false);
      console.log(err);
    }
  };

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium tracking-tight scroll-mt-20">Contatos</h3>
        <p className="text-sm text-slate-600">Estes são seus contatos, mantenha-os atualizados</p>
      </div>
      <div className="shrink-0 bg-slate-200 h-[1px] w-full my-4"></div>
      <Form state={formState} onSubmit={onSubmit} preventReset>
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
                defaultValue={user?.email}
                placeholder="Digite seu email"
                readOnly
              />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="phone" 
                title="Telefone"
                required
              />
              <PhoneInput 
                id="phone" 
                name="phone"
                defaultValue={user?.phone}
                required
              />
            </Field>
          </FormRow>
        </FieldsWrapper>
        <div className="flex justify-end">
          <Button loading={isLoading}>
            <span>Salvar</span>
          </Button>
        </div>
      </Form>
    </div>
  );
}