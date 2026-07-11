import React, { useEffect, useState, useMemo } from 'react';
import './Inventory.css';
import { supabaseCafe } from '../supabaseCafe';

const STOCK_LEVELS = ['All Stock Levels', 'In Stock', 'Low Stock', 'Out of Stock'];

function CafeInventory() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [stockFilter, setStockFilter] = useState('All Stock Levels');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    category_id: '',
    quantity_on_hand: 0,
    unit: 'pcs',
    reorder_level: 0,
    notes: '',
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        supabaseCafe.from('inventory_items').select('*').order('name', { ascending: true }),
        supabaseCafe.from('inventory_categories').select('*').order('name', { ascending: true }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catRes.error) throw catRes.error;

      setItems(itemsRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = item.name?.toLowerCase().includes(query) || item.notes?.toLowerCase().includes(query);

      const categoryName = categoryMap.get(item.category_id) || '';
      const matchesCategory =
        selectedCategory === 'All Categories' || categoryName === selectedCategory;

      const qoh = Number(item.quantity_on_hand || 0);
      const rl = Number(item.reorder_level || 0);
      let matchesStock = true;
      if (stockFilter === 'In Stock') matchesStock = qoh > rl;
      if (stockFilter === 'Low Stock') matchesStock = qoh > 0 && qoh <= rl;
      if (stockFilter === 'Out of Stock') matchesStock = qoh === 0;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchTerm, selectedCategory, stockFilter, categoryMap]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error: err } = await supabaseCafe
        .from('inventory_items')
        .insert({
          name: formState.name,
          category_id: formState.category_id || null,
          quantity_on_hand: Number(formState.quantity_on_hand),
          unit: formState.unit,
          reorder_level: Number(formState.reorder_level),
          notes: formState.notes,
          is_active: formState.is_active,
        })
        .select('*')
        .single();

      if (err) throw err;
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error adding item:', err);
      setError(err.message || 'Failed to add item.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setFormState({
      name: item.name || '',
      category_id: item.category_id || '',
      quantity_on_hand: item.quantity_on_hand ?? 0,
      unit: item.unit || 'pcs',
      reorder_level: item.reorder_level ?? 0,
      notes: item.notes || '',
      is_active: item.is_active ?? true,
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSaving(true);
    try {
      const { data, error: err } = await supabaseCafe
        .from('inventory_items')
        .update({
          name: formState.name,
          category_id: formState.category_id || null,
          quantity_on_hand: Number(formState.quantity_on_hand),
          unit: formState.unit,
          reorder_level: Number(formState.reorder_level),
          notes: formState.notes,
          is_active: formState.is_active,
        })
        .eq('id', selectedItem.id)
        .select('*')
        .single();

      if (err) throw err;
      setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? data : item)));
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      const { error: err } = await supabaseCafe.from('inventory_items').delete().eq('id', itemId);
      if (err) throw err;
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err.message || 'Failed to delete item.');
    }
    setActiveDropdown(null);
  };

  const resetForm = () => {
    setFormState({
      name: '',
      category_id: categories[0]?.id || '',
      quantity_on_hand: 0,
      unit: 'pcs',
      reorder_level: 0,
      notes: '',
      is_active: true,
    });
    setSelectedItem(null);
  };

  const categoryOptions = useMemo(() => {
    return ['All Categories', ...categories.map((c) => c.name)];
  }, [categories]);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Cafe Inventory</h1>
        <p>Manage cafe ingredients, stocks, and reorder alerts.</p>
      </div>

      <div className="inventory-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          {STOCK_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="inventory-feedback inventory-feedback--error">{error}</div>}
      {loading && <div className="inventory-feedback">Loading inventory...</div>}

      <div className="inventory-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isLow = Number(item.quantity_on_hand || 0) <= Number(item.reorder_level || 0);
            return (
              <div key={item.id} className="inventory-card">
                <div className="product-menu" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}>
                  <span className="dots">•••</span>
                  {activeDropdown === item.id && (
                    <div className="dropdown-menu">
                      <button type="button" className="dropdown-item" onClick={() => handleEditClick(item)}>
                        Edit
                      </button>
                      <button type="button" className="dropdown-item delete" onClick={() => handleDeleteClick(item.id)}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <h3>{item.name}</h3>
                <div className="inventory-category">
                  {categoryMap.get(item.category_id) || 'Uncategorized'}
                </div>
                {item.notes && <p className="inventory-description">{item.notes}</p>}
                <div className={`inventory-stock ${isLow ? 'low-stock' : ''}`} style={{ marginTop: '12px', fontSize: '14px', fontWeight: 'bold' }}>
                  {item.quantity_on_hand} {item.unit || 'pcs'}
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Reorder at: {item.reorder_level} {item.unit || 'pcs'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-products">
            <p>No ingredients found matching your filter criteria.</p>
            <button className="add-first-btn" onClick={() => setIsAddModalOpen(true)}>
              Add Ingredient
            </button>
          </div>
        )}
      </div>

      <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>
        Add Ingredient
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Ingredient</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formState.name}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Category</label>
                  <select
                    name="category_id"
                    value={formState.category_id}
                    onChange={handleInputChange}
                    className="filter-select"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formState.unit}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    placeholder="e.g. g, ml, pcs"
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Quantity On Hand</label>
                  <input
                    type="number"
                    name="quantity_on_hand"
                    value={formState.quantity_on_hand}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Reorder Level</label>
                  <input
                    type="number"
                    name="reorder_level"
                    value={formState.reorder_level}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600' }}>Notes</label>
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px', minHeight: '80px' }}
                />
              </div>

              <button type="submit" className="add-first-btn" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Add Ingredient'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Ingredient - {selectedItem.name}</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formState.name}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Category</label>
                  <select
                    name="category_id"
                    value={formState.category_id}
                    onChange={handleInputChange}
                    className="filter-select"
                    style={{ width: '100%', marginTop: '6px' }}
                  >
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={formState.unit}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Quantity On Hand</label>
                  <input
                    type="number"
                    name="quantity_on_hand"
                    value={formState.quantity_on_hand}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={{ fontWeight: '600' }}>Reorder Level</label>
                  <input
                    type="number"
                    name="reorder_level"
                    value={formState.reorder_level}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600' }}>Notes</label>
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px', minHeight: '80px' }}
                />
              </div>

              <button type="submit" className="add-first-btn" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CafeInventory;
