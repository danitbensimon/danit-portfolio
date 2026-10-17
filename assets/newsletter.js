// Email list: inline section + popup. Both submit to HubSpot form "Website email list (danitbensimon.com)".
// A Monday task enrolls new sign-ups into the Growth Factor nurture (Resend).
(function () {
  var PORTAL = '147616801', FORM = '9f81bdd3-ccbf-4cd7-9797-8a4231b5a6dc';
  var HOSTS = ['https://api-eu1.hsforms.com', 'https://api.hsforms.com'];
  var KEY = 'dbs_list_popup', DAYS = 14;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function cookie(name) { var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)')); return m ? m[1] : undefined; }

  function submit(email, segment) {
    var ctx = { pageUri: location.href, pageName: document.title };
    var hutk = cookie('hubspotutk'); if (hutk) ctx.hutk = hutk;
    var body = JSON.stringify({ fields: [{ name: 'email', value: email }, { name: 'gf_segment', value: segment }], context: ctx });
    var tryHost = function (i) {
      return fetch(HOSTS[i] + '/submissions/v3/integration/submit/' + PORTAL + '/' + FORM, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body })
        .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r; })
        .catch(function (e) { if (i + 1 < HOSTS.length) return tryHost(i + 1); throw e; });
    };
    return tryHost(0);
  }

  function wire(form) {
    var msg = form.querySelector('.list-msg'), btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email.value.trim(), seg = form.elements.gf_segment.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Enter a valid work email.'; msg.className = 'list-msg err'; form.elements.email.focus(); return; }
      if (!seg) { msg.textContent = 'Choose founder or marketing leader.'; msg.className = 'list-msg err'; form.elements.gf_segment.focus(); return; }
      btn.disabled = true; btn.textContent = 'Sending…'; msg.textContent = ''; msg.className = 'list-msg';
      submit(email, seg).then(function () {
        store(KEY, 'joined');
        form.classList.add('done');
        msg.textContent = "You're on the list. Your first email arrives on Monday.";
        msg.className = 'list-msg ok';
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Send me the plays';
        msg.textContent = "That didn't go through. Try again in a moment.";
        msg.className = 'list-msg err';
      });
    });
  }

  function init() {
    var section = document.getElementById('list');
    if (!section) return;
    wire(section.querySelector('form'));

    var dlg = document.getElementById('list-popup');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    wire(dlg.querySelector('form'));
    dlg.querySelector('.popup-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

    var seen = store(KEY);
    if (seen === 'joined' || (seen && Date.now() - Number(seen) < DAYS * 864e5)) return;
    var shown = false;
    function open() {
      if (shown || document.querySelector('#list .done')) return;
      shown = true; store(KEY, String(Date.now()));
      dlg.showModal();
    }
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    if (coarse) { setTimeout(open, 45000); }
    else {
      var armed = false; setTimeout(function () { armed = true; }, 5000);
      document.addEventListener('mouseout', function (e) { if (armed && !e.relatedTarget && e.clientY <= 0) open(); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
