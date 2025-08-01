const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors()); // CORSエラー対策
app.use(express.json()); // JSONパース
app.use(express.static('public')); // 静的ファイル配信
app.use('/css', express.static('css')); // CSSファイル用
app.use('/js', express.static('js')); // JSファイル用

// トップページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// TODO: エラーハンドリングを追加する
// APIルート
// 全Todo取得
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos ORDER BY priority DESC, created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('DBエラー:', err);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
});

// 新規Todo作成
app.post('/api/todos', async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    
    // バリデーション（タイトル必須）
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'タイトルは必須です' });
    }

    // TODO: 文字数制限も追加したい
    const result = await pool.query(
      'INSERT INTO todos (title, description, priority) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), description?.trim() || '', priority || 1]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('作成エラー:', err);
    res.status(500).json({ error: 'Todoの作成に失敗しました' });
  }
});

// Todo更新
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed, priority } = req.body;

    // TODO: バリデーション追加
    const result = await pool.query(
      `UPDATE todos 
       SET title = $1, description = $2, completed = $3, priority = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [title, description, completed, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todoが見つかりません' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('更新エラー:', err);
    res.status(500).json({ error: 'Todoの更新に失敗しました' });
  }
});

// Todo削除
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // TODO: 論理削除に変更するかも
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todoが見つかりません' });
    }

    res.json({ message: 'Todoが正常に削除されました' });
  } catch (err) {
    console.error('削除エラー:', err);
    res.status(500).json({ error: 'Todoの削除に失敗しました' });
  }
});

// 完了状態切り替え
app.patch('/api/todos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // トグル処理
    const result = await pool.query(
      `UPDATE todos 
       SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todoが見つかりません' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('トグルエラー:', err);
    res.status(500).json({ error: '完了状態の更新に失敗しました' });
  }
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動しました`);
  console.log(`http://localhost:${PORT} でアクセスできます`);
  // TODO: ログ機能追加
});