const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const os = require('os');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Jimp = require('jimp');
const QrCodeReader = require('qrcode-reader');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// ═══════════════════════════════════════════
//  KONFIGURASI
// ═══════════════════════════════════════════
const TOKEN = '8650738683:AAGwbBb5oDu0pCOh3ptfZAsoLnDeSmORvLU';
const OWNER = '1402999777';
const DATA_FILE = './data.json';
const TEMP_DIR = './temp';
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════
//  INISIALISASI
// ═══════════════════════════════════════════
fs.ensureDirSync(TEMP_DIR);

// Database
let DB = { users: [], bans: [] };
if (fs.existsSync(DATA_FILE)) {
    try { DB = fs.readJsonSync(DATA_FILE); } 
    catch { DB = { users: [], bans: [] }; }
}
const saveDB = () => fs.writeJsonSync(DATA_FILE, DB, { spaces: 2 });

// Express + Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 50 * 1024 * 1024,
    pingTimeout: 60000,
    pingInterval: 25000
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// Bot Telegram
const bot = new TelegramBot(TOKEN, { polling: true });

// ═══════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════
const sendMsg = (id, text, opts) => bot.sendMessage(id, text, opts).catch(() => {});
const reply = (msg, text, opts) => bot.sendMessage(msg.chat.id, text, { reply_to_message_id: msg.message_id, ...opts }).catch(() => {});
const editMsg = (chatId, msgId, text, opts) => bot.editMessageText(text, { chat_id: chatId, message_id: msgId, ...opts }).catch(() => {});
const delMsg = (chatId, msgId) => bot.deleteMessage(chatId, msgId).catch(() => {});
const isOwner = (msg) => String(msg.from.id) === OWNER;
const getUptime = () => {
    const s = Math.floor(process.uptime());
    const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60);
    return `${d}d ${h}h ${m}m ${s%60}s`;
};

// Loading box
const frames = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
const makeBox = (pct, frame, text) => {
    const bar = '█'.repeat(Math.floor(pct/10)) + '░'.repeat(10 - Math.floor(pct/10));
    return `\`\`\`\n┌─────────────────────┐\n│  ${frames[frame]} ${text.padEnd(16)} │\n│  [${bar}] ${pct}%  │\n└─────────────────────┘\n\`\`\``;
};

// ═══════════════════════════════════════════
//  MIDDLEWARE
// ═══════════════════════════════════════════
bot.on('message', (msg) => {
    if (msg.text && DB.bans.includes(String(msg.from.id))) {
        return reply(msg, '🚫 Anda dibanned.');
    }
});

const hasAccess = (msg) => isOwner(msg) || DB.users.some(u => u.id === String(msg.from.id) && u.verified);
const withAccess = (fn) => (msg, match) => {
    if (!hasAccess(msg)) return reply(msg, '🔒 Gunakan /akses untuk request.');
    fn(msg, match);
};

// ═══════════════════════════════════════════
//  /start
// ═══════════════════════════════════════════
bot.onText(/\/start/, (msg) => {
    reply(msg, `╔══════════════════════╗\n║  🐍 RANZ BOT ONLINE  ║\n╠══════════════════════╣\n║ /menu — Semua fitur\n║ /akses — Request akses\n╚══════════════════════╝`);
});

// ═══════════════════════════════════════════
//  /akses
// ═══════════════════════════════════════════
bot.onText(/\/akses/, (msg) => {
    const u = msg.from;
    const uid = String(u.id);
    if (uid === OWNER) return reply(msg, '✅ Anda Owner.');
    if (DB.users.find(x => x.id === uid && x.verified)) return reply(msg, '✅ Sudah terverifikasi.');
    
    const kode = String(Math.floor(100000 + Math.random() * 900000));
    const ex = DB.users.find(x => x.id === uid);
    if (ex) ex.kode = kode;
    else DB.users.push({ id: uid, username: u.username || '', first_name: u.first_name || '', kode, verified: false, joined: Date.now() });
    saveDB();
    
    sendMsg(OWNER, `🔐 *PERMINTAAN AKSES*\n\n👤 ${u.first_name}\n👥 @${u.username || '-'}\n🆔 \`${uid}\`\n🔑 *${kode}*\n\n/terima ${uid} | /tolak ${uid}`, { parse_mode: 'Markdown' });
    reply(msg, `✅ Kode: *${kode}*\nTunggu konfirmasi Owner.`, { parse_mode: 'Markdown' });
});

