const { jsPDF } = window.jspdf;

// Dados globais
let dados = {
    vendas: [],
    vendedores: [],
    servicos: [],
    empresasParceiras: [],
    feedbacks: [],
    metas: []
};

// Variáveis de controle de paginação
let paginaAtualVendedores = 1;
let paginaAtualServicos = 1;
let paginaAtualEmpresas = 1;
let paginaAtualVendas = 1;
const itensPorPagina = 5;

// Gráficos globais
let vendasServicoChart, desempenhoVendedoresChart, vendasCategoriaChart, tendenciasSazonaisChart, rentabilidadeServicoChart;

// Função para alternar entre as abas
function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(button => button.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
}

// Função para carregar dados iniciais (mock)
function carregarDadosIniciais() {
    dados.vendedores = [
        { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-9999' },
        { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 88888-8888' },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 77777-7777' }
    ];
    dados.servicos = [
        { id: 1, nome: 'Consultoria', categoria: 'Serviços Profissionais', tipoComissao: 'fixa' },
        { id: 2, nome: 'Treinamento', categoria: 'Educação', tipoComissao: 'porcentagem' },
        { id: 3, nome: 'Suporte Técnico', categoria: 'TI', tipoComissao: 'porcentagem' }
    ];
    dados.empresasParceiras = [
        { id: 1, nome: 'Empresa A' },
        { id: 2, nome: 'Empresa B' },
        { id: 3, nome: 'Empresa C' }
    ];
}

// Função para salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('dadosVendas', JSON.stringify(dados));
}

// Função para carregar dados do localStorage
function carregarDados() {
    const dadosSalvos = localStorage.getItem('dadosVendas');
    if (dadosSalvos) {
        dados = JSON.parse(dadosSalvos);
    }
}

// Função para preencher o seletor de anos
function preencherAnos() {
    const selectAno = document.getElementById('anoFiltro');
    if (!selectAno) {
        console.error('Elemento com id="anoFiltro" não encontrado!');
        return;
    }
    selectAno.innerHTML = ''; // Limpa as opções existentes

    const anoAtual = new Date().getFullYear();
    let anosUnicos = [anoAtual]; // Inicializa com o ano atual

    if (dados.vendas.length > 0) {
        const anosVendas = dados.vendas.map(venda => {
            const [dia, mes, ano] = venda.data.split('/').map(Number);
            return ano;
        });
        anosUnicos = [...new Set([...anosUnicos, ...anosVendas])];
    }

    anosUnicos.sort((a, b) => b - a);

    anosUnicos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    });

    selectAno.value = anoAtual;
}

// Função para atualizar o dashboard
function atualizarDashboard() {
    const mesSelecionado = parseInt(document.getElementById('mesFiltro').value);
    const anoSelecionado = parseInt(document.getElementById('anoFiltro').value);

    const vendasFiltradas = dados.vendas.filter(venda => {
        const [dia, mes, ano] = venda.data.split('/').map(Number);
        return mes === mesSelecionado + 1 && ano === anoSelecionado;
    });

    atualizarGraficos(vendasFiltradas);

    const totalVendas = vendasFiltradas.reduce((total, venda) => total + venda.valorVenda, 0);
    const totalComissoes = vendasFiltradas.reduce((total, venda) => total + venda.comissao, 0);
    const totalClientes = [...new Set(vendasFiltradas.map(venda => venda.nomeCliente))].length;
    const ticketMedio = vendasFiltradas.length > 0 ? totalVendas / vendasFiltradas.length : 0;

    document.getElementById('totalVendasDash').textContent = totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalComissoesDash').textContent = totalComissoes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalClientes').textContent = totalClientes;
    document.getElementById('ticketMedio').textContent = ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Chamar função de retenção de clientes
    calcularRetencaoClientes();
}

// Função para inicializar os gráficos
function inicializarGraficos() {
    const ctxVendasServico = document.getElementById('vendasServicoChart').getContext('2d');
    const ctxDesempenhoVendedores = document.getElementById('desempenhoVendedoresChart').getContext('2d');
    const ctxVendasCategoria = document.getElementById('vendasCategoriaChart').getContext('2d');
    const ctxTendenciasSazonais = document.getElementById('tendenciasSazonaisChart').getContext('2d');

    vendasServicoChart = new Chart(ctxVendasServico, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Vendas',
                data: [],
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });

    desempenhoVendedoresChart = new Chart(ctxDesempenhoVendedores, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Vendas',
                data: [],
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });

    vendasCategoriaChart = new Chart(ctxVendasCategoria, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                label: 'Vendas',
                data: [],
                backgroundColor: ['rgba(79, 70, 229, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });

    tendenciasSazonaisChart = new Chart(ctxTendenciasSazonais, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
                label: 'Vendas por Mês',
                data: Array(12).fill(0),
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });

    atualizarDashboard();
}

