import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { UserModal } from './UserModal';
import { UserTable } from './UserTable';
import api from '../../api/axios';

interface User {
  id: string;
  login: string;
  email: string;
  sites: string[];
  roles: string[];
  isDeleted?: boolean;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'update'>('create');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setModalMode('update');
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isDeleted: true } : user
      ));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleSubmit = async (userData: Omit<User, 'id'>) => {
    try {
      if (modalMode === 'create') {
        const response = await api.post('/api/users', userData);
        setUsers([...users, response.data]);
      } else if (selectedUser) {
        const response = await api.put(`/api/users/${selectedUser.id}`, userData);
        setUsers(users.map(user => 
          user.id === selectedUser.id ? response.data : user
        ));
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleCreateUser}
        className="flex items-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        <UserPlus className="w-4 h-4" />
        <span>Add New User</span>
      </button>

      <UserTable
        users={users}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={selectedUser}
        mode={modalMode}
      />
    </div>
  );
};