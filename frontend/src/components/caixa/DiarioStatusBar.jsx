// src/components/caixa/DiarioStatusBar.jsx
import React, { useState, useEffect } from 'react';
import { Alert, Tag, Spin } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', {
    style: 'currency', currency: 'MZN', minimumFractionDigits: 2
}).format(v || 0);

const DiarioStatusBar = () => {
    const [diarioAberto, setDiarioAberto] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarStatus();
        const interval = setInterval(carregarStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const carregarStatus = async () => {
        try {
            const token = localStorage.getItem('timali_token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Buscar todos os diários e filtrar o aberto/pendente
            const response = await fetch('/api/diarios?max=50', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const diarios = await response.json();
                // Procurar diário aberto ou pendente
                const aberto = diarios.find(d => d.estado === 'aberto' || d.estado === 'pendente');
                setDiarioAberto(aberto || null);
            }
        } catch (e) {
            console.error('Erro ao carregar status:', e);
        } finally {
            setLoading(false);
        }
    };

    const getCorEstado = (estado) => {
        switch (estado) {
            case 'aberto': return 'green';
            case 'fechado': return 'blue';
            case 'pendente': return 'orange';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 8 }}>
                <Spin size="small" /> Carregando status do diário...
            </div>
        );
    }

    return (
        <Alert
            type={diarioAberto ? (diarioAberto.estado === 'pendente' ? 'warning' : 'success') : 'info'}
            showIcon
            icon={<CalendarOutlined />}
            banner
            title={
                diarioAberto ? (
                    <span style={{ fontSize: 13 }}>
                        📒 <strong>Diário {diarioAberto.estado === 'pendente' ? 'Pendente' : 'Aberto'}:</strong> {diarioAberto.numeroDiario}
                        <span style={{ margin: '0 8px', color: '#999' }}>|</span>
                        📅 <strong>Data:</strong> {moment(diarioAberto.dataReferencia).format('DD/MM/YYYY')}
                        <span style={{ margin: '0 8px', color: '#999' }}>|</span>
                        💰 <strong>Saldo:</strong> {formatarMoeda(diarioAberto.saldo || 0)}
                        <Tag
                            color={getCorEstado(diarioAberto.estado)}
                            style={{ marginLeft: 8, fontSize: 11 }}
                        >
                            {diarioAberto.estado.toUpperCase()}
                        </Tag>
                    </span>
                ) : (
                    <span style={{ fontSize: 13 }}>
                        📒 Nenhum diário aberto no momento
                    </span>
                )
            }
            style={{ marginBottom: 16, borderRadius: 4 }}
        />
    );
};

export default DiarioStatusBar;