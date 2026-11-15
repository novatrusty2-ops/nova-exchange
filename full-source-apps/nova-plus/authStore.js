// Nova Plus Persistent Auth Store (Sign in once until explicit sign out)
export const AuthManager = {
    getSession() {
        const session = localStorage.getItem('nova_plus_session');
        return session ? JSON.parse(session) : null;
    },
    saveSession(address, token) {
        localStorage.setItem('nova_plus_session', JSON.stringify({ address, token, time: new Date().toISOString() }));
    },
    clearSession() {
        localStorage.removeItem('nova_plus_session');
    }
};
