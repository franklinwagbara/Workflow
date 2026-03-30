using FlowForge.Application.DTOs;
using FlowForge.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlowForge.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet("workflows/{workflowId:guid}")]
    public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetSchedules(Guid workflowId, CancellationToken ct)
    {
        var schedules = await _scheduleService.GetSchedulesAsync(workflowId, ct);
        return Ok(schedules);
    }

    [HttpPost("workflows/{workflowId:guid}")]
    public async Task<ActionResult<ScheduleDto>> CreateSchedule(
        Guid workflowId, [FromBody] CreateScheduleDto dto, CancellationToken ct)
    {
        try
        {
            var schedule = await _scheduleService.CreateScheduleAsync(workflowId, dto, ct);
            return CreatedAtAction(nameof(GetSchedules), new { workflowId }, schedule);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{scheduleId:guid}/toggle")]
    public async Task<ActionResult<ScheduleDto>> ToggleSchedule(Guid scheduleId, CancellationToken ct)
    {
        var schedule = await _scheduleService.ToggleScheduleAsync(scheduleId, ct);
        if (schedule is null) return NotFound();
        return Ok(schedule);
    }

    [HttpDelete("{scheduleId:guid}")]
    public async Task<IActionResult> DeleteSchedule(Guid scheduleId, CancellationToken ct)
    {
        await _scheduleService.DeleteScheduleAsync(scheduleId, ct);
        return NoContent();
    }
}
