// src/components/caixa/ModalFecharDiario.jsx
import React, { useState } from 'react';
import { Modal, Typography, Checkbox, Select, Input, message } from 'antd';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

const ModalFecharDiario = ({ open, diario, salvando, onCancel, onConfirm }) => {
    const [lancarSaida, setLancarSaida] = useState(true);
    const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
    const [notas, setNotas] = useState('');

    const handleOk = async () => {
        const ok = await onConfirm(notas, lancarSaida, formaPagamento);
        if (ok) {
            setNotas('');
            onCancel();
        }
    };

    return (
        <Modal title="Fechar Diário" open={open} onCancel={onCancel} onOk={handleOk}
            confirmLoading={salvando} okText="Confirmar" cancelText="Cancelar" width={500}>
            <p><Text strong>Diário: </Text>{diario?.numeroDiario}</p>
            <p><Text strong>Data: </Text>{moment(diario?.dataReferencia).format('DD/MM/YYYY')}</p>
            <p><Text strong>Saldo: </Text><Text style={{ fontSize: 18, color: (diario?.totais?.saldo || 0) >= 0 ? '#1890ff' : '#cf1322' }}>{formatarMoeda(diario?.totais?.saldo || 0)}</Text></p>
            {(diario?.totais?.saldo || 0) > 0 && (
                <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                    <Checkbox checked={lancarSaida} onChange={e => setLancarSaida(e.target.checked)}>Lançar saída com o saldo</Checkbox>
                    {lancarSaida && (
                        <div style={{ marginTop: 8, marginLeft: 24 }}>
                            <Select value={formaPagamento} onChange={setFormaPagamento} style={{ width: '100%', marginTop: 4 }}>
                                <Option value="DINHEIRO">Dinheiro</Option>
                                <Option value="TRANSFERENCIA">Transferência</Option>
                                <Option value="CHEQUE">Cheque</Option>
                                <Option value="CARTAO">Cartão</Option>
                            </Select>
                        </div>
                    )}
                </div>
            )}
            <Text strong>Notas:</Text>
            <TextArea rows={3} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observações..." style={{ marginTop: 4 }} />
        </Modal>
    );
};

export default ModalFecharDiario;