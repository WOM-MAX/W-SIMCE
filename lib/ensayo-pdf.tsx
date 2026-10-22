// Ensayo a PDF con @react-pdf/renderer. Sin LibreOffice: se arma el documento
// con componentes y se obtiene el archivo en memoria.

import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { MARGEN_MM, TAMANOS, type Documento } from '@/lib/documento';
import { pngDeFigura } from '@/lib/figura-png';

function mmAPuntos(mm: number): number {
  return mm * 2.8346;
}

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

function hoja(doc: Documento) {
  const [anchoMm, altoMm] = TAMANOS[doc.tamano].mm;
  return {
    ancho: mmAPuntos(anchoMm),
    alto: mmAPuntos(altoMm),
    margen: mmAPuntos(MARGEN_MM),
  };
}

function estilos(doc: Documento) {
  const { ancho, alto, margen } = hoja(doc);
  return StyleSheet.create({
    pagina: {
      width: ancho,
      height: alto,
      paddingTop: margen,
      paddingBottom: margen,
      paddingLeft: margen,
      paddingRight: margen,
      fontSize: 10,
      color: '#111111',
    },
    colegio: { fontSize: 8, color: '#666666', letterSpacing: 0.6, textTransform: 'uppercase' },
    titulo: { fontSize: 17, marginTop: 2 },
    subtitulo: { fontSize: 9, color: '#555555', marginTop: 3 },
    datos: { fontSize: 9, marginTop: 10 },
    instrucciones: { fontSize: 8, color: '#555555', marginTop: 8, lineHeight: 1.4 },
    linea: { height: 1, backgroundColor: '#DDDDDD', marginTop: 8 },
    lectura: {
      borderWidth: 1,
      borderColor: '#CCCCCC',
      padding: 6,
      marginTop: 10,
      marginBottom: 6,
    },
    lecturaTitulo: { fontSize: 10, marginBottom: 3 },
    lecturaCuerpo: { fontSize: 9, lineHeight: 1.45 },
    lecturaFuente: { fontSize: 7, color: '#777777', marginTop: 3 },
    pregunta: { marginTop: 12 },
    enunciado: { fontSize: 10, lineHeight: 1.4 },
    numero: { width: 16 },
    figura: { marginTop: 6, marginBottom: 2 },
    alternativa: { flexDirection: 'row', marginTop: 3, paddingLeft: 16 },
    letra: { width: 12, fontSize: 10 },
    alternativasTexto: { flex: 1, fontSize: 10, lineHeight: 1.35 },
    clave: { fontSize: 7, color: '#B02A0E', marginLeft: 4 },
    claveTitulo: { fontSize: 12, marginTop: 16, marginBottom: 6 },
    hojaTitulo: { fontSize: 14, marginTop: 4, marginBottom: 8 },
    tablaFila: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingVertical: 3 },
    celda: { width: 22, fontSize: 8, textAlign: 'center' },
    pie: { position: 'absolute', bottom: mmAPuntos(8), left: margen, right: margen, fontSize: 7, color: '#999999', textAlign: 'center' },
  });
}

