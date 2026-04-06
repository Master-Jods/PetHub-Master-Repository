import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const router = Router();

const ROLE_OPTIONS = ['owner', 'staff'];

const normalizeRole = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ROLE_OPTIONS.includes(normalized) ? normalized : null;
};

const toDisplayRole = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return 'Staff';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatJoinedDate = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-PH', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const buildUserRecord = (profile, authUser = null) => ({
  id: profile.user_id,
  userId: profile.user_id,
  name:
    profile.name ||
    authUser?.user_metadata?.full_name ||
    profile.email?.split('@')[0] ||
    authUser?.email?.split('@')[0] ||
    'Unnamed User',
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
      .select('user_id, email, name, phone, role')
      .eq('user_id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    res.json({
      profile: {
        userId: data.user_id,
        name: data.name || '',
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
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existingProfile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

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
        name,
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
      supabaseAdmin.from('profiles').select('user_id, email, name, phone, role, created_at'),
    ]);

    if (profilesResult.error) throw profilesResult.error;

    const authUserById = new Map(
      authUsers.map((user) => [user.id, user])
    );

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

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: createdUser.user.id,
        email,
        name,
        phone,
        role,
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    res.status(201).json({
      user: buildUserRecord({
        user_id: createdUser.user.id,
        email,
        name,
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

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        user_id: id,
        email,
        name,
        phone,
        role,
      })
      .eq('user_id', id);

    if (profileError) throw profileError;

    res.json({
      user: buildUserRecord({
        user_id: id,
        email,
        name,
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

    await supabaseAdmin.from('profiles').delete().eq('user_id', id);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user.' });
  }
});

export default router;
