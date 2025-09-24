import { getUser } from "@/actions/user";
import UsersTable from "@/components/admin/users-table";
import AdminLayout from "@/layout/admin";
import { validateSession } from "@/lib/auth";
import User from "@/types/user";
import { GetServerSidePropsContext } from "next";
import AdminDocumentRequestsTab from "@/components/admin/document-requests/admin-document-requests-tab";
import { useState, useEffect } from "react";
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

  if(user?.role !== 'admin') {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  let users: User[] = [];
  let totalUsers: number = 0;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, { 
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
      } 
    });
    
    const responseData = await response.json();

    if(response.ok) {
      users = responseData.data.users;
      totalUsers = responseData.data.totalUsers;
    }
  } catch(err) {
    console.error('Error while trying to fetch users', err);
  }

  return {
    props: { 
      user, 
      users, 
      totalUsers,
      sessionId: session.id 
    },
  };
}

export default function AdminPage({ user, users, totalUsers, sessionId }: { 
  user: User, 
  users: User[], 
  totalUsers: number,
  sessionId: string 
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');
  const router = useRouter();

  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'document-requests' || tab === 'requests') {
      setActiveTab('requests');
    } else if (tab === 'users') {
      setActiveTab('users');
    }
  }, [router.query]);

  return (
    <AdminLayout sessionId={sessionId}>
      <section>
        <div className="container">
          <div className="border-x min-h-display py-20 md:pt-32 md:pb-24 px-4 lg:px-6">
            <div className="flex flex-col space-y-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Área Administrativa
                </h2>
                <p className="text-slate-600">Gerencie clientes e solicitações</p>
              </div>

              {/* Navegação entre abas */}
              <div className="border-b">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Clientes
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'requests'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Solicitações de Documentos
                  </button>
                </div>
              </div>

              {/* Conteúdo das abas */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Clientes</h3>
                  <UsersTable users={users} totalUsers={totalUsers} />
                </div>
              )}
              {activeTab === 'requests' && (
                <AdminDocumentRequestsTab currentAdmin={user} />
              )}
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
