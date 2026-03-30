"use client";

import { useEffect, useState } from "react";
import {
  History,
  RotateCcw,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchVersions, revertToVersion } from "@/lib/store/workflowSlice";

interface Version {
  id: string;
  versionNumber: number;
  changeDescription: string;
  createdAt: string;
  graphData: string;
}

export default function VersionsPanel() {
  const dispatch = useAppDispatch();
  const { currentWorkflow } = useAppSelector((state) => state.workflow);
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    setError(null);
    dispatch(fetchVersions(currentWorkflow.id))
      .unwrap()
      .then((data) => setVersions(data as Version[]))
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false));
  }, [dispatch, currentWorkflow]);

  const handleRevert = async (versionNumber: number) => {
    if (!currentWorkflow) return;
    if (
      !confirm(
        `Revert to version ${versionNumber}? This will create a new version.`,
      )
    )
      return;
    setReverting(String(versionNumber));
    try {
      await dispatch(
        revertToVersion({
          workflowId: currentWorkflow.id,
          versionNumber,
        }),
      ).unwrap();
      // Refresh versions
      const data = await dispatch(fetchVersions(currentWorkflow.id)).unwrap();
      setVersions(data as Version[]);
    } catch (err) {
      setError(String(err));
    } finally {
      setReverting(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white text-sm">
            Version History
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Current: v{currentWorkflow?.version || 1}
        </p>
      </div>

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

        {!isLoading && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FileText className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No versions yet</p>
          </div>
        )}

        {!isLoading && versions.length > 0 && (
          <div className="divide-y divide-gray-800">
            {versions.map((version) => {
              const isCurrent =
                version.versionNumber === currentWorkflow?.version;
              return (
                <div
                  key={version.id}
                  className={`p-3 ${
                    isCurrent
                      ? "bg-indigo-600/5 border-l-2 border-indigo-500"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        v{version.versionNumber}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/20 text-indigo-400">
                          Current
                        </span>
                      )}
                    </div>
                    {!isCurrent && (
                      <button
                        onClick={() => handleRevert(version.versionNumber)}
                        disabled={reverting === String(version.versionNumber)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs
                          text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        {reverting === String(version.versionNumber) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Revert
                      </button>
                    )}
                  </div>
                  {version.changeDescription && (
                    <p className="text-xs text-gray-500 mt-1">
                      {version.changeDescription}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(version.createdAt).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
