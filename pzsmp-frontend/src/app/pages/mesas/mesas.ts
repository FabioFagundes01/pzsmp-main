import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../core/services/mesa';
import { PedidoService } from '../../core/services/pedido';
import { ReservaService } from '../../core/services/reserva';
import { ProdutoService } from '../../core/services/produto';
import { Mesa } from '../../core/models/mesa.model';
import { Pedido } from '../../core/models/pedido.model';
import { Produto } from '../../core/models/produto.model';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mesas.html',
  styleUrls: ['./mesas.css']
})
export class Mesas implements OnInit {
  listaMesas: Mesa[] = [];
  
  // Variáveis do Modal
  mesaSelecionada: Mesa | null = null;
  modalView: 'novoPedido' | 'pedidos' | 'reserva' = 'novoPedido';

  // Dados para os diferentes views do modal
  pedidosDaMesa: Pedido[] = [];
  cardapioCompleto: Produto[] = [];
  cardapioFiltrado: Produto[] = [];
  filtroCardapioAtual: string = 'PIZZA_ESPECIAL';
  tiposDeProduto: string[] = [
    'PIZZA_ESPECIAL', 'PIZZA_TRADICIONAL', 'PIZZA_DOCE', 'PASTEL_DOCE',
    'LANCHES', 'PASTEL', 'SUCOS', 'DRINKS', 'SOBREMESA', 'BEBIDA'
  ];

  novoPedidoItens: { produto: Produto, quantidade: number }[] = [];
  totalNovoPedido: number = 0;
  novaReserva = { nomeReserva: '', numPessoas: null, observacoes: '' };

  constructor(
    private mesaService: MesaService,
    private pedidoService: PedidoService,
    private reservaService: ReservaService,
    private produtoService: ProdutoService
  ) {}

  ngOnInit(): void {
    this.carregarMesas();
    this.carregarCardapio();
  }

  carregarMesas(): void {
    this.mesaService.getMesas().subscribe(data => {
      this.listaMesas = data.sort((a, b) => a.numero - b.numero);
    });
  }

  carregarCardapio(): void {
    this.produtoService.getProdutos().subscribe(data => {
      this.cardapioCompleto = data;
      this.filtrarCardapio(this.filtroCardapioAtual);
    });
  }

  abrirModal(mesa: Mesa): void {
    this.mesaSelecionada = mesa;
    // O padrão é sempre abrir na tela de "Novo Pedido" para consistência.
    this.modalView = 'novoPedido';
    
    // Busca os pedidos ativos em segundo plano, para o caso de o usuário navegar para essa aba.
    this.pedidoService.getPedidosPorMesa(mesa.numero).subscribe(pedidos => {
      this.pedidosDaMesa = pedidos;
    });
  }

  fecharModal(): void {
    this.mesaSelecionada = null;
    this.pedidosDaMesa = [];
    this.novoPedidoItens = [];
    this.totalNovoPedido = 0;
    this.novaReserva = { nomeReserva: '', numPessoas: null, observacoes: '' };
  }
  
  // --- Lógica do Novo Pedido ---
  filtrarCardapio(tipo: string): void {
    this.filtroCardapioAtual = tipo;
    this.cardapioFiltrado = this.cardapioCompleto.filter(p => p.tipo === tipo);
  }

  adicionarAoPedido(produto: Produto): void {
    const itemExistente = this.novoPedidoItens.find(item => item.produto.id_produto === produto.id_produto);
    if (itemExistente) {
      itemExistente.quantidade++;
    } else {
      this.novoPedidoItens.push({ produto: produto, quantidade: 1 });
    }
    this.calcularTotalNovoPedido();
  }

  calcularTotalNovoPedido(): void {
    this.totalNovoPedido = this.novoPedidoItens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  }

  finalizarPedido(): void {
    if (this.novoPedidoItens.length === 0) {
      alert('Adicione pelo menos um item ao pedido.');
      return;
    }

    const itensParaApi = this.novoPedidoItens.map(item => ({
      idProduto: item.produto.id_produto,
      quantidade: item.quantidade
    }));

    if (this.pedidosDaMesa.length > 0) {
      const pedidoId = this.pedidosDaMesa[0].idPedido;
      this.pedidoService.adicionarItensAoPedido(pedidoId, itensParaApi).subscribe({
        next: () => {
          
          this.carregarMesas();
          this.fecharModal();
        },
        error: (err) => {
          alert('Erro ao adicionar itens.');
          console.error(err);
        }
      });
    } else {
      const pedidoParaApi = {
        idMesa: this.mesaSelecionada!.numero,
        idCliente: null,
        itens: itensParaApi
      };
      this.pedidoService.realizarPedido(pedidoParaApi).subscribe({
        next: () => {
          
          this.carregarMesas();
          this.fecharModal();
        },
        error: (err) => {
          alert('Erro ao criar o pedido.');
          console.error(err);
        }
      });
    }
  }

  // --- Lógica da Reserva ---
  reservarMesa(): void {
    if (!this.mesaSelecionada || !this.novaReserva.nomeReserva || !this.novaReserva.numPessoas) {
      alert('Por favor, preencha o nome para a reserva e o número de pessoas.');
      return;
    }

    const dadosReserva = {
      idMesa: this.mesaSelecionada.numero,
      nomeReserva: this.novaReserva.nomeReserva,
      numPessoas: this.novaReserva.numPessoas,
      observacoes: this.novaReserva.observacoes,
      dataReserva: new Date().toISOString()
    };

    this.reservaService.fazerReserva(dadosReserva).subscribe({
      next: () => {
        alert(`Mesa ${this.mesaSelecionada?.numero} reservada com sucesso para "${dadosReserva.nomeReserva}"!`);
        this.carregarMesas();
        this.fecharModal();
      },
      error: (err) => {
        alert('Erro ao fazer a reserva.');
        console.error(err);
      }
    });
  }
  
  formatarNomeFiltro(tipo: string): string {
    return tipo.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }
  removerDoPedido(itemParaRemover: any): void {
    // Filtra a lista de itens, criando uma nova lista que contém todos os itens, EXCETO o que foi clicado.
    this.novoPedidoItens = this.novoPedidoItens.filter(item => item.produto.id_produto !== itemParaRemover.produto.id_produto);
    
    // Após remover, é crucial recalcular o valor total do pedido.
    this.calcularTotalNovoPedido();
  }
}
