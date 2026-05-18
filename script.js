// ========================================================
// 🛠️ BANCO DE DADOS SIMULADO INTEGRADO (SÉRIE REATIVO INDUSTRIAL)
// ========================================================
let session = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80, Particular: 250 },
    alunos: [
        { id: "1", nome: "Carlos Silva", whatsapp: "21999998888", plano: "Mensal", statusFinanceiro: "Em dia", perfil: "Comercial", modalidade: "Muay Thai", graduacao: "VERMELHO", frequencia: 14, foto: "" },
        { id: "2", nome: "Marcos Lima", whatsapp: "21988887777", plano: "Trimestral", statusFinanceiro: "Inadimplente", perfil: "Atleta", modalidade: "Boxe", graduacao: "CLASSE B", frequencia: 8, foto: "" }
    ],
    cts: [
        { id: "1", nome: "CT Matriz", professor: "Professor Igor", cnpj: "12.345.678/0001-00", responsavel: "Mestre Ogro", endereco: "Av. Principal, 100", cidade: "Rio de Janeiro/RJ", whatsapp: "21977776666", capacidade: 30, mensalidade: 150 }
    ],
    admins: [
        { id: "1", nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre" },
        { id: "2", nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo" }
    ],
    logs: [
        { data: "16/05/2026 - 10:14", autor: "Admin [Mestre]", acao: "Inicialização", detalhe: "Sistema de gerenciamento reativo adaptado às novas regras operacionais." }
    ]
};

// ========================================================
// 📋 MODAL DE CREDENCIAIS (substitui disparo WhatsApp)
// ========================================================
function exibirModalCredenciais(nome, login, senha) {
    const texto = `🥋 OGRO TEAM — Bem-vindo(a), ${nome}!\n\nSeu acesso ao sistema foi criado:\n\n👤 Login: ${login}\n🔑 Senha: ${senha}\n\nAcesse o aplicativo e use essas credenciais para entrar.`;
    document.getElementById('modal-texto-credenciais').textContent = texto;
    const modal = document.getElementById('modal-credenciais');
    modal.style.display = 'flex';
    // Guarda texto para copiar
    modal.dataset.textoParaCopiar = texto;
}

window.copiarCredenciais = function() {
    const texto = document.getElementById('modal-credenciais').dataset.textoParaCopiar;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(() => alert("✅ Mensagem copiada! Cole no SMS ou app de mensagens."));
    } else {
        // Fallback para navegadores sem clipboard API
        const ta = document.createElement('textarea');
        ta.value = texto;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert("✅ Mensagem copiada! Cole no SMS ou app de mensagens.");
    }
};

window.fecharModalCredenciais = function() {
    document.getElementById('modal-credenciais').style.display = 'none';
};

// ========================================================
// 🔁 NAVEGAÇÃO GLOBAL COM CONTROLE DE PERMISSÃO
// ========================================================
// ✅ CORRIGIDO: html5QrcodeScanner declarado antes de ser usado em firebaseNavegar
let html5QrcodeScanner = null;

window.firebaseNavegar = function(idPagina) {
    if (idPagina !== 1 && idPagina !== 2 && !session.currentUser) {
        alert("Acesso negado: Efetue o login.");
        idPagina = 1;
    }

    if ((idPagina === 3 || idPagina === 9 || idPagina === 13) && session.currentUser?.nivel === "Aluno") {
        alert("Acesso Restrito: Seu perfil não possui permissões administrativas.");
        return;
    }

    if (idPagina === 13 && session.currentUser?.nivel === "Apoio Administrativo") {
        alert("Acesso Bloqueado: Usuários de Apoio não acessam a tabela de preços e auditoria.");
        return;
    }

    const footer = document.querySelector('.footer-fixo');
    if (session.currentUser && (session.currentUser.nivel === "Mestre" || session.currentUser.nivel === "Apoio Administrativo")) {
        footer.classList.add('show-footer');
    } else {
        footer.classList.remove('show-footer');
    }

    // ✅ CORRIGIDO: Desliga câmera corretamente ao sair da página 8
    if (idPagina !== 8 && html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear();
        } catch(e) {}
        html5QrcodeScanner = null;
        const readerDiv = document.getElementById('reader');
        if (readerDiv) readerDiv.style.display = "none";
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const destino = document.getElementById(`p${idPagina}`);
    if (destino) destino.classList.add('active');

    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 7) renderizarEquipeAdmin();
    if (idPagina === 8) inicializarModuloFrequencia();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 11) window.firebaseFiltroRelatorio();
    if (idPagina === 12) renderizarCarteirinhaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
};

window.navegarPara = window.firebaseNavegar;

// ========================================================
// 📝 UTILITÁRIOS
// ========================================================
function registrarLogLocal(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    session.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

// ✅ CORRIGIDO: event.target.files[0] (faltava o índice [0])
window.previewFoto = function(event, elementId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById(elementId);
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.textContent = "";
        preview.dataset.fotoBase64 = reader.result;
    };
    reader.readAsDataURL(file);
};

// ========================================================
// 🔐 AUTENTICAÇÃO
// ========================================================
window.firebaseLogin = function() {
    const input = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();

    const adm = session.admins.find(a => (a.email === input || a.nome === input) && a.senha === senha);
    if (adm) {
        session.currentUser = adm;
        registrarLogLocal(`Admin [${adm.nivel}]`, "Login", "Autenticação realizada com sucesso.");
        window.firebaseNavegar(3);
        return;
    }

    const aluno = session.alunos.find(a => (a.whatsapp === input || a.nome === input) && senha === "123");
    if (aluno) {
        session.currentUser = { ...aluno, nivel: aluno.perfil === "Instrutor" ? "Aluno Instrutor" : "Aluno" };
        window.firebaseNavegar(aluno.perfil === "Instrutor" ? 8 : 12);
        return;
    }

    alert("Credenciais inválidas no sistema Ogro Team.");
};

// ========================================================
// 👤 CADASTROS (ALUNOS, CTs, GESTORES)
// ========================================================
window.firebaseSalvarAluno = function() {
    const nome = document.getElementById('cad-aluno-nome').value.trim();
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value.trim();
    const perfil = document.getElementById('cad-aluno-perfil').value;
    const status = document.getElementById('cad-aluno-status').value;
    const foto = document.getElementById('aluno-foto-preview').dataset.fotoBase64 || "";
    const graduacao = document.getElementById('cad-aluno-graduacao').value.toUpperCase();

    if (!nome || !whatsapp) return alert("Preencha Nome e WhatsApp para processar.");

    const novo = {
        id: String(Date.now()),
        nome, whatsapp, perfil, statusFinanceiro: status, foto, graduacao,
        plano: document.getElementById('cad-aluno-plano').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        frequencia: 0
    };

    session.alunos.push(novo);
    registrarLogLocal(`Admin [${session.currentUser?.nivel}]`, "Cadastro Aluno", `Atleta ${nome} salvo como Perfil [${perfil}] com Status [${status}].`);

    // Reset completo dos campos
    document.getElementById('cad-aluno-nome').value = "";
    document.getElementById('cad-aluno-whatsapp').value = "";
    document.getElementById('cad-aluno-graduacao').value = "";
    const fotoPreview = document.getElementById('aluno-foto-preview');
    fotoPreview.style.backgroundImage = "none";
    fotoPreview.textContent = "Toque para Foto";
    delete fotoPreview.dataset.fotoBase64;

    // ✅ CORRIGIDO: Exibe modal com credenciais em texto (substituindo WhatsApp)
    // O login é o nome do aluno, senha padrão é "123"
    exibirModalCredenciais(nome, nome, "123");
};

window.firebaseSalvarCT = function() {
    const nome = document.getElementById('cad-ct-nome').value.trim();
    const professor = document.getElementById('cad-ct-professor').value.trim();
    if (!nome || !professor) return alert("Nome da Filial e Professor Responsável são obrigatórios.");

    session.cts.push({
        id: String(Date.now()),
        nome, professor,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        endereco: document.getElementById('cad-ct-endereco').value,
        cidade: document.getElementById('cad-ct-cidade').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value,
        capacidade: document.getElementById('cad-ct-capacidade').value,
        mensalidade: document.getElementById('cad-ct-mensalidade').value
    });

    registrarLogLocal(`Admin [${session.currentUser?.nivel}]`, "Cadastro CT", `Nova filial registrada: ${nome} sob instrução de ${professor}.`);
    alert("Filial registrada com sucesso!");

    ['cad-ct-nome','cad-ct-professor','cad-ct-cnpj','cad-ct-responsavel',
     'cad-ct-endereco','cad-ct-cidade','cad-ct-whatsapp','cad-ct-capacidade','cad-ct-mensalidade']
        .forEach(id => document.getElementById(id).value = "");

    window.firebaseNavegar(3);
};

window.firebaseSalvarNovoAdmin = function() {
    const nome = document.getElementById('adm-nome').value.trim();
    const email = document.getElementById('adm-email').value.trim();
    const senha = document.getElementById('adm-senha').value.trim();
    const nivel = document.getElementById('adm-nivel').value;

    if (!nome || !email || !senha) return alert("Preencha todos os campos do formulário.");

    session.admins.push({ id: String(Date.now()), nome, email, senha, nivel });
    registrarLogLocal("Mestre", "Nova Atribuição", `Criou perfil de gestão ${nome} como [${nivel}].`);
    alert("Novo gestor incluído na equipe!");

    document.getElementById('adm-nome').value = "";
    document.getElementById('adm-email').value = "";
    document.getElementById('adm-senha').value = "";
    renderizarEquipeAdmin();
};

window.removerAdmin = function(idAdmin) {
    if (!confirm("Deseja revogar os privilégios de acesso deste gestor?")) return;
    const index = session.admins.findIndex(a => a.id === String(idAdmin));
    if (index !== -1) {
        registrarLogLocal("Mestre", "Revogação", `Removeu privilégios do gestor ${session.admins[index].nome}.`);
        session.admins.splice(index, 1);
    }
    renderizarEquipeAdmin();
};

window.promoverUsuario = function(idAluno, nivelAlvo) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    if (!aluno) return;

    session.admins.push({
        id: String(Date.now()),
        nome: aluno.nome,
        email: `${aluno.nome.toLowerCase().replace(/\s+/g, '')}@ogroteam.com`,
        senha: "123",
        nivel: nivelAlvo
    });

    registrarLogLocal("Mestre", "Privilégio Alterado", `Promoveu o aluno ${aluno.nome} para [${nivelAlvo}] 🛡️.`);
    alert(`${aluno.nome} incluído na equipe de gestão como ${nivelAlvo}!`);
    renderizarEquipeAdmin();
};

