import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login } from "../lib/api";
import { Calendar, Phone, LogIn } from "lucide-react";
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
  const [showMobile, setShowMobile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      className="min-h-screen flex flex-col items-center justify-center bg-zinc-50"
      data-tsx-id="login"
    >
      {/* On-duty staff display */}
      <div className="w-full max-w-md mb-4 bg-white shadow-sm rounded-lg p-4 flex items-center justify-center">
        <div className="flex items-center space-x-3 min-h-[56px] w-full">
          <button
            type="button"
            className="bg-blue-100 p-2 rounded-full focus:outline-none flex-shrink-0"
            onClick={() => setShowMobile(true)}
            title={t('calendar.showMobile')}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Phone className="h-5 w-5 text-blue-600" />
          </button>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-zinc-500">{t('calendar.onDuty')}</p>
            <p className="font-medium text-zinc-900">{onDutyStaff ? onDutyStaff.name : ""}</p>
          </div>
          {/* Popup for mobile */}
          {showMobile && onDutyStaff?.mobile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center">
                <p className="text-lg font-semibold mb-2">{onDutyStaff.name}</p>
                <p className="text-zinc-700 text-xl mb-4">{onDutyStaff.mobile}</p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => setShowMobile(false)}
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Login modal trigger */}
      <div className="w-full max-w-md mb-8 bg-white shadow-sm rounded-lg p-4 flex items-center justify-center">
        <div className="flex items-center space-x-3 min-h-[56px] w-full">
          <button
            type="button"
            className="bg-blue-100 p-2 rounded-full focus:outline-none flex-shrink-0"
            onClick={() => setShowLoginModal(true)}
            title={t('auth.signInToAccount')}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <LogIn className="h-5 w-5 text-blue-600" />
          </button>
          <div className="flex flex-col justify-center">
            <p className="text-sm text-zinc-500">{t('auth.signInToAccount')}</p>
            <p className="font-medium text-zinc-900">{t('auth.loginSection')}</p>
          </div>
        </div>
        {/* Modal for login */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center w-full max-w-md">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-center text-2xl font-bold text-zinc-900 mb-4">
                {t('auth.signInToAccount')}
              </h2>
              <form className="w-full space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}
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
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t('auth.site')}
                    disabled={isLoading}
                  />
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
              <button
                className="mt-4 px-4 py-2 bg-zinc-200 text-zinc-700 rounded hover:bg-zinc-300"
                onClick={() => setShowLoginModal(false)}
                type="button"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}