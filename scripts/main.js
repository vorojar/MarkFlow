/**
 * main.js - MarkFlow Markdown编辑器的主要脚本文件
 *
 * 功能: 实现Markdown编辑、实时预览、图片导出、PDF导出等核心功能
 * 创建时间: 2025年3月25日
 * 负责人: 吴龙杰
 */

// DOM 元素引用
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const generatePdfBtn = document.getElementById('generatePdfBtn');
const generateImageBtn = document.getElementById('generateImageBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const overlay = document.getElementById('overlay');
const resetSettingsBtn = document.getElementById('resetSettings');
const watermarkTextInput = document.getElementById('watermarkText');
const lineNumbersEl = document.getElementById('lineNumbers');
const darkModeBtn = document.getElementById('darkModeBtn');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const readTimeEl = document.getElementById('readTime');

// 配置 marked 渲染器支持高亮语法
const renderer = new marked.Renderer();
const defaultTextRenderer = renderer.text.bind(renderer);
renderer.text = function (text) {
    return defaultTextRenderer(text.replace(/===(.*?)===|==(.*?)==/g, '<mark>$1$2</mark>'));
};

marked.setOptions({
    breaks: true,
    gfm: true,
    renderer
});

// 渲染 Markdown 内容到预览区
function renderPreview(content) {
    preview.innerHTML = marked.parse(content);
    // 代码高亮
    preview.querySelectorAll('pre code').forEach(function (block) {
        hljs.highlightElement(block);
    });
}

// 保存内容到本地存储
function saveContent(content) {
    localStorage.setItem('markdown-content', content);
}

// 初始化编辑器内容
function initEditorContent() {
    const savedContent = localStorage.getItem('markdown-content');
    if (savedContent) {
        editor.value = savedContent;
        renderPreview(savedContent);
        return;
    }

    // 首次打开时加载 README.md
    fetch('README.md')
        .then(response => response.text())
        .then(content => {
            editor.value = content;
            renderPreview(content);
            saveContent(content);
        })
        .catch(error => console.error('加载 README.md 失败:', error));
}

initEditorContent();

// 实时预览和自动保存
editor.addEventListener('input', function () {
    const content = this.value;
    renderPreview(content);
    saveContent(content);
    updateLineNumbers();
    clearHighlights();
});

// 清空按钮
clearBtn.addEventListener('click', function () {
    if (!confirm('确定要清空编辑器内容吗？')) return;
    editor.value = '';
    preview.innerHTML = '';
    localStorage.removeItem('markdown-content');
    updateLineNumbers();
});

// ===== 文件拖放导入功能 =====
function isMarkdownFile(file) {
    const validExtensions = ['.md', '.markdown', '.mdown', '.mkd'];
    const fileName = file.name.toLowerCase();
    return validExtensions.some(function (ext) {
        return fileName.endsWith(ext);
    });
}

function loadFile(file) {
    if (!isMarkdownFile(file)) {
        alert('请拖放 Markdown 文件（.md）');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        editor.value = content;
        renderPreview(content);
        saveContent(content);
        updateLineNumbers();
        updateWordCount();
    };
    reader.onerror = function () {
        alert('文件读取失败');
    };
    reader.readAsText(file);
}

// 阻止默认拖放行为
editor.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
});

editor.addEventListener('dragleave', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
});

editor.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadFile(files[0]);
    }
});

// 复制编辑区内容按钮
copyBtn.addEventListener('click', function () {
    copyToClipboard(editor.value, copyBtn, '<i class="fas fa-copy mr-1"></i>');
});

// 复制预览区内容按钮
copyHtmlBtn.addEventListener('click', function () {
    copyRichText(preview.innerHTML, copyHtmlBtn);
});

// 图片生成设置
const DEFAULT_IMAGE_SETTINGS = {
    backgroundColor: '#ffffff',
    borderStyle: 'simple',
    watermarkText: '由 MarkFlow 生成'
};

const imageSettings = { ...DEFAULT_IMAGE_SETTINGS };

// 更新设置面板 UI 以反映当前设置
function updateSettingsUI() {
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === imageSettings.backgroundColor);
    });
    document.querySelectorAll('[data-border-style]').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.borderStyle === imageSettings.borderStyle);
    });
    watermarkTextInput.value = imageSettings.watermarkText;
}

