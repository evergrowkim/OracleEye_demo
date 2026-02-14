import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, ComposedChart, Scatter } from 'recharts';
import { 시스템상태, 매체피드, 주요이슈, 검증필요정보, 지역별여론, 감성추이, 매체별감성, 키워드목록, 모멘텀데이터, 교차검증세션, 정세보고, 지역별감성추이, 지역별매체감성, 지역별키워드, 지역별모멘텀 } from './data/mockData';
import './App.css';

// ===================== 색상 =====================
const C = {
  bg: '#F8FAFC', card: '#FFFFFF', text: '#1E293B', sub: '#64748B', muted: '#94A3B8',
  accent: '#2563EB', accentL: '#EFF6FF', accentB: '#BFDBFE',
  pos: '#059669', posL: '#ECFDF5', neg: '#DC2626', negL: '#FEF2F2',
  warn: '#D97706', warnL: '#FFFBEB', neutral: '#64748B', neutralL: '#F1F5F9',
  border: '#E2E8F0', borderD: '#CBD5E1', purple: '#7C3AED', purpleL: '#F5F3FF',
};

// ===================== 기초 컴포넌트 =====================
const Badge = ({ children, type = 'accent' }) => {
  const m = { 긍정: 'pos', 부정: 'neg', 중립: 'neutral', accent: 'accent', warning: 'warn', purple: 'purple' };
  const t = m[type] || m[children] || 'accent';
  const colors = { pos: [C.pos, C.posL], neg: [C.neg, C.negL], neutral: [C.neutral, C.neutralL], accent: [C.accent, C.accentL], warn: [C.warn, C.warnL], purple: [C.purple, C.purpleL] };
  const [c, bg] = colors[t] || colors.accent;
  return <span style={{ display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 600, color: c, background: bg, borderRadius: 4, letterSpacing: '0.3px' }}>{children}</span>;
};

const StatusBadge = ({ status }) => {
  const m = { 미검토: 'warn', 검토중: 'accent', 확인완료: 'pos', 조치필요: 'neg' };
  return <Badge type={m[status] || 'accent'}>{status}</Badge>;
};

