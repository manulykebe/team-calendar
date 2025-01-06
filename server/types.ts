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

export interface Event {
	type: string;
	id: string;
	userId: string;
	title: string;
	description: string;
	date: string;
	endDate?: string;
	createdAt: string;
	updatedAt: string;
}
