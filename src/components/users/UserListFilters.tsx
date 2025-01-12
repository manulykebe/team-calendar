import { UserFilters } from "../../types/user";
import { Search } from "lucide-react";

interface UserListFiltersProps {
  filters: UserFilters;
  onChange: (filters: UserFilters) => void;
}

export function UserListFilters({ filters, onChange }: UserListFiltersProps) {
  return (
    <div className="p-4 space-y-4" data-tsx-id="user-list-filters">
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md leading-5 bg-white placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <select
          value={filters.role || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              role: e.target.value as "admin" | "user" | undefined,
            })
          }
          className="block w-32 pl-3 pr-10 py-2 text-base border-zinc-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select
          value={filters.status || ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as "active" | "inactive" | undefined,
            })
          }
          className="block w-32 pl-3 pr-10 py-2 text-base border-zinc-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
