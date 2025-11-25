import CryptoJS from "crypto-js";
const SECRET_KEY = "U2FsdGVkX18mD/KhN50T2qd+nKeN";

class AuthService {
  login(token: string, user: { name: string; username: any, email: string, id: number, role: string }): void {
    const encryptedToken = CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
    const encryptedUser = CryptoJS.AES.encrypt(JSON.stringify(user), SECRET_KEY).toString();

    localStorage.setItem("authToken", encryptedToken);
    localStorage.setItem("user", encryptedUser);
  }

  logout(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    const encryptedToken = localStorage.getItem("authToken");
    if (!encryptedToken) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8) || null;
    } catch (error) {
      return null;
    }
  }

  getUser(): { name: string; email: string, id: number, role: string } | null {
    const encryptedUser = localStorage.getItem("user");
    if (!encryptedUser) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedUser, SECRET_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();