import { useState } from "react";
import User from "@/types/user";
import DocumentRequestForm from "./document-request-form";
import DocumentRequestsList from "./document-requests-list";
import { MessageSquare, Plus } from "lucide-react";

interface Props {
  user: User;
}

export default function DocumentRequestsTab({ user }: Props) {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRequestCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Minhas Solicitações</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nova Solicitação</span>
            </div>
          </button>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div>
        {activeTab === 'list' && (
          <DocumentRequestsList user={user} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'new' && (
          <DocumentRequestForm user={user} onSuccess={handleRequestCreated} />
        )}
      </div>
    </div>
  );
}