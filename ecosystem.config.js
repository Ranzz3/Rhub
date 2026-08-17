module.exports = {
    apps: [
        {
            name: 'ranz-worm-v4',
            script: 'server.js',
            instances: 1,
            autorestart: false,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                RANZ_MODE: 'ultimate',
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/tmp/ranz_error.log',
            out_file: '/tmp/ranz_output.log',
            merge_logs: true,
        }
    ]
};
