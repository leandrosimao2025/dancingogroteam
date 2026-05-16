// ==========================================
// BANCO DE DADOS SIMULADO INTEGRADO (CONVERSÃO DE BACKEND)
// ==========================================
let session = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80 },
    alunos: [
        { id: "1", nome: "Carlos Silva", whatsapp: "21999998888", plano: "Mensal", statusFinanceiro: "Em dia", perfil: "Comercial", modalidade: "Muay Thai", graduacao: "Vermelho", frequencia: 14 }
    ],
    cts: [
        { id: "1", nome: "CT Matriz", cnpj: "12.345.678/0001-00", responsavel: "Mestre Ogro", whatsapp: "21977776666" }
    ],
    admins: [
        { nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre" },
        { nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo" }
    ],
    logs: [
        { data: "15/05/2026 - 10:14", autor: "Admin [Mestre]", acao: "Inicialização", detalhe: "Sistema de contingência local ativado." }
    ]
};

// ==========================================
// CONTROLE DE NAVEGAÇÃO E TRAVAS DE SEGURANÇA
// ==========================================
window.firebaseNavegar = function(idPagina) {
    if (idPagina !== 1 && idPagina !== 2 && !session.currentUser) {
        alert("Acesso restrito. Faça login.");
        idPagina = 1;
    }
    
    if ((idPagina === 9 || idPagina === 13) && session.currentUser?.nivel === "Aluno") {
        alert("Acesso Proibido para Alunos.");
        return;
    }

    const footer = document.querySelector('.footer-fixo');
    if (session.currentUser && (session.currentUser.nivel === "Mestre" || session.currentUser.nivel === "Apoio Administrativo")) {
        footer.classList.add('show-footer');
    } else {
        footer.classList.remove('show-footer');
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const paginaAlvo = document.getElementById(`p${idPagina}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // Executa as renderizações necessárias para cada tela
    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 8) inicializarModuloFrequencia();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 12) renderizarCarteirinhaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
};

// Vincula a navegação simplificada ao escopo global
window.navegarPara = window.firebaseNavegar;

// ==========================================
// MOTOR DE LOGS LOCAL
// ==========================================
function registrarLogLocal(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    session.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

// ==========================================
// OPERAÇÕES DE AUTENTICAÇÃO
// ==========================================
window.firebaseLogin = function() {
    const loginInput = document.getElementById('login-email').value;
    const senhaInput = document.getElementById('login-senha').value;

    const adm = session.admins.find(a => a.email === loginInput && a.senha === senhaInput);
    if (adm) {
        session.currentUser = adm;
        registrarLogLocal(`Admin [${adm.nivel}]`, "Login", "Entrou no sistema");
        window.firebaseNavegar(3);
        return;
    }

    const aluno = session.alunos.find(a => (a.whatsapp === loginInput || a.nome === loginInput) && a.frequencia !== undefined);
    if (aluno && senhaInput === "123") {
        session.currentUser = { ...aluno, nivel: "Aluno" };
        window.firebaseNavegar(12);
        return;
    }
    alert("Credenciais incorretas.");
};

window.executarLogin = window.firebaseLogin;

// ==========================================
// OPERAÇÕES DE SALVAMENTO (ALUNOS E CT)
// ==========================================
window.firebaseSalvarAluno = function() {
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
    const perfil = document.getElementById('cad-aluno-perfil').value;

    if(!nome || !whatsapp) return alert("Campos obrigatórios vazios.");

    const novoAluno = {
        id: String(Date.now()),
        nome: nome,
        whatsapp: whatsapp,
        perfil: perfil,
        plano: document.getElementById('cad-aluno-plano').value,
        statusFinanceiro: document.getElementById('cad-aluno-status').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        graduacao: document.getElementById('cad-aluno-graduacao').value,
        frequencia: 0
    };

    session.alunos.push(novoAluno);
    registrarLogLocal("Sistema", "Cadastro Aluno", `Aluno ${nome} salvo.`);

    alert("Aluno cadastrado com sucesso no sistema local!");

    // Mensagem amigável de redirecionamento para o WhatsApp
    const mensagemTexto = encodeURIComponent(`🥋 Olá ${nome}! Seu cadastro no Ogro Team foi concluído. Acesse o app com seu nome/whatsapp e a senha: 123`);
    const urlWhats = `https://whatsapp.com{whatsapp}&text=${mensagemTexto}`;
    
    if (confirm("Deseja abrir o WhatsApp para enviar os dados de acesso para o aluno?")) {
        window.location.href = urlWhats;
    } else {
        window.firebaseNavegar(3);
    }
};

window.salvarAluno = window.firebaseSalvarAluno;

window.firebaseSalvarCT = function() {
    const nome = document.getElementById('cad-ct-nome').value;
    if(!nome) return alert("Nome do CT é obrigatório.");

    const novoCT = {
        id: String(Date.now()),
        nome: nome,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value
    };

    session.cts.push(novoCT);
    registrarLogLocal("Sistema", "Cadastro CT", `Filial ${nome} cadastrada.`);
    alert("Centro de Treinamento registrado com sucesso!");
    window.firebaseNavegar(3);
};

window.salvarCT = window.firebaseSalvarCT;

// ==========================================
// FUNÇÕES DE EXCLUSÃO E ADM
// ==========================================
window.excluirRegistro = function(id, tipo) {
    if(!confirm("Deseja realmente excluir este registro?")) return;

    if(tipo === 'aluno') {
        const index = session.alunos.findIndex(a => a.id === String(id));
        if(index !== -1) {
            registrarLogLocal("Mestre", "Exclusão", `Removeu o aluno ${session.alunos[index].nome}`);
            session.alunos.splice(index, 1);
        }
    }
    renderizarCadastros();
};

window.salvarNovoAdmin = function() {
    const nome = document.getElementById('adm-nome').value;
    const email = document.getElementById('adm-email').value;
    const senha = document.getElementById('adm-senha').value;

    if(!nome || !email || !senha) return alert("Preencha todos os dados do Gestor.");

    session.admins.push({
        nome: nome,
        email: email,
        senha: senha,
        nivel: "Apoio Administrativo"
    });

    registrarLogLocal("Mestre", "Nova Atribuição", `Criou o gestor ${nome}`);
    alert("Novo Administrador/Apoio adicionado com sucesso!");
    
    // Limpa os campos após salvar
    document.getElementById('adm-nome').value = "";
    document.getElementById('adm-email').value = "";
    document.getElementById('adm-senha').value = "";
};

// ==========================================
// INTERFACES VISUAIS E RENDERS
// ==========================================
function renderizarDashboard() {
    let faturamento = 0, inadimplencia = 0, recebido = 0;
    session.alunos.forEach(a => {
        const valor = session.precos[a.perfil] || 0;
        faturamento += valor;
        if (a.statusFinanceiro === "Em dia") recebido += valor;
        else inadimplencia += valor;
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplencia.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebido.toFixed(2)}`;

    const lista = document.getElementById('dash-lista-devedores');
    lista.innerHTML = "";
    session.alunos.filter(a => a.statusFinanceiro !== "Em dia").forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const msgCobranca = encodeURIComponent(`⚠️ Olá ${a.nome}, consta uma pendência no Ogro Team. Regularize na secretaria.`);
        div.innerHTML = `<span>${a.nome}</span> <button class="btn btn-primary" style="padding:4px; font-size:11px; width:auto; display:inline;" onclick="window.location.href='https://whatsapp.com{a.whatsapp}&text=${msgCobranca}'">Cobrar</button>`;
        lista.appendChild(div);
    });
}

function inicializarModuloFrequencia() {
    const select = document.getElementById('presenca-aluno');
    select.innerHTML = "";
    session.alunos.forEach(a => select.innerHTML += `<option value="${a.id}">${a.nome}</option>`);
}

window.firebasePresencaManual = function() {
    const id = document.getElementById('presenca-aluno').value;
    const aluno = session.alunos.find(a => a.id === String(id));
    if (aluno) {
        aluno.frequencia = (aluno.frequencia || 0) + 1;
        registrarLogLocal("Manual", "Entrada Atleta", `${aluno.nome} entrou.`);
        alert(`🥊 Presença confirmada para ${aluno.nome}!`);
        window.firebaseNavegar(3);
    }
};

window.confirmarPresencaManual = window.firebasePresencaManual;

function renderizarCarteirinhaAluno() {
    const a = session.currentUser;
    document.getElementById('aluno-perfil-nome').textContent = a.nome;
    document.getElementById('aluno-tag-perfil').textContent = `[ALUNO ${a.perfil.toUpperCase()}]`;
    document.getElementById('aluno-tag-graduacao').textContent = `${a.modalidade} - ${a.graduacao}`;
    document.getElementById('aluno-contador-freq').textContent = a.frequencia || 0;

    const boxFinanceira = document.getElementById('aluno-status-financeiro');
    if (a.statusFinanceiro === "Em dia") {
        boxFinanceira.className = "status-box status-pago";
        boxFinanceira.innerHTML = "<h3>Acesso Liberado ✔️</h3>";
    } else {
        boxFinanceira.className = "status-box status-atraso";
        boxFinanceira.innerHTML = "<h3>Bloqueado: Regularize ⚠️</h3>";
    }

    document.getElementById('qrcode-carteirinha').innerHTML = "";
    if(typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qrcode-carteirinha'), { text: a.id, width: 128, height: 128 });
    }
}

function renderizarCadastros() {
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";
    
    // Lista os Alunos na Central
    session.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>${a.nome}</strong> <br> Perfil: ${a.perfil}</div>
            <div>
                <span class="badge" style="background:${a.statusFinanceiro === 'Em dia' ? '#4ade80':'#ba0f14'}">${a.statusFinanceiro}</span>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline; margin-left:8px;" onclick="excluirRegistro('${a.id}', 'aluno')">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Lista as Academias/CTs na Central
    session.cts.forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `<div><strong>🏛️ ${c.nome} (CT)</strong> <br> Resp: ${c.responsavel}</div>`;
        container.appendChild(div);
    });
}

function renderizarConfiguracoes() {
    const timeline = document.getElementById('timeline-auditoria');
    timeline.innerHTML = "";
    session.logs.forEach(l => {
        timeline.innerHTML += `<div class="timeline-item"><div class="meta">${l.data} | <strong>${l.autor}</strong></div><div>${l.detalhe}</div></div>`;
    });
}

window.firebaseLogoff = function() {
    session.currentUser = null;
    window.firebaseNavegar(1);
};

window.desconectarConta = window.firebaseLogoff;
