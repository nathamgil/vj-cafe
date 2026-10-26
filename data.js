/* VJ Café & Pâtisserie — dados da demo (localStorage). Site e painel na mesma origem:
   pedido feito no site aparece no painel na hora. Em produção vira Supabase. Preços são EXEMPLO. */
(function () {
  const KEY = 'vj_db_v2';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('vj_sync') : null;
  const ls = [];
  const LOJA = {
    nome: 'VJ Café & Pâtisserie', slogan: 'Inspirado em Paris. Feito em Salvador.',
    whatsapp: '5571991220320', whatsappFmt: '(71) 99122-0320', instagram: 'vjcafeepatisserie',
    endereco: 'Livraria Escariz · Shopping Barra, piso L2 · Salvador-BA',
    horario: 'Segunda a sábado 9h–22h · Domingo 12h–20h (horário da livraria, confirmar)',
  };
  const CATS = ['Cafés', 'Pâtisserie', 'Tortas inteiras', 'Salgados & almoço', 'Bebidas frias'];
  const PRODUTOS = [
    ['espresso', 'Cafés', 'Espresso', 7, '', ['cafe:9', 'copo:1']],
    ['cappuccino', 'Cafés', 'Cappuccino', 14, '', ['cafe:9', 'leite:120', 'copo:1']],
    ['latte', 'Cafés', 'Café latte', 13, '', ['cafe:9', 'leite:180', 'copo:1']],
    ['mocha', 'Cafés', 'Mocha com chocolate belga', 16, '', ['cafe:9', 'leite:150', 'choco:20', 'copo:1']],
    ['croissant', 'Pâtisserie', 'Croissant de manteiga', 12, '', ['croissant:1']],
    ['fatia-brig', 'Pâtisserie', 'Fatia torta de brigadeiro', 22, 'brigadeiro.jpg', ['torta-brig:1']],
    ['fatia-cenoura', 'Pâtisserie', 'Fatia torta de cenoura com nozes caramelizadas', 24, 'cenoura.jpg', ['torta-cen:1']],
    ['fatia-tapioca', 'Pâtisserie', 'Fatia torta de tapioca com doce de leite', 20, 'tapioca.jpg', ['torta-tap:1']],
    ['fatia-abacaxi', 'Pâtisserie', 'Fatia torta de abacaxi caramelizado com coco', 20, '', ['torta-aba:1']],
    ['fatia-zero', 'Pâtisserie', 'Fatia torta zero glúten e zero lactose', 24, '', ['torta-zero:1']],
    ['trufas', 'Pâtisserie', 'Caixa com 6 bombons finos', 36, 'bombons.jpg', ['bombom:6', 'caixa:1']],
    ['inteira-brig', 'Tortas inteiras', 'Torta de brigadeiro inteira (12 fatias) · encomenda', 190, 'brigadeiro.jpg', ['torta-brig:12']],
    ['inteira-cenoura', 'Tortas inteiras', 'Torta de cenoura com nozes inteira · encomenda', 210, 'cenoura.jpg', ['torta-cen:12']],
    ['cuscuz', 'Salgados & almoço', 'Cuscuz da casa', 18, 'cuscuz.jpg', []],
    ['quiche', 'Salgados & almoço', 'Quiche do dia', 22, '', []],
    ['salada', 'Salgados & almoço', 'Salada fresca da casa', 32, 'salada.jpg', []],
    ['rondelli', 'Salgados & almoço', 'Rondelli de ricota e espinafre ao quatro queijos', 46, 'massas.jpg', []],
    ['trouxinha', 'Salgados & almoço', 'Trouxinha de frango com requeijão ao pomodoro', 46, 'massas.jpg', []],
    ['suco', 'Bebidas frias', 'Suco natural 400 ml', 12, '', ['copo:1']],
    ['agua', 'Bebidas frias', 'Água mineral', 5, '', []],
  ].map(([id, cat, nome, preco, foto, ficha]) => ({ id, cat, nome, preco, foto, ficha: Object.fromEntries(ficha.map(f => { const [k, v] = f.split(':'); return [k, +v]; })) }));
  const ESTOQUE = [
    ['cafe', 'Café em grão', 'g', 2400, 1000, 0.12], ['leite', 'Leite integral', 'ml', 14000, 6000, 0.006],
    ['choco', 'Chocolate belga', 'g', 900, 500, 0.09], ['croissant', 'Croissant (massa congelada)', 'un', 14, 20, 2.8],
    ['torta-brig', 'Torta de brigadeiro (fatias)', 'fatia', 9, 6, 6.5], ['torta-cen', 'Torta de cenoura (fatias)', 'fatia', 11, 6, 7.2],
    ['torta-tap', 'Torta de tapioca (fatias)', 'fatia', 4, 6, 5.9], ['torta-aba', 'Torta de abacaxi (fatias)', 'fatia', 10, 6, 5.6],
    ['torta-zero', 'Torta zero glúten/lactose (fatias)', 'fatia', 7, 4, 8.1], ['bombom', 'Bombom fino', 'un', 48, 24, 2.1],
    ['caixa', 'Caixa presente', 'un', 30, 10, 3.5], ['copo', 'Copo/xícara descartável p/ viagem', 'un', 160, 80, 0.45],
  ].map(([id, nome, un, qtd, min, custo]) => ({ id, nome, un, qtd, min, custo }));
  const STATUS = [['novo', 'Novo'], ['preparo', 'Em preparo'], ['pronto', 'Pronto'], ['saiu', 'Com o motoboy'], ['concluido', 'Concluído'], ['cancelado', 'Cancelado']].map(([id, nome]) => ({ id, nome }));
  const CANAIS = { site: 'Site', ifood: 'iFood', balcao: 'Balcão', whatsapp: 'WhatsApp' };
  const CONFIG = { taxaIfoodPct: 26.2, taxaEntrega: 9, motoboyIfood: 'Entrega Fácil iFood (motoboy parceiro)' };

  const tel = t => String(t || '').replace(/\D/g, '').replace(/^55/, '');
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const brl = v => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function seed() {
    const now = Date.now(), ago = (d, h = 0) => new Date(now - d * 864e5 - h * 36e5).toISOString();
    const clientes = [
      ['Clarisse Peixinho', '71991230001', 'Barra', 9, 412, 1, 'Ama a torta zero glúten', ['vip']],
      ['Ricardo Almeida', '71991230002', 'Graça', 6, 388, 3, 'Reuniões de negócio às terças', ['empresa']],
      ['Lívia Pedrosa', '71991230003', 'Barra', 4, 156, 9, '', []],
      ['Cássia Ribeiro', '71991230004', 'Ondina', 3, 129, 18, 'Sem lactose', []],
      ['Escritório Moura & Lima', '71991230005', 'Barra', 5, 1260, 6, 'Encomenda de tortas p/ aniversariantes do mês', ['empresa', 'vip']],
      ['Ivana Lopes', '71991230006', 'Chame-Chame', 2, 74, 34, 'Ama croissant', []],
      ['Elenir Marques', '71991230007', 'Vitória', 1, 46, 21, '', []],
    ].map(([nome, t, bairro, pedidos, gasto, d, obs, tags], i) => ({ id: 'c' + (i + 1), nome, tel: t, bairro, pedidos, gasto, primeiro: ago(25 - i), ultimo: ago(d), obs, tags, aniversario: ['03/11', '15/11', '', '28/10', '', '10/12', ''][i] }));
    const pedidos = [], mk = (num, canal, cid, itens, tipo, status, d, h, pag) => {
      const sub = itens.reduce((s, [id, q]) => s + PRODUTOS.find(p => p.id === id).preco * q, 0), taxa = tipo === 'entrega' && canal !== 'ifood' ? CONFIG.taxaEntrega : 0;
      pedidos.push({ id: 'p' + num, num, canal, clienteId: cid, cliente: clientes.find(c => c.id === cid) || { nome: 'Cliente balcão' }, tipo, status, pagamento: pag,
        itens: itens.map(([id, q]) => { const p = PRODUTOS.find(x => x.id === id); return { id, nome: p.nome, preco: p.preco, qtd: q }; }),
        subtotal: sub, taxa, total: sub + taxa, criado: ago(d, h), estoqueBaixado: status !== 'novo', obs: '' });
    };
    mk(1201, 'ifood', 'c3', [['fatia-brig', 2], ['cappuccino', 2]], 'entrega', 'novo', 0, 0.2, 'ifood');
    mk(1200, 'site', 'c1', [['fatia-zero', 1], ['latte', 1]], 'retirada', 'preparo', 0, 0.4, 'pix');
    mk(1199, 'site', 'c5', [['inteira-cenoura', 1]], 'entrega', 'pronto', 0, 0.8, 'pix');
    mk(1198, 'balcao', null, [['espresso', 2], ['croissant', 2]], 'balcao', 'concluido', 0, 1.5, 'dinheiro');
    mk(1197, 'ifood', 'c4', [['trufas', 1]], 'entrega', 'concluido', 0, 2.5, 'ifood');
    mk(1196, 'balcao', 'c2', [['cappuccino', 3], ['quiche', 3], ['fatia-cenoura', 3]], 'balcao', 'concluido', 0, 3.2, 'debito');
    mk(1195, 'balcao', null, [['rondelli', 1], ['suco', 1]], 'balcao', 'concluido', 0, 4, 'dinheiro');
    for (let d = 1; d <= 13; d++) for (let k = 0; k < 6 + (d * 7) % 5; k++) {
      const canal = ['balcao', 'balcao', 'balcao', 'ifood', 'site'][(d + k) % 5], prods = ['cappuccino', 'fatia-brig', 'croissant', 'quiche', 'latte', 'fatia-cenoura', 'rondelli', 'trufas'];
      mk(1194 - d * 12 - k, canal, canal === 'balcao' ? null : 'c' + (1 + (d + k) % 7), [[prods[(d * 3 + k) % 8], 1 + (k % 2)], [prods[(d + k * 5) % 8], 1]], canal === 'balcao' ? 'balcao' : 'entrega', 'concluido', d, k, canal === 'ifood' ? 'ifood' : ['pix', 'credito', 'debito', 'dinheiro'][k % 4]);
    }
    const caixa = { aberto: true, abertura: ago(0, 6), fundo: 150, movs: [{ t: ago(0, 2), tipo: 'sangria', valor: 100, desc: 'Depósito no banco' }, { t: ago(0, 1), tipo: 'despesa', valor: 38, desc: 'Gelo e guardanapos' }] };
    return { v: 1, loja: LOJA, cats: CATS, produtos: PRODUTOS, estoque: ESTOQUE, movEstoque: [], status: STATUS, canais: CANAIS, config: CONFIG, clientes, pedidos, caixa, fechamentos: [], seq: 1201 };
  }
  function db() { try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v === 1) return r; } catch (e) {} const s = seed(); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} return s; }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} if (bc) bc.postMessage(1); ls.forEach(f => f(d)); }
  if (bc) bc.onmessage = () => { const d = db(); ls.forEach(f => f(d)); };
  window.addEventListener('storage', e => { if (e.key === KEY) { const d = db(); ls.forEach(f => f(d)); } });

  function consumo(d, ped) { const o = {}; ped.itens.forEach(i => { const p = d.produtos.find(x => x.id === i.id); if (p) Object.entries(p.ficha).forEach(([k, v]) => o[k] = (o[k] || 0) + v * i.qtd); }); return o; }
  function baixa(d, ped, sinal) { Object.entries(consumo(d, ped)).forEach(([k, q]) => { const e = d.estoque.find(x => x.id === k); if (e) e.qtd = Math.max(0, e.qtd - sinal * q); }); d.movEstoque.unshift({ t: new Date().toISOString(), tipo: sinal > 0 ? 'saída' : 'estorno', ref: 'Pedido #' + ped.num }); }

  function criarPedido(p) {
    const d = db(); let c = null;
    if (p.cliente && p.cliente.tel) {
      c = d.clientes.find(x => tel(x.tel) === tel(p.cliente.tel));
      if (!c) { c = { id: uid('c'), nome: p.cliente.nome, tel: tel(p.cliente.tel), bairro: p.bairro || '', pedidos: 0, gasto: 0, primeiro: new Date().toISOString(), ultimo: null, obs: '', tags: ['novo'], aniversario: '' }; d.clientes.push(c); }
    }
    const subtotal = p.itens.reduce((s, i) => s + i.preco * i.qtd, 0), taxa = p.tipo === 'entrega' && p.canal !== 'ifood' ? d.config.taxaEntrega : 0;
    const ped = Object.assign({ obs: '' }, p, { id: uid('p'), num: ++d.seq, clienteId: c ? c.id : null, cliente: c ? { nome: c.nome, tel: c.tel } : { nome: (p.cliente && p.cliente.nome) || 'Cliente balcão' }, subtotal, taxa, total: subtotal + taxa, status: p.status || 'novo', criado: new Date().toISOString(), estoqueBaixado: false });
    if (ped.status !== 'novo') { baixa(d, ped, 1); ped.estoqueBaixado = true; }
    if (ped.status === 'concluido' && c) { c.pedidos++; c.gasto += ped.total; c.ultimo = ped.criado; }
    d.pedidos.unshift(ped); save(d); return ped;
  }
  function mudarStatus(id, s) {
    const d = db(), ped = d.pedidos.find(x => x.id === id); if (!ped) return;
    if (s === 'preparo' && !ped.estoqueBaixado) { baixa(d, ped, 1); ped.estoqueBaixado = true; }
    if (s === 'cancelado' && ped.estoqueBaixado) { baixa(d, ped, -1); ped.estoqueBaixado = false; }
    if (s === 'concluido' && ped.status !== 'concluido') { const c = d.clientes.find(x => x.id === ped.clienteId); if (c) { c.pedidos++; c.gasto += ped.total; c.ultimo = new Date().toISOString(); c.tags = c.tags.filter(t => t !== 'novo'); } }
    ped.status = s; save(d);
  }
  function reset() { localStorage.removeItem(KEY); const d = db(); save(d); return d; }
  window.VJ = { db, save, on: f => ls.push(f), criarPedido, mudarStatus, reset, brl, tel, uid, consumo };
})();