// Função para atualizar os gráficos
function atualizarGraficos(vendasFiltradas) {
    const servicos = [...new Set(dados.servicos.map(servico => servico.nome))];
    const vendasPorServico = servicos.map(servico => {
        return vendasFiltradas.filter(venda => venda.servico === servico).reduce((total, venda) => total + venda.valorVenda, 0);
    });

    vendasServicoChart.data.labels = servicos;
    vendasServicoChart.data.datasets[0].data = vendasPorServico;
    vendasServicoChart.update();

    const vendedores = [...new Set(dados.vendedores.map(vendedor => vendedor.nome))];
    const vendasPorVendedor = vendedores.map(vendedor => {
        return vendasFiltradas.filter(venda => venda.vendedor === vendedor).reduce((total, venda) => total + venda.valorVenda, 0);
    });

    desempenhoVendedoresChart.data.labels = vendedores;
    desempenhoVendedoresChart.data.datasets[0].data = vendasPorVendedor;
    desempenhoVendedoresChart.update();

    const categorias = [...new Set(dados.servicos.map(servico => servico.categoria))];
    const vendasPorCategoria = categorias.map(categoria => {
        return vendasFiltradas.filter(venda => dados.servicos.find(servico => servico.nome === venda.servico).categoria === categoria).reduce((total, venda) => total + venda.valorVenda, 0);
    });

    vendasCategoriaChart.data.labels = categorias;
    vendasCategoriaChart.data.datasets[0].data = vendasPorCategoria;
    vendasCategoriaChart.update();

    const vendasPorMes = Array(12).fill(0);
    dados.vendas.forEach(venda => {
        const [dia, mes] = venda.data.split('/').map(Number);
        vendasPorMes[mes - 1] += venda.valorVenda;
    });

    tendenciasSazonaisChart.data.datasets[0].data = vendasPorMes;
    tendenciasSazonaisChart.update();
}

// Função para formatar a data no input
function formatarDataInput(input) {
    let valor = input.value;
    if (valor.includes('-')) {
        const [ano, mes, dia] = valor.split('-');
        input.value = `${dia}/${mes}/${ano}`;
    } else {
        valor = valor.replace(/\D/g, '');
        if (valor.length > 2) {
            valor = valor.replace(/^(\d{2})(\d{0,2})/, '$1/$2');
        }
        if (valor.length > 5) {
            valor = valor.replace(/^(\d{2})\/(\d{2})(\d{0,4})/, '$1/$2/$3');
        }
        input.value = valor;
    }
}

// Função para formatar número de telefone
function formatarTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = valor.slice(0, 11);
    if (valor.length > 2) {
        valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
    }
    if (valor.length > 9) {
        valor = `${valor.slice(0, 9)}-${valor.slice(9)}`;
    }
    input.value = valor;
}

// Função para atualizar as opções de vendedores no formulário de vendas
function atualizarOpcoesVendedores() {
    const selectVendedor = document.getElementById('vendedorVenda');
    selectVendedor.innerHTML = '<option value="">Selecione um vendedor</option>';
    dados.vendedores.forEach(vendedor => {
        const option = document.createElement('option');
        option.value = vendedor.id;
        option.textContent = vendedor.nome;
        selectVendedor.appendChild(option);
    });
}

// Função para atualizar as opções de serviços no formulário de vendas
function atualizarOpcoesServicos() {
    const selectServico = document.getElementById('servicoVenda');
    selectServico.innerHTML = '<option value="">Selecione um serviço</option>';
    dados.servicos.forEach(servico => {
        const option = document.createElement('option');
        option.value = servico.id;
        option.textContent = servico.nome;
        selectServico.appendChild(option);
    });
}

// Função para atualizar as opções de empresas no formulário de vendas
function atualizarOpcoesEmpresas() {
    const selectEmpresa = document.getElementById('empresaParceira');
    selectEmpresa.innerHTML = '<option value="">Selecione uma empresa parceira</option>';
    dados.empresasParceiras.forEach(empresa => {
        const option = document.createElement('option');
        option.value = empresa.id;
        option.textContent = empresa.nome;
        selectEmpresa.appendChild(option);
    });
}

// Função para atualizar o tipo de comissão ao selecionar um serviço
function atualizarTipoComissao() {
    const servicoId = document.getElementById('servicoVenda').value;
    const servico = dados.servicos.find(s => s.id == servicoId);
    const tipoComissaoInfo = document.getElementById('tipoComissaoInfo');
    const comissaoInput = document.getElementById('comissao');

    if (servico) {
        tipoComissaoInfo.textContent = `Tipo de Comissão: ${servico.tipoComissao}`;
        if (servico.tipoComissao === 'fixa') {
            comissaoInput.placeholder = 'R$ 0,00';
            comissaoInput.oninput = function () { formatarMoeda(this); };
        } else if (servico.tipoComissao === 'porcentagem') {
            comissaoInput.placeholder = '0,00%';
            comissaoInput.oninput = function () { formatarPorcentagem(this); };
        }
    } else {
        tipoComissaoInfo.textContent = '';
        comissaoInput.placeholder = '0,00';
        comissaoInput.oninput = null;
    }
}

// Função para formatar o valor da comissão como moeda
function formatarMoeda(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não for número
    valor = (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    input.value = valor;
}

// Função para formatar o valor da comissão como porcentagem
function formatarPorcentagem(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não for número
    valor = (Number(valor) / 100).toFixed(2) + '%';
    input.value = valor;
}

// Função para registrar venda
document.getElementById('vendaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    // Converter a data de YYYY-MM-DD para DD/MM/YYYY
    let dataVenda = document.getElementById('dataVenda').value;
    if (dataVenda.includes('-')) {
        const [ano, mes, dia] = dataVenda.split('-');
        dataVenda = `${dia}/${mes}/${ano}`;
    }
    const vendedorId = document.getElementById('vendedorVenda').value;
    const servicoId = document.getElementById('servicoVenda').value;
    const nomeCliente = document.getElementById('nomeCliente').value;
    const empresaParceiraId = document.getElementById('empresaParceira').value;
    const valorVenda = parseFloat(document.getElementById('valorVenda').value.replace(/[^0-9,]/g, '').replace(',', '.'));
    const valorReceber = parseFloat(document.getElementById('valorReceber').value.replace(/[^0-9,]/g, '').replace(',', '.'));
    const comissao = parseFloat(document.getElementById('comissao').value.replace(/[^0-9,]/g, '').replace(',', '.'));
    const vendedor = dados.vendedores.find(v => v.id == vendedorId);
    const servico = dados.servicos.find(s => s.id == servicoId);
    const empresaParceira = dados.empresasParceiras.find(e => e.id == empresaParceiraId);

    if (!vendedor || !servico || !empresaParceira) {
        alert('Por favor, selecione um vendedor, serviço e empresa parceira válidos.');
        return;
    }

    const novaVenda = {
        id: dados.vendas.length + 1,
        vendedor: vendedor.nome,
        servico: servico.nome,
        data: dataVenda,
        nomeCliente: nomeCliente,
        empresaParceira: empresaParceira.nome,
        valorVenda: valorVenda,
        valorReceber: valorReceber,
        comissao: comissao,
        tipoComissao: servico.tipoComissao
    };

    dados.vendas.push(novaVenda);
    salvarDados(); // Salva os dados no localStorage
    alert('Venda registrada com sucesso!');
    limparCamposVenda();
    // Atualizar tudo que depende dos dados de vendas
    preencherAnos();
    atualizarDashboard();
    listarVendas();
});

// Função para limpar os campos do formulário de venda
function limparCamposVenda() {
    document.getElementById('vendedorVenda').value = '';
    document.getElementById('servicoVenda').value = '';
    document.getElementById('dataVenda').value = '';
    document.getElementById('nomeCliente').value = '';
    document.getElementById('empresaParceira').value = '';
    document.getElementById('valorVenda').value = '';
    document.getElementById('valorReceber').value = '';
    document.getElementById('comissao').value = '';
    document.getElementById('tipoComissaoInfo').textContent = '';
}

// Função para listar as vendas
function listarVendas(vendas = dados.vendas) {
    const tbody = document.querySelector('#tabelaVendas tbody');
    tbody.innerHTML = '';
    const itensPorPagina = parseInt(document.getElementById('itensPorPaginaVendas').value);
    const inicio = (paginaAtualVendas - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const vendasPaginadas = vendas.slice(inicio, fim);

    vendasPaginadas.forEach(venda => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${venda.data}</td>
            <td>${venda.vendedor}</td>
            <td>${venda.servico}</td>
            <td>${venda.nomeCliente}</td>
            <td>${venda.empresaParceira}</td>
            <td>${venda.valorVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${venda.valorReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${venda.comissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>
                <button class="acao-editar" onclick="editarVenda(${venda.id})">Editar</button>
                <button class="acao-excluir" onclick="excluirVenda(${venda.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Atualizar controles de paginação
    const totalPaginas = Math.ceil(vendas.length / itensPorPagina);
    document.getElementById('controlesPaginacaoVendas').innerHTML = `
        <button onclick="mudarPaginaVendas(-1)">Anterior</button>
        Página ${paginaAtualVendas} de ${totalPaginas}
        <button onclick="mudarPaginaVendas(1)">Próxima</button>
    `;
}

// Função para mudar a página de vendas
function mudarPaginaVendas(direcao) {
    const totalPaginas = Math.ceil(dados.vendas.length / parseInt(document.getElementById('itensPorPaginaVendas').value));
    const novaPagina = paginaAtualVendas + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtualVendas = novaPagina;
        listarVendas();
    }
}

// Função para editar uma venda
function editarVenda(id) {
    const venda = dados.vendas.find(v => v.id === id);
    if (!venda) return;

    document.getElementById('vendedorVenda').value = dados.vendedores.find(v => v.nome === venda.vendedor)?.id;
    document.getElementById('servicoVenda').value = dados.servicos.find(s => s.nome === venda.servico)?.id;
    document.getElementById('dataVenda').value = venda.data;
    document.getElementById('nomeCliente').value = venda.nomeCliente;
    document.getElementById('empresaParceira').value = dados.empresasParceiras.find(e => e.nome === venda.empresaParceira)?.id;
    document.getElementById('valorVenda').value = venda.valorVenda;
    document.getElementById('valorReceber').value = venda.valorReceber;
    document.getElementById('comissao').value = venda.comissao;

    // Remove a venda antiga
    dados.vendas = dados.vendas.filter(v => v.id !== id);
    salvarDados();
}

// Função para excluir uma venda
function excluirVenda(id) {
    dados.vendas = dados.vendas.filter(v => v.id !== id);
    salvarDados();
    alert('Venda excluída com sucesso!');
    listarVendas();
}

// Função para exportar relatório em PDF
function exportarRelatorioPDF() {
    const tabelaRelatorio = document.getElementById('tabelaRelatorio');
    const { jsPDF } = window.jspdf;

    // Criar um novo documento PDF
    const doc = new jsPDF();

    // Configurar o título
    doc.setFontSize(18);
    doc.text('Relatório de Vendas', 10, 10);

    // Extrair dados da tabela
    const rows = [];
    tabelaRelatorio.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('th, td').forEach(cell => {
            rowData.push(cell.textContent);
        });
        rows.push(rowData);
    });

    // Adicionar tabela ao PDF
    doc.autoTable({
        head: [rows[0]], // Cabeçalho
        body: rows.slice(1), // Corpo
    });

    // Salvar o PDF
    doc.save('relatorio_vendas.pdf');
}

// Função para exportar relatório em Excel
function exportarRelatorioExcel() {
    const tabelaRelatorio = document.getElementById('tabelaRelatorio');
    const wb = XLSX.utils.table_to_book(tabelaRelatorio, { sheet: "Relatório de Vendas" });
    XLSX.writeFile(wb, 'relatorio_vendas.xlsx');
}

// Função para inicializar o gráfico de rentabilidade por serviço
function inicializarRentabilidadeServicoChart() {
    const ctxRentabilidadeServico = document.getElementById('rentabilidadeServicoChart').getContext('2d');
    rentabilidadeServicoChart = new Chart(ctxRentabilidadeServico, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Rentabilidade',
                data: [],
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });
}

// Atualizar o gráfico com os dados de rentabilidade
function atualizarRentabilidadeServicoChart() {
    const rentabilidadePorServico = {};
    dados.servicos.forEach(servico => {
        const vendasDoServico = dados.vendas.filter(venda => venda.servico === servico.nome);
        const totalVendas = vendasDoServico.reduce((total, venda) => total + venda.valorVenda, 0);
        const custoTotal = vendasDoServico.length * servico.custo; // Supondo que o custo seja fixo por serviço
        rentabilidadePorServico[servico.nome] = totalVendas - custoTotal;
    });

    const servicos = Object.keys(rentabilidadePorServico);
    const valores = Object.values(rentabilidadePorServico);

    rentabilidadeServicoChart.data.labels = servicos;
    rentabilidadeServicoChart.data.datasets[0].data = valores;
    rentabilidadeServicoChart.update();
}

// Função para inicializar o aplicativo
function inicializarAplicativo() {
    carregarDadosIniciais();
    carregarDados();
    showTab('dashboard');
    preencherAnos();
    atualizarOpcoesVendedores();
    atualizarOpcoesServicos();
    atualizarOpcoesEmpresas();
    inicializarGraficos();
    inicializarTendenciasSazonais();
    inicializarRentabilidadeServicoChart(); // Novo gráfico
    atualizarListaVendedores();
    atualizarListaServicos();
    atualizarListaEmpresas();
    atualizarFiltroVendedores(); // Atualiza o filtro de vendedores na aba de relatórios
    atualizarRankingVendedores();
    listarFeedbacks();
    calcularRetencaoClientes(); // Nova funcionalidade
    calcularRentabilidadePorServico(); // Nova funcionalidade
}

// Event Listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarAplicativo);

// Função para alternar o Modo Escuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Aplicar o Modo Escuro salvo no localStorage
document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});

