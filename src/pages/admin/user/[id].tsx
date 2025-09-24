import { GetServerSidePropsContext } from "next";
import { validateSession } from "@/lib/auth";
import { Document } from "@/types/document";
import User from "@/types/user";
import AdminLayout from "@/layout/admin";
import UserDocumentsGrid from "@/components/admin/user-documents-grid";
import UserDocumentRequestsGrid from "@/components/admin/user-document-requests-grid";
import { getUser } from "@/actions/user";
import { Trash2, XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/shared/button";
import { useRouter } from "next/router";
import { DocumentRequest } from "@/types/document-request";


export async function getServerSideProps(context: GetServerSidePropsContext) {
  const userId = context.query.id as string;
  const { auth_session: sessionId } = context.req.cookies;
  const { session } = await validateSession(sessionId);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  let admin: User | null = await getUser(session.userId);

  if(admin?.role !== 'admin') {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  let user: User | null = await getUser(userId);

  let documents: Document[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/documents?userId=${userId}`, { 
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

  return {
    props: { 
      user: admin, 
      client: user, 
      documents,
      sessionId: session.id 
    },
  };
}

export default function UserProfile({ user, client, documents: serverDocuments, sessionId }: { 
  user: User, 
  client: User, 
  documents: Document[],
  sessionId: string 
}) {
  const router = useRouter();
  const [deleteUserModalOpen, setDeleteUserModalOpen] = useState<boolean>(false);
  const [deleteUserResponseMessage, setDeleteUserResponseMessage] = useState<string>("");
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [documents, setDocuments] = useState<Document[]>(serverDocuments);

  const handleDeleteUserModal = () => {
    setDeleteUserModalOpen(!deleteUserModalOpen);
  }

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`/api/users/${client.id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });

      const responseData = await response.json();

      if(!response.ok) {
        setTimeout(() => {
          setDeleteUserResponseMessage("");
        }, 2000)
        return setDeleteUserResponseMessage(responseData?.errors?.global?.message);
      }

      router.push('/admin');
    } catch(err) {
      console.error('Ocorreu um erro inesperado ao tentar requisitar um novo documento para o usuário.', err)
    }
  }

  const fetchUserRequests = async () => {
    try {
      const response = await fetch(`/api/document-requests?userId=${client.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setRequests(data.data.requests);
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações do usuário:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRequestUpdate = (updatedRequest: DocumentRequest) => {
    setRequests(prev => prev.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    ));
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?userId=${client.id}`, {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDocuments(data.data.documents);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos do usuário:', err);
    }
  };

  const handleDocumentCreated = () => {
    // Atualiza a lista de documentos quando uma solicitação é aprovada
    fetchDocuments();
  };

  useEffect(() => {
    fetchUserRequests();
  }, [client.id]);

  return (
    <AdminLayout sessionId={sessionId}>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 md:px-6">
            <div className="flex flex-col space-y-8">
              <div className="flex items-center justify-end">
                <button 
                  type="button"
                  className="group border border-red-500 rounded-md flex items-center justify-center p-1.5 cursor-pointer hover:!border-red-500 hover:bg-red-500 transition-colors space-x-2 text-sm text-red-500 hover:text-white leading-none"
                  onClick={handleDeleteUserModal}
                >
                  <span>Remover cliente</span>
                  <Trash2 className="w-4 h-4 shrink-0 stroke-red-500 group-hover:stroke-white transition-colors duration-200 ease-linear"/>
                </button>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Dados pessoais</h3>
                <div className="overflow-hidden border rounded-md">
                  <table className="w-full border-collapse table-fixed">
                    <tbody>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <span className="font-medium">Nome: </span> 
                          <span>{client.first_name} {client.last_name}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">RG: </span> 
                          <span>{client.rg}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">CPF: </span> 
                          <span>{client.cpf}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">Nacionalidade: </span> 
                          <span>{client.nationality}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">Estado Civil: </span> 
                          <span>{client.marital_status}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">Profissão: </span> 
                          <span>{client.profession}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Contatos</h3>
                <div className="overflow-hidden border rounded-md">
                  <table className="w-full border-collapse table-fixed">
                    <tbody>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <span className="font-medium">Email: </span> 
                          <span>{client.email}</span>
                        </td>
                      </tr>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2 border-t">
                          <span className="font-medium">Telefone: </span> 
                          <span>{client.phone}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Endereço</h3>
                <div className="overflow-hidden border rounded-md">
                  <table className="w-full border-collapse table-fixed">
                    <tbody>
                      <tr className="text-sm hover:bg-gray-50 transition-colors">
                        <td className="p-2">
                          <span>{client.street_address} {client.neighbourhood} {client.city} - {client.state} {client.postal_code}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <UserDocumentsGrid 
                userEmail={client.email} 
                userId={client.id} 
                documents={documents} 
                onDocumentsChange={fetchDocuments}
              />
              
              <UserDocumentRequestsGrid 
                userId={client.id}
                userFirstName={client.first_name}
                userLastName={client.last_name}
                requests={requests}
                loadingRequests={loadingRequests}
                onRequestUpdate={handleRequestUpdate}
                onDocumentCreated={handleDocumentCreated}
                currentAdmin={user}
              />
            </div>
          </div>
        </div>
        
        {/* Modal de Delete User */}
        <div className={`fixed top-0 left-0 w-full h-screen flex items-center justify-center ${!deleteUserModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} transition-opacity ease-linear z-[60] px-4`}>
          <div 
            className="absolute top-0 left-0 w-full h-full bg-slate-950 bg-opacity-70 -z-10 cursor-default" 
            role="button" 
            onClick={handleDeleteUserModal}
          ></div>
          <div className={`relative w-full max-w-md border border-slate-200 rounded-lg grid gap-6 p-6 bg-white ${!deleteUserModalOpen ? 'scale-95' : 'scale-100'} transition-all ease-linear`}>
            <button 
              type="button"
              className=" absolute top-2 right-2 w-6 h-6 border rounded-md hover:border-slate-950 flex items-center justify-center"
              onClick={handleDeleteUserModal}
            >
              <XIcon className="w-4 h-4" />
            </button>
            <div className="flex flex-col space-y-1.5  pr-10">
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Tem certeza que deseja remover este cliente?
              </h1>
              <p className="text-sm font-normal text-slate-500 mt-1">
                <b className="text-red-500">Atenção:</b> Esta ação não poderá ser desfeita
              </p>
            </div>
            <Button className="!bg-red-500" onClick={handleDeleteUser}>Remover cliente</Button>
            <span 
              className={`${!deleteUserResponseMessage ? 'hidden' : 'inline-block'} bg-red-500 font-medium text-sm text-center text-white rounded-md py-2 px-4`}
            >
              {deleteUserResponseMessage}
            </span>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
