import { useState, useEffect } from "preact/hooks";
import styled from "styled-components";
import { Link } from "preact-router";
import {
  Activity,
  ChartColumn,
  CircleCheck,
  FileText,
  PenLine,
  Settings,
  WholeWord,
  X,
} from "lucide-preact";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  borderRadius: "10px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
  fontSize: 13,
};

const StatCard = ({ title, value, subtitle, icon, color = "#6296d3" }) => (
  <div className="stat-card">
    <div className="stat-header">
      <div
        className="stat-icon"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  </div>
);

const Home = ({ className }) => {
  const [proposals, setProposals] = useState([]);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() =>
    Boolean(getFromStorage(STORAGE_KEYS.WELCOME_DISMISSED, false)),
  );

  useEffect(() => {
    setProposals(getFromStorage(STORAGE_KEYS.PROPOSALS, []));
  }, []);

  const dismissWelcome = () => {
    saveToStorage(STORAGE_KEYS.WELCOME_DISMISSED, true);
    setWelcomeDismissed(true);
  };

  const totalProposals = proposals.length;
  const successfulProposals = proposals.filter(
    (p) => p.generated_proposal,
  ).length;
  const totalWords = proposals.reduce((sum, p) => {
    return (
      sum + (p.generated_proposal ? p.generated_proposal.split(" ").length : 0)
    );
  }, 0);
  const avgWordsPerProposal =
    successfulProposals > 0 ? Math.round(totalWords / successfulProposals) : 0;
  const successRate =
    totalProposals > 0
      ? Math.round((successfulProposals / totalProposals) * 100)
      : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProposals = proposals.filter(
    (p) => new Date(p.created_at) > thirtyDaysAgo,
  );

  const providerStats = proposals.reduce((acc, p) => {
    acc[p.llm_provider] = (acc[p.llm_provider] || 0) + 1;
    return acc;
  }, {});

  const providerData = Object.entries(providerStats).map(
    ([provider, count]) => ({
      name: provider === "openai" ? "OpenAI" : "Anthropic",
      value: count,
      color: provider === "openai" ? "#10b981" : "#3b82f6",
    }),
  );

  const getWeeklyData = () => {
    const weeks = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekProposals = proposals.filter((p) => {
        const date = new Date(p.created_at);
        return date >= weekStart && date <= weekEnd;
      });

      weeks.push({
        week: weekStart.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        proposals: weekProposals.length,
        successful: weekProposals.filter((p) => p.generated_proposal).length,
      });
    }

    return weeks;
  };

  const weeklyData = getWeeklyData();

  const modelStats = proposals.reduce((acc, p) => {
    acc[p.llm_model] = (acc[p.llm_model] || 0) + 1;
    return acc;
  }, {});

  const modelData = Object.entries(modelStats).map(([model, count]) => ({
    model: model.toUpperCase(),
    count,
  }));

  return (
    <div className={className}>
      {!welcomeDismissed && (
        <section className="getting-started">
          <div className="getting-started-top">
            <div className="section-icon" aria-hidden="true">
              <FileText size={18} />
            </div>
            <div className="getting-started-copy">
              <h2>Welcome to BidBuddy</h2>
              <p>
                Start by generating your first proposal to see analytics and
                insights here.
              </p>
            </div>
            <button
              type="button"
              className="welcome-close"
              onClick={dismissWelcome}
              aria-label="Dismiss welcome"
            >
              <X size={16} />
            </button>
          </div>
          <div className="getting-started-steps">
            <Link href="/settings" className="step">
              <span className="step-number">1</span>
              <span className="step-content">
                <strong>Profile setup</strong>
                <span>Add profiles and API keys.</span>
              </span>
            </Link>
            <Link href="/proposal" className="step">
              <span className="step-number">2</span>
              <span className="step-content">
                <strong>Generate a proposal</strong>
                <span>Create your first AI-written bid.</span>
              </span>
            </Link>
            <Link href="/history" className="step">
              <span className="step-number">3</span>
              <span className="step-content">
                <strong>Review history</strong>
                <span>Open past proposals any time.</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      <header className="page-header">
        <div className="page-heading">
          <p>Track proposal volume, success rate, and which models you use.</p>
        </div>
        <Link href="/proposal" className="header-action">
          <PenLine size={16} />
          <span>New proposal</span>
        </Link>
      </header>

      <section className="stats-grid" aria-label="Proposal summary">
        <StatCard
          title="Total proposals"
          value={totalProposals}
          subtitle="All time"
          icon={<FileText size={20} />}
          color="#10b981"
        />
        <StatCard
          title="Successful generations"
          value={successfulProposals}
          subtitle={`${successRate}% success rate`}
          icon={<CircleCheck size={20} />}
          color="#3b82f6"
        />
        <StatCard
          title="Recent activity"
          value={recentProposals.length}
          subtitle="Last 30 days"
          icon={<Activity size={20} />}
          color="#f59e0b"
        />
        <StatCard
          title="Average words"
          value={avgWordsPerProposal}
          subtitle="Per successful proposal"
          icon={<WholeWord size={20} />}
          color="#ef4444"
        />
      </section>

      <section className="charts-grid" aria-label="Proposal analytics">
        <article className="chart-card">
          <div className="chart-header">
            <h2>Weekly activity</h2>
            <p>Proposals started each week</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis
                  dataKey="week"
                  stroke="#98a2b3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  stroke="#98a2b3"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={36}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="proposals"
                  stroke="#6296d3"
                  strokeWidth={2.5}
                  dot={{ fill: "#6296d3", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card">
          <div className="chart-header">
            <h2>AI provider usage</h2>
            <p>Share of proposals by provider</p>
          </div>
          <div className="chart-container">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="46%"
                    innerRadius={54}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 13, color: "#4b5563" }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <ChartColumn size={28} />
                <p>No provider data yet</p>
                <span>Generations will be grouped here.</span>
              </div>
            )}
          </div>
        </article>

        <article className="chart-card span-2">
          <div className="chart-header">
            <h2>Model usage</h2>
            <p>How often each model is selected</p>
          </div>
          <div className="chart-container">
            {modelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modelData}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis
                    dataKey="model"
                    stroke="#98a2b3"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tickFormatter={(value) =>
                      value.length > 18 ? `${value.slice(0, 16)}…` : value
                    }
                  />
                  <YAxis
                    stroke="#98a2b3"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#6296d3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <Settings size={28} />
                <p>No model data yet</p>
                <span>Model choices will show up here.</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
};

export default styled(Home)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #ffffff;

  &,
  & * {
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px 24px;
  }

  .page-heading {
    min-width: 0;

    p {
      margin: 0;
      padding: 0;
      max-width: 40rem;
      color: #667085;
      font-size: 0.98rem;
      line-height: 1.5;
    }
  }

  .header-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-shrink: 0;
    margin-top: 2px;
    padding: 10px 16px;
    border-radius: 12px;
    background: #6296d3;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      background: #3969a0;
    }
  }

  .getting-started {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.02);
  }

  .getting-started-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    background: rgba(98, 150, 211, 0.12);
    color: #3969a0;
  }

  .welcome-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background: #ffffff;
    color: #667085;
    cursor: pointer;

    &:hover {
      background: #f7fafd;
      color: #1c1c1c;
    }
  }

  .getting-started-copy {
    flex: 1;
    min-width: 0;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 4px 0 0;
      max-width: 40rem;
      color: #667085;
      font-size: 0.9rem;
      line-height: 1.45;
    }
  }

  .getting-started-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    height: 100%;
    padding: 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
    color: inherit;
    text-decoration: none;

    &:hover {
      background: #f7fafd;
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      border-radius: 999px;
      background: rgba(98, 150, 211, 0.14);
      color: #3969a0;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .step-content {
      min-width: 0;

      strong {
        display: block;
        color: #1c1c1c;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.3;
      }

      span {
        display: block;
        margin-top: 4px;
        color: #667085;
        font-size: 0.92rem;
        line-height: 1.45;
      }
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin: 0;
    padding: 0;
  }

  .stat-card {
    min-width: 0;
    display: flex;
    align-items: center;
    min-height: 112px;
    padding: 18px 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      border-color: rgba(98, 150, 211, 0.45);
      box-shadow: 0 8px 24px rgba(19, 52, 90, 0.06);
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      min-width: 0;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      border-radius: 12px;
    }

    .stat-info {
      min-width: 0;

      h3 {
        margin: 0;
        color: #1c1c1c;
        font-size: 1.6rem;
        font-weight: 700;
        line-height: 1.1;
      }

      p {
        margin: 4px 0 0;
        color: #374151;
        font-size: 0.92rem;
        font-weight: 600;
        line-height: 1.3;
      }

      .stat-subtitle {
        display: block;
        margin-top: 2px;
        color: #6b7280;
        font-size: 0.8rem;
        font-weight: 500;
        line-height: 1.35;
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 16px;
    margin: 0;
    padding: 0;

    .span-2 {
      grid-column: 1 / -1;
    }
  }

  .chart-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      border-color: rgba(98, 150, 211, 0.45);
      box-shadow: 0 8px 24px rgba(19, 52, 90, 0.06);
    }

    .chart-header {
      margin-bottom: 8px;

      h2 {
        margin: 0;
        color: #1c1c1c;
        font-size: 1.05rem;
        font-weight: 700;
        line-height: 1.3;
      }

      p {
        margin: 4px 0 0;
        padding: 0;
        color: #667085;
        font-size: 0.85rem;
        line-height: 1.4;
      }
    }

    .chart-container {
      width: 100%;
      min-width: 0;
      height: 280px;
    }

    .empty-chart {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: #98a2b3;
      text-align: center;

      p {
        margin: 4px 0 0;
        color: #4b5563;
        font-size: 0.95rem;
        font-weight: 600;
      }

      span {
        max-width: 16rem;
        color: #98a2b3;
        font-size: 0.85rem;
        line-height: 1.4;
      }
    }
  }

  @media (max-width: 1100px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 980px) {
    .charts-grid {
      grid-template-columns: 1fr;

      .span-2 {
        grid-column: auto;
      }
    }

    .getting-started-steps {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 767px) {
    gap: 20px;
    padding: 0 0 28px;
  }

  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .header-action {
      align-self: flex-start;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .getting-started,
    .chart-card,
    .stat-card {
      padding: 16px;
    }
  }
`;
