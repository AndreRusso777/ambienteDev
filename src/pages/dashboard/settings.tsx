import { getUser } from "@/actions/user";
import AddressForm from "@/components/dashboard/settings/address-form";
import ContactsForm from "@/components/dashboard/settings/contacts-form";
import PersonalDataForm from "@/components/dashboard/settings/personal-data-form";
import DashboardLayout from "@/layout/dashboard";
import { validateSession } from "@/lib/auth";
import { Document } from "@/types/document";
import User from "@/types/user";
import { GetServerSidePropsContext } from "next";
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

  if (!user?.register_completed) {
    return {
      redirect: {
        destination: "/dashboard/signup",
        permanent: false,
      }
    };
  }

  let documents: Document[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents?userId=${user.id}`, { 
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      } 
    });

    const responseData = await response.json();

    if(response.ok) {
      documents = responseData.data.documents;
    }
  } catch(err) {
    console.error('Error while trying to fetch user documents', err);
  }

  if (!documents?.length) {
    return {
      redirect: {
        destination: "/dashboard/signup/contract",
        permanent: false,
      },
    };
  }

  const contract: Document | undefined = documents.find(document => Boolean(document.signed));

  if (!contract?.signed) {
    return {
      redirect: {
        destination: "/dashboard/signup/contract",
        permanent: false,
      },
    };
  }
  
  let payment: any = [];
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

  if (!payment || payment.status === "PENDING") {
    return {
      redirect: {
        destination: "/dashboard/signup/payment",
        permanent: false,
      },
    };
  }

  return {
    props: { user },
  };
}

enum SettingsForms {
  personalData,
  contacts,
  address
}

export default function SettingsPage({ user }: { user: User }) {
  const [selectedForm, setSelectedForm] = useState<SettingsForms>(SettingsForms.personalData);
  
  return (
    <DashboardLayout>
      <section>
        <div className="container">
          <div className="space-y-6 py-20 md:pt-32 md:pb-24 px-4 md:px-6 border-x">
            <div className="space-y-0.5">
              <h2 className="text-2xl font-bold tracking-tight">Configurações da Conta</h2>
              <p className="text-gray-500">Aqui você pode alterar seus dados e manter sua conta atualizada</p>
            </div>
            <div className="shrink-0 bg-slate-200 h-[1px] w-full my-6"></div>
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
              <div className="-mx-4 lg:w-1/5">
                <aside className="lg:sticky lg:top-20">
                  <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                    <button 
                      type="button"
                      className={`inline-flex justify-start items-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 ${selectedForm === SettingsForms.personalData ? 'bg-gray-100' : 'bg-transparent' } hover:underline text-slate-950 transition-colors duration-200 ease-linear`}
                      onClick={() => { setSelectedForm(SettingsForms.personalData) }}
                    >
                      <span>Dados pessoais</span>
                    </button>
                    <button 
                      type="button"
                      className={`inline-flex justify-start items-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 ${selectedForm === SettingsForms.contacts ? 'bg-gray-100' : 'bg-transparent' } hover:underline text-slate-950 transition-colors duration-200 ease-linear`}
                      onClick={() => { setSelectedForm(SettingsForms.contacts) }}
                    >
                      <span>Contatos</span>
                    </button>
                    <button 
                      type="button" 
                      className={`inline-flex justify-start items-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 ${selectedForm === SettingsForms.address ? 'bg-gray-100' : 'bg-transparent' } hover:underline text-slate-950 transition-colors duration-200 ease-linear`}
                      onClick={() => { setSelectedForm(SettingsForms.address) }}
                    >
                      <span>Endereço</span>
                    </button>
                  </nav>
                </aside>
              </div>
              <div className="flex-1 lg:max-w-lg">
                {selectedForm === SettingsForms.personalData && (
                  <PersonalDataForm user={user} />
                )}
                {selectedForm === SettingsForms.contacts && (
                  <ContactsForm user={user} />
                )}
                {selectedForm === SettingsForms.address && (
                  <AddressForm user={user} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  )
}
