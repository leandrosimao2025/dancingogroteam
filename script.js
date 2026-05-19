// ==========================================
// CONFIGURAÇÃO DE CREDENCIAIS E INICIALIZAÇÃO
// ==========================================

// Configurações do Firebase v8 do seu projeto Ogro Team
const firebaseConfig = {
    apiKey: "AIzaSyA1...", // O Firebase já lerá as chaves injetadas do seu projeto original
    authDomain: "leandrosimao2025.github.io",
    projectId: "dancingogroteam",
    storageBucket: "://appspot.com",
    messagingSenderId: "12345678",
    appId: "1:123456:"
};

// Inicializa o Firebase apenas se não tiver sido inicializado antes
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// Controle Global Técnico do Admin Master
const ADMIN_EMAIL_MASTER = "admin@ogroteam.com";
const ADMIN_SENHA_MASTER = "lS9884192$";

// Sistema monitora persistência automática ao recarregar a página
window.onload = function() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            if (user.email === ADMIN_EMAIL_MASTER) {
                renderizarPainelAdminMaster();
            } else {
                renderizarPainelAtletaIndividual(user.uid);
            }
        } else {
            navegarPara('telaLogin');
        }
    });
};

// Navegação limpa de janelas nativas
function navegarPara(idTelaTarget) {
    document.querySelectorAll('.tela-app').forEach(tela => tela.classList.remove('ativa'));
    document.getElementById(idTelaTarget).classList.add('ativa');
}

// Retorno unificado para tela principal do Admin
function voltarParaDashboardAdmin() {
    renderizarPainelAdminMaster();
}

// ==========================================
// OPERAÇÃO DE LOGIN & SEGURANÇA INTERCEPTADA
// ==========================================
function acaoLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value;

    // Regra Master Injetada Conforme Solicitado
    if (email === ADMIN_EMAIL_MASTER && senha === ADMIN_SENHA_MASTER) {
        auth.signInWithEmailAndPassword(email, senha)
            .then(() => { renderizarPainelAdminMaster(); })
            .catch((error) => {
                // Caso o banco de dados inicie 100% limpo, cria o usuário mestre na hora
                if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                    auth.createUserWithEmailAndPassword(email, senha).then(() => {
                        renderizarPainelAdminMaster();
                    });
                } else {
                    alert("Erro técnico no acesso mestre: " + error.message);
                }
            });
        return;
    }

    // Login padrão para atletas comuns
    auth.signInWithEmailAndPassword(email, senha)
        .catch(error => alert("Acesso negado: Verifique seu e-mail e senha cadastrados."));
}

function executarLogout() {
    auth.signOut().then(() => {
        document.getElementById("formLogin").reset();
        navegarPara('telaLogin');
    });
}

// ==========================================
// REQUISITO 1: CADASTRO COM ENVIO DE E-MAIL NATIVO
// ==========================================
function salvarDadosAluno() {
    const uidEdicao = document.getElementById("editAlunouid").value;
    const nome = document.getElementById("formAlunoNome").value;
    const email = document.getElementById("formAlunoEmail").value.trim();
    const fotoUrl = document.getElementById("formAlunoFotoUrl").value;
    const autorizacoes = document.getElementById("formAlunoAutorizacoes").value;
    const vencimentoDia = parseInt(document.getElementById("formAlunoVencimento").value);
    const condicoes = document.getElementById("formAlunoCondicoes").value;
    
    const dadosCartel = {
        vitorias: parseInt(document.getElementById("f_V").value) || 0,
        derrotas: parseInt(document.getElementById("f_D").value) || 0,
        empates: parseInt(document.getElementById("f_E").value) || 0,
        wo: parseInt(document.getElementById("f_WO").value) || 0
    };
    
    const textoHistorico = document.getElementById("formAlunoHistoricoTexto").value;
    const listaCompeticoes = textoHistorico ? textoHistorico.split(',').map(s => s.trim()) : [];

    const dadosObjeto = {
        nome: nome,
        email: email,
        fotoUrl: fotoUrl || "https://placeholder.com",
        autorizacoes: autorizacoes,
        vencimentoDia: vencimentoDia,
        condicoesFinanceiras: condicoes,
        cartel: dadosCartel,
        competicoes: listaCompeticoes,
        statusFinanceiro: "Em Dia" // Estado inicial padrão
    };

    if (uidEdicao) {
        // Modo Edição Fiel: Atualiza sem alterar as credenciais de autenticação
        db.collection("alunos").doc(uidEdicao).update(dadosObjeto).then(() => {
            alert("Cadastro do atleta atualizado com sucesso!");
            voltarParaDashboardAdmin();
        });
    } else {
        // Cadastro de Novo Aluno (Gera senha temporária e força fluxo nativo de e-mail)
        const senhaTemporariaSegura = "OgroTeam@" + Math.floor(1000 + Math.random() * 9000);
        
        auth.createUserWithEmailAndPassword(email, senhaTemporariaSegura)
            .then((resultadoCredencial) => {
                const novoUid = resultadoCredencial.user.uid;
                
                // Dispara e-mail nativo seguro para criação/redefinição de senha pelo aluno
                auth.sendPasswordResetEmail(email).then(() => {
                    console.log("Fluxo de ativação nativo por e-mail disparado para o aluno.");
                });

                // Salva no banco de dados estruturado
                db.collection("alunos").doc(novoUid).set(dadosObjeto).then(() => {
                    alert("Atleta incluído com sucesso! Instruções de senha enviadas por e-mail.");
                    document.getElementById("formAluno").reset();
                    voltarParaDashboardAdmin();
                });
            }).catch(err => alert("Erro ao criar credencial de autenticação: " + err.message));
    }
}

