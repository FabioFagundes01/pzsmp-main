package br.com.sampaiollo.pzsmp.dto;

import br.com.sampaiollo.pzsmp.entity.Produto;
import java.math.BigDecimal;

public record ProdutoResponseDto(
    Integer id_produto,
    String nome,
    BigDecimal preco,
    String tipo,    
    String imagemUrl,
    String descricao
) {
    public ProdutoResponseDto(Produto produto) {
        this(
            produto.getId_produto(),
            produto.getNome(),
            produto.getPreco(),
            produto.getTipo().name(), 
            produto.getImagemUrl(),
            produto.getDescricao()
        );
    }
}