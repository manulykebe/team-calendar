import { useState } from "react";
import { UserList } from "./UserList";
import { UserModal } from "./UserModal";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { User } from "../../types/user";

interface UserManagementProps {
	onClose?: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [deleteUser, setDeleteUser] = useState<User | null>(null);

	const handleEdit = (user: User) => {
		setSelectedUser(user);
	};

	const handleDelete = (user: User) => {
		setDeleteUser(user);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		onClose?.();
	};

	return (
		<div data-tsx-id="user-management">
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
						<div className="flex justify-between items-center p-6 border-b">
							<h2 className="text-2xl font-semibold text-zinc-900">
								User Management
							</h2>
							<button
								onClick={handleCloseModal}
								className="text-zinc-400 hover:text-zinc-500"
							>
								<span className="sr-only">Close</span>
								<svg
									className="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

						<UserList onEdit={handleEdit} onDelete={handleDelete} />
					</div>
				</div>
			)}

			{selectedUser && (
				<UserModal
					user={selectedUser}
					onClose={() => setSelectedUser(null)}
				/>
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
