// ============================================================
  // SUPABASE QUOTE DATABASE
  // ============================================================
  let supabaseClient = null;
  let currentQuoteId = null;
  let currentUser = null;

  function setDbMessage(message, type) {
    const el = document.getElementById('databaseMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'database-message' + (type ? ' ' + type : '');
  }

  function setAuthMessage(message, type) {
    const el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'database-message' + (type ? ' ' + type : '');
  }

  function setConnectionStatus(message, type) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    el.textContent = message;
    el.className = 'connection-status' + (type ? ' ' + type : '');
  }

  function getSupabaseSettings() {
    return {
      url: localStorage.getItem('vehicleQuoteSupabaseUrl') || '',
      key: localStorage.getItem('vehicleQuoteSupabaseKey') || ''
    };
  }

  function initializeSupabase() {
    const settings = getSupabaseSettings();
    document.getElementById('supabaseUrl').value = settings.url;
    document.getElementById('supabaseKey').value = settings.key;

    if (!settings.url || !settings.key) {
      supabaseClient = null;
      setConnectionStatus('Connection not configured', '');
      updateAuthUi(null);
      return false;
    }

    try {
      supabaseClient = window.supabase.createClient(settings.url, settings.key);
      setConnectionStatus('Configured', 'connected');

      supabaseClient.auth.getSession().then(function(result) {
        const session = result.data ? result.data.session : null;
        currentUser = session ? session.user : null;
        updateAuthUi(currentUser);
        if (currentUser) loadSavedQuotes();
      });

      supabaseClient.auth.onAuthStateChange(function(event, session) {
        currentUser = session ? session.user : null;
        updateAuthUi(currentUser);
        if (currentUser) loadSavedQuotes();
      });

      return true;
    } catch (error) {
      supabaseClient = null;
      setConnectionStatus('Configuration error', 'error');
      setAuthMessage(error.message, 'error');
      return false;
    }
  }

  function saveSupabaseSettings() {
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();

    if (!url || !key) {
      setConnectionStatus('Enter both values', 'error');
      return;
    }

    localStorage.setItem('vehicleQuoteSupabaseUrl', url);
    localStorage.setItem('vehicleQuoteSupabaseKey', key);
    initializeSupabase();
    setConnectionStatus('Saved', 'connected');
  }

  async function testSupabaseConnection() {
    if (!supabaseClient && !initializeSupabase()) return;

    setConnectionStatus('Testing…', '');
    try {
      const result = await supabaseClient.auth.getSession();
      if (result.error) throw result.error;
      setConnectionStatus('Connection works', 'connected');
    } catch (error) {
      setConnectionStatus('Connection failed', 'error');
      setAuthMessage(error.message, 'error');
    }
  }

  function updateAuthUi(user) {
    const signedOut = document.getElementById('signedOutArea');
    const signedIn = document.getElementById('signedInArea');
    const email = document.getElementById('signedInEmail');

    if (user) {
      signedOut.classList.add('hidden-auth');
      signedIn.classList.remove('hidden-auth');
      email.textContent = user.email || user.id;
    } else {
      signedOut.classList.remove('hidden-auth');
      signedIn.classList.add('hidden-auth');
      email.textContent = '';
      document.getElementById('savedQuotesBody').innerHTML =
        '<tr><td colspan="8">Sign in to view saved quotes.</td></tr>';
    }
  }

  async function signUpUser() {
    if (!supabaseClient && !initializeSupabase()) {
      setAuthMessage('Save your Supabase connection first.', 'error');
      return;
    }

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    if (!email || password.length < 6) {
      setAuthMessage('Enter an email and a password of at least 6 characters.', 'error');
      return;
    }

    setAuthMessage('Creating account…', '');
    const result = await supabaseClient.auth.signUp({ email: email, password: password });

    if (result.error) {
      setAuthMessage(result.error.message, 'error');
      return;
    }

    setAuthMessage(
      result.data.session
        ? 'Account created and signed in.'
        : 'Account created. Check your email if confirmation is enabled.',
      'success'
    );
  }

  async function signInUser() {
    if (!supabaseClient && !initializeSupabase()) {
      setAuthMessage('Save your Supabase connection first.', 'error');
      return;
    }

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    setAuthMessage('Signing in…', '');
    const result = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      setAuthMessage(result.error.message, 'error');
      return;
    }

    setAuthMessage('Signed in.', 'success');
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    const result = await supabaseClient.auth.signOut();
    if (result.error) {
      setAuthMessage(result.error.message, 'error');
      return;
    }
    currentUser = null;
    updateAuthUi(null);
    setAuthMessage('Signed out.', 'success');
  }

  function serializeQuoteForm() {
    const formData = {};

    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(function(el) {
      if (el.type === 'button' || el.type === 'submit' || el.type === 'password') return;
      if (['supabaseUrl', 'supabaseKey', 'authEmail', 'authPassword', 'savedQuoteSearch', 'savedStatusFilter'].includes(el.id)) return;

      if (el.type === 'checkbox') {
        formData[el.id] = el.checked;
      } else if (el.type === 'radio') {
        if (el.checked) formData['radio:' + el.name] = el.value;
      } else {
        formData[el.id] = el.value;
      }
    });

    document.querySelectorAll('input[type="radio"][name]').forEach(function(el) {
      if (el.checked) formData['radio:' + el.name] = el.value;
    });

    return formData;
  }

  function restoreQuoteForm(formData) {
    if (!formData || typeof formData !== 'object') return;

    Object.keys(formData).forEach(function(key) {
      if (key.indexOf('radio:') === 0) {
        const name = key.slice(6);
        const value = String(formData[key]);
        const radio = document.querySelector(
          'input[type="radio"][name="' + CSS.escape(name) + '"][value="' + CSS.escape(value) + '"]'
        );
        if (radio) radio.checked = true;
        return;
      }

      const el = document.getElementById(key);
      if (!el || el.readOnly) return;

      if (el.type === 'checkbox') {
        el.checked = Boolean(formData[key]);
      } else {
        el.value = formData[key] == null ? '' : formData[key];
      }
    });

    calculateAll();
  }

  function generateQuoteNumber() {
    const now = new Date();
    const pad = function(value) { return String(value).padStart(2, '0'); };
    return 'Q-' +
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) + '-' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
  }

  function buildQuoteRecord() {
    let quoteNumber = document.getElementById('quoteNumber').value.trim();
    if (!quoteNumber) {
      quoteNumber = generateQuoteNumber();
      document.getElementById('quoteNumber').value = quoteNumber;
    }

    return {
      user_id: currentUser.id,
      quote_number: quoteNumber,
      quote_date: document.getElementById('quoteDate').value || null,
      customer_name: document.getElementById('customerName').value.trim(),
      salesperson: document.getElementById('salesperson').value.trim(),
      status: document.getElementById('quoteStatus').value,
      vehicle: document.getElementById('vehicle').value.trim(),
      vin: document.getElementById('vin').value.trim(),
      notes: document.getElementById('quoteNotes').value.trim(),
      form_data: serializeQuoteForm()
    };
  }

  async function ensureDatabaseReady() {
    if (!supabaseClient && !initializeSupabase()) {
      showTab('savedTab');
      setDbMessage('Enter and save your Supabase connection.', 'error');
      return false;
    }

    const sessionResult = await supabaseClient.auth.getSession();
    if (sessionResult.error) {
      setDbMessage(sessionResult.error.message, 'error');
      return false;
    }

    currentUser = sessionResult.data.session ? sessionResult.data.session.user : null;
    if (!currentUser) {
      showTab('savedTab');
      setDbMessage('Sign in before saving or opening quotes.', 'error');
      return false;
    }

    return true;
  }

  async function saveQuoteToDatabase() {
    if (!(await ensureDatabaseReady())) return;

    calculateAll();
    setDbMessage('Saving quote…', '');

    const record = buildQuoteRecord();
    let query;

    if (currentQuoteId) {
      query = supabaseClient
        .from('quotes')
        .update(record)
        .eq('id', currentQuoteId)
        .select()
        .single();
    } else {
      query = supabaseClient
        .from('quotes')
        .insert(record)
        .select()
        .single();
    }

    const result = await query;

    if (result.error) {
      setDbMessage(result.error.message, 'error');
      showTab('savedTab');
      return;
    }

    currentQuoteId = result.data.id;
    showCurrentRecord(result.data);
    setDbMessage('Quote saved successfully.', 'success');
    await loadSavedQuotes();
  }

  function showCurrentRecord(record) {
    const banner = document.getElementById('currentRecordBanner');
    if (!record || !record.id) {
      banner.classList.remove('visible');
      banner.textContent = '';
      return;
    }

    banner.textContent =
      'Editing saved quote ' + (record.quote_number || '') +
      ' — changes will update this record.';
    banner.classList.add('visible');
  }

  async function loadSavedQuotes() {
    if (!(await ensureDatabaseReady())) return;

    setDbMessage('Loading quotes…', '');
    const result = await supabaseClient
      .from('quotes')
      .select('id,quote_number,quote_date,customer_name,vehicle,vin,status,updated_at,created_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (result.error) {
      setDbMessage(result.error.message, 'error');
      return;
    }

    renderSavedQuotes(result.data || []);
    setDbMessage((result.data || []).length + ' quote(s) loaded.', 'success');
  }

  function cleanSearchTerm(value) {
    return value.replace(/[%(),]/g, ' ').trim();
  }

  async function searchSavedQuotes() {
    if (!(await ensureDatabaseReady())) return;

    const term = cleanSearchTerm(document.getElementById('savedQuoteSearch').value);
    const status = document.getElementById('savedStatusFilter').value;

    let query = supabaseClient
      .from('quotes')
      .select('id,quote_number,quote_date,customer_name,vehicle,vin,status,updated_at,created_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (term) {
      query = query.or(
        'customer_name.ilike.%' + term +
        '%,vin.ilike.%' + term +
        '%,quote_number.ilike.%' + term +
        '%,vehicle.ilike.%' + term + '%'
      );
    }

    if (status) query = query.eq('status', status);

    setDbMessage('Searching…', '');
    const result = await query;

    if (result.error) {
      setDbMessage(result.error.message, 'error');
      return;
    }

    renderSavedQuotes(result.data || []);
    setDbMessage((result.data || []).length + ' matching quote(s).', 'success');
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatSavedDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US');
  }

  function renderSavedQuotes(rows) {
    const body = document.getElementById('savedQuotesBody');

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="8">No saved quotes found.</td></tr>';
      return;
    }

    body.innerHTML = rows.map(function(row) {
      return '<tr>' +
        '<td>' + escapeHtml(row.quote_number) + '</td>' +
        '<td>' + escapeHtml(row.quote_date || '') + '</td>' +
        '<td>' + escapeHtml(row.customer_name) + '</td>' +
        '<td>' + escapeHtml(row.vehicle) + '</td>' +
        '<td>' + escapeHtml(row.vin) + '</td>' +
        '<td><span class="status-pill ' + escapeHtml(row.status) + '">' +
          escapeHtml(row.status) + '</span></td>' +
        '<td>' + escapeHtml(formatSavedDate(row.updated_at || row.created_at)) + '</td>' +
        '<td><div class="table-actions">' +
          '<button type="button" class="btn-primary" onclick="openSavedQuote(\'' + row.id + '\')">Open</button>' +
          '<button type="button" class="btn-secondary" onclick="duplicateSavedQuote(\'' + row.id + '\')">Copy</button>' +
          '<button type="button" class="danger-button" onclick="deleteSavedQuote(\'' + row.id + '\')">Delete</button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  async function fetchFullQuote(id) {
    const result = await supabaseClient
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error) throw result.error;
    return result.data;
  }

  async function openSavedQuote(id) {
    if (!(await ensureDatabaseReady())) return;

    try {
      setDbMessage('Opening quote…', '');
      const record = await fetchFullQuote(id);
      currentQuoteId = record.id;
      restoreQuoteForm(record.form_data);
      document.getElementById('quoteNotes').value = record.notes || '';
      showCurrentRecord(record);
      showTab('setupTab');
      setDbMessage('Quote opened.', 'success');
    } catch (error) {
      setDbMessage(error.message, 'error');
    }
  }

  async function duplicateSavedQuote(id) {
    if (!(await ensureDatabaseReady())) return;

    try {
      setDbMessage('Duplicating quote…', '');
      const record = await fetchFullQuote(id);
      restoreQuoteForm(record.form_data);
      currentQuoteId = null;
      document.getElementById('quoteNumber').value = generateQuoteNumber();
      document.getElementById('quoteDate').value =
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString().slice(0, 10);
      document.getElementById('quoteStatus').value = 'Quoted';
      document.getElementById('quoteNotes').value =
        record.notes ? record.notes + '\n\nDuplicated from ' + record.quote_number : '';
      showCurrentRecord(null);
      showTab('setupTab');
      calculateAll();
      setDbMessage('Copy created. Adjust it, then click Save Quote.', 'success');
    } catch (error) {
      setDbMessage(error.message, 'error');
    }
  }

  function duplicateCurrentQuote() {
    currentQuoteId = null;
    document.getElementById('quoteNumber').value = generateQuoteNumber();
    document.getElementById('quoteDate').value =
      new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);
    document.getElementById('quoteStatus').value = 'Quoted';
    showCurrentRecord(null);
    calculateAll();
  }

  async function deleteSavedQuote(id) {
    if (!(await ensureDatabaseReady())) return;
    if (!window.confirm('Delete this saved quote? This cannot be undone.')) return;

    const result = await supabaseClient
      .from('quotes')
      .delete()
      .eq('id', id);

    if (result.error) {
      setDbMessage(result.error.message, 'error');
      return;
    }

    if (currentQuoteId === id) {
      currentQuoteId = null;
      showCurrentRecord(null);
    }

    setDbMessage('Quote deleted.', 'success');
    await loadSavedQuotes();
  }
