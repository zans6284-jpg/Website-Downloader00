(function() {
    "use strict";

    const urlInput = document.getElementById('urlInput');
    const scanBtn = document.getElementById('scanBtn');
    const statusArea = document.getElementById('statusArea');
    const statusText = document.getElementById('statusText');
    const treeContainer = document.getElementById('treeContainer');
    const downloadBtn = document.getElementById('downloadBtn');

    // Suara klik (Web Audio)
    function playClickSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 800;
            gain.gain.value = 0.15;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } catch (_) {}
    }

    function animateClick(btn) {
        btn.classList.remove('click-effect');
        void btn.offsetWidth;
        btn.classList.add('click-effect');
        setTimeout(() => btn.classList.remove('click-effect'), 300);
    }

    // Data dummy struktur website
    function generateDummyTree(baseUrl) {
        const domain = new URL(baseUrl).hostname;
        return {
            name: domain,
            type: 'folder',
            children: [
                { name: 'index.html', type: 'file', size: '2.4 KB' },
                {
                    name: 'styles',
                    type: 'folder',
                    children: [
                        { name: 'main.css', type: 'file', size: '4.1 KB' },
                        { name: 'theme.css', type: 'file', size: '1.2 KB' },
                        { name: '.hidden.css', type: 'file', size: '0.8 KB', hidden: true }
                    ]
                },
                {
                    name: 'scripts',
                    type: 'folder',
                    children: [
                        { name: 'app.js', type: 'file', size: '8.3 KB' },
                        {
                            name: 'vendor',
                            type: 'folder',
                            children: [
                                { name: 'jquery.min.js', type: 'file', size: '32 KB' },
                                { name: 'bootstrap.min.js', type: 'file', size: '18 KB' }
                            ]
                        }
                    ]
                },
                {
                    name: 'assets',
                    type: 'folder',
                    children: [
                        {
                            name: 'images',
                            type: 'folder',
                            children: [
                                { name: 'logo.png', type: 'file', size: '45 KB' },
                                { name: 'bg.jpg', type: 'file', size: '120 KB' },
                                { name: '.secret.jpg', type: 'file', size: '10 KB', hidden: true }
                            ]
                        },
                        {
                            name: 'fonts',
                            type: 'folder',
                            children: [
                                { name: 'Roboto.woff2', type: 'file', size: '14 KB' }
                            ]
                        }
                    ]
                },
                { name: '.htaccess', type: 'file', size: '0.3 KB', hidden: true }
            ]
        };
    }

    function countFiles(node) {
        let count = 1;
        if (node.children) {
            node.children.forEach(c => count += countFiles(c));
        }
        return count;
    }

    function renderTree(node, container) {
        const div = document.createElement('div');
        div.className = 'tree-item ' + (node.type === 'folder' ? 'folder' : 'file') + (node.hidden ? ' hidden' : '');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.textContent = node.type === 'folder' ? '📁' : (node.hidden ? '🔒' : '📄');
        div.appendChild(iconSpan);

        const nameSpan = document.createElement('span');
        if (node.type === 'folder') nameSpan.className = 'folder-label';
        nameSpan.textContent = node.name + (node.size ? ` (${node.size})` : '');
        if (node.hidden) {
            const tag = document.createElement('span');
            tag.style.cssText = 'color:#ff7b7b; font-size:0.7rem; margin-left:8px; background:#2a1a1a; padding:0 8px; border-radius:10px;';
            tag.textContent = 'tersembunyi';
            nameSpan.appendChild(tag);
        }
        div.appendChild(nameSpan);
        container.appendChild(div);

        if (node.type === 'folder' && node.children) {
            const childContainer = document.createElement('div');
            childContainer.className = 'tree-children';
            container.appendChild(childContainer);
            node.children.forEach(child => renderTree(child, childContainer));
        }
    }

    function scanWebsite(url) {
        return new Promise((resolve, reject) => {
            try { new URL(url); } catch (_) { reject(new Error('URL tidak valid!')); return; }

            const steps = ['Menghubungkan ke server...', 'Mengambil daftar direktori...', 'Memetakan struktur file...', 'Mendeteksi file tersembunyi...', 'Scan selesai!'];
            let stepIndex = 0;
            statusArea.style.display = 'flex';
            treeContainer.style.display = 'none';
            downloadBtn.disabled = true;
            scanBtn.disabled = true;

            const interval = setInterval(() => {
                if (stepIndex < steps.length) {
                    statusText.textContent = steps[stepIndex];
                    stepIndex++;
                } else {
                    clearInterval(interval);
                    statusText.textContent = '✅ Scan berhasil! Menemukan ' + countFiles(generateDummyTree(url)) + ' file/folder.';
                    statusArea.querySelector('.spinner').style.display = 'none';

                    const treeData = generateDummyTree(url);
                    treeContainer.innerHTML = '';
                    renderTree(treeData, treeContainer);
                    treeContainer.style.display = 'block';

                    scanBtn.disabled = false;
                    downloadBtn.disabled = false;
                    playClickSound();
                    resolve(treeData);
                }
            }, 500);
        });
    }

    function downloadZip(treeData, baseUrl) {
        const zip = new JSZip();
        const domain = new URL(baseUrl).hostname;

        function addToZip(node, path) {
            if (node.type === 'file') {
                let content = `// file: ${node.name}\n// konten simulasi untuk demo Zyee.\n`;
                if (node.name.endsWith('.html')) content = `<!DOCTYPE html><html><head><title>${node.name}</title></head><body><h1>${node.name}</h1><p>Simulasi</p></body></html>`;
                else if (node.name.endsWith('.css')) content = `/* ${node.name} */\nbody { background: #000; color: #fff; }`;
                else if (node.name.endsWith('.js')) content = `// ${node.name}\nconsole.log('Hello from ${node.name}');`;
                else if (node.name.endsWith('.json')) content = JSON.stringify({ name: node.name, demo: true }, null, 2);
                else if (node.name.endsWith('.png') || node.name.endsWith('.jpg')) {
                    zip.file(path + node.name, 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', { base64: true });
                    return;
                }
                zip.file(path + node.name, content);
            } else if (node.type === 'folder') {
                const folderPath = path + node.name + '/';
                zip.file(folderPath + '.keep', '');
                if (node.children) {
                    node.children.forEach(child => addToZip(child, folderPath));
                }
            }
        }

        const rootPath = domain + '/';
        zip.file(rootPath + '.keep', '');
        if (treeData.children) {
            treeData.children.forEach(child => addToZip(child, rootPath));
        }

        zip.generateAsync({ type: 'blob' })
            .then(blob => {
                saveAs(blob, `${domain}_backup.zip`);
                playClickSound();
                statusText.textContent = '✅ Download ZIP berhasil!';
                statusArea.querySelector('.spinner').style.display = 'none';
            })
            .catch(err => {
                statusText.textContent = '❌ Gagal membuat ZIP: ' + err.message;
            });
    }

    // Event listener
    scanBtn.addEventListener('click', function() {
        playClickSound();
        animateClick(this);
        const url = urlInput.value.trim();
        if (!url) {
            statusText.textContent = '⚠️ Masukkan URL dulu, Tuan!';
            statusArea.style.display = 'flex';
            return;
        }
        scanWebsite(url).catch(err => {
            statusText.textContent = '❌ ' + err.message;
            scanBtn.disabled = false;
        });
    });

    downloadBtn.addEventListener('click', function() {
        playClickSound();
        animateClick(this);
        const url = urlInput.value.trim();
        if (!url) return;
        try {
            const treeData = generateDummyTree(url);
            downloadZip(treeData, url);
        } catch (err) {
            statusText.textContent = '❌ Error: ' + err.message;
        }
    });

    urlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') scanBtn.click();
    });

    // Inisialisasi tampilan
    statusArea.style.display = 'none';
    treeContainer.style.display = 'none';
})();
