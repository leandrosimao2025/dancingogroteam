// ========================================================
// 📊 BANCO DE DADOS CORE & ESTADO DINÂMICO DO SISTEMA
// ========================================================
window.session = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80 },
    alunos: [
        { id: "101", nome: "Carlos Silva", whatsapp: "21999998888", plano: "Mensal", statusFinanceiro: "Em dia", perfil: "Comercial", modalidade: "Muay Thai", graduacao: "Vermelho", foto: "", frequencia: 14, dataCadastro: "10/05/2026" },
        { id: "102", nome: "Marcos Lima", whatsapp: "21988887777", plano: "Trimestral", statusFinanceiro: "Inadimplente", perfil: "Atleta", modalidade: "Boxe", graduacao: "Classe B (Avançado)", foto: "", frequencia: 8, dataCadastro: "12/05/2026" }
    ],
    cts: [
        { id: "201", nome: "CT Matriz - Campo Grande", cnpj: "12.345.678/0001-00", responsavel: "Mestre Ogro", endereco: "Av. Cesário de Melo, 1500", cidade: "Rio de Janeiro/RJ", whatsapp: "21977776666", capacidade: 40, mensalidade: 150 }
    ],
    admins: [
        { id: "301", nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre", foto: "" },
        { id: "302", nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo", foto: "" }
    ],
    logs: [
        { data: "15/05/2026 - 10:14", autor: "Admin [Mestre]", acao: "Configuração", detalhe: "Tabela de preços inicial sincronizada na nuvem." }
    ],
    editandoId: null,
    editandoTipo: null,
    fotoTemporaria: ""
};

// ========================================================
// 🛡️ MOTOR DE NAVEGAÇÃO OPERACIONAL E TRAVAS DE ACESSO
// ========================================================
window.navegarPara = function(idPagina) {
    // Validação rígida de login pendente
    if (idPagina !== 1 && idPagina !== 2 && !window.session.currentUser) {
        alert("🔒 Acesso restrito! Efetue login para entrar na Arena.");
        idPagina = 1;
    }
    
    // Regra de privilégio para Aluno Comum (Apenas Página 12)
    if (window.session.currentUser?.nivel === "Aluno" && idPagina !== 12 && idPagina !== 1) {
        alert("🛑 Acesso Negado: Alunos possuem permissão exclusiva para a Central Individual.");
        return;
    }

    // Regra de privilégio para Aluno Instrutor (Página 12 e Página 8 - Chamadas)
    if (window.session.currentUser?.nivel === "Aluno Instrutor" && idPagina !== 12 && idPagina !== 8 && idPagina !== 1) {
        alert("🛑 Acesso Híbrido Restrito: Instrutores acessam apenas a sua área e a folha de chamadas.");
        return;
    }

    // Regra de bloqueio completo de Configurações e Logs (Página 13) para Apoio Administrativo
    if (idPagina === 13 && window.session.currentUser?.nivel === "Apoio Administrativo") {
        alert("🛡️ Bloqueio de Auditoria: Perfil de Apoio não possui acesso à Tabela de Preços e Logs.");
        return;
    }

    // Gerenciador Inteligente do Rodapé Global para Perfis de Gestão
    const footer = document.querySelector('.footer-fixo');
    if (window.session.currentUser && (window.session.currentUser.nivel === "Mestre" || window.session.currentUser.nivel === "Apoio Administrativo")) {
        footer.classList.add('show-footer');
    } else {
        footer.classList.remove('show-footer');
    }

    // Transição de telas
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const paginaAlvo = document.getElementById(`p${idPagina}`);
    if (paginaAlvo) paginaAlvo.classList.add('active');

    // Inicialização automática dos Dashboards Dinâmicos e Listas Reativas
    if (idPagina === 3) renderizarMenuPremium();
    if (idPagina === 6) renderizarDashboardBrutal();
    if (idPagina === 7) renderizarEquipeEAtribuicoes();
    if (idPagina === 8) renderizarFrequenciaEPlanejamento();
    if (idPagina === 9) renderizarCadastrosSincronizados();
    if (idPagina === 11) renderizarRelatoriosAvancados();
    if (idPagina === 12) renderizarAreaAlunoPremium();
    if (idPagina === 13) renderizarConfiguracoesEAuditoria();
};

function registrarLogGlobal(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    window.session.logs.unshift({ data: dataFormatada, autor, acao, detalhe });
}

// ========================================================
// 🔐 CONTROLE VISUAL E PROCESSAMENTO DE ACESSOS
// ========================================================
window.executarLogin = function() {
    const loginInput = document.getElementById('login-email').value.trim();
    const senhaInput = document.getElementById('login-senha').value;

    // 1. Validação de Administradores Master / Apoio
    const adm = window.session.admins.find(a => (a.email === loginInput || a.nome === loginInput) && a.senha === senhaInput);
    if (adm) {
        window.session.currentUser = adm;
        registrarLogGlobal(`Admin [${adm.nivel}]`, "Login", `O usuário ${adm.nome} entrou no sistema.`);
        window.navegarPara(3);
        return;
    }

    // 2. Validação de Alunos / Alunos Instrutores
    const aluno = window.session.alunos.find(a => (a.whatsapp === loginInput || a.nome === loginInput) && senhaInput === "123");
    if (aluno) {
        window.session.currentUser = { ...aluno, nivel: aluno.perfil === "Instrutor" ? "Aluno Instrutor" : "Aluno" };
        window.navegarPara(aluno.perfil === "Instrutor" ? 8 : 12);
        return;
    }

    alert("❌ Credenciais Inválidas! Verifique os dados digitados.");
};

window.alternarSenha = function() {
    const input = document.getElementById('login-senha');
    input.type = input.type === 'password' ? 'text' : 'password';
};

// ========================================================
// 👤 MÓDULO DE CADASTROS INDUSTRIAIS (ALUNOS E ACADEMIAS)
// ========================================================
window.capturarFotoPerfil = function(event, previewId) {
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById(previewId).style.backgroundImage = `url(${reader.result})`;
        document.getElementById(previewId).textContent = "";
        window.session.fotoTemporaria = reader.result;
    };
    if (event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
};

window.firebaseSalvarAluno = function() {
    const nome = document.getElementById('cad-aluno-nome').value.trim();
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value.trim();
    const perfil = document.getElementById('cad-aluno-perfil').value;

    if (!nome || !whatsapp) return alert("⚠️ Preencha Nome Completo e WhatsApp para salvar.");

    const novoAluno = {
        id: String(Date.now()),
        nome, whatsapp, perfil,
        plano: document.getElementById('cad-aluno-plano').value,
        statusFinanceiro: document.getElementById('cad-aluno-status').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        graduacao: document.getElementById('cad-aluno-graduacao').value,
        foto: window.session.fotoTemporaria || "",
        frequencia: 0,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
    };

    window.session.alunos.push(novoAluno);
    registrarLogGlobal(`Admin [${window.session.currentUser?.nivel || 'Mestre'}]`, "Cadastro Aluno", `Matriculou o atleta ${nome} no perfil ${perfil}.`);
    window.session.fotoTemporaria = ""; // Reseta buffer

    // Envio Real de Notificação customizada via API do WhatsApp
    const msg = encodeURIComponent(`🥋 Olá *${nome}*! Seu acesso premium à plataforma do *Ogro Team* foi liberado.\n\n📱 *Link do App:* https://github.io\n🔐 *Seu Usuário:* ${whatsapp}\n🔑 *Sua Senha Provisória:* 123`);
    
    alert(`🎉 Aluno cadastrado com sucesso!`);
    window.open(`https://whatsapp.com{whatsapp}&text=${msg}`, '_blank');
    window.navegarPara(3); // Retorna automaticamente para o Painel de Gestão
};
window.salvarAluno = window.firebaseSalvarAluno;

window.firebaseSalvarCT = function() {
    const nome = document.getElementById('cad-ct-nome').value.trim();
    if (!nome) return alert("⚠️ O nome da unidade/filial é obrigatório.");

    const novoCT = {
        id: String(Date.now()),
        nome,
        cnpj: document.getElementById('cad-ct-cnpj').value || "Não informado",
        responsavel: document.getElementById('cad-ct-responsavel').value || "Não informado",
        endereco: document.getElementById('cad-ct-endereco').value || "Não informado",
        cidade: document.getElementById('cad-ct-cidade').value || "Não informado",
        whatsapp: document.getElementById('cad-ct-whatsapp').value || "Não informado",
        capacidade: document.getElementById('cad-ct-capacidade').value || "30",
        mensalidade: parseFloat(document.getElementById('cad-ct-mensalidade').value) || 150
    };

    window.session.cts.push(novoCT);
    registrarLogGlobal(`Admin [${window.session.currentUser?.nivel || 'Mestre'}]`, "Cadastro CT", `Registrou a filial ${nome}.`);
    
    alert(`🏛️ Unidade ${nome} registrada com sucesso!`);
    window.navegarPara(3); // Retorna para a página inicial
};
window.salvarCT = window.firebaseSalvarCT;

// ========================================================
// 📈 DASHBOARD FINANCEIRO E MÓDULO DE COBRANÇAS
// ========================================================
function renderizarDashboardBrutal() {
    let faturamentoTotal = 0, inadimplenciaTotal = 0, recebidoTotal = 0;
    let ativos = 0, devedores = 0;

    window.session.alunos.forEach(a => {
        const valorPlano = window.session.precos[a.perfil] || 0;
        faturamentoTotal += valorPlano;
        if (a.statusFinanceiro === "Em dia") {
            recebidoTotal += valorPlano;
            ativos++;
        } else {
            inadimplenciaTotal += valorPlano;
            devedores++;
        }
    });

    document.getElementById('dash-faturamento').textContent = `R$ ${faturamentoTotal.toFixed(2)}`;
    document.getElementById('dash-inadimplencia').textContent = `R$ ${inadimplenciaTotal.toFixed(2)}`;
    document.getElementById('dash-recebido').textContent = `R$ ${recebidoTotal.toFixed(2)}`;

    // Renderização dos Gráficos em Barras Gráficas via CSS Dinâmico
    const totalFin = faturamentoTotal || 1;
    const pctRecebido = (recebidoTotal / totalFin) * 100;
    const pctAtraso = (inadimplenciaTotal / totalFin) * 100;

    const containerDevedores = document.getElementById('dash-lista-devedores');
    containerDevedores.innerHTML = `
        <div style="margin-bottom:15px; background:#161616; padding:12px; border-radius:6px; border:1px solid #262626;">
            <p style="font-size:12px; color:#8a8a8a; margin-bottom:4px; text-transform:uppercase;">Saúde do Caixa da Arena</p>
            <div style="display:flex; height:12px; border-radius:4px; overflow:hidden; background:#222;">
                <div style="width:${pctRecebido}%; background:#4ade80;"></div>
                <div style="width:${pctAtraso}%; background:#ba0f14;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:6px;">
                <span style="color:#4ade80;">✔ ${pctRecebido.toFixed(0)}% Recebido</span>
                <span style="color:#f87171;">⚠️ ${pctAtraso.toFixed(0)}% Inadimplente</span>
            </div>
        </div>
    `;

    // Listagem da régua de cobrança automatizada
    const listaInad = window.session.alunos.filter(a => a.statusFinanceiro !== "Em dia");
    if (listaInad.length === 0) {
        containerDevedores.innerHTML += `<p style="font-size:13px; color:#8a8a8a; text-align:center; padding:10px;">🏆 Caixa Perfeito! Zero inadimplência registrada.</p>`;
    } else {
        listaInad.forEach(a => {
            const msgInad = encodeURIComponent(`⚠️ *Aviso Importante do Ogro Team* ⚠️\n\nOlá *${a.nome}*, identificamos uma pendência financeira em aberto referente ao seu plano *${a.plano}*.\n\nPor favor, efetue o pagamento via Pix ou procure a recepção para liberar sua carteirinha e evitar o bloqueio na catraca.`);
            const div = document.createElement('div');
            div.className = "item-registro";
            div.innerHTML = `
                <div>
                    <strong>${a.nome}</strong> <br>
                    <small style="color:#ef4444;">Perfil: ${a.perfil} | Pendente: R$ ${(window.session.precos[a.perfil] || 0).toFixed(2)}</small>
                </div>
                <button class="btn btn-primary" style="padding:6px 12px; font-size:12px; width:auto; margin-top:0;" onclick="window.open('https://whatsapp.com{a.whatsapp}&text=${msgInad}', '_blank')">Notificar</button>
            `;
            containerDevedores.appendChild(div);
        });
    }
}

// ========================================================
// 👥 GESTÃO AVANÇADA DE EQUIPE E PRIVILÉGIOS
// ========================================================
function renderizarEquipeEAtribuicoes() {
    const containerAlunos = document.getElementById('lista-promocao-alunos');
    containerAlunos.innerHTML = "";

    // Painel do formulário de criação de novos administradores
    const formHtml = `
        <div style="background:#121212; padding:15px; border-radius:8px; border:1px solid #262626; margin-bottom:20px;">
            <h3>🛡️ Adicionar Administrador Manual</h3>
            <div class="form-group" style="margin-top:10px;"><label>Nome Completo</label><input type="text" id="adm-novo-nome"></div>
            <div class="form-group"><label>E-mail Corporativo</label><input type="email" id="adm-novo-email"></div>
            <div class="form-group"><label>Senha de Acesso</label><input type="password" id="adm-novo-senha" placeholder="Mínimo 3 dígitos"></div>
            <div class="form-group">
                <label>Nível de Acesso</label>
                <select id="adm-novo-nivel">
                    <option value="Administrador Integral">Administrador Integral</option>
                    <option value="Apoio Administrativo">Apoio Administrativo</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="salvarNovoAdminModulo()">Gravar Novo Gestor</button>
        </div>
        <h3>🛡️ Lista Geral de Atletas Elegíveis para Promoção</h3>
    `;
    
    // Injeção dinâmica do formulário que havia sumido anteriormente
    const wrapper = document.createElement('div');
    wrapper.innerHTML = formHtml;
    containerAlunos.appendChild(wrapper);

    window.session.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `
            <div>
                <strong>${a.nome}</strong> <br>
                <small style="color:#8a8a8a;">Vínculo Atual: ${a.perfil}</small>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="btn btn-primary" style="padding:4px 8px; font-size:11px; width:auto; margin-top:0;" onclick="promoverAtletaParaAdmin(${a.id}, 'Mestre')">Mestre</button>
                <button class="btn btn-accent" style="padding:4px 8px; font-size:11px; width:auto; margin-top:0;" onclick="promoverAtletaParaAdmin(${a.id}, 'Apoio Administrativo')">Apoio</button>
            </div>
        `;
        containerAlunos.appendChild(div);
    });
}