// ========================================================
// 📊 DASHBOARD FINANCEIRO E GRÁFICOS REATIVOS
// ========================================================
function renderizarDashboard() {
    let faturamento = 0, inadimplencia = 0, recebido = 0;
    let mThai = 0, boxe = 0, mma = 0;

    session.alunos.forEach(a => {
        const valor = Number(session.precos[a.perfil]) || 0;
        if (a.statusFinanceiro !== "Trancada" && a.statusFinanceiro !== "Suspenso") {
            faturamento += valor;
            if (a.statusFinanceiro === "Em dia") recebido += valor;
            else inadimplencia += valor;
        }
        if (a.modalidade === "Muay Thai") mThai++;
        if (a.modalidade === "Boxe") boxe++;
        if (a.modalidade === "MMA") mma++;
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplencia.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebido.toFixed(2)}`;

    const totalModalidades = mThai + boxe + mma || 1;
    document.getElementById('chart-count-muay').textContent = mThai;
    document.getElementById('chart-count-boxe').textContent = boxe;
    document.getElementById('chart-count-mma').textContent = mma;
    document.getElementById('bar-muay').style.width = `${(mThai / totalModalidades) * 100}%`;
    document.getElementById('bar-boxe').style.width = `${(boxe / totalModalidades) * 100}%`;
    document.getElementById('bar-mma').style.width = `${(mma / totalModalidades) * 100}%`;

    const lista = document.getElementById('dash-lista-devedores');
    lista.innerHTML = "";
    const devedores = session.alunos.filter(a => a.statusFinanceiro !== "Em dia");
    if (devedores.length === 0) {
        lista.innerHTML = "<p style='color:#4ade80; text-align:center; padding:20px;'>✅ Nenhum devedor no momento.</p>";
        return;
    }
    devedores.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        // ✅ CORRIGIDO: botão de cobrança abre modal de texto (não mais WhatsApp)
        div.innerHTML = `
            <div>
                <strong>${a.nome}</strong> [${a.statusFinanceiro.toUpperCase()}]<br>
                <small style="color:#8a8a8a;">Perfil: ${a.perfil} | Plano: ${a.plano} | R$ ${Number(session.precos[a.perfil]).toFixed(2)}</small>
            </div>
            <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="exibirMsgCobranca('${a.id}')">Cobrar</button>
        `;
        lista.appendChild(div);
    });
}

window.exibirMsgCobranca = function(idAluno) {
    const a = session.alunos.find(x => x.id === String(idAluno));
    if (!a) return;
    const texto = `⚠️ OGRO TEAM — Olá ${a.nome}!\n\nIdentificamos uma pendência no seu plano ${a.plano}.\nValor em aberto: R$ ${Number(session.precos[a.perfil]).toFixed(2)}\n\nPor favor, regularize na secretaria da academia para manter seu acesso ativo.\n\nOgro Team 🥋`;
    const modal = document.getElementById('modal-credenciais');
    document.getElementById('modal-texto-credenciais').textContent = texto;
    modal.dataset.textoParaCopiar = texto;
    modal.style.display = 'flex';
};

function renderizarEquipeAdmin() {
    const container = document.getElementById('lista-promocao-alunos');
    container.innerHTML = "<h4>Gestores Ativos</h4>";

    session.admins.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <span><strong>${a.nome}</strong> (${a.nivel})</span>
            ${a.id !== "1"
                ? `<button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline;" onclick="removerAdmin('${a.id}')">Revogar</button>`
                : `<small style="color:#16a34a;">Dono Master</small>`}
        `;
        container.appendChild(div);
    });

    const h4 = document.createElement('h4');
    h4.style.cssText = "margin-top:15px; margin-bottom:5px;";
    h4.textContent = "Alunos Disponíveis para Promoção";
    container.appendChild(h4);

    session.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <span>${a.nome} (${a.perfil})</span>
            <div>
                <button class="btn btn-primary" style="padding:4px 6px; font-size:10px; width:auto; display:inline;" onclick="promoverUsuario('${a.id}', 'Administrador Integral')">Admin</button>
                <button class="btn btn-accent" style="padding:4px 6px; font-size:10px; width:auto; display:inline; background:#262626;" onclick="promoverUsuario('${a.id}', 'Apoio Administrativo')">Apoio</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ========================================================
// ⏱️ CATRACA VIRTUAL — CÂMERA REAL (html5-qrcode)
// ========================================================
function inicializarModuloFrequencia() {
    const selectAluno = document.getElementById('presenca-aluno');
    const selectCT = document.getElementById('presenca-ct');
    selectAluno.innerHTML = "";
    selectCT.innerHTML = "";
    session.alunos.forEach(a => selectAluno.innerHTML += `<option value="${a.id}">${a.nome}</option>`);
    session.cts.forEach(c => selectCT.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
}

// ✅ CORRIGIDO: Usa Html5QrcodeScanner corretamente com CDN html5-qrcode 2.x
window.firebaseAtivarCamera = function() {
    const readerDiv = document.getElementById('reader');

    // Se já está rodando, para e limpa
    if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); } catch(e) {}
        html5QrcodeScanner = null;
        readerDiv.style.display = "none";
        return;
    }

    readerDiv.style.display = "block";
    readerDiv.innerHTML = ""; // Limpa conteúdo anterior

    try {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 15, qrbox: { width: 220, height: 220 }, rememberLastUsedCamera: true },
            false
        );
        html5QrcodeScanner.render(
            function(decodedText) {
                // Sucesso na leitura
                try { html5QrcodeScanner.clear(); } catch(e) {}
                html5QrcodeScanner = null;
                readerDiv.style.display = "none";
                processarEntradaValidada(decodedText);
            },
            function(error) {
                // Erros de leitura são normais (câmera buscando QR), não exibe
            }
        );
    } catch(e) {
        alert("Erro ao acessar câmera. Verifique as permissões do navegador.");
        readerDiv.style.display = "none";
    }
};

function processarEntradaValidada(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    const ctSelecionado = document.getElementById('presenca-ct').value;
    const ct = session.cts.find(c => c.id === String(ctSelecionado)) || { nome: "CT Principal" };

    if (!aluno) return alert("QR Code não reconhecido no sistema.");

    if (aluno.statusFinanceiro === "Suspenso" || aluno.statusFinanceiro === "Trancada") {
        alert(`❌ ACESSO NEGADO: O plano de ${aluno.nome} está com status [${aluno.statusFinanceiro.toUpperCase()}]. Procure a secretaria.`);
        return;
    }

    aluno.frequencia = (aluno.frequencia || 0) + 1;

    const agora = new Date();
    const dataEHora = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    registrarLogLocal("Catraca", "Frequência", `Entrada de ${aluno.nome} autorizada em ${dataEHora}.`);

    const mural = document.getElementById('mural-chamadas');
    const div = document.createElement('div');
    div.className = "item-registro";
    div.innerHTML = `<strong>${dataEHora}</strong> — 🥋 ${aluno.nome} acessou ${ct.nome}`;
    mural.insertBefore(div, mural.firstChild);

    alert(`🥊 ENTRADA AUTORIZADA! Bom treino, ${aluno.nome}!`);
}

window.firebasePresencaManual = function() {
    const id = document.getElementById('presenca-aluno').value;
    if (id) processarEntradaValidada(id);
};

// ========================================================
// 🗂️ CENTRAL DE REGISTROS, EDIÇÃO E FILTROS
// ========================================================
window.renderizarCadastros = function() {
    const busca = (document.getElementById('pesquisa-reativa').value || "").toLowerCase();
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";

    const alunosFiltrados = session.alunos.filter(a => a.nome.toLowerCase().includes(busca));
    const ctsFiltrados = session.cts.filter(c =>
        c.nome.toLowerCase().includes(busca) || c.professor.toLowerCase().includes(busca)
    );

    if (alunosFiltrados.length === 0 && ctsFiltrados.length === 0) {
        container.innerHTML = "<p style='color:#8a8a8a; text-align:center; padding:20px;'>Nenhum registro encontrado.</p>";
        return;
    }

    alunosFiltrados.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const fStyle = a.foto ? `background-image:url(${a.foto});` : "";
        const corStatus = a.statusFinanceiro === 'Em dia' ? '#16a34a' : (a.statusFinanceiro === 'Inadimplente' ? '#ba0f14' : '#d97706');
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="mini-avatar" style="${fStyle}"></div>
                <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.perfil} | ${a.graduacao}</small></div>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                <span class="badge" style="background:${corStatus};">${a.statusFinanceiro}</span>
                <div>
                    <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="window.firebaseAbrirEdicao('${a.id}')">Editar</button>
                    <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-left:2px;" onclick="window.firebaseExcluirItem('${a.id}', 'aluno')">Excluir</button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });

    ctsFiltrados.forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>🏛️ ${c.nome}</strong><br><small style="color:#8a8a8a;">Prof: ${c.professor} | Líder: ${c.responsavel}</small></div>
            <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="window.firebaseExcluirItem('${c.id}', 'ct')">Excluir</button>
        `;
        container.appendChild(div);
    });
};

