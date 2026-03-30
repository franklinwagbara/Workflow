const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ========== Workflows ==========
export const workflowApi = {
  getAll: () => fetchApi<import("../types").WorkflowListItem[]>("/workflows"),

  getById: (id: string) =>
    fetchApi<import("../types").WorkflowDetail>(`/workflows/${id}`),

  create: (data: { name: string; description: string; graphData?: string }) =>
    fetchApi<import("../types").WorkflowDetail>("/workflows", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      name?: string;
      description?: string;
      graphData?: string;
      status?: string;
      changeDescription?: string;
    },
  ) =>
    fetchApi<import("../types").WorkflowDetail>(`/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/workflows/${id}`, { method: "DELETE" }),

  getVersions: (id: string) =>
    fetchApi<import("../types").WorkflowVersion[]>(`/workflows/${id}/versions`),

  getVersion: (id: string, versionNumber: number) =>
    fetchApi<import("../types").WorkflowVersionDetail>(
      `/workflows/${id}/versions/${versionNumber}`,
    ),

  revertToVersion: (id: string, versionNumber: number) =>
    fetchApi<import("../types").WorkflowDetail>(
      `/workflows/${id}/revert/${versionNumber}`,
      { method: "POST" },
    ),

  export: (id: string) =>
    fetchApi<Blob>(`/workflows/${id}/export`, { method: "POST" }),

  import: (data: { name: string; description: string; graphData: string }) =>
    fetchApi<import("../types").WorkflowDetail>("/workflows/import", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ========== Executions ==========
export const executionApi = {
  execute: (workflowId: string, inputData?: string) =>
    fetchApi<import("../types").WorkflowExecution>(
      `/executions/workflows/${workflowId}/execute`,
      {
        method: "POST",
        body: JSON.stringify({ inputData }),
      },
    ),

  simulate: (workflowId: string, inputData?: string) =>
    fetchApi<import("../types").WorkflowExecution>(
      `/executions/workflows/${workflowId}/simulate`,
      {
        method: "POST",
        body: JSON.stringify({ inputData }),
      },
    ),

  getExecution: (executionId: string) =>
    fetchApi<import("../types").WorkflowExecution>(
      `/executions/${executionId}`,
    ),

  getWorkflowExecutions: (workflowId: string) =>
    fetchApi<import("../types").WorkflowExecution[]>(
      `/executions/workflows/${workflowId}`,
    ),
};

// ========== Schedules ==========
export const scheduleApi = {
  getSchedules: (workflowId: string) =>
    fetchApi<import("../types").Schedule[]>(
      `/schedules/workflows/${workflowId}`,
    ),

  create: (workflowId: string, cronExpression: string) =>
    fetchApi<import("../types").Schedule>(
      `/schedules/workflows/${workflowId}`,
      {
        method: "POST",
        body: JSON.stringify({ cronExpression }),
      },
    ),

  toggle: (scheduleId: string) =>
    fetchApi<import("../types").Schedule>(`/schedules/${scheduleId}/toggle`, {
      method: "PATCH",
    }),

  delete: (scheduleId: string) =>
    fetchApi<void>(`/schedules/${scheduleId}`, { method: "DELETE" }),
};
