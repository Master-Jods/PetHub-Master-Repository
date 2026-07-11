import React, { useEffect, useState, useMemo } from 'react';
import './Inventory.css';
import { supabaseCafe } from '../supabaseCafe';

function CafeMenu() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    category_id: '',
    description: '',
    price: 0,
    image_url: '',
    is_available: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catRes] = await Promise.all([
        supabaseCafe.from('menu_items').select('*').order('name', { ascending: true }),
        supabaseCafe.from('menu_categories').select('*').order('name', { ascending: true }),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (catRes.error) throw catRes.error;

      setItems(itemsRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err.message || 'Failed to load menu items.');
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
      const matchesSearch =
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const categoryName = categoryMap.get(item.category_id) || '';
      const matchesCategory =
        selectedCategory === 'All Categories' || categoryName === selectedCategory;

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.is_available) ||
        (availabilityFilter === 'unavailable' && !item.is_available);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [items, searchTerm, selectedCategory, availabilityFilter, categoryMap]);

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
        .from('menu_items')
        .insert({
          name: formState.name,
          category_id: formState.category_id || null,
          description: formState.description,
          price: Number(formState.price),
          image_url: formState.image_url || null,
          is_available: formState.is_available,
        })
        .select('*')
        .single();

      if (err) throw err;
      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error adding menu item:', err);
      setError(err.message || 'Failed to add menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setFormState({
      name: item.name || '',
      category_id: item.category_id || '',
      description: item.description || '',
      price: item.price ?? 0,
      image_url: item.image_url || '',
      is_available: item.is_available ?? true,
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
        .from('menu_items')
        .update({
          name: formState.name,
          category_id: formState.category_id || null,
          description: formState.description,
          price: Number(formState.price),
          image_url: formState.image_url || null,
          is_available: formState.is_available,
        })
        .eq('id', selectedItem.id)
        .select('*')
        .single();

      if (err) throw err;
      setItems((prev) => prev.map((item) => (item.id === selectedItem.id ? data : item)));
      setIsEditModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error updating menu item:', err);
      setError(err.message || 'Failed to update menu item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const { error: err } = await supabaseCafe.from('menu_items').delete().eq('id', itemId);
      if (err) throw err;
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError(err.message || 'Failed to delete menu item.');
    }
    setActiveDropdown(null);
  };

  const resetForm = () => {
    setFormState({
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      price: 0,
      image_url: '',
      is_available: true,
    });
    setSelectedItem(null);
  };

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;

  const categoryOptions = useMemo(() => {
    return ['All Categories', ...categories.map((c) => c.name)];
  }, [categories]);

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Cafe Menu</h1>
        <p>Manage cafe menu items, prices, and availability.</p>
      </div>

      <div className="inventory-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search menu items..."
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
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value)}
        >
          <option value="all">All Availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {error && <div className="inventory-feedback inventory-feedback--error">{error}</div>}
      {loading && <div className="inventory-feedback">Loading menu items...</div>}

      <div className="inventory-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
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
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="inventory-card-image"
                    style={{ height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <h3 style={{ marginTop: item.image_url ? '10px' : '0' }}>{item.name}</h3>
                <div className="inventory-category">
                  {categoryMap.get(item.category_id) || 'Uncategorized'}
                </div>
                {item.description && <p className="inventory-description">{item.description}</p>}
                <div className="inventory-price" style={{ marginTop: '12px' }}>
                  {formatCurrency(item.price)}
                </div>
                <div className={`inventory-stock ${!item.is_available ? 'low-stock' : ''}`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-products">
            <p>No menu items found matching your filter criteria.</p>
            <button className="add-first-btn" onClick={() => setIsAddModalOpen(true)}>
              Add Menu Item
            </button>
          </div>
        )}
      </div>

      <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)}>
        Add Menu Item
      </button>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Menu Item</h2>
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
                  <label style={{ fontWeight: '600' }}>Price (₱) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formState.price}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formState.image_url}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Description</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px', minHeight: '60px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={formState.is_available}
                  onChange={handleInputChange}
                />
                <label htmlFor="is_available" style={{ fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                  Item is available for order
                </label>
              </div>

              <button type="submit" className="add-first-btn" disabled={saving} style={{ width: '100%' }}>
                {saving ? 'Saving...' : 'Add Menu Item'}
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
              <h2>Edit Menu Item - {selectedItem.name}</h2>
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
                  <label style={{ fontWeight: '600' }}>Price (₱) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formState.price}
                    onChange={handleInputChange}
                    className="search-input"
                    style={{ width: '100%', marginTop: '6px' }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Image URL</label>
                <input
                  type="text"
                  name="image_url"
                  value={formState.image_url}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontWeight: '600' }}>Description</label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  className="search-input"
                  style={{ width: '100%', marginTop: '6px', minHeight: '60px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="edit_is_available"
                  name="is_available"
                  checked={formState.is_available}
                  onChange={handleInputChange}
                />
                <label htmlFor="edit_is_available" style={{ fontWeight: '600', cursor: 'pointer', margin: 0 }}>
                  Item is available for order
                </label>
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

export default CafeMenu;
