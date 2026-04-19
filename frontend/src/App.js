import React, { useState, useEffect } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';

function App() {
  const [produtos, setProdutos] = useState([]);
  const [refresh, setRefresh] = useState(false);

  const fetchProdutos = async () => {
    try {
      const response = await fetch('/produtos.json');
      const data = await response.json();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [refresh]);

  const handleProductAdded = () => {
    setRefresh(!refresh); // Trigger refresh
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Gerenciamento de Produtos (Grails + React)</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <ProductForm onProductAdded={handleProductAdded} />
        <ProductList produtos={produtos} />
      </main>
    </div>
  );
}

export default App;