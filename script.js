// ========================================================
// 🛠️ CONFIGURAÇÃO DE CONTINGÊNCIA E ESTADO COMPLETO (SÉRIE REATIVO)
// ========================================================
let session = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80 },
    alunos: [
        { id: "1", nome: "Carlos Silva", whatsapp: "21999998888", plano: "Mensal", statusFinanceiro: "Em dia", perfil: "Comercial", modalidade: "Muay Thai", graduacao: "Vermelho", frequencia: 14, foto: "" },
        { id: "2", nome: "Marcos Lima", whatsapp: "21988887777", plano: "Trimestral", statusFinanceiro: "Inadimplente", perfil: "Atleta", modalidade: "Boxe", graduacao: "Classe B (Avançado)", frequencia: 8, foto: "" }
    ],
    cts: [
        { id: "1", nome: "CT Matriz", cnpj: "12.345.678/0001-00", responsavel: "Mestre Ogro", endereco: "Av. Principal, 100", cidade: "Rio de Janeiro/RJ", whatsapp: "21977776666", capacidade: 30, mensalidade: 150 }
    ],
    admins: [
        { id: "1", nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre" },
        { id: "2", nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo" }
    ],
    logs: [
        { data: "16/05/2026 - 10:14", autor: "Admin [Mestre]", acao: "Inicialização", detalhe: "Sistema de segurança unificado ativado com sucesso." }
    ]
};

// GLOBALIZAÇÃO DE FUNÇÕES DE NAVEGAÇÃO E TRAVAS RÍGIDAS
window.navegarPara = function(idPagina) {
    // Validação de Sessão ativa
    if (idPagina !== 1 && idPagina !== 2 && !session.currentUser) {
        alert("Acesso negado: Efetue o login.");
        idPagina = 1;
    }

    // Trava de perfil Aluno Comercial/Atleta/Bolsista
    if ((idPagina === 3 || idPagina === 9 || idPagina === 13) && session.currentUser?.nivel === "Aluno") {
        alert("Acesso Restrito: Seu perfil não possui permissões administrativas.");
        return;
    }

    // Trava do perfil Apoio Administrativo (Não acessa a Página 13)
    if (idPagina === 13 && session.currentUser?.nivel === "Apoio Administrativo") {
        alert("Acesso Bloqueado: Usuários com nível de Apoio não acessam as Configurações de Preços e Logs.");
        return;
    }

    // Gerenciador Dinâmico do Rodapé Fixo Global
    const footer = document.querySelector('.footer-fixo');
    if (session.currentUser && (session.currentUser.nivel === "Mestre" || session.currentUser.nivel === "Apoio Administrativo")) {
        footer.classList.add('show-footer');
    } else {
        footer.classList.remove('show-footer');
    }

    // Transição de telas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const destino = document.getElementById(`p${idPagina}`);
    if (destino) destino.classList.add('active');

    // Inicializadores de interface reativa
    if (idPagina === 3) renderizarCardsControle();
    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 7) renderizarEquipeAdmin();
    if (idPagina === 8) inicializarModuloFrequencia();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 11) processarFiltroRelatorio();
    if (idPagina === 12) renderizarCarteirinhaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
};

window.firebaseNavegar = window.navegarPara;

// HISTÓRICO AUTOMÁTICO DE AUDITORIA
function registrarLogLocal(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    session.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

// UPLOAD E CONVERSÃO DE FOTO EM TEMPO REAL
window.previewFoto = function(event, elementId) {
    const reader = new FileReader();
    reader.onload = function() {
        const preview = document.getElementById(elementId);
        preview.style.backgroundImage = `url(${reader.result})`;
        preview.textContent = "";
        preview.dataset.fotoBase64 = reader.result;
    }
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
};

// ========================================================
// 🔐 SISTEMA DE AUTENTICAÇÃO E RECUPERAÇÃO DE CREDENCIAIS
// ========================================================
window.executarLogin = function() {
    const input = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;

    const adm = session.admins.find(a => (a.email === input || a.nome === input) && a.senha === senha);
    if (adm) {
        session.currentUser = adm;
        registrarLogLocal(`Admin [${adm.nivel}]`, "Login", "Autenticação realizada com sucesso.");
        window.navegarPara(3);
        return;
    }

    const aluno = session.alunos.find(a => (a.whatsapp === input || a.nome === input) && senha === "123");
    if (aluno) {
        session.currentUser = { ...aluno, nivel: aluno.perfil === "Instrutor" ? "Aluno Instrutor" : "Aluno" };
        window.navegarPara(aluno.perfil === "Instrutor" ? 8 : 12);
        return;
    }
    alert("Credenciais inválidas no sistema Ogro Team.");
};

window.firebaseLogin = window.executarLogin;

window.atualizarSenhaReal = function() {
    const usuario = document.getElementById('recup-usuario').value;
    const nova = document.getElementById('recup-nova').value;

    let adm = session.admins.find(a => a.email === usuario || a.nome === usuario);
    if (adm) {
        const senhaAntiga = adm.senha;
        adm.senha = nova;
        registrarLogLocal("Sistema", "Alteração Credencial", `Senha de ${adm.nome} modificada na memória.`);
        alert("Senha atualizada com sucesso em tempo real!");
        window.navegarPara(1);
        return;
    }
    alert("Usuário não localizado na base.");
};

// BLOCK DE CONTROLE VISUAL PREMIUM DOS CARDS
function renderizarCardsControle() {
    const cardConfig = document.getElementById('card-config');
    if (session.currentUser?.nivel === "Apoio Administrativo") {
        cardConfig.style.opacity = "0.4";
        cardConfig.style.cursor = "not-allowed";
    } else {
        cardConfig.style.opacity = "1";
        cardConfig.style.cursor = "pointer";
    }
}

// ========================================================
// 👤 MÓDULOS DE GRAVAÇÃO DE DADOS (ALUNOS, FILIAIS, GESTORES)
// ========================================================
window.salvarAluno = function() {
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
    const perfil = document.getElementById('cad-aluno-perfil').value;
    const foto = document.getElementById('aluno-foto-preview').dataset.fotoBase64 || "";

    if (!nome || !whatsapp) return alert("Preencha Nome e WhatsApp para processar.");

    const novo = {
        id: String(Date.now()),
        nome, whatsapp, perfil, foto,
        plano: document.getElementById('cad-aluno-plano').value,
        statusFinanceiro: document.getElementById('cad-aluno-status').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        graduacao: document.getElementById('cad-aluno-graduacao').value,
        frequencia: 0
    };

    session.alunos.push(novo);
    registrarLogLocal(`Admin [${session.currentUser?.nivel}]`, "Cadastro Aluno", `Aluno ${nome} vinculado ao perfil ${perfil}.`);

    // Reset de campos
    document.getElementById('cad-aluno-nome').value = "";
    document.getElementById('cad-aluno-whatsapp').value = "";
    document.getElementById('aluno-foto-preview').style.backgroundImage = "none";
    document.getElementById('aluno-foto-preview').textContent = "Toque para Foto";

    // Disparo de mensagem no WhatsApp do aluno
    const msg = encodeURIComponent(`🥋 Fala ${nome}! Seu acesso ao Ogro Team tá liberado. Entre com seu Nome ou Whats e use a senha padrão: 123`);
    window.location.href = `https://whatsapp.com{whatsapp}&text=${msg}`;
};

window.firebaseSalvarAluno = window.salvarAluno;

window.salvarCT = function() {
    const nome = document.getElementById('cad-ct-nome').value;
    if(!nome) return alert("Nome da Filial obrigatório.");

    session.cts.push({
        id: String(Date.now()),
        nome,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        endereco: document.getElementById('cad-ct-endereco').value,
        cidade: document.getElementById('cad-ct-cidade').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value,
        capacidade: document.getElementById('cad-ct-capacidade').value,
        mensalidade: document.getElementById('cad-ct-mensalidade').value
    });

    registrarLogLocal(`Admin [${session.currentUser?.nivel}]`, "Cadastro CT", `Nova filial registrada: ${nome}.`);
    alert("Filial integrada com sucesso!");
    window.navegarPara(3);
};

window.firebaseSalvarCT = window.salvarCT;

window.salvarNovoAdmin = function() {
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
    alert(`${aluno.nome} promovido a equipe de gerenciamento com sucesso!`);
    renderizarEquipeAdmin();
};

// ========================================================
// 📊 RENDERIZADORES DO CORAÇÃO FINANCEIRO (MÉTRICAS PREMIUM)
// ========================================================
function renderizarDashboard() {
    let faturamento = 0, inadimplencia = 0, recebido = 0;
    let ativos = 0, devedores = 0;

    session.alunos.forEach(a => {
        const valor = Number(session.precos[a.perfil]) || 0;
        faturamento += valor;
        if (a.statusFinanceiro === "Em dia") {
            recebido += valor;
            ativos++;
        } else {
            inadimplencia += valor;
            devedores++;
        }
    });

    // Atualização matemática em tempo real
    document.getElementById('dash-faturamento').textContent = `R$ ${faturamento.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplencia.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebido.toFixed(2)}`;
    document.getElementById('dash-ativos').textContent = ativos;
    document.getElementById('dash-devedores').textContent = devedores;

    // Barras de Progresso Gráfico Premium
    const totalAlunos = ativos + devedores || 1;
    document.getElementById('bar-recebido').style.width = `${(ativos / totalAlunos) * 100}%`;
    document.getElementById('bar-inadimplencia').style.width = `${(devedores / totalAlunos) * 100}%`;

    const lista = document.getElementById('dash-lista-devedores');
    lista.innerHTML = "";
    session.alunos.filter(a => a.statusFinanceiro !== "Em dia").forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const msg = encodeURIComponent(`⚠️ Fala ${a.nome}, passando pra lembrar da mensalidade pendente no Ogro Team (Plano: ${a.plano}). Dá uma passada na secretaria pra acertar, valeu!`);
        div.innerHTML = `
            <div><strong>${a.nome}</strong><br><small style="color:#ef4444;">Perfil: ${a.perfil}</small></div>
            <button class="btn btn-primary" style="padding:4px 8px; font-size:12px; width:auto; display:inline;" onclick="window.location.href='https://whatsapp.com{a.whatsapp}&text=${msg}'">Cobrar Whats</button>
        `;
        lista.appendChild(div);
    });
}