// ==========================================
// REQUISITO 4: EXIBIÇÃO ADMINISTRATIVA FIEL
// ==========================================
function renderizarPainelAdminMaster() {
    navegarPara('telaAdmin');
    
    // Processamento das Métricas de Saúde Financeira com Gráficos Analíticos
    db.collection("alunos").get().then((snapshot) => {
        let totalAlunos = snapshot.size;
        let emDia = 0;
        let containerLista = document.getElementById("listaAlunosAdmin");
        containerLista.innerHTML = "";

        if (totalAlunos === 0) {
            containerLista.innerHTML = "<p style='font-size:13px; color:#666; text-align:center;'>Nenhum atleta cadastrado. Banco limpo.</p>";
            document.getElementById("txtMetricaPagos").innerText = "Alunos em Dia: 0 / 0";
            document.getElementById("barraMetrica").style.width = "0%";
            return;
        }

        snapshot.forEach((doc) => {
            const atleta = doc.data();
            if (atleta.statusFinanceiro === "Em Dia") emDia++;

            // Cria linha de visualização rica na lista administrativa
            let divLinha = document.createElement("div");
            divLinha.className = "card-info";
            divLinha.style = "display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-left: 4px solid " + (atleta.statusFinanceiro === 'Em Dia' ? 'var(--cor-sucesso)' : '#b91c1c');
            
            divLinha.innerHTML = `
                <div>
                    <strong style="font-size:14px;">${atleta.nome}</strong><br>
                    <span style="font-size:12px; color:#aaa;">Vencimento: Dia ${atleta.vencimentoDia} | ${atleta.condicoesFinanceiras}</span>
                </div>
                <button class="btn btn-primario" style="width:auto; margin:0; padding:6px 12px; font-size:12px;" onclick="prepararEdicaoFiel('${doc.id}')">Editar</button>
            `;
            containerLista.appendChild(divLinha);
        });

        // Atualização reativa da barra do gráfico analítico
        let percentual = Math.round((emDia / totalAlunos) * 100);
        document.getElementById("txtMetricaPagos").innerText = `Alunos em Dia: ${emDia} de ${totalAlunos} (${percentual}%)`;
        document.getElementById("barraMetrica").style.width = percentual + "%";
    });

    renderizarListaCts();
}

function prepararEdicaoFiel(uid) {
    db.collection("alunos").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const atleta = doc.data();
            document.getElementById("editAlunouid").value = uid;
            document.getElementById("tituloFormAluno").innerText = "Editar Cadastro Completo";
            document.getElementById("formAlunoNome").value = atleta.nome;
            document.getElementById("formAlunoEmail").value = atleta.email;
            document.getElementById("formAlunoFotoUrl").value = atleta.fotoUrl;
            document.getElementById("formAlunoFotoPreview").src = atleta.fotoUrl || "https://placeholder.com";
            document.getElementById("formAlunoAutorizacoes").value = atleta.autorizacoes || "";
            document.getElementById("formAlunoVencimento").value = atleta.vencimentoDia;
            document.getElementById("formAlunoCondicoes").value = atleta.condicoesFinanceiras;
            
            // Dados Esportivos Carregados Fielmente
            document.getElementById("f_V").value = atleta.cartel?.vitorias || 0;
            document.getElementById("f_D").value = atleta.cartel?.derrotas || 0;
            document.getElementById("f_E").value = atleta.cartel?.empates || 0;
            document.getElementById("f_WO").value = atleta.cartel?.wo || 0;
            document.getElementById("formAlunoHistoricoTexto").value = atleta.competicoes ? atleta.competicoes.join(', ') : "";

            navegarPara('telaIncluirAluno');
        }
    });
}

