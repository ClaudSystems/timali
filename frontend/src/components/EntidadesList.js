import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const EntidadesList = () => {
    const [entidades, setEntidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEntidades();
    }, []);

    const fetchEntidades = async () => {
        try {
            const response = await api.get('/entidades');
            setEntidades(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Erro ao carregar entidades:", err);
            setError("Não foi possível carregar as entidades. Verifique se o backend está ativo.");
            setLoading(false);
        }
    };

    const renderTipoPessoa = (tipo) => {
        if (!tipo) return 'N/A';
        if (typeof tipo === 'object') return tipo.name;
        return tipo;
    };

    if (loading) return <p>A carregar entidades...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h1>Gestão de Entidades</h1>
            <div style={{ marginBottom: '20px' }}>
                <Link to="/"> <button>Voltar ao Dashboard</button> </Link>
                <Link to="/entidades/novo">
                    <button style={{ marginLeft: '10px', backgroundColor: 'blue', color: 'white' }}>+ Nova Entidade</button>
                </Link>
                <button onClick={fetchEntidades} style={{ marginLeft: '10px' }}>Atualizar Lista</button>
            </div>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ padding: '10px' }}>Código</th>
                        <th style={{ padding: '10px' }}>Nome</th>
                        <th style={{ padding: '10px' }}>Tipo</th>
                        <th style={{ padding: '10px' }}>Email</th>
                        <th style={{ padding: '10px' }}>Telefone</th>
                        <th style={{ padding: '10px' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {entidades.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhuma entidade encontrada.</td>
                        </tr>
                    ) : (
                        entidades.map(entidade => (
                            <tr key={entidade.id}>
                                <td style={{ padding: '10px' }}>{entidade.codigo}</td>
                                <td style={{ padding: '10px' }}>{entidade.nome}</td>
                                <td style={{ padding: '10px' }}>{renderTipoPessoa(entidade.tipoDePessoa)}</td>
                                <td style={{ padding: '10px' }}>{entidade.email || 'N/A'}</td>
                                <td style={{ padding: '10px' }}>{entidade.telefone || 'N/A'}</td>
                                <td style={{ padding: '10px' }}>
                                    <button onClick={() => alert('Editar id: ' + entidade.id)}>Editar</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default EntidadesList;
