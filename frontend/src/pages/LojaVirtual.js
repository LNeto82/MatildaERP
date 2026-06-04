import React, { useState, useEffect } from 'react';

import api from '../services/api';



// ==========================================
// ESTILOS AVANÇADOS (GLASS, RUBBER, GRADIENTS)
// ==========================================

const customStyles = `

  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap');



  body, html {

    margin: 0;

    padding: 0;

    background-color: #010101;

    font-family: 'Montserrat', sans-serif;

    color: #111111;

  }



  /* Fundo Branco com sutis manchas douradas para o Glassmorphism funcionar */

  .page-container {

    min-height: 100vh;

    background: 

      radial-gradient(circle at 15% 50%, rgba(212, 175, 55, 0.08), transparent 25%),

      radial-gradient(circle at 85% 30%, rgba(212, 175, 55, 0.05), transparent 25%),

      #FFFFFF;

    display: flex;

    flex-direction: column;

  }



  /* EFEITO GLASSMORPHISM (VIDRO DESFOCADO) */

  .glass-panel {

    background: rgba(255, 255, 255, 0.65);

    backdrop-filter: blur(16px);

    -webkit-backdrop-filter: blur(16px);

    border: 1px solid rgba(212, 175, 55, 0.4);

    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05);

    border-radius: 20px;

  }



  /* EFEITO RUBBER E DEGRADÊ NOS BOTÕES */

  .btn-rubber {

    background: linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #B8860B 100%);

    background-size: 200% auto;

    color: #000000;

    font-weight: 800;

    text-transform: uppercase;

    letter-spacing: 1px;

    border: none;

    padding: 15px 25px;

    border-radius: 12px;

    cursor: pointer;

    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);

    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); 

  }



  .btn-rubber:hover {

    background-position: right center;

    transform: scale(1.05);

    box-shadow: 0 8px 20px rgba(212, 175, 55, 0.5);

  }



  .btn-rubber:active {

    transform: scale(0.90);

  }



  .btn-pix-copiar {

    background: #111;

    color: #D4AF37;

    font-weight: bold;

    border: 1px solid rgba(212, 175, 55, 0.5);

    padding: 10px 20px;

    border-radius: 8px;

    cursor: pointer;

    margin-bottom: 15px;

    transition: 0.2s;

  }

  .btn-pix-copiar:hover {

    background: #222;

    transform: scale(1.02);

  }



  /* LAYOUT 50/50 */

  .split-layout {

    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 30px;

    padding: 30px 5%;

    flex: 1;

  }



  .coffee-list {

    display: flex;

    flex-direction: column;

    gap: 20px;

    max-height: 80vh;

    overflow-y: auto;

    padding-right: 15px;

  }



  .coffee-list::-webkit-scrollbar { width: 6px; }

  .coffee-list::-webkit-scrollbar-track { background: transparent; }

  .coffee-list::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.5); border-radius: 10px; }



  .coffee-card {

    padding: 20px;

    cursor: pointer;

    transition: transform 0.2s, background 0.2s;

  }

  

  .coffee-card:hover {

    background: rgba(212, 175, 55, 0.1);

    transform: translateX(10px);

  }



  .coffee-card.active {

    border-left: 6px solid #D4AF37;

    background: rgba(212, 175, 55, 0.15);

  }



  .details-panel {

    display: flex;

    flex-direction: column;

    justify-content: center;

    padding: 40px;

    text-align: center;

    position: sticky;

    top: 30px;

    height: fit-content;

  }



  .header {

    display: flex;

    justify-content: space-between;

    align-items: center;

    padding: 20px 5%;

    border-bottom: 1px solid rgba(212, 175, 55, 0.2);

  }



  .modal-overlay {

    position: fixed;

    inset: 0;

    background: rgba(255, 255, 255, 0.3);

    backdrop-filter: blur(8px);

    display: flex;

    justify-content: center;

    align-items: center;

    z-index: 1000;

  }



  .input-glass {

    width: 100%;

    padding: 15px;

    margin-bottom: 15px;

    background: rgba(255,255,255,0.8);

    border: 1px solid rgba(212, 175, 55, 0.5);

    border-radius: 10px;

    color: #111;

    font-family: 'Montserrat', sans-serif;

    font-weight: 600;

    outline: none;

    box-sizing: border-box;

  }

  .input-glass:focus {

    border-color: #D4AF37;

    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2);

  }



  @media (max-width: 900px) {

    .split-layout { grid-template-columns: 1fr; }

    .details-panel { position: relative; top: 0; }

  }

`;



const formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });



// =========================================================================
// CONFIGURAÇÕES REAIS DA LOJA
// =========================================================================

const WHATSAPP_LOJA = "5541988495454"; 

const CHAVE_PIX_ALEATORIA = "00020126580014br.gov.bcb.pix0136COLOQUE-SUA-CHAVE-AQUI-5204000053039865802BR5925Marcelli Matilda Cafe6009Curitiba62070503***63040000"; 

// =========================================================================



const LojaVirtual = () => {

    const [produtos, setProdutos] = useState([]);

    const [selecionado, setSelecionado] = useState(null);

    const [carrinho, setCarrinho] = useState([]);

    const [modalAberto, setModalAberto] = useState(false);

    const [sucessoCheckout, setSucessoCheckout] = useState(null); 

    const [formCheckout, setFormCheckout] = useState({ cliente_nome: '', cliente_whats: '', metodo_pagamento: 'pix' });



    useEffect(() => {

        api.get('/products')

            .then(res => {

                setProdutos(res.data);

                if (res.data.length > 0) setSelecionado(res.data[0]); 

            })

            .catch(err => console.error(err));

    }, []);



    const adicionarAoCarrinho = () => {

        if (!selecionado) return;

        const itemExistente = carrinho.find(item => item.product_id === selecionado.id);

        

        if (itemExistente) {

            setCarrinho(carrinho.map(item => item.product_id === selecionado.id ? { ...item, quantidade: item.quantidade + 1 } : item));

        } else {

            setCarrinho([...carrinho, { product_id: selecionado.id, nome: selecionado.nome, preco_venda: selecionado.preco_venda, quantidade: 1 }]);

        }

        alert(`${selecionado.nome} adicionado ao carrinho!`);

    };



    // 🔥 NOVA FUNÇÃO: REMOVER ITEM OU DIMINUIR QUANTIDADE

    const removerDoCarrinho = (productId) => {

        setCarrinho(carrinho.map(item => {

            if (item.product_id === productId) {

                return { ...item, quantidade: item.quantidade - 1 };

            }

            return item;

        }).filter(item => item.quantidade > 0)); // Remove do array se zerar

    };



    const totalCarrinho = carrinho.reduce((acc, item) => acc + (parseFloat(item.preco_venda) * item.quantidade), 0);



    const finalizarCompra = async (e) => {

        e.preventDefault();

        try {

            const res = await api.post('/orders', { items: carrinho, ...formCheckout });

            

            setSucessoCheckout({

                pedido_id: res.data.orderId,

                total: res.data.total,

                metodo: formCheckout.metodo_pagamento,

                nome_cliente: formCheckout.cliente_nome

            });

            

            setCarrinho([]); 

            setFormCheckout({ cliente_nome: '', cliente_whats: '', metodo_pagamento: 'pix' });

        } catch (error) {

            alert(error.response?.data?.erro || 'Erro ao finalizar pedido.');

        }

    };



    const copiarChavePix = () => {

        navigator.clipboard.writeText(CHAVE_PIX_ALEATORIA)

            .then(() => alert('Chave PIX Aleatória copiada com sucesso! Cole no app do seu banco.'))

            .catch(() => alert('Erro ao copiar a chave PIX. Tente selecionar o texto manualmente.'));

    };



    const enviarParaWhatsApp = () => {

        if (!sucessoCheckout) return;

        

        const texto = `☕ Olá, Marcelli! Sou ${sucessoCheckout.nome_cliente}.\n\nAcabei de registrar o Pedido *#${sucessoCheckout.pedido_id}* na loja virtual.\n\n*Valor Total:* R$ ${formatarMoeda(sucessoCheckout.total)}\n*Pagamento:* ${sucessoCheckout.metodo.toUpperCase()}.\n\nEstou enviando esta mensagem para confirmar meu pedido. Aguardo as instruções para envio do comprovante ou confirmação de pagamento!`;

        const linkWhats = `https://wa.me/${WHATSAPP_LOJA}?text=${encodeURIComponent(texto)}`;

        

        window.open(linkWhats, '_blank');

        

        setSucessoCheckout(null);

        setModalAberto(false);

    };



    const fecharModalGeral = () => {

        setModalAberto(false);

        setSucessoCheckout(null);

    };



    return (

        <div className="page-container">

            <style>{customStyles}</style>



            {/* HEADER */}

            <header className="header glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>

                <h1 style={{ margin: 0, fontWeight: 900, color: '#000', letterSpacing: '2px' }}>

                    MATILDA <span style={{ color: '#D4AF37' }}>CAFÉ</span>

                </h1>

                

                <button className="btn-rubber" onClick={() => setModalAberto(true)}>

                    <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i>

                    Carrinho ({carrinho.length}) - R$ {formatarMoeda(totalCarrinho)}

                </button>

            </header>



            {/* LAYOUT 50/50 */}

            <main className="split-layout">

                <div className="coffee-list">

                    <h2 style={{ color: '#D4AF37', borderBottom: '2px solid #D4AF37', paddingBottom: '10px' }}>NOSSAS OPÇÕES</h2>

                    

                    {produtos.length === 0 ? (

                        <p>Nenhum produto disponível no momento.</p>

                    ) : (

                        produtos.map(p => (

                            <div 

                                key={p.id} 

                                className={`glass-panel coffee-card ${selecionado?.id === p.id ? 'active' : ''}`}

                                onClick={() => setSelecionado(p)}

                            >

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                                    <div>

                                        <h3 style={{ margin: '0 0 5px 0', fontWeight: 800 }}>{p.nome}</h3>

                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>{p.tipo === 'sache' ? 'Sachê / Drip' : 'Pacote 250g'}</span>

                                    </div>

                                    <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: '1.2rem' }}>

                                        R$ {formatarMoeda(p.preco_venda)}

                                    </div>

                                </div>

                            </div>

                        ))

                    )}

                </div>



                <div className="details-panel glass-panel">

                    {selecionado ? (

                        <>

                            <div style={{ marginBottom: '30px' }}>

                                <i className="fas fa-coffee" style={{ fontSize: '4rem', color: '#D4AF37', marginBottom: '20px' }}></i>

                                <h1 style={{ fontWeight: 900, fontSize: '2.5rem', margin: '0 0 10px 0', color: '#000' }}>

                                    {selecionado.nome}

                                </h1>

                                <h2 style={{ color: '#D4AF37', fontWeight: 800, fontSize: '2rem', margin: '0 0 20px 0' }}>

                                    R$ {formatarMoeda(selecionado.preco_venda)}

                                </h2>

                                

                                <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '20px', borderRadius: '15px', border: '1px dashed rgba(212, 175, 55, 0.5)', marginBottom: '30px' }}>

                                    <p style={{ lineHeight: '1.8', margin: 0, fontSize: '1.1rem', color: '#333' }}>

                                        {selecionado.descricao}

                                    </p>

                                </div>

                            </div>



                            <button className="btn-rubber" style={{ fontSize: '1.2rem', padding: '20px' }} onClick={adicionarAoCarrinho}>

                                ADICIONAR AO CARRINHO

                            </button>

                        </>

                    ) : (

                        <div style={{ color: '#999' }}>

                            <i className="fas fa-hand-pointer" style={{ fontSize: '3rem', marginBottom: '20px' }}></i>

                            <h2>Selecione um produto ao lado para ver os detalhes.</h2>

                        </div>

                    )}

                </div>

            </main>



            {/* MODAL DE CHECKOUT */}

            {modalAberto && (

                <div className="modal-overlay">

                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' }}>

                        

                        {/* ESTÁGIO 1: SUCESSO E PIX */}

                        {sucessoCheckout ? (

                            <div style={{ textAlign: 'center' }}>

                                <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#25D366', marginBottom: '10px' }}></i>

                                <h2 style={{ color: '#000', fontWeight: 900 }}>Pedido #{sucessoCheckout.pedido_id} Registrado!</h2>

                                

                                {sucessoCheckout.metodo === 'pix' ? (

                                    <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '15px', margin: '20px 0' }}>

                                        <h3 style={{ margin: '0 0 10px 0', color: '#D4AF37' }}>Pague via PIX</h3>

                                        

                                        <img 

                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(CHAVE_PIX_ALEATORIA)}`} 

                                            alt="QR Code PIX" 

                                            style={{ borderRadius: '10px', marginBottom: '15px' }} 

                                        />

                                        

                                        <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.85rem' }}>Ou copie a chave aleatória abaixo:</p>

                                        <button className="btn-pix-copiar" type="button" onClick={copiarChavePix}>

                                            <i className="fas fa-copy" style={{ marginRight: '8px' }}></i>

                                            COPIAR CHAVE PIX

                                        </button>



                                        <p style={{ margin: '15px 0 0 0', fontSize: '1.1rem', color: '#25D366', fontWeight: 'bold' }}>Valor do Pedido: R$ {formatarMoeda(sucessoCheckout.total)}</p>

                                    </div>

                                ) : (

                                    <div style={{ background: 'rgba(212,175,55,0.1)', padding: '20px', borderRadius: '15px', margin: '20px 0' }}>

                                        <h3 style={{ margin: '0', color: '#D4AF37' }}>Separe o valor de R$ {formatarMoeda(sucessoCheckout.total)} para a entrega.</h3>

                                    </div>

                                )}



                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>

                                    Envie seu pedido para o nosso WhatsApp para validarmos o pagamento e a entrega!

                                </p>



                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                                    <button className="btn-rubber" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff' }} onClick={enviarParaWhatsApp}>

                                        <i className="fab fa-whatsapp" style={{ marginRight: '10px' }}></i> ENVIAR PEDIDO NO WHATSAPP

                                    </button>

                                    <button className="btn-rubber" style={{ background: '#E2E8F0', color: '#333' }} onClick={fecharModalGeral}>

                                        FECHAR

                                    </button>

                                </div>

                            </div>



                        /* ESTÁGIO 2: CARRINHO VAZIO */

                        ) : carrinho.length === 0 ? (

                            <div style={{ textAlign: 'center' }}>

                                <i className="fas fa-shopping-cart" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }}></i>

                                <h2 style={{ color: '#000', fontWeight: 900, marginBottom: '20px' }}>Seu carrinho está vazio.</h2>

                                <button className="btn-rubber" style={{ width: '100%', background: '#E2E8F0', color: '#333' }} onClick={fecharModalGeral}>

                                    VOLTAR PARA A LOJA

                                </button>

                            </div>



                        /* ESTÁGIO 3: FORMULÁRIO DE COMPRA */

                        ) : (

                            <form onSubmit={finalizarCompra}>

                                <h2 style={{ textAlign: 'center', color: '#000', fontWeight: 900, marginBottom: '30px' }}>Finalizar Pedido</h2>

                                

                                <div style={{ background: 'rgba(212,175,55,0.1)', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>

                                    <h4 style={{ margin: '0 0 10px 0', color: '#D4AF37' }}>Resumo:</h4>

                                    

                                    {/* LISTAGEM COM BOTÃO REMOVER INTEGRADOO */}

                                    {carrinho.map((item, idx) => (

                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>

                                            <span style={{ color: '#000' }}>{item.quantidade}x {item.nome}</span>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                                                <span style={{ color: '#555' }}>R$ {formatarMoeda(item.preco_venda * item.quantidade)}</span>

                                                <button 

                                                    type="button" 

                                                    onClick={() => removerDoCarrinho(item.product_id)} 

                                                    style={{ background: 'transparent', border: 'none', color: '#FF4B4B', cursor: 'pointer', padding: '0 5px', fontSize: '1rem' }}

                                                    title="Remover uma unidade"

                                                >

                                                    <i className="fas fa-trash-alt"></i>

                                                </button>

                                            </div>

                                        </div>

                                    ))}

                                    

                                    <h3 style={{ margin: '15px 0 0 0', borderTop: '1px solid rgba(212,175,55,0.3)', paddingTop: '10px', textAlign: 'right', color: '#000' }}>

                                        Total: R$ {formatarMoeda(totalCarrinho)}

                                    </h3>

                                </div>



                                <input className="input-glass" type="text" placeholder="Seu Nome Completo" value={formCheckout.cliente_nome} onChange={e => setFormCheckout({...formCheckout, cliente_nome: e.target.value})} required />

                                <input className="input-glass" type="text" placeholder="WhatsApp (Apenas Números)" value={formCheckout.cliente_whats} onChange={e => setFormCheckout({...formCheckout, cliente_whats: e.target.value})} required />

                                

                                <select className="input-glass" value={formCheckout.metodo_pagamento} onChange={e => setFormCheckout({...formCheckout, metodo_pagamento: e.target.value})}>

                                    <option value="pix">Pagamento via PIX</option>

                                    <option value="dinheiro">Dinheiro na Entrega</option>

                                </select>



                                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>

                                    <button type="submit" className="btn-rubber" style={{ flex: 2 }}>GERAR PEDIDO</button>

                                    <button type="button" className="btn-rubber" style={{ flex: 1, background: '#E2E8F0', color: '#333' }} onClick={fecharModalGeral}>VOLTAR</button>

                                </div>

                            </form>

                        )}



                    </div>

                </div>

            )}

        </div>

    );

};



export default LojaVirtual;