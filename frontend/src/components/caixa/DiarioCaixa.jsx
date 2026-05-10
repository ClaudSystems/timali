// src/components/caixa/DiarioCaixa.jsx
import React from 'react';
import { Card, Typography, Spin } from 'antd';
import { CalendarOutlined, WalletOutlined, SearchOutlined } from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/pt';
import { useDiarioState } from './useDiarioState';
import DiarioCabecalho from './DiarioCabecalho';
import DiarioResumo from './DiarioResumo';
import DiarioTabelas from './DiarioTabelas';
import DiarioHistorico from './DiarioHistorico';
import ModalFecharDiario from './ModalFecharDiario';

moment.locale('pt');
const { Title } = Typography;

const DiarioCaixa = () => {
    const state = useDiarioState();
    const {
        loading, dataSelecionada, diario, diariosGravados, mostrarHistorico,
        loadingHistorico, mensagemErro, salvando,
        setDataSelecionada, setMostrarHistorico, setMensagemErro,
        buscarDiario, gerarDiario, fecharDiario, reabrirDiario,
        carregarHistorico, visualizarDiario, buscarDiarioHoje
    } = state;

    return (
        <div>
            <Title level={4} style={{ marginTop: 0 }}><CalendarOutlined /> Diário de Caixa</Title>

            <DiarioCabecalho
                dataSelecionada={dataSelecionada}
                setDataSelecionada={setDataSelecionada}
                diario={diario}
                loading={loading}
                salvando={salvando}
                onBuscar={buscarDiario}
                onGerar={gerarDiario}
                onHoje={buscarDiarioHoje}
                onFechar={fecharDiario}
                onReabrir={reabrirDiario}
                onHistorico={carregarHistorico}
                mensagemErro={mensagemErro}
                setMensagemErro={setMensagemErro}
            />

            {loading && !diario && (
                <Card><div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div></Card>
            )}

            {diario && !mostrarHistorico && (
                <>
                    <DiarioResumo diario={diario} />
                    <DiarioTabelas diario={diario} />
                </>
            )}

            {!diario && !mostrarHistorico && !loading && (
                <Card>
                    <div style={{ textAlign: 'center', padding: 60 }}>
                        <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                        <Title level={3}>Diário de Caixa</Title>
                        <p style={{ color: '#999' }}>Selecione uma data e clique em <strong>Buscar</strong> ou <strong>Gerar</strong></p>
                    </div>
                </Card>
            )}

            {mostrarHistorico && (
                <DiarioHistorico
                    diarios={diariosGravados}
                    loading={loadingHistorico}
                    onVisualizar={visualizarDiario}
                    onFechar={() => setMostrarHistorico(false)}
                />
            )}
        </div>
    );
};

export default DiarioCaixa;