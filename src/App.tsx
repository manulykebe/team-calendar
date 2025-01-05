import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Calendar } from "./components/Calendar";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { AuthProvider, useAuth } from "./context/AuthContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
	const { token } = useAuth();
	return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
	return (
		<AuthProvider>
			<Router>
				<div className="min-h-screen bg-zinc-50">
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route
							path="/"
							element={
								<PrivateRoute>
									<Calendar />
								</PrivateRoute>
							}
						/>
					</Routes>
				</div>
			</Router>
		</AuthProvider>
	);
}

export default App;
