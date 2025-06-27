import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../lib/api";
import { Calendar, Phone } from "lucide-react";
import { LoadingSpinner } from "./common/LoadingSpinner";
import { useTranslation } from "../context/TranslationContext";
import { getOnDutyStaff, getOnDutyDate, OnDutyStaff } from "../lib/api/on-duty";

export function Login() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState("azjp");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onDutyStaff, setOnDutyStaff] = useState<OnDutyStaff | null>(null);
  const [isLoadingOnDuty, setIsLoadingOnDuty] = useState(true);

  useEffect(() => {
    const fetchOnDutyStaff = async () => {
      try {
        setIsLoadingOnDuty(true);
        // Get the appropriate date for on-duty lookup
        const onDutyDate = getOnDutyDate();
        const staffData = await getOnDutyStaff(site, onDutyDate);
        setOnDutyStaff(staffData);
      } catch (error) {
        console.error("Failed to fetch on-duty staff:", error);
      } finally {
        setIsLoadingOnDuty(false);
      }
    };

    fetchOnDutyStaff();
  }, [site]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const { token } = await login(email, password, site);
      localStorage.setItem("userEmail", email);
      setAuth(token);
      navigate("/");
    } catch (err) {
      setError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8"
      data-tsx-id="login"
    >
      {/* On-duty staff display */}
      <div className="w-full max-w-md mb-8 bg-white shadow-sm rounded-lg p-4 flex items-center justify-center">
        {isLoadingOnDuty ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-zinc-500">{t('common.loading')}</span>
          </div>
        ) : onDutyStaff ? (
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">{t('calendar.onDuty')}</p>
              <p className="font-medium text-zinc-900">{onDutyStaff.name}</p>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">{t('calendar.noOnDutyStaff')}</p>
        )}
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
            {t('auth.signInToAccount')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.email')}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.password')}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="site" className="sr-only">
                {t('auth.site')}
              </label>
              <input
                id="site"
                name="site"
                type="text"
                required
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('auth.site')}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{t('auth.signingIn')}</span>
                </div>
              ) : (
                t('auth.signIn')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}