function renderizarEquipeAdmin() {
    const container = document.getElementById('lista-promocao-alunos');
    container.innerHTML = "";
    session.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <span><strong>${a.nome}</strong> (${a.perfil})</span>
            <div>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="promoverUsuario('${a.id}', 'Administrador Integral')">Promover Admin</button>
                <button class="btn btn-accent" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; background:#262626;" onclick="promoverUsuario('${a.id}', 'Apoio Administrativo')">Promover Apoio</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ========================================================
// ⏱️ CATRACA VIRTUAL INTELIGENTE (LEITOR QR E SELEÇÃO)
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

window.ativarCameraCatraca = function() {
    document.getElementById('reader').style.display = "block";
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 15, qrbox: 220 });
        html5QrcodeScanner.render((text) => {
            html5QrcodeScanner.clear();
            document.getElementById('reader').style.display = "none";
            processarEntradaValidada(text);
        }, (err) => {});
    }
};

async function processarEntradaValidada(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    const ctSelecionado = document.getElementById('presenca-ct').value;
    const ct = session.cts.find(c => c.id === String(ctSelecionado)) || { nome: "CT Principal" };

    if (!aluno) return alert("QR Code Inválido ou Aluno Não Encontrado.");

    aluno.frequencia = (aluno.frequencia || 0) + 1;
    registrarLogLocal("Catraca QR", "Frequência", `Entrada de ${aluno.nome} autorizada no ${ct.nome}.`);

    const mural = document.getElementById('mural-chamadas');
    const div = document.createElement('div');
    div.className = "item-registro animate-hit";
    div.innerHTML = `<strong>${new Date().toLocaleTimeString('pt-BR')}</strong> - 🥋 ${aluno.nome} entrou no ${ct.nome}`;
    mural.insertBefore(div, mural.firstChild);

    alert(`🥊 ACESSO LIBERADO: Bom treino, ${aluno.nome}!`);
}

