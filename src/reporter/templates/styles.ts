/**
 * CSS styles for the HTML report
 * Includes dark/light mode, responsive design, and animations
 */
export const reportStyles = `
:root {
  /* Light mode colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-card: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #6c757d;
  --text-muted: #adb5bd;
  --border-color: #dee2e6;
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  --gradient-error: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border-color: #334155;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  transition: background 0.3s ease, color 0.3s ease;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.header {
  background: var(--gradient-primary);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(50%, -50%);
}

.header-content {
  position: relative;
  z-index: 1;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
}

.header-meta {
  margin-top: 1rem;
  display: flex;
  gap: 2rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Action Buttons Section */
.action-buttons-section {
  margin-bottom: 2rem;
}

.action-buttons-container {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  box-shadow: var(--shadow-md);
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.action-btn .btn-icon {
  font-size: 1.2rem;
}

.action-btn.primary {
  background: var(--gradient-primary);
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.action-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.action-btn.secondary:hover {
  border-color: var(--accent-primary);
  transform: translateY(-2px);
}

.time-estimate {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border: 2px solid var(--border-color);
}

.estimate-icon {
  font-size: 1.5rem;
}

.estimate-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.estimate-text strong {
  color: var(--text-primary);
  font-weight: 700;
}

/* Theme Toggle */
.theme-toggle {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  z-index: 1000;
  font-size: 1.5rem;
}

.theme-toggle:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: var(--shadow-lg);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gradient-primary);
}

.stat-card.success::before { background: var(--gradient-success); }
.stat-card.warning::before { background: var(--gradient-warning); }
.stat-card.error::before { background: var(--gradient-error); }

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
}

/* Charts Section */
.charts-section {
  margin-bottom: 2rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
}

.chart-card h3 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.chart-container {
  position: relative;
  height: 300px;
}

/* Issues Section */
.issues-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Search Controls */
.search-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 1rem;
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  transform: translateY(-2px);
}

.filter-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: white;
}

/* File Cards */
.file-issues-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.file-card:hover {
  box-shadow: var(--shadow-md);
}

.file-card.hidden {
  display: none;
}

.file-card-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}

.file-card-header:hover {
  background: var(--bg-secondary);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.file-path {
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.type-badge.type-import { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.type-badge.type-export { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.type-badge.type-function { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.type-badge.type-type { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.type-badge.type-variable { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
.type-badge.type-file { background: rgba(236, 72, 153, 0.1); color: #ec4899; }

.issue-count-badge {
  padding: 0.25rem 0.75rem;
  background: var(--accent-primary);
  color: white;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 700;
}

.expand-icon {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
  color: var(--text-secondary);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.file-card-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-top: 1px solid transparent;
}

.file-card-content.expanded {
  max-height: 5000px;
  border-top-color: var(--border-color);
}

/* Issue Items */
.issue-list {
  list-style: none;
  padding: 1rem 1.5rem;
}

.issue-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  transition: all 0.2s ease;
}

.issue-item:hover {
  border-left-color: var(--accent-primary);
  transform: translateX(4px);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.issue-icon {
  font-size: 1rem;
}

.issue-title {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
  flex: 1;
}

.issue-badge {
  padding: 0.125rem 0.5rem;
  background: var(--bg-primary);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.issue-details {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-left: 1.5rem;
  font-family: 'Courier New', monospace;
}

/* File Tree */
.file-tree {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
}

.tree-item {
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tree-item:hover {
  background: var(--bg-secondary);
}

.tree-folder {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tree-file {
  margin-left: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
}

.tree-badge {
  background: var(--error);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Code Syntax Highlighting */
.token-keyword { color: #c678dd; }
.token-string { color: #98c379; }
.token-number { color: #d19a66; }
.token-function { color: #61afef; }
.token-comment { color: #5c6370; font-style: italic; }
.token-operator { color: #56b6c2; }
.token-punctuation { color: #abb2bf; }

/* Footer */
.footer {
  margin-top: 4rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
}

.footer a {
  color: var(--accent-primary);
  text-decoration: none;
  font-weight: 600;
}

.footer a:hover {
  text-decoration: underline;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-card);
  border: 2px dashed var(--border-color);
  border-radius: 1rem;
  margin: 2rem 0;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--success);
}

.empty-state-message {
  color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .header h1 {
    font-size: 1.8rem;
  }
  
  .header-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .theme-toggle {
    top: 1rem;
    right: 1rem;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.issue-category,
.chart-card {
  animation: fadeIn 0.5s ease-out;
}

/* Utilities */
.mt-1 { margin-top: 0.5rem; }
.mt-2 { margin-top: 1rem; }
.mt-3 { margin-top: 1.5rem; }
.mt-4 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 2rem; }

/* Print Styles */
@media print {
  .theme-toggle,
  .action-buttons-section {
    display: none !important;
  }
  
  .file-card-content {
    max-height: none !important;
  }
  
  body {
    background: white;
    color: black;
  }
}
`;
