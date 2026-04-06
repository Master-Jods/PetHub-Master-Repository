import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import {
  ADMIN_ROLE_OPTIONS,
  buildProfileName,
  formatJoinedDate,
  normalizeRole,
  splitDisplayName,
  toDisplayRole,
} from '../lib/profileHelpers.js';

const router = Router();

const buildUserRecord = (profile, authUser = null) => ({
  id: profile.user_id,
  userId: profile.user_id,
  name: buildProfileName(profile, authUser?.email || ''),
  email: profile.email || authUser?.email || '',
  phone: profile.phone || '',
  role: toDisplayRole(profile.role),
  joinedDate: formatJoinedDate(profile.created_at || authUser?.created_at),
});

const listAllAuthUsers = async () => {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
};

router.get('/profile/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, first_name, last_name, display_name, phone, role')
      .eq('user_id', id)
      .in('role', ADMIN_ROLE_OPTIONS)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.json({
      profile: {
        userId: data.user_id,
        name: buildProfileName(data),
        email: data.email || '',
        phone: data.phone || '',
        role: toDisplayRole(data.role),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load profile.' });
  }
});

router.patch('/profile/:id', async (req, res) => {
  const { id } = req.params;
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', id)
      .in('role', ADMIN_ROLE_OPTIONS)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingProfile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const { firstName, lastName } = splitDisplayName(name);

    const { data: updatedAuthUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      user_metadata: {
        full_name: name,
      },
    });

    if (updateAuthError) throw updateAuthError;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: name,
        phone,
      })
      .eq('user_id', id);

    if (profileError) throw profileError;

    res.json({
      profile: {
        userId: id,
        name,
        email: updatedAuthUser.user.email || email,
        phone,
        role: toDisplayRole(existingProfile.role),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update profile.' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const [authUsers, profilesResult] = await Promise.all([
      listAllAuthUsers(),
      supabaseAdmin
        .from('profiles')
        .select('user_id, email, first_name, last_name, display_name, phone, role, created_at')
        .in('role', ADMIN_ROLE_OPTIONS),
    ]);

    if (profilesResult.error) throw profilesResult.error;

    const authUserById = new Map(authUsers.map((user) => [user.id, user]));

    const users = (profilesResult.data || [])
      .map((profile) => buildUserRecord(profile, authUserById.get(profile.user_id)))
      .sort((a, b) => {
        const aTime = new Date(a.joinedDate || 0).getTime();
        const bTime = new Date(b.joinedDate || 0).getTime();
        return bTime - aTime;
      });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load users.' });
  }
});

router.post('/users', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();
  const role = normalizeRole(req.body.role);

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }

  try {
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    });

    if (createError) throw createError;

    const { firstName, lastName } = splitDisplayName(name);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: createdUser.user.id,
        role,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: name,
        phone,
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    res.status(201).json({
      user: buildUserRecord({
        user_id: createdUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: name,
        phone,
        role,
        created_at: createdUser.user.created_at,
      }, createdUser.user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create user.' });
  }
});

router.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const phone = String(req.body.phone || '').trim();
  const role = normalizeRole(req.body.role);

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required.' });
  }

  try {
    const { data: updatedAuthUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email,
      user_metadata: {
        full_name: name,
      },
    });

    if (updateAuthError && !String(updateAuthError.message || '').toLowerCase().includes('user not found')) {
      throw updateAuthError;
    }

    const { firstName, lastName } = splitDisplayName(name);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        user_id: id,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: name,
        phone,
        role,
      })
      .eq('user_id', id)
      .in('role', ADMIN_ROLE_OPTIONS);

    if (profileError) throw profileError;

    res.json({
      user: buildUserRecord({
        user_id: id,
        email,
        first_name: firstName,
        last_name: lastName,
        display_name: name,
        phone,
        role,
      }, updatedAuthUser?.user || null),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update user.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError && !String(authError.message || '').toLowerCase().includes('user not found')) {
      throw authError;
    }

    await supabaseAdmin.from('profiles').delete().eq('user_id', id).in('role', ADMIN_ROLE_OPTIONS);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user.' });
  }
});

export default router;
