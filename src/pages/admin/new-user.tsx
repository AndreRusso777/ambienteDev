import PhoneInput from "@/components/ui/forms/inputs/phone-input";
import FieldsWrapper from "@/components/ui/forms/fields-wrapper";
import Field from "@/components/ui/forms/field";
import Label from "@/components/ui/forms/label";
import EmailInput from "@/components/ui/forms/inputs/email-input";
import FieldError from "@/components/ui/forms/field-error";
import Button from "@/components/ui/shared/button";
import { useState } from "react";
import { FormState } from "@/types/form";
import Form from "@/components/ui/forms/form";
import AdminLayout from "@/layout/admin";
import User from "@/types/user";
import { validateSession } from "@/lib/auth";
import { GetServerSidePropsContext } from "next";
import TextInput from "@/components/ui/forms/inputs/text-input";
import NumberInput from "@/components/ui/forms/inputs/number-input";
import { getUser } from "@/actions/user";

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

  if(user?.role !== 'admin') {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: { 
      user,
      sessionId: session.id 
    },
  };
}

export default function NewUser({ user, sessionId }: { 
  user: User,
  sessionId: string 
}) {
  const [formState, setFormState] = useState<FormState>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedBillingType, setSelectedBillingType] = useState<string>("");
  const [selectedInstallmentCount, setSelectedInstallmentCount] = useState<number | null>(null);

  const handleSignUp = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const { email, phone, price, price_text, down_payment, down_payment_text } = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          phone,
          price,
          price_text,
          down_payment,
          down_payment_text,
          billing_type: selectedBillingType,
          installment_count: selectedInstallmentCount
        })
      });

      const responseData = await response.json();

      if(response.ok) {
        setSelectedBillingType("");
        setSelectedInstallmentCount(null);
      }

      setFormState(responseData);
      setIsLoading(false);
    } catch(err) {
      setIsLoading(false);
      console.log(err);
    }
  }

  return (
    <AdminLayout sessionId={sessionId}>
      <section>
        <div className="container">
          <div className="min-h-display flex items-center justify-center border-x">
            <div className="w-full grid gap-6 px-4 md:px-6 py-20 md:pt-32 md:pb-24">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-semibold leading-none tracking-tight">
                  Criar novo usuário
                </h1>
                <p className="text-sm font-normal text-slate-600">
                  Preencha os dados para criar iniciar o processo de abertura de conta de um novo cliente
                </p>
              </div>
              <Form className="grid gap-6" onSubmit={handleSignUp} state={formState}>
                <FieldsWrapper className="md:grid-cols-2">
                  <Field>
                    <Label htmlFor="email" title="Email" required />
                    <EmailInput 
                      id="email"
                      name="email"
                      placeholder="Email"
                      required
                    />
                    <FieldError error={formState?.errors?.email} />
                  </Field>
                  <Field>
                    <Label htmlFor="phone" title="Telefone" required />
                    <PhoneInput id="phone" name="phone" required />
                    <FieldError error={formState?.errors?.phone} />
                  </Field>
                </FieldsWrapper>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-medium leading-none tracking-tight">Cobrança</h2>
                  <p className="text-sm text-slate-600">Valor cobrado ao usuário</p>
                </div>
                <FieldsWrapper className="md:grid-cols-3">
                  <Field>
                    <Label htmlFor="price" title="Preço" required />
                    <NumberInput 
                      id="price"
                      name="price"
                      min={0}
                      placeholder="2500"
                      required
                    />
                    <FieldError error={formState?.errors?.email} />
                  </Field>
                  <Field className="md:col-span-2">
                    <Label htmlFor="price_text" title="Preço por extenso" required />
                    <TextInput 
                      id="price_text"
                      name="price_text"
                      placeholder="Dois mil e quinhentos"
                      required
                    />
                    <FieldError error={formState?.errors?.email} />
                  </Field>
                  <Field>
                    <Label htmlFor="entrada" title="Entrada" required />
                    <NumberInput 
                      id="down_payment"
                      name="down_payment"
                      min={0}
                      placeholder="1250"
                      required
                    />
                    <FieldError error={formState?.errors?.email} />
                  </Field>
                  <Field className="md:col-span-2">
                    <Label htmlFor="down_payment_text" title="Preço por extenso" required />
                    <TextInput 
                      id="down_payment_text"
                      name="down_payment_text"
                      placeholder="Um mil duzentos e cinquenta"
                      required
                    />
                    <FieldError error={formState?.errors?.email} />
                  </Field>
                </FieldsWrapper>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-medium leading-none tracking-tight">Forma de Pagamento</h2>
                  <p className="text-sm text-slate-600">Defina a forma de pagamento que será utilizada pelo usuário</p>
                </div>
                <FieldsWrapper>
                  <Field className="!grid-cols-2">
                    <button 
                      type="button" 
                      className={`flex items-center justify-center text-sm text-center font-medium leading-none border ${selectedBillingType === "CREDIT_CARD" ? 'border-slate-950' : 'border-inherit'} rounded-md py-1.5 px-2`}
                      onClick={() => { 
                        setSelectedBillingType('CREDIT_CARD');
                        setSelectedInstallmentCount(null); 
                      }}
                    >
                      Cartão de Crédito
                    </button>
                    <button 
                      type="button" 
                      className={`flex items-center justify-center text-sm text-center font-medium leading-none border ${selectedBillingType === "PIX" ? 'border-slate-950' : 'border-inherit'} rounded-md py-1.5 px-2`}
                      onClick={() => { 
                        setSelectedBillingType('PIX');
                        setSelectedInstallmentCount(null); 
                      }}
                    >
                      Pix
                    </button>
                  </Field>
                </FieldsWrapper>
                <FieldsWrapper className={`${!selectedBillingType ? '!hidden' : '!grid'}!grid-cols-3 md:!grid-cols-6 lg:!grid-cols-12`}>
                  {Array.from({ length: 12 }, (_, index) => {
                    const partitionValue = index + 1;
                    return (
                      <Field key={partitionValue}>
                        <button 
                          type="button" 
                          className={`flex items-center justify-center text-sm text-center font-medium leading-none border ${selectedInstallmentCount === partitionValue ? 'border-slate-950' : 'border-inherit'} rounded-md py-1.5 px-2 cursor-pointer`}
                          onClick={() => { setSelectedInstallmentCount(partitionValue) }}
                        >
                          {partitionValue}x
                        </button>
                      </Field>
                    );
                  })}
                </FieldsWrapper>
                <Button 
                  className="w-full"
                  loading={isLoading}
                >
                  <span>Criar</span>
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