// Função para aplicar personalização do tema
function aplicarPersonalizacao() {
    const fonteSelecionada = document.getElementById('fonteSelecionada').value;
    const layoutSelecionado = document.getElementById('layoutSelecionado').value;

    // Alterar a fonte global
    document.body.style.fontFamily = fonteSelecionada;

    // Alterar o layout
    document.body.className = ''; // Remove todas as classes existentes
    if (layoutSelecionado !== 'default') {
        document.body.classList.add(layoutSelecionado);
    }

    alert('Personalização aplicada com sucesso!');
}

// Função para gerar gráfico de Tendências Sazonais
function gerarTendenciasSazonais() {
    const vendasPorMes = Array(12).fill(0);
    dados.vendas.forEach(venda => {
        const [dia, mes] = venda.data.split('/').map(Number);
        vendasPorMes[mes - 1] += venda.valorVenda;
    });

    tendenciasSazonaisChart.data.datasets[0].data = vendasPorMes;
    tendenciasSazonaisChart.update();
}

// Função para inicializar o gráfico de Tendências Sazonais
function inicializarTendenciasSazonais() {
    const ctxTendenciasSazonais = document.getElementById('tendenciasSazonaisChart').getContext('2d');
    tendenciasSazonaisChart = new Chart(ctxTendenciasSazonais, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
                label: 'Vendas por Mês',
                data: Array(12).fill(0),
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true, mode: 'index', intersect: false },
                legend: { display: true, position: 'bottom' }
            },
            animation: { duration: 1000, easing: 'easeInOutQuad' }
        }
    });

    gerarTendenciasSazonais(); // Atualiza o gráfico com os dados iniciais
}

// Função para comparar períodos
function compararPeriodos() {
    const periodoInicial = document.getElementById('periodoInicial').value;
    const periodoFinal = document.getElementById('periodoFinal').value;

    const vendasPeriodoInicial = dados.vendas.filter(venda => {
        const [anoInicial, mesInicial] = periodoInicial.split('-').map(Number);
        const [anoVenda, mesVenda] = venda.data.split('/').map(Number);
        return anoVenda === anoInicial && mesVenda === mesInicial;
    });

    const vendasPeriodoFinal = dados.vendas.filter(venda => {
        const [anoFinal, mesFinal] = periodoFinal.split('-').map(Number);
        const [anoVenda, mesVenda] = venda.data.split('/').map(Number);
        return anoVenda === anoFinal && mesVenda === mesFinal;
    });

    const totalVendasInicial = vendasPeriodoInicial.reduce((total, venda) => total + venda.valorVenda, 0);
    const totalVendasFinal = vendasPeriodoFinal.reduce((total, venda) => total + venda.valorVenda, 0);

    alert(`Comparativo de Períodos:
    - Total de Vendas no Período Inicial: ${totalVendasInicial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
    - Total de Vendas no Período Final: ${totalVendasFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
}

// Função para enviar feedback de clientes
document.getElementById('feedbackForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const nomeCliente = document.getElementById('nomeClienteFeedback').value;
    const comentario = document.getElementById('comentarioFeedback').value;

    const novoFeedback = {
        id: dados.feedbacks.length + 1,
        nomeCliente: nomeCliente,
        comentario: comentario,
        avaliacao: document.getElementById('avaliacaoFeedback').value, // Positiva/Negativa
        data: new Date().toLocaleDateString('pt-BR')
    };

    dados.feedbacks.push(novoFeedback);
    salvarDados(); // Salva os dados no localStorage
    alert('Feedback enviado com sucesso!');
    limparCamposFeedback();
});

// Função para limpar campos do formulário de feedback
function limparCamposFeedback() {
    document.getElementById('nomeClienteFeedback').value = '';
    document.getElementById('comentarioFeedback').value = '';
}

// Função para listar feedbacks
function listarFeedbacks() {
    const listaFeedbacks = document.getElementById('feedbackList');
    listaFeedbacks.innerHTML = '';
    dados.feedbacks.forEach(feedback => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <strong>${feedback.nomeCliente}</strong>
                <p>${feedback.comentario}</p>
            </div>
        `;
        listaFeedbacks.appendChild(item);
    });
}

