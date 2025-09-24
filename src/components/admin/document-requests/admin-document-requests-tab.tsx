import { useState } from "react";
import AdminDocumentRequestsList from "./admin-document-requests-list";
import { FileText, RefreshCw, Filter, X, CalendarArrowDown, CalendarArrowUp } from "lucide-react";
import User from "@/types/user";

interface FilterState {
  status: string;
  sortBy: 'newest' | 'oldest';
  clientName: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  currentAdmin: User;
}

export default function AdminDocumentRequestsTab({ currentAdmin }: Props) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    sortBy: 'newest',
    clientName: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      sortBy: 'newest',
      clientName: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-2xl font-bold">Solicitações de Documentos</h2>
            </div>
            <p className="text-gray-500">
              Gerencie e responda às solicitações de documentos dos clientes.
            </p>
          </div>
          
          {/* Botões de controle */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg transition-colors flex-1 md:flex-initial justify-center ${
                showFilters 
                  ? 'bg-blue-50 border-blue-500 text-blue-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            <button
              onClick={() => {
                const newSortBy = filters.sortBy === 'newest' ? 'oldest' : 'newest';
                handleFiltersChange({ ...filters, sortBy: newSortBy });
              }}
              className="flex items-center space-x-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors flex-1 md:flex-initial md:min-w-[145px] justify-center"
            >
              {filters.sortBy === 'newest' ? (
                <CalendarArrowDown className="w-4 h-4" />
              ) : (
                <CalendarArrowUp className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {filters.sortBy === 'newest' ? 'Mais Recentes' : 'Mais Antigos'}
              </span>
              <span className="md:hidden">
                {filters.sortBy === 'newest' ? 'Recentes' : 'Antigos'}
              </span>
            </button>
            
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center w-[38px] h-[38px] md:w-auto md:h-auto md:px-3 md:py-2 md:space-x-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Atualizar</span>
            </button>
          </div>
        </div>
        
        {/* Filtros expansíveis */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFiltersChange({ ...filters, status: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="completed">Aprovada</option>
                  <option value="rejected">Rejeitada</option>
                </select>
              </div>

              {/* Filtro por Nome do Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={filters.clientName}
                  onChange={(e) => handleFiltersChange({ ...filters, clientName: e.target.value })}
                  placeholder="Buscar por nome..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Filtro por Data Inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFiltersChange({ ...filters, dateFrom: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Filtro por Data Final */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFiltersChange({ ...filters, dateTo: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Botão para limpar filtros */}
            {(filters.status !== 'all' || filters.clientName || filters.dateFrom || filters.dateTo) && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar filtros</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de solicitações */}
      <AdminDocumentRequestsList 
        refreshTrigger={refreshTrigger} 
        currentAdmin={currentAdmin}
        filters={filters}
      />
    </div>
  );
}