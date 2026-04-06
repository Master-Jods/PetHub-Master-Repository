import React, { useEffect, useState } from 'react';
import './Settings.css';
import { siteConfirm } from '../utils/siteConfirm';
import { toFriendlyMessage } from '../utils/friendlyMessage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

function Settings({ userType, currentUserId }) {
  const isOwner = userType === 'owner';
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Roles');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [profile, setProfile] = useState({
    userId: '',
    name: '',
    email: '',
    phone: ''
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [userError, setUserError] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'Owner'
  });

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError('');

      try {
        if (!currentUserId) {
          throw new Error('No active user session found.');
        }

        const response = await fetch(`${API_BASE_URL}/settings/profile/${currentUserId}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load profile.');
        }

        setProfile(payload.profile);
        setEditedProfile(payload.profile);
      } catch (error) {
        setProfileError(toFriendlyMessage(error.message, 'We couldn’t load your profile right now.'));
      } finally {
        setProfileLoading(false);
      }
    };

    const loadUsers = async () => {
      if (!isOwner) {
        setUsers([]);
        setLoadingUsers(false);
        setUserError('');
        return;
      }

      setLoadingUsers(true);
      setUserError('');

      try {
        const response = await fetch(`${API_BASE_URL}/settings/users`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load users.');
        }

        setUsers(payload.users || []);
      } catch (error) {
        setUserError(toFriendlyMessage(error.message, 'We couldn’t load the admin accounts right now.'));
      } finally {
        setLoadingUsers(false);
      }
    };

    loadProfile();
    loadUsers();
  }, [currentUserId, isOwner]);

  useEffect(() => {
    if (!isOwner && activeTab === 'user-management') {
      setActiveTab('profile');
    }
  }, [activeTab, isOwner]);

  const handleProfileEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileError('');

    try {
      const response = await fetch(`${API_BASE_URL}/settings/profile/${profile.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedProfile.name,
          email: editedProfile.email,
          phone: editedProfile.phone,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || 'Failed to update profile.');
      }

      setProfile(payload.profile);
      setEditedProfile(payload.profile);
      setIsEditing(false);
    } catch (error) {
      setProfileError(toFriendlyMessage(error.message, 'We couldn’t save your profile changes right now.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewUserChange = (event) => {
    const { name, value } = event.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditUserChange = (event) => {
    const { name, value } = event.target;
    setEditingUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = (event) => {
    event.preventDefault();
    setSavingUser(true);
    setUserError('');

    fetch(`${API_BASE_URL}/settings/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newUser,
        role: newUser.role.toLowerCase()
      }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Failed to add user.');
        }

        setUsers((prev) => [...prev, payload.user]);
        setNewUser({ name: '', phone: '', email: '', password: '', role: 'Owner' });
        setIsAddUserModalOpen(false);
      })
      .catch((error) => {
        setUserError(toFriendlyMessage(error.message, 'We couldn’t add that account right now.'));
      })
      .finally(() => {
        setSavingUser(false);
      });
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = (event) => {
    event.preventDefault();
    setSavingUser(true);
    setUserError('');

    fetch(`${API_BASE_URL}/settings/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingUser,
        role: editingUser.role.toLowerCase()
      }),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || 'Failed to update user.');
        }

        setUsers((prev) => prev.map((user) => (user.id === editingUser.id ? payload.user : user)));
        setIsEditUserModalOpen(false);
        setEditingUser(null);
      })
      .catch((error) => {
        setUserError(toFriendlyMessage(error.message, 'We couldn’t update that account right now.'));
      })
      .finally(() => {
        setSavingUser(false);
      });
  };

  const handleDeleteUser = async (userId) => {
    if (!(await siteConfirm('Are you sure you want to delete this user?'))) {
      return;
    }

      setSavingUser(true);
      setUserError('');

      fetch(`${API_BASE_URL}/settings/users/${userId}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to delete user.');
          }

          setUsers((prev) => prev.filter((user) => user.id !== userId));
        })
        .catch((error) => {
          setUserError(toFriendlyMessage(error.message, 'We couldn’t remove that account right now.'));
        })
        .finally(() => {
          setSavingUser(false);
        });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase())
      || user.email.toLowerCase().includes(searchTerm.toLowerCase())
      || (user.phone || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Roles' || user.role === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage profile and system users.</p>
      </div>

      <div className="settings-tabs" role="tablist">
        <button
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          role="tab"
          aria-selected={activeTab === 'profile'}
        >
          Profile
        </button>
        {isOwner && (
          <button
            className={`settings-tab ${activeTab === 'user-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('user-management')}
            role="tab"
            aria-selected={activeTab === 'user-management'}
          >
            User Management
          </button>
        )}
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div role="tabpanel">
            <div className="content-header">
              <h2>Profile</h2>
            </div>

            <div className="profile-section">
              {profileError && <div className="settings-feedback settings-feedback--error">{profileError}</div>}
              {profileLoading ? (
                <div className="settings-feedback">Loading profile...</div>
              ) : (
                <>
              <div className="profile-field">
                <label htmlFor="profile-name">Name:</label>
                {isEditing ? (
                  <input id="profile-name" type="text" name="name" value={editedProfile.name} onChange={handleInputChange} />
                ) : (
                  <div className="field-value">{profile.name}</div>
                )}
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email:</label>
                {isEditing ? (
                  <input id="profile-email" type="email" name="email" value={editedProfile.email} onChange={handleInputChange} />
                ) : (
                  <div className="field-value">{profile.email}</div>
                )}
              </div>

              <div className="profile-field">
                <label htmlFor="profile-phone">Phone:</label>
                {isEditing ? (
                  <input id="profile-phone" type="tel" name="phone" value={editedProfile.phone} onChange={handleInputChange} />
                ) : (
                  <div className="field-value">{profile.phone}</div>
                )}
              </div>

              <div className="profile-actions">
                {isEditing ? (
                  <div className="action-group">
                    <button className="save-btn" onClick={handleProfileSave} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save'}</button>
                    <button className="cancel-btn" onClick={handleProfileCancel} disabled={savingProfile}>Cancel</button>
                  </div>
                ) : (
                  <button className="edit-btn" onClick={handleProfileEdit}>Edit</button>
                )}
              </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'user-management' && isOwner && (
          <div role="tabpanel">
            <div className="content-header">
              <h2>User Management</h2>
            </div>

            <div className="user-management-header">
              <button className="add-user-btn" onClick={() => setIsAddUserModalOpen(true)}>Add User</button>
            </div>

            <div className="filters-row">
              <div className="search-wrapper">
                <label htmlFor="user-search" className="sr-only">Search users</label>
                <input
                  id="user-search"
                  type="text"
                  className="user-search-input"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="filter-wrapper">
                <label htmlFor="role-filter" className="sr-only">Filter by role</label>
                <select
                  id="role-filter"
                  className="user-filter-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>All Roles</option>
                  <option>Owner</option>
                  <option>Staff</option>
                </select>
              </div>
            </div>

            {userError && <div className="settings-feedback settings-feedback--error">{userError}</div>}

            <div className="table-container">
              <table className="user-table">
                <caption className="sr-only">User list</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Phone Number</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="5" className="empty-state">Loading users...</td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-edit"
                              onClick={() => handleEditUser(user)}
                              aria-label={`Edit ${user.name}`}
                            >
                              Edit
                            </button>
                            <button
                              className="action-delete"
                              onClick={() => handleDeleteUser(user.id)}
                              aria-label={`Delete ${user.name}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isAddUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserModalOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="add-user-title">
            <div className="modal-header">
              <h3 id="add-user-title">Add New User</h3>
              <button className="close-btn" onClick={() => setIsAddUserModalOpen(false)} aria-label="Close modal">×</button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="user-name">Full Name</label>
                  <input
                    id="user-name"
                    type="text"
                    name="name"
                    value={newUser.name}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-phone">Phone Number</label>
                  <input
                    id="user-phone"
                    type="tel"
                    name="phone"
                    value={newUser.phone}
                    onChange={handleNewUserChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-password">Password</label>
                  <input
                    id="user-password"
                    type="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Enter temporary password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="user-role">Role</label>
                  <select id="user-role" name="role" value={newUser.role} onChange={handleNewUserChange}>
                    <option>Owner</option>
                    <option>Staff</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={savingUser}>{savingUser ? 'Saving...' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditUserModalOpen && editingUser && (
        <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
            <div className="modal-header">
              <h3 id="edit-user-title">Edit User</h3>
              <button className="close-btn" onClick={() => setIsEditUserModalOpen(false)} aria-label="Close modal">×</button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="edit-user-name">Full Name</label>
                  <input
                    id="edit-user-name"
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleEditUserChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-email">Email</label>
                  <input
                    id="edit-user-email"
                    type="email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleEditUserChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-phone">Phone Number</label>
                  <input
                    id="edit-user-phone"
                    type="tel"
                    name="phone"
                    value={editingUser.phone || ''}
                    onChange={handleEditUserChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-user-role">Role</label>
                  <select
                    id="edit-user-role"
                    name="role"
                    value={editingUser.role}
                    onChange={handleEditUserChange}
                  >
                    <option>Owner</option>
                    <option>Staff</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn" disabled={savingUser}>{savingUser ? 'Saving...' : 'Update User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
