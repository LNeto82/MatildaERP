import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const styles = {
    page: { background: '#050505', minHeight: '100vh', color: '#E2E8F0', padding: '2rem 5%', fontFamily: '"Georgia", serif' },
    card: { background: '#0A0A0A', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.1)', boxShadow: '0 4px 6px rgba(0,0,0,0.35)', transition: '0.3s' },
    cardTitle: { color: '#D4AF37', margin: '0 0 1.5rem 0', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'sans-serif', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' },
    textSlate: { color: '#94A3B8', fontSize: '0.9rem' },
    btnOperational: { background: 'linear-gradient(135deg, #D4AF37, #B8860B)', color: '#000', border: 'none', padding: '12px 18px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', width: '100%' },
    inputGold: { background: '#000', border: '1px solid rgba(212,175,55,0.15)', color: '#fff', padding: '12px', width: '100%', marginBottom: '12px', borderRadius: '8px', outline: 'none', fontFamily: 'sans-serif', fontSize: '0.9rem' },
    modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, padding: '20px' },
    modalBox: { background:'#111', border:'1px solid rgba(212,175,55,0.2)', padding:'2rem', borderRadius:'12px', width:'100%', maxWidth:'450px', maxHeight:'90vh', overflowY:'auto' }
};

const chartBaseOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'sans-serif' } } } },
    scales: {
        y: { grid: { color: 'rgba(212,175,55,0.03)' }, ticks: { color: '#94A3B8', font: { family: 'sans-serif' } } },
        x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: 'sans-serif' } } }
    }
};

