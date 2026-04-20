// components/analytics/Analytics.jsx
import React, { useEffect, useState } from 'react';
import './Analytics.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pethub-customer-api.onrender.com/api';

const emptyAnalytics = {
  metrics: [],
  popularServices: [],
  peakHours: [],
  insights: {
    newCustomers: 0,
    repeatRate: '0%',
    avgVisits: '0.0',
    activeDay: 'N/A',
    popularPet: 'N/A',
    satisfaction: '0.0/5',
  },
  revenueTrend: {
    current: [],
    previous: [],
    labels: [],
  },
  orderDistribution: {
    petShop: 0,
    petMenu: 0,
  },
  popularOrders: [],
};

const Analytics = () => {
  const [activePeriod, setActivePeriod] = useState('month');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE_URL}/analytics?period=${activePeriod}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load analytics.');
        }

        setAnalytics({
          ...emptyAnalytics,
          ...payload,
        });
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [activePeriod]);

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  const metrics = analytics.metrics || [];
  const popularServices = analytics.popularServices || [];
  const peakHours = analytics.peakHours || [];
  const insights = analytics.insights || emptyAnalytics.insights;
  const revenueTrend = analytics.revenueTrend || emptyAnalytics.revenueTrend;
  const orderDistribution = analytics.orderDistribution || emptyAnalytics.orderDistribution;
  const popularOrders = analytics.popularOrders || [];
  
  const totalRevenue = popularServices.reduce((sum, service) => sum + service.revenue, 0);
  const totalOrders = orderDistribution.petShop + orderDistribution.petMenu;
  const petShopShare = totalOrders ? (orderDistribution.petShop / totalOrders) * 360 : 180;

  return (
    <div className="analytics-container">
      {/* Header Section */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">Track and monitor your business performance metrics</p>
          <p className="analytics-current-date">{currentDateTime.toLocaleString()}</p>
        </div>
        
        {/* Period Selector */}
        <div className="analytics-period-selector">
          <button 
            className={`period-btn ${activePeriod === 'week' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('week')}
          >
            Week
          </button>
          <button 
            className={`period-btn ${activePeriod === 'month' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('month')}
          >
            Month
          </button>
          <button 
            className={`period-btn ${activePeriod === 'year' ? 'active' : ''}`}
            onClick={() => handlePeriodChange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {error && <div className="analytics-feedback analytics-feedback--error">{error}</div>}
      {loading && <div className="analytics-feedback">Loading analytics...</div>}

      {/* Key Metrics Grid */}
      <div className="analytics-metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.id} className="metric-card">
            <div className="metric-header">
              <span className="metric-label">{metric.label}</span>
              <span className={`metric-trend trend-${metric.trend}`}>
                {metric.change}
              </span>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-period">{metric.period}</div>
            
            {/* Mini Sparkline Chart Placeholder */}
            <div className="metric-sparkline">
              <div className="sparkline-bar">
                <div 
                  className="sparkline-fill" 
                  style={{ 
                    width: `${metric.trend === 'up' ? '70' : '45'}%`,
                    background: metric.trend === 'up' ? '#f53799' : '#dc3545'
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Revenue Trend Chart - Placeholder */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3 className="chart-title">Revenue Trend ({activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)})</h3>
            <div className="chart-legend">
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#f53799' }}></span>
                This Period
              </span>
              <span className="legend-item">
                <span className="legend-dot" style={{ background: '#ffb6d9' }}></span>
                Previous Period
              </span>
            </div>
          </div>
          <div className="chart-container">
            <div className="line-chart-placeholder">
              {revenueTrend.current.map((value, index) => {
                const maxValue = Math.max(...revenueTrend.current, ...revenueTrend.previous);
                const currentHeight = (value / maxValue) * 100;
                const previousHeight = (revenueTrend.previous[index] / maxValue) * 100;
                
                return (
                  <div key={index} className="chart-bar-group">
                    <div className="chart-bar previous" style={{ height: `${previousHeight}%` }}></div>
                    <div className="chart-bar current" style={{ height: `${currentHeight}%` }}></div>
                  </div>
                );
              })}
            </div>
            <div className="chart-labels">
              {revenueTrend.labels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Service Distribution - Donut Chart Placeholder */}
        <div className="chart-card">
          <h3 className="chart-title">Service Distribution</h3>
          <div className="donut-chart-placeholder">
            <div className="donut-center">
              <span className="donut-value">
                {popularServices.reduce((sum, s) => sum + s.bookings, 0)}
              </span>
              <span className="donut-label">Total Bookings</span>
            </div>
            <svg viewBox="0 0 100 100" className="donut-svg">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="15" />
              {popularServices.map((service, index) => {
                const totalBookings = popularServices.reduce((sum, s) => sum + s.bookings, 0);
                if (!totalBookings) return null;
                const percentage = service.bookings / totalBookings;
                const circumference = 2 * Math.PI * 40;
                const strokeDasharray = circumference;
                const strokeDashoffset = circumference * (1 - percentage);
                const rotation = index === 0 ? -90 : -90 + (popularServices.slice(0, index).reduce((sum, s) => sum + (s.bookings / totalBookings) * 360, 0));
                
                return (
                  <circle
                    key={service.id}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={service.color}
                    strokeWidth="15"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    transform={`rotate(${rotation} 50 50)`}
                  />
                );
              })}
            </svg>
          </div>
            <div className="service-legend">
            {popularServices.slice(0, 3).map(service => (
              <div key={service.id} className="legend-item">
                <span className="legend-dot" style={{ background: service.color }}></span>
                <span>{service.service}</span>
                <span className="legend-value">{totalRevenue ? ((service.revenue / totalRevenue) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-orders-grid">
        <div className="insights-card orders-distribution-card">
          <h3 className="insights-title">Orders Distribution</h3>
          <div className="orders-donut-wrap">
            <div className="orders-donut" style={{ background: `conic-gradient(#f53799 0 ${petShopShare}deg, #5ce1e6 ${petShopShare}deg 360deg)` }}>
              <div className="orders-donut-center">{totalOrders}</div>
            </div>
            <div className="orders-distribution-legend">
              <div><span className="legend-dot" style={{ background: '#f53799' }}></span> Pet Shop: {orderDistribution.petShop} ({totalOrders ? ((orderDistribution.petShop / totalOrders) * 100).toFixed(1) : '0.0'}%)</div>
              <div><span className="legend-dot" style={{ background: '#5ce1e6' }}></span> Pet Menu: {orderDistribution.petMenu} ({totalOrders ? ((orderDistribution.petMenu / totalOrders) * 100).toFixed(1) : '0.0'}%)</div>
            </div>
          </div>
        </div>

        <div className="insights-card popular-orders-card">
          <h3 className="insights-title">Popular Orders</h3>
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Orders</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {popularOrders.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.count}</td>
                    <td>{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tables and Insights Grid */}
      <div className="analytics-insights-grid">
        {/* Popular Services Table */}
        <div className="insights-card large">
          <h3 className="insights-title">Popular Services ({activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)})</h3>
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                  <th>% of Total</th>
                </tr>
              </thead>
              <tbody>
                {popularServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="service-cell">
                        <span className="service-dot" style={{ background: service.color }}></span>
                        {service.service}
                      </div>
                    </td>
                    <td>{service.bookings}</td>
                    <td>₱{service.revenue.toLocaleString()}</td>
                    <td>
                      <div className="percentage-cell">
                        <span>{totalRevenue ? ((service.revenue / totalRevenue) * 100).toFixed(1) : '0.0'}%</span>
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill" 
                            style={{ 
                              width: `${totalRevenue ? (service.revenue / totalRevenue) * 100 : 0}%`,
                              background: service.color 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="insights-card">
          <h3 className="insights-title">
            {activePeriod === 'week' ? 'Peak Days' : activePeriod === 'month' ? 'Peak Hours' : 'Peak Months'}
          </h3>
          <div className="peak-hours-list">
            {peakHours.map((hour, index) => (
              <div key={index} className="peak-hour-item">
                <div className="hour-info">
                  <span className="hour-time">{hour.time}</span>
                  <span className="hour-bookings">{hour.bookings} bookings</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${hour.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Insights */}
        <div className="insights-card">
          <h3 className="insights-title">Customer Insights ({activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)})</h3>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-label">New Customers</span>
              <div className="insight-value-wrapper">
                <span className="insight-value">{insights.newCustomers}</span>
                <span className="insight-badge">this {activePeriod}</span>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-label">Repeat Customers</span>
              <div className="insight-value-wrapper">
                <span className="insight-value">{insights.repeatRate}</span>
                <div className="mini-progress">
                  <div 
                    className="mini-progress-fill" 
                    style={{ width: insights.repeatRate }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="insight-item">
              <span className="insight-label">Avg. Visits per Customer</span>
              <span className="insight-value">{insights.avgVisits}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">
                {activePeriod === 'week' ? 'Most Active Day' : activePeriod === 'month' ? 'Most Active Day' : 'Peak Season'}
              </span>
              <span className="insight-value highlight">{insights.activeDay}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Popular Pet</span>
              <span className="insight-value">{insights.popularPet}</span>
            </div>
            <div className="insight-item">
              <span className="insight-label">Customer Satisfaction</span>
              <div className="insight-value-wrapper">
                <span className="insight-value">{insights.satisfaction}</span>
                <span className="rating-stars">
                  {'★'.repeat(Math.floor(parseFloat(insights.satisfaction)))}
                  {'☆'.repeat(5 - Math.floor(parseFloat(insights.satisfaction)))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