// 从本地存储加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('image-settings');
    if (savedSettings) {
        Object.assign(imageSettings, JSON.parse(savedSettings));
        updateSettingsUI();
    }
}

// 保存设置到本地存储
function saveSettings() {
    localStorage.setItem('image-settings', JSON.stringify(imageSettings));
}

// 设置面板控制
function showSettings() {
    settingsPanel.classList.remove('hidden', 'hiding');
    settingsPanel.classList.add('settings-panel');
    overlay.classList.remove('hidden', 'overlay-fade-out');
    overlay.classList.add('overlay-fade-in');
}

function hideSettings() {
    settingsPanel.classList.add('hiding');
    overlay.classList.add('overlay-fade-out');
    setTimeout(function () {
        settingsPanel.classList.add('hidden');
        settingsPanel.classList.remove('hiding', 'settings-panel');
        overlay.classList.add('hidden');
        overlay.classList.remove('overlay-fade-in', 'overlay-fade-out');
    }, 250);
}

closeSettingsBtn.addEventListener('click', hideSettings);
overlay.addEventListener('click', hideSettings);

// 通用设置选项点击处理
function setupSettingOptions(selector, settingKey, dataKey) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(function (el) {
        el.addEventListener('click', function () {
            elements.forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            imageSettings[settingKey] = el.dataset[dataKey];
            saveSettings();
        });
    });
}

setupSettingOptions('.color-option', 'backgroundColor', 'color');
setupSettingOptions('[data-border-style]', 'borderStyle', 'borderStyle');

// 水印文字输入
watermarkTextInput.addEventListener('input', function (e) {
    imageSettings.watermarkText = e.target.value;
    saveSettings();
});

// 重置设置
resetSettingsBtn.addEventListener('click', function () {
    Object.assign(imageSettings, DEFAULT_IMAGE_SETTINGS);
    updateSettingsUI();
    saveSettings();
});

// 加载保存的设置
loadSettings();

// 判断颜色是否为深色
function isColorDark(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 160;
}

// 设置按钮加载状态
function setButtonLoading(button, isLoading, loadingText, normalText) {
    button.textContent = isLoading ? loadingText : normalText;
    button.disabled = isLoading;
}

// 显示按钮错误状态并自动恢复
function showButtonError(button, normalText, delay) {
    button.textContent = '生成失败';
    setTimeout(function () {
        button.textContent = normalText;
        button.disabled = false;
    }, delay || 2000);
}

// 生成 PDF 按钮 - 使用浏览器原生打印功能
generatePdfBtn.addEventListener('click', function () {
    window.print();
});

// 图片生成样式常量
const IMAGE_STYLES = {
    containerWidth: '600px',
    fontSize: '16px',
    lineHeight: 1.8,
    headerScale: 1.1,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};

