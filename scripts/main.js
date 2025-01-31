const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const generateImageBtn = document.getElementById('generateImageBtn');

// 配置 marked 选项
marked.setOptions({
    breaks: true,  // 支持 GitHub 风格的换行
    gfm: true,     // 启用 GitHub 风格的 Markdown
    headerIds: true, // 为标题添加 id
    mangle: false,  // 不转义内联 HTML
    sanitize: false // 允许原始 HTML
});

// 初始化编辑器内容
const savedContent = localStorage.getItem('markdown-content');
if (savedContent) {
    editor.value = savedContent;
    preview.innerHTML = marked.parse(savedContent);
} else {
    // 首次打开时加载 README.md
    fetch('README.md')
        .then(response => response.text())
        .then(content => {
            editor.value = content;
            preview.innerHTML = marked.parse(content);
            localStorage.setItem('markdown-content', content);
        })
        .catch(error => {
            console.error('加载 README.md 失败:', error);
        });
}

// 实时预览
editor.addEventListener('input', () => {
    const content = editor.value;
    preview.innerHTML = marked.parse(content);
    // 自动保存到 localStorage
    localStorage.setItem('markdown-content', content);
});

// 清空按钮
clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空编辑器内容吗？')) {
        editor.value = '';
        preview.innerHTML = '';
        localStorage.removeItem('markdown-content');
    }
});

// 复制编辑区内容按钮
copyBtn.addEventListener('click', () => {
    const content = editor.value;
    copyToClipboard(content, copyBtn, '<i class="fas fa-copy mr-1"></i>');
});

// 复制预览区内容按钮
copyHtmlBtn.addEventListener('click', () => {
    const content = preview.innerHTML;
    copyRichText(content, copyHtmlBtn);
});

// 图片生成设置
const imageSettings = {
    backgroundColor: '#f1f5f9',
    borderStyle: 'simple',
    watermarkText: '由 MarkFlow 生成',
    padding: 'medium'
};

// 从本地存储加载设置
const loadSettings = () => {
    const savedSettings = localStorage.getItem('image-settings');
    if (savedSettings) {
        Object.assign(imageSettings, JSON.parse(savedSettings));
        
        // 更新 UI
        const bgColorOptions = document.querySelectorAll('.color-option');
        bgColorOptions.forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.color === imageSettings.backgroundColor);
        });
        const borderStyleBtns = document.querySelectorAll('[data-border-style]');
        borderStyleBtns.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.borderStyle === imageSettings.borderStyle);
        });
        const paddingBtns = document.querySelectorAll('[data-padding]');
        paddingBtns.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.padding === imageSettings.padding);
        });
        const watermarkText = document.getElementById('watermarkText');
        watermarkText.value = imageSettings.watermarkText;
    }
};

// 保存设置到本地存储
const saveSettings = () => {
    localStorage.setItem('image-settings', JSON.stringify(imageSettings));
};

// 设置面板控制
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const overlay = document.getElementById('overlay');
const resetSettings = document.getElementById('resetSettings');
const watermarkText = document.getElementById('watermarkText');

function showSettings() {
    settingsPanel.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.classList.add('overlay-fade-in');
    settingsPanel.classList.remove('hiding');
    settingsPanel.classList.add('settings-panel');
}

function hideSettings() {
    settingsPanel.classList.add('hiding');
    overlay.classList.add('overlay-fade-out');
    setTimeout(() => {
        settingsPanel.classList.add('hidden');
        settingsPanel.classList.remove('hiding', 'settings-panel');
        overlay.classList.add('hidden');
        overlay.classList.remove('overlay-fade-in', 'overlay-fade-out');
    }, 250);
}

// settingsBtn.addEventListener('click', showSettings);
closeSettingsBtn.addEventListener('click', hideSettings);
overlay.addEventListener('click', hideSettings);

// 颜色选择
const bgColorOptions = document.querySelectorAll('.color-option');
bgColorOptions.forEach(option => {
    option.addEventListener('click', () => {
        bgColorOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        imageSettings.backgroundColor = option.dataset.color;
        saveSettings();
    });
});

