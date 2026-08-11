// ═══════════════════════════════════════════
//  TERMUX BRIDGE - CODESPACE SIDE
// ═══════════════════════════════════════════

// Tambahkan endpoint ping untuk pengecekan
app.get('/ping', (req, res) => {
    res.send('pong');
});

// Endpoint info
app.get('/info', (req, res) => {
    res.json({
        os: `${os.type()} ${os.release()}`,
        uptime: getUptime(),
        node: process.version,
        memory: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`,
        cpus: os.cpus().length,
        hostname: os.hostname()
    });
});

// Socket.IO handler untuk Termux Bridge
io.on('connection', (socket) => {
    console.log(`🔗 Termux Bridge connected: ${socket.id}`);
    
    // Kirim welcome message
    socket.emit('status-update', { message: 'Connected to Codespace. Root access granted.' });
    
    // Execute command dari Termux
    socket.on('execute-command', (data) => {
        const { command } = data;
        console.log(`[TERMUX CMD] ${command}`);
        
        exec(command, { timeout: 25000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
            if (error) {
                socket.emit('command-result', {
                    output: stdout,
                    error: stderr || error.message,
                    exitCode: error.code
                });
            } else {
                socket.emit('command-result', {
                    output: stdout,
                    error: stderr,
                    exitCode: 0
                });
            }
        });
    });
    
    // Upload file dari Termux
    socket.on('upload-file', (data) => {
        const { filename, content } = data;
        const uploadDir = path.join(__dirname, 'termux-uploads');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, filename);
        
        try {
            fs.writeFileSync(filePath, Buffer.from(content, 'base64'));
            socket.emit('upload-complete', { path: filePath, size: fs.statSync(filePath).size });
            console.log(`[UPLOAD] ${filename} -> ${filePath}`);
        } catch (e) {
            socket.emit('upload-error', { error: e.message });
        }
    });
    
    // File request dari Termux
    socket.on('download-file', (data) => {
        const { path: filePath } = data;
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath).toString('base64');
            socket.emit('file-received', {
                filename: path.basename(filePath),
                content: content
            });
        } else {
            socket.emit('file-error', { error: 'File not found' });
        }
    });
    
    socket.on('disconnect', () => {
        console.log(`❌ Termux Bridge disconnected: ${socket.id}`);
    });
});