// 创建图片导出容器
function createImageWrapper() {
    const { containerWidth, fontSize, lineHeight, fontFamily } = IMAGE_STYLES;
    const { backgroundColor, borderStyle } = imageSettings;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        position: fixed;
        left: -9999px;
        background: ${backgroundColor};
        width: ${containerWidth};
        padding: 20px;
        ${borderStyle === 'shadow' ? 'box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);' : ''}
        border-radius: 12px;
    `;

    const phoneFrame = document.createElement('div');
    phoneFrame.style.cssText = `
        border: 4px solid #000000;
        border-radius: 16px;
        padding: 16px;
        background: white;
        position: relative;
        overflow: hidden;
    `;

    const container = document.createElement('div');
    container.className = 'markdown-preview';
    container.style.cssText = `
        border-radius: 6px;
        padding: 12px 16px;
        background: white;
        font-family: ${fontFamily};
        line-height: ${lineHeight};
        color: #374151;
        max-width: 100%;
        font-size: ${fontSize};
        letter-spacing: 0.3px;
        word-spacing: 0.5px;
        word-break: normal;
        word-wrap: break-word;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
    `;
    container.innerHTML = preview.innerHTML;

    phoneFrame.appendChild(container);

    const watermark = document.createElement('div');
    watermark.style.cssText = `
        text-align: center;
        color: ${isColorDark(backgroundColor) ? '#ffffff' : '#9CA3AF'};
        font-size: 12px;
        margin-top: 16px;
        font-family: ${fontFamily};
        opacity: 0.8;
    `;
    watermark.textContent = imageSettings.watermarkText;

    wrapper.appendChild(phoneFrame);
    wrapper.appendChild(watermark);

    return wrapper;
}

// 优化克隆文档中的元素样式
function optimizeClonedStyles(clonedDoc) {
    const container = clonedDoc.querySelector('.markdown-preview');
    if (!container) return;

    const { headerScale } = IMAGE_STYLES;

    // 优化文本渲染
    container.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, span, td, th').forEach(function (el) {
        el.style.letterSpacing = '0.3px';
        el.style.wordSpacing = '0.5px';
        el.style.textRendering = 'optimizeLegibility';
        el.style.webkitFontSmoothing = 'antialiased';
    });

    // 调整标题样式
    container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function (header) {
        const currentSize = parseFloat(window.getComputedStyle(header).fontSize);
        header.style.fontSize = `${currentSize * headerScale}px`;
        header.style.letterSpacing = '0.5px';
        header.style.marginBottom = '0.7em';
    });

    // 调整代码块样式
    container.querySelectorAll('pre code').forEach(function (block) {
        Object.assign(block.style, {
            backgroundColor: '#f3f4f6',
            display: 'block',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '14px',
            letterSpacing: '0.2px',
            lineHeight: '1.6',
            fontFamily: 'Consolas, Monaco, "Andale Mono", monospace'
        });
    });

    // 调整图片样式
    container.querySelectorAll('img').forEach(function (img) {
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
    });

    // 调整表格样式
    container.querySelectorAll('table').forEach(function (table) {
        Object.assign(table.style, {
            fontSize: '14px',
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '2px'
        });
    });

    // 调整段落间距
    container.querySelectorAll('p').forEach(function (p) {
        p.style.marginBottom = '0.8em';
    });
}

// 生成图片按钮
generateImageBtn.addEventListener('click', async function () {
    const normalText = '生成图片';
    setButtonLoading(generateImageBtn, true, '生成中...', normalText);

    const wrapper = createImageWrapper();
    document.body.appendChild(wrapper);

    try {
        // 等待字体和 CSS 完全加载
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(wrapper, {
            scale: 3,
            backgroundColor: imageSettings.backgroundColor,
            logging: false,
            useCORS: true,
            allowTaint: true,
            letterRendering: true,
            onclone: optimizeClonedStyles
        });

        document.body.removeChild(wrapper);

        // 下载图片
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const link = document.createElement('a');
        link.download = `markdown-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        setButtonLoading(generateImageBtn, false, '生成中...', normalText);
    } catch (error) {
        console.error('生成图片失败:', error);
        document.body.removeChild(wrapper);
        showButtonError(generateImageBtn, normalText);
    }
});

// 处理 Tab 键插入空格
editor.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const start = this.selectionStart;
    const spaces = '    ';
    this.value = this.value.substring(0, start) + spaces + this.value.substring(this.selectionEnd);
    this.selectionStart = this.selectionEnd = start + spaces.length;
});

// 更新按钮样式为成功状态
function setButtonSuccess(button) {
    button.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    button.classList.add('bg-green-500', 'hover:bg-green-600');
}

// 恢复按钮样式为默认状态
function resetButtonStyle(button) {
    button.classList.remove('bg-green-500', 'hover:bg-green-600');
    button.classList.add('bg-blue-500', 'hover:bg-blue-600');
}

// 通用复制函数
function copyToClipboard(text, button, originalHTML) {
    navigator.clipboard.writeText(text).then(function () {
        button.textContent = '已复制';
        setButtonSuccess(button);
        setTimeout(function () {
            button.innerHTML = originalHTML;
            resetButtonStyle(button);
        }, 1000);
    }).catch(function (err) {
        console.error('复制失败:', err);
        button.textContent = '复制失败';
        setTimeout(function () {
            button.innerHTML = originalHTML;
        }, 1000);
    });
}