// 边框样式选择
const borderStyleBtns = document.querySelectorAll('[data-border-style]');
borderStyleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        borderStyleBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        imageSettings.borderStyle = btn.dataset.borderStyle;
        saveSettings();
    });
});

// 内边距选择
const paddingBtns = document.querySelectorAll('[data-padding]');
paddingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        paddingBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        imageSettings.padding = btn.dataset.padding;
        saveSettings();
    });
});

// 水印文字输入
watermarkText.addEventListener('input', (e) => {
    imageSettings.watermarkText = e.target.value;
    saveSettings();
});

// 重置设置
resetSettings.addEventListener('click', () => {
    imageSettings.backgroundColor = '#ffffff';
    imageSettings.borderStyle = 'simple';
    imageSettings.watermarkText = '由 MarkFlow 生成';
    imageSettings.padding = 'medium';

    // 更新 UI
    bgColorOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === '#ffffff');
    });
    borderStyleBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.borderStyle === 'simple');
    });
    paddingBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.padding === 'medium');
    });
    watermarkText.value = imageSettings.watermarkText;
    
    // 保存默认设置
    saveSettings();
});

// 加载保存的设置
loadSettings();

// 判断颜色是否为深色
const isColorDark = (hexColor) => {
    // 移除#号
    const hex = hexColor.replace('#', '');
    // 转换为RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 160; // 亮度阈值
};

// 生成图片按钮
generateImageBtn.addEventListener('click', async () => {
    try {
        generateImageBtn.textContent = '生成中...';
        generateImageBtn.disabled = true;
        
        // 创建外层容器
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: fixed;
            left: -9999px;
            background: ${imageSettings.backgroundColor};
            width: 900px;
            padding: ${imageSettings.padding === 'small' ? '32px' : imageSettings.padding === 'medium' ? '48px' : '64px'};
            ${imageSettings.borderStyle === 'shadow' ? 'box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);' : ''}
            border-radius: 8px;
        `;

        // 创建内容容器
        const container = document.createElement('div');
        container.className = 'markdown-preview';
        container.style.cssText = `
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: ${imageSettings.padding === 'small' ? '24px 32px' : imageSettings.padding === 'medium' ? '32px 40px' : '40px 48px'};
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            max-width: 100%;
        `;
        container.innerHTML = preview.innerHTML;

        // 添加水印
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            text-align: center;
            color: ${isColorDark(imageSettings.backgroundColor) ? '#ffffff' : '#9CA3AF'};
            font-size: 12px;
            margin-top: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            opacity: 0.8;
        `;
        watermark.textContent = imageSettings.watermarkText;

        // 组装容器
        wrapper.appendChild(container);
        wrapper.appendChild(watermark);
        document.body.appendChild(wrapper);

        const canvas = await html2canvas(wrapper, {
            scale: 2,
            backgroundColor: imageSettings.backgroundColor,
            logging: false,
            useCORS: true,
            allowTaint: true,
            onclone: function(clonedDoc) {
                const clonedContainer = clonedDoc.querySelector('.markdown-preview');
                if (clonedContainer) {
                    const codeBlocks = clonedContainer.querySelectorAll('pre code');
                    codeBlocks.forEach(block => {
                        block.style.backgroundColor = '#f3f4f6';
                        block.style.display = 'block';
                        block.style.padding = '16px';
                        block.style.borderRadius = '4px';
                        block.style.fontSize = '14px';
                        block.style.fontFamily = 'Consolas, Monaco, "Andale Mono", monospace';
                    });
                }
            }
        });

        document.body.removeChild(wrapper);

        // 转换为图片并下载
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        link.download = `markdown-${timestamp}.png`;
        link.href = image;
        link.click();

        // 恢复按钮状态
        generateImageBtn.textContent = '生成图片';
        generateImageBtn.disabled = false;
    } catch (error) {
        console.error('生成图片失败:', error);
        generateImageBtn.textContent = '生成失败';
        setTimeout(() => {
            generateImageBtn.textContent = '生成图片';
            generateImageBtn.disabled = false;
        }, 2000);
    }
});

// 处理粘贴事件，保持制表符
editor.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const spaces = '    ';
        this.value = this.value.substring(0, start) + spaces + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + spaces.length;
    }
});