window.salvarNovoAdminModulo = function() {
    const nome = document.getElementById('adm-novo-nome').value.trim();
    const email = document.getElementById('adm-novo-email').value.trim();
    const senha = document.getElementById('adm-novo-senha').value;
    const nivel = document.getElementById('adm-novo-nivel').value;

    if (!nome || !email || !senha) return alert("⚠️ Todos os campos são obrigatórios para registrar o gestor.");

    window.session.admins.push({ id: String(Date.now()), nome, email, senha, nivel, foto: "" });
    registrarLogGlobal(`Admin [Mestre]`, "Nova Atribuição", `Criou o gestor corporativo ${nome} com nível de ${nivel}.`);
    alert(`🛡️ Gestor registrado com sucesso!`);
    renderizarEquipeEAtribuicoes();
};

window.promoverAtletaParaAdmin = function(idAtleta, nivelAlvo) {
    const atleta = window.session.alunos.find(a => a.id === String(idAtleta));
    if (!atleta) return;

    window.session.admins.push({
        id: String(Date.now()),
        nome: atleta.nome,
        email: `${atleta.nome.toLowerCase().replace(/\s+/g, '')}@ogroteam.com`,
        senha: "123",
        nivel: nivelAlvo,
        foto: atleta.foto
    });

    registrarLogGlobal(`Admin [Mestre]`, "Privilégio Alterado", `Promoveu o aluno ${atleta.nome} para cargo de Administrador [${nivelAlvo}] 🛡️.`);
    alert(`🔥 SUCESSO: ${atleta.nome} foi promovido para a gestão da Arena como ${nivelAlvo}! Tag protetora 🛡️ anexada.`);
    renderizarEquipeEAtribuicoes();
};