function atualizarRankingVendedores() {
    const rankingVendedores = document.getElementById('rankingVendedores');
    rankingVendedores.innerHTML = '';
    const pontuacaoPorVendedor = {};
    dados.vendas.forEach(venda => {
        if (!pontuacaoPorVendedor[venda.vendedor]) pontuacaoPorVendedor[venda.vendedor] = 0;
        pontuacaoPorVendedor[venda.vendedor] += venda.valorVenda + venda.comissao;
    });
    dados.feedbacks.forEach(feedback => {
        if (feedback.avaliacao === 'positiva') {
            const vendedor = dados.vendas.find(v => v.nomeCliente === feedback.nomeCliente)?.vendedor;
            if (vendedor) {
                pontuacaoPorVendedor[vendedor] += 100; // Bônus por feedback positivo
            }
        }
    });
    const vendedoresOrdenados = Object.entries(pontuacaoPorVendedor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 vendedores
    vendedoresOrdenados.forEach(([vendedor, pontuacao], index) => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            ${vendedor}
            ${pontuacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        `;
        rankingVendedores.appendChild(item);
    });
}

// Função para calcular a retenção de clientes
function calcularRetencaoClientes() {
    const clientesUnicos = [...new Set(dados.vendas.map(venda => venda.nomeCliente))];
    const clientesRepetidos = dados.vendas.reduce((acc, venda) => {
        if (!acc[venda.nomeCliente]) acc[venda.nomeCliente] = 0;
        acc[venda.nomeCliente]++;
        return acc;
    }, {});
    const clientesRetidos = Object.values(clientesRepetidos).filter(count => count > 1).length;
    const taxaRetencao = (clientesRetidos / clientesUnicos.length * 100).toFixed(2);
    document.getElementById('retencaoClientes').textContent = `${taxaRetencao}%`;
}

// Função para calcular a rentabilidade por serviço
function calcularRentabilidadePorServico() {
    const rentabilidadePorServico = {};
    dados.servicos.forEach(servico => {
        const vendasDoServico = dados.vendas.filter(venda => venda.servico === servico.nome);
        const totalVendas = vendasDoServico.reduce((total, venda) => total + venda.valorVenda, 0);
        const custoTotal = vendasDoServico.length * servico.custo; // Supondo que o custo seja fixo por serviço
        rentabilidadePorServico[servico.nome] = totalVendas - custoTotal;
    });
    console.log(rentabilidadePorServico); // Exibir no dashboard ou gráfico
}

// Função para definir metas por cliente
function definirMetaCliente() {
    const nomeCliente = document.getElementById('nomeClienteMeta').value;
    const valorMeta = parseFloat(document.getElementById('valorMeta').value);
    const novaMeta = { id: dados.metas.length + 1, nomeCliente, valorMeta };
    dados.metas.push(novaMeta);
    salvarDados();
    alert('Meta definida com sucesso!');
    atualizarMetasClientes();
}

// Função para atualizar as metas dos clientes
function atualizarMetasClientes() {
    const listaMetas = document.getElementById('listaMetas');
    listaMetas.innerHTML = '';
    dados.metas.forEach(meta => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <span>${meta.nomeCliente}</span>
            <span class="badge bg-primary rounded-pill">${meta.valorMeta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        `;
        listaMetas.appendChild(item);
    });
}

document.getElementById('metaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    definirMetaCliente();
});
