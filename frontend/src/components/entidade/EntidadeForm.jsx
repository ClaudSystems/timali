import React, { useState, useEffect } from 'react';
import './EntidadeForm.css';

const EntidadeForm = ({ entidade, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nome: '',
        tipoDePessoa: 'CLIENTE',
        ativo: true,
        classificacao: 'NAO_CLASSIFICADO',
        dataDeEmissao: '',
        dataDeValidade: '',
        dataDeNascimento: '',
        email: '',
        estadoCivil: '',
        genero: '',
        localDeTrabalho: '',
        nacionalidade: '',
        arquivoDeIdentificao: '',
        nuit: '',
        numeroDeIdentificao: '',
        profissao: '',
        residencia: '',
        telefone: '',
        telefone1: '',
        telefone2: '',
        tipoDeIdentificao: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (entidade) {
            const formatDate = (date) => {
                if (!date) return '';
                const d = new Date(date);
                return d.toISOString().split('T')[0];
            };

            const getValue = (obj, field, defaultValue = '') => {
                if (!obj) return defaultValue;
                const val = obj[field];
                if (val === null || val === undefined) return defaultValue;
                if (typeof val === 'object' && val.name) return val.name;
                return val;
            };

            setFormData({
                nome: entidade.nome || '',
                tipoDePessoa: getValue(entidade, 'tipoDePessoa', 'CLIENTE'),
                ativo: entidade.ativo !== undefined ? entidade.ativo : true,
                classificacao: getValue(entidade, 'classificacao', 'NAO_CLASSIFICADO'),
                dataDeEmissao: formatDate(entidade.dataDeEmissao),
                dataDeValidade: formatDate(entidade.dataDeValidade),
                dataDeNascimento: formatDate(entidade.dataDeNascimento),
                email: entidade.email || '',
                estadoCivil: getValue(entidade, 'estadoCivil'),
                genero: getValue(entidade, 'genero'),
                localDeTrabalho: entidade.localDeTrabalho || '',
                nacionalidade: entidade.nacionalidade || '',
                arquivoDeIdentificao: entidade.arquivoDeIdentificao || '',
                nuit: entidade.nuit || '',
                numeroDeIdentificao: entidade.numeroDeIdentificao || '',
                profissao: entidade.profissao || '',
                residencia: entidade.residencia || '',
                telefone: entidade.telefone || '',
                telefone1: entidade.telefone1 || '',
                telefone2: entidade.telefone2 || '',
                tipoDeIdentificao: getValue(entidade, 'tipoDeIdentificao')
            });
        } else {
            setFormData({
                nome: '',
                tipoDePessoa: 'CLIENTE',
                ativo: true,
                classificacao: 'NAO_CLASSIFICADO',
                dataDeEmissao: '',
                dataDeValidade: '',
                dataDeNascimento: '',
                email: '',
                estadoCivil: '',
                genero: '',
                localDeTrabalho: '',
                nacionalidade: '',
                arquivoDeIdentificao: '',
                nuit: '',
                numeroDeIdentificao: '',
                profissao: '',
                residencia: '',
                telefone: '',
                telefone1: '',
                telefone2: '',
                tipoDeIdentificao: ''
            });
        }
    }, [entidade]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nome?.trim()) {
            newErrors.nome = 'Nome é obrigatório';
        }
        if (!formData.tipoDePessoa) {
            newErrors.tipoDePessoa = 'Tipo de pessoa é obrigatório';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const dataToSubmit = { ...formData };

            ['dataDeEmissao', 'dataDeValidade', 'dataDeNascimento'].forEach(field => {
                if (!dataToSubmit[field]) dataToSubmit[field] = null;
            });

            // IMPORTANTE: Incluir version se estiver editando
            if (entidade) {
                dataToSubmit.id = entidade.id;
                dataToSubmit.version = entidade.version;
            }

            dataToSubmit.emDivida = false;

            console.log('📤 Enviando formulário:', dataToSubmit);
            onSubmit(dataToSubmit);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="entidade-form">
            <h3>{entidade ? 'Editar Entidade' : 'Nova Entidade'}</h3>

            {entidade && (
                <div className="form-section codigo-section">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="codigo">Código</label>
                            <input
                                type="text"
                                id="codigo"
                                value={entidade.codigo || '-'}
                                disabled
                                className="input-disabled"
                            />
                            <small>Código gerado automaticamente</small>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-section">
                <h4>Informações Básicas</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nome">Nome *</label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className={errors.nome ? 'error' : ''}
                            placeholder="Nome completo"
                        />
                        {errors.nome && <span className="error-message">{errors.nome}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="tipoDePessoa">Tipo de Pessoa *</label>
                        <select
                            id="tipoDePessoa"
                            name="tipoDePessoa"
                            value={formData.tipoDePessoa}
                            onChange={handleChange}
                            className={errors.tipoDePessoa ? 'error' : ''}
                        >
                            <option value="CLIENTE">Cliente</option>
                            <option value="ASSINANTE">Assinante</option>
                            <option value="FORNECEDOR">Fornecedor</option>
                            <option value="FUNCIONARIO">Funcionário</option>
                        </select>
                        {errors.tipoDePessoa && <span className="error-message">{errors.tipoDePessoa}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="classificacao">Classificação</label>
                        <select
                            id="classificacao"
                            name="classificacao"
                            value={formData.classificacao}
                            onChange={handleChange}
                        >
                            <option value="NAO_CLASSIFICADO">Não Classificado</option>
                            <option value="MAU">Mau</option>
                            <option value="REGULAR">Regular</option>
                            <option value="BOM">Bom</option>
                            <option value="MUITO_BOM">Muito Bom</option>
                            <option value="EXCELENTE">Excelente</option>
                            <option value="VIP">VIP</option>
                            <option value="PREMIUM">Premium</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4>Contato</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="email@exemplo.com"
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone">Telefone Principal</label>
                        <input
                            type="text"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="telefone1">Telefone Secundário</label>
                        <input
                            type="text"
                            id="telefone1"
                            name="telefone1"
                            value={formData.telefone1}
                            onChange={handleChange}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4>Documentação</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="tipoDeIdentificao">Tipo de Identificação</label>
                        <select
                            id="tipoDeIdentificao"
                            name="tipoDeIdentificao"
                            value={formData.tipoDeIdentificao}
                            onChange={handleChange}
                        >
                            <option value="">Selecione...</option>
                            <option value="BI">Bilhete de Identidade (BI)</option>
                            <option value="PASSAPORTE">Passaporte</option>
                            <option value="CEDULA">Cédula Pessoal</option>
                            <option value="CARTAO_ELEITOR">Cartão de Eleitor</option>
                            <option value="DIRE">DIRE</option>
                            <option value="NUIT">NUIT</option>
                            <option value="OUTRO">Outro</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="numeroDeIdentificao">Número de Identificação</label>
                        <input
                            type="text"
                            id="numeroDeIdentificao"
                            name="numeroDeIdentificao"
                            value={formData.numeroDeIdentificao}
                            onChange={handleChange}
                            placeholder="Número do documento"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="nuit">NUIT</label>
                        <input
                            type="text"
                            id="nuit"
                            name="nuit"
                            value={formData.nuit}
                            onChange={handleChange}
                            placeholder="Número do NUIT"
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h4>Status</h4>
                <div className="form-row">
                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="ativo"
                                checked={formData.ativo}
                                onChange={handleChange}
                            />
                            Ativo
                        </label>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary">
                    {entidade ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default EntidadeForm;