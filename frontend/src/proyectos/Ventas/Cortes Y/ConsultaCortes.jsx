import React, { useState } from 'react';
import './ConsultaCortes.css';

export default function ConsultaCortes() {
  const [numEmpleado, setNumEmpleado] = useState('');
  const [fechaInicial, setFechaInicial] = useState('2026-11-02');
  const [fechaFinal, setFechaFinal] = useState('2026-11-02');
  const [arqueo, setArqueo] = useState('< TODOS >');

  // Columnas exactas de la tabla de la imagen
  const columns = [
    { label: 'No. Corte Z', hasFilter: false },
    { label: 'No. Corte X', hasFilter: true },
    { label: 'No. Empleado', hasFilter: true },
    { label: 'Nombre', hasFilter: true },
    { label: 'Fecha Hora Inicio', hasFilter: true },
    { label: 'Fecha Hora Fin', hasFilter: true },
    { label: 'No. Ventas', hasFilter: true },
    { label: 'Fecha Ultimo Movimiento', hasFilter: true },
    { label: 'Total Movimientos Cortes Y', hasFilter: true },
    { label: 'Total Vendido', hasFilter: true },
    { label: 'Total Retirado', hasFilter: true },
    { label: 'Importe Descuento', hasFilter: true },
    { label: 'Total Devuelto', hasFilter: true },
    { label: 'Importe Real', hasFilter: true },
    { label: 'Cerrado', hasFilter: false },
    { label: 'Tiene Arqueo', hasFilter: false },
    { label: 'Depositos', hasFilter: true },
    { label: 'Retiros', hasFilter: true }
  ];

  // 17 filas vacías simuladas como en la captura
  const rows = Array.from({ length: 17 });

  return (
    <div className="erp-window">
      {/* Barra de Filtros Superior */}
      <section className="filter-panel">
        <div className="filter-row">
          <div className="filter-group">
            <label>No. Empleado:</label>
            <div className="input-search-container">
              <input
                type="text"
                className="input-text"
                value={numEmpleado}
                onChange={(e) => setNumEmpleado(e.target.value)}
              />
              <button className="btn-icon" title="Buscar empleado">🔍</button>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Fecha Inicial:</label>
            <input
              type="date"
              className="input-date"
              value={fechaInicial}
              onChange={(e) => setFechaInicial(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Fecha Final:</label>
            <input
              type="date"
              className="input-date"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Arqueo</label>
            <select
              className="select-field"
              value={arqueo}
              onChange={(e) => setArqueo(e.target.value)}
            >
              <option value="< TODOS >">&lt; TODOS &gt;</option>
              <option value="CON_ARQUEO">CON ARQUEO</option>
              <option value="SIN_ARQUEO">SIN ARQUEO</option>
            </select>
          </div>

          <button className="btn-erp btn-buscar">
            <span>Buscar</span>
            <span className="icon-binoculars">🔭</span>
          </button>
        </div>
      </section>

      {/* Contenedor de la Tabla / DataGrid */}
      <section className="grid-container">
        <div className="table-scroll-wrapper">
          <table className="erp-table">
            <thead>
              <tr>
                <th className="th-corner"></th>
                {columns.map((col, index) => (
                  <th key={index}>
                    <div className="th-content">
                      <span className="sort-arrows">⇅</span>
                      <span className="th-title">{col.label}</span>
                      {col.hasFilter && <span className="filter-icon">🔍</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((_, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="td-corner"></td>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fila inferior de Totales */}
        <div className="totales-bar">
          <div className="totales-label">Totales:</div>
          <div className="totales-values"></div>
        </div>
      </section>

      {/* Barra Inferior de Botones de Acción */}
      <footer className="action-toolbar">
        <div className="btn-grid-actions">
          {/* Fila superior de botones */}
          <button className="btn-erp btn-action">
            Arqueos <span className="badge-dollar">$</span>
          </button>
          <button className="btn-erp btn-action">
            Verifica Corte X <span className="badge-circle">🔽</span>
          </button>
          <button className="btn-erp btn-action">
            XLS Rem. <span className="icon-xls">X</span>
          </button>
          <button className="btn-erp btn-action">
            Ver Remesa <span className="icon-eye">👁</span>
          </button>

          {/* Fila inferior de botones */}
          <button className="btn-erp btn-action">
            Movimientos <span className="badge-dollar">$</span>
          </button>
          <button className="btn-erp btn-action">
            Importes Retiros <span className="badge-dollar">$</span>
          </button>
          <button className="btn-erp btn-action">
            Retiros <span className="badge-dollar">$</span>
          </button>
          <button className="btn-erp btn-action">
            Cerrar <span className="icon-close">✖</span>
          </button>
          <button className="btn-erp btn-action">
            Imprimir <span className="icon-print">🖶</span>
          </button>
        </div>
      </footer>
    </div>
  );
}