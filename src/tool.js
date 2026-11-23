/*! Eretek Online Araçlar #98 — Denetim Kanıt ve Aksiyon Takibi */
ERT.def('98', {
	run: function (v, c) {
		var pd = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); if (m) { return Date.UTC(+m[1], +m[2] - 1, +m[3]); } m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s); return m ? Date.UTC(+m[3], +m[2] - 1, +m[1]) : NaN; };
		var r = c.csv(v.csv, 'csv', 5000), H = r.head, col = function (n) { return ERT.csv.col(H, n); }, D = 86400000;
		var iC = col(['control', 'kontrol', 'clause', 'madde']), iF = col(['finding', 'bulgu', 'action', 'aksiyon', 'befund']), iO = col(['owner', 'sorumlu', 'verantwortlich']), iD = col(['due', 'due_date', 'termin', 'hedef_tarih']), iS = col(['status', 'durum']), iE = col(['evidence', 'kanit', 'nachweis']);
		if (iF < 0 || iD < 0 || iS < 0) { throw c.fe('csv', 'col', { c: 'control, finding, owner, due, status, evidence' }); }
		var t0 = new Date(), ref = v.ref ? Date.parse(v.ref + 'T00:00:00Z') : Date.UTC(t0.getFullYear(), t0.getMonth(), t0.getDate()), soon = (v.soon || 14);
		var norm = function (s) { s = ERT.norm(s); if (/^(closed|done|kapali|tamam|tamamlandi|erledigt|geschlossen)/.test(s)) { return 'closed'; } if (/^(in progress|progress|devam|surec|in bearbeitung|wip)/.test(s)) { return 'prog'; } if (/^(open|acik|offen|new|yeni)/.test(s)) { return 'open'; } return null; };
		var rows = [], cls = [], cnt = { overdue: 0, soon: 0, closed: 0, open: 0, noEv: 0 }, own = {};
		r.rows.forEach(function (x, i) {
			var d = pd(x[iD] || ''), s = norm(x[iS] || ''); if (isNaN(d) || !s) { throw c.fe('csv', 'row', { r: i + 2 }); }
			var ev = iE >= 0 ? (x[iE] || '').trim() : '', o = iO >= 0 ? x[iO] || '–' : '–', left = Math.round((d - ref) / D), f = [], lvl = 'ok';
			own[o] = own[o] || { open: 0, overdue: 0, closed: 0 };
			if (s === 'closed') { cnt.closed++; own[o].closed++; if (!ev) { cnt.noEv++; f.push(c.t('noEv')); lvl = 'warn'; } }
			else { cnt.open++; own[o].open++; if (left < 0) { cnt.overdue++; own[o].overdue++; f.push(c.t('late', { d: -left })); lvl = 'err'; } else if (left <= soon) { cnt.soon++; f.push(c.t('soonF', { d: left })); lvl = 'warn'; } }
			rows.push([iC >= 0 ? x[iC] : '', x[iF], o, new Date(d).toISOString().slice(0, 10), c.t('s_' + s), ev || '–', f.join('; ') || '–']); cls.push(lvl);
		});
		var orow = Object.keys(own).sort().map(function (o) { return [o, own[o].open, own[o].overdue, own[o].closed]; });
		var msgs = [cnt.overdue ? ['err', c.t('mOver', { n: cnt.overdue })] : ['ok', c.t('mNoOver')]];
		if (cnt.soon) { msgs.push(['warn', c.t('mSoon', { n: cnt.soon, d: soon })]); } if (cnt.noEv) { msgs.push(['warn', c.t('mNoEv', { n: cnt.noEv })]); }
		msgs.push(['info', c.t('ref', { d: new Date(ref).toISOString().slice(0, 10) })]);
		var cols = [c.t('c_c'), c.t('c_f'), c.t('c_o'), c.t('c_d'), c.t('c_s'), c.t('c_e'), c.t('c_x')], ocols = [c.t('c_o'), c.t('c_open'), c.t('c_late'), c.t('c_closed')];
		return { big: c.t('big', { o: cnt.open, l: cnt.overdue, c: cnt.closed }), msgs: msgs, tables: [{ cols: cols, rows: rows, cls: cls }, { h: c.t('h_own'), cols: ocols, rows: orow }], x: { xlsx: { name: 'audit-actions', sheets: [{ name: c.t('sh1'), cols: cols, rows: rows }, { name: c.t('h_own'), cols: ocols, rows: orow }] }, csv: { name: 'audit-actions', cols: cols, rows: rows } }, v: cnt };
	}
});
