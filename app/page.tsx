export default function Home() {
  const modules = [
    {
      title: "AI Agents",
      description: "Monitor and control STARZ AI agents (Steve, Vox, Tony, etc).",
      icon: "🤖",
    },
    {
      title: "CRM",
      description: "Manage leads, partners, pipelines, and sales activity.",
      icon: "🧾",
    },
    {
      title: "Governance",
      description: "System risk monitoring, compliance, and Sentinel alerts.",
      icon: "🛡",
    },
    {
      title: "Automation",
      description: "Control workflows, automations, and background engines.",
      icon: "⚙️",
    },
    {
      title: "Analytics",
      description: "View revenue, performance metrics, and predictive insights.",
      icon: "📊",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-10">
        STARZ-OS Executive Control Center
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <div
            key={module.title}
            className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 hover:border-purple-500 transition"
          >
            <div className="text-3xl mb-3">{module.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{module.title}</h2>
            <p className="text-zinc-400">{module.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}