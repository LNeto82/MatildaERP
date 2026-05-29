import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LojaVirtual = () => {
    const [produtos, setProdutos] = useState([]);
    const [carrinho, setCarrinho] = useState([]);
    const [modalPixAberto, setModalPixAberto] = useState(false);
    const [cliente, setCliente] = useState({ nome: '', whats: '', entrega: 'uber_municipal' });
    const [pedidoAtual, setPedidoAtual] = useState(null);
    const [qrCodeData, setQrCodeData] = useState('');

    useEffect(() => {
        carregarProdutos();
    }, []);

    const carregarProdutos = async () => {
        try {
            const res = await api.get('/products');
            setProdutos(res.data);
        } catch (error) {
            console.error("Erro ao carregar a vitrine de produtos:", error);
        }
    };

    const gerarPayloadPix = (chavePix, valor, nome, cidade) => {
        const formatSize = (str) => String(str.length).padStart(2, '0');
        const gui = '0014br.gov.bcb.pix';
        const chave = `01${formatSize(chavePix)}${chavePix}`;
        const merchantAccount = `26${formatSize(gui + chave)}${gui}${chave}`;
        const payloadBase = ['000201', '26' + formatSize(merchantAccount.length) + merchantAccount, '52040000', '5303986', `54${formatSize(valor.toFixed(2))}${valor.toFixed(2)}`, '5802BR', `59${formatSize(nome)}${nome}`, `60${formatSize(cidade)}${cidade}`, '62070503***', '6304'].join('');
        let crc = 0xFFFF;
        for (let i = 0; i < payloadBase.length; i++) {
            crc ^= payloadBase.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) { 
                if ((crc & 0x8000) !== 0) 
                    crc = (crc << 1) ^ 0x1021; 
                else 
                    crc = crc << 1; 
            }
        }
        return payloadBase + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    };

    const addAoCarrinho = (p) => {
        const ex = carrinho.find(i => i.id === p.id);
        if (ex && ex.qtd >= p.estoque_pacotes) {
            alert(`Temos apenas ${p.estoque_pacotes} unidades disponíveis deste item em stock.`);
            return;
        }
        if (ex) 
            setCarrinho(carrinho.map(i => i.id === p.id ? { ...i, qtd: i.qtd + 1 } : i));
        else 
            setCarrinho([...carrinho, { ...p, qtd: 1 }]);
    };

    const removerDoCarrinho = (id) => setCarrinho(carrinho.filter(i => i.id !== id));
    const total = carrinho.reduce((acc, i) => acc + (i.preco_venda * i.qtd), 0);

    const finalizarPedido = async () => {
        if (!cliente.nome || !cliente.whats) {
            return alert('Por favor, preencha o seu Nome e o número de WhatsApp!');
        }
        
        try {
            const res = await api.post('/orders', { 
                items: carrinho.map(i => ({ product_id: i.id, quantidade: i.qtd })),
                metodo_pagamento: 'pix',
                cliente_nome: cliente.nome,
                cliente_whats: cliente.whats,
                metodo_entrega: cliente.entrega
            });

            const pixData = gerarPayloadPix('41988495454', res.data.total, 'MARCELLI', 'CURITIBA');
            
            let msgLogistica = cliente.entrega === 'uber_municipal' 
                ? 'Gostaria que enviasse pelo Uber Flash saindo do Mercado Municipal (calcularemos a taxa)' 
                : 'Vou retirar em mãos diretamente na loja';
                
            const linkWhats = `https://wa.me/5541988495454?text=${encodeURIComponent(`Olá Marcelli! Sou ${cliente.nome}. Fiz o pedido #${res.data.orderId} no valor de R$ ${res.data.total.toFixed(2)}.\n\nLogística: ${msgLogistica}.\n\nSegue o comprovante do PIX:`)}`;

            setQrCodeData(pixData);
            setPedidoAtual({ ...res.data, link_whatsapp: linkWhats });
            setCarrinho([]);
            setModalPixAberto(true);
            
            carregarProdutos();
        } catch (e) {
            alert(e.response?.data?.erro || 'Erro ao processar o checkout. Verifique a disponibilidade dos itens.');
        }
    };

    return (
        <div style={{ background: 'linear-gradient(135deg, #241610 0%, #0a0705 50%, #170d08 100%)', minHeight: '100vh', color: '#E2E8F0', fontFamily: '"Georgia", serif', position: 'relative', overflowX: 'hidden' }}>
            {/* Elementos decorativos de fundo para dar o efeito de desfoque de cor (blobs) */}
            <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0, borderRadius: '50%' }}></div>

            <style>{`
                .gold-title { font-family: 'Playfair Display', serif; font-weight: 900; color: #E8D38C; text-shadow: 0 2px 10px rgba(212,175,55,0.2); }
                .text-body { font-family: 'Lora', serif; line-height: 1.8; color: #C0C0C0; font-size: 1.05rem; }
                .text-gradient { background: linear-gradient(135deg, #F9E596, #C79A3B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; }
                
                .page-layout { display: flex; padding: 0; min-height: 100vh; position: relative; zIndex: 1; }
                .content-area { flex: 1; padding: 0; overflow-y: auto; scroll-behavior: smooth; }
                
                /* EFEITO GLASSMORPHISM NA SIDEBAR */
                .glass-sidebar { width: 420px; background: rgba(20, 12, 8, 0.45); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-left: 1px solid rgba(255, 255, 255, 0.05); box-shadow: -10px 0 40px rgba(0,0,0,0.5); position: sticky; top: 0; height: 100vh; overflow-y: auto; font-family: sans-serif; padding: 2.5rem; }
                
                /* EFEITO RUBBER E GLASS NOS BOTÕES */
                .btn-gold { 
                    background: linear-gradient(135deg, rgba(212,175,55,0.85), rgba(184,134,11,0.85)); 
                    backdrop-filter: blur(8px);
                    color: #110A05; 
                    border: 1px solid rgba(255, 255, 255, 0.2); 
                    padding: 16px; 
                    border-radius: 12px; 
                    font-weight: 900; 
                    font-size: 0.85rem; 
                    cursor: pointer; 
                    text-transform: uppercase; 
                    letter-spacing: 2px; 
                    width: 100%; 
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Rubber Easing */
                }
                .btn-gold:hover { 
                    transform: translateY(-4px) scale(1.02); 
                    box-shadow: 0 15px 35px rgba(212,175,55,0.3), inset 0 2px 4px rgba(255,255,255,0.3); 
                    background: linear-gradient(135deg, rgba(222,185,65,0.95), rgba(194,144,21,0.95));
                }
                .btn-gold:active { 
                    transform: translateY(2px) scale(0.97); /* Compressão elástica ao clicar */
                    box-shadow: 0 5px 15px rgba(0,0,0,0.4);
                }
                .btn-gold:disabled { background: rgba(40,40,40,0.5); color: #777; cursor: not-allowed; transform: none; box-shadow: none; border-color: transparent; }
                
                .btn-outline-gold { 
                    background: rgba(212,175,55,0.05); 
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(212,175,55,0.4); 
                    color: #E8D38C; 
                    padding: 12px 24px; 
                    border-radius: 30px; 
                    cursor: pointer; 
                    text-transform: uppercase; 
                    letter-spacing: 2px; 
                    font-size: 0.75rem; 
                    font-weight: bold; 
                    width: 100%; 
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .btn-outline-gold:hover { 
                    background: rgba(212,175,55,0.15); 
                    transform: translateY(-3px) scale(1.03); 
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    border-color: rgba(212,175,55,0.8);
                }
                .btn-outline-gold:active { transform: translateY(1px) scale(0.98); }
                
                /* INPUTS MODERNIZADOS (Desfoque interno leve) */
                .input-luxury { 
                    background: rgba(10, 5, 3, 0.5); 
                    border: 1px solid rgba(255, 255, 255, 0.08); 
                    border-radius: 10px; 
                    padding: 14px 16px; 
                    color: #fff; 
                    width: 100%; 
                    margin-bottom: 15px; 
                    outline: none; 
                    font-family: sans-serif; 
                    font-size: 0.9rem; 
                    transition: all 0.3s ease; 
                    box-sizing: border-box; 
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
                }
                .input-luxury:focus { 
                    border-color: rgba(212,175,55,0.6); 
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5), 0 0 15px rgba(212,175,55,0.15); 
                    background: rgba(20, 12, 8, 0.8);
                }
                
                /* CARDS DOS PRODUTOS EM GLASSMORPHISM */
                .glass-card { 
                    background: rgba(25, 17, 12, 0.3); 
                    backdrop-filter: blur(12px); 
                    -webkit-backdrop-filter: blur(12px); 
                    padding: 3rem 2.5rem; 
                    border-radius: 20px; 
                    border: 1px solid rgba(255, 255, 255, 0.06); 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    position: relative; 
                    overflow: hidden; 
                    box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .glass-card:hover { 
                    transform: translateY(-8px); 
                    border-color: rgba(212,175,55,0.3); 
                    box-shadow: 0 25px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,175,55,0.2); 
                    background: rgba(30, 20, 15, 0.45);
                }
                
                /* EMBALAGENS LEVEMENTE MAIS SUAVES */
                .embalagem { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); transition: transform 0.4s ease; }
                .glass-card:hover .embalagem { transform: scale(1.05); }
                .pacote-tradicional { width: 170px; height: 260px; border-radius: 12px 12px 20px 20px; background: linear-gradient(145deg, #1c140e, #0a0705); border: 1px solid rgba(255,255,255,0.05); }
                .sache-avulso { width: 120px; height: 130px; border-radius: 10px; background: linear-gradient(145deg, #221812, #0d0907); border: 1px solid rgba(255,255,255,0.08); margin-top: 40px; margin-bottom: 30px; }
                
                .selo-topo { width: 100%; height: 25px; border-radius: 10px 10px 0 0; background: linear-gradient(90deg, #140d0a, #241812, #140d0a); border-bottom: 2px dashed rgba(212,175,55,0.2); }
                .rotulo-interno { width: 75%; background: rgba(10, 6, 4, 0.8); backdrop-filter: blur(4px); border: 1px solid rgba(212,175,55,0.5); padding: 15px 10px; text-align: center; border-radius: 8px; box-shadow: inset 0 0 15px rgba(212,175,55,0.05); }
                
                .badge-stock { position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(184,134,11,0.05)); backdrop-filter: blur(5px); color: #E8D38C; padding: 6px 14px; border-radius: 20px; font-size: 0.7rem; font-family: sans-serif; letter-spacing: 1px; border: 1px solid rgba(212,175,55,0.2); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }

                @media (max-width: 1024px) {
                    .page-layout { flex-direction: column; }
                    .glass-sidebar { width: 100%; height: auto; position: relative; border-left: none; border-top: 1px solid rgba(255,255,255,0.05); }
                    .content-area { overflow-y: visible; }
                    .coffees-grid { grid-template-columns: 1fr !important; gap: 2rem; }
                }
            `}</style>

            <div className="page-layout">
                <div className="content-area">
                    {/* HEADER COM GLASSMORPHISM */}
                    <header style={{ padding: '1.5rem 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(20, 12, 8, 0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                        <h1 className="gold-title" style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '4px', textTransform: 'uppercase' }}>
                            <i className="fas fa-crown" style={{ marginRight: '12px', fontSize: '1.1rem' }}></i> MATILDA
                        </h1>
                        <div style={{ fontFamily: 'sans-serif', fontSize: '0.75rem', color: '#D4AF37', letterSpacing: '2px', fontWeight: 'bold' }}>CURITIBA • ORIGEM SUL DE MINAS</div>
                    </header>

                    <section style={{ padding: '8rem 4rem', position: 'relative', zIndex: 2 }}>
                        <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center' }}>
                            <h2 className="gold-title" style={{ fontSize: '3.8rem', marginBottom: '1.5rem', lineHeight: 1.15 }}>
                                A bebida das<br/>mentes brilhantes.
                            </h2>
                            <p className="text-body" style={{ fontSize: '1.15rem', maxWidth: '580px', margin: '0 auto', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                Lotes artesanais cultivados sob condições ideais de altitude, colhidos seletivamente e torrados sob medida para preservar a complexidade sensorial de uma pontuação de 84 pontos SCA.
                            </p>
                        </div>
                    </section>

                    <section style={{ padding: '2rem 4rem 6rem 4rem', position: 'relative', zIndex: 2 }}>
                        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                            <h3 className="gold-title" style={{ fontSize: '1.8rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Coleção Disponível</h3>
                            <div style={{ width: '35px', height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)', margin: '20px auto', borderRadius: '2px' }}></div>
                        </div>

                        {produtos.length === 0 ? (
                            <div className="glass-card" style={{ maxWidth: '550px', margin: '0 auto', textAlign: 'center', padding: '4rem 2rem' }}>
                                <i className="fas fa-hourglass-half" style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#D4AF37', opacity: 0.8, filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))' }}></i>
                                <h3 style={{ fontFamily: 'sans-serif', color: '#fff', letterSpacing: '1px', marginBottom: '12px', fontSize: '1.2rem' }}>Torra de Lotes em Curso</h3>
                                <p className="text-body" style={{ fontSize: '0.95rem' }}>Nossos grãos especiais estão no ciclo final de maturação e torrefação. Fique atento às próximas liberações de stock no ERP.</p>
                            </div>
                        ) : (
                            <div className="coffees-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                                {produtos.map(p => {
                                    const isSache = Number(p.peso_unitario_kg) <= 0.020;
                                    
                                    return (
                                        <div key={p.id} className="glass-card">
                                            <div className="badge-stock">{p.estoque_pacotes} ITENS EM STOCK</div>
                                            
                                            <div className={`embalagem ${isSache ? 'sache-10g' : 'pacote-tradicional'}`}>
                                                {!isSache && <div className="selo-topo"></div>}
                                                <div className="rotulo-interno" style={{ marginTop: isSache ? '0' : '20px' }}>
                                                    <div style={{ color: '#fff', fontWeight: 900, letterSpacing: '2px', fontSize: isSache ? '0.75rem' : '1.05rem', textTransform: 'uppercase' }}>Matilda</div>
                                                    <div style={{ color: '#D4AF37', fontSize: '0.55rem', letterSpacing: '2px', marginTop: '4px', fontWeight: 'bold' }}>{isSache ? 'DRIP COFFEE' : 'CAFÉ ESPECIAL'}</div>
                                                    <div style={{ color: '#aaa', fontSize: '0.55rem', marginTop: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>{isSache ? '10G NET' : '250G NET'}</div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'center', marginTop: '2.5rem', flex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
                                                <h4 className="gold-title" style={{ fontSize: '1.5rem', marginBottom: '0.8rem', minHeight: '40px' }}>{p.nome}</h4>
                                                <p className="text-body" style={{ fontSize: '0.95rem', marginBottom: '2rem', flex: 1 }}>{p.descricao}</p>
                                                
                                                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left', marginBottom: '2rem', fontFamily: 'sans-serif' }}>
                                                    <div style={{ fontSize: '0.7rem', color: '#D4AF37', textAlign: 'center', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'bold' }}>Laudo Sensorial</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}><span>Procedência:</span> <span style={{ color: '#ddd' }}>Ouro Verde (MG)</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}><span>Variedade:</span> <span style={{ color: '#ddd' }}>Catuaí Vermelho</span></div>
                                                    <div style={{ fontSize: '0.8rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}><span>Classificação:</span> <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>84 Pontos SCA</span></div>
                                                </div>

                                                <div className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '1.5rem', fontFamily: 'sans-serif', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                                                    <span style={{ fontSize: '1rem', color: '#888', marginRight: '6px', verticalAlign: 'middle', fontWeight: 'normal' }}>R$</span>
                                                    {Number(p.preco_venda).toFixed(2)}
                                                </div>
                                                
                                                <button onClick={() => addAoCarrinho(p)} className="btn-outline-gold">
                                                    Adicionar à Sacola
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="glass-sidebar">
                    <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.2rem', color: '#E8D38C', fontFamily: 'sans-serif', margin: '0 0 2rem 0', textTransform: 'uppercase', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fas fa-shopping-bag" style={{ fontSize: '0.95rem' }}></i> Itens Escolhidos
                    </h2>

                    <div style={{ minHeight: '42vh', marginBottom: '2rem' }}>
                        {carrinho.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#333', marginTop: '6rem' }}>
                                <i className="fas fa-feather-alt" style={{ fontSize: '2.5rem', marginBottom: '1.2rem', opacity: 0.2, color: '#D4AF37' }}></i>
                                <p style={{ fontFamily: '"Georgia", serif', fontStyle: 'italic', fontSize: '0.95rem', color: '#777' }}>A sua sacola está vazia.<br/>Mapeie as notas sensoriais acima.</p>
                            </div>
                        ) : (
                            carrinho.map(i => (
                                <div key={i.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s ease' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#eee', fontSize: '0.9rem', marginBottom: '4px' }}>{i.nome}</div>
                                        <div style={{ color: '#D4AF37', fontSize: '0.8rem', fontFamily: 'sans-serif', letterSpacing: '0.5px' }}>{i.qtd}x R$ {Number(i.preco_venda).toFixed(2)}</div>
                                    </div>
                                    <button onClick={() => removerDoCarrinho(i.id)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} onMouseOver={e => { e.currentTarget.style.color = '#F44336'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)'; }} onMouseOut={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                                        <i className="fas fa-times" style={{ fontSize: '0.85rem' }}></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 900, marginBottom: '2rem', color: '#fff', fontFamily: 'sans-serif', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', alignItems: 'center' }}>
                        <span style={{ letterSpacing: '1px', color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold' }}>SUBTOTAL</span>
                        <span className="text-gradient">R$ {total.toFixed(2)}</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                        <p style={{ color: '#D4AF37', fontSize: '0.75rem', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', textAlign: 'center' }}>Logística de Envio</p>
                        
                        <input className="input-luxury" placeholder="Nome Completo" value={cliente.nome} onChange={e => setCliente({...cliente, nome: e.target.value})} />
                        <input className="input-luxury" placeholder="WhatsApp (Com DDD)" value={cliente.whats} onChange={e => setCliente({...cliente, whats: e.target.value})} />
                        
                        <select className="input-luxury" value={cliente.entrega} onChange={e => setCliente({...cliente, entrega: e.target.value})} style={{ cursor: 'pointer', appearance: 'none', backgroundImage: 'linear-gradient(45deg, transparent 50%, #D4AF37 50%), linear-gradient(135deg, #D4AF37 50%, transparent 50%)', backgroundPosition: 'calc(100% - 20px) calc(1em + 2px), calc(100% - 15px) calc(1em + 2px)', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}>
                            <option value="uber_municipal" style={{background: '#111'}}>🚗 Despachar via Uber Flash</option>
                            <option value="retirada" style={{background: '#111'}}>🏪 Retirada Presencial na Loja</option>
                        </select>

                        <button className="btn-gold" style={{ marginTop: '15px' }} onClick={finalizarPedido} disabled={carrinho.length === 0}>
                            GERAR QR CODE PIX
                        </button>
                    </div>
                </aside>
            </div>

            {/* MODAL PIX COM GLASSMORPHISM */}
            {modalPixAberto && pedidoAtual && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)' }}>
                    <div style={{ background: 'rgba(25, 17, 12, 0.7)', border: '1px solid rgba(212,175,55,0.3)', padding: '3.5rem 2.5rem', borderRadius: '24px', textAlign: 'center', maxWidth: '420px', width: '90%', boxShadow: '0 30px 60px rgba(0,0,0,0.8), inset 0 2px 10px rgba(255,255,255,0.1)', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' }}>
                        
                        {/* Brilho de fundo no modal */}
                        <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: 'rgba(212,175,55,0.2)', filter: 'blur(50px)', borderRadius: '50%', zIndex: 0 }}></div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ width: '65px', height: '65px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.05))', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#D4AF37', fontSize: '1.8rem', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                                <i className="fab fa-pix"></i>
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '6px', letterSpacing: '0.5px' }}>Pagamento Instantâneo</h2>
                            <p style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem' }}>Pedido Identificado nº {pedidoAtual.orderId}</p>
                            
                            <div style={{ background: 'rgba(255,255,255,0.95)', padding: '16px', borderRadius: '16px', display: 'inline-block', margin: '0 0 2rem 0', boxShadow: '0 15px 30px rgba(0,0,0,0.4)' }}>
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCodeData)}`} alt="QR PIX SEGURADO" style={{ display: 'block' }} />
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', margin: '0 0 2rem 0', wordBreak: 'break-all', border: '1px dashed rgba(212,175,55,0.3)', position: 'relative' }}>
                                <small style={{ color: '#aaa', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>Pix Copia e Cola:</small>
                                <div style={{ color: '#E8D38C', fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: 1.4 }}>{qrCodeData}</div>
                            </div>

                            <div className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '2.5rem', fontWeight: 900, filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>R$ {pedidoAtual.total.toFixed(2)}</div>

                            <button className="btn-gold" style={{ marginBottom: '16px', fontSize: '0.9rem', padding: '18px' }} onClick={() => window.open(pedidoAtual.link_whatsapp)}>
                                <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem', marginRight: '10px', verticalAlign: 'middle' }}></i> ENVIAR COMPROVANTE
                            </button>
                            <button onClick={() => setModalPixAberto(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '12px', width: '100%', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold', transition: 'color 0.3s ease' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#888'}>
                                Retornar à Loja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LojaVirtual;