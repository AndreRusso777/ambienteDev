import { getUser } from "@/actions/user";
import Field from "@/components/ui/forms/field";
import FieldError from "@/components/ui/forms/field-error";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Form from "@/components/ui/forms/form";
import CPFInput from "@/components/ui/forms/inputs/cpf-input";
import DateInput from "@/components/ui/forms/inputs/date-input";
import EmailInput from "@/components/ui/forms/inputs/email-input";
import PhoneInput from "@/components/ui/forms/inputs/phone-input";
import PostalCodeInput from "@/components/ui/forms/inputs/postcode-input";
import Select from "@/components/ui/forms/inputs/select";
import TextInput from "@/components/ui/forms/inputs/text-input";
import Label from "@/components/ui/forms/label";
import FormRow from "@/components/ui/forms/row";
import Button from "@/components/ui/shared/button";
import statesOptions from "@/constants/states";
import DashboardLayout from "@/layout/dashboard";
import { validateSession } from "@/lib/auth";
import { FormState } from "@/types/form";
import User from "@/types/user";
import { XIcon } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { auth_session: sessionId} = context.req.cookies;
  const { session } = await validateSession(sessionId);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let user: User | null = await getUser(session.userId);
  
  if(user?.role === 'admin') {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    };
  }

  if(user?.register_completed) {
    return {
      redirect: {
        destination: "/dashboard/signup/contract",
        permanent: false,
      },
    };
  }

  return {
    props: { user },
  };
}

interface SignUpData {
  first_name: string;
  last_name: string;
  rg: string;
  cpf: string;
  marital_status: string;
  nationality: string;
  profession: string;
  email: string;
  phone: string;
  street_address: string;
  address_number: string;
  neighbourhood: string;
  city: string;
  postal_code: string;
  state: string;
}

export default function SignupPage({ user }: { user: User }) {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [signUpData, setSignUpData] = useState<SignUpData | null>(null);

  const handleSignUpData = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    setSignUpData({ 
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date,
      rg: data.rg,
      cpf: data.cpf,
      marital_status: data.marital_status,
      nationality: data.nationality,
      profession: data.profession,
      email: data.email,
      phone: data.phone,
      street_address: data.street_address,
      address_number: data.address_number,
      neighbourhood: data.neighbourhood,
      city: data.city,
      postal_code: data.postal_code,
      state: data.state
     } as SignUpData);
  };

  const onSignUp = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          action: 'signup',
          ...signUpData
        })
      });

      const responseData = await response.json();

      if(!response.ok) {
        setFormState(responseData);
        setSignUpData(null);
        setIsLoading(false);
      }
      
      router.push('/dashboard/signup/contract');
    } catch(err) {
      console.error('Unable to handle register request');
      setFormState({success: false, errors: { global: { message: "Ocorreu um erro ao tentar finalizar seu cadastro" } }});
    }
  }

  return (
    <DashboardLayout>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 lg:px-6">
            <div className="space-y-6">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Finalize seu cadastro</h2>
                <p className="text-gray-500">Precisamos que nos forneça algumas informações para lhe dar acesso a plataforma.</p>
              </div>
              <div className="shrink-0 bg-slate-200 h-[1px] w-full my-6"></div>
              <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="-mx-4 lg:w-1/5">
                  <aside className="lg:sticky lg:top-20">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                      <Link href="#personal-data" className={`inline-flex justify-start items-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2  bg-transparent hover:bg-gray-100 text-slate-950 transition-colors duration-200 ease-linear`}>
                        <span>Dados pessoais</span>
                      </Link>
                      <Link href="#address" className={`inline-flex justify-start items-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-transparent hover:bg-gray-100 text-slate-950 transition-colors duration-200 ease-linear`}>
                        <span>Endereço</span>
                      </Link>
                    </nav>
                  </aside>
                </div>
                <div className="flex-1 lg:max-w-lg">
                  <Form state={formState} onSubmit={handleSignUpData} preventReset>
                    <h3 id="personal-data" className="text-lg font-medium tracking-tight scroll-mt-20">Dados pessoais</h3>
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
                            required
                          />
                          <FieldError error={formState?.errors?.last_name} />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field>
                          <Label 
                            htmlFor="birth_date" 
                            title="Data de Nascimento" 
                            required 
                          />
                          <DateInput 
                            id="birth_date"
                            name="birth_date"
                            defaultValue={user?.birth_date?.split('T').at(0)}
                            readOnly={user.register_completed === 1}
                            required
                          />
                          <FieldError error={formState?.errors?.birth_date} />
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
                            required
                          />
                          <FieldError error={formState?.errors?.profession} />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field>
                          <Label 
                            htmlFor="email" 
                            title="Email"
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
                            readOnly={user.register_completed === 1}
                            required
                          />
                        </Field>
                      </FormRow>
                    </FieldsWrapper>
                    <div className="shrink-0 bg-slate-200 h-[1px] w-full my-4"></div>
                    <h3 id="address" className="text-lg font-medium tracking-tight scroll-mt-20">Endereço</h3>
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
                            readOnly={user.register_completed === 1}
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
                            placeholder="Número"
                            readOnly={user.register_completed === 1}
                            required
                          />
                          <FieldError error={formState?.errors?.street_address} />
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
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
                            readOnly={user.register_completed === 1}
                            required
                          />
                          <FieldError error={formState?.errors?.postal_code} />
                        </Field>
                      </FormRow>
                      <FormRow>
                        <Field>
                          <Label htmlFor="state" title="Estado" required />
                          <Select
                            id="state"
                            name="state"
                            defaultValue={user?.state || ""}
                            placeholder="Selecione seu estado"
                            options={statesOptions}
                            required
                            className="w-full px-3 py-2 pr-10 bg-white text-slate-900 focus:outline-none appearance-none cursor-pointer disabled:bg-gray-100 disabled:pointer-events-none disabled:shadow-none"
                          />
                          <FieldError error={formState?.errors?.state} />
                        </Field>
                      </FormRow>
                    </FieldsWrapper>
                    <div className="flex justify-end">
                      <Button loading={isLoading} disabled={isLoading}>
                        <span>Finalizar cadastro</span>
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`fixed top-0 left-0 w-full h-screen flex items-center justify-center ${!signUpData ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} transition-opacity ease-linear z-[60] px-4`}>
          <div 
            className="absolute top-0 left-0 w-full h-full bg-slate-950 bg-opacity-70 -z-10 cursor-default" 
            role="button" 
            onClick={() => {
              setSignUpData(null);
              setIsLoading(false);
            }}
          ></div>
          <div className={`relative w-full max-w-2xl border border-slate-200 rounded-lg grid gap-6 p-6 bg-white ${!signUpData ? 'scale-95' : 'scale-100'} transition-all ease-linear`}>
            <button 
              type="button"
              className=" absolute top-2 right-2 w-6 h-6 border rounded-md hover:border-slate-950 flex items-center justify-center"
              onClick={() => { 
                setSignUpData(null);
                setIsLoading(false);
              }}
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex flex-col space-y-1.5">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Confirme seus dados
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-1">
                Caso encontre alguma informação incorreta por favor corrija e tente novamente
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h3 className="text-lg font-medium tracking-tight text-slate-950">Dados pessoais:</h3>
                {signUpData && (
                  <ul className="space-y-0.5">
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Nome: </span>
                      <span>{signUpData.first_name} {signUpData.last_name}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">RG: </span>
                      <span>{signUpData.rg}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">CPF: </span>
                      <span>{signUpData.cpf}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Estado Civil: </span>
                      <span>{signUpData.marital_status}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Nacionalidade: </span>
                      <span>{signUpData.nationality}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Profissão: </span>
                      <span>{signUpData.profession}</span>
                    </li>
                  </ul>
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-medium tracking-tight text-slate-950">Contatos:</h3>
                {signUpData && (
                  <ul className="space-y-0.5">
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Email: </span>
                      <span>{signUpData.email}</span>
                    </li>
                    <li className="text-sm text-slate-950">
                      <span className="font-medium">Telefone: </span>
                      <span>{signUpData.phone}</span>
                    </li>
                  </ul>
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-medium tracking-tight text-slate-950">Endereço:</h3>
                {signUpData && (
                  <ul className="space-y-0.5">
                    <li className="text-sm text-slate-950">
                      <span>{signUpData.street_address} {signUpData.address_number}, {signUpData.neighbourhood} {signUpData.city} - {signUpData.state} {signUpData.postal_code}</span>
                    </li>
                  </ul>
                )}
              </div>
              <Form onSubmit={onSignUp} preventReset>
                <Button loading={isLoading} disabled={isLoading}>
                  <span>Confirmar e Enviar</span>
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}
