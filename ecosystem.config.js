module.exports = {
    apps: [{
        name: 'jdboxNode',
        script: './server.js',
        instances: "max",
        exec_mode: 'cluster',
        node_args: ["--max_old_space_size=500"]
    }],
};
