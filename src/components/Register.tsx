import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register } from "../lib/api";
import { Calendar } from "lucide-react";

export function Register() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		mobile: "",
		password: "",
		site: "azjp",
	});
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const { token } = await register(formData);
			login(token);
			navigate("/");
		} catch (err) {
			setError("Registration failed");
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8" data-tsx-id="register">
			<div className="max-w-md w-full space-y-8">
				<div>
					<div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
						<Calendar className="h-8 w-8 text-blue-600" />
					</div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
						Create your account
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
							<input
								name="firstName"
								type="text"
								required
								value={formData.firstName}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="First Name"
							/>
						</div>
						<div>
							<input
								name="lastName"
								type="text"
								required
								value={formData.lastName}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Last Name"
							/>
						</div>
						<div>
							<input
								name="email"
								type="email"
								required
								value={formData.email}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
							/>
						</div>
						<div>
							<input
								name="mobile"
								type="tel"
								required
								value={formData.mobile}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Mobile number"
							/>
						</div>
						<div>
							<input
								name="password"
								type="password"
								required
								value={formData.password}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Password"
							/>
						</div>
						<div>
							<input
								name="site"
								type="text"
								required
								value={formData.site}
								onChange={handleChange}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-zinc-300 placeholder-zinc-500 text-zinc-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
								placeholder="Site"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Register
						</button>
					</div>

					<div className="text-sm text-center">
						<Link
							to="/login"
							className="font-medium text-blue-600 hover:text-blue-500"
						>
							Already have an account? Sign in
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