// ========================================================
// ⏱️ CHIP DE FREQUÊNCIA & LEITOR VIRTUAL DA CATRACA QR
// ========================================================
function renderizarFrequenciaEPlanejamento() {
    const select = document.getElementById('presenca-aluno');
    select.innerHTML = "";
    window.session.alunos.forEach(a => select.innerHTML += `<option value="${a.id}">${a.nome}</option>`);

    // Injeção do layout interativo do scanner de câmera virtual
    const containerReader = document.getElementById('reader');
    containerReader.innerHTML = `
        <div style="padding:20px; text-align:center;">
            <div style="width:70px; height:70px; border:3px solid #ba0f14; border-radius:50%; display:inline-flex; justify-content:center; align-items:center; font-size:28px; animation: pulse 1.5s infinite; background: rgba(186,15,20,0.1);">📹</div>
            <p style="font-size:13px; color:#ffffff; margin-top:12px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">Aguardando Sinal da Câmera...</p>
            <button class="btn btn-primary" style="margin-top:15px; font-size:12px; padding:8px 12px;" onclick="simularLeituraDeCatracaQR()">Simular Escaneamento de Carteirinha</button>
        </div>
    `;
}

window.simularLeituraDeCatracaQR = function() {
    if (window.session.alunos.length === 0) return alert("Nenhum atleta cadastrado.");
    // Sorteia um aluno da base para simular o recebimento do token criptografado do QR Code
    const alunoSorteado = window.session.alunos[Math.floor(Math.random() * window.session.alunos.length)];
    window.processarEntradaCatracaQR(alunoSorteado.id);
};

