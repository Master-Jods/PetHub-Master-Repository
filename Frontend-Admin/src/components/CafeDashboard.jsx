import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { supabaseCafe } from '../supabaseCafe';

function CafeDashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockIngredients: 0,
    totalSales: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Total Customers (Loyalty Accounts)
        const { count: customerCount, error: customerErr } = await supabaseCafe
          .from('loyalty_accounts')
          .select('*', { count: 'exact', head: true });

        if (customerErr) throw customerErr;

        // 2. Pending Orders
        const { count: pendingCount, error: pendingErr } = await supabaseCafe
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (pendingErr) throw pendingErr;

        // 3. Low Stock Ingredients
        const { data: inventoryData, error: inventoryErr } = await supabaseCafe
          .from('inventory_items')
          .select('quantity_on_hand, reorder_level');

        if (inventoryErr) throw inventoryErr;

        const lowStockCount = (inventoryData || []).filter(
          (item) => (item.quantity_on_hand ?? 0) <= (item.reorder_level ?? 0)
        ).length;

        // 4. Total Sales (completed orders)
        const { data: salesData, error: salesErr } = await supabaseCafe
          .from('orders')
          .select('total_amount')
          .in('status', ['completed', 'delivered']);

        if (salesErr) throw salesErr;

        const totalSalesAmt = (salesData || []).reduce(
          (sum, order) => sum + Number(order.total_amount || 0),
          0
        );

        // 5. Recent Orders
        const { data: recentOrdersData, error: recentOrdersErr } = await supabaseCafe
          .from('orders')
          .select('id, code, status, total_amount, placed_at, customer_name')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentOrdersErr) throw recentOrdersErr;

        setStats({
          totalCustomers: customerCount || 0,
          pendingOrders: pendingCount || 0,
          lowStockIngredients: lowStockCount,
          totalSales: totalSalesAmt,
        });
        setRecentOrders(recentOrdersData || []);
      } catch (err) {
        console.error('Error fetching Cafe dashboard data:', err);
        setError(err.message || 'Failed to load Cafe overview.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Cafe Dashboard</h1>
          <p className="dashboard-subtitle">Overview of Happy Tails Pet Cafe operations.</p>
        </div>
      </div>

      {error && <div className="dashboard-feedback dashboard-feedback--error">{error}</div>}
      {loading && <div className="dashboard-feedback">Loading Cafe overview...</div>}

      {!loading && (
        <>
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <h3 className="dashboard-stat-label">Total Cafe Sales</h3>
              <div className="dashboard-stat-value">{formatCurrency(stats.totalSales)}</div>
            </div>
            <div className="dashboard-stat-card">
              <h3 className="dashboard-stat-label">Pending Orders</h3>
              <div className="dashboard-stat-value">{stats.pendingOrders}</div>
            </div>
            <div className="dashboard-stat-card">
              <h3 className="dashboard-stat-label">Low Stock Ingredients</h3>
              <div className="dashboard-stat-value">{stats.lowStockIngredients}</div>
            </div>
            <div className="dashboard-stat-card">
              <h3 className="dashboard-stat-label">Total Loyalty Members</h3>
              <div className="dashboard-stat-value">{stats.totalCustomers}</div>
            </div>
          </div>

          <div className="dashboard-three-column" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div className="dashboard-column">
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">Recent Cafe Orders</h2>
                <div className="dashboard-schedule-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="dashboard-schedule-item"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          borderBottom: '1px solid #ffd9ec',
                        }}
                      >
                        <div>
                          <strong>{order.code}</strong>
                          <span style={{ marginLeft: '12px', color: '#666', fontSize: '13px' }}>
                            {order.customer_name || 'Guest'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            {formatCurrency(order.total_amount)}
                          </span>
                          <span
                            className={`order-status-badge status-${String(order.status || '').toLowerCase().replace(/\s+/g, '-')}`}
                            style={{ padding: '4px 10px', fontSize: '11px', minWidth: '80px' }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dashboard-empty">No orders found.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard-column">
              <div className="dashboard-card">
                <h2 className="dashboard-card-title">Cafe Quick Actions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
                  <p style={{ fontSize: '13px', color: '#666' }}>
                    Quick navigation links for daily Cafe operations.
                  </p>
                  <button
                    type="button"
                    className="action-btn"
                    style={{ width: '100%', padding: '12px', textAlign: 'center' }}
                    onClick={() => {
                      const event = new CustomEvent('navigate-cafe-tab', { detail: 'cafe-orders' });
                      window.dispatchEvent(event);
                    }}
                  >
                    View Cafe Orders →
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    style={{ width: '100%', padding: '12px', textAlign: 'center' }}
                    onClick={() => {
                      const event = new CustomEvent('navigate-cafe-tab', { detail: 'cafe-inventory' });
                      window.dispatchEvent(event);
                    }}
                  >
                    Manage Ingredients →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CafeDashboard;
