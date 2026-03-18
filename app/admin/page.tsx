"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SkillInfo {
  name: string;
  label: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface AgentInfo {
  name: string;
  description: string;
  model: string;
  provider: string;
  systemPrompt: string;
  skills: SkillInfo[];
  supportedCities: string[];
  status: "ready" | "missing_api_key";
}

export default function AdminPage() {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    fetch("/api/agent")
      .then((res) => res.json())
      .then((data) => {
        setAgentInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-[var(--error)] mb-2">加载失败</p>
          <p className="text-sm text-[var(--muted)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
            Pi
          </div>
          <div>
            <h1 className="text-2xl font-bold">Agent 管理面板</h1>
            <p className="text-sm text-[var(--muted)]">查看和管理 Agent 配置</p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm text-[var(--primary)] hover:underline px-4 py-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
        >
          ← 返回对话
        </Link>
      </div>

      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
            系统状态
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusItem
              label="Agent 状态"
              value={agentInfo?.status === "ready" ? "就绪" : "未配置 API Key"}
              status={agentInfo?.status === "ready" ? "success" : "warning"}
            />
            <StatusItem label="Agent 名称" value={agentInfo?.name || "-"} />
            <StatusItem label="模型" value={agentInfo?.model || "-"} />
            <StatusItem label="提供商" value={agentInfo?.provider || "-"} />
          </div>
        </div>

        {/* Agent Info */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Agent 信息</h2>
          <p className="text-[var(--muted)] mb-4">{agentInfo?.description}</p>

          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="text-sm text-[var(--primary)] hover:underline mb-2"
          >
            {showPrompt ? "收起" : "查看"} System Prompt
          </button>

          {showPrompt && (
            <pre className="mt-2 p-4 rounded-xl bg-[var(--accent)] text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap border border-[var(--card-border)]">
              {agentInfo?.systemPrompt}
            </pre>
          )}
        </div>

        {/* Skills */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Skills（{agentInfo?.skills.length || 0} 个）
          </h2>
          <div className="space-y-4">
            {agentInfo?.skills.map((skill) => (
              <div
                key={skill.name}
                className="border border-[var(--card-border)] rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <h3 className="font-medium">{skill.label}</h3>
                  <code className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--muted)]">
                    {skill.name}
                  </code>
                </div>
                <p className="text-sm text-[var(--muted)] mb-3">
                  {skill.description}
                </p>
                <div className="text-xs">
                  <span className="font-medium">参数定义：</span>
                  <pre className="mt-1 p-3 rounded-lg bg-[var(--accent)] overflow-x-auto border border-[var(--card-border)]">
                    {JSON.stringify(skill.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supported Cities */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            支持的城市（{agentInfo?.supportedCities.length || 0} 个）
          </h2>
          <div className="flex flex-wrap gap-2">
            {agentInfo?.supportedCities.map((city) => (
              <span
                key={city}
                className="px-3 py-1.5 text-sm rounded-full bg-[var(--accent)] border border-[var(--card-border)]"
              >
                {city}
              </span>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">系统架构</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-4">
            <ArchBlock label="用户输入" sub="Next.js 前端" color="blue" />
            <Arrow />
            <ArchBlock label="/api/chat" sub="API 路由" color="purple" />
            <Arrow />
            <ArchBlock label="pi-mono Agent" sub="调度 & 决策" color="cyan" />
            <Arrow />
            <ArchBlock label="get_weather" sub="Open-Meteo API" color="green" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: "success" | "warning" | "error";
}) {
  const statusColor = status === "success"
    ? "text-[var(--success)]"
    : status === "warning"
    ? "text-[var(--warning)]"
    : status === "error"
    ? "text-[var(--error)]"
    : "";

  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-1">{label}</p>
      <p className={`text-sm font-medium ${statusColor}`}>{value}</p>
    </div>
  );
}

function ArchBlock({
  label,
  sub,
  color,
}: {
  label: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    cyan: "from-cyan-500 to-cyan-600",
    green: "from-green-500 to-green-600",
  };

  return (
    <div className="text-center">
      <div
        className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${colorMap[color] || colorMap.blue} flex items-center justify-center text-white font-medium text-sm shadow-md`}
      >
        {label}
      </div>
      <p className="text-xs text-[var(--muted)] mt-2">{sub}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="text-[var(--muted)] text-xl rotate-90 md:rotate-0">→</div>
  );
}
