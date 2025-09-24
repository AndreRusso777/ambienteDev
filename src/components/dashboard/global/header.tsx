'use client';

import { CircleUser, Menu, Sprout, XIcon } from "lucide-react";
import Link from "next/link";
import { Navigation } from "./navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user";
import Image from "next/image";

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  const handleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });
      if(response.ok) {
        router.push('/');
      }
    } catch(err) {
      console.log(err);
    }
  }

  return (
    <header className="fixed top-0 w-full z-50">
      <div className="container">
        <div className="min-h-14 flex items-center gap-4 border-x px-4 md:px-6 border-b bg-white py-2">
          <div className="hidden md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 text-lg font-semibold md:text-base w-full max-w-20 min-w-20"
            >
              <Image 
                className="w-full h-auto flex-shrink-0" 
                width={80}
                height={80} 
                src="/logo.jpg" 
                alt="Logo"
              />
            </Link>
            {user?.status === "ACTIVE" && (
              <Navigation />
            )}
          </div>
          <div className="md:hidden">
            <button 
              className="inline-flex items-center justify-center w-10 h-10 border border-slate-200 hover:border-slate-400 rounded-md shrink-0 transition-colors duration-200 ease-linear disabled:pointer-events-none disabled:opacity-50"
              onClick={handleDrawer}
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className={`fixed top-0 left-0 ${drawerOpen ? 'md:-translate-x-full' : '-translate-x-full'} z-50 w-full max-w-xs h-screen bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
              <div className="grid gap-6 py-6 px-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    className="w-full max-w-20 flex items-center gap-2 text-lg font-semibold"
                  >
                    <Image 
                      className="w-full h-auto flex-shrink-0" 
                      width={80}
                      height={80} 
                      src="/logo.jpg" 
                      alt="Logo"
                    />
                  </Link>
                  <button 
                    className="inline-flex items-center justify-center w-10 h-10 border border-slate-200 hover:border-slate-400 rounded-md shrink-0 md:hidden transition-colors duration-200 ease-linear disabled:pointer-events-none disabled:opacity-50"
                    onClick={handleDrawer}
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="grid gap-4 text-lg font-medium ">
                  <Link 
                    href="/dashboard" 
                    className="text-slate-950 hover:text-slate-500 transition-colors duration-200 ease-linear"
                  >
                    <span>Documentos</span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
          <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="group relative">
              <button 
                type="button" 
                className="inline-flex items-center justify-center h-10 w-10 rounded-full"
              >
                <CircleUser className="h-5 w-5" />
              </button>
              <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto absolute top-full right-0 pt-4">
                <div className="w-max min-w-56 group-hover:opacity-100 opacity-0 group-hover:scale-100 scale-95 transition-all duration-100 ease-linear delay-100 border border-slate-200 bg-white rounded-md overflow-clip p-1">
                  <div className="flex flex-col py-1.5">
                    {user?.first_name ? (
                      <>
                        <span className="inline-block text-sm font-medium leading-none text-slate-950 px-2">
                          {user.first_name.split(' ').at(0)}{user.last_name ? ` ${user.last_name.split(' ').pop()}` : ''}
                        </span>
                        <span className="inline-block text-xs font-normal leading-none text-slate-800 px-2 mt-1">{user.email}</span>
                      </>
                    ) : (
                      <span className="inline-block text-sm font-medium leading-none text-slate-950 px-2">Minha Conta</span>
                    )}
                  </div>
                  
                  <div role="separator" className="-mx-1 my-1 h-px bg-slate-200"></div>
                  <ul className="grid">
                    {true && (
                      <li>
                        <Link className="inline-block w-full text-sm rounded-md py-1.5 px-2 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear" href="/dashboard/settings">Configurações</Link>
                      </li>
                    )}
                    <li>
                      <button 
                        type="button" 
                        className="inline-block w-full text-sm rounded-md py-1.5 px-2 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear text-left"
                        onClick={handleLogout}
                      >
                        <span>Sair</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
