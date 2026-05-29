const mysql = require('mysql2/promise');
require('dotenv').config();

async function rebuildDatabase() {
    console.log("🔥 Iniciando a RECONSTRUÇÃO TOTAL do Banco de Dados...");
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        await db.query('SET FOREIGN_KEY_CHECKS = 0');

        console.log("🧹 1/3 Apagando tabelas com defeito...");
        await db.query('DROP TABLE IF EXISTS order_items');
        await db.query('DROP TABLE IF EXISTS orders');
        await db.query('DROP TABLE IF EXISTS manual_transactions');
        await db.query('DROP TABLE IF EXISTS products');
        await db.query('DROP TABLE IF EXISTS raw_inventory');

        console.log("🏗️ 2/3 Recriando tabelas com a arquitetura perfeita...");

        await db.query(`
            CREATE TABLE raw_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome_lote VARCHAR(255) NOT NULL,
                peso_kg DECIMAL(10,2) NOT NULL,
                custo_total DECIMAL(10,2) NOT NULL,
                data_chegada DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                descricao TEXT,
                preco_venda DECIMAL(10,2) NOT NULL,
                estoque_pacotes INT DEFAULT 0,
                tipo VARCHAR(50) DEFAULT 'moido',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE manual_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50),
                descricao VARCHAR(255),
                valor DECIMAL(10,2),
                data_transacao DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                total DECIMAL(10,2),
                metodo_pagamento VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pendente',
                metodo_entrega VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT,
                product_id INT,
                quantidade INT,
                preco_unitario DECIMAL(10,2)
            )
        `);

        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log("✅ 3/3 SUCESSO! Banco de Dados novinho em folha.");
        console.log("🛡️ Nota: A tabela 'users' não foi apagada. Seu login continua funcionando!");
        process.exit(0);
    } catch (error) {
        console.error("❌ ERRO CRÍTICO:", error.message);
        process.exit(1);
    }
}

rebuildDatabase();