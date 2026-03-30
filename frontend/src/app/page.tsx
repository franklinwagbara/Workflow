"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Workflow,
  Clock,
  Trash2,
  ArrowRight,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Archive,
  FileEdit,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchWorkflows,
  createWorkflow,
  deleteWorkflow,
} from "@/lib/store/workflowSlice";
import { WorkflowStatus } from "@/lib/types";

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; color: string; bg: string }
> = {
  [WorkflowStatus.Draft]: {
    icon: FileEdit,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  [WorkflowStatus.Active]: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  [WorkflowStatus.Archived]: {
    icon: Archive,
    color: "text-gray-400",
    bg: "bg-gray-400/10",
  },
};

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {
    workflows,
    loading: isLoading,
    error,
  } = useAppSelector((state) => state.workflow);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkflows());
  }, [dispatch]);

  const filtered = workflows.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const result = await dispatch(
        createWorkflow({
          name: newName.trim(),
          description: newDescription.trim(),
        }),
      ).unwrap();
      setShowCreateDialog(false);
      setNewName("");
      setNewDescription("");
      router.push(`/workflows/${result.id}`);
    } catch (e) {
      console.error("Failed to create workflow:", e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    dispatch(deleteWorkflow(id));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-gray-400">
            Build, test, and deploy automation workflows with a visual
            drag-and-drop builder.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
              rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Workflow className="w-16 h-16 text-gray-700 mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? "No workflows found" : "No workflows yet"}
            </h2>
            <p className="text-gray-500 mb-6 max-w-md">
              {searchQuery
                ? "Try a different search term."
                : "Create your first workflow to get started with visual automation."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white
                  rounded-xl text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Workflow
              </button>
            )}
          </div>
        )}

        {/* Workflow Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((workflow) => {
              const status =
                statusConfig[workflow.status] ||
                statusConfig[WorkflowStatus.Draft];
              const StatusIcon = status.icon;
              return (
                <div
                  key={workflow.id}
                  onClick={() => router.push(`/workflows/${workflow.id}`)}
                  className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 cursor-pointer
                    hover:border-indigo-600/50 hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-indigo-600/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-indigo-400" />
                      <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                        {workflow.name}
                      </h3>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color} ${status.bg}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {workflow.status}
                    </div>
                  </div>

                  {workflow.description && (
                    <p className="text-gray-400 text-xs mb-4 line-clamp-2">
                      {workflow.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span>v{workflow.version}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(workflow.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              Create Workflow
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My awesome workflow"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Describe what this workflow does..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewName("");
                  setNewDescription("");
                }}
                className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                  disabled:bg-indigo-600/30 disabled:text-indigo-400/50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