// 复制富文本内容
async function copyRichText(html, button) {
    const originalHTML = button.innerHTML;

    try {
        const richTextData = new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([preview.innerText], { type: 'text/plain' })
        });

        await navigator.clipboard.write([richTextData]);

        button.innerHTML = '<i class="fas fa-check mr-1"></i>已复制';
        setButtonSuccess(button);

        setTimeout(function () {
            button.innerHTML = originalHTML;
            resetButtonStyle(button);
        }, 1000);
    } catch (err) {
        console.error('复制失败:', err);
        button.innerHTML = '<i class="fas fa-times mr-1"></i>复制失败';
        setTimeout(function () {
            button.innerHTML = '<i class="fas fa-copy mr-1"></i>复制';
        }, 1000);
    }
}

// 文本选中高亮功能
let lastHighlight = null;

// 清除所有高亮
function clearHighlights() {
    if (lastHighlight) {
        renderPreview(editor.value);
    }
    lastHighlight = null;
}

// 计算编辑距离（Levenshtein Distance）
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill().map(function () { return Array(n + 1).fill(0); });

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(dp[i - 1][j - 1] + 1, dp[i - 1][j] + 1, dp[i][j - 1] + 1);
            }
        }
    }

    return dp[m][n];
}

// 获取选中的文本
function getSelectedText(element) {
    return element.value.substring(element.selectionStart, element.selectionEnd);
}

// 查找最佳匹配位置
function findBestMatch(textContent, searchText, context) {
    let bestMatchIndex = -1;
    let bestMatchDistance = Infinity;
    let searchIndex = 0;

    while ((searchIndex = textContent.indexOf(searchText, searchIndex)) !== -1) {
        const matchContextStart = Math.max(0, searchIndex - 20);
        const matchContextEnd = Math.min(textContent.length, searchIndex + searchText.length + 20);
        const matchContext = textContent.substring(matchContextStart, matchContextEnd);
        const distance = levenshteinDistance(context, matchContext);

        if (distance < bestMatchDistance) {
            bestMatchDistance = distance;
            bestMatchIndex = searchIndex;
        }
        searchIndex += 1;
    }

    return bestMatchIndex;
}

// 在预览区查找并高亮文本
function highlightInPreview(searchText) {
    if (!searchText.trim()) {
        clearHighlights();
        return;
    }

    const editorValue = editor.value;
    const contextStart = Math.max(0, editor.selectionStart - 20);
    const contextEnd = Math.min(editorValue.length, editor.selectionEnd + 20);
    const context = editorValue.substring(contextStart, contextEnd);

    const htmlContent = marked.parse(editorValue);
    preview.innerHTML = htmlContent;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent;

    const bestMatchIndex = findBestMatch(textContent, searchText, context);

    if (bestMatchIndex !== -1) {
        let currentIndex = 0;
        const walk = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, null, false);

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

// 处理编辑区选择
function handleEditorSelection() {
    highlightInPreview(getSelectedText(editor));
}

// 监听编辑区选择事件
editor.addEventListener('mouseup', handleEditorSelection);

editor.addEventListener('keyup', function (e) {
    const selectionKeys = ['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (selectionKeys.includes(e.key)) {
        handleEditorSelection();
    }
});

// 监听预览区选择事件
preview.addEventListener('mouseup', function () {
    const selectedText = window.getSelection().toString();
    if (!selectedText) return;

    const index = editor.value.indexOf(selectedText);
    if (index !== -1) {
        editor.setSelectionRange(index, index + selectedText.length);
        editor.focus();
    }
});

// 同步滚动功能
let isEditorScrolling = false;
let isPreviewScrolling = false;

function syncScroll(source, target, flagSetter, flagChecker) {
    if (flagChecker()) return;
    flagSetter(true);
    const percentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
    target.scrollTop = percentage * (target.scrollHeight - target.clientHeight);
    setTimeout(function () { flagSetter(false); }, 50);
}

editor.addEventListener('scroll', function () {
    syncScroll(editor, preview, function (v) { isEditorScrolling = v; }, function () { return isPreviewScrolling; });
    lineNumbersEl.scrollTop = editor.scrollTop;
});

preview.addEventListener('scroll', function () {
    syncScroll(preview, editor, function (v) { isPreviewScrolling = v; }, function () { return isEditorScrolling; });
});

// Markdown 模板映射
const MARKDOWN_TEMPLATES = {
    heading: function (text) { return `### ${text || '标题'}`; },
    bold: function (text) { return `**${text || '粗体文本'}**`; },
    italic: function (text) { return `*${text || '斜体文本'}*`; },
    link: function (text) { return text ? `[${text}](url)` : '[链接文本](url)'; },
    image: function () { return '![图片描述](图片链接)'; },
    code: function (text) { return '```\n' + (text || '代码块') + '\n```'; },
    quote: function (text) { return `> ${text || '引用文本'}`; },
    'list-ul': function (text) { return text || '- 列表项 1\n- 列表项 2\n- 列表项 3'; },
    'list-ol': function (text) { return text || '1. 列表项 1\n2. 列表项 2\n3. 列表项 3'; },
    tasks: function (text) { return text || '- [ ] 待办事项 1\n- [ ] 待办事项 2\n- [x] 已完成事项'; },
    table: function () { return '| 列标题 1 | 列标题 2 | 列标题 3 |\n| --- | --- | --- |\n| 单元格 1 | 单元格 2 | 单元格 3 |'; },
    hr: function () { return '\n---\n'; },
    highlight: function (text) { return `===${text || '高亮文本'}===`; }
};

// Markdown 快捷工具栏功能
function insertMarkdown(type) {
    const selectedText = getSelectedText(editor);
    const template = MARKDOWN_TEMPLATES[type];
    if (!template) return;

    const insertText = template(selectedText);
    const start = editor.selectionStart;
    const end = editor.selectionEnd;

    editor.value = editor.value.substring(0, start) + insertText + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + insertText.length;
    editor.focus();
    editor.dispatchEvent(new Event('input', { bubbles: true }));
}

// 键盘快捷键映射
const KEYBOARD_SHORTCUTS = {
    b: 'bold',
    i: 'italic',
    k: 'link',
    h: 'heading'
};

// 添加键盘快捷键
document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;

    const markdownType = KEYBOARD_SHORTCUTS[e.key.toLowerCase()];
    if (markdownType) {
        e.preventDefault();
        insertMarkdown(markdownType);
    }
});