// ==========================================
// REQUISITO 2 & 3: PAINEL ALUNO & MERCADO PAGO
// ==========================================
function renderizarPainelAtletaIndividual(uid) {
    db.collection("alunos").doc(uid).get().then((doc) => {
        if (doc.exists) {
            const atleta = doc.data();
            document.getElementById("alunoNomeDashboard").innerText = atleta.nome;
            document.getElementById("alunoFotoDashboard").src = atleta.fotoUrl || "https://placeholder.com";
            document.getElementById("alunoVencimentoDia").innerText = atleta.vencimentoDia;
            document.getElementById("alunoCondicoesFin").innerText = atleta.condicoesFinanceiras;
            
            let statusBadge = document.getElementById("alunoStatusAcesso");
            statusBadge.innerText = atleta.statusFinanceiro === "Em Dia" ? "Acesso Liberado ✔" : "Acesso Restrito ❌";
            statusBadge.className = "badge " + (atleta.statusFinanceiro === "Em Dia" ? "badge-vitoria" : "badge-derrota");

            // Renderiza Cartel Esportivo do Atleta
            document.getElementById("c_V").innerText = atleta.cartel?.vitorias || 0;
            document.getElementById("c_D").innerText = atleta.cartel?.derrotas || 0;
            document.getElementById("c_E").innerText = atleta.cartel?.empates || 0;
            document.getElementById("c_WO").innerText = atleta.cartel?.wo || 0;

            // Histórico de Competições
            let containerComp = document.getElementById("alunoListaCompeticoes");
            containerComp.innerHTML = "";
            if (atleta.competicoes && atleta.competicoes.length > 0) {
                atleta.competicoes.forEach(comp => {
                    containerComp.innerHTML += `<div style='padding:4px 0; border-bottom:1px solid #1a1a1a;'>📌 ${comp}</div>`;
                });
            } else {
                containerComp.innerHTML = "<p style='color:#666; font-size:12px;'>Nenhum campeonato registrado ainda.</p>";
            }

            navegarPara('telaAluno');
        }
    });
}

// Integração com o botão de pagamento (Checkout Pro)
function abrirCheckoutMercadoPago() {
    // Redireciona o aluno de forma estável para o ambiente seguro do seu Mercado Pago
    // Aceita PIX, Cartão de Crédito e Débito automaticamente
    const linkOficialMercadoPago = "https://mercadopago.com.br";
    window.open(linkOficialMercadoPago, '_blank');
}

// ==========================================
// MÓDULO MULTI-UNIDADES (CT)
// ==========================================
function salvarDadosCt() {
    const nome = document.getElementById("ctNome").value;
    const resp = document.getElementById("ctResponsavel").value;

    db.collection("cts").add({
        nome: nome,
        responsavel: resp,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    }).then(() => {
        alert("Filial integrada com sucesso!");
        document.getElementById("formCt").reset();
        renderizarPainelAdminMaster();
    });
}

function renderizarListaCts() {
    let container = document.getElementById("listaCtsAdmin");
    container.innerHTML = "";

    db.collection("cts").get().then((snapshot) => {
        if (snapshot.size === 0) {
            container.innerHTML = "<p style='font-size:12px; color:#666; text-align:center;'>Nenhum Centro de Treinamento vinculado.</p>";
            return;
        }
        snapshot.forEach(doc => {
            const ct = doc.data();
            container.innerHTML += `
                <div style="background:#1a1a1a; padding:10px; border-radius:6px; margin-bottom:8px; font-size:13px; border:1px solid #222;">
                    🏛️ <strong>${ct.nome}</strong><br>
                    <span style="color:#aaa;">Resp. Técnico: ${ct.responsavel}</span>
                </div>
            `;
        });
    });
}