const DashboardAdmin = () => {
    const [resumo, setResumo] = useState({ vendas_online: 0, vendas_feira: 0, total_despesas: 0, lucro_liquido: 0 });
    const [historico, setHistorico] = useState([]);
    const [produtosPDV, setProdutosPDV] = useState([]);
    const [lotesBrutos, setLotesBrutos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    
    const [modalPacotesAberto, setModalPacotesAberto] = useState(false);
    const [modalAjusteAberto, setModalAjusteAberto] = useState(false);
    const [modalGraosAberto, setModalGraosAberto] = useState(false);
    const [modalPDVAberto, setModalPDVAberto] = useState(false);
    const [modalDespesaAberto, setModalDespesaAberto] = useState(false);
    const [modalPedidosAberto, setModalPedidosAberto] = useState(false);

    const [formPacotes, setFormPacotes] = useState({ nome: '', descricao: '', preco_venda: '', estoque_pacotes: '', raw_inventory_id: '', desperdicio_kg: '', peso_unitario_kg: '0.250' });
    const [formAjuste, setFormAjuste] = useState({ tipo_estoque: 'pacotes', id: '', nova_quantidade: '' });
    const [formPDV, setFormPDV] = useState({ product_id: '', quantidade: 1, valor_total: '' }); 
    const [formGraos, setFormGraos] = useState({ nome_lote: '', peso_kg: '', custo_total: '' });
    const [formDespesa, setFormDespesa] = useState({ descricao: '', valor: '' });

    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    
    useEffect(() => {
        if (!user || user.role !== 'admin') { navigate('/login'); return; }
        carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const carregarDados = async () => {
        try {
            const resSum = await api.get('/admin/dashboard/summary');
            setResumo(resSum.data);
            const resHist = await api.get('/admin/dashboard/history');
            setHistorico(resHist.data.reverse());
            const resProd = await api.get('/products');
            setProdutosPDV(resProd.data);
            const resLotes = await api.get('/admin/inventory/raw');
            setLotesBrutos(resLotes.data);
        } catch (e) { console.error(e); }
    };

    const logout = () => { localStorage.clear(); navigate('/login'); };

    const handleVendaPDV = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/pos/sale', formPDV);
            alert('Venda registrada com sucesso!');
            setModalPDVAberto(false);
            setFormPDV({ product_id: '', quantidade: 1, valor_total: '' });
            carregarDados();
        } catch (error) { alert(error.response?.data?.erro || 'Erro ao vender.'); }
    };

    const handleDespesa = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/transactions', { tipo: 'gasto_extra', ...formDespesa });
            alert('Gasto registrado!');
            setModalDespesaAberto(false);
            setFormDespesa({ descricao: '', valor: '' });
            carregarDados();
        } catch (error) { alert('Erro ao registrar gasto.'); }
    };

    const handleCadastrarGraos = async (e) => {
        e.preventDefault();
        try {
            const dataHoje = new Date().toISOString().split('T')[0];
            await api.post('/admin/inventory/raw', { ...formGraos, data_chegada: dataHoje });
            alert('Lote bruto registrado!');
            setModalGraosAberto(false);
            setFormGraos({ nome_lote: '', peso_kg: '', custo_total: '' });
            carregarDados();
        } catch (error) { alert('Erro ao registrar lote.'); }
    };

    const handleProducao = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/products', formPacotes);
            alert('Produção concluída com sucesso!');
            setModalPacotesAberto(false);
            setFormPacotes({ nome: '', descricao: '', preco_venda: '', estoque_pacotes: '', raw_inventory_id: '', desperdicio_kg: '', peso_unitario_kg: '0.250' });
            carregarDados();
        } catch (err) { alert(err.response?.data?.erro || 'Erro na produção.'); }
    };

    const handleAjusteManual = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/inventory/adjust', formAjuste);
            alert('Estoque corrigido manualmente!');
            setModalAjusteAberto(false);
            setFormAjuste({ tipo_estoque: 'pacotes', id: '', nova_quantidade: '' });
            carregarDados();
        } catch (error) { alert('Erro ao ajustar estoque.'); }
    };

    const abrirPedidos = async () => {
        try {
            const res = await api.get('/admin/orders');
            setPedidos(res.data);
            setModalPedidosAberto(true);
        } catch (error) { alert('Erro ao buscar pedidos.'); }
    };

    const atualizarStatusPedido = async (id, novoStatus) => {
        try {
            await api.put(`/admin/orders/${id}/status`, { status: novoStatus });
            abrirPedidos();
            carregarDados();
        } catch (error) { alert('Erro ao atualizar status.'); }
    };

    // FUNÇÃO DE FORMATAÇÃO DE MOEDA (Padrão BR: 1.000,00)
    const formatarMoeda = (valor) => {
        return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const colorLucro = '#D4AF37';
    const colorDespesa = '#F44336';
    const colorSlate = '#64748B';

    const dataPizza = { labels: ['E-commerce', 'Feira'], datasets: [{ data: [resumo.vendas_online, resumo.vendas_feira], backgroundColor: [colorLucro, colorSlate], borderColor: 'rgba(5,5,5,0.5)', borderWidth: 2 }] };
    const dataBarrasMensal = {
        labels: historico.map(h => h.mes),
        datasets: [
            { label: 'Lucro Líquido', data: historico.map(h => h.lucro_liquido), backgroundColor: colorLucro, borderRadius: 5, barPercentage: 0.8 },
            { label: 'Despesas', data: historico.map(h => h.despesas), backgroundColor: colorDespesa, borderRadius: 5, barPercentage: 0.8 }
        ]
    };
    const dataEstoquePrateleira = {
        labels: produtosPDV.map(p => p.nome),
        datasets: [{ label: 'Itens em Estoque', data: produtosPDV.map(p => p.estoque_pacotes), backgroundColor: 'rgba(212, 175, 55, 0.4)', borderRadius: 5, borderWidth: 1, borderColor: colorLucro }]
    };

    const optHorizontalBar = { ...chartBaseOptions, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#fff', font: { weight: 'bold', family: 'sans-serif' } } }, x: { ...chartBaseOptions.scales.x } } };

    const temVendas = Number(resumo.vendas_online) > 0 || Number(resumo.vendas_feira) > 0;
    const temHistorico = historico.length > 0;

    const isCappuccino = formPacotes.nome.toLowerCase().includes('capuc') || formPacotes.nome.toLowerCase().includes('cappuc');

    return (
        <div style={styles.page}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '20px' }}>
                <h1 style={{ color: '#D4AF37', margin: 0, fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>MATILDA ERP <small style={{fontSize: '0.8rem', color: '#444'}}>v2.1</small></h1>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', fontFamily: 'sans-serif' }}>
                    <span style={{ color: '#94A3B8', paddingRight: '15px', borderRight: '1px solid #333' }}><i className="fas fa-user-shield" style={{marginRight:'5px'}}></i> Marcelli</span>
                    <button onClick={logout} style={{background: 'transparent', border: '1px solid #FF4B4B', padding: '8px 15px', borderRadius: '8px', color: '#FF4B4B', cursor: 'pointer', fontSize: '0.8rem', fontWeight:'bold'}}>SAIR</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ ...styles.card, border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 20px rgba(212,175,55,0.05)' }}>
                    <div style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 900, fontFamily: 'sans-serif' }}>R$ {formatarMoeda(resumo.lucro_liquido)}</div>
                    <div style={{ ...styles.textSlate, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Lucro Líquido (Mês)</div>
                </div>
                <div style={styles.card}>
                    <div style={{ color: colorDespesa, fontSize: '2rem', fontWeight: 700, fontFamily: 'sans-serif' }}>R$ {formatarMoeda(resumo.total_despesas)}</div>
                    <div style={{ ...styles.textSlate, textTransform: 'uppercase', marginTop: '5px' }}>Despesas Totais</div>
                </div>
                <div style={styles.card}>
                    <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, fontFamily: 'sans-serif' }}>R$ {formatarMoeda(resumo.vendas_online)}</div>
                    <div style={{ ...styles.textSlate, textTransform: 'uppercase', marginTop: '5px' }}>Vendas E-commerce</div>
                </div>
                <div style={styles.card}>
                    <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, fontFamily: 'sans-serif' }}>R$ {formatarMoeda(resumo.vendas_feira)}</div>
                    <div style={{ ...styles.textSlate, textTransform: 'uppercase', marginTop: '5px' }}>Vendas Feira</div>
                </div>
            </div>

            <div style={{ ...styles.card, marginBottom: '3rem' }}>
                <h3 style={styles.cardTitle}><i className="fas fa-cogs"></i> Gestão Operacional</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontFamily:'sans-serif' }}>
                    <button style={styles.btnOperational} onClick={() => setModalGraosAberto(true)}><i className="fas fa-truck"></i> RECEBER LOTE MG</button>
                    <button style={styles.btnOperational} onClick={() => setModalPacotesAberto(true)}><i className="fas fa-box-open"></i> PRODUZIR ITENS</button>
                    <button style={styles.btnOperational} onClick={() => setModalAjusteAberto(true)}><i className="fas fa-wrench"></i> AJUSTE INVENTÁRIO</button>
                    <button style={styles.btnOperational} onClick={abrirPedidos}><i className="fas fa-list"></i> PEDIDOS ONLINE</button>
                    <button style={styles.btnOperational} onClick={() => setModalPDVAberto(true)}><i className="fas fa-store"></i> CAIXA DA FEIRA</button>
                    <button style={styles.btnOperational} onClick={() => setModalDespesaAberto(true)}><i className="fas fa-minus-circle"></i> GASTO EXTRA</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}><i className="fas fa-chart-bar"></i> Evolução Mensal</h3>
                    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                        {temHistorico ? <Bar data={dataBarrasMensal} options={chartBaseOptions} /> : <p style={{color: '#666', fontStyle: 'italic', padding: '2rem', textAlign: 'center'}}>Aguardando fechamento do primeiro mês.</p>}
                    </div>
                </div>
                
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}><i className="fas fa-cubes"></i> Estoque Atual Loja</h3>
                    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                        {produtosPDV.length === 0 ? <p style={{color: '#666', fontStyle: 'italic', padding: '2rem', textAlign: 'center'}}>Nenhum pacote produzido.</p> : <Bar data={dataEstoquePrateleira} options={optHorizontalBar} />}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ ...styles.card, border: '1px solid rgba(212, 175, 55, 0.4)' }}>
                        <h3 style={styles.cardTitle}><i className="fas fa-weight-hanging"></i> Matéria-Prima na Fábrica</h3>
                        {lotesBrutos.length === 0 ? <p style={{color: '#666', fontStyle:'italic', textAlign: 'center', margin: '2rem 0'}}>Fábrica vazia.</p> : (
                            lotesBrutos.map(lote => (
                                <div key={lote.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '8px', marginBottom: '10px', border: '1px solid rgba(212, 175, 55, 0.1)', fontFamily: 'sans-serif' }}>
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{lote.nome_lote}</span>
                                    <span style={{ color: '#D4AF37', fontWeight: '900' }}>{Number(lote.peso_kg).toFixed(2)} KG</span>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ ...styles.cardTitle, alignSelf: 'flex-start' }}><i className="fas fa-chart-pie"></i> Receita por Canal</h3>
                        <div style={{ position: 'relative', height: '250px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            {temVendas ? <Doughnut data={dataPizza} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94A3B8' } } } }} /> : <p style={{color: '#666', fontStyle: 'italic', margin: 'auto'}}>Aguardando primeiras vendas...</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODAIS ================= */}
            {modalGraosAberto && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h2 style={styles.cardTitle}><i className="fas fa-truck"></i> Receber Lote</h2>
                        <form onSubmit={handleCadastrarGraos}>
                            <input style={styles.inputGold} type="text" placeholder="Nome do Lote" value={formGraos.nome_lote} onChange={e => setFormGraos({...formGraos, nome_lote: e.target.value})} required />
                            <input style={styles.inputGold} type="number" step="0.01" placeholder="Peso (KG)" value={formGraos.peso_kg} onChange={e => setFormGraos({...formGraos, peso_kg: e.target.value})} required />
                            <input style={styles.inputGold} type="number" step="0.01" placeholder="Custo Total (R$)" value={formGraos.custo_total} onChange={e => setFormGraos({...formGraos, custo_total: e.target.value})} required />
                            <button style={styles.btnOperational}>SALVAR NO ESTOQUE</button>
                            <button type="button" onClick={() => setModalGraosAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'10px'}}>CANCELAR</button>
                        </form>
                    </div>
                </div>
            )}

            {modalPacotesAberto && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h2 style={styles.cardTitle}><i className="fas fa-box-open"></i> Produção Dinâmica</h2>
                        <form onSubmit={handleProducao}>
                            
                            <label style={{color:'#94A3B8', fontSize:'0.8rem', fontFamily:'sans-serif'}}>O que você vai produzir?</label>
                            <select style={{...styles.inputGold, marginTop: '5px'}} value={formPacotes.nome} onChange={e => {
                                const val = e.target.value;
                                const isCap = val.includes('Cappuccino');
                                setFormPacotes({...formPacotes, nome: val, descricao: isCap ? 'Mistura para Cappuccino Artesanal' : 'Café Especial 100% Arábica'});
                            }} required>
                                <option value="">Selecione o produto...</option>
                                <option value="Café Especial Moído">☕ Café Especial Moído</option>
                                <option value="Café Especial em Grãos">☕ Café Especial em Grãos</option>
                                <option value="Cappuccino">🍫 Cappuccino</option>
                            </select>

                            <label style={{color:'#94A3B8', fontSize:'0.8rem', fontFamily:'sans-serif'}}>Formato / Peso da Unidade:</label>
                            <select style={{...styles.inputGold, marginTop: '5px'}} value={formPacotes.peso_unitario_kg} onChange={e => setFormPacotes({...formPacotes, peso_unitario_kg: e.target.value})} required>
                                <option value="0.250">🎒 Pacote Tradicional (250g)</option>
                                <option value="0.010">☕ Sachê Individual / Drip Coffee (10g)</option>
                            </select>

                            <div style={{display: 'flex', gap: '15px'}}>
                                <div style={{flex: 1}}><input style={styles.inputGold} type="number" step="0.01" placeholder="Preço Venda R$" value={formPacotes.preco_venda} onChange={e => setFormPacotes({...formPacotes, preco_venda: e.target.value})} required /></div>
                                <div style={{flex: 1}}><input style={styles.inputGold} type="number" min="1" placeholder="Qtd Produzida" value={formPacotes.estoque_pacotes} onChange={e => setFormPacotes({...formPacotes, estoque_pacotes: e.target.value})} required /></div>
                            </div>
                            
                            <div style={{background: 'rgba(212, 175, 55, 0.05)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.1)', marginBottom: '15px', opacity: isCappuccino ? 0.3 : 1, transition: '0.3s'}}>
                                <label style={{color:'#D4AF37', fontSize:'0.85rem', fontWeight: 'bold', fontFamily:'sans-serif'}}>
                                    Debitar Matéria-Prima {isCappuccino && "(Não Aplicável)"}
                                </label>
                                <select style={{...styles.inputGold, marginTop: '10px'}} value={formPacotes.raw_inventory_id} onChange={e => setFormPacotes({...formPacotes, raw_inventory_id: e.target.value})} required={!isCappuccino} disabled={isCappuccino}>
                                    <option value="">Selecione o Lote de Origem...</option>
                                    {lotesBrutos.map(lote => <option key={lote.id} value={lote.id}>{lote.nome_lote} (Restam {Number(lote.peso_kg).toFixed(2)}kg)</option>)}
                                </select>
                                <label style={{color:'#94A3B8', fontSize:'0.8rem', fontFamily:'sans-serif'}}>Desperdício no processo (KG):</label>
                                <input style={{...styles.inputGold, marginBottom: 0, marginTop: '5px'}} type="number" step="0.001" placeholder="Ex: 0.150" value={formPacotes.desperdicio_kg} onChange={e => setFormPacotes({...formPacotes, desperdicio_kg: e.target.value})} disabled={isCappuccino} />
                            </div>

                            <button style={styles.btnOperational}>CONFIRMAR PRODUÇÃO</button>
                            <button type="button" onClick={() => setModalPacotesAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'10px'}}>CANCELAR</button>
                        </form>
                    </div>
                </div>
            )}

            {modalAjusteAberto && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h2 style={styles.cardTitle}><i className="fas fa-wrench"></i> Ajuste de Inventário</h2>
                        <form onSubmit={handleAjusteManual}>
                            <select style={styles.inputGold} value={formAjuste.tipo_estoque} onChange={e => setFormAjuste({...formAjuste, tipo_estoque: e.target.value})}>
                                <option value="pacotes">Unidades (Loja)</option>
                                <option value="bruto">KG (Fábrica)</option>
                            </select>
                            <select style={styles.inputGold} value={formAjuste.id} onChange={e => setFormAjuste({...formAjuste, id: e.target.value})} required>
                                <option value="">Escolha o item...</option>
                                {formAjuste.tipo_estoque === 'pacotes' 
                                    ? produtosPDV.map(p => <option key={p.id} value={p.id}>{p.nome} (Atual: {p.estoque_pacotes})</option>)
                                    : lotesBrutos.map(l => <option key={l.id} value={l.id}>{l.nome_lote} (Atual: {Number(l.peso_kg).toFixed(2)}kg)</option>)
                                }
                            </select>
                            <input style={{...styles.inputGold, border: '1px solid #FF4B4B'}} type="number" step="0.01" placeholder="Nova Quantidade Real" value={formAjuste.nova_quantidade} onChange={e => setFormAjuste({...formAjuste, nova_quantidade: e.target.value})} required />
                            <button style={styles.btnOperational}>FORÇAR AJUSTE</button>
                            <button type="button" onClick={() => setModalAjusteAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'10px'}}>CANCELAR</button>
                        </form>
                    </div>
                </div>
            )}

            {modalPedidosAberto && (
                <div style={styles.modalOverlay}>
                    <div style={{...styles.modalBox, maxWidth:'800px'}}>
                        <h2 style={styles.cardTitle}><i className="fas fa-list"></i> Pedidos Loja Virtual</h2>
                        {pedidos.length === 0 ? <p style={{color:'#666', fontStyle:'italic'}}>Sem pedidos.</p> : (
                            <table style={{width:'100%', textAlign:'left', borderCollapse:'collapse', fontFamily:'sans-serif', fontSize:'0.9rem'}}>
                                <thead>
                                    <tr style={{borderBottom:'1px solid #333', color:'#94A3B8'}}>
                                        <th style={{padding:'10px'}}>Nº</th>
                                        <th style={{padding:'10px'}}>Cliente</th>
                                        <th style={{padding:'10px'}}>Valor</th>
                                        <th style={{padding:'10px'}}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map(p => (
                                        <tr key={p.id} style={{borderBottom:'1px solid #222'}}>
                                            <td style={{padding:'15px 10px', color:'#D4AF37', fontWeight:'bold'}}>#{p.id}</td>
                                            <td style={{padding:'15px 10px'}}>{p.cliente}</td>
                                            <td style={{padding:'15px 10px', fontWeight:'bold'}}>R$ {formatarMoeda(p.total)}</td>
                                            <td style={{padding:'15px 10px'}}>
                                                <select style={{background:'#000', border:'1px solid #333', color:'#fff', padding:'8px', borderRadius:'5px'}} value={p.status} onChange={(e) => atualizarStatusPedido(p.id, e.target.value)}>
                                                    <option value="pendente">Aguardando PIX</option>
                                                    <option value="pago">Pago (Embalar)</option>
                                                    <option value="concluido">Entregue</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <button onClick={() => setModalPedidosAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'20px'}}>FECHAR JANELA</button>
                    </div>
                </div>
            )}

            {modalPDVAberto && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h2 style={{...styles.cardTitle, color:'#FF6B6B'}}><i className="fas fa-store"></i> Caixa da Feira</h2>
                        <form onSubmit={handleVendaPDV}>
                            <select style={styles.inputGold} value={formPDV.product_id} onChange={e => {
                                const prodId = e.target.value;
                                // CORREÇÃO ESLINT: Usando String(id) === String(prodId)
                                const prod = produtosPDV.find(p => String(p.id) === String(prodId));
                                const precoVenda = prod ? parseFloat(prod.preco_venda) : 0;
                                setFormPDV({...formPDV, product_id: prodId, valor_total: (precoVenda * formPDV.quantidade).toFixed(2)});
                            }} required>
                                <option value="">Qual produto vendeu?</option>
                                {produtosPDV.map(p => <option key={p.id} value={p.id}>{p.nome} (Restam: {p.estoque_pacotes})</option>)}
                            </select>
                            
                            <div style={{display: 'flex', gap: '15px'}}>
                                <div style={{flex: 1}}>
                                    <label style={{color:'#94A3B8', fontSize:'0.8rem', fontFamily:'sans-serif'}}>Qtd:</label>
                                    <input style={{...styles.inputGold, marginTop: '5px'}} type="number" min="1" value={formPDV.quantidade} onChange={e => {
                                        const qtd = e.target.value;
                                        // CORREÇÃO ESLINT: Usando String(id) === String(formPDV.product_id)
                                        const prod = produtosPDV.find(p => String(p.id) === String(formPDV.product_id));
                                        const precoVenda = prod ? parseFloat(prod.preco_venda) : 0;
                                        setFormPDV({...formPDV, quantidade: qtd, valor_total: (precoVenda * qtd).toFixed(2)});
                                    }} required />
                                </div>
                                <div style={{flex: 2}}>
                                    <label style={{color:'#94A3B8', fontSize:'0.8rem', fontFamily:'sans-serif'}}>Valor Cobrado (R$):</label>
                                    <input style={{...styles.inputGold, marginTop: '5px'}} type="number" step="0.01" value={formPDV.valor_total} onChange={e => setFormPDV({...formPDV, valor_total: e.target.value})} required />
                                </div>
                            </div>

                            <button style={styles.btnOperational}>REGISTRAR VENDA</button>
                            <button type="button" onClick={() => setModalPDVAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'10px'}}>CANCELAR</button>
                        </form>
                    </div>
                </div>
            )}
            
            {modalDespesaAberto && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h2 style={{...styles.cardTitle, color:'#FF4B4B'}}><i className="fas fa-minus-circle"></i> Lançar Despesa</h2>
                        <form onSubmit={handleDespesa}>
                            <input style={styles.inputGold} placeholder="Motivo (Uber, Embalagens)" value={formDespesa.descricao} onChange={e => setFormDespesa({...formDespesa, descricao: e.target.value})} required />
                            <input style={styles.inputGold} type="number" step="0.01" placeholder="Valor Gasto R$" value={formDespesa.valor} onChange={e => setFormDespesa({...formDespesa, valor: e.target.value})} required />
                            <button style={styles.btnOperational}>REGISTRAR SAÍDA</button>
                            <button type="button" onClick={() => setModalDespesaAberto(false)} style={{...styles.btnOperational, background:'transparent', border:'1px solid #333', color:'#94A3B8', marginTop:'10px'}}>CANCELAR</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAdmin;