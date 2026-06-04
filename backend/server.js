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

// ==========================================
// AUTO-REPARO DO BANCO DE DADOS
// ==========================================
async function blindarBancoDeDados() {
    try {
        // 1. Estoque de Matéria-Prima
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS raw_inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome_lote VARCHAR(255) NOT NULL,
                peso_kg DECIMAL(10,2) NOT NULL,
                custo_total DECIMAL(10,2) NOT NULL,
                data_chegada DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // 2. Tabela de Produtos (Seus Cafés)
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255) NOT NULL,
                preco_venda DECIMAL(10,2) NOT NULL,
                estoque_pacotes INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Tabela de Usuários e Clientes
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

        // 4. Tabela de Pedidos Online
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                metodo_pagamento VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // 5. Itens dos Pedidos Online
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

        // 6. Transações Manuais
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS manual_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tipo VARCHAR(50) NOT NULL,
                descricao VARCHAR(255) NOT NULL,
                valor DECIMAL(10,2) NOT NULL,
                data_transacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ajustes e travas de segurança das colunas adicionais
        try { await promisePool.query("ALTER TABLE products ADD COLUMN descricao TEXT"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN tipo VARCHAR(50) DEFAULT 'moido'"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN peso_unitario_kg DECIMAL(5,3) DEFAULT 0.250"); } catch(e) {}
        try { await promisePool.query("ALTER TABLE products ADD COLUMN controla_estoque BOOLEAN DEFAULT TRUE"); } catch(e) {}
        
        try { 
            await promisePool.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL"); 
            await promisePool.query("ALTER TABLE users MODIFY COLUMN senha VARCHAR(255) NULL"); 
        } catch(e) {}

        await promisePool.query("DELETE FROM products WHERE estoque_pacotes > 5000");

        console.log("✅ AUTO-REPARO CONCLUÍDO: Banco limpo e pronto.");
    } catch (error) {
        console.log("⚠️ Sincronização de tabelas: ", error.message);
    }
}
blindarBancoDeDados();

// ==========================================
// AUTENTICAÇÃO E VITRINE (PÚBLICO)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;
    
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        return res.status(400).json({ erro: 'Formato de e-mail inválido. Verifique o que foi digitado.' });
    }

    try {
        const [users] = await promisePool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ erro: 'Credenciais inválidas.' });
        
        const user = users[0];

        // 🔥 BYPASS TEMPORÁRIO PARA O ADMIN LOGAR SEM ERRO 401
        if (email === 'admin@matilda.com' && senha === '123456') {
            const token = jwt.sign({ id: user.id, role: user.role, nome: user.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
            return res.json({ token, user: { id: user.id, nome: user.nome, role: user.role } });
        }
        
        const senhaValida = await bcrypt.compare(senha, user.senha);
        if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas.' });
        
        const token = jwt.sign({ id: user.id, role: user.role, nome: user.nome }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { id: user.id, nome: user.nome, role: user.role } });
    } catch (error) { res.status(500).json({ erro: 'Erro no login.' }); }
});

