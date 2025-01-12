import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { deleteUser } from "../../lib/api";
import { User } from "../../types/user";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationProps {
	user: User;
	onClose: () => void;
}

export function DeleteConfirmation({ user, onClose }: DeleteConfirmationProps) {
	const { token } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleDelete = async () => {
		try {
			setLoading(true);
			await deleteUser(token!, user.id);
			onClose();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to delete user"
			);
		} finally {
			setLoading(false);
		}
	};

	return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" data-tsx-id="delete-confirmation">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
				<div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
					<AlertTriangle className="h-6 w-6 text-red-600" />
				</div>

				<div className="mt-3 text-center">
					<h3 className="text-lg font-medium text-zinc-900">
						Delete User
					</h3>
					<div className="mt-2">
						<p className="text-sm text-zinc-500">
							Are you sure you want to delete {user.firstName}{" "}
							{user.lastName}? This action cannot be undone.
						</p>
					</div>

					{error && (
						<div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded">
							{error}
						</div>
					)}

					<div className="mt-4 flex justify-center space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 border border-zinc-300 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50"
							disabled={loading}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDelete}
							disabled={loading}
							className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
						>
							{loading ? "Deleting..." : "Delete"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
