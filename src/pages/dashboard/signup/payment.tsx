import { GetServerSidePropsContext } from "next";
import { validateSession } from "@/lib/auth";
import User from "@/types/user";
import DashboardLayout from "@/layout/dashboard";
import { getUser } from "@/actions/user";
import { Document } from "@/types/document";
import { useEffect, useState } from "react";
import Button from "@/components/ui/shared/button";
import Billing from "@/types/billing";
import Payment from "@/types/payments";
import { useRouter } from "next/router";

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

  if(!user?.register_completed) {
    return {
      redirect: {
        destination: "/dashboard/signup",
        permanent: false,
      },
    };
  }

  /**
   *  Get user contract
   */
  let contract: Document | null = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents?userId=${user.id}&type=contract`, { 
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      } 
    });

    const responseData = await response.json();

    if(response.ok) {
      contract = responseData.data.document;
    }
  } catch(err) {
    console.error('Error while trying to get contract', err);
  }

  if(!contract?.signed)  {
    return {
      redirect: {
        destination: "/dashboard/signup/contract",
        permanent: false,
      },
    };
  }

  let payment: Payment | null = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments?userId=${user.id}`, {
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      } 
    });

    const responseData = await response.json();

    if(response.ok) {
      payment = responseData.data.payment;
    }
  } catch(err) {
    console.error('Error while trying to fetch user payment', err);
  }

  if (payment && (payment.status === "RECEIVED" || payment.status === "RECEIVED_IN_CASH" || payment.status === "CONFIRMED")) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  /**
   * Get user billing information
   */
  let billing: Billing | null = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/billings?userId=${user.id}`, { 
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      } 
    });

    const responseData = await response.json();

    if(response.ok) {
      billing = responseData.data.billing;
    }
  } catch(err) {
    console.error('Error while trying to fetch user billing', err);
  }

  if(!billing) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { user, billing, payment },
  };
}

export default function PaymentPage({ user, billing, payment }: { user: User, billing: Billing, payment: Payment | null }) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentId, setPaymentId] = useState<string | null>(payment?.payment_id || null);

  const handlePayment = async() => {
    setIsLoading(true);

    if(payment) {
      const link = document.createElement("a");
      link.href = payment.invoice_url;
      link.target = "_blank";
      link.click();
      return;
    }

    try {
      const response = await fetch(`/api/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          customer_id: user.customer_id,
          billing_type: billing.billing_type,
          installment_count: billing.installment_count,
          price: billing.price,
        })
      });

      if(!response.ok) {
        setError('Ocorreu um erro ao iniciar processo de pagamento');
      }

      const paymentData: any = await response.json();

      setPaymentId(paymentData.data.payment.payment_id);

      const link = document.createElement("a");
      link.href = paymentData.data.payment.invoice_url;
      link.target = "_blank";
      link.click();
    } catch(err) {
      const error_message = 'Ocorreu um erro ao iniciar processo de pagamento'
      console.error(err);
      setError(error_message);
    }
  }

  useEffect(() => {
      if(!paymentId) return;
  
      const intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/payments?paymentId=${paymentId}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
            }
          });
  
          const data = await response.json();
          
          if (!response.ok) {
            console.error(data.errors.global.message);
          }
  
          if (data.data.payment.status === "RECEIVED" || data.data.payment.status === "RECEIVED_IN_CASH" || data.data.payment.status === "CONFIRMED") {
            clearInterval(intervalId);
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 5000);
  
      return () => clearInterval(intervalId);
    }, [paymentId]);

  return (
    <DashboardLayout>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 lg:px-6">
            <div className="space-y-6">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Pagamento</h2>
                <p className="text-gray-500">Abaixo você encontrará informaçẽs e instruções sobre o pagamento previamente combinado, preencha as informações necessárias para prosseguir.</p>
                <p className="text-gray-500">Após esta etapa você terá acesso completo a plataforma.</p>
              </div>
              <div className="shrink-0 bg-slate-200 h-[1px] w-full my-6"></div>
              <div className="overflow-hidden border rounded-md">
                <table className="w-full caption-bottom text-sm">
                  <thead className="hidden lg:table-header-group">
                    <tr className="group transition-colors hover:bg-gray-50">
                      <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                        Nome
                      </th>
                      <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                        Método de Pagamento
                      </th>
                      <th className="h-10 px-2 text-left align-middle font-medium text-slate-600 sticky right-0 group-hover:bg-gray-50 transition-colors" colSpan={1}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="grid lg:table-row group lg:border-t transition-colors hover:bg-gray-50">
                      <td className="p-2 align-middle" colSpan={1}>
                        <div data-column-name="Nome: " className="before:content-[attr(data-column-name)] before:font-bold lg:before:hidden">Cobrança sobre prestação de serviço</div>
                      </td>
                      <td className="p-2 align-middle" colSpan={1}>
                        <div data-column-name="Método de pagamento: " className="before:content-[attr(data-column-name)] before:font-bold lg:before:hidden">{billing.billing_type === "CREDIT_CARD" ? 'Cartão de Crédito' : 'Pix'}</div>
                      </td>
                      <td className="p-2 align-middle sticky right-0 bg-white group-hover:bg-gray-50 transition-colors" colSpan={1}>
                        <div className="lg:w-max lg:ml-auto">
                          <Button 
                            onClick={handlePayment} 
                            loading={isLoading}
                            className="w-full lg:w-fit"
                          >
                            <span>Fazer pagamento</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-600">Instruções:</h3>
                <ol className="list-decimal pl-6 text-sm space-y-0.5 text-slate-600 max-w-5xl">
                  <li>Clique no botão <strong>"Fazer pagamento"</strong></li>
                  <li>Uma nova aba será aberta em seu navegador para que você possa realizar o pagamento</li>
                  <li>Você será automaticamente deslogado de sua conta</li>
                  <li>Após realizar o pagamento basta retornar a esta aba</li>
                  <li>Se seu pagamento já estiver sido detectado você já será redirecionado para a pagina inicial e estará liberado para utilizar a plataforma</li>
                  <li>Caso você ja tenha feito o pagamento mas ainda não tenha sido detectado, aguarde pois não deve demorar mais de 24h para seu pagamento ser detectado</li>
                  <li>Caso se passem 24h desde o pagamento e você continuar sendo direcionado a esta página ao acessar a plataforma, entre em contato conosco por meio de outros canais de comunicação para lhe dar acesso.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
