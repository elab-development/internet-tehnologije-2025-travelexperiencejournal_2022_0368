'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { Shield, UserX, UserCheck, Users } from 'lucide-react';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: 'Korisnik',
  [UserRole.EDITOR]: 'Editor',
  [UserRole.ADMIN]: 'Administrator',
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.USER]: 'bg-gray-100 text-gray-700',
  [UserRole.EDITOR]: 'bg-blue-100 text-blue-700',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== UserRole.ADMIN) {
      router.replace('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, status]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlock(uid: string) {
    setActionInProgress(uid);
    try {
      const res = await fetch(`/api/admin/users/${uid}/block`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isBlocked: true } : u)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleUnblock(uid: string) {
    setActionInProgress(uid);
    try {
      const res = await fetch(`/api/admin/users/${uid}/block`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, isBlocked: false } : u)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionInProgress(null);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-gray-500">Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin panel</h1>
          <p className="text-gray-500">Upravljanje korisnicima</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Korisnici ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Korisnik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uloga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const isSelf = user.uid === session?.user?.id;
                const isAnotherAdmin = user.role === UserRole.ADMIN;
                const canAct = !isSelf && !isAnotherAdmin;
                const busy = actionInProgress === user.uid;

                return (
                  <tr key={user.uid} className={user.isBlocked ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{user.displayName}</span>
                        {isSelf && (
                          <span className="text-xs text-gray-400">(vi)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                          <UserX className="w-3 h-3" />
                          Blokiran
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          <UserCheck className="w-3 h-3" />
                          Aktivan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canAct ? (
                        user.isBlocked ? (
                          <button
                            onClick={() => handleUnblock(user.uid)}
                            disabled={busy}
                            className="text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                          >
                            {busy ? 'Čekanje...' : 'Odblokiraj'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlock(user.uid)}
                            disabled={busy}
                            className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            {busy ? 'Čekanje...' : 'Blokiraj'}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
