import { initializeApp } from "https://gstatic.com";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, setDoc } from "https://gstatic.com";

// SUAS CREDENCIAIS REAIS COLETADAS DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyDqtxriICZXt3dNXGUKP9KAAlWJNNE9ZdA",
  authDomain: "ogro-team.firebaseapp.com",
  projectId: "ogro-team",
  storageBucket: "ogro-team.firebasestorage.app",
  messagingSenderId: "280452859912",
  appId: "1:280452859912:web:341a26ec3cc73f11aa69bd",
  measurementId: "G-4WNMMR8XN4"
};

// Inicialização das instâncias
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado Local Volátil de Controle de Sessão
let session = {
    currentUser: null,
    precos: { Comercial: 150, Atleta: 100, Bolsista: 0, Instrutor: 80 },
    alunos: [],
    cts: [],
    admins: [
        { nome: "Mestre Ogro", email: "admin@ogroteam.com", senha: "123", nivel: "Mestre" },
        { nome: "Apoio 1", email: "apoio@ogroteam.com", senha: "123", nivel: "Apoio Administrativo" }
    ],
    logs: []
};

// Carregamento de dados inicial síncrono com Firebase
async function sincronizarComFirebase() {
    try {
        const queryAlunos = await getDocs(collection(db, "alunos"));
        session.alunos = queryAlunos.docs.map(d => ({ id: d.id, ...d.data() }));

        const queryCts = await getDocs(collection(db, "cts"));
        session.cts = queryCts.docs.map(d => ({ id: d.id, ...d.data() }));

        const queryLogs = await getDocs(collection(db, "logs"));
        session.logs = queryLogs.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.log("Erro de leitura inicial. Usando cache local.", e);
    }
}

// Controle global de rotas e segurança
window.navegarPara = function(idPagina) {
    if (idPagina !== 1 && idPagina !== 2 && !session.currentUser) {
        alert("Acesso restrito.");
        idPagina = 1;
    }
    
    // Tratamento de permissões de visualização
    if ((idPagina === 9 || idPagina === 13) && session.currentUser?.nivel === "Aluno") {
        alert("Acesso Proibido.");
        return;
    }

    const footer = document.querySelector('.footer-fixo');
    if (session.currentUser && (session.currentUser.nivel === "Mestre" || session.currentUser.nivel === "Apoio Administrativo")) {
        footer.classList.add('show-footer');
    } else {
        footer.classList.remove('show-footer');
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`p${idPagina}`).classList.add('active');

    if (idPagina === 6) renderizarDashboard();
    if (idPagina === 8) inicializarModuloFrequencia();
    if (idPagina === 9) renderizarCadastros();
    if (idPagina === 12) renderizarCarteirinhaAluno();
    if (idPagina === 13) renderizarConfiguracoes();
};

// Escrita de Logs Imutáveis no Firebase
async function registrarLogFirestore(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    const logData = { data: dataFormatada, autor, acao, detalhe, timestamp: Date.now() };
    
    session.logs.unshift(logData);
    await addDoc(collection(db, "logs"), logData);
}

// Autenticação Unificada
window.executarLogin = async function() {
    await sincronizarComFirebase();
    const loginInput = document.getElementById('login-email').value;
    const senhaInput = document.getElementById('login-senha').value;

    const adm = session.admins.find(a => a.email === loginInput && a.senha === senhaInput);
    if (adm) {
        session.currentUser = adm;
        registrarLogFirestore(`Admin [${adm.nivel}]`, "Login", "Entrou no sistema");
        navegarPara(3);
        return;
    }

    const aluno = session.alunos.find(a => (a.whatsapp === loginInput || a.nome === loginInput) && senhaInput === "123");
    if (aluno) {
        session.currentUser = { ...aluno, nivel: "Aluno" };
        navegarPara(12);
        return;
    }
    alert("Credenciais incorretas.");
};

