const mysql = require('mysql2');
require('dotenv').config();

// Conecta usando as mesmas senhas do seu server.js
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

async function limparBanco() {
    console.log("🧹 Iniciando limpeza profunda do sistema...");
    try {
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        await db.query('TRUNCATE TABLE order_items');
        await db.query('TRUNCATE TABLE orders');
        await db.query('TRUNCATE TABLE manual_transactions');
        await db.query('TRUNCATE TABLE products');
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("✅ SUCESSO! O Banco de Dados está 100% virgem e zerado.");
        console.log("👉 Volte no seu navegador e aperte F5 (Atualizar) na tela do Dashboard.");
    } catch(e) {
        console.log("❌ ERRO:", e.message);
    }
    process.exit();
}

limparBanco();