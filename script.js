// ==========================================
// BANCO DE DADOS SIMULADO (ESTADO INICIAL)
// ==========================================
let state = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80 },
    alunos: [
        { id: 1, nome: "Carlos Silva", whatsapp: "21999998888", plano: "Mensal", statusFinanceiro: "Em dia", perfil: "Comercial", modalidade: "Muay Thai", graduacao: "Vermelho", foto: "", frequencia: 14 },
        { id: 2, nome: "Marcos Lima", whatsapp: "21988887777", plano: "Trimestral", statusFinanceiro: "Inadimplente", perfil: "Atleta", modalidade: "Boxe", graduacao: "Classe B (Avançado)", foto: "", frequencia: 8 }
    ],
    cts: [
        { id: 1, nome: "CT Matriz", cnpj: "12.345.678/0001-00", responsavel: "Mestre Ogro", endereco: "Rua Principal, 10", cidade: "Rio de Janeiro/RJ", whatsapp: "21977776666", capacidade: 30, mensalidade: 150 }
    ],
    admins: [
        { id: 1, nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre" },
        { id: 2, nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo" }
    ],
    logs: [
        { data: "15/05/2026 - 10:14", autor: "Admin [Mestre]", acao: "Alteração de Preço", detalhe: "Alterou a mensalidade de Aluno Atleta para R$ 100,00" },
        { data: "15/05/2026 - 09:45", autor: "Admin [Apoio 1]", acao: "Presença", detalhe: "Confirmou a presença do aluno Carlos Silva no CT Matriz" }
    ],
    editandoId: null,
    editandoTipo: null
};

// ==========================================
// CONTROLE DE NAVEGAÇÃO E REGRAS DE ACESSO
// ==========================================
function navegarPara(idPagina) {
    // Bloqueio de segurança para a Página 13 (Apenas Mestre/Admin)
    if (idPagina === 13 && state.currentUser && state.currentUser.nivel === "Apoio Administrativo") {
        alert("Acesso Negado: Seu perfil de Apoio não possui permissão para esta tela.");
        return;
    }

    // Oculta todas as páginas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Ativa a página desejada
    const paginaAlvo = document.getElementById(`p${idPagina}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // Executa renderizações específicas da página aberta
    if (idPagina === 3) renderizarMenu();
    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 7) renderizarAdmins();
    if (idPagina === 8) renderizarPresenca();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 11) renderizarRelatorios();
    if (idPagina === 12) renderizarAreaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
}

function registrarLog(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;
    state.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

// ==========================================
// PÁGINA 1 & 2: AUTENTICAÇÃO E SENHA
// ==========================================
function executarLogin() {
    const loginInput = document.getElementById('login-email').value;
    const senhaInput = document.getElementById('login-senha').value;

    // 1. Procura nos Administradores/Apoio
    const adm = state.admins.find(a => (a.email === loginInput || a.nome === loginInput) && a.senha === senhaInput);
    if (adm) {
        state.currentUser = adm;
        registrarLog(`Admin [${adm.nivel}]`, "Login", `Efetuou acesso ao sistema.`);
        navegarPara(3);
        return;
    }

    // 2. Procura nos Alunos (Usa o nome ou WhatsApp como login)
    const aluno = state.alunos.find(a => (a.whatsapp === loginInput || a.nome === loginInput) && senhaInput === "123");
    if (aluno) {
        state.currentUser = { ...aluno, nivel: aluno.perfil === "Instrutor" ? "Aluno Instrutor" : "Aluno" };
        navegarPara(aluno.perfil === "Instrutor" ? 8 : 12);
        return;
    }

    alert("Credenciais inválidas! Tente admin@ogroteam.com / 123");
}

function alternarSenha() {
    const input = document.getElementById('login-senha');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function atualizarSenhaReal() {
    const usuario = document.getElementById('recup-usuario').value;
    const nova = document.getElementById('recup-nova').value;
    
    let adm = state.admins.find(a => a.email === usuario || a.nome === usuario);
    if (adm) {
        adm.senha = nova;
        registrarLog(`Sistema`, "Alteração Credencial", `Senha do administrador ${adm.nome} alterada.`);
        alert("Senha atualizada com sucesso!");
        navegarPara(1);
        return;
    }
    alert("Usuário não encontrado.");
}

// ==========================================
// PÁGINA 3: MENUS DINÂMICOS
// ==========================================
function renderizarMenu() {
    const btnConfig = document.getElementById('card-config');
    if (state.currentUser && state.currentUser.nivel === "Apoio Administrativo") {
        btnConfig.style.opacity = "0.5";
        btnConfig.style.cursor = "not-allowed";
    } else {
        btnConfig.style.opacity = "1";
        btnConfig.style.cursor = "pointer";
    }
}

// ==========================================
// PÁGINA 4: CADASTRO DE ALUNOS
// ==========================================
function previewFoto(event, elementId) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById(elementId);
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.textContent = "";
    }
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function salvarAluno() {
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
    const plano = document.getElementById('cad-aluno-plano').value;
    const status = document.getElementById('cad-aluno-status').value;
    const perfil = document.getElementById('cad-aluno-perfil').value;
    const modalidade = document.getElementById('cad-aluno-modalidade').value;
    const graduacao = document.getElementById('cad-aluno-graduacao').value;

    if(!nome || !whatsapp) return alert("Preencha o nome e whatsapp!");

    const novoAluno = {
        id: Date.now(),
        nome, whatsapp, plano, statusFinanceiro: status, perfil, modalidade, graduacao,
        foto: document.getElementById('aluno-foto-preview').style.backgroundImage || "",
        frequencia: 0
    };

    state.alunos.push(novoAluno);
    registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Cadastro Aluno", `Cadastrou o aluno ${nome} no perfil ${perfil}.`);
    
    alert(`Mensagem do WhatsApp gerada:\n"Olá ${nome}, seu acesso ao Ogro Team está liberado!"`);
    navegarPara(3);
}

// ==========================================
// PÁGINA 5: CADASTRO DE FILIAIS (CT)
// ==========================================
function salvarCT() {
    const nome = document.getElementById('cad-ct-nome').value;
    if(!nome) return alert("Preencha o nome da filial!");

    state.cts.push({
        id: Date.now(),
        nome,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        endereco: document.getElementById('cad-ct-endereco').value,
        cidade: document.getElementById('cad-ct-cidade').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value,
        capacidade: document.getElementById('cad-ct-capacidade').value,
        mensalidade: parseFloat(document.getElementById('cad-ct-mensalidade').value) || 0
    });

    registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Cadastro CT", `Registrou a filial ${nome}.`);
    navegarPara(3);
}

// ==========================================
// PÁGINA 6: DASHBOARD FINANCEIRO
// ==========================================
function renderizarDashboard() {
    let faturamento = 0;
    let inadimplentesCount = 0;
    let recebido = 0;

    state.alunos.forEach(a => {
        const valorPlano = state.precos[a.perfil] || 0;
        if (a.statusFinanceiro === "Em dia") {
            faturamento += valorPlano;
            recebido += valorPlano;
        } else {
            faturamento += valorPlano;
            inadimplentesCount += valorPlano;
        }
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplentesCount.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebido.toFixed(2)}`;

    const listaDevedores = document.getElementById('dash-lista-devedores');
    listaDevedores.innerHTML = "";
    
    state.alunos.filter(a => a.statusFinanceiro === "Inadimplente").forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div>
                <strong>${a.nome}</strong> <br>
                <small class="badge badge-vermelho">${a.perfil}</small>
            </div>
            <button class="btn btn-primary" onclick="alert('Cobrança disparada via WhatsApp para ${a.whatsapp}')">Cobrar</button>
        `;
        listaDevedores.appendChild(div);
    });
}

// ==========================================
// PÁGINA 7: GESTÃO DE EQUIPE
// ==========================================
function renderizarAdmins() {
    const container = document.getElementById('lista-promocao-alunos');
    container.innerHTML = "";

    state.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <span>${a.nome} (${a.perfil})</span>
            <div>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:12px;" onclick="promoverUsuario(${a.id}, 'Administrador Integral')">Promover Admin</button>
                <button class="btn btn-accent" style="padding:4px 8px; font-size:12px; background:#6b7280;" onclick="promoverUsuario(${a.id}, 'Apoio Administrative')">Promover Apoio</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function salvarNovoAdmin() {
    const nome = document.getElementById('adm-nome').value;
    const email = document.getElementById('adm-email').value;
    const senha = document.getElementById('adm-senha').value;
    const nivel = document.getElementById('adm-nivel').value;

    if(!nome || !email || !senha) return alert("Preencha todos os campos!");

    state.admins.push({ id: Date.now(), nome, email, senha, nivel });
    registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Nova Atribuição", `Criou gestor ${nome} como ${nivel}.`);
    alert("Novo gestor adicionado!");
    renderizarAdmins();
}

function promoverUsuario(alunoId, nivelAlvo) {
    const aluno = state.alunos.find(a => a.id === alunoId);
    if (!aluno) return;

    state.admins.push({
        id: Date.now(),
        nome: aluno.nome,
        email: `${aluno.nome.toLowerCase().replace(/\s+/g, '')}@ogroteam.com`,
        senha: "123",
        nivel: nivelAlvo
    });

    registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Privilégio Alterado", `Promoveu ${aluno.nome} para ${nivelAlvo} 🛡️.`);
    alert(`${aluno.nome} agora possui acesso administrativo de ${nivelAlvo}!`);
}

// ==========================================
// PÁGINA 8: CHAMADAS E FREQUÊNCIA
// ==========================================
function renderizarPresenca() {
    const selectAluno = document.getElementById('presenca-aluno');
    const selectCT = document.getElementById('presenca-ct');
    
    selectAluno.innerHTML = "";
    selectCT.innerHTML = "";

    state.alunos.forEach(a => selectAluno.innerHTML += `<option value="${a.id}">${a.nome}</option>`);
    state.cts.forEach(c => selectCT.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
}

function confirmarPresenca() {
    const idAluno = document.getElementById('presenca-aluno').value;
    const idCT = document.getElementById('presenca-ct').value;

    const aluno = state.alunos.find(a => a.id == idAluno);
    const ct = state.cts.find(c => c.id == idCT);

    if(!aluno || !ct) return;

    aluno.frequencia += 1;
    registrarLog(`Admin [${state.currentUser?.nivel || 'Sistema'}]`, "Presença", `Confirmou a presença do aluno ${aluno.nome} no ${ct.nome}.`);

    const mural = document.getElementById('mural-chamadas');
    const item = document.createElement('div');
    item.className = "item-registro";
    item.innerHTML = `<strong>${new Date().toLocaleTimeString('pt-BR')}</strong> - ${aluno.nome} deu entrada no ${ct.nome}`;
    mural.insertBefore(item, mural.firstChild);

    alert(`Frequência registrada com sucesso para ${aluno.nome}!`);
}

// ==========================================
// PÁGINA 9 & 10: CENTRAL DE REGISTROS E EDIÇÃO
// ==========================================
function renderizarCadastros() {
    const busca = document.getElementById('pesquisa-reativa').value.toLowerCase();
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";

    // Renderizar Alunos Encontrados
    state.alunos.filter(a => a.nome.toLowerCase().includes(busca)).forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div>
                <strong>${a.nome}</strong> 🛡️ <small class="badge badge-primary">${a.modalidade} - ${a.graduacao}</small> <br>
                <small style="color:#9ca3af;">Perfil: ${a.perfil} | Plano: ${a.plano}</small>
            </div>
            <div>
                <button class="btn btn-accent" style="padding:4px 8px; font-size:12px;" onclick="abrirEdicao(${a.id}, 'aluno')">Editar</button>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:12px;" onclick="excluirRegistro(${a.id}, 'aluno')">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Renderizar CTs Encontrados
    state.cts.filter(c => c.nome.toLowerCase().includes(busca)).forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>${c.nome} (CT)</strong><br><small style="color:#9ca3af;">Responsável: ${c.responsavel}</small></div>
            <div>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:12px;" onclick="excluirRegistro(${c.id}, 'ct')">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function excluirRegistro(id, tipo) {
    if(!confirm("Tem certeza que deseja deletar este item?")) return;

    if(tipo === 'aluno') {
        const index = state.alunos.findIndex(a => a.id === id);
        const item = state.alunos[index];
        registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Exclusão", `Excluiu o registro do aluno ${item.nome} (${item.plano}).`);
        state.alunos.splice(index, 1);
    } else if(tipo === 'ct') {
        const index = state.cts.findIndex(c => c.id === id);
        const item = state.cts[index];
        registrarLog(`Admin [${state.currentUser?.nivel || 'Mestre'}]`, "Exclusão", `Excluiu a filial ${item.nome}.`);
        state.cts.splice(index, 1);
    }
    renderizarCadastros();
}

function abrirEdicao(id, tipo) {
    state.editandoId = id;
    state.editandoTipo = tipo;
    
    if(tipo === 'aluno') {
        const aluno = state.alunos.find(a => a.id === id);
        document.getElementById('edit-nome').value = aluno.nome;
        document.getElementById('edit-plano').value = aluno.plano;
        document.getElementById('edit-modalidade').value = aluno.modalidade;
        document.getElementById('edit-graduacao').value = aluno.graduacao;
        document.getElementById('edit-foto-preview').style.backgroundImage = aluno.foto;
    }
    navegarPara(10);
}

function salvarAlteracoesDedicadas() {
    if(state.editandoTipo === 'aluno') {
        const aluno = state.alunos.find(a => a.id === state.editandoId);
        const modalidadeNova = document.getElementById('edit-modalidade').value;
        const graduacaoNova = document.getElementById('edit-graduacao').value;

        if(aluno.graduacao !== graduacaoNova) {
            registrarLog(
                `Admin [${state.currentUser?.nivel || 'Mestre'}]`, 
                "Graduação Alterada", 
                `O usuário alterou a graduação do aluno ${aluno.nome} de [${aluno.graduacao}] para [${graduacaoNova}]`
            );
        }

        aluno.nome = document.getElementById('edit-nome').value;
        aluno.plano = document.getElementById('edit-plano').value;
        aluno.modalidade = modalidadeNova;
        aluno.graduacao = graduacaoNova;
        aluno.foto = document.getElementById('edit-foto-preview').style.backgroundImage || "";
    }
    alert("Alterações salvas com sucesso!");
    navegarPara(9);
}

// ==========================================
// PÁGINA 11: RELATÓRIOS
// ==========================================
function renderizarRelatorios() {
    // Inicializa filtros padrões
}

function processarFiltroRelatorio() {
    const cat = document.getElementById('rep-categoria').value;
    const modalidade = document.getElementById('rep-modalidade').value;
    const resultadoGrid = document.getElementById('relatorio-resultado-tela');
    
    resultadoGrid.innerHTML = "";
    
    let filtrados = state.alunos;
    if(cat !== "Todos") filtrados = filtrados.filter(a => a.perfil === cat);
    if(modalidade !== "Todas") filtrados = filtrados.filter(a => a.modalidade === modalidade);

    if(filtrados.length === 0) {
        resultadoGrid.innerHTML = "<p style='color:#9ca3af;'>Nenhum registro encontrado para este filtro.</p>";
        return;
    }

    filtrados.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `<span><strong>${a.nome}</strong> - ${a.perfil} (${a.modalidade})</span> <span>Status: ${a.statusFinanceiro}</span>`;
        resultadoGrid.appendChild(div);
    });
}

// ==========================================
// PÁGINA 12: ÁREA DO ALUNO
// ==========================================
function renderizarAreaAluno() {
    if(!state.currentUser) return;
    const a = state.currentUser;

    document.getElementById('aluno-perfil-nome').textContent = a.nome;
    document.getElementById('aluno-tag-perfil').textContent = `[ALUNO ${a.perfil.toUpperCase()}]`;
    document.getElementById('aluno-tag-graduacao').textContent = `${a.modalidade} - ${a.graduacao}`;
    
    const statusBox = document.getElementById('aluno-status-financeiro');
    if(a.statusFinanceiro === "Em dia") {
        statusBox.className = "status-box status-pago";
        statusBox.innerHTML = `<h3>Acesso Liberado</h3><p>Sua mensalidade de R$ ${(state.precos[a.perfil] || 0).toFixed(2)} está em dia.</p>`;
    } else {
        statusBox.className = "status-box status-atraso";
        statusBox.innerHTML = `<h3>Pendência Financeira</h3><p>Regularize seu plano para evitar bloqueios na catraca.</p>`;
    }

    document.getElementById('aluno-contador-freq').textContent = a.frequencia || 0;
    
    const hist = document.getElementById('aluno-historico-aulas');
    hist.innerHTML = `<div class="item-registro"><small>Check-in automático sincronizado em tempo real.</small></div>`;
}

// ==========================================
// PÁGINA 13: CONFIGURAÇÕES & AUDITORIA
// ==========================================
function renderizarConfiguracoes() {
    document.getElementById('conf-preco-comercial').value = state.precos.Comercial;
    document.getElementById('conf-preco-atleta').value = state.precos.Atleta;
    document.getElementById('conf-preco-bolsista').value = state.precos.Bolsista;
    document.getElementById('conf-preco-instrutor').value = state.precos.Instrutor;

    const timeline = document.getElementById('timeline-auditoria');
    timeline.innerHTML = "";

    state.logs.forEach(l => {
        const item = document.createElement('div');
        item.className = "timeline-item";
        item.innerHTML = `
            <div class="meta">${l.data} | <strong>${l.autor}</strong></div>
            <div class="acao">Ação: ${l.acao}</div>
            <div class="detalhe">${l.detalhe}</div>
        `;
        timeline.appendChild(item);
    });
}

function salvarTabelaPrecos() {
    const cAntigo = state.precos.Comercial;
    const aAntigo = state.precos.Atleta;
    const iAntigo = state.precos.Instrutor;

    state.precos.Comercial = parseFloat(document.getElementById('conf-preco-comercial').value) || 0;
    state.precos.Atleta = parseFloat(document.getElementById('conf-preco-atleta').value) || 0;
    state.precos.Instrutor = parseFloat(document.getElementById('conf-preco-instrutor').value) || 0;

    registrarLog(
        `Admin [${state.currentUser?.nivel || 'Mestre'}]`, 
        "Tabela de Preços", 
        `Alterou valores: Comercial de R$${cAntigo} p/ R$${state.precos.Comercial}, Atleta de R$${aAntigo} p/ R$${state.precos.Atleta}.`
    );

    alert("Tabela de preços atualizada!");
    renderizarConfiguracoes();
}

function desconectarConta() {
    state.currentUser = null;
    navegarPara(1);
}
