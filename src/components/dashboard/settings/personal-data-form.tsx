import Field from "@/components/ui/forms/field";
import FieldError from "@/components/ui/forms/field-error";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import CPFInput from "@/components/ui/forms/inputs/cpf-input";
import TextInput from "@/components/ui/forms/inputs/text-input";
import Label from "@/components/ui/forms/label";
import FormRow from "@/components/ui/forms/row";
import Button from "@/components/ui/shared/button";
import { FormState } from "@/types/form";
import User from "@/types/user";
import { useRouter } from "next/router";
import { useState } from "react";

interface Props {
  user: User;
}

export default function PersonalDataForm({ user }: Props) {
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget);
    const {
      marital_status, 
      profession
    } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "personal-data-update",
          email: user.email,
          marital_status,
          profession
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
        <h3 className="text-lg font-medium tracking-tight scroll-mt-20">Dados pessoais</h3>
        <p className="text-sm text-slate-600">Aqui você pode ver e atualizar seus dados pessoais</p>
      </div>
      <div className="shrink-0 bg-slate-200 h-[1px] w-full my-4"></div>
      <Form state={formState} onSubmit={onSubmit} preventReset>
        <FieldsWrapper>
          <FormRow>
            <Field>
              <Label 
                htmlFor="first_name" 
                title="Nome"
                required 
              />
              <TextInput 
                id="first_name"
                name="first_name"
                defaultValue={user?.first_name}
                placeholder="Digite seu primeiro nome"
                readOnly
                required
              />
              <FieldError error={formState?.errors?.first_name} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="last_name" 
                title="Sobrenome" 
                required 
              />
              <TextInput 
                id="last_name"
                name="last_name"
                defaultValue={user?.last_name}
                placeholder="Digite seu sobrenome" 
                readOnly
                required
              />
              <FieldError error={formState?.errors?.last_name} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="rg" 
                title="RG"
                required 
              />
              <TextInput 
                id="rg"
                name="rg"
                defaultValue={user?.rg}
                placeholder="99.999.999-9"
                readOnly
                required
              />
              <FieldError error={formState?.errors?.rg} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="cpf" 
                title="CPF" 
                required 
              />
              <CPFInput 
                id="cpf"
                name="cpf"
                defaultValue={user?.cpf}
                placeholder="999.999.999-99" 
                readOnly
                required
              />
              <FieldError error={formState?.errors?.cpf} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="marital_status" 
                title="Estado Civil"
                required 
              />
              <TextInput 
                id="marital_status"
                name="marital_status"
                defaultValue={user?.marital_status}
                placeholder="Solteiro(a), Casado(a), Separado(a), Divorciado(a), Viúvo(a)"
                required
              />
              <FieldError error={formState?.errors?.marital_status} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="nationality" 
                title="Nacionalidade"
                required 
              />
              <TextInput 
                id="nationality"
                name="nationality"
                defaultValue={user?.nationality}
                placeholder="Ex: Brasileiro"
                readOnly
                required
              />
              <FieldError error={formState?.errors?.nationality} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="profession" 
                title="Profissão" 
                required 
              />
              <TextInput 
                id="profession"
                name="profession"
                defaultValue={user?.profession}
                placeholder="Digite sua profissão"
                required
              />
              <FieldError error={formState?.errors?.last_name} />
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