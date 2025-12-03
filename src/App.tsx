import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Login } from "./components/Login";
import DatabaseQuery from "./components/DatabaseQuery";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { TranslationProvider } from "./context/TranslationContext";
import { HolidayProvider } from "./context/HolidayContext";
import { VersionDisplay } from "./components/common/VersionDisplay";
import { Toaster } from "react-hot-toast";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <div data-tsx-id="private-route">{children}</div>;
}

function App() {
  return (
    <TranslationProvider>
      <Router
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <AuthProvider>
          <AppProvider>
            <WebSocketProvider>
              <HolidayProvider>
                <div className="min-h-screen bg-zinc-50" data-tsx-id="app-root">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <PrivateRoute>
                          <Calendar />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/database"
                      element={
                        <PrivateRoute>
                          <DatabaseQuery />
                        </PrivateRoute>
                      }
                    />
                  </Routes>
                  <VersionDisplay />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: "#333",
                        color: "#fff",
                      },
                      success: {
                        style: {
                          background: "#059669",
                        },
                      },
                      error: {
                        style: {
                          background: "#DC2626",
                        },
                        duration: 4000,
                      },
                    }}
                  />
                </div>
              </HolidayProvider>
            </WebSocketProvider>
          </AppProvider>
        </AuthProvider>
      </Router>
    </TranslationProvider>
  );
}

export default App;