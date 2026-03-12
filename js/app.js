// --- NAVEGAÇÃO SPA ---
function switchTab(tabId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- LÓGICA DO FORMATADOR IA (MOTOR ATIVADO) ---
async function formatarRegistro() {
    const btnGenerate = document.querySelector('.btn-ai-generate');
    const outputField = document.getElementById('finalOutput');
    let rascunho = document.getElementById('draftInput').value.trim();

    if (!rascunho) return alert("Cole um texto no rascunho primeiro.");

    btnGenerate.disabled = true;
    btnGenerate.innerHTML = '⏳ Processando na IA...';
    outputField.value = 'Aguarde, conectando ao modelo Gemini...';

    // Lógica de Saudação Local
    const agora = new Date();
    const hora = agora.getHours();
    const minutos = agora.getMinutes();
    const tempoDecimal = hora + (minutos / 100);

    let saudacao = "Boa noite,";
    if (tempoDecimal >= 7.00 && tempoDecimal <= 12.00) saudacao = "Bom dia,";
    else if (tempoDecimal > 12.00 && tempoDecimal <= 19.00) saudacao = "Boa tarde,";

    const prompt = `
        Você é um assistente de comunicação corporativa do Suporte de TI.
        Aprimore o seguinte rascunho de mensagem para o usuário final:
        "${rascunho}"

        Regras estritas:
        1. Corrija a gramática e deixe o tom profissional e educado.
        2. NÃO inicie com saudações (exclua qualquer olá, bom dia, boa tarde).
        3. NÃO adicione assinaturas ou despedidas no final.
        4. Retorne APENAS o corpo principal da mensagem corrigida.
    `;

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) throw new Error(`Erro na API: ${response.status}`);

        const data = await response.json();
        const textoAprimoradoIA = data.text.trim();
        const assinatura = "\n\nQualquer dúvida ficamos à disposição para auxiliar!\n- Suporte TI Lebes\n\nContato: 51 3499 7015";

        outputField.value = `${saudacao}\n\n${textoAprimoradoIA}${assinatura}`;

    } catch (error) {
        console.error('Erro de Integração IA:', error);
        outputField.value = "ERRO: Não foi possível conectar à IA.\nVerifique se o sistema está rodando no Netlify com a chave configurada.";
    } finally {
        btnGenerate.disabled = false;
        btnGenerate.innerHTML = '<span style="margin-right: 5px;">🪄</span> Aplicar Padrão Lebes';
    }
}

function copiarAprimorado() {
    const texto = document.getElementById('finalOutput').value;
    if (!texto || texto.startsWith("ERRO") || texto.startsWith("Aguarde")) return;

    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById('btnCopyAi');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copiado!';
        btn.style.backgroundColor = 'var(--success-color)';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.backgroundColor = 'var(--accent-color)';
        }, 1500);
    });
}

// --- LÓGICA DO BUFFER ---
const form = document.getElementById('ticketForm');
const tableBody = document.getElementById('tableBody');
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];

const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerText = '☀️';
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    themeToggle.innerText = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('theme', theme);
});

const enterSequence = ['filial', 'problema', 'solucao', 'pdv', 'btnSalvar'];
form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const currentId = document.activeElement.id;
        const currentIndex = enterSequence.indexOf(currentId);
        if (currentIndex !== -1) {
            if (currentIndex === enterSequence.length - 1) form.dispatchEvent(new Event('submit'));
            else document.getElementById(enterSequence[currentIndex + 1]).focus();
        }
    }
});

function applyTemplate(problemaText, solucaoText) {
    document.getElementById('problema').value = problemaText;
    document.getElementById('solucao').value = solucaoText;
    const bgColor = document.body.classList.contains('dark-mode') ? '#1a3c28' : '#d4edda';
    document.getElementById('problema').style.backgroundColor = bgColor;
    document.getElementById('solucao').style.backgroundColor = bgColor;
    setTimeout(() => {
        document.getElementById('problema').style.backgroundColor = '';
        document.getElementById('solucao').style.backgroundColor = '';
    }, 400);
    document.getElementById('filial').focus();
}

function updateDashboard() {
    document.getElementById('countTotal').innerText = tickets.length;
    document.getElementById('countChat').innerText = tickets.filter(t => t.acionamento === 'WhatsApp').length;
    document.getElementById('countFone').innerText = tickets.filter(t => t.acionamento === 'Telefone').length;
}

