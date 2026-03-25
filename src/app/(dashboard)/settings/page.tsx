"use client";

import { useCurrentUser } from "@/hooks/use-current-user";

export default function SettingsPage() {
  const { user } = useCurrentUser();

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Email</label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Member since</label>
          <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
