import React, { useState } from 'react';
import EntidadeList from './entidade/EntidadeList';
import EntidadeForm from './entidade/EntidadeForm';
import { entidadeService } from '../services/entidadeService';
import './EntidadeCRUD.css';

const EntidadeCRUD = () => {
    const [showForm, setShowForm] = useState(false);
    const [editingEntidade, setEditingEntidade] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreate = () => {
        console.log('🆕 Criar nova entidade');
        setEditingEntidade(null);
        setShowForm(true);
    };

    const handleEdit = (entidade) => {
        console.log('✏️ Editar entidade:', entidade.id, entidade.nome);
        setEditingEntidade(entidade);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        console.log('❌ Fechar formulário');
        setShowForm(false);
        setEditingEntidade(null);
    };

    const handleSubmit = async (formData) => {
        console.log('📤 Submetendo formulário');
        console.log('Editando?', editingEntidade ? `SIM (ID: ${editingEntidade.id})` : 'NÃO');
        console.log('Dados:', formData);

        try {
            if (editingEntidade) {
                console.log('🔄 Chamando atualizar...');
                const resultado = await entidadeService.atualizar(editingEntidade.id, formData);
                console.log('✅ Resultado da atualização:', resultado);
                alert('Entidade atualizada com sucesso!');
            } else {
                console.log('➕ Chamando criar...');
                const resultado = await entidadeService.criar(formData);
                console.log('✅ Resultado da criação:', resultado);
                alert('Entidade criada com sucesso!');
            }

            console.log('🚪 Fechando formulário...');
            setShowForm(false);
            setEditingEntidade(null);

            console.log('🔄 Disparando refresh da lista...');
            setRefreshKey(prev => {
                const novoValor = prev + 1;
                console.log('   refreshKey mudou de', prev, 'para', novoValor);
                return novoValor;
            });

        } catch (error) {
            console.error('❌ ERRO:', error);
            alert(`Erro: ${error.message}`);
        }
    };

    const handleRefresh = () => {
        console.log('🔄 Refresh manual');
        setRefreshKey(prev => prev + 1);
    };

    console.log('🎨 Renderizando EntidadeCRUD - refreshKey =', refreshKey);

    return (
        <div className="entidade-crud">
            <div className="crud-header">
                <h1>Gestão de Entidades</h1>
                <div className="header-actions">
                    {!showForm && (
                        <>
                            <button onClick={handleRefresh} className="btn-refresh-header" title="Atualizar lista">
                                🔄 Atualizar
                            </button>
                            <button onClick={handleCreate} className="btn-add">
                                ➕ Nova Entidade
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showForm ? (
                <div className="form-container">
                    <EntidadeForm
                        entidade={editingEntidade}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </div>
            ) : (
                <EntidadeList
                    onEdit={handleEdit}
                    refreshTrigger={refreshKey}
                />
            )}
        </div>
    );
};

export default EntidadeCRUD;