function renderTable() {
    tableBody.innerHTML = '';
    tickets.forEach((ticket, index) => {
        const tr = document.createElement('tr');
        if (ticket.registrado) tr.classList.add('registrado');
        const statusBadge = ticket.registrado ? '<span class="status-badge status-ok">OK</span>' : '<span class="status-badge status-pendente">Pendente</span>';

        tr.innerHTML = `
            <td style="font-weight: bold;">${ticket.filial}</td>
            <td>${ticket.acionamento}</td>
            <td class="editable-cell problema-cell" data-index="${index}" data-field="problema" contenteditable="true" title="Clique para editar">${ticket.problema}</td>
            <td class="editable-cell" data-index="${index}" data-field="solucao" contenteditable="true" title="Clique para editar">${ticket.solucao || ''}</td>
            <td class="editable-cell" data-index="${index}" data-field="pdv" contenteditable="true" title="Clique para editar">${ticket.pdv || ''}</td>
            <td style="text-align: center;">${statusBadge}</td>
            <td class="actions-cell">
                <button class="btn-action btn-copy" onclick="copyToClipboard(${index})">Copiar</button>
                <button class="btn-action btn-ok" onclick="toggleStatus(${index})">✓</button>
                <button class="btn-action btn-delete" onclick="deleteTicket(${index})">✕</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    updateDashboard();
}

tableBody.addEventListener('focusout', function (e) {
    if (e.target.classList.contains('editable-cell')) {
        const index = e.target.getAttribute('data-index');
        const field = e.target.getAttribute('data-field');
        const newValue = e.target.innerText.trim();

        if (tickets[index][field] !== newValue) {
            tickets[index][field] = newValue;
            localStorage.setItem('tickets', JSON.stringify(tickets));
        }
    }
});

tableBody.addEventListener('keydown', function (e) {
    if (e.target.classList.contains('editable-cell') && e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();

        const originalBg = e.target.style.backgroundColor;
        e.target.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#1a3c28' : '#d4edda';
        setTimeout(() => {
            e.target.style.backgroundColor = originalBg;
            renderTable();
        }, 300);
    }
});

// --- MÁSCARAS DE DIGITAÇÃO ---
// Bloqueia letras e aceita apenas números em tempo real
document.getElementById('filial').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, ''); 
});

document.getElementById('pdv').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, ''); 
    // Limpa o estado de erro assim que o usuário volta a digitar
    this.classList.remove('input-error');
    const tooltip = document.getElementById('pdv-error-tooltip');
    if(tooltip) tooltip.style.display = 'none';
});

// --- SALVAMENTO COM VALIDAÇÃO ---
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const pdvInput = document.getElementById('pdv');
    const pdvValor = pdvInput.value;
    const tooltipIcon = document.getElementById('pdv-error-tooltip');

    // Nova Trava Visual de segurança do PDV (Substitui o alert)
    if (pdvValor !== "" && pdvValor.length !== 2) {
        pdvInput.classList.add('input-error', 'shake');
        if(tooltipIcon) tooltipIcon.style.display = 'block';
        
        // Remove a classe de tremor após a animação, para poder tremer de novo se errar 2x
        setTimeout(() => {
            pdvInput.classList.remove('shake');
        }, 500);

        pdvInput.focus();
        return; // Interrompe o código aqui
    }

    // Se passou na validação, garante que está sem erro visual
    pdvInput.classList.remove('input-error');
    if(tooltipIcon) tooltipIcon.style.display = 'none';

    tickets.unshift({
        filial: document.getElementById('filial').value,
        acionamento: document.getElementById('acionamento').value,
        pdv: pdvValor,
        problema: document.getElementById('problema').value,
        solucao: document.getElementById('solucao').value,
        registrado: false
    });
    
    localStorage.setItem('tickets', JSON.stringify(tickets));
    renderTable();
    form.reset();
    document.getElementById('filial').focus();
});

function copyToClipboard(index) {
    const t = tickets[index];
    let parts = [`[Filial: ${t.filial}]`, `Origem: ${t.acionamento}`];
    if (t.pdv && t.pdv.trim() !== '') parts.push(`PDV: ${t.pdv.trim()}`);
    parts.push(`Problema: ${t.problema.trim()}`);
    if (t.solucao && t.solucao.trim() !== '') parts.push(`Solução: ${t.solucao.trim()}`);

    navigator.clipboard.writeText("Atendimento - " + parts.join(' | ')).then(() => {
        const btn = document.querySelectorAll('.btn-copy')[index];
        const originalText = btn.innerText;
        btn.innerText = 'Copiado!';
        btn.style.backgroundColor = '#27ae60';
        setTimeout(() => { btn.innerText = originalText; btn.style.backgroundColor = ''; }, 1500);
    });
}

function toggleStatus(index) {
    tickets[index].registrado = !tickets[index].registrado;
    localStorage.setItem('tickets', JSON.stringify(tickets));
    renderTable();
}

function deleteTicket(index) {
    if (confirm('Tem certeza que deseja excluir este rascunho?')) {
        tickets.splice(index, 1);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        renderTable();
    }
}

function clearAll() {
    if (tickets.length === 0) return alert("Não há registros para limpar.");
    if (confirm("ATENÇÃO: Isso vai apagar TODOS os registros desta tela.\n\nTem certeza?") && confirm("Última confirmação: Você já passou todos esses chamados para o sistema oficial da empresa?")) {
        tickets = [];
        localStorage.removeItem('tickets');
        renderTable();
    }
}

function exportToCSV() {
    if (tickets.length === 0) return alert("Não existem registos para exportar.");
    const csvRows = ['Filial;Origem;Problema;Solução;PDV;Status'];
    tickets.forEach(t => {
        csvRows.push([
            `"${t.filial}"`, `"${t.acionamento}"`, `"${(t.problema || '').replace(/"/g, '""')}"`,
            `"${(t.solucao || '').replace(/"/g, '""')}"`, `"${(t.pdv || '').replace(/"/g, '""')}"`, `"${t.registrado ? 'OK' : 'Pendente'}"`
        ].join(';'));
    });
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_atendimentos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicializa a tabela
renderTable();

