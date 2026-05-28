import { Users } from 'lucide-react';

export default function AdminUsers({ token }: { token: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="p-4 bg-cyan-500/10 rounded-full">
        <Users size={48} className="text-cyan-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">User Management</h2>
      <p className="text-gray-400 max-w-md">
        This feature is under development. User analytics, blocking, and manual intervention will be available here soon.
      </p>
    </div>
  );
}
