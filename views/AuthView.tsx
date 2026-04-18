import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthView: React.FC = () => {
  const { login } = useAuth();
  const [role, setRole] = useState<'admin' | 'operator' | 'rider'>('admin');
  const [storeId, setStoreId] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: 'user-1',
      name: role === 'admin' ? 'Admin User' : role === 'operator' ? 'Operator User' : 'Rider User',
      email: role === 'admin' ? 'admin@yana.com' : role === 'operator' ? 'operator@yana.com' : 'rider@yana.com',
      role,
      storeId: role !== 'admin' && storeId ? storeId : undefined
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Yana
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="rider">Rider</option>
              </select>
            </div>

            {role !== 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Store ID (Optional)
                </label>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g. store-1"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
