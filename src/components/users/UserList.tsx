import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUsers } from "../../lib/api";
import { User, UserFilters, SortConfig } from "../../types/user";
import { UserListFilters } from "./UserListFilters";
import { Loader2, ArrowUpDown } from "lucide-react";

interface UserListProps {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserList({ onEdit, onDelete }: UserListProps) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<UserFilters>({ search: "" });
  const [sort, setSort] = useState<SortConfig>({
    key: "lastName",
    direction: "asc",
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers(token!);
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter((user) => {
      const searchMatch =
        !filters.search ||
        `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const roleMatch = !filters.role || user.role === filters.role;
      const statusMatch = !filters.status || user.status === filters.status;

      return searchMatch && roleMatch && statusMatch;
    })
    .sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      return sort.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleSort = (key: keyof User) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full" data-tsx-id="user-list">
      <UserListFilters filters={filters} onChange={setFilters} />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              {[
                "First Name",
                "Last Name",
                "Email",
                "Role",
                "Status",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
                >
                  <button
                    className="flex items-center space-x-1 hover:text-zinc-700"
                    onClick={() =>
                      handleSort(
                        header.toLowerCase().replace(" ", "") as keyof User,
                      )
                    }
                    disabled={header === "Actions"}
                  >
                    <span>{header}</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-200">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.firstName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
