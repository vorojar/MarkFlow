tailwind.config = {
    theme: {
        extend: {}
    },
    plugins: [
        // 添加 Typography 插件
        function({addBase, addComponents, addUtilities, theme}) {
            addComponents({
                '.markdown-preview': {
                    'h1': {
                        fontSize: '2rem',
                        fontWeight: '700',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '1px solid #e5e7eb'
                    },
                    'h2': {
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginTop: '1.5rem',
                        marginBottom: '1rem'
                    },
                    'h3': {
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        marginTop: '1rem',
                        marginBottom: '0.75rem'
                    },
                    'p': {
                        marginBottom: '1rem',
                        lineHeight: '1.6'
                    },
                    'ul': {
                        listStyleType: 'disc',
                        paddingLeft: '1.5rem',
                        marginBottom: '1rem'
                    },
                    'ol': {
                        listStyleType: 'decimal',
                        paddingLeft: '1.5rem',
                        marginBottom: '1rem'
                    },
                    'li': {
                        marginBottom: '0.25rem'
                    },
                    'blockquote': {
                        borderLeftWidth: '4px',
                        borderLeftColor: '#e5e7eb',
                        paddingLeft: '1rem',
                        fontStyle: 'italic',
                        margin: '1rem 0'
                    },
                    'code': {
                        backgroundColor: '#f3f4f6',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                    },
                    'pre': {
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        marginBottom: '1rem',
                        overflowX: 'auto'
                    },
                    'pre code': {
                        backgroundColor: 'transparent',
                        padding: '0',
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        display: 'block'
                    },
                    'table': {
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginBottom: '1rem',
                        border: '1px solid #e5e7eb'
                    },
                    'th, td': {
                        border: '1px solid #e5e7eb',
                        padding: '0.75rem 1rem'
                    },
                    'th': {
                        backgroundColor: '#f3f4f6',
                        textAlign: 'left'
                    },
                    'img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '0.375rem',
                        margin: '1rem 0'
                    },
                    'hr': {
                        margin: '2rem 0',
                        borderTop: '1px solid #e5e7eb'
                    },
                    'a': {
                        color: '#2563eb',
                        textDecoration: 'none',
                        '&:hover': {
                            textDecoration: 'underline',
                            color: '#1d4ed8'
                        }
                    }
                }
            });
        }
    ]
}