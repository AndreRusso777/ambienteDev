"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="relative z-10 flex max-w-max flex-1 items-center justify-center">
      <ul className="flex flex-1 list-none items-center justify-center space-x-6">
        <li>
          <Link 
            href="/admin"
            className={`inline-flex items-center justify-center w-max py-2 text-sm ${pathname === '/admin' ? 'text-slate-950' : 'text-gray-600'} hover:text-slate-950 font-medium transition-colors duration-200 ease-linear`} 
          >
            <span>Início</span>
          </Link>
        </li>
        <li>
          <Link 
            href="/admin/new-user"
            className={`inline-flex items-center justify-center w-max py-2 text-sm ${pathname === '/admin' ? 'text-slate-950' : 'text-gray-600'} hover:text-slate-950 font-medium transition-colors duration-200 ease-linear`} 
          >
            <span>Novo Usuário</span>
          </Link>
        </li>
        {/* <li className="group relative">
          <button 
            className="inline-flex items-center justify-center w-max py-2 text-sm text-gray-600 hover:text-slate-950 group-hover:text-slate-950 font-medium transition-colors duration-200 ease-linear space-x-1"
          >
            <span>Clientes</span>
            <ChevronDown className="w-3 h-auto group-hover:-rotate-180 transition-transform duration-100 ease-in-out" />
          </button>
          <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto absolute top-full left-0 pt-4">
            <div className="group-hover:opacity-100 opacity-0 group-hover:scale-100 scale-95 transition-all duration-100 ease-linear delay-100 border border-slate-200 bg-white rounded-md overflow-clip">
              <ul className="grid w-[400px] gap-3 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                <li>
                  <Link
                    className="grid gap-1 rounded-md hover:bg-slate-50 transition-colors duration-200 ease-linear py-2 px-3"
                    href="#"
                  >
                    <span className="inline-block text-sm font-semibold text-slate-950">Visão Geral</span>
                    <span className="inline-block text-sm text-gray-600">Veja, busque e/ou filtre por todos os clientes cadastrados</span>
                  </Link>
                </li>
                <li>
                  <Link
                    className="grid gap-1 rounded-md hover:bg-slate-50 transition-colors duration-200 ease-linear py-2 px-3"
                    href="/admin/create-user"
                  >
                    <span className="inline-block text-sm font-semibold text-slate-950">Novo</span>
                    <span className="inline-block text-sm text-gray-600">Dê início ao processo de criação de conta de um novo cliente</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </li> */}
      </ul>
    </nav>
  )
}
