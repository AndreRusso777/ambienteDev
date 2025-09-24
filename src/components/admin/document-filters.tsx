import React, { useState } from 'react';
import { Filter, X, Calendar, User, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Button from '../ui/shared/button';

interface FilterState {
  status: string;
  sortBy: 'newest' | 'oldest';
  clientName: string;
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export default function DocumentFilters({ filters, onFiltersChange, onClearFilters }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = filters.status !== 'all' || 
                          filters.clientName !== '' || 
                          filters.dateFrom !== '' || 
                          filters.dateTo !== '';

  return (
    <div className="bg-white border rounded-lg p-4 mb-6 space-y-4">
      {/* Header - Botões de Ação */}
      <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
        {/* Botão de Ordenação */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFilterChange('sortBy', filters.sortBy === 'newest' ? 'oldest' : 'newest')}
          className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
        >
          {filters.sortBy === 'newest' ? (
            <ArrowDown className="w-4 h-4" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
          <span className="sm:hidden">
            {filters.sortBy === 'newest' ? 'Recentes' : 'Antigos'}
          </span>
          <span className="hidden sm:inline">
            {filters.sortBy === 'newest' ? 'Mais Recentes' : 'Mais Antigos'}
          </span>
        </Button>

        {/* Botão de Filtros */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </Button>

        {/* Botão Limpar */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <X className="w-4 h-4" />
            <span>Limpar</span>
          </Button>
        )}
      </div>

      {/* Filtros Expandidos */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Aprovadas</option>
              <option value="rejected">Rejeitadas</option>
            </select>
          </div>

          {/* Nome do Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome do Cliente
            </label>
            <input
              type="text"
              value={filters.clientName}
              onChange={(e) => handleFilterChange('clientName', e.target.value)}
              placeholder="Digite o nome..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Data Inicial */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Data Final */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data Final
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <span className="text-xs text-gray-500">Filtros ativos:</span>
          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Status: {filters.status === 'pending' ? 'Pendentes' : 
                      filters.status === 'completed' ? 'Aprovadas' : 'Rejeitadas'}
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.clientName && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Cliente: {filters.clientName}
              <button
                onClick={() => handleFilterChange('clientName', '')}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              De: {new Date(filters.dateFrom).toLocaleDateString('pt-BR')}
              <button
                onClick={() => handleFilterChange('dateFrom', '')}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              Até: {new Date(filters.dateTo).toLocaleDateString('pt-BR')}
              <button
                onClick={() => handleFilterChange('dateTo', '')}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
