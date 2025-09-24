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
            href="/dashboard"
            className={`inline-flex items-center justify-center w-max py-2 text-sm ${pathname === '/dashboard' ? 'text-slate-950' : 'text-gray-600'} hover:text-slate-950 font-medium transition-colors duration-200 ease-linear`} 
          >
            <span>Início</span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
