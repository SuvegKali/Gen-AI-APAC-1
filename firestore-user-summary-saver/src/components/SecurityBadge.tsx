/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Database, Lock, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface SecurityBadgeProps {
  user: User | null;
  loading: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ user, loading }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-tight">
                Tenant Isolation Enforced
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-3 h-3" /> Strict Path Guard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Path: /users/<span className="text-amber-300 font-semibold">{user ? user.uid : 'authenticating...'}</span>/summaries/*
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {loading ? (
                'Connecting...'
              ) : user ? (
                <span>
                  Auth UID: <span className="font-mono text-slate-300 font-semibold">{user.uid.slice(0, 10)}...</span>
                  {user.isAnonymous ? ' (Guest)' : ' (User)'}
                </span>
              ) : (
                'Unauthenticated'
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Firestore: <span className="font-mono text-slate-300">Default DB</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
