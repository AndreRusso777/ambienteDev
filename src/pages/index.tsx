import LoginCard from "@/components/auth/login-card";
import Link from "next/link";
import Image from "next/image";
import { GetServerSidePropsContext } from "next";
import { validateSession } from "@/lib/auth";
import User from "@/types/user";
import { getUser } from "@/actions/user";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { auth_session: sessionId} = context.req.cookies;
  const { session } = await validateSession(sessionId);

  if (!session) {
    return {
      props: {},
    };
  }

  let user: User | null = await getUser(session.userId);

  if(!user) {
    return {
      props: {},
    };
  }

  if(user?.role === 'admin') {
    return {
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    };
  }

  if(user?.role === 'user') {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

export default function Login() {
  return (
    <>
      <header className="fixed w-full top-0 border-b bg-white">
        <div className="container">
          <div className="hidden md:flex justify-center items-center min-h-14 md:text-sm py-2">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-lg font-semibold md:text-base w-full max-w-20"
            >
              <Image 
                className="w-full h-auto flex-shrink-0" 
                width={80}
                height={80} 
                src="/logo.jpg" 
                alt="Logo"
              />
            </Link>
          </div>
        </div>
      </header>
      <section className="bg-slate-50">
        <div className="flex items-center justify-center py-12 px-4 min-h-screen">
          <LoginCard />
        </div>
      </section>
    </>
  )
}
