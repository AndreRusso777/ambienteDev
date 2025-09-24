import { debounce } from 'lodash';
import User from "@/types/user";
import { InputMask } from "@react-input/mask";
import { Check, ChevronDown, ChevronLeft, ChevronRight, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from 'next/link';

interface Props {
  users: User[];
  totalUsers: number;
}

enum SearchBy {
  name,
  cpf
}

export default function UsersTable({ users: serverUsers, totalUsers: serverTotalUsers }: Props) {
  const [searchBy, setSearchBy] = useState<SearchBy>(SearchBy.name);
  const [searchByDropdownOpen, setSearchByDropdownOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [limitDropdownOpen, setLimitDropdownOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>(serverUsers);
  const [totalUsers, setTotalUsers] = useState<number>(serverTotalUsers);

  /**
   * Handle search by input type
   * @param searchBy 
   */
  const handleSearchBy = (searchBy: SearchBy) => {
    setSearchBy(searchBy);
    setSearch("");
    setSearchByDropdownOpen(false);
  }
  
  /**
   * Handle the users fetch
   */
  const getUsers = async() => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users?page=${page}&search=${encodeURI(search)}&searchBy=${searchBy === SearchBy.cpf ? 'cpf' : 'name'}&limit=${rowsPerPage}`, { 
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        } 
      });
      
      const responseData = await response.json();
      
      setUsers(responseData.data.users);
      setTotalUsers(responseData.data.totalUsers);
    } catch(err) {
      console.error('Error while trying to fetch users', err);
    }
  }

  // Debounce
  const debouncedGetUsers = useCallback(debounce(() => { getUsers(); }, 300), [search, page, rowsPerPage]);

  /**
   *  Run get users when some of the dependencies change
   */
  useEffect(() => {
    debouncedGetUsers();
  }, [page, search, rowsPerPage]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative z-20">
            <button 
              className="flex items-center justify-center space-x-1 text-sm rounded-md border px-3 py-1 focus-visible:outline-none h-8 shadow-sm transition-colors"
              onClick={() => { setSearchByDropdownOpen(!searchByDropdownOpen) }}
            >
              <span>{searchBy === SearchBy.cpf ? 'CPF' : 'Nome'}</span>
              <ChevronDown className={searchByDropdownOpen ? 'w-4 rotate-180' : 'w-4'} />
            </button>
            <div className={`absolute top-full left-0 pt-2 ${!searchByDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} shadow-sm`}>
              <div className={`w-max min-w-40 ${!searchByDropdownOpen ? ' opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-100 ease-linear delay-100 border border-slate-200 bg-white rounded-md overflow-clip p-1`}>
                <ul className="grid">
                  <li>
                    <button 
                      type="button" 
                      className="inline-block w-full text-sm rounded-md py-1.5 px-2 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear text-left"
                      onClick={() => { handleSearchBy(SearchBy.name) }}
                    >
                      <span>Nome</span>
                    </button>
                  </li>
                  <li>
                    <button 
                      type="button" 
                      className="inline-block w-full text-sm rounded-md py-1.5 px-2 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear text-left"
                      onClick={() => { handleSearchBy(SearchBy.cpf) }}
                    >
                      <span>CPF</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {searchBy === SearchBy.cpf ? (
            <InputMask 
              type="text"
              mask="___.___.___-__"
              replacement={{ _: /\d/ }}
              className="flex rounded-md border bg-white px-3 py-1 shadow-sm transition-colors placeholder:text-slate-600 focus-visible:outline-none text-sm h-8 w-full md:w-[250px]"
              placeholder="Buscar por CPF"
              value={search}
              onInput={(e) => { setSearch(e.currentTarget.value) }}
            />
          ) : (
            <input 
              type="text" 
              className="flex rounded-md border bg-white px-3 py-1 shadow-sm transition-colors placeholder:text-slate-600 focus-visible:outline-none text-sm h-8 w-full md:w-[250px]"
              placeholder="Buscar por nome"
              value={search}
              onInput={(e) => { setSearch(e.currentTarget.value) }}
            />
          )}
          
          {search && (
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none hover:bg-gray-100 py-2 h-8 px-2 lg:px-3"
              onClick={() => { setSearch('') }}
            >
              <span>Limpar</span>
              <XIcon className="w-4 h-4 shrink-0" />
            </button>
          )}
        </div>
      </div>
      {users?.length > 0 ? (
        <>
          <div className="rounded-md border overflow-hidden">
            <div className="relative w-full overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="group transition-colors hover:bg-gray-50">
                    <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                      ID
                    </th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                      Nome
                    </th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                      Email
                    </th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-slate-600" colSpan={1}>
                      CPF
                    </th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-slate-600 sticky right-0 group-hover:bg-gray-50 transition-colors" colSpan={1}></th>
                  </tr>
                </thead>
                {users?.length > 0 && (
                  <tbody>
                    {users.map((user: User) => (
                      <tr key={user.id} className="group border-t transition-colors hover:bg-gray-50">
                        <td className="p-2 align-middle" colSpan={1}>
                          <div className="w-4">{user.id}</div>
                        </td>
                        <td className="p-2 align-middle" colSpan={1}>
                          <div className="min-w-64">{user.first_name && user.last_name ? user.first_name + ' ' + user.last_name : '-'}</div>
                        </td>
                        <td className="p-2 align-middle" colSpan={1}>
                          <div className="min-w-40">{user.email ? user.email : '-'}</div>
                        </td>
                        <td className="p-2 align-middle" colSpan={1}>
                          <div className="min-w-28">{user.cpf ? user.cpf : '-'}</div>
                        </td>
                        <td className="p-2 align-middle sticky right-0 bg-white group-hover:bg-gray-50 transition-colors" colSpan={1}>
                          <div className="w-max ml-auto">
                            <Link 
                              href={`/admin/user/${user.id}`}
                              className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 border transition-colors focus-visible:outline-none space-x-1"
                            >
                              <ChevronRight className="w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="text-center md:text-left text-sm text-slate-600 w-full md:w-fit order-2 md:order-1 mt-6 md:mt-0">
              Exibindo {users.length} de {totalUsers} usuários
            </div>
            <div className="flex items-center justify-between md:justify-end space-x-6 order-1 md:order-2">
              <div className="flex items-center text-sm space-x-2">
                <div className="relative z-20">
                  <button 
                    className={`flex items-center justify-center space-x-1 text-sm rounded-md border hover:border-slate-950 px-3 py-1 focus-visible:outline-none h-8 shadow-sm transition-colors`}
                    onClick={() => { setLimitDropdownOpen(!limitDropdownOpen) }}
                  >
                    <span>{rowsPerPage}</span>
                    <ChevronDown className={limitDropdownOpen ? 'w-4 rotate-180' : 'w-4'} />
                  </button>
                  
                  <div className={`absolute bottom-full left-0 pb-2 ${!limitDropdownOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} shadow-sm`}>
                    <div className={`w-max min-w-40 ${!limitDropdownOpen ? ' opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-100 ease-linear delay-100 border border-slate-200 bg-white rounded-md overflow-clip p-1`}>
                      <ul className="grid">
                        {Array.from({ length: 5 }, (_, i) => {
                          const num = (i + 1) * 5;
                          return (
                            <li key={i}>
                              <button 
                                type="button" 
                                className={`inline-flex items-center justify-between w-full text-sm rounded-md py-1.5 px-3 text-slate-950 hover:bg-slate-50 transition-colors duration-200 ease-linear text-left`}
                                onClick={() => {
                                  setPage(1);
                                  setRowsPerPage(num);
                                  setLimitDropdownOpen(false);
                                }}
                              >
                                <span>{num}</span>
                                {rowsPerPage === num && <Check className="w-4" />}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
                <span>por página</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 disabled:hover:border-inherit disabled:opacity-50 border transition-colors focus-visible:outline-none space-x-1"
                  onClick={() => { setPage(page - 1) }}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4" />
                </button>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white hover:border-slate-950 disabled:hover:border-inherit disabled:opacity-50 border transition-colors focus-visible:outline-none space-x-1"
                  onClick={() => { setPage(page + 1) }}
                  disabled={page === Math.ceil(totalUsers / rowsPerPage)}
                >
                  <ChevronRight className="w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="text-base font-normal text-slate-600">Não existem usuários registrados.</p>
        </div>
      )}     
    </div>
  );
}