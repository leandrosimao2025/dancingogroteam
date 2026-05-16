// IMPORTAÇÃO VIA CDN INTEGRADO PARA NAVEGADORES
import { initializeApp } from "https://gstatic.com";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://gstatic.com";

// CREDENCIAIS OFICIAIS DO SEU BANCO DE DADOS
const firebaseConfig = {
  apiKey: "AIzaSyDqtxriICZXt3dNXGUKP9KAAlWJNNE9ZdA",
  authDomain: "://firebaseapp.com",
  projectId: "ogro-team",
  storageBucket: "ogro-team.firebasestorage.app",
  messagingSenderId: "280452859912",
  appId: "1:280452859912:web:341a26ec3cc73f11aa69bd",
  measurementId: "G-4WNMMR8XN4"
};

// Inicialização das instâncias
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado Local de Controle
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

// Sincronização em Nuvem
async function sincronizarComFirebase() {
    try {
        const queryAlunos = await getDocs(collection(db, "alunos"));
        session.alunos = queryAlunos.docs.map(d => ({ id: d.id, ...d.data() }));

        const queryCts = await getDocs(collection(db, "cts"));
        session.cts = queryCts.docs.map(d => ({ id: d.id, ...d.data() }));

        const queryLogs = await getDocs(collection(db, "logs"));
        session.logs = queryLogs.docs.map(d => d.data()).sort((a,b) => b.timestamp - a.timestamp);
    } catch (e) {
        console.error("Erro na leitura das coleções: ", e);
    }
}

// Histórico de Logs Firestore
async function registrarLogFirestore(autor, acao, detalhe) {
    const agora = new Date();
    const dataFormatada = `${agora.toLocaleDateString('pt-BR')} - ${agora.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    const logData = { data: dataFormatada, autor, acao, detalhe, timestamp: Date.now() };
    
    session.logs.unshift(logData);
    try {
        await addDoc(collection(db, "logs"), logData);
    } catch(e) {
        console.error(e);
    }
}

// ========================================================
// CAPA INTERMEDIÁRIA GLOBAL PARA CONEXÃO COM O INDEX.HTML
// ========================================================

window.firebaseNavegar = function(idPagina) {
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

window.firebaseLogin = async function() {
    await sincronizarComFirebase();
    const loginInput = document.getElementById('login-email').value;
    const senhaInput = document.getElementById('login-senha').value;

    if (loginInput === "admin@ogroteam.com" && senhaInput === "123") {
        session.currentUser = { nome: "Mestre Ogro", email: "admin@ogroteam.com", nivel: "Mestre" };
        await registrarLogFirestore(`Admin [Mestre]`, "Login", "Entrou no sistema");
        window.firebaseNavegar(3);
        return;
    }

    const aluno = session.alunos.find(a => (a.whatsapp === loginInput || a.nome === loginInput) && senhaInput === "123");
    if (aluno) {
        session.currentUser = { ...aluno, nivel: "Aluno" };
        window.firebaseNavegar(12);
        return;
    }
    alert("Credenciais incorretas.");
};

// SALVAMENTO SEGURO SEM BLOQUEIO DE POPUP
window.firebaseSalvarAluno = async function() {
    const nome = document.getElementById('cad-aluno-nome').value;
    const whatsapp = document.getElementById('cad-aluno-whatsapp').value;
    const perfil = document.getElementById('cad-aluno-perfil').value;

    if(!nome || !whatsapp) return alert("Campos obrigatórios vazios.");

    const payload = {
        nome, whatsapp, perfil,
        plano: document.getElementById('cad-aluno-plano').value,
        statusFinanceiro: document.getElementById('cad-aluno-status').value,
        modalidade: document.getElementById('cad-aluno-modalidade').value,
        graduacao: document.getElementById('cad-aluno-graduacao').value,
        frequencia: 0
    };

    try {
        await addDoc(collection(db, "alunos"), payload);
        await registrarLogFirestore("Sistema", "Cadastro Aluno", `Aluno ${nome} salvo.`);
        
        alert("Aluno salvo com sucesso na Nuvem do Firebase!");
        
        // CORREÇÃO: Em vez de window.open direto, redireciona o usuário de forma amigável
        const mensagemTexto = encodeURIComponent(`🥋 Olá ${nome}! Seu cadastro no Ogro Team foi concluído. Acesse o aplicativo usando seu nome ou whatsapp com a senha padrão: 123`);
        const urlWhats = `https://whatsapp.com{whatsapp}&text=${mensagemTexto}`;
        
        if (confirm("Deseja abrir o WhatsApp agora para enviar os dados de acesso do aluno?")) {
            window.location.href = urlWhats; // Abre na mesma aba para burlar bloqueios de celular
        } else {
            await sincronizarComFirebase(); 
            window.firebaseNavegar(3);
        }
    } catch (e) {
        alert("Erro ao salvar no banco. Verifique as regras do Firestore.");
        console.error(e);
    }
};

