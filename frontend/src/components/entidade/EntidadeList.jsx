import React, { useState, useEffect } from 'react';
import { entidadeService } from '../../services/entidadeService';
import './EntidadeList.css';

const EntidadeList = ({ onEdit, refreshTrigger }) => {
    const [entidades, setEntidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('TODOS');

    useEffect(() => {
        console.log('🔄 EntidadeList - useEffect disparado! refreshTrigger =', refreshTrigger);
        carregarEntidades();
    }, [refreshTrigger]);

    const carregarEntidades = async () => {
        console.log('📥 Carregando entidades...');
        try {
            setLoading(true);
            setError(null);
            const dados = await entidadeService.listar();
            console.log('✅ Entidades carregadas:', dados.length);
            setEntidades(Array.isArray(dados) ? dados : []);
        } catch (err) {
            console.error('❌ Erro ao carregar:', err);
            setError('Erro ao carregar entidades.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, nome) => {
        if (window.confirm(`Excluir "${nome}"?`)) {
            try {
                await entidadeService.excluir(id);
                setEntidades(entidades.filter(e => e.id !== id));
                alert('Excluído com sucesso!');
            } catch (err) {
                alert('Erro: ' + err.message);
            }
        }
    };

    const getValorTipoPessoa = (entidade) => {
        if (!entidade?.tipoDePessoa) return '';
        if (typeof entidade.tipoDePessoa === 'string') return entidade.tipoDePessoa;
        if (entidade.tipoDePessoa.name) return entidade.tipoDePessoa.name;
        return '';
    };

    const getValorCampo = (obj, campo) => {
        if (!obj || !obj[campo]) return '-';
        if (typeof obj[campo] === 'string') return obj[campo];
        if (obj[campo].name) return obj[campo].name;
        return String(obj[campo]);
    };

    const entidadesFiltradas = entidades.filter(entidade => {
        const nome = entidade.nome || '';
        const codigo = entidade.codigo || '';
        const email = entidade.email || '';
        const matchSearch =
            nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase());

        const tipoValue = getValorTipoPessoa(entidade);
        const matchTipo = filtroTipo === 'TODOS' || tipoValue === filtroTipo;

        return matchSearch && matchTipo;
    });

    console.log('🎨 Renderizando EntidadeList -', entidades.length, 'entidades');

    if (loading) return <div className="loading">Carregando...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="entidade-list-container">
            <div className="list-header">
                <h2>Entidades ({entidadesFiltradas.length})</h2>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="filter-select">
                        <option value="TODOS">Todos</option>
                        <option value="CLIENTE">Cliente</option>
                        <option value="ASSINANTE">Assinante</option>
                        <option value="FORNECEDOR">Fornecedor</option>
                        <option value="FUNCIONARIO">Funcionário</option>
                    </select>
                </div>
            </div>

            <div className="table-responsive">
                <table className="entidade-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entidadesFiltradas.length === 0 ? (
                            <tr><td colSpan="7" className="no-data">Nenhuma entidade</td></tr>
                        ) : (
                            entidadesFiltradas.map(entidade => (
                                <tr key={entidade.id} className={!entidade.ativo ? 'inactive-row' : ''}>
                                    <td>{entidade.codigo || '-'}</td>
                                    <td>{entidade.nome || '-'}</td>
                                    <td>{getValorCampo(entidade, 'tipoDePessoa')}</td>
                                    <td>{entidade.email || '-'}</td>
                                    <td>{entidade.telefone || entidade.telefone1 || '-'}</td>
                                    <td>
                                        <span className={`badge ${entidade.ativo ? 'badge-success' : 'badge-secondary'}`}>
                                            {entidade.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button onClick={() => onEdit(entidade)} className="btn-edit">✏️</button>
                                        <button onClick={() => handleDelete(entidade.id, entidade.nome)} className="btn-delete">🗑️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EntidadeList;