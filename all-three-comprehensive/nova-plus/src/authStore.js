export const NovaPlusAuthManager = {
    getSession() {
        const val = localStorage.getItem('nova_plus_session');
        return val ? JSON.parse(val) : null;
    },
    saveSession(address, token) {
        localStorage.setItem('nova_plus_session', JSON.stringify({ address, token, timestamp: new Date().toISOString() }));
    },
    clearSession() {
        localStorage.removeItem('nova_plus_session');
    }
};
