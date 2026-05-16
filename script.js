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

// GLOBALIZAÇÃO DE FUNÇÕES DE NAVEGAÇÃO E REGRAS DE PERMISSÃO
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

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const destino = document.getElementById(`p${idPagina}`);
    if (destino) destino.classList.add('active');

    // Desliga a câmera se o usuário sair da página 8
    if (idPagina !== 8 && html5QrcodeScanner) {
        try { html5QrcodeScanner.clear(); html5QrcodeScanner = null; } catch(e){}
        document.getElementById('reader').style.display = "none";
    }

    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 7) renderizarEquipeAdmin();
    if (idPagina === 8) inicializarModuloFrequencia();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 11) window.firebaseFiltroRelatorio();
    if (idPagina === 12) renderizarCarteirinhaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
};

window.navegarPara = window.firebaseNavegar;

function registrarLogLocal(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    session.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

window.previewFoto = function(event, elementId) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById(elementId);
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.textContent = "";
        preview.dataset.fotoBase64 = reader.result;
    }
    if (event.target.files) reader.readAsDataURL(event.target.files);
};

// ========================================================
// 🔐 AUTENTICAÇÃO
// ========================================================
window.firebaseLogin = function() {
    const input = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

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
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
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

    // Reset completo dos campos do formulário
    document.getElementById('cad-aluno-nome').value = "";
    document.getElementById('cad-aluno-whatsapp').value = "";
    document.getElementById('cad-aluno-graduacao').value = "";
    document.getElementById('aluno-foto-preview').style.backgroundImage = "none";
    document.getElementById('aluno-foto-preview').textContent = "Toque para Foto";
    delete document.getElementById('aluno-foto-preview').dataset.fotoBase64;

    // Disparo unificado e imediato de link do WhatsApp para evitar bloqueio
    const msg = encodeURIComponent(`🥋 Olá ${nome}! Seu cadastro no Ogro Team foi concluído. Acesse o aplicativo com seu nome ou WhatsApp e use a senha padrão: 123`);
    window.location.href = `https://whatsapp.com{whatsapp}&text=${msg}`;
};

window.firebaseSalvarCT = function() {
    const nome = document.getElementById('cad-ct-nome').value;
    const professor = document.getElementById('cad-ct-professor').value;
    if(!nome || !professor) return alert("Nome da Filial e Professor Responsável são obrigatórios.");

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

    // Limpeza completa de todos os campos de entrada do CT
    document.getElementById('cad-ct-nome').value = "";
    document.getElementById('cad-ct-professor').value = "";
    document.getElementById('cad-ct-cnpj').value = "";
    document.getElementById('cad-ct-responsavel').value = "";
    document.getElementById('cad-ct-endereco').value = "";
    document.getElementById('cad-ct-cidade').value = "";
    document.getElementById('cad-ct-whatsapp').value = "";
    document.getElementById('cad-ct-capacidade').value = "";
    document.getElementById('cad-ct-mensalidade').value = "";

    window.firebaseNavegar(3);
};

window.firebaseSalvarNovoAdmin = function() {
    const nome = document.getElementById('adm-nome').value;
    const email = document.getElementById('adm-email').value;
    const senha = document.getElementById('adm-senha').value;
    const nivel = document.getElementById('adm-nivel').value;

    if(!nome || !email || !senha) return alert("Preencha todos os campos do formulário.");

    session.admins.push({ id: String(Date.now()), nome, email, senha, nivel });
    registrarLogLocal("Mestre", "Nova Atribuição", `Criou perfil de gestão ${nome} como [${nivel}].`);
    alert("Novo gestor incluído na equipe!");
    
    document.getElementById('adm-nome').value = "";
    document.getElementById('adm-email').value = "";
    document.getElementById('adm-senha').value = "";
    renderizarEquipeAdmin();
};

window.removerAdmin = function(idAdmin) {
    if(!confirm("Deseja revogar os privilégios de acesso deste gestor?")) return;
    const index = session.admins.findIndex(a => a.id === String(idAdmin));
    if(index !== -1) {
        registrarLogLocal("Mestre", "Revogação", `Removeu privilégios do gestor ${session.admins[index].nome}.`);
        session.admins.splice(index, 1);
    }
    renderizarEquipeAdmin();
};

