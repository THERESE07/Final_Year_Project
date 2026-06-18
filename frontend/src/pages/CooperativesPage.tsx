import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, MapPin, Users, Phone } from 'lucide-react';
import { cooperativesAPI } from '../api/client';

const CooperativesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['cooperatives', page, search],
    queryFn: () => cooperativesAPI.getAll({ page, limit: 9, search }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cooperatives</h1>
        <p className="text-sm text-gray-500">Manage agricultural cooperatives and their members</p>
      </div>

      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search cooperatives..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
        </div>
      ) : data?.data?.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p>No cooperatives found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.data?.map((coop: any) => (
            <div key={coop.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{coop.name}</h3>
                  {coop.registration_number && <p className="text-xs text-gray-400">Reg: {coop.registration_number}</p>}
                </div>
                <span className={coop.status === 'active' ? 'badge-active' : 'badge-suspended'}>{coop.status}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  <span>{[coop.sector, coop.district, coop.province].filter(Boolean).join(', ')}</span>
                </div>
                {coop.contact_phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} className="text-gray-400" />
                    <span>{coop.contact_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users size={14} className="text-gray-400" />
                  <span>{coop.farmer_count || 0} farmers</span>
                </div>
              </div>

              {coop.manager_name && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Manager</p>
                  <p className="text-sm font-medium text-gray-700">{coop.manager_name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50 text-sm">Next</button>
        </div>
      )}
    </div>
  );
};

export default CooperativesPage;