bot.onText(/\/terima (.+)/, (msg, match) => {
    if (!isOwner(msg)) return;
    const u = DB.users.find(x => x.id === match[1].trim());
    if (!u) return reply(msg, '❌ Tidak ditemukan.');
    u.verified = true;
    saveDB();
    reply(msg, `✅ ${u.first_name} diterima.`);
    sendMsg(u.id, '✅ Akses diterima! /menu');
});

bot.onText(/\/tolak (.+)/, (msg, match) => {
    if (!isOwner(msg)) return;
    const u = DB.users.find(x => x.id === match[1].trim());
    if (!u) return reply(msg, '❌ Tidak ditemukan.');
    DB.users = DB.users.filter(x => x.id !== u.id);
    saveDB();
    reply(msg, `❌ ${u.first_name} ditolak.`);
    sendMsg(u.id, '❌ Akses ditolak.');
});

// ═══════════════════════════════════════════
//  /menu
// ═══════════════════════════════════════════
bot.onText(/\/menu/, withAccess((msg) => {
    reply(msg, `╔══════════════════════════════╗
║   🐍 RANZ BOT — 53 MENU   ║
╠══════════════════════════════╣
║ /ping /info /uptime /time   ║
║ /date /calc /tr /qrgen      ║
║ /qrscan /ipinfo /whois      ║
║ /dns /pingweb /headers      ║
║ /ssweb /cweb /source        ║
║ /links /title /google       ║
║ /yt /wiki /github /npm      ║
║ /encrypt /decrypt /hash     ║
║ /b64e /b64d /random /uuid   ║
║ /pass /count /reverse       ║
║ /userlist /ban /unban       ║
║ /stats /bc /joke /quote     ║
║ /fact /dice /coin /say      ║
╚══════════════════════════════╝`, { parse_mode: 'Markdown' });
}));

// ═══════════════════════════════════════════
//  SEMUA FUNGSI (53)
// ═══════════════════════════════════════════
bot.onText(/\/ping/, withAccess((msg) => reply(msg, `🏓 ${Date.now() - msg.date*1000}ms`)));
bot.onText(/\/uptime/, withAccess((msg) => reply(msg, `⏱️ ${getUptime()}`)));
bot.onText(/\/time/, withAccess((msg) => reply(msg, `🕐 ${moment().format('HH:mm:ss')}`)));
bot.onText(/\/date/, withAccess((msg) => reply(msg, `📅 ${moment().format('DD MMMM YYYY')}`)));

bot.onText(/\/info/, withAccess(async (msg) => {
    reply(msg, `╔══════════════════════╗
║ 🖥️ SERVER INFO
╠══════════════════════╣
║ OS: ${os.type()}
║ CPU: ${os.cpus()[0].model}
║ RAM: ${(os.totalmem()/1024/1024/1024).toFixed(1)} GB
║ Node: ${process.version}
║ Uptime: ${getUptime()}
║ Users: ${DB.users.length}
║ Banned: ${DB.bans.length}
╚══════════════════════╝`);
}));

bot.onText(/\/calc (.+)/, withAccess((msg, match) => {
    try { reply(msg, `🧮 ${match[1]} = ${eval(match[1])}`); }
    catch { reply(msg, '❌ Error.'); }
}));

bot.onText(/\/tr (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(match[1])}&langpair=auto|id`);
        reply(msg, `🌐 ${r.data.responseData.translatedText}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/qrgen (.+)/, withAccess(async (msg, match) => {
    const f = path.join(TEMP_DIR, `qr_${Date.now()}.png`);
    await QRCode.toFile(f, match[1], { width: 400 });
    bot.sendPhoto(msg.chat.id, f, { reply_to_message_id: msg.message_id });
    setTimeout(() => fs.remove(f), 5000);
}));

