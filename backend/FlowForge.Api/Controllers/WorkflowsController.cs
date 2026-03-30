using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkflowsController : ControllerBase
{
    private readonly IWorkflowService _workflowService;

    public WorkflowsController(IWorkflowService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkflowListDto>>> GetAll(CancellationToken ct)
    {
        var workflows = await _workflowService.GetAllAsync(ct);
        return Ok(workflows);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkflowDetailDto>> GetById(Guid id, CancellationToken ct)
    {
        var workflow = await _workflowService.GetByIdAsync(id, ct);
        if (workflow is null) return NotFound();
        return Ok(workflow);
    }

    [HttpPost]
    public async Task<ActionResult<WorkflowDetailDto>> Create([FromBody] CreateWorkflowDto dto, CancellationToken ct)
    {
        var workflow = await _workflowService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = workflow.Id }, workflow);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WorkflowDetailDto>> Update(Guid id, [FromBody] UpdateWorkflowDto dto, CancellationToken ct)
    {
        var workflow = await _workflowService.UpdateAsync(id, dto, ct);
        if (workflow is null) return NotFound();
        return Ok(workflow);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _workflowService.DeleteAsync(id, ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<ActionResult<IEnumerable<WorkflowVersionDto>>> GetVersions(Guid id, CancellationToken ct)
    {
        var versions = await _workflowService.GetVersionsAsync(id, ct);
        return Ok(versions);
    }

    [HttpGet("{id:guid}/versions/{versionNumber:int}")]
    public async Task<ActionResult<WorkflowVersionDetailDto>> GetVersion(Guid id, int versionNumber, CancellationToken ct)
    {
        var version = await _workflowService.GetVersionAsync(id, versionNumber, ct);
        if (version is null) return NotFound();
        return Ok(version);
    }

    [HttpPost("{id:guid}/revert/{versionNumber:int}")]
    public async Task<ActionResult<WorkflowDetailDto>> RevertToVersion(Guid id, int versionNumber, CancellationToken ct)
    {
        var workflow = await _workflowService.RevertToVersionAsync(id, versionNumber, ct);
        if (workflow is null) return NotFound();
        return Ok(workflow);
    }

    [HttpPost("{id:guid}/export")]
    public async Task<IActionResult> Export(Guid id, CancellationToken ct)
    {
        var workflow = await _workflowService.GetByIdAsync(id, ct);
        if (workflow is null) return NotFound();

        var json = System.Text.Json.JsonSerializer.Serialize(workflow, new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
        });

        return File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", $"{workflow.Name}.json");
    }

    [HttpPost("import")]
    public async Task<ActionResult<WorkflowDetailDto>> Import([FromBody] CreateWorkflowDto dto, CancellationToken ct)
    {
        var workflow = await _workflowService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = workflow.Id }, workflow);
    }
}
