export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	mobile: string;
	password: string;
	site: string;
	role: "admin" | "user";
	createdAt: string;
	updatedAt: string;
}