// 通用复制函数
function copyToClipboard(text, button, originalText) {
    navigator.clipboard.writeText(text).then(() => {
        button.textContent = '已复制';
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        button.classList.add('bg-green-500', 'hover:bg-green-600');
        setTimeout(() => {
            //button.textContent = originalText;
            button.innerHTML = originalText;
            button.classList.remove('bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 1000);
    }).catch(err => {
        console.error('复制失败:', err);
        button.textContent = '复制失败';
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    });
}

// 复制富文本内容
async function copyRichText(html, button) {
    try {
        const blob = new Blob([html], { type: 'text/html' });
        const richTextData = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([preview.innerText], { type: 'text/plain' })
        });
        
        await navigator.clipboard.write([richTextData]);
        
        // 更新按钮状态
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check mr-1"></i>已复制';
        button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        button.classList.add('bg-green-500', 'hover:bg-green-600');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('bg-green-500', 'hover:bg-green-600');
            button.classList.add('bg-blue-500', 'hover:bg-blue-600');
        }, 1000);
    } catch (err) {
        console.error('复制失败:', err);
        button.innerHTML = '<i class="fas fa-times mr-1"></i>复制失败';
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy mr-1"></i>复制';
        }, 1000);
    }
}

// 文本选中高亮功能
let lastHighlight = null;

// 清除所有高亮
function clearHighlights() {
    if (lastHighlight) {
        preview.innerHTML = marked.parse(editor.value);
    }
    lastHighlight = null;
}

// 在预览区查找并高亮文本
function highlightInPreview(searchText) {
    if (!searchText.trim()) {
        clearHighlights();
        return;
    }

    // 获取选中文本的上下文
    const editorValue = editor.value;
    const selectionStart = editor.selectionStart;
    const selectionEnd = editor.selectionEnd;
    
    // 获取选中文本前后各20个字符作为上下文
    const contextStart = Math.max(0, selectionStart - 20);
    const contextEnd = Math.min(editorValue.length, selectionEnd + 20);
    const context = editorValue.substring(contextStart, contextEnd);
    
    // 将 Markdown 转换为 HTML
    const htmlContent = marked.parse(editorValue);
    preview.innerHTML = htmlContent;

    // 创建临时元素来解析 HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent;

    // 在预览区文本中查找最匹配的位置
    let bestMatchIndex = -1;
    let bestMatchDistance = Infinity;

    // 查找所有可能的匹配
    let searchIndex = 0;
    while ((searchIndex = textContent.indexOf(searchText, searchIndex)) !== -1) {
        // 获取当前匹配的上下文
        const matchContextStart = Math.max(0, searchIndex - 20);
        const matchContextEnd = Math.min(textContent.length, searchIndex + searchText.length + 20);
        const matchContext = textContent.substring(matchContextStart, matchContextEnd);
        
        // 计算上下文相似度（使用简单的编辑距离）
        const distance = levenshteinDistance(context, matchContext);
        
        if (distance < bestMatchDistance) {
            bestMatchDistance = distance;
            bestMatchIndex = searchIndex;
        }
        
        searchIndex += 1;
    }

    if (bestMatchIndex !== -1) {
        // 在 HTML 中找到对应位置并添加高亮
        let currentIndex = 0;
        const walk = document.createTreeWalker(
            preview,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while ((node = walk.nextNode())) {
            const nodeLength = node.textContent.length;
            if (currentIndex <= bestMatchIndex && bestMatchIndex < currentIndex + nodeLength) {
                const offset = bestMatchIndex - currentIndex;
                const range = document.createRange();
                const span = document.createElement('span');
                span.className = 'highlight-text';
                
                range.setStart(node, offset);
                range.setEnd(node, offset + searchText.length);
                range.surroundContents(span);
                
                break;
            }
            currentIndex += nodeLength;
        }
    }

    lastHighlight = searchText;
}

// 计算编辑距离（Levenshtein Distance）
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j - 1] + 1,
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1
                );
            }
        }
    }

    return dp[m][n];
}

// 获取选中的文本
function getSelectedText(element) {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    return element.value.substring(start, end);
}

// 监听编辑区选择事件
editor.addEventListener('mouseup', () => {
    const selectedText = getSelectedText(editor);
    highlightInPreview(selectedText);
});