window.firebaseExcluirItem = function(id, tipo) {
    if (!confirm("Deletar permanentemente da base de dados?")) return;
    if (tipo === 'aluno') {
        const idx = session.alunos.findIndex(a => a.id === String(id));
        if (idx !== -1) session.alunos.splice(idx, 1);
    } else if (tipo === 'ct') {
        const idx = session.cts.findIndex(c => c.id === String(id));
        if (idx !== -1) session.cts.splice(idx, 1);
    }
    window.renderizarCadastros();
};

window.firebaseAbrirEdicao = function(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    if (!aluno) return;

    document.getElementById('edit-id-oculto').value = aluno.id;
    document.getElementById('edit-nome').value = aluno.nome;
    document.getElementById('edit-plano').value = aluno.plano;
    document.getElementById('edit-modalidade').value = aluno.modalidade;
    document.getElementById('edit-graduacao').value = aluno.graduacao;

    const editPreview = document.getElementById('edit-foto-preview');
    editPreview.style.backgroundImage = aluno.foto ? `url(${aluno.foto})` : "none";
    editPreview.dataset.fotoBase64 = aluno.foto || "";

    window.firebaseNavegar(10);
};

window.firebaseSalvarAlteracoesDedicadas = function() {
    const id = document.getElementById('edit-id-oculto').value;
    const aluno = session.alunos.find(a => a.id === String(id));

    if (aluno) {
        const gradNova = document.getElementById('edit-graduacao').value.toUpperCase();
        if (aluno.graduacao !== gradNova) {
            registrarLogLocal(`Admin [Mestre]`, "Mudança de Graduação", `Graduação de ${aluno.nome} alterada de [${aluno.graduacao}] para [${gradNova}].`);
        }
        aluno.nome = document.getElementById('edit-nome').value;
        aluno.plano = document.getElementById('edit-plano').value;
        aluno.modalidade = document.getElementById('edit-modalidade').value;
        aluno.graduacao = gradNova;
        aluno.foto = document.getElementById('edit-foto-preview').dataset.fotoBase64 || aluno.foto;

        alert("Alterações gravadas com sucesso!");
        window.firebaseNavegar(9);
    }
};

