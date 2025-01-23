import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Login } from "./components/Login";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

function PrivateRoute({ children }: { children: React.ReactNode }) {
	const { token } = useAuth();
	return token ? (
		<div data-tsx-id="private-route">{children}</div>
	) : (
		<Navigate to="/login" />
	);
}

function App() {
	return (
		<Router
			future={{
				v7_relativeSplatPath: true,
				v7_startTransition: true,
			}}
		>
			<AuthProvider>
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
					</Routes>
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
			</AuthProvider>
		</Router>
	);
}

export default App;
