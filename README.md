#Modern-Todo-App
本アプリはNode.js, Express, バニラJavaScriptで構成された，モダンなTodoアプリです．

#主な機能
・Todoリストの作成・閲覧・更新・削除
・レスポンシブ対応
・リアルタイムでタスク更新
・モダンなデザイン

#インストール方法　
リポジトリをローカルにクローンしてください．
git clone あなたのurl
cd modern-todo-app

#依存関係をインストール
npm install

#環境変数を設定する
.envファイルを作って.env.exampleを例に作成してください．

#データベース作成
PostgreSQLが無い方は公式ページからインストールお願いします．
PostgreSQLをインストールできたら．
ターミナルまたはSQL Shellからログインしたのち，データベースを環境変数で設定した名前で作成してください．
作成したデータベースで以下のコードを実行してください．
CREATE TABLE todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

#アプリの起動
npm start

ブラウザでhttp://localhost:3000で使えます．

##技術スタック
フロントエンド:バニラJavaScript+カスタムCSS
バックエンド:Node.js, Express
データベース:PostgreSQL

このアプリケーションはClaudeの補助を受けながら，作成を行っております．予めご了承ください。