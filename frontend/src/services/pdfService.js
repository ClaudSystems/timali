// frontend/src/services/pdfService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const pdfService = {
  gerarFichaEntidade: async (entidade, fotoUrl) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DE ENTIDADE', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Foto - desenhada primeiro, ocupando o lado direito
    const fotoX = pageWidth - 45;
    const fotoY = 25;
    const fotoW = 30;
    const fotoH = 40;

    if (fotoUrl) {
      try {
        const img = new Image();
        img.src = fotoUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        doc.addImage(img, 'JPEG', fotoX, fotoY, fotoW, fotoH);

        // Borda da foto
        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.rect(fotoX, fotoY, fotoW, fotoH);
      } catch (e) {
        console.log('Foto não carregada para PDF');
      }
    }

    // Informações principais (à esquerda da foto)
    y = 25;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(entidade.nome || '', 15, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${entidade.codigo || 'N/A'}`, 15, y);
    y += 5;
    doc.text(`Tipo: ${entidade.tipoDePessoa || 'N/A'}`, 15, y);
    y += 5;
    doc.text(`Classificação: ${entidade.classificacao || 'N/A'}`, 15, y);
    y += 5;
    doc.text(`Status: ${entidade.ativo ? 'Ativo' : 'Inativo'}`, 15, y);
    y += 5;
    doc.text(`Gestor: ${entidade.usuario?.nome || entidade.usuario?.username || 'N/A'}`, 15, y);

    // Linha separadora - APÓS a foto (y = fotoY + fotoH + 5)
    y = Math.max(y, fotoY + fotoH) + 5;
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(10, y, pageWidth - 10, y);
    y += 8;

    // Identificação
    const ident = entidade.identificacao;
    if (ident) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('IDENTIFICAÇÃO', 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const idData = [
        ['Tipo:', ident.tipoDeIdentificao || '—', 'Número:', ident.numeroDeIdentificao || '—'],
        ['NUIT:', ident.nuit || '—', 'Data Emissão:', formatDatePDF(ident.dataDeEmissao)],
        ['Validade:', formatDatePDF(ident.dataDeValidade), 'Arquivo:', ident.arquivoDeIdentificao || '—']
      ];

      doc.autoTable({
        startY: y,
        head: [],
        body: idData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', cellWidth: 22 },
          3: { cellWidth: 55 }
        }
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    // Dados Pessoais
    const ct = entidade.contacto;
    const dp = entidade.dadosPessoais;
    if (dp || ct) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS PESSOAIS', 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dpData = [
        ['Gênero:', dp?.genero || '—', 'Estado Civil:', dp?.estadoCivil || '—'],
        ['Nascimento:', formatDatePDF(dp?.dataDeNascimento), 'Nacionalidade:', ct?.nacionalidade || '—'],
        ['Profissão:', ct?.profissao || '—', 'Local Trab.:', ct?.localDeTrabalho || '—']
      ];

      doc.autoTable({
        startY: y,
        body: dpData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', cellWidth: 22 },
          3: { cellWidth: 55 }
        }
      });
      y = doc.lastAutoTable.finalY + 5;
    }

    // Contactos
    if (ct) {
      // Verificar se precisa de nova página
      if (y > 240) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACTOS', 15, y);
      y += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const ctData = [
        ['Telefone:', ct.telefone || '—', 'Email:', ct.email || '—'],
        ['Tel. Alt 1:', ct.telefone1 || '—', 'Tel. Alt 2:', ct.telefone2 || '—'],
        ['Residência:', ct.residencia || '—', '', '']
      ];

      doc.autoTable({
        startY: y,
        body: ctData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 22 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', cellWidth: 22 },
          3: { cellWidth: 55 }
        }
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-MZ')}`, 15, doc.internal.pageSize.getHeight() - 10);
    doc.text(`ID: ${entidade.id}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 10);

    // Salvar
    doc.save(`ficha_${entidade.nome?.replace(/\s+/g, '_') || 'entidade'}.pdf`);
  }
};

function formatDatePDF(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-MZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default pdfService;