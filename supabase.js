// Biofolio Supabase Client & API Helper
const SUPABASE_URL = 'https://zzdoibodjjltkbqrdlzn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6ZG9pYm9kampsdGticXJkbHpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MTI1NTMsImV4cCI6MjEwMjI4ODU1M30.fKEJnLMSlehzY2oiK7zQ9rVnN6iMvy8U3yRRf9F8K-U';

// Initialize Supabase client if SDK is loaded
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseClient };

// Username Availability Checker
export async function checkUsernameAvailability(username) {
  if (!supabaseClient) return { available: false, error: 'Database offline' };
  const clean = username.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  if (clean.length < 3) {
    return { available: false, clean, error: 'Must be at least 3 characters' };
  }
  if (['admin', 'api', 'app', 'dashboard', 'settings', 'auth', 'login', 'signup'].includes(clean)) {
    return { available: false, clean, error: 'Reserved username' };
  }

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('username')
    .eq('username', clean)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return { available: false, clean, error: error.message };
  }

  return { available: !data, clean };
}

// User Authentication Helpers
export async function sendEmailOtp({ email, username, displayName }) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  
  const metadata = {};
  if (username) {
    metadata.username = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }
  if (displayName) {
    metadata.display_name = displayName;
  }
  metadata.role = 'user';

  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      data: metadata,
      shouldCreateUser: true
    }
  });

  if (error) throw error;
  return data;
}

export async function verifyEmailOtp({ email, token }) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const cleanToken = String(token).trim();

  const { data, error } = await supabaseClient.auth.verifyOtp({
    email,
    token: cleanToken,
    type: 'email'
  });

  if (error) throw error;
  return data;
}

export async function signUpUser({ email, password, username, displayName }) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: cleanUsername,
        display_name: displayName || cleanUsername,
        role: 'user'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function signInUser({ email, password }) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/builder.html#reset-password`
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// Portfolio Data Helpers
export async function getUserPortfolio(userId) {
  if (!supabaseClient) return null;
  const { data: portfolio, error } = await supabaseClient
    .from('portfolios')
    .select(`
      *,
      sections:portfolio_sections(
        *,
        items:portfolio_items(*)
      )
    `)
    .eq('user_id', userId)
    .order('sort_order', { foreignTable: 'portfolio_sections', ascending: true })
    .order('sort_order', { foreignTable: 'portfolio_sections.portfolio_items', ascending: true })
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user portfolio:', error);
  }
  return portfolio;
}

export async function getPublicPortfolio(slug) {
  if (!supabaseClient) return null;
  const { data: portfolio, error } = await supabaseClient
    .from('portfolios')
    .select(`
      *,
      profile:profiles(*),
      sections:portfolio_sections(
        *,
        items:portfolio_items(*)
      )
    `)
    .eq('slug', slug.toLowerCase())
    .eq('is_published', true)
    .order('sort_order', { foreignTable: 'portfolio_sections', ascending: true })
    .order('sort_order', { foreignTable: 'portfolio_sections.portfolio_items', ascending: true })
    .single();

  if (error) {
    console.error('Error fetching public portfolio:', error);
    return null;
  }
  return portfolio;
}

// Analytics Helpers
export async function logAnalyticsEvent(portfolioId, eventType, itemId = null) {
  if (!supabaseClient || !portfolioId) return;
  try {
    await supabaseClient.from('analytics_events').insert({
      portfolio_id: portfolioId,
      event_type: eventType,
      item_id: itemId,
      referrer: document.referrer || null,
      user_agent_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    });
  } catch (err) {
    console.warn('Failed to log analytics event', err);
  }
}

// Storage Helpers
export async function uploadMedia(file, bucket = 'portfolio-media') {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const user = await getCurrentUser();
  if (!user) throw new Error('Must be logged in to upload files');

  const fileExt = file.name.split('.').pop();
  const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Admin Portal Helpers
export async function getAdminStats() {
  if (!supabaseClient) return { users: 0, portfolios: 0, views: 0, reports: 0 };
  
  const [usersRes, portRes, eventsRes, repRes] = await Promise.all([
    supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseClient.from('portfolios').select('id', { count: 'exact', head: true }),
    supabaseClient.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_type', 'page_view'),
    supabaseClient.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  return {
    users: usersRes.count || 0,
    portfolios: portRes.count || 0,
    views: eventsRes.count || 0,
    reports: repRes.count || 0
  };
}

export async function getAdminUsers() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('profiles')
    .select(`
      *,
      portfolios (
        id, slug, is_published, created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function toggleUserSuspension(userId, isSuspended) {
  if (!supabaseClient) throw new Error('Database offline');
  const { data, error } = await supabaseClient
    .from('profiles')
    .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserAccount(userId) {
  if (!supabaseClient) throw new Error('Database offline');
  const { error } = await supabaseClient
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
  return true;
}

export async function getAdminPortfolios() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('portfolios')
    .select(`
      *,
      profile:profiles (
        id, username, display_name, is_suspended
      ),
      sections:portfolio_sections (
        id, section_type,
        items:portfolio_items ( id )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function togglePortfolioPublish(portfolioId, isPublished) {
  if (!supabaseClient) throw new Error('Database offline');
  const { data, error } = await supabaseClient
    .from('portfolios')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', portfolioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePortfolio(portfolioId) {
  if (!supabaseClient) throw new Error('Database offline');
  const { error } = await supabaseClient
    .from('portfolios')
    .delete()
    .eq('id', portfolioId);

  if (error) throw error;
  return true;
}

export async function getAdminReports() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('content_reports')
    .select(`
      *,
      portfolio:portfolios (
        id, slug, title, is_published,
        profile:profiles ( id, username, display_name )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateReportStatus(reportId, status, adminNotes = null) {
  if (!supabaseClient) throw new Error('Database offline');
  const { data, error } = await supabaseClient
    .from('content_reports')
    .update({ 
      status, 
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

if (typeof window !== 'undefined') {
  window.BiofolioSupabase = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    get client() { return supabaseClient; },
    checkUsernameAvailability,
    signUpUser,
    signInUser,
    signOutUser,
    resetPasswordForEmail,
    getCurrentUser,
    getCurrentProfile,
    getUserPortfolio,
    getPublicPortfolio,
    logAnalyticsEvent,
    uploadMedia,
    getAdminStats,
    getAdminUsers,
    toggleUserSuspension,
    deleteUserAccount,
    getAdminPortfolios,
    togglePortfolioPublish,
    deletePortfolio,
    getAdminReports,
    updateReportStatus
  };
}

