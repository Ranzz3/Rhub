// ═══════════════════════════════════════════
//  TERMUX BRIDGE - COMMAND HANDLER
// ═══════════════════════════════════════════

io.on('connection', (socket) => {
    console.log(`🔗 Termux connected: ${socket.id}`);
    
    socket.join('termux-clients');
    
    socket.emit('status-update', {
        message: 'Connected to Codespace. All commands are Codespace commands.',
        serverInfo: {
            os: `${os.type()} ${os.release()}`,
            node: process.version,
            uptime: getUptime(),
            cwd: process.cwd(),
            hostname: os.hostname()
        }
    });
    
    // Execute command (MAIN HANDLER)
    socket.on('execute-command', (data) => {
        const { command, cwd } = data;
        console.log(`[TERMUX] ${command}`);
        
        const { exec } = require('child_process');
        exec(command, {
            timeout: 60000,
            maxBuffer: 50 * 1024 * 1024,
            cwd: cwd || process.cwd(),
            env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: '1' },
            shell: '/bin/bash'
        }, (error, stdout, stderr) => {
            socket.emit('command-result', {
                output: stdout || '',
                error: stderr || (error ? error.message : ''),
                exitCode: error ? error.code : 0,
                cwd: cwd || process.cwd()
            });
        });
    });
    
    // Upload file
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
    
    // Download file
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
        console.log(`❌ Termux disconnected: ${socket.id}`);
    });
});
