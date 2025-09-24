import Field from "@/components/ui/forms/field";
import FieldError from "@/components/ui/forms/field-error";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import PostalCodeInput from "@/components/ui/forms/inputs/postcode-input";
import Select from "@/components/ui/forms/inputs/select";
import TextInput from "@/components/ui/forms/inputs/text-input";
import Label from "@/components/ui/forms/label";
import FormRow from "@/components/ui/forms/row";
import Button from "@/components/ui/shared/button";
import statesOptions from "@/constants/states";
import { FormState } from "@/types/form";
import User from "@/types/user";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  user: User;
}

export default function AddressForm({ user }: Props) {
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true)
    
    const formData = new FormData(e.currentTarget);
    const { 
      street_address, 
      address_number, 
      neighbourhood, 
      city, 
      postal_code, 
      state
    } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "address-update",
          email: user.email,
          street_address, 
          address_number,
          neighbourhood, 
          city, 
          postal_code, 
          state
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
        <h3 className="text-lg font-medium tracking-tight scroll-mt-20">Endereço</h3>
        <p className="text-sm text-slate-600">Mantenha seu endereço atualizado</p>
      </div>
      <div className="shrink-0 bg-slate-200 h-[1px] w-full my-4"></div>
      <Form state={formState} onSubmit={onSubmit} preventReset>
        <FieldsWrapper>
          <FormRow>
            <Field>
              <Label 
                htmlFor="street_address"
                title="Endereço"
                required
              />
              <TextInput 
                id="street_address"
                name="street_address"
                defaultValue={user?.street_address}
                placeholder="Digite seu endereço"
                required
              />
              <FieldError error={formState?.errors?.street_address} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="address_number"
                title="Número"
                required
              />
              <TextInput 
                id="address_number"
                name="address_number"
                defaultValue={user?.address_number}
                placeholder="Digite seu endereço"
                required
              />
              <FieldError error={formState?.errors?.address_number} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="neighbourhood"
                title="Bairro"
                required
              />
              <TextInput 
                id="neighbourhood"
                name="neighbourhood"
                defaultValue={user?.neighbourhood}
                placeholder="Digite seu bairro" 
                required
              />
              <FieldError error={formState?.errors?.neighbourhood} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="city"
                title="Cidade"
                required
              />
              <TextInput 
                id="city"
                name="city"
                defaultValue={user?.city}
                placeholder="Digite sua cidade" 
                required
              />
              <FieldError error={formState?.errors?.city} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label 
                htmlFor="postal_code"
                title="CEP"
                required
              />
              <PostalCodeInput 
                id="postal_code"
                name="postal_code"
                defaultValue={user?.postal_code}
                placeholder="99999-999" 
                required
              />
              <FieldError error={formState?.errors?.postal_code} />
            </Field>
          </FormRow>
          <FormRow>
            <Field>
              <Label htmlFor="state" title="Estado" required />
              <div className="relative isolate border border-slate-200 rounded-md focus:border-slate-950 transition-colors duration-200 ease-linear shadow-sm overflow-hidden">
                <select
                  id="state"
                  name="state"
                  defaultValue={user?.state || ""}
                  required
                  className="w-full px-3 py-2 pr-10 bg-white text-slate-900 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Selecione o estado
                  </option>
                  {statesOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 pointer-events-none text-slate-500" />
              </div>
              <FieldError error={formState?.errors?.state} />
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