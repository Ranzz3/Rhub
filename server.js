const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// ═══════════════════════════════════════════
//  KONFIGURASI
// ═══════════════════════════════════════════
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'termux-uploads');

// ═══════════════════════════════════════════
//  INISIALISASI
// ═══════════════════════════════════════════
fs.ensureDirSync(UPLOAD_DIR);

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    maxHttpBufferSize: 100 * 1024 * 1024,
    pingTimeout: 120000,
    pingInterval: 30000,
    transports: ['websocket', 'polling']
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

// ═══════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════
const getUptime = () => {
    const s = Math.floor(process.uptime());
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m ${s % 60}s`;
};

const getServerInfo = () => ({
    os: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
    uptime: getUptime(),
    node: process.version,
    memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
    cpus: os.cpus().length,
    cwd: process.cwd(),
    status: 'online',
    connectedClients: io.engine.clientsCount || 0
});

// ═══════════════════════════════════════════
//  API ENDPOINTS
// ═══════════════════════════════════════════

// Root
app.get('/', (req, res) => {
    res.send(`
╔══════════════════════════════════════╗
║   🐍 CODESPACE TERMUX BRIDGE      ║
╠══════════════════════════════════════╣
║ Status  : ONLINE                    ║
║ Uptime  : ${getUptime()}                  
║ Clients : ${io.engine.clientsCount || 0}                         
║ Port    : ${PORT}                         
╚══════════════════════════════════════╝
    `.trim());
});

// Ping (untuk pengecekan Termux)
app.get('/ping', (req, res) => {
    res.send('pong');
});

// Info lengkap
app.get('/info', (req, res) => {
    res.json(getServerInfo());
});

// ═══════════════════════════════════════════
//  SOCKET.IO - TERMUX BRIDGE HANDLER
// ═══════════════════════════════════════════
io.on('connection', (socket) => {
    const clientIP = socket.handshake.address;
    console.log(`\n🔗 Termux Connected!`);
    console.log(`   ID     : ${socket.id}`);
    console.log(`   IP     : ${clientIP}`);
    console.log(`   Total  : ${io.engine.clientsCount} client(s)\n`);
    
    // Kirim info server ke Termux
    socket.emit('status-update', {
        message: '✅ Connected to Codespace - All commands are Codespace commands',
        serverInfo: getServerInfo()
    });
    
    // ═══════════════════════════════════════
    //  EXECUTE COMMAND (FITUR UTAMA)
    // ═══════════════════════════════════════
    socket.on('execute-command', (data) => {
        const command = data.command || '';
        const cwd = data.cwd || process.cwd();
        
        console.log(`[TERMUX CMD] ${command}`);
        
        exec(command, {
            timeout: 60000,
            maxBuffer: 50 * 1024 * 1024,
            cwd: cwd,
            env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' },
            shell: '/bin/bash'
        }, (error, stdout, stderr) => {
            socket.emit('command-result', {
                output: stdout || '',
                error: stderr || (error ? error.message : ''),
                exitCode: error ? error.code : 0,
                cwd: cwd
            });
        });
    });
    
    // ═══════════════════════════════════════
    //  UPLOAD FILE (Termux -> Codespace)
    // ═══════════════════════════════════════
    socket.on('upload-file', (data) => {
        const { filename, content } = data;
        
        if (!filename || !content) {
            socket.emit('upload-error', { error: 'Filename dan content wajib diisi' });
            return;
        }
        
        try {
            const filePath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
            
            const stats = fs.statSync(filePath);
            
            socket.emit('upload-complete', {
                path: filePath,
                size: stats.size,
                filename: filename
            });
            
            console.log(`[UPLOAD] ✅ ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
        } catch (e) {
            socket.emit('upload-error', { error: e.message });
            console.log(`[UPLOAD] ❌ ${filename} - ${e.message}`);
        }
    });
    
    // ═══════════════════════════════════════
    //  DOWNLOAD FILE (Codespace -> Termux)
    // ═══════════════════════════════════════
    socket.on('download-file', (data) => {
        const filePath = data.path;
        
        if (!filePath) {
            socket.emit('file-error', { error: 'Path wajib diisi' });
            return;
        }
        
        if (!fs.existsSync(filePath)) {
            socket.emit('file-error', { error: `File tidak ditemukan: ${filePath}` });
            return;
        }
        
        try {
            const content = fs.readFileSync(filePath).toString('base64');
            const filename = path.basename(filePath);
            const stats = fs.statSync(filePath);
            
            socket.emit('file-received', {
                filename: filename,
                content: content,
                size: stats.size
            });
            
            console.log(`[DOWNLOAD] ✅ ${filename} -> Termux (${(stats.size / 1024).toFixed(1)} KB)`);
        } catch (e) {
            socket.emit('file-error', { error: e.message });
            console.log(`[DOWNLOAD] ❌ ${filePath} - ${e.message}`);
        }
    });
    
    // ═══════════════════════════════════════
    //  LIST DIRECTORY
    // ═══════════════════════════════════════
    socket.on('list-dir', (data) => {
        const dirPath = data.path || process.cwd();
        
        try {
            if (!fs.existsSync(dirPath)) {
                socket.emit('dir-result', { error: 'Directory tidak ditemukan', path: dirPath });
                return;
            }
            
            const items = fs.readdirSync(dirPath).map(name => {
                const fullPath = path.join(dirPath, name);
                const stats = fs.statSync(fullPath);
                return {
                    name: name,
                    isDirectory: stats.isDirectory(),
                    size: stats.size,
                    modified: stats.mtime.toISOString()
                };
            });
            
            socket.emit('dir-result', {
                path: dirPath,
                items: items
            });
        } catch (e) {
            socket.emit('dir-result', { error: e.message, path: dirPath });
        }
    });
    
    // ═══════════════════════════════════════
    //  DISCONNECT
    // ═══════════════════════════════════════
    socket.on('disconnect', (reason) => {
        console.log(`\n❌ Termux Disconnected!`);
        console.log(`   ID     : ${socket.id}`);
        console.log(`   Reason : ${reason}`);
        console.log(`   Total  : ${io.engine.clientsCount} client(s)\n`);
    });
});

// ═══════════════════════════════════════════
//  ERROR HANDLERS
// ═══════════════════════════════════════════
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// ═══════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════
server.listen(PORT, () => {
    const info = getServerInfo();
    console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║   🐍 CODESPACE TERMUX BRIDGE 🐍         ║
║                                          ║
╠══════════════════════════════════════════╣
║   Status   : ONLINE                      ║
║   Port     : ${PORT}                         
║   OS       : ${info.os}
║   Hostname : ${info.hostname}                  
║   Node     : ${info.node}                    
║   CWD      : ${info.cwd}
╠══════════════════════════════════════════╣
║   Waiting for Termux connection...       ║
║                                          ║
║   Test: curl http://localhost:${PORT}/ping  
║   Info: curl http://localhost:${PORT}/info  
║                                          ║
╚══════════════════════════════════════════╝
    `);
    
    console.log(`✅ Server ready. Waiting for Termux...\n`);
});

// ═══════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════
process.on('SIGINT', () => {
    console.log('\n⏳ Shutting down...');
    io.close();
    server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n⏳ Shutting down...');
    io.close();
    server.close(() => {
        process.exit(0);
    });
});
