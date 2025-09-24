import { getUser } from "@/actions/user";
import DocumentsTable from "@/components/dashboard/documents-table";
import DashboardLayout from "@/layout/dashboard";
import { validateSession } from "@/lib/auth";
import { Document } from "@/types/document";
import User from "@/types/user";
import { GetServerSidePropsContext } from "next";
import DocumentRequestsTab from "@/components/dashboard/document-requests-tab";
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
  
  let payment: any = null;
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
    props: { user, documents },
  };
}

export default function DashboardPage({ user, documents }: { user: User, documents: Document[] }) {
  const [activeTab, setActiveTab] = useState<'documents' | 'requests'>('documents');

  return (
    <DashboardLayout>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 lg:px-6">
            <div className="flex flex-col space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Bem vindo, {user.first_name} {user.last_name.split(' ')[user.last_name.split(' ').length - 1]}
                </h2>
                <p className="text-slate-600">Gerencie seus documentos e solicitações</p>
              </div>

              {/* Navegação entre abas */}
              <div className="border-b">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'documents'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Documentos
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'requests'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Solicitações
                  </button>
                </div>
              </div>

              {/* Conteúdo das abas */}
              {activeTab === 'documents' && (
                <DocumentsTable user={user} documents={documents} />
              )}
              {activeTab === 'requests' && (
                <DocumentRequestsTab user={user} />
              )}
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