bot.onText(/\/qrscan/, withAccess(async (msg) => {
    if (!msg.reply_to_message?.photo) return reply(msg, '❌ Balas foto QR.');
    try {
        const p = msg.reply_to_message.photo[msg.reply_to_message.photo.length-1];
        const url = await bot.getFileLink(p.file_id);
        const fp = path.join(TEMP_DIR, `scan_${Date.now()}.png`);
        const r = await axios({ url, responseType: 'arraybuffer' });
        fs.writeFileSync(fp, Buffer.from(r.data));
        const img = await Jimp.read(fp);
        const qr = new QrCodeReader();
        qr.callback = (err, val) => {
            fs.removeSync(fp);
            if (err) reply(msg, '❌ QR tidak terdeteksi.');
            else reply(msg, `✅ \`${val.result}\``, { parse_mode: 'Markdown' });
        };
        qr.decode(img.bitmap);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/ipinfo (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`http://ip-api.com/json/${match[1]}`);
        reply(msg, `🌍 IP: ${r.data.query}\n📍 ${r.data.city}, ${r.data.country}\n🏢 ${r.data.isp}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/whois (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://api.domainsdb.info/v1/domains/search?domain=${match[1]}`);
        if (!r.data.domains?.length) return reply(msg, '❌ Tidak ditemukan.');
        const d = r.data.domains[0];
        reply(msg, `🌐 ${d.domain}\n📅 ${d.create_date}\n⏰ ${d.expire_date}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/dns (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://dns.google/resolve?name=${match[1]}&type=A`);
        const rec = r.data.Answer?.map(a=>a.data).join('\n') || 'Tidak ada.';
        reply(msg, `📡 ${match[1]}:\n${rec}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/pingweb (.+)/, withAccess(async (msg, match) => {
    const url = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
    const start = Date.now();
    try { await axios.get(url, { timeout: 10000 }); reply(msg, `✅ Online — ${Date.now()-start}ms`); }
    catch { reply(msg, `❌ Offline — ${Date.now()-start}ms`); }
}));

bot.onText(/\/headers (.+)/, withAccess(async (msg, match) => {
    try {
        const url = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
        const r = await axios.get(url);
        reply(msg, `📋\n\`\`\`json\n${JSON.stringify(r.headers, null, 2).substring(0, 3500)}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/ssweb (.+)/, withAccess(async (msg, match) => {
    const url = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
    reply(msg, '⏳ Screenshot...');
    try {
        const r = await axios.get(`https://image.thum.io/get/width/800/crop/600/${encodeURIComponent(url)}`, { responseType: 'arraybuffer' });
        const f = path.join(TEMP_DIR, `ss_${Date.now()}.png`);
        fs.writeFileSync(f, Buffer.from(r.data));
        bot.sendPhoto(msg.chat.id, f, { caption: url });
        setTimeout(() => fs.remove(f), 5000);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/cweb (.+)/, withAccess(async (msg, match) => {
    const url = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
    const chatId = msg.chat.id;
    
    let lm;
    try { lm = await reply(msg, makeBox(0, 0, 'Memulai...')); } catch { return; }
    const mid = lm.message_id;
    let pct = 0, frame = 0;
    
    const iv = setInterval(() => {
        frame = (frame+1)%10;
        if (pct < 85) pct += Math.floor(Math.random()*10)+3;
        if (pct > 85) pct = 85;
        editMsg(chatId, mid, makeBox(pct, frame, 'Mendownload...'));
    }, 500);
    
    try {
        const r = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            maxRedirects: 5, timeout: 30000, responseType: 'text'
        });
        clearInterval(iv);
        await editMsg(chatId, mid, makeBox(100, 9, 'Selesai!'));
        await new Promise(r=>setTimeout(r,500));
        await delMsg(chatId, mid);
        
        const $ = cheerio.load(r.data);
        $('head').prepend(`<base href="${url}">`);
        const html = $.html();
        const sizeKB = (Buffer.byteLength(html,'utf8')/1024).toFixed(1);
        const domain = new URL(url).hostname;
        const fn = `${domain}_${moment().format('YYYYMMDD_HHmmss')}.html`;
        const fp = path.join(TEMP_DIR, fn);
        fs.writeFileSync(fp, html, 'utf8');
        
        await bot.sendDocument(chatId, fp, {
            caption: `╔══════════════════════╗\n║ ✅ COPY WEB SUKSES\n╠══════════════════════╣\n║ URL: ${url}\n║ Size: ${sizeKB} KB\n║ File: ${fn}\n╚══════════════════════╝`,
            reply_to_message_id: msg.message_id
        });
        console.log(`[CWEB] ✅ ${url} -> ${fn} (${sizeKB} KB)`);
        setTimeout(() => fs.remove(fp), 15000);
    } catch(e) {
        clearInterval(iv);
        await delMsg(chatId, mid);
        reply(msg, `❌ Gagal: ${e.message}`);
    }
}));

bot.onText(/\/source (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(match[1]);
        reply(msg, `\`\`\`html\n${r.data.substring(0, 4000)}\n\`\`\``, { parse_mode: 'Markdown' });
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/links (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(match[1]);
        const $ = cheerio.load(r.data);
        const links = [];
        $('a[href]').each((i,el) => { const h = $(el).attr('href'); if(h && !h.startsWith('#')) links.push(h); });
        reply(msg, `🔗 ${[...new Set(links)].slice(0,30).join('\n')}`, { disable_web_page_preview: true });
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/title (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(match[1]);
        const $ = cheerio.load(r.data);
        reply(msg, `📝 ${$('title').text() || 'Tidak ada'}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/google (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(match[1])}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(r.data);
        const results = [];
        $('h3').each((i,el) => { if(results.length<5) results.push(`${i+1}. ${$(el).text()}`); });
        reply(msg, results.join('\n') || 'Tidak ada.');
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/yt (.+)/, withAccess((msg, match) => reply(msg, `🔗 https://youtube.com/results?search_query=${encodeURIComponent(match[1])}`)));
bot.onText(/\/wiki (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(match[1])}`);
        reply(msg, `📚 *${r.data.title}*\n${r.data.extract?.substring(0,800)}...`, { parse_mode: 'Markdown' });
    } catch { reply(msg, '❌ Tidak ditemukan.'); }
}));

bot.onText(/\/github (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://api.github.com/users/${match[1]}`);
        reply(msg, `👤 ${r.data.login}\n📦 ${r.data.public_repos} repos\n👥 ${r.data.followers} followers\n🔗 ${r.data.html_url}`);
    } catch { reply(msg, '❌ Tidak ditemukan.'); }
}));

bot.onText(/\/npm (.+)/, withAccess(async (msg, match) => {
    try {
        const r = await axios.get(`https://registry.npmjs.org/${match[1]}`);
        reply(msg, `📦 ${r.data.name} v${r.data['dist-tags']?.latest}\n📝 ${r.data.description?.substring(0,200)}`);
    } catch { reply(msg, '❌ Tidak ditemukan.'); }
}));

bot.onText(/\/encrypt (.+)/, withAccess((msg, match) => {
    try {
        const c = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync('ranz','salt',32), Buffer.alloc(16,0));
        let e = c.update(match[1],'utf8','hex'); e += c.final('hex');
        reply(msg, `🔒 \`${e}\``, { parse_mode: 'Markdown' });
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/decrypt (.+)/, withAccess((msg, match) => {
    try {
        const d = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync('ranz','salt',32), Buffer.alloc(16,0));
        let t = d.update(match[1],'hex','utf8'); t += d.final('utf8');
        reply(msg, `🔓 ${t}`);
    } catch { reply(msg, '❌ Gagal.'); }
}));

bot.onText(/\/hash (.+)/, withAccess((msg, match) => {
    reply(msg, `#️⃣ MD5: \`${crypto.createHash('md5').update(match[1]).digest('hex')}\`\nSHA256: \`${crypto.createHash('sha256').update(match[1]).digest('hex')}\``, { parse_mode: 'Markdown' });
}));

bot.onText(/\/b64e (.+)/, withAccess((msg, match) => reply(msg, `📝 \`${Buffer.from(match[1]).toString('base64')}\``, { parse_mode: 'Markdown' })));
bot.onText(/\/b64d (.+)/, withAccess((msg, match) => {
    try { reply(msg, `📝 ${Buffer.from(match[1],'base64').toString('utf8')}`); }
    catch { reply(msg, '❌ Invalid.'); }
}));

bot.onText(/\/random/, withAccess((msg) => reply(msg, `🎲 ${Math.floor(Math.random()*999999)}`)));
bot.onText(/\/uuid/, withAccess((msg) => reply(msg, `🆔 \`${crypto.randomUUID()}\``, { parse_mode: 'Markdown' })));
bot.onText(/\/pass/, withAccess((msg) => {
    const ch = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let p = ''; for(let i=0;i<16;i++) p += ch[Math.floor(Math.random()*ch.length)];
    reply(msg, `🔑 \`${p}\``, { parse_mode: 'Markdown' });
}));

bot.onText(/\/count (.+)/, withAccess((msg, match) => reply(msg, `📏 ${match[1].length} karakter, ${match[1].split(/\s+/).length} kata`)));
bot.onText(/\/reverse (.+)/, withAccess((msg, match) => reply(msg, `🔄 ${match[1].split('').reverse().join('')}`)));

// ═══════════════════════════════════════════
//  USER MANAGEMENT (Owner)
// ═══════════════════════════════════════════
bot.onText(/\/userlist/, (msg) => {
    if (!isOwner(msg)) return reply(msg, '🔒 Owner only.');
    const list = DB.users.map((u,i) => `${i+1}. ${u.first_name} (@${u.username||'-'}) [${u.id}] ${u.verified?'✅':'⏳'}`).join('\n');
    reply(msg, `👥 Users (${DB.users.length}):\n${list||'Kosong.'}\n\n🚫 Banned: ${DB.bans.length}`);
});

bot.onText(/\/ban (.+)/, (msg, match) => {
    if (!isOwner(msg)) return;
    const t = match[1].replace('@','').trim();
    const u = DB.users.find(x => x.id===t || x.username===t);
    const id = u ? u.id : t;
    if (DB.bans.includes(id)) return reply(msg, '❌ Sudah banned.');
    DB.bans.push(id);
    saveDB();
    reply(msg, `🚫 ${u?.first_name || id} banned.`);
});

bot.onText(/\/unban (.+)/, (msg, match) => {
    if (!isOwner(msg)) return;
    const t = match[1].trim();
    DB.bans = DB.bans.filter(id => id !== t);
    saveDB();
    reply(msg, '✅ Unbanned.');
});

bot.onText(/\/stats/, (msg) => {
    if (!isOwner(msg)) return reply(msg, '🔒 Owner only.');
    reply(msg, `📊 Users: ${DB.users.length}\n✅ Verified: ${DB.users.filter(u=>u.verified).length}\n🚫 Banned: ${DB.bans.length}\n⏱️ ${getUptime()}`);
});

bot.onText(/\/bc (.+)/, (msg, match) => {
    if (!isOwner(msg)) return;
    const text = match[1];
    let sent = 0;
    DB.users.filter(u=>u.verified).forEach(u => {
        sendMsg(u.id, `📢 *Broadcast:*\n${text}`, { parse_mode: 'Markdown' }).then(()=>sent++).catch(()=>{});
    });
    setTimeout(() => reply(msg, `✅ Terkirim ke ${sent} user.`), 3000);
});

// ═══════════════════════════════════════════
//  FUN
// ═══════════════════════════════════════════
bot.onText(/\/joke/, withAccess((msg) => {
    const jokes = ['Kenapa programmer suka kopi? Karena error.','Debugging: being detective in your own crime.','HTTP 404: Story not found.','Programmer: coffee → code converter.'];
    reply(msg, `😂 ${jokes[Math.floor(Math.random()*jokes.length)]}`);
}));

bot.onText(/\/quote/, withAccess((msg) => {
    reply(msg, '💬 "The only way to do great work is to love what you do." — Steve Jobs');
}));

bot.onText(/\/fact/, withAccess((msg) => {
    reply(msg, '🤯 Node.js dibuat dalam 10 hari oleh Ryan Dahl (2009).');
}));

bot.onText(/\/dice/, withAccess((msg) => reply(msg, `🎲 ${Math.floor(Math.random()*6)+1}`)));
bot.onText(/\/coin/, withAccess((msg) => reply(msg, `🪙 ${Math.random()>0.5?'HEAD':'TAIL'}`)));
bot.onText(/\/say (.+)/, withAccess((msg, match) => reply(msg, match[1])));

// ═══════════════════════════════════════════
//  API ENDPOINTS
// ═══════════════════════════════════════════
app.get('/', (req, res) => res.send(`🐍 Ranz Bot Online | Uptime: ${getUptime()} | Users: ${DB.users.length}`));

app.get('/ping', (req, res) => {
    res.send('pong');
});

app.get('/info', (req, res) => {
    res.json({
        os: `${os.type()} ${os.release()}`,
        uptime: getUptime(),
        node: process.version,
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
        cpus: os.cpus().length,
        hostname: os.hostname(),
        users: DB.users.length,
        banned: DB.bans.length,
        status: 'online'
    });
});

// ═══════════════════════════════════════════
//  SOCKET.IO - TERMUX BRIDGE
// ═══════════════════════════════════════════
io.on('connection', (socket) => {
    console.log(`🔗 Bridge connected: ${socket.id}`);
    
    socket.emit('status-update', { message: 'Connected to Codespace. Root access granted.' });
    
    // Execute command dari Termux
    socket.on('execute-command', (data) => {
        const { command } = data;
        console.log(`[TERMUX CMD] ${command}`);
        
        const { exec } = require('child_process');
        exec(command, { timeout: 25000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
            socket.emit('command-result', {
                output: stdout,
                error: stderr || (error ? error.message : ''),
                exitCode: error ? error.code : 0
            });
        });
    });
    
    // Upload file dari Termux
    socket.on('upload-file', (data) => {
        const { filename, content } = data;
        const dir = path.join(__dirname, 'termux-uploads');
        fs.ensureDirSync(dir);
        
        try {
            const fp = path.join(dir, filename);
            fs.writeFileSync(fp, Buffer.from(content, 'base64'));
            socket.emit('upload-complete', { path: fp, size: fs.statSync(fp).size });
            console.log(`[UPLOAD] ${filename} -> ${fp}`);
        } catch (e) {
            socket.emit('upload-error', { error: e.message });
        }
    });
    
    // Download file request dari Termux
    socket.on('download-file', (data) => {
        const fp = data.path;
        if (fs.existsSync(fp)) {
            const content = fs.readFileSync(fp).toString('base64');
            socket.emit('file-received', { filename: path.basename(fp), content });
        } else {
            socket.emit('file-error', { error: 'File not found' });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`❌ Bridge disconnected: ${socket.id}`);
    });
});

// ═══════════════════════════════════════════
//  ERROR HANDLERS
// ═══════════════════════════════════════════
bot.on('polling_error', (e) => console.error('Polling error:', e.message));
bot.on('error', (e) => console.error('Bot error:', e.message));
process.on('uncaughtException', (e) => console.error('Exception:', e.message));
process.on('unhandledRejection', (e) => console.error('Rejection:', e));

// ═══════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════
server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════╗
║   🐍 RANZ BOT CODESPACE       ║
╠══════════════════════════════════╣
║ Port    : ${PORT}
║ Owner   : ${OWNER}
║ Status  : ONLINE
║ Bridge  : Ready (Termux)
║ Users   : ${DB.users.length}
║ Uptime  : ${getUptime()}
╚══════════════════════════════════╝
    `);
    
    sendMsg(OWNER, `✅ *Bot Online!*\n🕐 ${moment().format('HH:mm DD/MM')}\n⏱️ ${getUptime()}\n🔗 Port: ${PORT}`, { parse_mode: 'Markdown' });
});

// Graceful shutdown
process.on('SIGINT', () => { saveDB(); sendMsg(OWNER, '🔴 Bot offline.').then(() => process.exit(0)); });
process.on('SIGTERM', () => { saveDB(); process.exit(0); });
