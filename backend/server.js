const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { verificarToken, verificarAdmin } = require('./middlewares/authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = db.promise();

// Tratamento de Moeda no Padrão Brasileiro
const tratarInputMonetario = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.00;
    if (typeof valor === 'number') return valor;
    
    let cleanStr = String(valor).replace(/R\$\s?/g, '').trim();
    
    if (cleanStr.includes('.') && cleanStr.includes(',')) {
        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.replace(',', '.');
    } else if (cleanStr.includes('.')) {
        const parts = cleanStr.split('.');
        if (parts.length === 2 && parts[1].length === 3) {
            cleanStr = cleanStr.replace(/\./g, '');
        }
    }
    
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0.00 : parsed;
};

// ==========================================
// AUTO-REPARO E CRIAÇÃO DAS TABELAS
// ==========================================
async function blindarBancoDeDados() {
    try {
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS raw_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome_lote VARCHAR(255) NOT NULL,
                peso_kg DECIMAL(10,2) NOT NULL,
                custo_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                data_chegada DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                preco_venda DECIMAL(10,2) NOT NULL,
                estoque_pacotes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                telefone VARCHAR(50) NULL,
                email VARCHAR(255) NULL,
                senha VARCHAR(255) NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                metodo_pagamento VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        `);

        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS manual_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                descricao VARCHAR(255) NOT NULL,
                valor DECIMAL(10,2) NOT NULL,
                data_transacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        try { await promisePool.query("ALTER TABLE products ADD COLUMN descricao TEXT"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN tipo VARCHAR(50) DEFAULT 'moido'"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN peso_unitario_kg DECIMAL(5,3) DEFAULT 0.250"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN controla_estoque BOOLEAN DEFAULT TRUE"); } catch(e) {}

        console.log("✅ AUTO-REPARO CONCLUÍDO: Tabelas sincronizadas.");
    } catch (error) {
        console.log("⚠️ Sincronização de tabelas: ", error.message);
    }
}
blindarBancoDeDados();

// ==========================================
// AUTENTICAÇÃO E LOJA (PÚBLICO)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        // 🔍 Busca dinâmica unificada direto no banco de dados
        const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ erro: 'Credenciais inválidas.' });
        
        const user = users[0];
        
        // 🛡️ Validação via comparação de hash criptografado com bcrypt
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas.' });
        
        // ✅ Emissão do token baseada nos dados armazenados na tabela
        const token = jwt.sign(
            { id: user.id, role: user.role, nome: user.nome }, 
            process.env.JWT_SECRET || 'secret_matilda_fallback', 
            { expiresIn: '8h' }
        );
        
        res.json({ token, user: { id: user.id, nome: user.nome, role: user.role } });
    } catch (error) { 
        res.status(500).json({ erro: 'Erro no login.' }); 
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [produtos] = await promisePool.query('SELECT * FROM products WHERE estoque_pacotes > 0');
        res.json(produtos);
    } catch (error) { res.status(500).json({ erro: 'Erro ao buscar produtos.' }); }
});

// ==========================================
// PEDIDOS ONLINE (E-COMMERCE)
// ==========================================
app.post('/api/orders', async (req, res) => {
    const { items, metodo_pagamento, cliente_nome, cliente_whats } = req.body;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
        let [user] = await connection.query('SELECT id FROM users WHERE telefone = ?', [cliente_whats]);
        let userId = user.length === 0 ? null : user[0].id;

        if (!userId) {
            const emailFake = `${cliente_whats.replace(/\D/g, '')}@cliente.matilda.local`;
            const [newUser] = await connection.query('INSERT INTO users (nome, telefone, role, email, senha) VALUES (?, ?, \'cliente\', ?, \'ficticia\')', [cliente_nome, cliente_whats, emailFake]);
            userId = newUser.insertId;
        }

        let valorTotal = 0;
        const [orderResult] = await connection.query('INSERT INTO orders (user_id, total, metodo_pagamento, status) VALUES (?, 0, ?, \'pendente\')', [userId, metodo_pagamento]);
        const orderId = orderResult.insertId;

        for (let item of items) {
            const [produtos] = await connection.query('SELECT preco_venda, estoque_pacotes, controla_estoque FROM products WHERE id = ?', [item.product_id]);
            const produto = produtos[0];
            valorTotal += produto.preco_venda * item.quantidade;
            await connection.query('INSERT INTO order_items (order_id, product_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)', [orderId, item.product_id, item.quantidade, produto.preco_venda]);
        }

        await connection.query('UPDATE orders SET total = ? WHERE id = ?', [valorTotal, orderId]);
        await connection.commit();
        res.status(201).json({ orderId, total: valorTotal });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ erro: error.message });
    } finally { connection.release(); }
});

app.get('/api/admin/orders', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [pedidos] = await promisePool.query(`SELECT o.*, u.nome as cliente FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`);
        res.json(pedidos);
    } catch (error) { res.status(500).send(error); }
});

app.delete('/api/admin/orders/:id', verificarToken, verificarAdmin, async (req, res) => {
    try {
        await promisePool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        res.json({ mensagem: 'Pedido excluído!' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

app.put('/api/admin/orders/:id/status', verificarToken, verificarAdmin, async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
        const [orderStatusRes] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        const oldStatus = orderStatusRes[0].status;
        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        if ((oldStatus === 'pendente' || oldStatus === 'Aguardando PIX') && (status !== 'pendente' && status !== 'Aguardando PIX' && status.toLowerCase() !== 'cancelado')) {
            const [items] = await connection.query('SELECT product_id, quantidade FROM order_items WHERE order_id = ?', [orderId]);
            for (let item of items) {
                await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes - ? WHERE id = ? AND controla_estoque = true', [item.quantidade, item.product_id]);
            }
        }
        await connection.commit();
        res.json({ mensagem: 'Status alterado!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ erro: error.message });
    } finally { connection.release(); }
});

// ==========================================
// DASHBOARD FINANCEIRO
// ==========================================
app.get('/api/admin/dashboard/summary', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [online] = await promisePool.query("SELECT SUM(total) as t FROM orders WHERE status != 'pendente' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
        const [feira] = await promisePool.query("SELECT SUM(valor) as t FROM manual_transactions WHERE tipo = 'receita_feira' AND MONTH(data_transacao) = MONTH(NOW()) AND YEAR(data_transacao) = YEAR(NOW())");
        const [gastos] = await promisePool.query("SELECT SUM(valor) as t FROM manual_transactions WHERE tipo LIKE 'gasto%' AND MONTH(data_transacao) = MONTH(NOW()) AND YEAR(data_transacao) = YEAR(NOW())");
        
        const totOnline = Number(online[0].t || 0);
        const totFeira = Number(feira[0].t || 0);
        const totGastos = Number(gastos[0].t || 0);

        const lucroLiquido = (totOnline + totFeira) - totGastos;

        res.json({ 
            vendas_online: totOnline, 
            vendas_feira: totFeira, 
            total_despesas: totGastos, 
            lucro_liquido: lucroLiquido 
        });
    } catch (error) { res.status(500).send(error); }
});

app.get('/api/admin/dashboard/history', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [orders] = await promisePool.query(`SELECT DATE_FORMAT(created_at, '%Y-%m') as mes, SUM(total) as vendas_online FROM orders WHERE status != 'pendente' GROUP BY mes`);
        const [manual] = await promisePool.query(`SELECT DATE_FORMAT(data_transacao, '%Y-%m') as mes, tipo, SUM(valor) as total FROM manual_transactions GROUP BY mes, tipo`);

        const historico = {}; 
        orders.forEach(o => { historico[o.mes] = { mes: o.mes, vendas_online: Number(o.vendas_online), vendas_feira: 0, despesas: 0 }; });
        manual.forEach(m => {
            if(!historico[m.mes]) historico[m.mes] = { mes: m.mes, vendas_online: 0, vendas_feira: 0, despesas: 0 };
            if(m.tipo === 'receita_feira') historico[m.mes].vendas_feira += Number(m.total);
            if(m.tipo && m.tipo.includes('gasto')) historico[m.mes].despesas += Number(m.total);
        });

        const resultado = Object.values(historico).map(h => ({
            ...h, lucro_liquido: h.vendas_online + h.vendas_feira - h.despesas
        })).sort((a,b) => b.mes.localeCompare(a.mes)); 

        res.json(resultado);
    } catch (error) { res.status(500).send(error); }
});

app.get('/api/admin/dashboard/expenses-history', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [gastos] = await promisePool.query(`SELECT id, DATE_FORMAT(data_transacao, '%Y-%m') as mes, descricao, valor, data_transacao FROM manual_transactions WHERE tipo LIKE 'gasto%' ORDER BY data_transacao DESC`);
        res.json(gastos);
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

app.post('/api/admin/pos/sale', verificarToken, verificarAdmin, async (req, res) => {
    const { product_id, quantidade, valor_total } = req.body;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
        const [produtos] = await connection.query('SELECT preco_venda, estoque_pacotes, controla_estoque FROM products WHERE id = ?', [product_id]);
        const produto = produtos[0];
        if (produto.controla_estoque && produto.estoque_pacotes < quantidade) throw new Error('Estoque insuficiente para venda.');
        
        const valorFinal = tratarInputMonetario(valor_total); 
        await connection.query("INSERT INTO manual_transactions (tipo, descricao, valor, data_transacao) VALUES ('receita_feira', 'Venda PDV Feira', ?, NOW())", [valorFinal]);
        
        if (produto.controla_estoque) {
            await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes - ? WHERE id = ?', [quantidade, product_id]);
        }
        await connection.commit();
        res.json({ mensagem: 'Venda registrada com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ erro: error.message });
    } finally { connection.release(); }
});

app.post('/api/admin/transactions', verificarToken, verificarAdmin, async (req, res) => {
    const { tipo, descricao, valor } = req.body;
    try {
        const valorTratado = tratarInputMonetario(valor);
        await promisePool.query('INSERT INTO manual_transactions (tipo, descricao, valor, data_transacao) VALUES (?, ?, ?, NOW())', [tipo, descricao, valorTratado]);
        res.json({ mensagem: 'Transação registrada com sucesso!' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

// ==========================================
// ESTOQUE E PRODUÇÃO DE ITENS (SISTEMA DE DUPLA FILTRAGEM)
// ==========================================
app.post('/api/admin/inventory/raw', verificarToken, verificarAdmin, async (req, res) => {
    const { nome_lote, peso_kg, data_chegada } = req.body;
    try {
        const pesoLimpo = tratarInputMonetario(peso_kg);
        await promisePool.query('INSERT INTO raw_inventory (nome_lote, peso_kg, custo_total, data_chegada) VALUES (?, ?, 0.00, ?)', [nome_lote, pesoLimpo, data_chegada]);
        res.json({ mensagem: 'Lote Bruto salvo!' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

app.get('/api/admin/inventory/raw', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [lotes] = await promisePool.query('SELECT * FROM raw_inventory WHERE peso_kg > 0');
        res.json(lotes);
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/admin/products', verificarToken, verificarAdmin, async (req, res) => {
    const { nome, descricao, preco_venda, estoque_pacotes, raw_inventory_id, desperdicio_kg, peso_unitario_kg } = req.body;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
        let qtdPacotes = parseInt(estoque_pacotes) || 0;
        const desp = parseFloat(desperdicio_kg) || 0;
        
        const nomeBusca = nome.toLowerCase();
        const pesoStr = String(peso_unitario_kg || '').toLowerCase();
        let pesoUnitario = parseFloat(pesoStr);
        
        const isDripCoffee = nomeBusca.includes('drip') || 
                             pesoStr.includes('drip') || 
                             pesoStr.includes('10g') || 
                             pesoStr.includes('sachê') || 
                             pesoStr.includes('sache') ||
                             pesoUnitario === 0.010 || 
                             pesoUnitario === 0.01;
        
        let nomeFinal = nome;
        let tipo = 'moido';
        let desc = descricao;

        if (isDripCoffee) {
            nomeFinal = "Drip Coffee";
            pesoUnitario = 0.010;
            tipo = 'drip_coffee';
            desc = descricao || 'Drip Coffee Especial';
        } else {
            if (isNaN(pesoUnitario)) {
                pesoUnitario = 0.250;
            }
            tipo = pesoUnitario <= 0.020 ? 'sache' : (nomeBusca.includes('grão') || nomeBusca.includes('grao') ? 'grao' : 'moido');
            desc = descricao || 'Café Especial 100% Arábica';
        }
        
        let precoFinal = tratarInputMonetario(preco_venda);
        const isCappuccino = nomeBusca.includes('capuc') || nomeBusca.includes('cappuc');

        if (!isCappuccino && raw_inventory_id) {
            const kgLiquido = qtdPacotes * pesoUnitario; 
            const kgTotalSaida = kgLiquido + desp;

            const [lote] = await connection.query('SELECT peso_kg FROM raw_inventory WHERE id = ?', [raw_inventory_id]);
            if (!lote[0]) throw new Error("Lote bruto não encontrado.");
            if (lote[0].peso_kg < kgTotalSaida) throw new Error(`Estoque insuficiente no lote.`);
            
            await connection.query('UPDATE raw_inventory SET peso_kg = peso_kg - ? WHERE id = ?', [kgTotalSaida, raw_inventory_id]);
        }

        const [existe] = await connection.query('SELECT id FROM products WHERE nome = ? AND tipo = ?', [nomeFinal, tipo]);
        
        if (existe.length > 0) {
            await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes + ?, preco_venda = ?, descricao = ?, tipo = ?, peso_unitario_kg = ?, controla_estoque = true WHERE id = ?', [qtdPacotes, precoFinal, desc, tipo, pesoUnitario, existe[0].id]);
        } else {
            await connection.query('INSERT INTO products (nome, descricao, preco_venda, estoque_pacotes, tipo, peso_unitario_kg, controla_estoque) VALUES (?, ?, ?, ?, ?, ?, true)', [nomeFinal, desc, precoFinal, qtdPacotes, tipo, pesoUnitario]);
        }

        await connection.commit();
        res.json({ mensagem: 'Produção registrada com sucesso!', produto: nomeFinal, tipo: tipo });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ erro: error.message });
    } finally { connection.release(); }
});

app.post('/api/admin/inventory/adjust', verificarToken, verificarAdmin, async (req, res) => {
    const { tipo_estoque, id, nova_quantidade } = req.body;
    try {
        if (tipo_estoque === 'pacotes') {
            await promisePool.query('UPDATE products SET estoque_pacotes = ? WHERE id = ?', [nova_quantidade, id]);
        } else {
            await promisePool.query('UPDATE raw_inventory SET peso_kg = ? WHERE id = ?', [nova_quantidade, id]);
        }
        res.json({ mensagem: 'Ajuste realizado!' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Matilda ERP rodando na porta ${PORT}!`));