window.processarEntradaCatracaQR = function(idAlunoVerificado) {
    const aluno = window.session.alunos.find(a => a.id === String(idAlunoVerificado));
    if (!aluno) return;

    aluno.frequencia = (aluno.frequencia || 0) + 1;
    registrarLogGlobal("Catraca QR Code", "Entrada Atleta", `Frequência computada para ${aluno.nome} via scanner.`);

    // Injeção imediata no painel do mural da arena em ordem cronológica reversa
    const mural = document.getElementById('mural-chamadas');
    const item = document.createElement('div');
    item.className = "item-registro";
    item.style.borderLeft = "4px solid #4ade80";
    item.innerHTML = `
        <div>
            <strong>🟢 ${new Date().toLocaleTimeString('pt-BR')}</strong> - Entrada Liberada
            <br><small style="color:#ffffff; font-weight:bold;">${aluno.nome} | Graduação: ${aluno.graduacao}</small>
        </div>
        <span style="font-size:11px; color:#8a8a8a;">Check-in #${aluno.frequencia}</span>
    `;
    mural.insertBefore(item, mural.firstChild);
    alert(`🥊 ACESSO LIBERADO!\nBem-vindo à Arena, ${aluno.nome}.`);
};

window.firebasePresencaManual = function() {
    const id = document.getElementById('presenca-aluno').value;
    if (id) window.processarEntradaCatracaQR(id);
};
window.confirmarPresencaManual = window.firebasePresencaManual;

