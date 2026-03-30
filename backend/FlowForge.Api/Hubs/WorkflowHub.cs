using Microsoft.AspNetCore.SignalR;

namespace FlowForge.Api.Hubs;

public class WorkflowHub : Hub
{
    public async Task JoinWorkflow(string workflowId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, workflowId);
        await Clients.Group(workflowId).SendAsync("UserJoined", new
        {
            ConnectionId = Context.ConnectionId,
            WorkflowId = workflowId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task LeaveWorkflow(string workflowId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, workflowId);
        await Clients.Group(workflowId).SendAsync("UserLeft", new
        {
            ConnectionId = Context.ConnectionId,
            WorkflowId = workflowId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastGraphUpdate(string workflowId, string graphData)
    {
        await Clients.OthersInGroup(workflowId).SendAsync("GraphUpdated", new
        {
            ConnectionId = Context.ConnectionId,
            WorkflowId = workflowId,
            GraphData = graphData,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastNodeSelection(string workflowId, string nodeId)
    {
        await Clients.OthersInGroup(workflowId).SendAsync("NodeSelected", new
        {
            ConnectionId = Context.ConnectionId,
            WorkflowId = workflowId,
            NodeId = nodeId,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task BroadcastExecutionUpdate(string workflowId, object executionData)
    {
        await Clients.Group(workflowId).SendAsync("ExecutionUpdated", executionData);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
