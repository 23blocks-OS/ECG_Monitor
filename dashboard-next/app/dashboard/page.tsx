/**
 * Dashboard Page (Protected)
 *
 * Main dashboard for authenticated users.
 * Displays user information and ECG monitoring interface.
 */

'use client';

import { ProtectedRoute, useAuth } from '@/components/Auth';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>ECG Monitor Dashboard</h1>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-email">{user?.email}</span>
            <button onClick={handleSignOut} className="signout-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome to ECG Monitor</h2>
          <p>Your real-time cardiac monitoring dashboard with AI-powered analysis.</p>

          <div className="user-details">
            <h3>Your Profile</h3>
            <dl>
              <dt>Name:</dt>
              <dd>{user?.name}</dd>

              <dt>Email:</dt>
              <dd>{user?.email}</dd>

              {user?.organizationId && (
                <>
                  <dt>Organization ID:</dt>
                  <dd>{user.organizationId}</dd>
                </>
              )}

              {user?.role && (
                <>
                  <dt>Role:</dt>
                  <dd>{user.role}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="status-card">
            <h3>Authentication Status</h3>
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className="status-value success">Authenticated ✓</span>
            </div>
            <div className="status-item">
              <span className="status-label">Session:</span>
              <span className="status-value">Active</span>
            </div>
          </div>

          <div className="quick-links">
            <h3>Quick Links</h3>
            <div className="links-grid">
              <a href="/dashboard/activities" className="link-card">
                <h4>📊 Activity Tracking</h4>
                <p>Upload and view your Garmin and Strava activities</p>
              </a>
              <a href="/dashboard/export" className="link-card">
                <h4>📥 Export Data</h4>
                <p>Download your ECG data to share with your doctor</p>
              </a>
              <a href="/dashboard/activity-map" className="link-card">
                <h4>🗺️ Activity Map</h4>
                <p>View your activities on an interactive map</p>
              </a>
            </div>
          </div>

          <div className="info-box">
            <h4>🚧 Dashboard Under Construction</h4>
            <p>
              This is a placeholder dashboard demonstrating authentication integration.
              The full ECG monitoring interface will be integrated here.
            </p>
            <ul>
              <li>Real-time ECG waveform display</li>
              <li>AI-powered analysis insights</li>
              <li>Alert notifications</li>
              <li>Historical data review</li>
              <li>Multi-device management</li>
            </ul>
          </div>
        </div>
      </main>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f5f5f5;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #ddd;
          padding: 1.5rem 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-name {
          font-weight: 600;
          color: #333;
        }

        .user-email {
          color: #666;
          font-size: 0.9rem;
        }

        .signout-button {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .signout-button:hover {
          background: #c82333;
        }

        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .welcome-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h2 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .welcome-card > p {
          margin: 0 0 2rem 0;
          color: #666;
        }

        .user-details,
        .status-card,
        .quick-links,
        .info-box {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .link-card {
          display: block;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          border: 2px solid #e0e0e0;
          transition: all 0.2s;
        }

        .link-card:hover {
          border-color: #0066cc;
          box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
          transform: translateY(-2px);
        }

        .link-card h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        .link-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        h3 {
          margin: 0 0 1rem 0;
          color: #333;
          font-size: 1.1rem;
        }

        h4 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.75rem;
          margin: 0;
        }

        dt {
          font-weight: 600;
          color: #555;
        }

        dd {
          margin: 0;
          color: #333;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .status-label {
          font-weight: 600;
          color: #555;
        }

        .status-value {
          color: #333;
        }

        .status-value.success {
          color: #28a745;
          font-weight: 600;
        }

        .info-box {
          background: #e7f3ff;
          border-left: 4px solid #0066cc;
        }

        .info-box p {
          margin: 0 0 1rem 0;
          color: #333;
        }

        .info-box ul {
          margin: 0;
          padding-left: 1.5rem;
          color: #555;
        }

        .info-box li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
