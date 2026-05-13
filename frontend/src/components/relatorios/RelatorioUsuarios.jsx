// src/components/relatorios/RelatorioUsuarios.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Typography, Divider, Space, message, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';

const { Title, Text } = Typography;

const RelatorioUsuarios = () => {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);

    useEffect(() => {
        carregarRelatorio();
    }, []);

    const carregarRelatorio = async () => {
        try {
            setLoading(true);
            const resultado = await relatorioService.usuarios();
            setDados(resultado);
        } catch (error) {
            console.error('Erro:', error);
            message.error('Erro ao carregar relatório');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Username', dataIndex: 'username', key: 'username' },
        { title: 'Nome', dataIndex: 'nome', key: 'nome' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { 
            title: 'Ativo', 
            dataIndex: 'ativo', 
            key: 'ativo',
            render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Sim' : 'Não'}</Tag>,
            width: 80
        },
        { 
            title: 'Créditos Ativos', 
            dataIndex: 'creditosAtivos', 
            key: 'creditosAtivos',
            align: 'center',
            width: 120
        },
        { 
            title: 'Criado em', 
            dataIndex: 'dateCreated', 
            key: 'dateCreated',
            render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-',
            width: 110
        },
    ];

    return (
        <div>
            <Title level={3}>👥 Relatório de Usuários</Title>
            <Text type="secondary">Todos os usuários do sistema</Text>
            <Divider />
            <Card size="small" style={{ marginBottom: 16 }}>
                <Space>
                    <Button onClick={carregarRelatorio} loading={loading} icon={<UserOutlined />}>Atualizar</Button>
                </Space>
            </Card>
            {dados && (
                <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                        <Space size="large">
                            <div><Text type="secondary">Total Usuários:</Text><br /><Text strong>{dados.totais.totalUsuarios}</Text></div>
                            <div><Text type="secondary">Ativos:</Text><br /><Text strong style={{ color: '#52c41a' }}>{dados.totais.usuariosAtivos}</Text></div>
                            <div><Text type="secondary">Inativos:</Text><br /><Text strong style={{ color: '#ff4d4f' }}>{dados.totais.usuariosInativos}</Text></div>
                        </Space>
                    </Card>
                    <Table columns={columns} dataSource={dados.usuarios} rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 700 }} />
                </>
            )}
        </div>
    );
};

export default RelatorioUsuarios;
