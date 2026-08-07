import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import styles from './CustomerLayout.module.css';

export default function CustomerLayout() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>ShopPlatform</Link>
          <nav className={styles.nav}>
            <Link to="/">Products</Link>
            {isAuthenticated && (
              <>
                <Link to="/cart">Cart</Link>
                <Link to="/wishlist">Wishlist</Link>
                <Link to="/favorites">Favorites</Link>
                <Link to="/profile">Profile</Link>
                <button onClick={logout}>Logout</button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
            <button onClick={toggleTheme}>{theme === 'light' ? 'Dark' : 'Light'}</button>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>© 2024 ShopPlatform. All rights reserved.</p>
      </footer>
    </div>
  );
}