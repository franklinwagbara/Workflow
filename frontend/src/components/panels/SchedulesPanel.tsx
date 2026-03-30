"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Play,
  Pause,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAppSelector } from "@/lib/store";
import { scheduleApi } from "@/lib/api/client";
import type { Schedule } from "@/lib/types";

export default function SchedulesPanel() {
  const { currentWorkflow } = useAppSelector((state) => state.workflow);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [cronExpression, setCronExpression] = useState("0 */5 * * *");
  const [isCreating, setIsCreating] = useState(false);

  const loadSchedules = useCallback(async () => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await scheduleApi.getSchedules(currentWorkflow.id);
      setSchedules(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkflow]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleCreate = async () => {
    if (!currentWorkflow || !cronExpression.trim()) return;
    setIsCreating(true);
    try {
      await scheduleApi.create(currentWorkflow.id, cronExpression.trim());
      setCronExpression("0 */5 * * *");
      setShowCreate(false);
      await loadSchedules();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (scheduleId: string) => {
    try {
      await scheduleApi.toggle(scheduleId);
      await loadSchedules();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await scheduleApi.delete(scheduleId);
      await loadSchedules();
    } catch (err) {
      setError(String(err));
    }
  };

  const cronPresets = [
    { label: "Every 5 min", cron: "*/5 * * * *" },
    { label: "Every hour", cron: "0 * * * *" },
    { label: "Daily midnight", cron: "0 0 * * *" },
    { label: "Weekly Mon 9am", cron: "0 9 * * 1" },
    { label: "Monthly 1st", cron: "0 0 1 * *" },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-white text-sm">Schedules</span>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 border-b border-gray-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Cron Expression
            </label>
            <input
              type="text"
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="*/5 * * * *"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {cronPresets.map((preset) => (
              <button
                key={preset.cron}
                onClick={() => setCronExpression(preset.cron)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  cronExpression === preset.cron
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "bg-gray-800 text-gray-500 hover:text-gray-300"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!cronExpression.trim() || isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700
                disabled:bg-indigo-600/30 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isCreating && <Loader2 className="w-3 h-3 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && schedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Clock className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No schedules</p>
            <p className="text-xs mt-1">Add a cron schedule to automate runs</p>
          </div>
        )}

        {!isLoading && schedules.length > 0 && (
          <div className="divide-y divide-gray-800">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-3 flex items-center gap-3">
                <button
                  onClick={() => handleToggle(schedule.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    schedule.isActive
                      ? "bg-green-600/20 text-green-400"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {schedule.isActive ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white truncate">
                    {schedule.cronExpression}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {schedule.isActive ? "Active" : "Paused"}
                    {schedule.nextRunAt &&
                      ` · Next: ${new Date(schedule.nextRunAt).toLocaleString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