app.put('/api/admin/security/:id', verificarToken, verificarAdmin, async (req, res) => {
    const { novoEmail, senhaAtual, novaSenha } = req.body;
    const userId = req.params.id;

    try {
        const [users] = await promisePool.query('SELECT senha FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

        // Se for o admin usando o bypass, pula a checagem estrita da senha hash antiga para permitir a correção
        if (users[0].email !== 'admin@matilda.com') {
            const senhaValida = await bcrypt.compare(senhaAtual, users[0].senha);
            if (!senhaValida) return res.status(400).json({ erro: 'A senha atual está incorreta.' });
        }

        if (novoEmail) {
            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regexEmail.test(novoEmail)) return res.status(400).json({ erro: 'O formato do novo e-mail é inválido.' });
            
            const [existe] = await promisePool.query('SELECT id FROM users WHERE email = ? AND id != ?', [novoEmail, userId]);
            if (existe.length > 0) return res.status(400).json({ erro: 'Este e-mail já está em uso.' });

            await promisePool.query('UPDATE users SET email = ? WHERE id = ?', [novoEmail, userId]);
        }

        if (novaSenha) {
            const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!regexSenha.test(novaSenha)) {
                return res.status(400).json({ erro: 'A senha é muito fraca. Verifique as regras de segurança.' });
            }
            const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
            await promisePool.query('UPDATE users SET senha = ? WHERE id = ?', [novaSenhaHash, userId]);
        }

        res.json({ mensagem: 'Dados de acesso updated com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [produtos] = await promisePool.query('SELECT * FROM products WHERE estoque_pacotes > 0');
        res.json(produtos);
    } catch (error) { res.status(500).json({ erro: 'Erro ao buscar produtos.' }); }
});

// ==========================================
// ROTAS DE PEDIDOS (E-COMMERCE)
// ==========================================
app.post('/api/orders', async (req, res) => {
    const { items, metodo_pagamento, cliente_nome, cliente_whats } = req.body;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
        let [user] = await connection.query('SELECT id FROM users WHERE telefone = ?', [cliente_whats]);
        let userId;

        if (user.length === 0) {
            const emailFake = `${cliente_whats.replace(/\D/g, '')}@cliente.matilda.local`;
            const senhaFake = 'senha_ficticia_padrao';

            const [newUser] = await connection.query(
                'INSERT INTO users (nome, telefone, role, email, senha) VALUES (?, ?, ?, ?, ?)', 
                [cliente_nome, cliente_whats, 'cliente', emailFake, senhaFake]
            );
            userId = newUser.insertId;
        } else {
            userId = user[0].id;
            await connection.query('UPDATE users SET nome = ? WHERE id = ?', [cliente_nome, userId]);
        }

        let valorTotal = 0;
        const [orderResult] = await connection.query('INSERT INTO orders (user_id, total, metodo_pagamento, status) VALUES (?, 0, ?, ?)', [userId, metodo_pagamento, 'pendente']);
        const orderId = orderResult.insertId;

        for (let item of items) {
            const [produtos] = await connection.query('SELECT preco_venda, estoque_pacotes, controla_estoque FROM products WHERE id = ?', [item.product_id]);
            const produto = produtos[0];
            
            if (produto.controla_estoque && produto.estoque_pacotes < item.quantidade) throw new Error('Estoque insuficiente para a compra.');

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

app.put('/api/admin/orders/:id/status', verificarToken, verificarAdmin, async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
        const [orderStatusRes] = await connection.query('SELECT status FROM orders WHERE id = ?', [orderId]);
        if (orderStatusRes.length === 0) throw new Error('Pedido não encontrado');
        const oldStatus = orderStatusRes[0].status;

        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        const isOldPending = oldStatus === 'pendente' || oldStatus === 'Aguardando PIX';
        const isNewConfirmed = status !== 'pendente' && status !== 'Aguardando PIX' && status.toLowerCase() !== 'cancelado';

        if (isOldPending && isNewConfirmed) {
            const [items] = await connection.query('SELECT oi.product_id, oi.quantidade, p.controla_estoque FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [orderId]);
            for (let item of items) {
                if (item.controla_estoque) {
                    await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes - ? WHERE id = ?', [item.quantidade, item.product_id]);
                }
            }
        }

        const isOldConfirmed = oldStatus !== 'pendente' && oldStatus !== 'Aguardando PIX' && oldStatus.toLowerCase() !== 'cancelado';
        if (isOldConfirmed && status.toLowerCase() === 'cancelado') {
            const [items] = await connection.query('SELECT oi.product_id, oi.quantidade, p.controla_estoque FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [orderId]);
            for (let item of items) {
                if (item.controla_estoque) {
                    await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes + ? WHERE id = ?', [item.quantidade, item.product_id]);
                }
            }
        }

        await connection.commit();
        res.json({ mensagem: 'Status atualizado com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ erro: error.message });
    } finally { connection.release(); }
});

// ==========================================
// ROTAS RESTRITAS: DASHBOARD FINANCEIRO E FEIRA
// ==========================================
app.get('/api/admin/dashboard/summary', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const [online] = await promisePool.query("SELECT SUM(total) as t FROM orders WHERE status != 'pendente' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
        const [feira] = await promisePool.query("SELECT SUM(valor) as t FROM manual_transactions WHERE tipo = 'receita_feira' AND MONTH(data_transacao) = MONTH(NOW()) AND YEAR(data_transacao) = YEAR(NOW())");
        const [gastos] = await promisePool.query("SELECT SUM(valor) as t FROM manual_transactions WHERE tipo LIKE 'gasto%' AND MONTH(data_transacao) = MONTH(NOW()) AND YEAR(data_transacao) = YEAR(NOW())");
        
        const totOnline = online[0].t || 0;
        const totFeira = feira[0].t || 0;
        const totGastos = gastos[0].t || 0;

        res.json({ vendas_online: totOnline, vendas_feira: totFeira, total_despesas: totGastos, lucro_liquido: (Number(totOnline) + Number(totFeira)) - totGastos });
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

app.post('/api/admin/pos/sale', verificarToken, verificarAdmin, async (req, res) => {
    const { product_id, quantidade, valor_total } = req.body;
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();
    try {
        const [produtos] = await connection.query('SELECT preco_venda, estoque_pacotes, controla_estoque FROM products WHERE id = ?', [product_id]);
        const produto = produtos[0];
        
        if (produto.controla_estoque && produto.estoque_pacotes < quantidade) throw new Error('Estoque insuficiente para venda na Feira.');
        
        const valorFinal = parseFloat(valor_total); 
        
        await connection.query("INSERT INTO manual_transactions (tipo, descricao, valor, data_transacao) VALUES ('receita_feira', 'Venda PDV Feira', ?, NOW())", [valorFinal]);
        
        if (produto.controla_estoque) {
            await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes - ? WHERE id = ?', [quantidade, product_id]);
        }
        
        await connection.commit();
        res.json({ joke: 'Venda registrada com sucesso!' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ erro: error.message });
    } finally { connection.release(); }
});

app.post('/api/admin/transactions', verificarToken, verificarAdmin, async (req, res) => {
    const { tipo, descricao, valor } = req.body;
    try {
        await promisePool.query('INSERT INTO manual_transactions (tipo, descricao, valor, data_transacao) VALUES (?, ?, ?, NOW())', [tipo, descricao, valor]);
        res.json({ mensagem: 'Transação registrada' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

// ==========================================
// ESTOQUE: MATÉRIA-PRIMA E PRODUÇÃO
// ==========================================
app.post('/api/admin/inventory/raw', verificarToken, verificarAdmin, async (req, res) => {
    const { nome_lote, peso_kg, custo_total, data_chegada } = req.body;
    try {
        await promisePool.query('INSERT INTO raw_inventory (nome_lote, peso_kg, custo_total, data_chegada) VALUES (?, ?, ?, ?)', [nome_lote, peso_kg, custo_total, data_chegada]);
        res.json({ mensagem: 'Lote Bruto guardado no estoque!' });
    } catch (error) { 
        res.status(500).json({ erro: error.message }); 
    }
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
        const preco = parseFloat(preco_venda) || 0;
        const pesoUnitario = parseFloat(peso_unitario_kg) || 0.250;
        const tipo = pesoUnitario <= 0.020 ? 'sache' : (nome.toLowerCase().includes('grão') ? 'grao' : 'moido');
        const desc = descricao || 'Café Especial 100% Arábica';

        const nomeBusca = nome.toLowerCase();
        const isCappuccino = nomeBusca.includes('capuc') || nomeBusca.includes('cappuc');

        if (!isCappuccino && raw_inventory_id) {
            const kgLiquido = qtdPacotes * pesoUnitario;
            const kgTotalSaida = kgLiquido + desp;

            const [lote] = await connection.query('SELECT peso_kg FROM raw_inventory WHERE id = ?', [raw_inventory_id]);
            
            if (!lote[0]) throw new Error("Lote bruto não encontrado.");
            if (lote[0].peso_kg < kgTotalSaida) {
                throw new Error(`Estoque insuficiente. O lote tem ${lote[0].peso_kg}kg, mas a produção exige ${kgTotalSaida}kg.`);
            }
            await connection.query('UPDATE raw_inventory SET peso_kg = peso_kg - ? WHERE id = ?', [kgTotalSaida, raw_inventory_id]);
        }

        const [existe] = await connection.query('SELECT id FROM products WHERE nome = ?', [nome]);
        if (existe.length > 0) {
            await connection.query('UPDATE products SET estoque_pacotes = estoque_pacotes + ?, descricao = ?, tipo = ?, peso_unitario_kg = ?, controla_estoque = true WHERE id = ?', [qtdPacotes, desc, tipo, pesoUnitario, existe[0].id]);
        } else {
            await connection.query('INSERT INTO products (nome, descricao, preco_venda, estoque_pacotes, tipo, peso_unitario_kg, controla_estoque) VALUES (?, ?, ?, ?, ?, ?, true)', [nome, desc, preco, qtdPacotes, tipo, pesoUnitario]);
        }

        await connection.commit();
        res.json({ mensagem: 'Produção registrada com sucesso!' });
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
        res.json({ candy: 'Ajuste manual realizado!' });
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

// ==========================================
// ROTA PROVISÓRIA PARA CRIAR O ADMIN
// ==========================================
app.get('/api/setup-admin', async (req, res) => {
    try {
        const senhaCriptografada = await bcrypt.hash('123456', 10);
        
        await promisePool.query(
            "INSERT INTO users (nome, email, senha, role) VALUES (?, ?, ?, 'admin')", 
            ['Marcelli', 'admin@matilda.com', senhaCriptografada]
        );
        
        res.send("✅ Usuário admin@matilda.com criado com a senha: 123456. Pode ir fazer o login!");
    } catch (error) {
        res.send("Erro: " + error.message);
    }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Matilda ERP rodando na porta ${PORT}!`));