// ========================================================
// 🗂️ CENTRAL DE REGISTROS SINCRONIZADOS & OPERAÇÕES
// ========================================================
function renderizarCadastrosSincronizados() {
    const busca = document.getElementById('pesquisa-reativa').value.toLowerCase();
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";

    // 1. Renderização Reativa da Esteira de Alunos
    window.session.alunos.filter(a => a.nome.toLowerCase().includes(busca)).forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        // Tag com foto ou emoji avatar padrão se estiver sem imagem de upload
        const avatarStyle = a.foto ? `background-image:url(${a.foto}); background-size:cover;` : `background:#222; display:flex; align-items:center; justify-content:center;`;
        const avatarInner = a.foto ? "" : "🥋";
        
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:40px; height:40px; border-radius:50%; border:1px solid #ba0f14; ${avatarStyle}">${avatarInner}</div>
                <div>
                    <strong>${a.nome}</strong> <span class="badge" style="background:#ba0f14; font-size:9px;">${a.graduacao}</span><br>
                    <small style="color:#8a8a8a;">Perfil: ${a.perfil} | Plano: ${a.plano}</small>
                </div>
            </div>
            <div>
                <span class="badge" style="background:${a.statusFinanceiro === 'Em dia' ? '#4ade80':'#ef4444'}">${a.statusFinanceiro}</span>
                <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block; margin-top:0; margin-left:6px;" onclick="deletarRegistroModulo('${a.id}', 'aluno')">Deletar</button>
            </div>
        `;
        container.appendChild(div);
    });

    // 2. Renderização Reativa da Esteira de Unidades (CTs)
    window.session.cts.filter(c => c.nome.toLowerCase().includes(busca)).forEach(c => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.style.borderLeft = "3px solid #8a8a8a";
        div.innerHTML = `
            <div>
                <strong>🏛️ ${c.nome} (Unidade)</strong><br>
                <small style="color:#8a8a8a;">Resp: ${c.responsavel} | Cap: ${c.capacidade} alunos</small>
            </div>
            <button class="btn btn-vermelho" style="padding:4px 8px; font-size:11px; width:auto; margin-top:0;" onclick="deletarRegistroModulo('${c.id}', 'ct')">Deletar</button>
        `;
        container.appendChild(div);
    });
}

window.deletarRegistroModulo = function(id, tipo) {
    if (!confirm("🚨 SEGURANÇA: Tem certeza que deseja apagar permanentemente este registro da base de dados?")) return;

    if (tipo === 'aluno') {
        const idx = window.session.alunos.findIndex(a => a.id === String(id));
        if (idx !== -1) {
            registrarLogGlobal("Mestre", "Exclusão", `Excluiu permanentemente o registro do aluno ${window.session.alunos[idx].nome} (Plano ${window.session.alunos[idx].plano}).`);
            window.session.alunos.splice(idx, 1);
        }
    } else if (tipo === 'ct') {
        const idx = window.session.cts.findIndex(c => c.id === String(id));
        if (idx !== -1) {
            registrarLogGlobal("Mestre", "Exclusão", `Excluiu a filial ${window.session.cts[idx].nome}.`);
            window.session.cts.splice(idx, 1);
        }
    }
    renderizarCadastrosSincronizados();
};

// ========================================================
// 📊 CENTRAL DE RELATÓRIOS AVANÇADOS COM ENGENHARIA BI
// ========================================================
function renderizarRelatoriosAvancados() {
    const grid = document.getElementById('relatorio-resultado-tela');
    grid.innerHTML = "";

    // Geração Inteligente de Métricas de BI em Tempo Real
    const totalMatriculados = window.session.alunos.length;
    const totalPresencasMes = window.session.alunos.reduce((acc, curr) => acc + (curr.frequencia || 0), 0);
    
    let htmlBI = `
        <div style="background:#121212; padding:15px; border-radius:8px; border:1px solid #262626; margin-bottom:15px;">
            <h3 style="margin-bottom:10px;">📊 Relatório Consolidado de BI Operacional</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:center;">
                <div style="background:#0a0a0a; padding:10px; border-radius:6px; border:1px solid #222;">
                    <span style="font-size:20px; font-weight:bold; color:#ba0f14;">${totalMatriculados}</span>
                    <p style="font-size:10px; color:#8a8a8a; text-transform:uppercase;">Alunos Ativos</p>
                </div>
                <div style="background:#0a0a0a; padding:10px; border-radius:6px; border:1px solid #222;">
                    <span style="font-size:20px; font-weight:bold; color:#4ade80;">${totalPresencasMes}</span>
                    <p style="font-size:10px; color:#8a8a8a; text-transform:uppercase;">Check-ins no Mês</p>
                </div>
            </div>
        </div>
        <p style="font-size:12px; color:#8a8a8a; margin-bottom:10px; text-transform:uppercase;">Lista Detalhada por Filtro Comercial</p>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = htmlBI;
    grid.appendChild(wrapper);

    window.session.alunos.forEach(a => {
        const row = document.createElement('div');
        row.className = "item-registro";
        row.innerHTML = `
            <span><strong>${a.nome}</strong><br><small style="color:#8a8a8a;">Matrícula: ${a.dataCadastro} | Vínculo: ${a.perfil}</small></span>
            <span style="color:#ba0f14; font-weight:bold;">${a.frequencia} aulas</span>
        `;
        grid.appendChild(row);
    });
}

