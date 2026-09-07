import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, 
  Package, Calendar, Search, Filter, AlertCircle, CheckCircle2, ArrowRight
} from 'lucide-react';
import { UISchema, UIComponent, UISection } from '../../types/builder';

interface DynamicRendererProps {
  schema: UISchema;
  data: Record<string, any>;
  onRefresh?: () => void;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ schema, data, onRefresh }) => {
  const [tableSearchTerms, setTableSearchTerms] = useState<Record<string, string>>({});

  const handleSearchChange = (compId: string, val: string) => {
    setTableSearchTerms(prev => ({ ...prev, [compId]: val }));
  };

  const renderMetric = (comp: UIComponent) => {
    const compData = data[comp.id] || {};
    const value = compData.formattedValue || (compData.value !== undefined ? String(compData.value) : 'Carregando...');
    const change = compData.changePercentage;
    const statusText = compData.statusText || comp.description;

    let Icon = DollarSign;
    if (comp.title.toLowerCase().includes('cliente')) Icon = Users;
    if (comp.title.toLowerCase().includes('pedido')) Icon = ShoppingBag;
    if (comp.title.toLowerCase().includes('produto') || comp.title.toLowerCase().includes('estoque')) Icon = Package;

    return (
      <div 
        key={comp.id}
        className="glass-card" 
        style={{ 
          padding: '18px 20px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {comp.title}
          </span>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Icon size={18} />
          </div>
        </div>

        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: 6 }}>
          {value}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
          {change !== undefined && (
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 2, 
              fontWeight: 700,
              color: change >= 0 ? '#10b981' : '#ef4444',
              background: change >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              padding: '2px 6px',
              borderRadius: 6
            }}>
              {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {change >= 0 ? `+${change}%` : `${change}%`}
            </span>
          )}
          <span style={{ color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {statusText}
          </span>
        </div>
      </div>
    );
  };

  const renderLineChart = (comp: UIComponent) => {
    const compData = data[comp.id] || {};
    const chartData: Array<{ label: string; value: number; secondaryValue?: number }> = compData.chartData || [];
    const hasData = chartData.length > 0 && chartData.some(d => d.value > 0 || (d.secondaryValue || 0) > 0);

    if (!hasData) {
      return (
        <div
          key={comp.id}
          className="glass-card"
          style={{
            padding: 20,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>{comp.title}</h3>
          {comp.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '0 0 16px 0' }}>{comp.description}</p>}
          <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-dim)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
            <AlertCircle size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '0.82rem' }}>Sem dados suficientes para exibir este gráfico.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.73rem', opacity: 0.6 }}>Os dados aparecerão aqui quando houver registros no período selecionado.</p>
          </div>
        </div>
      );
    }

    const maxVal = Math.max(...chartData.map(d => Math.max(d.value, d.secondaryValue || 0)), 100);
    const width = 500;
    const height = 180;
    const padding = 30;

    const pointsPrimary = chartData.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(chartData.length - 1, 1);
      const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    const pointsSecondary = chartData.filter(d => d.secondaryValue !== undefined).map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / Math.max(chartData.length - 1, 1);
      const y = height - padding - ((d.secondaryValue || 0) / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div 
        key={comp.id}
        className="glass-card" 
        style={{ 
          padding: 20, 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{comp.title}</h3>
            {comp.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>{comp.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#10b981' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> Receita
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> Despesas
            </span>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minHeight: 160 }}>
            <defs>
              <linearGradient id={`grad-primary-${comp.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Linhas de grade horizontais */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = height - padding - pct * (height - 2 * padding);
              return (
                <line 
                  key={idx} 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.06)" 
                  strokeDasharray="4 4" 
                />
              );
            })}

            {/* Linha Secundaria (Despesas) */}
            {pointsSecondary && (
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                points={pointsSecondary}
              />
            )}

            {/* Linha Principal (Receita) */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              points={pointsPrimary}
            />

            {/* Pontos */}
            {chartData.map((d, i) => {
              const x = padding + (i * (width - 2 * padding)) / Math.max(chartData.length - 1, 1);
              const y = height - padding - (d.value / maxVal) * (height - 2 * padding);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4.5" fill="#10b981" stroke="#0f172a" strokeWidth="2" />
                  <text x={x} y={height - 8} fontSize="10" fill="var(--text-dim)" textAnchor="middle">{d.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderDonutChart = (comp: UIComponent) => {
    const compData = data[comp.id] || {};
    const chartData: Array<{ label: string; value: number; category?: string }> = compData.chartData || [];
    const hasData = chartData.length > 0 && chartData.some(d => d.value > 0);

    if (!hasData) {
      return (
        <div
          key={comp.id}
          className="glass-card"
          style={{
            padding: 20,
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>{comp.title}</h3>
          {comp.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '0 0 16px 0' }}>{comp.description}</p>}
          <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-dim)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 10 }}>
            <AlertCircle size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '0.82rem' }}>Sem dados de pagamento registrados no período.</p>
          </div>
        </div>
      );
    }

    const total = chartData.reduce((acc, cur) => acc + cur.value, 0) || 1;
    let accumulatedAngle = 0;

    return (
      <div 
        key={comp.id}
        className="glass-card" 
        style={{ 
          padding: 20, 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14 
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{comp.title}</h3>
          {comp.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>{comp.description}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center' }}>
          {/* Donut SVG */}
          <div style={{ width: 140, height: 140, position: 'relative', margin: '0 auto' }}>
            <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {chartData.map((d, i) => {
                const percentage = (d.value / total) * 100;
                const strokeDasharray = `${percentage} ${100 - percentage}`;
                const strokeDashoffset = -accumulatedAngle;
                accumulatedAngle += percentage;
                const color = d.category || ['#10b981', '#6366f1', '#f59e0b', '#06b6d4'][i % 4];

                return (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.91549430918954"
                    fill="transparent"
                    stroke={color}
                    strokeWidth="5"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                  />
                );
              })}
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                R$ {total.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Legenda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {chartData.map((d, i) => {
              const percentage = ((d.value / total) * 100).toFixed(1);
              const color = d.category || ['#10b981', '#6366f1', '#f59e0b', '#06b6d4'][i % 4];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{d.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({percentage}%)</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>R$ {d.value.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTable = (comp: UIComponent) => {
    const compData = data[comp.id] || {};
    const rawRows: Array<Record<string, any>> = compData.tableRows || [];
    const search = tableSearchTerms[comp.id] || '';

    const filteredRows = rawRows.filter(r => {
      if (!search.trim()) return true;
      return Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
    });

    const columns = comp.columns || [
      { key: 'name', label: 'Nome' },
      { key: 'phone', label: 'Telefone' },
      { key: 'email', label: 'E-mail' },
      { key: 'status', label: 'Status' }
    ];

    return (
      <div 
        key={comp.id}
        className="glass-card" 
        style={{ 
          padding: 20, 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{comp.title}</h3>
            {comp.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>{comp.description}</p>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Filtrar nesta tabela..."
                value={search}
                onChange={(e) => handleSearchChange(comp.id, e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '7px 10px 7px 30px', 
                  fontSize: '0.8rem', 
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '6px 10px', borderRadius: 8 }}>
              {filteredRows.length} registros
            </span>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
            <AlertCircle size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhum registro encontrado para os critérios selecionados.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left' }}>
                  {columns.map(col => (
                    <th key={col.key} style={{ padding: '10px 12px', color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, rIdx) => (
                  <tr 
                    key={row.id || rIdx} 
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map(col => {
                      const val = row[col.key];
                      const isStatus = col.key === 'status';
                      const isAmount = col.key.includes('amount') || col.key.includes('total') || col.key.includes('spent');

                      return (
                        <td key={col.key} style={{ padding: '12px', color: 'var(--text-main)' }}>
                          {isStatus ? (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 4, 
                              fontSize: '0.72rem', 
                              padding: '3px 8px', 
                              borderRadius: 12,
                              fontWeight: 600,
                              background: String(val).toLowerCase().includes('pago') || String(val).toLowerCase().includes('ativo') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: String(val).toLowerCase().includes('pago') || String(val).toLowerCase().includes('ativo') ? '#10b981' : '#f59e0b'
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                              {val}
                            </span>
                          ) : isAmount ? (
                            <span style={{ fontWeight: 700, color: '#10b981' }}>{val}</span>
                          ) : (
                            val || '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderComponent = (comp: UIComponent) => {
    switch (comp.type) {
      case 'metric':
      case 'kpi':
        return renderMetric(comp);
      case 'chart':
        if (comp.chartType === 'donut' || comp.chartType === 'pie') {
          return renderDonutChart(comp);
        }
        return renderLineChart(comp);
      case 'table':
      case 'data_table':
      case 'list':
        return renderTable(comp);
      default:
        return renderMetric(comp);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {schema.sections.map(section => {
        const cols = section.columns || 1;
        return (
          <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {section.title && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  {section.title}
                </h2>
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, 
              gap: 16 
            }}>
              {section.components.map(comp => renderComponent(comp))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