window.confirmarPresencaManual = function() {
    const id = document.getElementById('presenca-aluno').value;
    if(id) processarEntradaValidada(id);
};

// ========================================================
// 🗂️ CENTRAL DE REGISTROS, EDIÇÃO E RELATÓRIOS PREMIUM
// ========================================================
function renderizarCadastros() {
    const busca = document.getElementById('pesquisa-reativa').value.toLowerCase();
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";

    // Listagem reativa de Alunos
    session.alunos.filter(a => a.nome.toLowerCase().includes(busca)).forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        const f = a.foto ? `background-image:url(${a.foto});` : "";
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="mini-avatar" style="${f}"></div>
                <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.perfil} | Freq: ${a.frequencia} aulas</small></div>
            </div>
            <div>
                <span class="badge" style="background:${a.statusFinanceiro === 'Em dia' ? '#4ade80':'#ba0f14'}">${a.statusFinanceiro}</span>
                <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-left:5px;" onclick="abrirEdicao('${a.id}')">Editar</button>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-left:2px;" onclick="excluirItem('${a.id}', 'aluno')">Excluir</button>
            </div>
        `;
        container.appendChild(div);
    });

    // Listagem reativa de Filiais
    session.cts.filter(c => c.nome.toLowerCase().includes(busca)).forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>🏛️ ${c.nome}</strong><br><small style="color:#8a8a8a;">Responsável: ${c.responsavel}</small></div>
            <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;" onclick="excluirItem('${c.id}', 'ct')">Excluir</button>
        `;
        container.appendChild(div);
    });
}

window.excluirItem = function(id, tipo) {
    if(!confirm("Deseja deletar este registro de forma permanente?")) return;

    if(tipo === 'aluno') {
        const index = session.alunos.findIndex(a => a.id === String(id));
        if(index !== -1) {
            registrarLogLocal(`Admin`, "Exclusão", `Removeu o cadastro do atleta ${session.alunos[index].nome}.`);
            session.alunos.splice(index, 1);
        }
    } else if(tipo === 'ct') {
        const index = session.cts.findIndex(c => c.id === String(id));
        if(index !== -1) {
            registrarLogLocal(`Admin`, "Exclusão", `Removeu a filial ${session.cts[index].nome}.`);
            session.cts.splice(index, 1);
        }
    }
    renderizarCadastros();
};

window.abrirEdicao = function(idAluno) {
    const aluno = session.alunos.find(a => a.id === String(idAluno));
    if(!aluno) return;

    document.getElementById('edit-id-oculto').value = aluno.id;
    document.getElementById('edit-nome').value = aluno.nome;
    document.getElementById('edit-plano').value = aluno.plano;
    document.getElementById('edit-modalidade').value = aluno.modalidade;
    document.getElementById('edit-graduacao').value = aluno.graduacao;
    document.getElementById('edit-foto-preview').style.backgroundImage = aluno.foto ? `url(${aluno.foto})` : "none";
    document.getElementById('edit-foto-preview').dataset.fotoBase64 = aluno.foto || "";

    window.navegarPara(10);
};

window.salvarAlteracoesDedicadas = function() {
    const id = document.getElementById('edit-id-oculto').value;
    const aluno = session.alunos.find(a => a.id === String(id));

    if(aluno) {
        const gradNova = document.getElementById('edit-graduacao').value;
        if(aluno.graduacao !== gradNova) {
            registrarLogLocal(`Admin [Mestre]`, "Mudança de Faixa", `O usuário alterou a graduação do aluno ${aluno.nome} de [${aluno.graduacao}] para [${gradNova}].`);
        }
        aluno.nome = document.getElementById('edit-nome').value;
        aluno.plano = document.getElementById('edit-plano').value;
        aluno.modalidade = document.getElementById('edit-modalidade').value;
        aluno.graduacao = gradNova;
        aluno.foto = document.getElementById('edit-foto-preview').getElementById('edit-foto-preview').dataset.fotoBase64 || aluno.foto;

        alert("Cadastro atualizado com sucesso!");
        window.navegarPara(9);
    }
};