window.salvarAluno = window.firebaseSalvarAluno;

window.firebaseSalvarCT = async function() {
    const nome = document.getElementById('cad-ct-nome').value;
    const payload = {
        nome,
        cnpj: document.getElementById('cad-ct-cnpj').value,
        responsavel: document.getElementById('cad-ct-responsavel').value,
        whatsapp: document.getElementById('cad-ct-whatsapp').value
    };
    await addDoc(collection(db, "cts"), payload);
    alert("CT Adicionado!");
    window.firebaseNavegar(3);
};

window.firebasePresencaManual = async function() {
    const id = document.getElementById('presenca-aluno').value;
    if(id) {
        const aluno = session.alunos.find(a => a.id === id);
        if (aluno) {
            aluno.frequencia = (aluno.frequencia || 0) + 1;
            const alunoRef = doc(db, "alunos", id);
            await updateDoc(alunoRef, { frequencia: aluno.frequencia });
            await registrarLogFirestore("Manual", "Entrada Atleta", `${aluno.nome} entrou.`);
            alert(`🥊 Presença confirmada para ${aluno.nome}!`);
            window.firebaseNavegar(3);
        }
    }
};

window.firebaseLogoff = function() {
    session.currentUser = null;
    window.firebaseNavegar(1);
};

// ========================================================
// RENDERIZADORES INTERNOS DE INTERFACE
// ========================================================

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
        const msgCobranca = encodeURIComponent(`⚠️ Olá ${a.nome}, consta uma pendência em aberto no Ogro Team. Por favor, regularize.`);
        div.innerHTML = `<span>${a.nome}</span> <button class="btn btn-primary" style="padding:4px; font-size:11px;" onclick="window.location.href='https://whatsapp.com{a.whatsapp}&text=${msgCobranca}'">Cobrar</button>`;
        lista.appendChild(div);
    });
}

let html5QrcodeScanner = null;
function inicializarModuloFrequencia() {
    const select = document.getElementById('presenca-aluno');
    select.innerHTML = "";
    session.alunos.forEach(a => select.innerHTML += `<option value="${a.id}">${a.nome}</option>`);

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        html5QrcodeScanner.render(async (decodedText) => {
            const aluno = session.alunos.find(a => a.id === decodedText);
            if (aluno) {
                aluno.frequencia = (aluno.frequencia || 0) + 1;
                const alunoRef = doc(db, "alunos", aluno.id);
                await updateDoc(alunoRef, { frequencia: aluno.frequencia });
                await registrarLogFirestore("Catraca QR", "Entrada Atleta", `${aluno.nome} entrou.`);
                alert(`🥊 BEM-VINDO(A) ${aluno.nome}!`);
                window.firebaseNavegar(3);
            }
        }, (error) => {});
    }
}

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

// Inicializar Sincronismo automático
sincronizarComFirebase();
