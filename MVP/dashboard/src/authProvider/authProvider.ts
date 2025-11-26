import { jwtDecode } from "jwt-decode";
interface JwtPayload {
    exp: number;
    [key: string]: any;
}

export const authProvider = {
    login: async ({ email, password }: { email: string; password: string }) => {
        const request = new Request('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });

        const response = await fetch(request);

        console.log(response);

        if (!response.ok) {
            throw new Error('Credenciais inválidas');
        }

        const { access_token, user } = await response.json();

        localStorage.setItem('authToken', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        return Promise.resolve();
    },

    logout: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return Promise.resolve();
    },

    checkAuth: () => {
        const token = localStorage.getItem("authToken");

        if (!token) return Promise.reject();

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            const isExpired = decoded.exp * 1000 < Date.now();
            if (isExpired) {
                localStorage.removeItem("authToken");
                return Promise.reject(); // força logout
            }
            return Promise.resolve(); // token válido
        } catch (error) {
            localStorage.removeItem("authToken");
            return Promise.reject();
        }
    },

    checkError: (error: any) => {
        if (error.status === 401 || error.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            return Promise.reject();
        }
        return Promise.resolve();
    },

    getPermissions: () => Promise.resolve(),
};