editor.addEventListener('keyup', (e) => {
    // 只在可能发生选择的按键时触发
    if (e.key === 'Shift' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const selectedText = getSelectedText(editor);
        highlightInPreview(selectedText);
    }
});

// 监听预览区选择事件
preview.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
        // 在编辑区中查找并滚动到对应位置
        const content = editor.value;
        const index = content.indexOf(selectedText);
        if (index !== -1) {
            editor.setSelectionRange(index, index + selectedText.length);
            editor.focus();
        }
    }
});

// 当编辑器内容改变时，清除高亮
editor.addEventListener('input', () => {
    clearHighlights();
});

// 同步滚动功能
let isEditorScrolling = false;
let isPreviewScrolling = false;

editor.addEventListener('scroll', () => {
    if (!isPreviewScrolling) {
        isEditorScrolling = true;
        const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
        preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight);
        setTimeout(() => {
            isEditorScrolling = false;
        }, 50);
    }
});

preview.addEventListener('scroll', () => {
    if (!isEditorScrolling) {
        isPreviewScrolling = true;
        const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
        editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight);
        setTimeout(() => {
            isPreviewScrolling = false;
        }, 50);
    }
});

// Markdown 快捷工具栏功能
function insertMarkdown(type) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    let insertion = '';

    switch (type) {
        case 'heading':
            insertion = `### ${selectedText || '标题'}`;
            break;
        case 'bold':
            insertion = `**${selectedText || '粗体文本'}**`;
            break;
        case 'italic':
            insertion = `*${selectedText || '斜体文本'}*`;
            break;
        case 'link':
            insertion = selectedText ? `[${selectedText}](url)` : '[链接文本](url)';
            break;
        case 'image':
            insertion = '![图片描述](图片链接)';
            break;
        case 'code':
            insertion = selectedText ? 
                '\`\`\`\n' + selectedText + '\n\`\`\`' : 
                '\`\`\`\n代码块\n\`\`\`';
            break;
        case 'quote':
            insertion = `> ${selectedText || '引用文本'}`;
            break;
        case 'list-ul':
            insertion = selectedText || '- 列表项 1\n- 列表项 2\n- 列表项 3';
            break;
        case 'list-ol':
            insertion = selectedText || '1. 列表项 1\n2. 列表项 2\n3. 列表项 3';
            break;
        case 'tasks':
            insertion = selectedText || '- [ ] 待办事项 1\n- [ ] 待办事项 2\n- [x] 已完成事项';
            break;
        case 'table':
            insertion = '| 列标题 1 | 列标题 2 | 列标题 3 |\n| --- | --- | --- |\n| 单元格 1 | 单元格 2 | 单元格 3 |';
            break;
        case 'hr':
            insertion = '\n---\n';
            break;
    }

    editor.focus();
    document.execCommand('insertText', false, insertion);
    
    // 触发 input 事件以更新预览
    const event = new Event('input', { bubbles: true });
    editor.dispatchEvent(event);
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                insertMarkdown('bold');
                break;
            case 'i':
                e.preventDefault();
                insertMarkdown('italic');
                break;
            case 'k':
                e.preventDefault();
                insertMarkdown('link');
                break;
            case 'h':
                e.preventDefault();
                insertMarkdown('heading');
                break;
        }
    }
});

// 更新行号显示
function updateLineNumbers() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;
    const lineNumbers = document.getElementById('lineNumbers');
    lineNumbers.innerHTML = Array(lineCount)
        .fill(0)
        .map((_, i) => `${i + 1}`)
        .join('\n');
}

// 监听编辑器内容变化和滚动
editor.addEventListener('input', updateLineNumbers);
editor.addEventListener('scroll', () => {
    document.getElementById('lineNumbers').scrollTop = editor.scrollTop;
});

// 初始化行号
updateLineNumbers();

// 复制 Markdown 内容
function copyMarkdown() {
    const content = editor.value;
    navigator.clipboard.writeText(content).then(() => {
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// 清空编辑器
function clearEditor() {
    if (confirm('确定要清空编辑器内容吗？')) {
        editor.value = '';
        preview.innerHTML = '';
        localStorage.removeItem('markdown-content');
        updateLineNumbers();
    }
}