// ========================================================
// 📱 ÁREA EXCLUSIVA DO ALUNO PREMIUM (CARTEIRINHA E QR)
// ========================================================
function renderizarAreaAlunoPremium() {
    const a = window.session.currentUser;
    if (!a) return;

    document.getElementById('aluno-perfil-nome').textContent = a.nome;
    document.getElementById('aluno-tag-perfil').textContent = `[PERFIL: ALUNO ${a.perfil.toUpperCase()}]`;
    document.getElementById('aluno-tag-graduacao').textContent = `🥋 ${a.modalidade} - Nível: ${a.graduacao}`;
    document.getElementById('aluno-contador-freq').textContent = a.frequencia || 0;

    const box = document.getElementById('aluno-status-financeiro');
    if (a.statusFinanceiro === "Em dia") {
        box.className = "status-box status-pago";
        box.innerHTML = `<h3>Acesso Liberado ✔️</h3><p style="font-size:12px; margin-top:4px;">Seu plano contratado (${a.plano}) está regularizado.</p>`;
    } else {
        box.className = "status-box status-atraso";
        box.innerHTML = `<h3>Pendência Financeira ⚠️</h3><p style="font-size:12px; margin-top:4px;">Acesso bloqueado na catraca. Procure a secretaria da Arena.</p>`;
    }

    // Injeção de Carteirinha Criptografada em QR Code Real na tela do Atleta
    document.getElementById('qrcode-
