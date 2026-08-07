import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.me,
    enabled: !!user,
  });

  if (isLoading) return <div className={styles.page}><div className={styles.loading}>Loading profile...</div></div>;
  if (error) return <div className={styles.page}><div className={styles.error}>Failed to load profile.</div></div>;

  return (
    <div className={styles.page}>
      <h1>Your Profile</h1>
      <div className={styles.card}>
        <div className={styles.profileField}>
          <label>Name</label>
          <p>{profile?.firstName} {profile?.lastName}</p>
        </div>
        <div className={styles.profileField}>
          <label>Email</label>
          <p>{profile?.email}</p>
        </div>
        <div className={styles.profileField}>
          <label>Phone</label>
          <p>{profile?.phone || 'Not set'}</p>
        </div>
        <div className={styles.profileField}>
          <label>Status</label>
          <p>{profile?.status}</p>
        </div>
        <div className={styles.profileField}>
          <label>Roles</label>
          <p>{profile?.roles.join(', ')}</p>
        </div>
      </div>
    </div>
  );
}