class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.editingId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadTodos();
        // TODO: データ保存
    }

    initializeElements() {
        // DOM要素取得
        this.todoForm = document.getElementById('todo-form');
        this.todoTitle = document.getElementById('todo-title');
        this.todoDescription = document.getElementById('todo-description');
        this.todoPriority = document.getElementById('todo-priority');
        this.todoList = document.getElementById('todo-list');
        this.emptyState = document.getElementById('empty-state');
        this.loading = document.getElementById('loading');
        this.toast = document.getElementById('toast');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        // TODO: エラー処理
    }

    attachEventListeners() {
        // フォーム送信イベント
        this.todoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // フィルターボタン
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // キーボードショートカット（Ctrl+Enter）
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.todoForm.dispatchEvent(new Event('submit'));
            }
        });
        // TODO: キーボード操作
    }

    // API通信
    async apiCall(url, options = {}) {
        this.showLoading();
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'APIエラーが発生しました');
            }

            return await response.json();
        } catch (error) {
            this.showToast(error.message, 'error');
            throw error;
        } finally {
            this.hideLoading();
        }
        // TODO: エラー時の再試行
    }

    // Todo読み込み
    async loadTodos() {
        try {
            this.todos = await this.apiCall('/api/todos');
            this.renderTodos();
        } catch (error) {
            console.error('Todo読み込み失敗:', error);
            // TODO: ネットワーク切れ対応
        }
    }

    // Todo作成
    async createTodo(todoData) {
        try {
            const newTodo = await this.apiCall('/api/todos', {
                method: 'POST',
                body: JSON.stringify(todoData)
            });
            
            this.todos.unshift(newTodo);
            this.renderTodos();
            this.resetForm();
            this.showToast('タスクが追加されました', 'success');
        } catch (error) {
            console.error('Todo作成失敗:', error);
            // TODO: 入力チェック強化
        }
    }

    // Todoの更新
    async updateTodo(id, todoData) {
        try {
            const updatedTodo = await this.apiCall(`/api/todos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(todoData)
            });
            
            const index = this.todos.findIndex(todo => todo.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.renderTodos();
                this.showToast('タスクが更新されました', 'success');
            }
        } catch (error) {
            console.error('Todoの更新に失敗:', error);
        }
    }

    // Todo削除
    async deleteTodo(id) {
        if (!confirm('このタスクを削除しますか？')) {
            return;
        }

        try {
            await this.apiCall(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.renderTodos();
            this.showToast('タスクが削除されました', 'success');
        } catch (error) {
            console.error('Todo削除失敗:', error);
            // TODO: 削除確認を改善
        }
    }

    // 完了状態切り替え
    async toggleTodoComplete(id) {
        try {
            const updatedTodo = await this.apiCall(`/api/todos/${id}/toggle`, {
                method: 'PATCH'
            });
            
            const index = this.todos.findIndex(todo => todo.id === id);
            if (index !== -1) {
                this.todos[index] = updatedTodo;
                this.renderTodos();
                
                const message = updatedTodo.completed ? 
                    'タスクを完了しました' : 'タスクを未完了に戻しました';
                this.showToast(message, 'success');
            }
        } catch (error) {
            console.error('完了状態切り替え失敗:', error);
            // TODO: アニメーション追加
        }
    }

    // フォーム送信処理
    handleFormSubmit() {
        const title = this.todoTitle.value.trim();
        const description = this.todoDescription.value.trim();
        const priority = parseInt(this.todoPriority.value);

        // バリデーション
        if (!title) {
            this.showToast('タイトルを入力してください', 'error');
            this.todoTitle.focus();
            return;
        }

        const todoData = {
            title,
            description,
            priority
        };

        if (this.editingId) {
            // 編集モード
            this.updateTodo(this.editingId, {
                ...todoData,
                completed: this.todos.find(t => t.id === this.editingId)?.completed || false
            });
            this.exitEditMode();
        } else {
            // 新規作成モード
            this.createTodo(todoData);
        }
                    // TODO: 入力値のチェック
    }

    // 編集モード開始
    startEditMode(todo) {
        this.editingId = todo.id;
        this.todoTitle.value = todo.title;
        this.todoDescription.value = todo.description || '';
        this.todoPriority.value = todo.priority;
        
        // ボタンテキスト変更
        const submitBtn = this.todoForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> 更新';
        submitBtn.classList.add('editing');
        
        // キャンセルボタン追加
        if (!this.todoForm.querySelector('.cancel-btn')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'cancel-btn';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> キャンセル';
            cancelBtn.addEventListener('click', () => this.exitEditMode());
            this.todoForm.appendChild(cancelBtn);
        }
        
        this.todoTitle.focus();
        this.todoTitle.select();
        // TODO: 変更履歴
    }

    // 編集モード終了
    exitEditMode() {
        this.editingId = null;
        this.resetForm();
        
        // ボタンを元に戻す
        const submitBtn = this.todoForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> 追加';
        submitBtn.classList.remove('editing');
        
        // キャンセルボタン削除
        const cancelBtn = this.todoForm.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.remove();
        }
        // TODO: 保存確認
    }

    // フォームリセット
    resetForm() {
        this.todoTitle.value = '';
        this.todoDescription.value = '';
        this.todoPriority.value = '2';
        // TODO: フォームリセット改善
    }

    // フィルター設定
    setFilter(filter) {
        this.currentFilter = filter;
        
        // ボタンアクティブ状態更新
        this.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTodos();
        // TODO: フィルター設定保存
    }

    // フィルター済みTodo取得
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
        // TODO: 検索機能
    }

    // Todo描画
    renderTodos() {
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.todoList.style.display = 'block';
        this.emptyState.style.display = 'none';
        
        this.todoList.innerHTML = filteredTodos.map(todo => 
            this.createTodoHTML(todo)
        ).join('');
        
        // イベントリスナー追加
        this.attachTodoEventListeners();
        // TODO: 大量データ対応
    }

    // Todo HTML作成
    createTodoHTML(todo) {
        const priorityClass = this.getPriorityClass(todo.priority);
        const priorityText = this.getPriorityText(todo.priority);
        const createdDate = new Date(todo.created_at).toLocaleDateString('ja-JP');
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'completed' : ''}" 
                     onclick="app.toggleTodoComplete(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="todo-content">
                    <div class="todo-title">${this.escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${this.escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        <span class="priority-badge ${priorityClass}">${priorityText}</span>
                        <span class="created-date">${createdDate}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" onclick="app.startEditMode(${JSON.stringify(todo).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteTodo(${todo.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        // TODO: HTML生成を改善
    }

    // Todoイベントリスナー追加
    attachTodoEventListeners() {
        // ダブルクリックで編集モード
        this.todoList.querySelectorAll('.todo-item').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const id = parseInt(item.dataset.id);
                const todo = this.todos.find(t => t.id === id);
                if (todo) {
                    this.startEditMode(todo);
                }
            });
        });
        // TODO: 並び替え機能
    }

    // 優先度クラス取得
    getPriorityClass(priority) {
        switch (priority) {
            case 3: return 'priority-high';
            case 2: return 'priority-medium';
            case 1: return 'priority-low';
            default: return 'priority-medium';
        }
        // TODO: 優先度設定改善
    }

    // 優先度テキスト取得
    getPriorityText(priority) {
        switch (priority) {
            case 3: return '高';
            case 2: return '中';
            case 1: return '低';
            default: return '中';
        }
    }

    // HTMLエスケープ
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
        // TODO: セキュリティ対策
    }

    // ローディング表示
    showLoading() {
        this.loading.classList.remove('hidden');
    }

    // ローディング非表示
    hideLoading() {
        this.loading.classList.add('hidden');
        // TODO: ローディング画面改善
    }

    // トースト通知
    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
        // TODO: 音声通知
    }

    // 統計情報更新
    updateStats() {
        const totalTodos = this.todos.length;
        const completedTodos = this.todos.filter(todo => todo.completed).length;
        const activeTodos = totalTodos - completedTodos;
        
        // 統計表示要素があれば更新
        const statsElement = document.querySelector('.stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <span>全体: ${totalTodos}</span>
                <span>完了: ${completedTodos}</span>
                <span>未完了: ${activeTodos}</span>
            `;
        }
        // TODO: 統計グラフ
    }
}

// アプリケーションの初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
});