// 更新行号显示
function updateLineNumbers() {
    const lineCount = editor.value.split('\n').length;
    lineNumbersEl.innerHTML = Array.from({ length: lineCount }, function (_, i) { return i + 1; }).join('\n');
}

// 初始化行号
updateLineNumbers();

// ===== 字数统计功能 =====
function updateWordCount() {
    const text = editor.value;

    // 统计中文字数（中文字符）
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 统计英文单词数
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    // 总字数 = 中文字符 + 英文单词
    const wordCount = chineseChars + englishWords;

    // 字符数（不含空白）
    const charCount = text.replace(/\s/g, '').length;

    // 预计阅读时间（按每分钟 300 字计算）
    const readTime = Math.max(1, Math.ceil(wordCount / 300));

    wordCountEl.textContent = wordCount + ' 字';
    charCountEl.textContent = charCount + ' 字符';
    readTimeEl.textContent = '约 ' + readTime + ' 分钟';
}

// 初始化字数统计
updateWordCount();

// 在 input 事件中更新字数统计
editor.addEventListener('input', updateWordCount);

// ===== 深色模式功能 =====
function initDarkMode() {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedMode === 'true' || (savedMode === null && prefersDark);

    if (isDark) {
        document.body.classList.add('dark');
        updateDarkModeIcon(true);
        updateHighlightTheme(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeIcon(isDark);
    updateHighlightTheme(isDark);
}

function updateDarkModeIcon(isDark) {
    const icon = darkModeBtn.querySelector('i');
    icon.className = isDark ? 'fas fa-sun text-base' : 'fas fa-moon text-base';
}

function updateHighlightTheme(isDark) {
    const darkTheme = document.getElementById('hljs-dark');
    if (darkTheme) {
        darkTheme.media = isDark ? 'all' : '(prefers-color-scheme: dark)';
    }
}

// 初始化深色模式
initDarkMode();

// 深色模式按钮点击事件
darkModeBtn.addEventListener('click', toggleDarkMode);

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (localStorage.getItem('darkMode') === null) {
        document.body.classList.toggle('dark', e.matches);
        updateDarkModeIcon(e.matches);
    }
});