// --- LÓGICA DO RODAPÉ (VERSÍCULOS) ---
const versiculos = [
    '"Tudo posso naquele que me fortalece." - Filipenses 4:13',
    '"O Senhor é o meu pastor; nada me faltará." - Salmos 23:1',
    '"Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo." - Salmos 23:4',
    '"Entrega o teu caminho ao Senhor; confia nele, e ele o fará." - Salmos 37:5',
    '"O choro pode durar uma noite, mas a alegria vem pela manhã." - Salmos 30:5',
    '"Mas os que esperam no Senhor renovarão as suas forças." - Isaías 40:31',
    '"Assim, permanecem agora estes três: a fé, a esperança e o amor. O maior deles, porém, é o amor" - Isaías 40:31',
    '"Quem não ama não conhece a Deus, porque Deus é amor." - 1 João 4:8',
    '"Dou graças a Cristo Jesus, nosso Senhor, que me deu forças e me considerou fiel, designando-me para o ministério" - 1 Timóteo 1:12',
    '"Busquem, pois, em primeiro lugar o Reino de Deus e a sua justiça, e todas essas coisas serão acrescentadas a vocês." - Mateus 6:33',
    '"Tão certo como eu vivo, diz o Senhor, toda joelho se dobrará diante de mim; toda língua confessará a Deus   " - Isaías 45:23',
    '"Não vivam como vivem as pessoas deste mundo, mas deixem que Deus os transforme por meio de uma completa mudança da mente de vocês. Assim vocês conhecerão a vontade de Deus, isto é, aquilo que é bom, perfeito e agradável a ele" - Romanos 12:2',
    '"Quem não ama não conhece a Deus, porque Deus é amor." - 1 João 4:8',
    '"Mil poderão cair ao teu lado, e dez mil à tua direita, mas tu não serás atingido" - Salmos 91:7',
    '"Eu sou o caminho, a verdade e a vida; ninguém vem ao Pai senão por mim" - João 14:6',
    '"No mundo tereis aflições, mas tende bom ânimo; eu venci o mundo" - João 16:33',
    '"Lancem sobre Ele toda a sua ansiedade, porque ele tem cuidado de vocês" - 1 Pedro 5:7',
    '"Não fui eu que ordenei a você? Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar." - Josué 1:9'
];

function atualizarVersiculo() {
    const verseElement = document.getElementById('bible-verse');
    if (!verseElement) return; // Garante que a página carregou a tag HTML
    
    const agora = Date.now();
    const duasHorasEmMilisegundos = 2 * 60 * 60 * 1000; // 2 horas de trava

    // Busca na memória do navegador se já tem um versículo salvo e a validade dele
    let versiculoSalvo = localStorage.getItem('currentVerse');
    let validade = localStorage.getItem('verseExpiration');

    // Se não tiver versículo, ou se a validade (2h) já expirou, sorteia um novo
    if (!versiculoSalvo || !validade || agora > validade) {
        const randomIndex = Math.floor(Math.random() * versiculos.length);
        versiculoSalvo = versiculos[randomIndex];

        // Salva o novo versículo e define a próxima troca para daqui a 2 horas
        localStorage.setItem('currentVerse', versiculoSalvo);
        localStorage.setItem('verseExpiration', agora + duasHorasEmMilisegundos);
    }

    // Escreve na tela
    verseElement.innerText = versiculoSalvo;
}

// Inicia a função assim que a página carrega
atualizarVersiculo();