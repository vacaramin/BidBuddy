import { useState, useEffect } from "preact/hooks";
import styled from "styled-components";
import { getFromStorage, STORAGE_KEYS } from "../utils/localStorage";
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
} from "recharts";

const Home = ({ className }) => {
  const [proposals, setProposals] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const savedProposals = getFromStorage(STORAGE_KEYS.PROPOSALS, []);
    const savedSettings = getFromStorage(STORAGE_KEYS.SETTINGS);
    setProposals(savedProposals);
    setSettings(savedSettings);
  }, []);

  // Calculate analytics data
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
    totalProposals > 0 ? Math.round(totalWords / successfulProposals) : 0;

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProposals = proposals.filter(
    (p) => new Date(p.created_at) > thirtyDaysAgo,
  );

  // Provider usage distribution
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

  // Weekly activity data
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
        week: `Week ${i === 0 ? "Current" : i === 1 ? "Last" : `-${i}`}`,
        proposals: weekProposals.length,
        successful: weekProposals.filter((p) => p.generated_proposal).length,
      });
    }

    return weeks;
  };

  const weeklyData = getWeeklyData();

  // Model usage stats
  const modelStats = proposals.reduce((acc, p) => {
    acc[p.llm_model] = (acc[p.llm_model] || 0) + 1;
    return acc;
  }, {});

  const modelData = Object.entries(modelStats).map(([model, count]) => ({
    model: model.toUpperCase(),
    count,
  }));

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

  return (
    <div className={className}>
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Track your proposal generation analytics and performance</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Proposals"
          value={totalProposals}
          subtitle="All time"
          icon="📝"
          color="#10b981"
        />
        <StatCard
          title="Successful Generations"
          value={successfulProposals}
          subtitle={`${totalProposals > 0 ? Math.round((successfulProposals / totalProposals) * 100) : 0}% success rate`}
          icon="✅"
          color="#3b82f6"
        />
        <StatCard
          title="Recent Activity"
          value={recentProposals.length}
          subtitle="Last 30 days"
          icon="📊"
          color="#f59e0b"
        />
        <StatCard
          title="Average Words"
          value={avgWordsPerProposal || "N/A"}
          subtitle="Per proposal"
          icon="📄"
          color="#ef4444"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Weekly Activity</h3>
            <p>Proposals generated over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "2px solid #f0f0f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="proposals"
                  stroke="#6296d3"
                  strokeWidth={3}
                  dot={{ fill: "#6296d3", strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: "#6296d3", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>AI Provider Usage</h3>
            <p>Distribution by provider</p>
          </div>
          <div className="chart-container">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No data available</p>
                <span>Generate some proposals to see analytics</span>
              </div>
            )}
          </div>
        </div>

        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Model Performance</h3>
            <p>Usage by AI model</p>
          </div>
          <div className="chart-container">
            {modelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={modelData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="model" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "2px solid #f0f0f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="count" fill="#6296d3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <p>No model data available</p>
                <span>Generate proposals to see model usage</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {totalProposals === 0 && (
        <div className="getting-started">
          <div className="getting-started-content">
            <h2>Welcome to BidBuddy!</h2>
            <p>
              Start by generating your first proposal to see analytics and
              insights here.
            </p>
            <div className="getting-started-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Configure Settings</h4>
                  <p>Add your personal info and API keys</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Generate Proposal</h4>
                  <p>Create your first AI-powered proposal</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Track Progress</h4>
                  <p>Monitor your analytics and success</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default styled(Home)`
  min-height: calc(100vh - var(--topBarHeight));
  background: #ffffff;

  .dashboard-header {
    margin-bottom: 40px;

    p {
      padding: 0px 20px;
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 40px;

    padding: 0px 20px;
  }

  .stat-card {
    background: rgba(0, 0, 0, 0.02);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
      border-color: rgba(0, 0, 0, 0.15);
    }

    .stat-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
    }

    .stat-info {
      flex: 1;

      h3 {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0 0 4px 0;
        color: #333;
      }

      p {
        font-size: 1rem;
        font-weight: 600;
        color: #666;
        margin: 0 0 4px 0;
      }

      .stat-subtitle {
        font-size: 0.85rem;
        color: #888;
        font-weight: 500;
      }
    }
  }

  .charts-grid {
    padding: 0px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 40px;

    .full-width {
      grid-column: 1 / -1;
    }

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;

      .full-width {
        grid-column: 1;
      }
    }
  }

  .chart-card {
    background: rgba(0, 0, 0, 0.02);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.15);
    }

    .chart-header {
      margin-bottom: 24px;

      h3 {
        font-size: 1.3rem;
        font-weight: 700;
        color: #333;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 0.9rem;
        color: #666;
        margin: 0;
      }
    }

    .chart-container {
      position: relative;
    }

    .empty-chart {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #888;

      p {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      span {
        font-size: 0.9rem;
      }
    }
  }

  .getting-started {
    background: linear-gradient(
      135deg,
      rgba(98, 150, 211, 0.1) 0%,
      rgba(123, 177, 241, 0.05) 100%
    );
    text-align: center;

    .getting-started-content {
      padding: 0px 20px;
      max-width: 600px;
      margin: 0 auto;

      h2 {
        color: #333;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 12px;
      }

      > p {
        color: #666;
        font-size: 1.1rem;
        margin-bottom: 40px;
      }
    }

    .getting-started-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      text-align: left;

      .step {
        display: flex;
        align-items: flex-start;
        gap: 16px;

        .step-number {
          width: 40px;
          height: 40px;
          background: #6296d3;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          flex-shrink: 0;
        }

        .step-content {
          h4 {
            color: #333;
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0 0 8px 0;
          }

          p {
            color: #666;
            font-size: 0.95rem;
            margin: 0;
            line-height: 1.5;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 20px 15px;

    .dashboard-header {
      h1 {
        font-size: 2rem;
      }

      p {
        font-size: 1rem;
      }
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .charts-grid {
      gap: 16px;
    }

    .getting-started {
      padding: 30px 20px;

      .getting-started-steps {
        gap: 24px;
      }
    }
  }

  @media (max-width: 480px) {
    .chart-card {
      padding: 20px;
    }

    .stat-card {
      padding: 20px;

      .stat-header {
        gap: 12px;
      }

      .stat-icon {
        width: 50px;
        height: 50px;
        font-size: 1.3rem;
      }

      .stat-info h3 {
        font-size: 1.8rem;
      }
    }
  }
`;