const Card = ({ title, tag, right, children, flush, style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', ...style }}>
    {title && (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</span>
          {tag && <Badge>{tag}</Badge>}
        </div>
        {right}
      </div>
    )}
    <div style={{ padding: flush ? 0 : '14px 16px' }}>{children}</div>
  </div>
);

const MetricCard = ({ label, value, change, changeColor, note }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <div style={{ fontSize: 11, color: C.sub, fontWeight: 500, marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 24, fontWeight: 700, color: C.text, fontFeatureSettings: "'tnum'" }}>{value}</span>
      {change && <span style={{ fontSize: 12, fontWeight: 600, color: changeColor || C.sub }}>{change}</span>}
    </div>
    {note && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{note}</div>}
  </div>
);

const AttentionBar = ({ value }) => {
  const color = value >= 80 ? C.neg : value >= 60 ? C.warn : C.accent;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 3 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFeatureSettings: "'tnum'", minWidth: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
};

const SentimentBar = ({ pos, neu, neg, height = 8 }) => (
  <div style={{ display: 'flex', height, borderRadius: height / 2, overflow: 'hidden' }}>
    {pos > 0 && <div style={{ width: `${pos}%`, background: C.pos }} />}
    {neu > 0 && <div style={{ width: `${neu}%`, background: C.borderD }} />}
    {neg > 0 && <div style={{ width: `${neg}%`, background: C.neg }} />}
  </div>
);

const RegionBadge = ({ region }) => {
  const colors = { 서울: [C.accent, C.accentL], 경기: [C.purple, C.purpleL], 부산: [C.pos, C.posL], 전국: [C.sub, C.neutralL] };
  const [c, bg] = colors[region] || colors['전국'];
  return <span style={{ display: 'inline-block', padding: '2px 6px', fontSize: 10, fontWeight: 600, color: c, background: bg, borderRadius: 4 }}>{region}</span>;
};

const EmptyState = ({ region, label }) => (
  <div style={{ padding: 40, textAlign: 'center', color: C.muted }}>
    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{region} 전장 - {label} 데이터 없음</div>
    <div style={{ fontSize: 12 }}>현재 해당 지역의 데이터가 수집되지 않았습니다.</div>
  </div>
);

// ===================== 네비게이션 =====================
const Navigation = ({ current, onChange, selectedRegion, onRegionChange }) => {
  const tabs = [
    { id: '현황판', label: '종합 현황판' },
    { id: '여론', label: '여론 동향' },
    { id: '검증', label: '검증 필요 정보' },
    { id: '흐름', label: '흐름 분석' },
    { id: '교차검증', label: '다중 AI 검증' },
    { id: '보고', label: '일일 정세 보고' },
  ];
  const regions = [
    { id: '전국', label: '중앙당 전체' },
    { id: '서울', label: '서울 전장' },
    { id: '경기', label: '경기 전장' },
    { id: '부산', label: '부산 전장' },
  ];
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 52, background: C.card, borderBottom: `1px solid ${C.border}`, padding: '0 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
          <div style={{ width: 8, height: 8, background: C.accent, borderRadius: '50%' }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>Oracle EyE</span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              background: current === t.id ? C.accentL : 'transparent',
              border: 'none', borderBottom: current === t.id ? `2px solid ${C.accent}` : '2px solid transparent',
              color: current === t.id ? C.accent : C.sub,
              fontSize: 13, fontWeight: current === t.id ? 700 : 500,
              padding: '0 14px', height: 52, borderRadius: 0, transition: 'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, background: C.accentL, padding: '4px 10px', borderRadius: 4 }}>선거일 D-{시스템상태.D_Day}</span>
          <span style={{ fontSize: 12, color: C.sub }}>{시스템상태.현재일.replace(/-/g, '.')}</span>
          <span style={{ fontSize: 11, color: C.pos, fontWeight: 600, background: C.posL, padding: '3px 8px', borderRadius: 4 }}>{시스템상태.단계}</span>
        </div>
      </div>
      {/* 지역 선택 바 */}
      <div style={{ display: 'flex', alignItems: 'center', height: 36, background: selectedRegion !== '전국' ? C.purpleL : C.bg, borderBottom: `1px solid ${C.border}`, padding: '0 20px', gap: 8 }}>
        <span style={{ fontSize: 11, color: C.sub, fontWeight: 600, marginRight: 8 }}>지역 전장:</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {regions.map(r => (
            <button key={r.id} onClick={() => onRegionChange(r.id)} style={{
              background: selectedRegion === r.id ? (r.id === '전국' ? C.accent : C.purple) : 'transparent',
              border: `1px solid ${selectedRegion === r.id ? (r.id === '전국' ? C.accent : C.purple) : C.border}`,
              color: selectedRegion === r.id ? '#fff' : C.sub,
              fontSize: 11, fontWeight: selectedRegion === r.id ? 700 : 500,
              padding: '3px 12px', borderRadius: 4, transition: 'all 0.15s',
            }}>{r.label}</button>
          ))}
        </div>
        {selectedRegion !== '전국' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16, fontSize: 11, color: C.purple }}>
            <span style={{ color: C.sub }}>중앙당 전체 뷰</span>
            <span>›</span>
            <span style={{ fontWeight: 700 }}>{selectedRegion} 전장 뷰</span>
            <button onClick={() => onRegionChange('전국')} style={{
              background: 'transparent', border: `1px solid ${C.purple}40`, color: C.purple,
              fontSize: 10, padding: '1px 8px', borderRadius: 4, marginLeft: 8, fontWeight: 600,
            }}>전국 복귀</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== 화면 1: 종합 현황판 =====================
const Dashboard = ({ selectedRegion, onRegionChange, onScreenChange }) => {
  const [feedFilter, setFeedFilter] = useState('전체');

  const regionSentiment = useMemo(() => {
    const data = 지역별감성추이[selectedRegion] || 감성추이;
    return data;
  }, [selectedRegion]);

  const filteredIssues = useMemo(() => {
    if (selectedRegion === '전국') return 주요이슈;
    return 주요이슈.filter(i => i.지역 === selectedRegion || i.지역 === '전국');
  }, [selectedRegion]);

  const filteredFeed = useMemo(() => {
    let feed = 매체피드;
    if (selectedRegion !== '전국') feed = feed.filter(f => f.지역 === selectedRegion || f.지역 === '전국');
    if (feedFilter !== '전체') feed = feed.filter(f => f.매체 === feedFilter);
    return feed;
  }, [selectedRegion, feedFilter]);

  const 최근7일 = regionSentiment.slice(-7);

  // 지역별 지표 데이터
  const regionMetrics = useMemo(() => {
    if (selectedRegion === '전국') {
      return {
        지지율: '44.0%', 지지율변화: '+2.0%p',
        대통령: '59.6%', 대통령변화: '+1.2%p',
        수집: '3,247', 수집상세: '뉴스 587 / SNS 1,842 / 기타 818',
        긍정: '48%', 긍정변화: '+4%p',
        검증: '5건', 검증상세: '2건 미검토',
      };
    }
    const d = 지역별여론[selectedRegion];
    const regFeed = 매체피드.filter(f => f.지역 === selectedRegion);
    const regVerify = 검증필요정보.filter(v => v.지역 === selectedRegion);
    const 미검토 = regVerify.filter(v => v.상태 === '미검토').length;
    return {
      지지율: selectedRegion === '서울' ? '48.2%' : selectedRegion === '경기' ? '44.8%' : '42.5%',
      지지율변화: selectedRegion === '서울' ? '+3.2%p' : selectedRegion === '경기' ? '+1.8%p' : '+2.5%p',
      대통령: '59.6%', 대통령변화: '+1.2%p',
      수집: `${d?.건수 || 0}건`, 수집상세: `피드 ${regFeed.length}건`,
      긍정: `${d?.긍정 || 0}%`, 긍정변화: `${d?.변화 || '0'}%p`,
      검증: `${regVerify.length}건`, 검증상세: 미검토 > 0 ? `${미검토}건 미검토` : '전수 검토 완료',
    };
  }, [selectedRegion]);

  return (
    <div className="page-content fade-in">
      {/* 핵심 지표 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard label={selectedRegion !== '전국' ? `체감 지지율 (${selectedRegion})` : '당 지지율 (KSOI)'} value={regionMetrics.지지율} change={regionMetrics.지지율변화} changeColor={C.pos} note={selectedRegion !== '전국' ? `${selectedRegion} 전장 기준` : '직전 주 대비'} />
        <MetricCard label="대통령 긍정 평가" value={regionMetrics.대통령} change={regionMetrics.대통령변화} changeColor={C.pos} note="KSOI 2/9~10 조사" />
        <MetricCard label={selectedRegion !== '전국' ? `${selectedRegion} 수집 건수` : '금일 수집 건수'} value={regionMetrics.수집} change={regionMetrics.수집상세} note={selectedRegion !== '전국' ? `${selectedRegion} 지역 필터` : '전일 대비 +15%'} />
        <MetricCard label={selectedRegion !== '전국' ? `${selectedRegion} 긍정 여론` : '긍정 여론 비율'} value={regionMetrics.긍정} change={regionMetrics.긍정변화} changeColor={C.pos} note={selectedRegion !== '전국' ? `${selectedRegion} 지역` : '14일 최고치'} />
        <MetricCard label="검증 필요 정보" value={regionMetrics.검증} change={regionMetrics.검증상세} changeColor={C.warn} note={selectedRegion !== '전국' ? `${selectedRegion} 관련` : '금일 감지'} />
      </div>

      {/* 감성 추이 + 3대 전장 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card title={selectedRegion !== '전국' ? `${selectedRegion} 여론 감성 추이` : '여론 감성 추이'} tag="최근 7일">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={최근7일} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="일자" tick={{ fontSize: 11, fill: C.muted }} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} domain={[20, 55]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
              <Area type="monotone" dataKey="긍정" stroke={C.pos} fill={C.pos} fillOpacity={0.1} strokeWidth={2.5} name="긍정 %" />
              <Area type="monotone" dataKey="부정" stroke={C.neg} fill={C.neg} fillOpacity={0.05} strokeWidth={2} strokeDasharray="6 3" name="부정 %" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="3대 전장 여론 현황" tag="서울 / 경기 / 부산">
          {Object.entries(지역별여론).map(([region, d]) => (
            <div key={region} onClick={() => { onRegionChange(region); onScreenChange('여론'); }} style={{
              borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
              background: selectedRegion === region ? C.purpleL : 'transparent',
              margin: selectedRegion === region ? '0 -16px' : 0,
              padding: selectedRegion === region ? '10px 16px' : '10px 0',
              borderRadius: selectedRegion === region ? 4 : 0,
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{region}</span>
                  <span style={{ fontSize: 11, color: d.변화.startsWith('+') ? C.pos : C.neg, fontWeight: 600 }}>{d.변화}%p</span>
                  {selectedRegion === region && <span style={{ fontSize: 10, color: C.purple, fontWeight: 600 }}>선택됨</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.sub }}>{d.건수}건</span>
                  <span style={{ fontSize: 10, color: C.purple }}>클릭하여 상세 보기 ›</span>
                </div>
              </div>
              <SentimentBar pos={d.긍정} neu={d.중립} neg={d.부정} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: C.pos }}>긍정 {d.긍정}%</span>
                <span style={{ fontSize: 10, color: C.sub }}>중립 {d.중립}%</span>
                <span style={{ fontSize: 10, color: C.neg }}>부정 {d.부정}%</span>
              </div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{d.핵심이슈}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* 주요 이슈 + 실시간 피드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card title={selectedRegion !== '전국' ? `${selectedRegion} 주요 이슈` : '오늘의 주요 이슈'} tag={`상위 ${Math.min(filteredIssues.length, 7)}건`}>
          {filteredIssues.slice(0, 7).map((issue, idx) => (
            <div key={issue.순위} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.muted, minWidth: 20 }}>{idx + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{issue.제목}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge type={issue.감성}>{issue.감성}</Badge>
                  <span style={{ fontSize: 11, color: C.sub }}>{issue.건수}건</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: issue.속도 === '급상승' ? C.neg : issue.속도 === '상승' ? C.pos : C.sub }}>{issue.속도}</span>
                  <Badge>{issue.태그}</Badge>
                  {selectedRegion === '전국' && issue.지역 !== '전국' && <RegionBadge region={issue.지역} />}
                </div>
              </div>
            </div>
          ))}
        </Card>

        <Card title="매체 실시간 피드" tag={selectedRegion !== '전국' ? selectedRegion : '타파크로스'} flush right={
          <div style={{ display: 'flex', gap: 4 }}>
            {['전체', '뉴스', 'SNS', '커뮤니티', '유튜브'].map(f => (
              <button key={f} onClick={() => setFeedFilter(f)} style={{
                background: feedFilter === f ? C.accentL : 'transparent',
                border: `1px solid ${feedFilter === f ? C.accentB : C.border}`,
                borderRadius: 4, padding: '3px 8px', color: feedFilter === f ? C.accent : C.sub,
                fontSize: 11, fontWeight: 500,
              }}>{f}</button>
            ))}
          </div>
        }>
          <div style={{ maxHeight: 380, overflow: 'auto' }}>
            {filteredFeed.length === 0 ? (
              <EmptyState region={selectedRegion} label="매체 피드" />
            ) : filteredFeed.map(item => (
              <div key={item.id} style={{
                display: 'grid', gridTemplateColumns: '80px 56px 80px 1fr 48px',
                gap: 8, alignItems: 'center', padding: '8px 16px',
                borderBottom: `1px solid ${C.border}`, fontSize: 12,
              }}>
                <span style={{ color: C.muted, fontSize: 11, fontFeatureSettings: "'tnum'" }}>{item.시간.split(' ')[1] || item.시간}</span>
                <Badge type={item.매체 === '뉴스' ? 'accent' : item.매체 === 'SNS' ? 'purple' : item.매체 === '유튜브' ? 'neg' : 'warning'}>{item.매체}</Badge>
                <span style={{ color: C.sub, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.출처}</span>
                <span style={{ color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.제목}</span>
                <Badge type={item.감성}>{item.감성}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ===================== 화면 2: 여론 동향 =====================
const SentimentView = ({ selectedRegion }) => {
  const mediaData = 지역별매체감성[selectedRegion] || 매체별감성;
  const sentimentData = 지역별감성추이[selectedRegion] || 감성추이;
  const keywords = 지역별키워드[selectedRegion] || 키워드목록;

  return (
    <div className="page-content fade-in">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* 매체별 감성 분포 */}
        <Card title={selectedRegion !== '전국' ? `${selectedRegion} 매체별 여론 분포` : '매체별 여론 분포'} tag={selectedRegion !== '전국' ? `${selectedRegion} 전장` : '타파크로스 분류 기준'}>
          {mediaData.map(m => (
            <div key={m.매체} style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m.매체}</span>
                <span style={{ fontSize: 11, color: C.sub }}>{m.총}건</span>
              </div>
              <SentimentBar pos={m.긍정} neu={m.중립} neg={m.부정} height={10} />
              <div style={{ display: 'flex', gap: 12, fontSize: 10, marginTop: 4 }}>
                <span style={{ color: C.pos }}>긍정 {m.긍정}%</span>
                <span style={{ color: C.sub }}>중립 {m.중립}%</span>
                <span style={{ color: C.neg }}>부정 {m.부정}%</span>
              </div>
            </div>
          ))}
        </Card>

        {/* 지역별 비교 */}
        <Card title="전장 지역별 여론 비교" tag="서울 / 경기 / 부산">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                {['항목', '서울', '경기', '부산'].map(h => (
                  <th key={h} style={{
                    textAlign: h === '항목' ? 'left' : 'center', padding: 8, color: C.sub, fontWeight: 600, fontSize: 11,
                    background: (h === selectedRegion) ? C.purpleL : 'transparent',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { 항목: '긍정 여론', 값: [지역별여론.서울.긍정, 지역별여론.경기.긍정, 지역별여론.부산.긍정], color: C.pos, suffix: '%' },
                { 항목: '부정 여론', 값: [지역별여론.서울.부정, 지역별여론.경기.부정, 지역별여론.부산.부정], color: C.neg, suffix: '%' },
                { 항목: '변화폭', 값: [지역별여론.서울.변화, 지역별여론.경기.변화, 지역별여론.부산.변화], color: C.pos, suffix: '%p' },
                { 항목: '수집 건수', 값: [지역별여론.서울.건수, 지역별여론.경기.건수, 지역별여론.부산.건수], color: C.text, suffix: '건' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 8px', color: C.sub }}>{row.항목}</td>
                  {row.값.map((v, j) => {
                    const regionName = ['서울', '경기', '부산'][j];
                    return (
                      <td key={j} style={{
                        textAlign: 'center', padding: '10px 8px', fontWeight: 600, color: row.color,
                        fontFeatureSettings: "'tnum'",
                        background: regionName === selectedRegion ? C.purpleL : 'transparent',
                      }}>{v}{row.suffix}</td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td style={{ padding: '10px 8px', color: C.sub }}>핵심 이슈</td>
                {Object.entries(지역별여론).map(([region, d]) => (
                  <td key={region} style={{
                    textAlign: 'center', padding: '10px 8px', fontSize: 11, color: C.text, lineHeight: 1.4,
                    background: region === selectedRegion ? C.purpleL : 'transparent',
                  }}>{d.핵심이슈}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      {/* 감성 추이 14일 */}
      <Card title={selectedRegion !== '전국' ? `${selectedRegion} 감성 추이` : '감성 추이'} tag="최근 14일" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={sentimentData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="일자" tick={{ fontSize: 11, fill: C.muted }} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} domain={[15, 55]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="긍정" stroke={C.pos} fill={C.pos} fillOpacity={0.1} strokeWidth={2.5} name="긍정 %" />
            <Area type="monotone" dataKey="부정" stroke={C.neg} fill={C.neg} fillOpacity={0.05} strokeWidth={2} strokeDasharray="6 3" name="부정 %" />
            <Area type="monotone" dataKey="중립" stroke={C.muted} fill={C.muted} fillOpacity={0.03} strokeWidth={1} strokeDasharray="3 3" name="중립 %" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* 주요 키워드 */}
      <Card title={selectedRegion !== '전국' ? `${selectedRegion} 주요 언급 키워드` : '주요 언급 키워드'} tag="빈도 기준">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {keywords.map(k => {
            const size = Math.max(12, Math.min(22, 10 + k.빈도 * 0.05));
            const color = k.감성 === '긍정' ? C.pos : k.감성 === '부정' ? C.neg : C.sub;
            return (
              <span key={k.키워드} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${C.border}`,
                fontSize: size, fontWeight: size > 16 ? 700 : 500,
                color, background: C.bg, cursor: 'pointer', transition: 'all 0.15s',
              }}>{k.키워드} <span style={{ fontSize: 10, color: C.muted }}>{k.빈도}</span></span>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ===================== 화면 3: 검증 필요 정보 =====================
const VerificationView = ({ selectedRegion }) => {
  const filteredItems = useMemo(() => {
    if (selectedRegion === '전국') return 검증필요정보;
    return 검증필요정보.filter(i => i.지역 === selectedRegion || i.지역 === '전국');
  }, [selectedRegion]);

  const [selected, setSelected] = useState(null);
  // 첫 렌더 시 선택
  const currentSelected = selected && filteredItems.find(i => i.번호 === selected.번호) ? selected : filteredItems[0];

  return (
    <div className="page-content fade-in">
      {/* AI 분류 원칙 */}
      <div style={{ background: C.accentL, border: `1px solid ${C.accentB}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 4, height: 32, background: C.accent, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>AI 분류 원칙</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
            아래 목록은 AI가 "교차 검증이 필요하다"고 분류한 정보입니다. AI는 사실 여부를 판단하지 않으며, 검토에 필요한 근거와 대조 자료를 제시합니다. 모든 판단은 담당자의 검토를 거쳐 확정됩니다.
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState region={selectedRegion} label="검증 필요 정보" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 16 }}>
          {/* 목록 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredItems.map(item => (
              <div key={item.번호} onClick={() => setSelected(item)} style={{
                background: currentSelected?.번호 === item.번호 ? C.accentL : C.card,
                border: `1px solid ${currentSelected?.번호 === item.번호 ? C.accentB : C.border}`,
                borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
                borderLeft: `4px solid ${item.주의지수 >= 80 ? C.neg : item.주의지수 >= 60 ? C.warn : C.accent}`,
                transition: 'all 0.15s', boxShadow: currentSelected?.번호 === item.번호 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: C.muted }}>{item.번호}</span>
                    <StatusBadge status={item.상태} />
                    <RegionBadge region={item.지역} />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: item.주의지수 >= 80 ? C.neg : item.주의지수 >= 60 ? C.warn : C.accent, fontFeatureSettings: "'tnum'" }}>{item.주의지수}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>{item.제목}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge>{item.매체}</Badge>
                  <span style={{ fontSize: 10, color: C.sub }}>확산 {item.확산}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 상세 */}
          {currentSelected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card title="상세 정보" tag={currentSelected.번호}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 12 }}>{currentSelected.제목}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <StatusBadge status={currentSelected.상태} />
                  <Badge>{currentSelected.매체}</Badge>
                  <RegionBadge region={currentSelected.지역} />
                  <span style={{ fontSize: 11, color: C.sub, alignSelf: 'center' }}>감지: {currentSelected.감지시각}</span>
                </div>

                <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, fontWeight: 600 }}>주의 지수</div>
                  <AttentionBar value={currentSelected.주의지수} />
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>확산 속도: <span style={{ color: C.warn, fontWeight: 600 }}>{currentSelected.확산}</span></div>
                </div>

                <div style={{ background: C.bg, borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, fontWeight: 600 }}>검토 필요 근거 (AI 분류)</div>
                  {currentSelected.근거.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < currentSelected.근거.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, minWidth: 16 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: C.posL, borderRadius: 8, padding: 14, marginBottom: 12, border: `1px solid ${C.pos}20` }}>
                  <div style={{ fontSize: 11, color: C.pos, marginBottom: 6, fontWeight: 600 }}>대조 가능 정보 (RAG 검색 결과)</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>{currentSelected.대조정보}</div>
                </div>

                <div style={{ background: C.accentL, borderRadius: 8, padding: 14, marginBottom: 16, border: `1px solid ${C.accentB}` }}>
                  <div style={{ fontSize: 11, color: C.accent, marginBottom: 6, fontWeight: 600 }}>검토 권고 사항</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6 }}>{currentSelected.조치안}</div>
                </div>

                <div style={{ fontSize: 11, color: C.sub, marginBottom: 8, fontWeight: 600 }}>검토 결과 입력</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: '확인 완료 (사실 부합)', color: C.pos },
                    { label: '추가 조치 필요', color: C.warn },
                    { label: '확인 완료 (사실과 다름)', color: C.neg },
                  ].map(btn => (
                    <button key={btn.label} style={{
                      background: C.card, border: `1px solid ${btn.color}40`, borderRadius: 8,
                      padding: '12px 8px', color: btn.color, fontSize: 12, fontWeight: 600,
                    }}>{btn.label}</button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ===================== 화면 4: 흐름 분석 (모멘텀) =====================
const MomentumView = ({ selectedRegion }) => {
  const momentumData = 지역별모멘텀[selectedRegion] || 모멘텀데이터;
  const 최근데이터 = momentumData.slice(-14);
  const latest = momentumData[momentumData.length - 1];
  const prev = momentumData[momentumData.length - 2];
  const acceleration = latest.속도 - prev.속도;
  const velocityLabel = latest.속도 >= 2 ? '강한 상승' : latest.속도 >= 0.5 ? '완만한 상승' : latest.속도 >= -0.5 ? '보합' : latest.속도 >= -2 ? '완만한 하락' : '강한 하락';
  const accelLabel = acceleration > 0 ? '가속' : acceleration < 0 ? '감속' : '유지';

  // 지역별 요약 데이터
  const regionSummaries = useMemo(() => {
    return ['서울', '경기', '부산'].map(r => {
      const d = 지역별모멘텀[r];
      const last = d[d.length - 1];
      const secondLast = d[d.length - 2];
      const accel = last.속도 - secondLast.속도;
      return { 지역: r, 체감: last.체감지지율, 속도: last.속도, 가속: accel > 0.1 ? '가속' : accel < -0.1 ? '감속' : '보합' };
    });
  }, []);

  return (
    <div className="page-content fade-in">
      {/* 주의 문구 */}
      <div style={{ background: C.warnL, border: `1px solid ${C.warn}30`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 11, color: C.warn, fontWeight: 500 }}>
        체감 지지율은 SNS/뉴스/검색 데이터 기반 보조 추정 지표이며, 공식 여론조사를 대체하지 않습니다.
        {selectedRegion !== '전국' && ` (현재 ${selectedRegion} 전장 데이터를 표시하고 있습니다)`}
      </div>

      {/* 핵심 지표 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <MetricCard label={`체감 지지율 (${selectedRegion !== '전국' ? selectedRegion : 'AI 추정'})`} value={`${latest.체감지지율}%`} change={`${latest.속도 >= 0 ? '+' : ''}${latest.속도}%p/일`} changeColor={latest.속도 >= 0 ? C.pos : C.neg} note="보조 추정 지표" />
        <MetricCard label="속도 (1차 미분)" value={velocityLabel} change={`${latest.속도 >= 0 ? '+' : ''}${latest.속도}%p`} changeColor={latest.속도 >= 0 ? C.pos : C.neg} note="전일 대비 변화" />
        <MetricCard label="가속도 (2차 미분)" value={accelLabel} change={`${acceleration >= 0 ? '+' : ''}${acceleration.toFixed(1)}%p`} changeColor={acceleration >= 0 ? C.pos : C.neg} note="속도 변화율" />
        <MetricCard label="7일 이동평균" value={`${latest.MA7}%`} change={`21일 MA: ${latest.MA21}%`} changeColor={latest.MA7 > latest.MA21 ? C.pos : C.neg} note={latest.MA7 > latest.MA21 ? '상승 추세' : '하락 추세'} />
      </div>

      {/* 모멘텀 차트 */}
      <Card title={selectedRegion !== '전국' ? `${selectedRegion} 체감 지지율 추이` : '체감 지지율 추이'} tag={selectedRegion !== '전국' ? '최근 14일' : '최근 30일'} style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={momentumData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="일자" tick={{ fontSize: 10, fill: C.muted }} interval={selectedRegion !== '전국' ? 1 : 2} />
            <YAxis tick={{ fontSize: 11, fill: C.muted }} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="체감지지율" stroke={C.accent} fill={C.accent} fillOpacity={0.1} strokeWidth={2.5} name="체감 지지율" />
            <Line type="monotone" dataKey="MA7" stroke={C.pos} strokeWidth={1.5} dot={false} name="7일 이동평균" />
            <Line type="monotone" dataKey="MA21" stroke={C.warn} strokeWidth={1.5} dot={false} strokeDasharray="6 3" name="21일 이동평균" />
            <Scatter dataKey="공식지지율" fill={C.neg} name="공식 여론조사" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 속도 차트 */}
      <Card title="속도 (일일 변화량)" tag="%p/일">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={최근데이터} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="일자" tick={{ fontSize: 10, fill: C.muted }} />
            <YAxis tick={{ fontSize: 10, fill: C.muted }} domain={[-1.5, 1.5]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <ReferenceLine y={0} stroke={C.borderD} />
            <Bar dataKey="속도" name="속도 (%p/일)">
              {최근데이터.map((entry, index) => (
                <Cell key={index} fill={entry.속도 >= 0 ? C.pos : C.neg} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 지역별 현황 */}
      <Card title="전장 지역별 흐름 요약" tag="체감 지지율 기준" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: selectedRegion !== '전국' ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {(selectedRegion !== '전국' ? regionSummaries.filter(r => r.지역 === selectedRegion) : regionSummaries).map(r => (
            <div key={r.지역} style={{
              background: r.지역 === selectedRegion ? C.purpleL : C.bg,
              borderRadius: 8, padding: 16,
              border: `1px solid ${r.지역 === selectedRegion ? C.purple : C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{r.지역}</span>
                {r.지역 === selectedRegion && selectedRegion !== '전국' && <span style={{ fontSize: 10, color: C.purple, fontWeight: 600 }}>현재 선택</span>}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, fontFeatureSettings: "'tnum'", marginBottom: 4 }}>{r.체감}%</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                <span style={{ color: r.속도 >= 0 ? C.pos : C.neg, fontWeight: 600 }}>{r.속도 >= 0 ? '↑' : '↓'}{r.속도 >= 0 ? '+' : ''}{r.속도}%p/일</span>
                <span style={{ color: C.sub }}>{r.가속}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ===================== 화면 5: 다중 AI 교차 검증 =====================
const CrossVerificationView = ({ selectedRegion }) => {
  const filteredSessions = useMemo(() => {
    if (selectedRegion === '전국') return 교차검증세션;
    return 교차검증세션.filter(s => s.지역 === selectedRegion || s.지역 === '전국');
  }, [selectedRegion]);

  const [selectedSession, setSelectedSession] = useState(null);
  const currentSession = selectedSession && filteredSessions.find(s => s.id === selectedSession.id) ? selectedSession : filteredSessions[0];

  if (!currentSession) return <div className="page-content fade-in"><EmptyState region={selectedRegion} label="교차 검증 세션" /></div>;

  const consensusColors = { '강한 합의': [C.pos, C.posL], '대체로 합의': [C.accent, C.accentL], '이견 존재': [C.warn, C.warnL], '주의 필요': [C.neg, C.negL] };
  const [cc, cbg] = consensusColors[currentSession.합의도] || consensusColors['대체로 합의'];
  const personaIcons = { 정량: '📊', 정성: '🌊', 역사: '🕰️', 반론: '🛡️' };

  return (
    <div className="page-content fade-in">
      {/* 세션 선택 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {filteredSessions.map(s => {
          const [sc, sbg] = consensusColors[s.합의도] || consensusColors['대체로 합의'];
          return (
            <button key={s.id} onClick={() => setSelectedSession(s)} style={{
              background: currentSession.id === s.id ? C.accentL : C.card,
              border: `1px solid ${currentSession.id === s.id ? C.accentB : C.border}`,
              borderRadius: 8, padding: '10px 16px', textAlign: 'left', flex: 1, minWidth: 200,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.이슈}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.muted }}>{s.일시}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: sbg, color: sc, fontWeight: 600 }}>{s.합의도}</span>
                <RegionBadge region={s.지역} />
              </div>
            </button>
          );
        })}
      </div>

      {/* 합의도 배지 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{currentSession.이슈}</span>
            <RegionBadge region={currentSession.지역} />
          </div>
          <div style={{ fontSize: 12, color: C.sub }}>분석 일시: {currentSession.일시} | 트리거: {currentSession.트리거} | * AI 분석 결과이며, 최종 판단은 담당자의 몫입니다</div>
        </div>
        <span style={{ padding: '6px 16px', borderRadius: 20, background: cbg, color: cc, fontWeight: 700, fontSize: 13 }}>{currentSession.합의도}</span>
      </div>

      {/* 4개 페르소나 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {Object.entries(currentSession.분석).filter(([key]) => key !== '종합').map(([key, text]) => {
          const names = { 정량: '정량 분석관', 정성: '정성 분석관', 역사: '역사 분석관', 반론: '반론 분석관' };
          return (
            <div key={key} style={{ background: C.bg, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{personaIcons[key]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: key === '반론' ? C.warn : C.text }}>{names[key]}</span>
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>{text}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                {currentSession.키워드.slice(0, 3).map(kw => (
                  <span key={kw} style={{ fontSize: 10, padding: '2px 6px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, color: C.sub }}>{kw}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 종합 판관 */}
      <Card title="종합 판관 요약" tag="5개 분석 통합">
        <div style={{ fontSize: 13, lineHeight: 1.8, color: C.text }}>{currentSession.종합}</div>
      </Card>
    </div>
  );
};

// ===================== 화면 6: 일일 정세 보고 =====================
const DailyReport = ({ selectedRegion }) => {
  const filteredIssues = useMemo(() => {
    if (selectedRegion === '전국') return 주요이슈;
    return 주요이슈.filter(i => i.지역 === selectedRegion || i.지역 === '전국');
  }, [selectedRegion]);

  const filteredVerify = useMemo(() => {
    if (selectedRegion === '전국') return 검증필요정보;
    return 검증필요정보.filter(v => v.지역 === selectedRegion || v.지역 === '전국');
  }, [selectedRegion]);

  const reportTitle = selectedRegion !== '전국' ? `일일 정세 보고 - ${selectedRegion} 전장` : '일일 정세 보고';

  return (
    <div className="page-content fade-in" style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.sub }}>PDF 출력용 보고서 구성안</span>
          {selectedRegion !== '전국' && <RegionBadge region={selectedRegion} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Badge>A4 기준</Badge>
          <button style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>PDF 다운로드</button>
        </div>
      </div>

      {/* 1페이지 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 8, right: 12, fontSize: 10, color: C.muted }}>1 / 2 쪽</span>

        {/* 머리글 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: `2px solid ${selectedRegion !== '전국' ? C.purple : C.accent}` }}>
          <div>
            <div style={{ fontSize: 11, color: selectedRegion !== '전국' ? C.purple : C.accent, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>Oracle EyE</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{reportTitle}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{정세보고.일자}</div>
            <div style={{ fontSize: 11, color: C.sub }}>선거일 {정세보고.D_Day} | {정세보고.단계}</div>
          </div>
        </div>

        {/* 정세 요약 */}
        <div style={{ background: C.bg, borderRadius: 8, padding: 16, marginBottom: 20, borderLeft: `4px solid ${selectedRegion !== '전국' ? C.purple : C.accent}` }}>
          <div style={{ fontSize: 12, color: selectedRegion !== '전국' ? C.purple : C.accent, fontWeight: 700, marginBottom: 6 }}>정세 요약{selectedRegion !== '전국' ? ` (${selectedRegion})` : ''}</div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>{정세보고.요약}</div>
        </div>

        {/* 핵심 지표 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: '당 지지율', value: 정세보고.핵심지표.당지지율, change: 정세보고.핵심지표.당지지율변화 },
            { label: '대통령 긍정', value: 정세보고.핵심지표.대통령지지율, change: 정세보고.핵심지표.대통령지지율변화 },
            { label: '긍정 여론', value: 정세보고.핵심지표.긍정여론, change: 정세보고.핵심지표.긍정변화 },
            { label: '수집 건수', value: 정세보고.핵심지표.수집건수 },
            { label: '검증 필요', value: 정세보고.핵심지표.검증필요 },
          ].map((m, i) => (
            <div key={i} style={{ background: C.bg, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFeatureSettings: "'tnum'" }}>{m.value}</div>
              {m.change && <div style={{ fontSize: 10, color: C.pos, fontWeight: 600 }}>{m.change}</div>}
            </div>
          ))}
        </div>

        {/* 3대 전장 */}
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>전장 지역별 동향</div>
        <div style={{ display: 'grid', gridTemplateColumns: selectedRegion !== '전국' ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {Object.entries(지역별여론)
            .filter(([region]) => selectedRegion === '전국' || region === selectedRegion)
            .map(([region, d]) => (
              <div key={region} style={{
                background: region === selectedRegion && selectedRegion !== '전국' ? C.purpleL : C.bg,
                borderRadius: 8, padding: 12,
                border: `1px solid ${region === selectedRegion && selectedRegion !== '전국' ? C.purple : 'transparent'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{region}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.pos }}>{d.변화}%p</span>
                </div>
                <SentimentBar pos={d.긍정} neu={d.중립} neg={d.부정} height={6} />
                <div style={{ fontSize: 10, color: C.sub, lineHeight: 1.4, marginTop: 6 }}>{d.핵심이슈}</div>
              </div>
            ))}
        </div>

        {/* 주요 이슈 테이블 */}
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>주요 이슈{selectedRegion !== '전국' ? ` (${selectedRegion})` : ''}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              {['순위', '이슈', '감성', '건수', '추세', '분류'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: C.sub, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredIssues.slice(0, 5).map((issue, idx) => (
              <tr key={issue.순위} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: 8, color: C.muted, fontWeight: 700 }}>{idx + 1}</td>
                <td style={{ padding: 8 }}>{issue.제목}</td>
                <td style={{ padding: 8 }}><Badge type={issue.감성}>{issue.감성}</Badge></td>
                <td style={{ padding: 8, color: C.sub }}>{issue.건수}</td>
                <td style={{ padding: 8, color: issue.속도 === '급상승' ? C.neg : issue.속도 === '상승' ? C.pos : C.sub, fontWeight: 600 }}>{issue.속도}</td>
                <td style={{ padding: 8 }}><Badge>{issue.태그}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2페이지 */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 8, right: 12, fontSize: 10, color: C.muted }}>2 / 2 쪽</span>

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>검증 필요 정보 현황{selectedRegion !== '전국' ? ` (${selectedRegion})` : ''}</div>
        {filteredVerify.slice(0, 3).map(item => (
          <div key={item.번호} style={{ padding: 12, marginBottom: 10, background: C.bg, borderRadius: 8, borderLeft: `4px solid ${item.주의지수 >= 80 ? C.neg : item.주의지수 >= 60 ? C.warn : C.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: C.muted }}>{item.번호}</span>
                <StatusBadge status={item.상태} />
                <Badge>{item.매체}</Badge>
                <RegionBadge region={item.지역} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: item.주의지수 >= 80 ? C.neg : C.warn, fontFeatureSettings: "'tnum'" }}>{item.주의지수}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{item.제목}</div>
            <AttentionBar value={item.주의지수} />
            <div style={{ fontSize: 10, color: C.sub, marginTop: 4 }}>확산: {item.확산} | 권고: {item.조치안}</div>
          </div>
        ))}

        {/* 권장 검토 사항 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 8 }}>권장 검토 사항</div>
          <div style={{ background: C.accentL, borderRadius: 8, padding: 14, border: `1px solid ${C.accentB}` }}>
            {정세보고.권장검토.map((item, i) => {
              const colors = { danger: C.neg, warning: C.warn, info: C.accent };
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < 2 ? `1px solid ${C.accentB}` : 'none' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: colors[item.색상], minWidth: 16 }}>{item.우선}</span>
                  <span style={{ fontSize: 12, lineHeight: 1.6 }}>{item.내용}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 꼬리글 */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
          <span>Oracle EyE v1.0 | Doaz Inc. | 대외비</span>
          <span>본 보고서는 AI가 생성한 초안이며, 모든 외부 조치는 담당자 검토 후 시행하시기 바랍니다.</span>
        </div>
      </div>
    </div>
  );
};

// ===================== 메인 앱 =====================
export default function App() {
  const [screen, setScreen] = useState('현황판');
  const [selectedRegion, setSelectedRegion] = useState('전국');

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <Navigation current={screen} onChange={setScreen} selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
      {screen === '현황판' && <Dashboard selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} onScreenChange={setScreen} />}
      {screen === '여론' && <SentimentView selectedRegion={selectedRegion} />}
      {screen === '검증' && <VerificationView selectedRegion={selectedRegion} />}
      {screen === '흐름' && <MomentumView selectedRegion={selectedRegion} />}
      {screen === '교차검증' && <CrossVerificationView selectedRegion={selectedRegion} />}
      {screen === '보고' && <DailyReport selectedRegion={selectedRegion} />}
    </div>
  );
}