window.promoverUsuario = function(idAluno, nivelAlvo) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    if(!aluno) return;

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
// 📊 DASHBOARD FINANCEIRO E GRÁFICOS REATIVOS DE VERDADE
// ========================================================
function renderizarDashboard() {
    let faturamento = 0, inadimplencia = 0, recebido = 0;
    let mThai = 0, boxe = 0, mma = 0;

    session.alunos.forEach(a => {
        const valor = Number(session.precos[a.perfil]) || 0;
        
        // Contabiliza finanças apenas se o aluno não estiver trancado ou suspenso
        if (a.statusFinanceiro !== "Trancada" && a.statusFinanceiro !== "Suspenso") {
            faturamento += valor;
            if (a.statusFinanceiro === "Em dia") recebido += valor;
            else inadimplencia += valor;
        }

        // Métricas de volumetria para os gráficos de barras por modalidades
        if (a.modalidade === "Muay Thai") mThai++;
        if (a.modalidade === "Boxe") boxe++;
        if (a.modalidade === "MMA") mma++;
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplencia.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebido.toFixed(2)}`;

    // Renderização dos Gráficos Dinâmicos Base de Alunos por Demanda
    const totalModalidades = mThai + boxe + mma || 1;
    document.getElementById('chart-count-muay').textContent = mThai;
    document.getElementById('chart-count-boxe').textContent = boxe;
    document.getElementById('chart-count-mma').textContent = mma;

    document.getElementById('bar-muay').style.width = `${(mThai / totalModalidades) * 100}%`;
    document.getElementById('bar-boxe').style.width = `${(boxe / totalModalidades) * 100}%`;
    document.getElementById('bar-mma').style.width = `${(mma / totalModalidades) * 100}%`;

    // Lista rica contendo nomes e detalhes exatos de inadimplência e status extras
    const lista = document.getElementById('dash-lista-devedores');
    lista.innerHTML = "";
    session.alunos.filter(a => a.statusFinanceiro !== "Em dia").forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const msg = encodeURIComponent(`⚠️ Olá ${a.nome}, consta uma pendência no seu plano do Ogro Team. Regularize na secretaria.`);
        div.innerHTML = `
            <div>
                <strong>${a.nome}</strong> [${a.statusFinanceiro.toUpperCase()}]<br>
                <small style="color:#8a8a8a;">Perfil: ${a.perfil} | Plano: ${a.plano} | Mensalidade: R$ ${Number(session.precos[a.perfil]).toFixed(2)}</small>
            </div>
            <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline;" onclick="window.location.href='https://whatsapp.com{a.whatsapp}&text=${msg}'">Cobrar</button>
        `;
        lista.appendChild(div);
    });
}

function renderizarEquipeAdmin() {
    const container = document.getElementById('lista-promocao-alunos');
    container.innerHTML = "<h4>Gestores Ativos</h4>";
    
    // Lista os administradores atuais da banca permitindo exclusão
    session.admins.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <span><strong>${a.nome}</strong> (${a.nivel})</span>
            ${a.id !== "1" ? `<button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline;" onclick="removerAdmin('${a.id}')">Revogar</button>` : `<small style="color:#16a34a;">Dono Master</small>`}
        `;
        container.appendChild(div);
    });

    const h4 = document.createElement('h4');
    h4.style.marginTop = "15px";
    h4.style.marginBottom = "5px";
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
// ⏱️ CATRACA VIRTUAL COM ACESSO COMPLETO À CÂMERA DO CELULAR
// ========================================================
let html5QrcodeScanner = null;
function inicializarModuloFrequencia() {
    const selectAluno = document.getElementById('presenca-aluno');
    const selectCT = document.getElementById('presenca-ct');
    
    selectAluno.innerHTML = "";
    selectCT.innerHTML = "";

    session.alunos.forEach(a => selectAluno.innerHTML += `<option value="${a.id}">${a.nome}</option>`);
    session.cts.forEach(c => selectCT.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
}

window.firebaseAtivarCamera = function() {
    const readerDiv = document.getElementById('reader');
    readerDiv.style.display = "block";
    
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: 220 });
        html5QrcodeScanner.render((text) => {
            html5QrcodeScanner.clear();
            html5QrcodeScanner = null;
            readerDiv.style.display = "none";
            processarEntradaValidada(text);
        }, (err) => {});
    }
};

function processarEntradaValidada(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    const ctSelecionado = document.getElementById('presenca-ct').value;
    const ct = session.cts.find(c => c.id === String(ctSelecionado)) || { nome: "CT Principal" };

    if (!aluno) return alert("QR Code não reconhecido.");

    // Bloqueia entrada automática na catraca se o aluno estiver suspenso ou trancado
    if (aluno.statusFinanceiro === "Suspenso" || aluno.statusFinanceiro === "Trancada") {
        alert(`❌ ACESSO NEGADO: O plano de ${aluno.nome} encontra-se com status [${aluno.statusFinanceiro.toUpperCase()}]. Procure a secretaria.`);
        return;
    }

    aluno.frequencia = (aluno.frequencia || 0) + 1;
    
    const agora = new Date();
    const dataEHora = `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    registrarLogLocal("Catraca", "Frequência", `Entrada de ${aluno.nome} autorizada em ${dataEHora}.`);

    const mural = document.getElementById('mural-chamadas');
    const div = document.createElement('div');
    div.className = "item-registro";
    div.innerHTML = `<strong>${dataEHora}</strong> - 🥋 ${aluno.nome} acessou o ${ct.nome}`;
    mural.insertBefore(div, mural.firstChild);

    alert(`🥊 ENTRADA AUTORIZADA: Bom treino, ${aluno.nome}!`);
}

window.firebasePresencaManual = function() {
    const id = document.getElementById('presenca-aluno').value;
    if(id) processarEntradaValidada(id);
};

// ========================================================
// 🗂️ CENTRAL DE REGISTROS, EDIÇÃO E FILTROS DE RELATÓRIO
// ========================================================
window.renderizarCadastros = function() {
    const busca = document.getElementById('pesquisa-reativa').value.toLowerCase();
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";

    session.alunos.filter(a => a.nome.toLowerCase().includes(busca)).forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const f = a.foto ? `background-image:url(${a.foto});` : "";
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="mini-avatar" style="${f}"></div>
                <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.perfil} | Faixa: ${a.graduacao}</small></div>
            </div>
            <div>
                <span class="badge" style="background:${a.statusFinanceiro === 'Em dia' ? '#16a34a' : (a.statusFinanceiro === 'Inadimplente' ? '#ba0f14' : '#d97706')}">${a.statusFinanceiro}</span>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-left:5px;" onclick="window.firebaseAbrirEdicao('${a.id}')">Editar</button>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-left:2px;" onclick="window.firebaseExcluirItem('${a.id}', 'aluno')">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });

    session.cts.filter(c => c.nome.toLowerCase().includes(busca) || c.professor.toLowerCase().includes(busca)).forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>🏛️ ${c.nome}</strong><br><small style="color:#8a8a8a;">Professor: ${c.professor} | Líder: ${c.responsavel}</small></div>
            <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="window.firebaseExcluirItem('${c.id}', 'ct')">Excluir</button>
        `;
        container.appendChild(div);
    });
};

window.firebaseExcluirItem = function(id, tipo) {
    if(!confirm("Deletar permanentemente da base de dados?")) return;
    if(tipo === 'aluno') {
        const idx = session.alunos.findIndex(a => a.id === String(id));
        if(idx !== -1) { session.alunos.splice(idx, 1); }
    } else if(tipo === 'ct') {
        const idx = session.cts.findIndex(c => c.id === String(id));
        if(idx !== -1) { session.cts.splice(idx, 1); }
    }
    window.renderizarCadastros();
};

window.firebaseAbrirEdicao = function(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    if(!aluno) return;

    document.getElementById('edit-id-oculto').value = aluno.id;
    document.getElementById('edit-nome').value = aluno.nome;
    document.getElementById('edit-plano').value = aluno.plano;
    document.getElementById('edit-modalidade').value = aluno.modalidade;
    document.getElementById('edit-graduacao').value = aluno.graduacao;
    document.getElementById('edit-foto-preview').style.backgroundImage = aluno.foto ? `url(${aluno.foto})` : "none";
    document.getElementById('edit-foto-preview').dataset.fotoBase64 = aluno.foto || "";

    window.firebaseNavegar(10);
};

window.firebaseSalvarAlteracoesDedicadas = function() {
    const id = document.getElementById('edit-id-oculto').value;
    const aluno = session.alunos.find(a => a.id === String(id));

    if(aluno) {
        const gradNova = document.getElementById('edit-graduacao').value.toUpperCase();
        if(aluno.graduacao !== gradNova) {
            registrarLogLocal(`Admin [Mestre]`, "Mudança de Graduação", `Graduação de ${aluno.nome} alterada de [${aluno.graduacao}] para [${gradNova}].`);
        }
        aluno.nome = document.getElementById('edit-nome').value;
        aluno.plano = document.getElementById('edit-plano').value;
        aluno.modalidade = document.getElementById('edit-modalidade').value;
        aluno.graduacao = gradNova;
        aluno.foto = document.getElementById('edit-foto-preview').dataset.fotoBase64 || aluno.foto;

        alert("Alterações gravadas!");
        window.firebaseNavegar(9);
    }
};

window.firebaseFiltroRelatorio = function() {
    const cat = document.getElementById('rep-categoria').value;
    const mod = document.getElementById('rep-modalidade').value;
    const grid = document.getElementById('relatorio-resultado-tela');
    grid.innerHTML = "";

    let filtrados = session.alunos;
    if(cat !== "Todos") filtrados = filtrados.filter(a => a.perfil === cat);
    if(mod !== "Todas") filtrados = filtrados.filter(a => a.modalidade === mod);

    document.getElementById('rep-count-alunos').textContent = filtrados.length;
    let soma = 0; filtrados.forEach(f => soma += (session.precos[f.perfil] || 0));
    document.getElementById('rep-soma-valores').textContent = `R$ ${soma.toFixed(2)}`;

    if(filtrados.length === 0) {
        grid.innerHTML = "<p style='color:#8a8a8a; text-align:center; padding:20px;'>Nenhum registro encontrado para o filtro selecionado.</p>";
        return;
    }

    filtrados.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.modalidade} | Faixa: ${a.graduacao} [${a.statusFinanceiro}]</small></div>
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
    if(!a) return;

    document.getElementById('aluno-perfil-nome').textContent = a.nome;
    document.getElementById('aluno-tag-perfil').textContent = `[ALUNO ${a.perfil.toUpperCase()}]`;
    document.getElementById('aluno-tag-graduacao').textContent = `${a.modalidade} - ${a.graduacao}`;
    document.getElementById('aluno-contador-freq').textContent = a.frequencia || 0;

    const box = document.getElementById('aluno-status-financeiro');
    if (a.statusFinanceiro === "Em dia") {
        box.className = "status-box status-pago";
        box.innerHTML = "<h3>ACESSO AUTORIZADO ✔️</h3><p>Mensalidade em dia.</p>";
    } else {
        box.className = "status-box status-atraso";
        box.innerHTML = `<h3>BLOQUEIO: STATUS [${a.statusFinanceiro.toUpperCase()}] ⚠️</h3><p>Procure a secretaria da Arena.</p>`;
    }

    if(a.foto) {
        document.getElementById('aluno-avatar-foto').style.backgroundImage = `url(${a.foto})`;
        document.getElementById('aluno-avatar-foto').textContent = "";
    } else {
        document.getElementById('aluno-avatar-foto').style.backgroundImage = "none";
        document.getElementById('aluno-avatar-foto').textContent = "👤";
    }

    document.getElementById('qrcode-carteirinha').innerHTML = "";
    if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qrcode-carteirinha'), { text: String(a.id), width: 130, height: 130 });
    }
}

// ========================================================
// ⚙️ SETTINGS DE PREÇOS
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

    registrarLogLocal(`Admin [Mestre]`, "Tabela de Preços", `Mensalidades reajustadas na memória de contingência.`);
    alert("Valores e cálculos automáticos do Dashboard atualizados!");
    renderizarConfiguracoes();
};

window.firebaseLogoff = function() {
    session.currentUser = null;
    window.firebaseNavegar(1);
};