// Cadastro de Aluno com Disparo Automatizado para o WhatsApp Oficial
window.salvarAluno = async function() {
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
    const perfil = document.getElementById('cad-aluno-perfil').value;

    if(!nome || !whatsapp) return alert("Dados obrigatórios faltando.");

    const payload = {
        nome, whatsapp, perfil,
        plano: document.getElementById('cad-aluno-plano').value,
        statusFinanceiro: document.getElementById('cad-aluno-status').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        graduacao: document.getElementById('cad-aluno-graduacao').value,
        frequencia: 0
    };

    await addDoc(collection(db, "alunos"), payload);
    await registrarLogFirestore("Sistema", "Cadastro Aluno", `Aluno ${nome} salvo na nuvem.`);
    
    // SISTEMA DE DISPARO REAL VIA API LINK WHATSAPP
    const mensagemTexto = encodeURIComponent(`🥋 Olá ${nome}! Seu cadastro no Ogro Team foi concluído com sucesso. Baixe sua carteirinha e acesse o aplicativo usando seu nome ou whatsapp com a senha padrão: 123`);
    window.open(`https://whatsapp.com{whatsapp}&text=${mensagemTexto}`, '_blank');

    alert("Aluno cadastrado no Firestore. Disparo de boas-vindas iniciado.");
    navegarPara(3);
};

// Cadastro de Filiais (CT)
window.salvarCT = async function() {
    const nome = document.getElementById('cad-ct-nome').value;
    const payload = {
        nome,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value
    };
    await addDoc(collection(db, "cts"), payload);
    alert("CT adicionado!");
    navegarPara(3);
};

// Coleta e Cálculo Financeiro Dinâmico do Dashboard
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
        // Sistema Inteligente de Link Direto de Cobrança Financeira via WhatsApp
        const msgCobranca = encodeURIComponent(`⚠️ Olá ${a.nome}, consta uma pendência financeira em aberto no seu plano do Ogro Team. Por favor, regularize na secretaria.`);
        div.innerHTML = `<span>${a.nome} (${a.perfil})</span> <button class="btn btn-primary" style="padding:4px; font-size:11px;" onclick="window.open('https://whatsapp.com{a.whatsapp}&text=${msgCobranca}', '_blank')">Cobrar Whats</button>`;
        lista.appendChild(div);
    });
}

// MÓDULO OPERACIONAL: CATRACA COM LEITOR DE QR CODE REAL
let html5QrcodeScanner = null;
function inicializarModuloFrequencia() {
    const select = document.getElementById('presenca-aluno');
    select.innerHTML = "";
    session.alunos.forEach(a => select.innerHTML += `<option value="${a.id}">${a.nome}</option>`);

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        html5QrcodeScanner.render((decodedText) => {
            processarEntradaCatracaQR(decodedText);
        }, (error) => { /* Silenciar erros de leitura contínua */ });
    }
}

async function processarEntradaCatracaQR(idAlunoConfirmado) {
    const aluno = session.alunos.find(a => a.id === idAlunoConfirmado);
    if (!aluno) return;

    aluno.frequencia = (aluno.frequencia || 0) + 1;
    const alunoRef = doc(db, "alunos", aluno.id);
    await updateDoc(alunoRef, { frequencia: aluno.frequencia });

    await registrarLogFirestore("Catraca QR Code", "Entrada Atleta", `${aluno.nome} acessou a Arena.`);
    alert(`🥊 ACESSO LIBERADO: Bem-vindo(a) ${aluno.nome}!`);
    navegarPara(3);
}

window.confirmarPresencaManual = async function() {
    const id = document.getElementById('presenca-aluno').value;
    if(id) await processarEntradaCatracaQR(id);
};

// MÓDULO DO ALUNO: GERADOR DO QR CODE INDIVIDUAL DA CARTEIRINHA
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
        boxFinanceira.innerHTML = "<h3>Bloqueado: Procure a Secretaria ⚠️</h3>";
    }

    // Injeção do QR Code contendo o ID exclusivo do Firestore para validação na catraca
    document.getElementById('qrcode-carteirinha').innerHTML = "";
    new QRCode(document.getElementById('qrcode-carteirinha'), {
        text: a.id,
        width: 128,
        height: 128
    });
}

function renderizarCadastros() {
    const container = document.getElementById('lista-sincronizada');
    container.innerHTML = "";
    session.alunos.forEach(a => {
        const div = document.createElement('div');
        div.className = "item-registro";
        div.innerHTML = `<span><strong>${a.nome}</strong> - ${a.perfil}</span> <span class="badge">${a.statusFinanceiro}</span>`;
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

window.desconectarConta = function() {
    session.currentUser = null;
    navegarPara(1);
};

// Inicialização e escuta padrão
window.alternarSenha = function() {
    const input = document.getElementById('login-senha');
    input.type = input.type === 'password' ? 'text' : 'password';
};

sincronizarComFirebase();
