import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const EntidadeForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        codigo: '',
        nome: '',
        tipoDePessoa: 'CLIENTE',
        email: '',
        telefone: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/entidades', formData);
            alert('Entidade criada com sucesso!');
            navigate('/entidades'); // Volta para a lista
        } catch (err) {
            console.error("Erro ao criar entidade:", err);
            alert('Erro ao criar entidade. Verifique os logs.');
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Nova Entidade</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px', gap: '10px' }}>
                <label>Código:</label>
                <input name="codigo" value={formData.codigo} onChange={handleChange} required />

                <label>Nome:</label>
                <input name="nome" value={formData.nome} onChange={handleChange} required />

                <label>Tipo:</label>
                <select name="tipoDePessoa" value={formData.tipoDePessoa} onChange={handleChange}>
                    <option value="CLIENTE">Cliente</option>
                    <option value="ASSINANTE">Assinante</option>
                    <option value="FORNECEDOR">Fornecedor</option>
                    <option value="FUNCIONARIO">Funcionário</option>
                </select>

                <label>Email:</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} />

                <label>Telefone:</label>
                <input name="telefone" value={formData.telefone} onChange={handleChange} />

                <div style={{ marginTop: '10px' }}>
                    <button type="submit" style={{ backgroundColor: 'green', color: 'white', padding: '10px' }}>Gravar</button>
                    <Link to="/entidades" style={{ marginLeft: '10px' }}>Cancelar</Link>
                </div>
            </form>
        </div>
    );
};

export default EntidadeForm;
