import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, UserX, UserCheck, AlertTriangle, Users, Shield } from 'lucide-react';
import UserType from '@/types/user';

interface UserManagementTabProps {
  onRefresh?: () => void;
}

interface CreateUserFormData {
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'user';
  super_admin: boolean;
  phone?: string;
}

interface EditUserFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  super_admin: boolean;
}

export default function UserManagementTab({ onRefresh }: UserManagementTabProps) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<CreateUserFormData>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin',
    super_admin: false,
    phone: ''
  });
  const [editFormData, setEditFormData] = useState<EditUserFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    status: 'ACTIVE',
    super_admin: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string | { message: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  const getErrorMessage = (error: string | { message: string } | undefined): string => {
    if (!error) return '';
    if (typeof error === 'string') return error;
    return error.message;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users?role=admin', {
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data.users || []);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        },
        body: JSON.stringify({
          ...formData,
          customer_id: `ADM_${Date.now()}`,
          status: 'active',
          register_completed: 1
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'admin',
          super_admin: false,
          phone: ''
        });
        setError('');
        fetchUsers();
        onRefresh?.();
      } else {
        setFormErrors(data.errors || {});
      }
    } catch (err) {
      setError('Erro ao criar usuário');
      console.error('Error creating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        if (response.ok) {
          setShowDeleteModal(false);
          setSelectedUser(null);
          fetchUsers();
          onRefresh?.();
          return;
        } else {
          throw new Error('Resposta inválida do servidor');
        }
      }

      if (response.ok && (data.success || data.sucess)) { // Aceitar ambas as grafias por compatibilidade
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers();
        onRefresh?.();
      } else {
        const errorMessage = data?.errors?.global?.message || 'Erro ao deletar usuário';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erro ao deletar usuário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormErrors({});
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          phone: editFormData.phone,
          status: editFormData.status,
          super_admin: editFormData.super_admin ? 1 : 0
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        setError(''); // Limpar erros após sucesso
        fetchUsers();
        onRefresh?.();
      } else {
        setFormErrors(data.errors || {});
        if (data.errors?.global?.message) {
          setError(data.errors.global.message);
        }
      }
    } catch (err) {
      setError('Erro ao atualizar usuário');
      console.error('Error updating user.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setEditFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      status: user.status?.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
      super_admin: user.super_admin === 1
    });
    setFormErrors({});
    setError('');
    setShowEditModal(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gerenciar Usuários</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie usuários administradores do sistema
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Administrador
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando usuários...</span>
          </div>
        ) : (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando um novo usuário administrador.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Papel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Criado em</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.super_admin === 1
                              ? 'bg-yellow-100 text-yellow-800' 
                              : user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.super_admin === 1
                              ? 'Super Admin' 
                              : user.role === 'admin' 
                              ? 'Administrador' 
                              : 'Usuário'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status?.toUpperCase() === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : user.status?.toUpperCase() === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status?.toUpperCase() === 'ACTIVE' 
                              ? 'Ativo' 
                              : user.status?.toUpperCase() === 'SUSPENDED' 
                              ? 'Suspenso' 
                              : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar usuário"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deletar usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Criar Novo Administrador</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cadastre um novo usuário com privilégios de administrador
            </p>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formErrors.first_name && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.first_name)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobrenome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formErrors.last_name && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.last_name)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.email)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.phone)}</p>
                )}
              </div>

              {/* Campo Super Admin */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Super Administrador
                    </label>
                    <p className="text-xs text-gray-600">
                      Permite gerenciar outros usuários administradores
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.super_admin}
                    onChange={(e) => setFormData({ ...formData, super_admin: e.target.checked })}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Informação sobre o papel */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm text-blue-700">
                      Este usuário será criado com privilégios de <strong>{formData.super_admin ? 'Super Administrador' : 'Administrador'}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      first_name: '',
                      last_name: '',
                      email: '',
                      role: 'admin',
                      super_admin: false,
                      phone: ''
                    });
                    setFormErrors({});
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Editar Usuário</h3>
            <p className="text-sm text-gray-600 mb-4">
              Altere as informações do usuário <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>
            </p>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formErrors.first_name && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.first_name)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobrenome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                {formErrors.last_name && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.last_name)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(11) 99999-9999"
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{getErrorMessage(formErrors.phone)}</p>
                )}
              </div>

              {/* Status do Usuário */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Status do Usuário
                </label>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      editFormData.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {editFormData.status === 'ACTIVE' ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {editFormData.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
                      </span>
                      <p className="text-xs text-gray-600">
                        {editFormData.status === 'ACTIVE' 
                          ? 'Usuário pode acessar o sistema' 
                          : 'Usuário não pode acessar o sistema'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setEditFormData({ 
                        ...editFormData, 
                        status: editFormData.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                      })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                        editFormData.status === 'ACTIVE' ? 'bg-green-600' : 'bg-red-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          editFormData.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Campo Super Admin */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Super Administrador
                    </label>
                    <p className="text-xs text-gray-600">
                      Permite gerenciar outros usuários administradores
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editFormData.super_admin}
                    onChange={(e) => setEditFormData({ ...editFormData, super_admin: e.target.checked })}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Mostrar erro se houver */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex">
                    <AlertTriangle className="h-4 w-4 text-red-400 mr-2 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    setFormErrors({});
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Tem certeza que deseja excluir o usuário <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>?
              Todos os dados associados a este usuário serão permanentemente removidos.
            </p>

            {/* Mostrar erro se houver */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <AlertTriangle className="h-4 w-4 text-red-400 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                  setError(''); // Limpar erro ao fechar
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
