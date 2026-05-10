// src/components/caixa/useDiarioState.js
import { useState, useEffect, useCallback } from 'react';
import { message, Modal } from 'antd';
import moment from 'moment';

export const useDiarioState = () => {
    const [loading, setLoading] = useState(false);
    const [dataSelecionada, setDataSelecionada] = useState(moment());
    const [diario, setDiario] = useState(null);
    const [diariosGravados, setDiariosGravados] = useState([]);
    const [mostrarHistorico, setMostrarHistorico] = useState(false);
    const [loadingHistorico, setLoadingHistorico] = useState(false);
    const [mensagemErro, setMensagemErro] = useState('');
    const [salvando, setSalvando] = useState(false);

    const getToken = () => localStorage.getItem('timali_token');

    const buscarDiarioHoje = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            setLoading(true);
            const hoje = moment().format('YYYY-MM-DD');
            const response = await fetch(`/api/diarios/buscar?data=${hoje}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                setDiario(data);
                setDataSelecionada(moment());
            }
        } catch (e) { /* silencioso */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { buscarDiarioHoje(); }, [buscarDiarioHoje]);

    const buscarDiario = useCallback(async () => {
        if (!dataSelecionada) { message.warning('Selecione uma data'); return; }
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const dataStr = dataSelecionada.format('YYYY-MM-DD');
            const response = await fetch(`/api/diarios/buscar?data=${dataStr}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const text = await response.text();
            const data = JSON.parse(text);
            if (response.ok) {
                setDiario(data);
                setMostrarHistorico(false);
            } else if (response.status === 404) {
                setDiario(null);
                Modal.info({ title: 'Não encontrado', content: `Nenhum diário para ${dataSelecionada.format('DD/MM/YYYY')}`, okText: 'OK' });
            }
        } catch (e) { message.error('Erro ao buscar'); }
        finally { setLoading(false); }
    }, [dataSelecionada]);

    const gerarDiario = useCallback(async () => {
        if (!dataSelecionada) { message.warning('Selecione uma data'); return; }
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const dataStr = dataSelecionada.format('YYYY-MM-DD');
            const response = await fetch(`/api/diarios/gerar?data=${dataStr}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const text = await response.text();
            const data = JSON.parse(text);
            if (response.ok) {
                setDiario(data);
                setMostrarHistorico(false);
                message.success('Diário gerado!');
            } else { throw new Error(data.message); }
        } catch (e) { message.error(e.message); }
        finally { setLoading(false); }
    }, [dataSelecionada]);

    const fecharDiario = useCallback(async (notas, lancarSaida, formaPagamento) => {
        const token = getToken();
        const dataRef = moment(diario.dataReferencia).format('YYYY-MM-DD');
        setSalvando(true);
        try {
            const response = await fetch('/api/diarios/fechar', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataReferencia: dataRef,
                    notas: notas || '',
                    lancarSaida: lancarSaida || false,
                    formaPagamento: formaPagamento || 'DINHEIRO'
                })
            });
            if (response.ok) {
                message.success('✅ Diário fechado!');
                // Recarregar dados atualizados
                const refreshRes = await fetch(`/api/diarios/buscar?data=${dataRef}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (refreshRes.ok) {
                    const freshData = await refreshRes.json();
                    setDiario(freshData);
                }
                return true;
            }
            return false;
        } catch (e) { message.error('Erro'); return false; }
        finally { setSalvando(false); }
    }, [diario]);

    const reabrirDiario = useCallback(async () => {
        const token = getToken();
        setSalvando(true);
        try {
            const response = await fetch('/api/diarios/reabrir', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataReferencia: moment(diario.dataReferencia).format('YYYY-MM-DD') })
            });
            if (response.ok) {
                message.success('✅ Diário reaberto!');
                // Recarregar dados atualizados
                const dataStr = moment(diario.dataReferencia).format('YYYY-MM-DD');
                const refreshRes = await fetch(`/api/diarios/buscar?data=${dataStr}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (refreshRes.ok) {
                    const freshData = await refreshRes.json();
                    setDiario(freshData);
                }
            }
        } catch (e) { message.error('Erro'); }
        finally { setSalvando(false); }
    }, [diario]);

    const carregarHistorico = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        setLoadingHistorico(true);
        try {
            const response = await fetch('/api/diarios', {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            const result = await response.json();
            setDiariosGravados(Array.isArray(result) ? result : []);
            setMostrarHistorico(true);
        } catch (e) { message.error('Erro ao carregar histórico'); }
        finally { setLoadingHistorico(false); }
    }, []);

    const visualizarDiario = useCallback(async (diarioItem) => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/diarios/buscar?data=${moment(diarioItem.dataReferencia).format('YYYY-MM-DD')}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (response.ok) {
                const data = await response.json();
                setDiario(data);
                setMostrarHistorico(false);
                setDataSelecionada(moment(diarioItem.dataReferencia));
            }
        } catch (e) { message.error('Erro'); }
        finally { setLoading(false); }
    }, []);

    return {
        loading, dataSelecionada, diario, diariosGravados, mostrarHistorico,
        loadingHistorico, mensagemErro, salvando,
        setDataSelecionada, setDiario, setMostrarHistorico, setMensagemErro,
        buscarDiario, gerarDiario, fecharDiario, reabrirDiario,
        carregarHistorico, visualizarDiario, buscarDiarioHoje
    };
};