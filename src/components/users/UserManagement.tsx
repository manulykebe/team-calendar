import { useState } from "react";
import { UserList } from "./UserList";
import { UserModal } from "./UserModal";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { User } from "../../types/user";
import { X } from "lucide-react";

interface UserManagementProps {
  onClose: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
  };

  const handleDelete = (user: User) => {
    setDeleteUser(user);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-zinc-900">
            User Management
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <UserList onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {selectedUser && (
        <UserModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {deleteUser && (
        <DeleteConfirmation
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
        />
      )}
    </div>
  );
}