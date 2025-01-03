import React, { useState } from 'react';
import { User } from '../../types/user';
import { UserForm } from './UserForm';
import { UserList } from './UserList';
import { useAuth } from '../../context/AuthContext';
import users from '../../data/users.json';

export function UserManagement() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => setSelectedUser(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New User
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UserList users={users.users} onSelectUser={setSelectedUser} />
        <UserForm user={selectedUser} />
      </div>
    </div>
  );
}