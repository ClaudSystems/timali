import React, { useEffect, useState } from 'react';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Faz a requisição para a API do Grails
    fetch('/produtos.json')
      .then(response => response.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao buscar produtos:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Carregando produtos...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Produtos</h1>
      {products.length === 0 ? (
        <p>Nenhum produto encontrado.</p>
      ) : (
        <ul>
          {products.map(product => (
            <li key={product.id}>
              <strong>{product.nome}</strong> - R$ {product.preco} (Estoque: {product.estoque || 0})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductList;