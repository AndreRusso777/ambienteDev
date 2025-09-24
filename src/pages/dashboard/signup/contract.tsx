import { GetServerSidePropsContext } from "next";
import { validateSession } from "@/lib/auth";
import User from "@/types/user";
import DashboardLayout from "@/layout/dashboard";
import { Document } from "@/types/document";
import Billing from "@/types/billing";
import { getUser } from "@/actions/user";
import { useEffect, useState } from "react";
import Button from "@/components/ui/shared/button";
import { useRouter } from "next/router";
import { Check } from "lucide-react";

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
  
  /**
   * Check if user is not admin
   */
  if(user?.role === 'admin') {
    return {
      redirect: {
      destination: "/admin",
      permanent: false,
      },
    };
  }

  /**
   * Check if user register is completed
   */
  if(!user?.register_completed) {
    return {
      redirect: {
        destination: "/dashboard/signup",
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

  if(!contract) {
    return {
      props: { user, contract: { sign_url: "" }, billing },
    };
  }

  if(contract.signed)  {
    return {
      redirect: {
        destination: "/dashboard/signup/payment",
        permanent: false,
      },
    };
  }

  return {
    props: { user, contract, billing },
  };
}

export default function ContractPage({ user, contract, billing }: { user: User, contract: Document, billing: Billing }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allowSign, setAllowSign] = useState<boolean>(false);
  const [signerToken, setSignerToken] = useState<string>(contract.signer_token);
  const [contractSigned, setContractSigned] = useState<boolean>(false);

  const handleCreateContract = async() => {
    try {
      const response = await fetch('/api/documents/contracts', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          billing
        })
      });

      if(!response.ok) {
        return console.error('Ocorreu um erro inesperado ao tentar gerar link de assinatura.');
      }

      const responseData = await response.json();
      
      setSignerToken(responseData.data.signer_token);
      setAllowSign(true);
      setIsLoading(false);
    } catch(err) {
      console.error(err);
    }
  }

  const handleSign = async() => {
    setIsLoading(true);

    if(!contract?.token) {
      await handleCreateContract();
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let contractTokenExpiry: Date | null = null;
    
    if(contract.token_expiry) {
      contractTokenExpiry = new Date(contract.token_expiry);
      contractTokenExpiry.setHours(0, 0, 0, 0);
    }
    
    if(contractTokenExpiry && today.getTime() > contractTokenExpiry.getTime()) {
      try {
        const response = await fetch(`/api/documents/contracts?id=${contract.id}&token=${contract.token}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: contract.id,
            token: contract.token
          })
        });

        const responseData = await response.json();
  
        if(!response.ok) {
          setIsLoading(false);
          return console.error('Ocorreu um erro inesperado ao tentar validar seu contrato');
        }

        await handleCreateContract()
      } catch(err) {
        console.error('Ocorreu um erro inesperado ao tentar atualizar data de assinatura do seu contrato', err);
        setIsLoading(false);
        return;
      }
    } else {
      setSignerToken(contract.signer_token);
      setAllowSign(true);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const handleMessage = (e: any) => {
      // When contract is loaded in iframe
      if (e.data === 'zs-doc-loaded') {
        console.log('Contract loaded');
      }

      // When contract is signed
      if (e.data === 'zs-doc-signed') {
        console.log('Contract signed');
        setContractSigned(true);
      }

      // When contract is read for download
      if (e.data === 'zs-signed-file-ready') {
        console.log('Contract ready for download');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    if(!contractSigned) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/contracts?userId=${user.id}`, {
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error(data.errors.global.message);
        }

        if (data.data.document.signed === 1) {
          console.log('Contract signed, redirecting...');
          clearInterval(intervalId);
          router.push('/dashboard/signup/payment');
        }
      } catch (error) {
        console.error('Error polling contract status:', error);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [contractSigned]);

  return (
    <DashboardLayout>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 lg:px-6">
            <div className="space-y-6">
              <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Assinatura</h2>
                <p className="text-gray-500">Abaixo você encontrará documentos que precisamos que você assine neste primeiro momento para que possamos lhe prestar nossos serviços.</p>
              </div>
              <div className="shrink-0 bg-slate-200 h-[1px] w-full my-6"></div>
              <div className="overflow-hidden border rounded-md">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="group transition-colors hover:bg-gray-50">
                      <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                        Nome
                      </th>
                      <th className="h-10 px-2 text-left align-middle font-medium text-slate-600 sticky right-0 group-hover:bg-gray-50 transition-colors" colSpan={1}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="group border-t transition-colors hover:bg-gray-50">
                      <td className="p-2 align-middle" colSpan={1}>
                        <div>Contrato de Prestação de Serviços</div>
                      </td>
                      <td className="p-2 align-middle sticky right-0 bg-white group-hover:bg-gray-50 transition-colors" colSpan={1}>
                        <div className="w-max ml-auto">
                          <Button 
                            onClick={handleSign} 
                            loading={isLoading} 
                            disabled={allowSign}
                            className={contractSigned ? 'flex items-center space-x-1 bg-green-600 opacity-100 pointer-events-none' : ''}
                          >
                            <span>{!contractSigned ? 'Assinar' : 'Assinado'}</span>
                            {contractSigned && <Check className="h-4 w-auto flex-shrink-0" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {!contractSigned ? (
                <div className="space-y-2">
                  {signerToken && allowSign && (
                    <iframe 
                      src={`${process.env.NEXT_PUBLIC_ZAP_SIGN_APP}/verificar/${signerToken}`} 
                      width="100%" 
                      height="800px" 
                      allow="camera"
                    ></iframe>
                  )}
                  <h3 className="text-lg font-semibold tracking-tight text-slate-600">Instruções:</h3>
                  <ol className="list-decimal pl-6 text-sm space-y-0.5 text-slate-600">
                    <li>Clique no botão <strong>"Assinar"</strong> para assinar o documento</li>
                    <li>Logo após você verá surgir seu contrato</li>
                    <li>Leia atentamente o documento e confira seus dados para confirmar de que tudo está corretamente preenchido</li>
                    <li>Caso haja qualquer dado errado, contate-nos para que possamos corrigir o erro</li>
                    <li>Se tudo estiver correto basta assinar o documento</li>
                    <li>Após a assinatura você será redirecionado para a etapa de pagamento</li>
                  </ol>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-600">
                    Você será redirecionado em instantes...
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
