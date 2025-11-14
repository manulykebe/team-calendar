import { useState } from "react";
import { X, Lock } from "lucide-react";
import { useTranslation } from "../../context/TranslationContext";
import { LoadingSpinner } from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { changePassword } from "../../lib/api/auth";

interface PasswordChangeModalProps {
  onClose: () => void;
  forceChange?: boolean;
}

export function PasswordChangeModal({ onClose, forceChange = false }: PasswordChangeModalProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t('auth.passwordChanged'));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.passwordChangeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-full mr-3">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">
            {forceChange ? t('auth.mustChangePassword') : t('auth.changePassword')}
          </h2>
        </div>
        {!forceChange && (
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {forceChange && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            {t('auth.mustChangePasswordMessage')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-zinc-700 mb-1">
            {t('auth.currentPassword')}
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('auth.currentPassword')}
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-zinc-700 mb-1">
            {t('auth.newPassword')}
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('auth.newPassword')}
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-700 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('auth.confirmPassword')}
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          {!forceChange && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">{t('common.saving')}</span>
              </>
            ) : (
              t('auth.changePassword')
            )}
          </button>
        </div>
      </form>
      </>
  );
}