window.processarFiltroRelatorio = function() {
    const cat = document.getElementById('rep-categoria').value;
    const mod = document.getElementById('rep-modalidade').value;
    const grid = document.getElementById('relatorio-resultado-tela');
    grid.innerHTML = "";

    let filtrados = session.alunos;
    if(cat !== "Todos") filtrados = filtrados.filter(a => a.perfil === cat);
    if(mod !== "Todas") filtrados = filtrados.filter(a => a.modalidade === mod);

    // Contadores analíticos em tela
    document.getElementById('rep-count-alunos').textContent = filtrados.length;
    let soma=0; filtrados.forEach(f=>soma+=(session.precos[f.perfil]||0));
    document.getElementById('rep-soma-valores').textContent = `R$ ${soma.toFixed(2)}`;

    if(filtrados.length === 0) {
        grid.innerHTML = "<p style='color:#8a8a8a; text-align:center; padding:20px;'>Nenhum registro encontrado.</p>";
        return;
    }

    filtrados.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">${a.modalidade} (${a.graduacao})</small></div>
            <span>Valor Perfil: R$ ${Number(session.precos[a.perfil]).toFixed(2)}</span>
        `;
        grid.appendChild(div);
    });
};

// ========================================================
// 📱 CENTRAL EXCLUSIVA DA CARTEIRINHA DIGITAL DO ATLETA
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
        boxchem = `<h3>ACESSO TOTAL LIBERADO ✔️</h3><p>Sua mensalidade de R$ ${Number(session.precos[a.perfil]).toFixed(2)} está quitada.</p>`;
        box.innerHTML = boxchem;
    } else {
        box.className = "status-box status-atraso";
        boxchem = `<h3>PENDÊNCIA FINANCEIRA ⚠️</h3><p>Procure a recepção da Arena para liberação da catraca.</p>`;
        box.innerHTML = boxchem;
    }

    if(a.foto) {
        document.getElementById('aluno-avatar-foto').style.backgroundImage = `url(${a.foto})`;
        document.getElementById('aluno-avatar-foto').textContent = "";
    }

    // GERAÇÃO DO QR CODE EXCLUSIVO DA CARTEIRINHA INDUSTRIAL
    document.getElementById('qrcode-carteirinha').innerHTML = "";
    if (typeof QRCode !== 'undefined') {
        new QRCode(document.getElementById('qrcode-carteirinha'), {
            text: String(a.id),
            width: 130,
            height: 130,
            colorDark: "#000000",
            colorLight: "#ffffff"
        });
    }
}

// ========================================================
// ⚙️ TABELA DE CONFIGURAÇÕES DE PREÇOS E AUDITORIA CRONOLÓGICA
// ========================================================
function renderizarConfiguracoes() {
    document.getElementById('conf-preco-comercial').value = session.precos.Comercial;
    document.getElementById('conf-preco-atleta').value = session.precos.Atleta;
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

window.salvarTabelaPrecos = function() {
    const cAntigo = session.precos.Comercial;
    const aAntigo = session.precos.Atleta;

    session.precos.Comercial = parseFloat(document.getElementById('conf-preco-comercial').value) || 0;
    session.precos.Atleta = parseFloat(document.getElementById('conf-preco-atleta').value) || 0;
    session.precos.Instrutor = parseFloat(document.getElementById('conf-preco-instrutor').value) || 0;

    registrarLogLocal(`Admin [Mestre]`, "Tabela de Preços", `Alterou mensalidades: Comercial de R$${cAntigo} para R$${session.precos.Comercial} | Atleta de R$${aAntigo} para R$${session.precos.Atleta}.`);
    alert("Tabela de mensalidades por perfil atualizada e recalculada!");
    renderizarConfiguracoes();
};

window.firebaseLogoff = function() {
    session.currentUser = null;
    window.navegarPara(1);
};

window.desconectarConta = window.firebaseLogoff;
