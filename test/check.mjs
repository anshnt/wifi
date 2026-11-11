// node test/check.mjs : parser self-check and a privacy scan of everything published.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const src = html.match(/<script id="parsers">([\s\S]*?)<\/script>/)[1];
const p = {};
vm.runInNewContext(src + ';Object.assign(out,{pageBody,signedOut,parseStatus,parseStations,parseWan,parseLog,reading})', { out: p });

const wrap = (t) => `Title: x\nURL: http://192.168.1.1/cgi-bin/x.cgi\nSource element: <body>\n---\n${t}\n\nTab Context:\n- tab`;
const status = p.pageBody(wrap('System Uptime:\t2 days: 22 hours: 36 minutes\nPPPoE UpTime:\t1 days: 3 hours: 5 minutes: 12 seconds\n  - CPU Usage:\t\n \n\t07%\n  - Memory Free:\t\n \n\t45%\n2.4G WLAN Information :\t\n  - Status:\tOn\n  - Channel:\t6\n  - Operating Bandwidth:\t20MHz\n5G WLAN Information :\t\n  - Status:\tOn\n  - Channel:\t36\n  - Operating Bandwidth:\t80MHz\nFirewall Status\nWAN Link Status :\tUp\nPPPoE Connection Status :\tUp'));
const s = p.parseStatus(status);
assert.deepEqual([s.cpu, s.mem, s.up.d, s.ppp.h, s.r24.ch, s.r24.bw, s.r5.ch, s.r5.bw, s.wan, s.pppState], [7, 45, 2, 3, '6', '20', '36', '80', 'Up', 'Up']);
assert.equal(p.signedOut('Please enter username and password to login.'), true);

const J = (x) => JSON.parse(JSON.stringify(x));
const st = J(p.parseStations('#\tMAC Address\tRSSI (dbm)\tAssociated\n1\t02:00:00:00:00:0a\t-78\tyes\n2\t02:00:00:00:00:0b\t-68\tyes'));
assert.deepEqual(st.map((x) => x.rssi), [-78, -68]);
assert.equal(st[0].mac, '02:00:00:00:00:0A');

const w = p.parseWan('PPPoE\n 2:22:42: 3 \n 100\n 0\n 5000\n 200\n 0\n 9000\n IPoE');
assert.deepEqual([w.txBytes, w.rxBytes, w.errors], [5000, 9000, 0]);

const l = J(p.parseLog('1\tNov 10 19:52:45\tINFO\treceived REQUEST from client (Request IP:192.168.1.7),  Mac 02:00:00:00:00:07\n2\tNov 11 00:23:18\tINFO\treceived DISCOVER from client, (Request IP : 0.0.0.0 ), Mac 02:00:00:00:00:07'));
assert.deepEqual([l.total, l.per['02:00:00:00:00:07'].renew, l.per['02:00:00:00:00:07'].rejoin], [2, 1, 1]);
assert.deepEqual([p.reading(-60), p.reading(-70), p.reading(-80)], ['good', 'fair', 'weak']);

// privacy: no hardware IDs, no public IPs, no ISP account, no network name (checked by hash so the name never lands here)
const BLOCKED_HASHES = new Set(['f9c9baac9006160a6d84a09e77cbfeac349c861513e1786ea447e00198068e20']);
const files = (d) => readdirSync(d).flatMap((f) => (f.startsWith('.') || f === 'node_modules' ? [] : statSync(`${d}/${f}`).isDirectory() ? files(`${d}/${f}`) : [`${d}/${f}`]));
for (const f of files(new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'))) {
  if (!/\.(html|md|js|mjs|json|css|txt|yml)$/.test(f) || f.endsWith('check.mjs')) continue;
  const t = readFileSync(f, 'utf8');
  const mac = (t.match(/\b[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}\b/g) || []).filter((m) => !/^02:00:00:00:00:/i.test(m));
  assert.deepEqual(mac, [], `${f}: hardware address`);
  const ips = (t.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || []).filter((ip) => !/^(192\.168\.|0\.0\.0\.0|1\.1\.1\.1|8\.8\.8\.8)/.test(ip));
  assert.deepEqual(ips, [], `${f}: public IP`);
  assert.ok(!/@airtelbroadband|ims\.airtel|\b2401:4900:[0-9a-f:]+/i.test(t), `${f}: ISP account or address`);
  for (const word of t.match(/[A-Za-z]{4,}/g) || []) assert.ok(!BLOCKED_HASHES.has(createHash('sha256').update(word.toLowerCase()).digest('hex')), `${f}: network name`);
}
console.log('ok');
