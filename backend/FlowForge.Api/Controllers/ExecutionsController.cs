using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExecutionsController : ControllerBase
{
    private readonly IExecutionService _executionService;

    public ExecutionsController(IExecutionService executionService)
    {
        _executionService = executionService;
    }

    [HttpPost("workflows/{workflowId:guid}/execute")]
    public async Task<ActionResult<WorkflowExecutionDto>> Execute(
        Guid workflowId, [FromBody] ExecuteWorkflowDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _executionService.ExecuteWorkflowAsync(workflowId, dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("workflows/{workflowId:guid}/simulate")]
    public async Task<ActionResult<WorkflowExecutionDto>> Simulate(
        Guid workflowId, [FromBody] ExecuteWorkflowDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _executionService.SimulateWorkflowAsync(workflowId, dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("{executionId:guid}")]
    public async Task<ActionResult<WorkflowExecutionDto>> GetExecution(Guid executionId, CancellationToken ct)
    {
        var execution = await _executionService.GetExecutionAsync(executionId, ct);
        if (execution is null) return NotFound();
        return Ok(execution);
    }

    [HttpGet("workflows/{workflowId:guid}")]
    public async Task<ActionResult<IEnumerable<WorkflowExecutionDto>>> GetWorkflowExecutions(
        Guid workflowId, CancellationToken ct)
    {
        var executions = await _executionService.GetExecutionsForWorkflowAsync(workflowId, ct);
        return Ok(executions);
    }
}
