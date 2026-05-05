import AppConfig from '../core/config.js';
import { store } from '../store/index.js';
import { AuthActions } from '../store/actions.js';

class AuthService {
  constructor() {
    this.clerk = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit();
    return this.initPromise;
  }

  async _doInit() {
    if (this.isInitialized) return;

    const key = AppConfig.CLERK_PUBLISHABLE_KEY;
    if (!key || key === 'pk_test_placeholder') {
      console.warn('[AuthService] No Clerk key. Running in demo mode.');
      AuthActions.setLoading(false);
      this.isInitialized = true;
      return;
    }

    try {
      await this._waitForClerkScript(10000);
      this.clerk = window.Clerk;

      if (!this.clerk) {
        throw new Error('Clerk SDK not available');
      }

      await this.clerk.load({ publishableKey: key });

      this.clerk.addListener(({ user }) => {
        if (user) {
          this._syncUser(user);
        } else {
          AuthActions.logout();
        }
      });

      if (this.clerk.user) {
        this._syncUser(this.clerk.user);
      } else {
        AuthActions.setLoading(false);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('[AuthService] Clerk init failed, demo mode:', error.message);
      AuthActions.setLoading(false);
      this.isInitialized = true;
    }
  }

  _waitForClerkScript(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (window.Clerk) {
        resolve();
        return;
      }
      const start = Date.now();
      const check = () => {
        if (window.Clerk) {
          resolve();
        } else if (Date.now() - start > timeout) {
          reject(new Error('Clerk script load timeout'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  async _syncUser(clerkUser) {
    try {
      const token = await clerkUser.getToken();
      const user = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt,
      };
      AuthActions.setToken(token);
      AuthActions.setUser(user);
    } catch (e) {
      console.warn('[AuthService] Failed to sync user:', e.message);
      AuthActions.setLoading(false);
    }
  }

  async getToken() {
    if (!this.clerk?.user) return store.getState('auth.token');
    return await this.clerk.user.getToken();
  }

  async signIn({ email, password }) {
    if (this.clerk) {
      const result = await this.clerk.client.signIn.create({
        identifier: email,
        password,
      });
      if (result.status === 'complete') {
        await this.clerk.setActive({ session: result.createdSessionId });
        return { success: true };
      }
      return { success: false, status: result.status };
    }

    const res = await fetch(`${AppConfig.AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    AuthActions.setUser({
      id: 'backend-user',
      email: data.email,
      firstName: email.split('@')[0],
      lastName: '',
      fullName: email.split('@')[0],
    });
    AuthActions.setToken(data.token || 'backend-token');
    return { success: true };
  }

  async signUp({ email, password, firstName, lastName }) {
    if (this.clerk) {
      const result = await this.clerk.client.signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });
      if (result.status === 'complete') {
        await this.clerk.setActive({ session: result.createdSessionId });
        return { success: true };
      }
      if (result.status === 'missing_requirements') {
        return { success: false, status: result.status, missingFields: result.missingFields };
      }
      return { success: false, status: result.status };
    }

    const res = await fetch(`${AppConfig.AUTH_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');

    AuthActions.setUser({
      id: 'backend-user',
      email: data.email,
      firstName: firstName || email.split('@')[0],
      lastName: lastName || '',
      fullName: firstName ? `${firstName} ${lastName}` : email.split('@')[0],
    });
    AuthActions.setToken(data.token || 'backend-token');
    return { success: true };
  }

  async signInWithOAuth(provider = 'github') {
    if (this.clerk) {
      await this.clerk.client.signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: '/login/sso-callback',
        redirectUrlComplete: '/dashboard',
      });
      return;
    }

    AuthActions.setUser({
      id: 'demo-oauth',
      email: `${provider}-user@learnflow.dev`,
      firstName: provider.charAt(0).toUpperCase() + provider.slice(1),
      lastName: 'User',
      fullName: `${provider} User`,
    });
    AuthActions.setToken('oauth-token');
  }

  async signOut() {
    if (this.clerk) {
      await this.clerk.signOut();
    }
    AuthActions.logout();
  }

  isAuthenticated() {
    return !!this.clerk?.user || !!store.getState('auth.user');
  }

  getUser() {
    if (this.clerk?.user) {
      return {
        id: this.clerk.user.id,
        email: this.clerk.user.primaryEmailAddress?.emailAddress,
        firstName: this.clerk.user.firstName,
        lastName: this.clerk.user.lastName,
        fullName: this.clerk.user.fullName,
        imageUrl: this.clerk.user.imageUrl,
      };
    }
    return store.getState('auth.user');
  }

  mountSignIn(element) {
    if (this.clerk && element) this.clerk.mountSignIn(element);
  }

  mountSignUp(element) {
    if (this.clerk && element) this.clerk.mountSignUp(element);
  }

  mountUserButton(element) {
    if (this.clerk && element) this.clerk.mountUserButton(element);
  }

  mountUserProfile(element) {
    if (this.clerk && element) this.clerk.mountUserProfile(element);
  }
}

const authService = new AuthService();

export { AuthService, authService };
export default authService;
