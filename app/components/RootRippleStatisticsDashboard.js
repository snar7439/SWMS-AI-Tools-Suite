"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Users,
  Clock,
  Target,
  Database,
  Trash2,
  Shield,
  AlertTriangle,
  Calendar,
  Activity,
  FileText,
  PieChart,
  Server,
  Zap,
} from "lucide-react";

const StatisticsDashboard = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    averageAnalysisTime: 0,
    totalUsers: 0,
    environmentBreakdown: { production: 0, development: 0 },
    monthlyAnalyses: [],
    recentAnalyses: [],
  });

  const [feedbackStats, setFeedbackStats] = useState({
    positive: 0,
    negative: 0,
    comments: [],
  });

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [clearAction, setClearAction] = useState("");
  const [isValidatingAdmin, setIsValidatingAdmin] = useState(false);

  useEffect(() => {
    loadStatistics();
    loadFeedbackStats();
  }, []);

  const loadStatistics = () => {
    try {
      // Load analysis statistics from localStorage
      const analysisHistory = JSON.parse(
        localStorage.getItem("rootRippleAnalysisHistory") || "[]"
      );

      const totalAnalyses = analysisHistory.length;
      const successfulAnalyses = analysisHistory.filter(
        (a) => a.status === "completed"
      ).length;
      const failedAnalyses = analysisHistory.filter(
        (a) => a.status === "failed"
      ).length;

      // Calculate average analysis time
      const completedAnalyses = analysisHistory.filter((a) => a.duration);
      const avgTime =
        completedAnalyses.length > 0
          ? completedAnalyses.reduce((sum, a) => sum + a.duration, 0) /
            completedAnalyses.length
          : 0;

      // Get unique users
      const uniqueUsers = new Set(
        analysisHistory.map((a) => a.userId || "anonymous")
      ).size;

      // Environment breakdown
      const envBreakdown = analysisHistory.reduce(
        (acc, a) => {
          const envType = a.environment?.type || "unknown";
          acc[envType] = (acc[envType] || 0) + 1;
          return acc;
        },
        { production: 0, development: 0 }
      );

      // Monthly analyses for the last 6 months
      const monthlyData = getMonthlyAnalyses(analysisHistory);

      // Recent analyses (last 10)
      const recentAnalyses = analysisHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      setStats({
        totalAnalyses,
        successfulAnalyses,
        failedAnalyses,
        averageAnalysisTime: Math.round(avgTime / 1000), // Convert to seconds
        totalUsers: uniqueUsers,
        environmentBreakdown: envBreakdown,
        monthlyAnalyses: monthlyData,
        recentAnalyses,
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const getMonthlyAnalyses = (analysisHistory) => {
    const now = new Date();
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = analysisHistory.filter((a) => {
        const analysisDate = new Date(a.timestamp);
        return analysisDate >= monthStart && analysisDate <= monthEnd;
      }).length;

      monthlyData.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count,
      });
    }

    return monthlyData;
  };

  const loadFeedbackStats = () => {
    try {
      const existingFeedback = JSON.parse(
        localStorage.getItem("rootRippleFeedback") || "[]"
      );
      const stats = {
        positive: existingFeedback.filter((f) => f.feedbackType === "positive")
          .length,
        negative: existingFeedback.filter((f) => f.feedbackType === "negative")
          .length,
        comments: existingFeedback
          .filter((f) => f.reason && f.reason.trim() !== "")
          .map((f) => ({
            id: f.sessionId,
            type: f.feedbackType,
            comment: f.reason,
            timestamp: f.timestamp,
            environment: f.environment,
          })),
      };
      setFeedbackStats(stats);
    } catch (error) {
      console.error("Error loading feedback stats:", error);
    }
  };

  const handleAdminAction = (action) => {
    setClearAction(action);
    setShowAdminPanel(true);
  };

  const executeClearAction = async () => {
    setIsValidatingAdmin(true);
    
    try {
      // Validate admin key via API
      const response = await fetch('/api/admin/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey,
          action: clearAction,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        alert(result.error || "Invalid admin key!");
        setIsValidatingAdmin(false);
        return;
      }
      
      // Admin key is valid, proceed with confirmation
      const confirmMessage = {
        stats:
          "Are you sure you want to clear all analysis statistics? This action cannot be undone.",
        feedback:
          "Are you sure you want to clear all feedback data? This action cannot be undone.",
        logs: "Are you sure you want to clear all log files? This will remove all temporary session data.",
      };

      if (!window.confirm(confirmMessage[clearAction])) {
        setIsValidatingAdmin(false);
        return;
      }

      // Execute the clear action
      switch (clearAction) {
        case "stats":
          // Clear analysis statistics
          localStorage.removeItem("rootRippleAnalysisHistory");
          loadStatistics();
          alert("Analysis statistics cleared successfully!");
          break;
        case "feedback":
          // Clear feedback data
          localStorage.removeItem("rootRippleFeedback");
          loadFeedbackStats();
          alert("Feedback data cleared successfully!");
          break;
        case "logs":
          await clearAllLogFiles();
          break;
      }
    } catch (adminError) {
      console.error('Error validating admin or clearing data:', adminError);
      alert(`Error: ${adminError.message}`);
    } finally {
      setIsValidatingAdmin(false);
      setShowAdminPanel(false);
      setAdminKey("");
      setClearAction("");
    }
  };

  const clearAllLogFiles = async () => {
    try {
      const response = await fetch("/api/cleanup-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clearAll: true,
          adminKey: adminKey
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(
          `Successfully cleared all log files! Removed ${result.deletedDirectories || 0} directories from temp_logs.`
        );
      } else {
        alert(`Error clearing log files: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing log files:', error);
      alert(`Error clearing log files: ${error.message}`);
    }
  };

  const getSuccessRate = () => {
    if (stats.totalAnalyses === 0) return 0;
    return Math.round((stats.successfulAnalyses / stats.totalAnalyses) * 100);
  };

  const getFeedbackSentiment = () => {
    const total = feedbackStats.positive + feedbackStats.negative;
    if (total === 0) return 0;
    return Math.round((feedbackStats.positive / total) * 100);
  };

  const getNegativeFeedbackPercentage = () => {
    const total = feedbackStats.positive + feedbackStats.negative;
    if (total === 0) return 0;
    return Math.round((feedbackStats.negative / total) * 100);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "slate",
    subtitle = null,
    trend = null,
  }) => {
    const colorClasses = {
      slate: "bg-slate-50 border-slate-200 text-slate-700",
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      green: "bg-green-50 border-green-200 text-green-700",
      amber: "bg-amber-50 border-amber-200 text-amber-700",
      red: "bg-red-50 border-red-200 text-red-700",
    };

    const iconColorClasses = {
      slate: "bg-slate-600",
      blue: "bg-blue-600",
      green: "bg-green-600",
      amber: "bg-amber-600",
      red: "bg-red-600",
    };

    return (
      <div
        className={`${colorClasses[color]} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              {title}
            </h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {value}
              </p>
              {subtitle && (
                <p className="text-sm font-medium text-gray-600">{subtitle}</p>
              )}
            </div>
            {trend && <div className="mt-1 text-xs text-gray-500">{trend}</div>}
          </div>
          <div className={`${iconColorClasses[color]} p-3 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const DataSection = ({ title, icon: Icon, children, className = "" }) => (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            {title}
          </h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Analyses"
            value={stats.totalAnalyses}
            icon={Activity}
            color="blue"
          />
          <StatCard
            title="Success Rate"
            value={`${getSuccessRate()}%`}
            icon={TrendingUp}
            color="green"
            subtitle={`${stats.successfulAnalyses}/${stats.totalAnalyses}`}
          />
          <StatCard
            title="Avg Response Time"
            value={stats.averageAnalysisTime}
            icon={Clock}
            color="amber"
            subtitle="seconds"
          />
          <StatCard
            title="Active Users"
            value={stats.totalUsers}
            icon={Users}
            color="slate"
          />
        </div>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DataSection title="Analysis Performance" icon={Target}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Successful</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 tabular-nums">
                    {stats.successfulAnalyses}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getSuccessRate()}% success rate
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Failed</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 tabular-nums">
                    {stats.failedAnalyses}
                  </div>
                  <div className="text-xs text-gray-500">
                    {100 - getSuccessRate()}% failure rate
                  </div>
                </div>
              </div>
            </div>
          </DataSection>

          <DataSection title="Environment Distribution" icon={Server}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">Production</span>
                </div>
                <div className="text-lg font-bold text-gray-900 tabular-nums">
                  {stats.environmentBreakdown.production}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">Development</span>
                </div>
                <div className="text-lg font-bold text-gray-900 tabular-nums">
                  {stats.environmentBreakdown.development}
                </div>
              </div>
            </div>
          </DataSection>
        </div>

        {/* Monthly Trend Analysis */}
        <DataSection title="Analysis Trend (6 Months)" icon={Calendar}>
          <div className="grid grid-cols-6 gap-4">
            {stats.monthlyAnalyses.map((month, index) => {
              const maxCount = Math.max(
                ...stats.monthlyAnalyses.map((m) => m.count)
              );
              const barHeight =
                maxCount > 0 ? (month.count / maxCount) * 100 : 0;

              return (
                <div key={index} className="text-center">
                  <div className="h-24 bg-gray-100 rounded-lg p-2 flex items-end justify-center mb-3 border">
                    <div
                      className="bg-blue-600 w-full rounded-sm min-h-[2px] transition-all duration-500"
                      style={{ height: `${Math.max(barHeight, 2)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {month.month}
                  </div>
                  <div className="text-sm font-bold text-gray-700 tabular-nums">
                    {month.count}
                  </div>
                </div>
              );
            })}
          </div>
        </DataSection>

        {/* User Feedback Analytics */}
        <DataSection title="User Feedback Analytics" icon={MessageCircle}>
          <div className="space-y-6">
            {/* Feedback Summary */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-700 tabular-nums">
                  {feedbackStats.positive}
                </div>
                <div className="text-xs font-medium text-green-600 uppercase tracking-wider">
                  Positive
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {getFeedbackSentiment()}%
                </div>
              </div>

              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-2xl font-bold text-red-700 tabular-nums">
                  {feedbackStats.negative}
                </div>
                <div className="text-xs font-medium text-red-600 uppercase tracking-wider">
                  Negative
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {getNegativeFeedbackPercentage()}%
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 tabular-nums">
                  {feedbackStats.comments.length}
                </div>
                <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Comments
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  {feedbackStats.positive + feedbackStats.negative > 0
                    ? Math.round(
                        (feedbackStats.comments.length /
                          (feedbackStats.positive + feedbackStats.negative)) *
                          100
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>

            {/* Recent Comments */}
            {feedbackStats.comments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Recent Feedback
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {feedbackStats.comments
                    .slice(-5)
                    .reverse()
                    .map((comment, index) => (
                      <div
                        key={`${comment.id}-${index}`}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                comment.type === "positive"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {comment.type === "positive"
                                ? "POSITIVE"
                                : "ISSUE"}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">
                              {comment.environment?.name || "UNKNOWN ENV"}
                            </span>
                          </div>
                          <time className="text-xs text-gray-500 font-mono">
                            {new Date(comment.timestamp).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </time>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {comment.comment}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DataSection>

        {/* Recent Analysis Activity */}
        {stats.recentAnalyses.length > 0 && (
          <DataSection title="Recent Analysis Activity" icon={Activity}>
            <div className="overflow-hidden">
              <div className="space-y-3">
                {stats.recentAnalyses.map((analysis, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          analysis.status === "completed"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {analysis.environment?.name || "Unknown Environment"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {analysis.issueDescription?.substring(0, 80)}...
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {new Date(analysis.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 tabular-nums">
                          {analysis.duration
                            ? `${Math.round(analysis.duration / 1000)}s`
                            : "N/A"}
                        </div>
                      </div>
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          analysis.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {analysis.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DataSection>
        )}

        {/* Admin Controls */}
        <DataSection title="Administrative Controls" icon={Shield}>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800">
                  Restricted Access
                </h4>
                <p className="text-sm text-amber-700">
                  Administrative functions require proper authentication. All
                  actions are irreversible.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleAdminAction("stats")}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Statistics</span>
            </button>

            <button
              onClick={() => handleAdminAction("feedback")}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Clear Feedback</span>
            </button>

            <button
              onClick={() => handleAdminAction("logs")}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>Clear Log Files</span>
            </button>
          </div>
        </DataSection>
      </div>

      {/* Admin Authentication Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Administrative Authentication
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter admin key to proceed with {clearAction} operation
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key..."
                  className="w-full p-3 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAdminPanel(false);
                    setAdminKey("");
                    setClearAction("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeClearAction}
                  disabled={isValidatingAdmin}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingAdmin ? "Validating..." : "Execute Action"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-b border-gray-300">
        <div className="px-3 py-3">
          <div className="max-w-7xl mx-auto">
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">
                    LAST UPDATED: {new Date().toLocaleString()}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default StatisticsDashboard;
