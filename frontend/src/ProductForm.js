import React, { useState } from 'react';

function ProductForm({ onProductAdded }) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const novoProduto = {
      nome: nome,
      preco: parseFloat(preco),
      estoque: parseInt(estoque) || 0
    };

    try {
      const response = await fetch('/produtos.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoProduto)
      });

      if (response.ok) {
        const data = await response.json();
        alert('Produto criado com sucesso!');
        setNome('');
        setPreco('');
        setEstoque('');
        if (onProductAdded) onProductAdded(); // Atualiza a lista
      } else {
        alert('Erro ao criar produto.');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
      <h3>Novo Produto</h3>
      <div>
        <label>Nome: </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Preço: </label>
        <input
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Estoque: </label>
        <input
          type="number"
          value={estoque}
          onChange={(e) => setEstoque(e.target.value)}
        />
      </div>
      <button type="submit" style={{ marginTop: '10px' }}>Salvar Produto</button>
    </form>
  );
}

export default ProductForm;