window.firebaseFiltroRelatorio = function() {
    const cat = document.getElementById('rep-categoria').value;
    const mod = document.getElementById('rep-modalidade').value;
    const grid = document.getElementById('relatorio-resultado-tela');
    grid.innerHTML = "";

    let filtrados = session.alunos;
    if (cat !== "Todos") filtrados = filtrados.filter(a => a.perfil === cat);
    if (mod !== "Todas") filtrados = filtrados.filter(a => a.modalidade === mod);

    document.getElementById('rep-count-alunos').textContent = filtrados.length;
    let soma = 0;
    filtrados.forEach(f => soma += (session.precos[f.perfil] || 0));
    document.getElementById('rep-soma-valores').textContent = `R$ ${soma.toFixed(2)}`;

    if (filtrados.length === 0) {
        grid.innerHTML = "<p style='color:#8a8a8a; text-align:center; padding:20px;'>Nenhum registro encontrado.</p>";
        return;
    }

    filtrados.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.modalidade} | ${a.graduacao} [${a.statusFinanceiro}]</small></div>
            <span>R$ ${Number(session.precos[a.perfil]).toFixed(2)}</span>
        `;
        grid.appendChild(div);
    });
};

// ========================================================
// 📱 CARTEIRINHA DIGITAL DO ATLETA (QR INDIVIDUAL)
// ========================================================
function renderizarCarteirinhaAluno() {
    const a = session.currentUser;
    if (!a) return;

    document.getElementById('aluno-perfil-nome').textContent = a.nome;
    document.getElementById('aluno-tag-perfil').textContent = `[ALUNO ${(a.perfil || "").toUpperCase()}]`;
    document.getElementById('aluno-tag-graduacao').textContent = `${a.modalidade || ""} - ${a.graduacao || ""}`;
    document.getElementById('aluno-contador-freq').textContent = a.frequencia || 0;

    const box = document.getElementById('aluno-status-financeiro');
    if (a.statusFinanceiro === "Em dia") {
        box.className = "status-box status-pago";
        box.innerHTML = "<h3>ACESSO AUTORIZADO ✔️</h3><p>Mensalidade em dia.</p>";
    } else {
        box.className = "status-box status-atraso";
        box.innerHTML = `<h3>BLOQUEIO: STATUS [${(a.statusFinanceiro || "").toUpperCase()}] ⚠️</h3><p>Procure a secretaria da Arena.</p>`;
    }

    const avatarEl = document.getElementById('aluno-avatar-foto');
    if (a.foto) {
        avatarEl.style.backgroundImage = `url(${a.foto})`;
        avatarEl.textContent = "";
    } else {
        avatarEl.style.backgroundImage = "none";
        avatarEl.textContent = "👤";
    }

    // ✅ CORRIGIDO: Gera QR Code usando biblioteca qrcodejs carregada via CDN correto
    const qrContainer = document.getElementById('qrcode-carteirinha');
    qrContainer.innerHTML = "";
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: String(a.id),
            width: 130,
            height: 130,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    } else {
        qrContainer.innerHTML = "<p style='color:#ba0f14; font-size:12px;'>QR indisponível</p>";
    }
}

// ========================================================
// ⚙️ CONFIGURAÇÕES DE PREÇOS E AUDITORIA
// ========================================================
function renderizarConfiguracoes() {
    document.getElementById('conf-preco-comercial').value = session.precos.Comercial;
    document.getElementById('conf-preco-atleta').value = session.precos.Atleta;
    document.getElementById('conf-preco-particular').value = session.precos.Particular;
    document.getElementById('conf-preco-instrutor').value = session.precos.Instrutor;

    const timeline = document.getElementById('timeline-auditoria');
    timeline.innerHTML = "";
    session.logs.forEach(l => {
        timeline.innerHTML += `
            <div class="timeline-item">
                <div class="meta">${l.data} | <strong>${l.autor}</strong></div>
                <div class="acao" style="color:#ba0f14; font-weight:bold; font-size:11px; text-transform:uppercase;">${l.acao}</div>
                <div class="detalhe" style="color:#ffffff; margin-top:2px;">${l.detalhe}</div>
            </div>`;
    });
}

window.firebaseSalvarPrecos = function() {
    session.precos.Comercial = parseFloat(document.getElementById('conf-preco-comercial').value) || 0;
    session.precos.Atleta = parseFloat(document.getElementById('conf-preco-atleta').value) || 0;
    session.precos.Particular = parseFloat(document.getElementById('conf-preco-particular').value) || 0;
    session.precos.Instrutor = parseFloat(document.getElementById('conf-preco-instrutor').value) || 0;

    registrarLogLocal(`Admin [Mestre]`, "Tabela de Preços", "Mensalidades reajustadas.");
    alert("Tabela de preços atualizada com sucesso!");
    renderizarConfiguracoes();
};

window.firebaseLogoff = function() {
    session.currentUser = null;
    // Para câmera se estiver ativa
    if (html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); } catch(e) {}
        html5QrcodeScanner = null;
    }
    window.firebaseNavegar(1);
};
