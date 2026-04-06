// components/Loyalty.jsx
import React, { useState } from 'react';
import './Loyalty.css';

function Loyalty() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('All Loyalty Status');

  // Customer data with realistic tier progression - can't achieve higher tiers without lower ones
  const customers = [
    { 
      id: 1,
      name: 'Kenzo Rafael', 
      email: 'kenzo.pag@happytails.com',
      bronze: { achieved: true },
      silver: { achieved: false, progress: '38/50' },
      gold: { achieved: false } // Can't have gold without silver
    },
    { 
      id: 2,
      name: 'Schenly Rein', 
      email: 'schenly.rain@gmail.com',
      bronze: { achieved: true },
      silver: { achieved: true },
      gold: { achieved: true }
    },
    { 
      id: 3,
      name: 'Karl Siquian', 
      email: 'karl.matt@gmail.com',
      bronze: { achieved: true },
      silver: { achieved: true },
      gold: { achieved: false, progress: '42/50' } // Working towards gold
    },
    { 
      id: 4,
      name: 'Kristiana Tiu', 
      email: 'kc.tiuuu@gmail.com',
      bronze: { achieved: true },
      silver: { achieved: false, progress: '25/50' },
      gold: { achieved: false } // Can't have gold without silver
    },
    { 
      id: 5,
      name: 'Coleen Jose', 
      email: 'colscols@happytails.com',
      bronze: { achieved: true },
      silver: { achieved: true },
      gold: { achieved: true }
    },
    { 
      id: 6,
      name: 'Catalina Rein', 
      email: 'catalina15@gmail.com',
      bronze: { achieved: true },
      silver: { achieved: true },
      gold: { achieved: false, progress: '18/50' } // Working towards gold
    },
    { 
      id: 7,
      name: 'Maria Santos', 
      email: 'maria.santos@happytails.com',
      bronze: { achieved: true },
      silver: { achieved: false, progress: '12/50' },
      gold: { achieved: false }
    },
    { 
      id: 8,
      name: 'John Reyes', 
      email: 'john.reyes@happytails.com',
      bronze: { achieved: true },
      silver: { achieved: true },
      gold: { achieved: true }
    }
  ];

  // Stats data
  const stats = [
    { label: 'Total Members', value: '156' },
    { label: 'Gold Members', value: '23' },
    { label: 'Silver Members', value: '45' },
    { label: 'Bronze Members', value: '88' }
  ];

  // Filter customers based on search and tier filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTier = true;
    if (tierFilter === 'Bronze') {
      matchesTier = customer.bronze.achieved;
    } else if (tierFilter === 'Silver') {
      matchesTier = customer.silver.achieved;
    } else if (tierFilter === 'Gold') {
      matchesTier = customer.gold.achieved;
    }
    
    return matchesSearch && matchesTier;
  });

  // Render tier cell content
  const renderTierCell = (tier) => {
    if (tier.achieved) {
      return (
        <div className="tier-indicator">
          <div className="check-icon">✓</div>
        </div>
      );
    } else if (tier.progress) {
      return (
        <div className="tier-indicator">
          <span className="progress-text">{tier.progress}</span>
        </div>
      );
    } else {
      return <div className="tier-indicator">—</div>;
    }
  };

  return (
    <div className="loyalty-container">
      <div className="loyalty-header">
        <h1>Loyalty</h1>
        <p>Track customer's loyalty status</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <h3>{stat.label}</h3>
            <div className="stat-number">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="loyalty-filters">
        <input
          type="text"
          className="loyalty-search-input"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="loyalty-filter-select"
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        >
          <option>All Loyalty Status</option>
          <option>Bronze</option>
          <option>Silver</option>
          <option>Gold</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="loyalty-table-container">
        <table className="loyalty-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Bronze</th>
              <th>Silver</th>
              <th>Gold</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className="customer-info">
                    <span>{customer.name}</span>
                  </div>
                </td>
                <td>{customer.email}</td>
                <td>{renderTierCell(customer.bronze)}</td>
                <td>{renderTierCell(customer.silver)}</td>
                <td>{renderTierCell(customer.gold)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Loyalty;