export async function documentoPdf(doc: Documento): Promise<Buffer> {
  const s = estilos(doc);
  const { ancho, alto } = hoja(doc);
  const anchoFigura = mmAPuntos(doc.preguntas[0]?.figura?.anchoMm ?? 60);

  const hijos: React.ReactElement[] = [];

  hijos.push(
    React.createElement(Text, { key: 'col', style: s.colegio }, doc.colegio),
    React.createElement(Text, { key: 'tit', style: s.titulo }, doc.titulo),
    React.createElement(
      Text,
      { key: 'sub', style: s.subtitulo },
      `${doc.asignatura} · ${doc.nivel} · ${doc.preguntas.length} preguntas · ${
        doc.tiempoMin === 0 ? 'sin límite de tiempo' : `${doc.tiempoMin} minutos`
      }`
    ),
    React.createElement(
      Text,
      { key: 'cur', style: s.subtitulo },
      `Curso: ${doc.curso} · Descargado el ${doc.fecha}`
    ),
    React.createElement(
      Text,
      { key: 'dat', style: s.datos },
      'Nombre: ______________________________________     Curso: ____________     Fecha: ____________'
    ),
    React.createElement(
      Text,
      { key: 'ins', style: s.instrucciones },
      'Instrucciones: marca una sola alternativa por pregunta. Usa la hoja de respuestas del final. No se permite el uso de calculadora salvo que el profesor lo indique.'
    ),
    React.createElement(View, { key: 'lin', style: s.linea })
  );

  for (const p of doc.preguntas) {
    if (p.lectura) {
      hijos.push(
        React.createElement(
          View,
          { key: `lec-${p.numero}`, style: s.lectura },
          React.createElement(Text, { style: s.lecturaTitulo }, p.lectura.titulo),
          React.createElement(Text, { style: s.lecturaCuerpo }, p.lectura.cuerpo),
          ...(p.lectura.fuente
            ? [React.createElement(Text, { key: 'f', style: s.lecturaFuente }, `Fuente: ${p.lectura.fuente}`)]
            : [])
        )
      );
    }

    hijos.push(
      React.createElement(
        View,
        { key: `p-${p.numero}`, style: s.pregunta },
        React.createElement(
          View,
          { style: { flexDirection: 'row' } },
          React.createElement(Text, { style: s.numero }, `${p.numero}.`),
          React.createElement(Text, { style: { flex: 1, fontSize: 10, lineHeight: 1.4 } }, p.enunciado)
        )
      )
    );

    if (p.figura) {
      const png = pngDeFigura(p.figura.primitivas, p.figura.anchoMm);
      if (png) {
        const primitivas = p.figura.primitivas as Record<string, unknown>;
        const anchoOrig = Number(primitivas?.ancho) || 400;
        const altoOrig = Number(primitivas?.alto) || 200;
        const altoFigura = (anchoFigura * altoOrig) / anchoOrig;
        hijos.push(
          React.createElement(Image, {
            key: `fig-${p.numero}`,
            src: png,
            style: { width: anchoFigura, height: altoFigura, marginTop: 6, marginLeft: 16 },
          })
        );
      }
    }

    for (const a of p.alternativas) {
      const esClave = doc.conClave && a.letra === p.clave;
      hijos.push(
        React.createElement(
          View,
          { key: `a-${p.numero}-${a.letra}`, style: s.alternativa },
          React.createElement(Text, { style: s.letra }, a.letra),
          React.createElement(
            Text,
            { style: s.alternativasTexto },
            a.texto,
            ...(esClave ? [React.createElement(Text, { key: 'c', style: s.clave }, '  CLAVE')] : [])
          )
        )
      );
    }
  }

  // Hoja de respuestas en página nueva
  const mitad = Math.ceil(doc.preguntas.length / 2);
  const filas: React.ReactElement[] = [];
  for (let i = 0; i < mitad; i += 1) {
    const a = i + 1;
    const b = i + 1 + mitad;
    filas.push(
      React.createElement(
        View,
        { key: `f-${i}`, style: s.tablaFila },
        React.createElement(Text, { style: { width: 22, fontSize: 8 } }, String(a)),
        ...LETRAS.map((l) =>
          React.createElement(Text, { key: `a${a}${l}`, style: s.celda }, '○')
        ),
        React.createElement(
          Text,
          { style: { width: 22, fontSize: 8 } },
          b <= doc.preguntas.length ? String(b) : ''
        ),
        ...LETRAS.map((l) =>
          React.createElement(
            Text,
            { key: `b${b}${l}`, style: s.celda },
            b <= doc.preguntas.length ? '○' : ''
          )
        )
      )
    );
  }

  const hojaRespuestas = React.createElement(
    View,
    { key: 'resp' },
    React.createElement(Text, { style: s.hojaTitulo }, 'Hoja de respuestas'),
    React.createElement(
      Text,
      { style: { fontSize: 9, marginBottom: 8 } },
      'Nombre: ______________________________________     Curso: ______________'
    ),
    ...filas,
    ...(doc.conClave
      ? [
          React.createElement(Text, { key: 'ct', style: s.claveTitulo }, 'Clave de corrección'),
          React.createElement(
            Text,
            { key: 'cv', style: { fontSize: 9, lineHeight: 1.5 } },
            doc.preguntas.map((p) => `${p.numero}:${p.clave}`).join('   ')
          ),
        ]
      : [])
  );

  const documento = React.createElement(
    Document,
    { title: doc.titulo, creator: 'W-SIMCE' },
    React.createElement(
      Page,
      { size: [ancho, alto], style: s.pagina, wrap: true },
      ...hijos
    ),
    React.createElement(
      Page,
      { size: [ancho, alto], style: s.pagina },
      hojaRespuestas,
      React.createElement(
        Text,
        { style: s.pie, fixed: true },
        `${doc.colegio} · W-SIMCE`
      )
    )
  );

  const buffer = await renderToBuffer(documento);
  return Buffer.from(buffer);
}
