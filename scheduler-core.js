(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SchedulerCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const timePattern = /^(\d{2}):(\d{2})$/;
  const unitHours = 2;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function parseTime(value) {
    const match = timePattern.exec(value || "");
    if (!match) {
      throw new Error("時間格式需為 HH:MM");
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) {
      throw new Error("時間超出可用範圍");
    }
    if (minutes % 5 !== 0) {
      throw new Error("時間請以 5 分鐘為單位");
    }

    return hours * 60 + minutes;
  }

  function createHourlySegments(startHour, endHour) {
    const start = Number(startHour);
    const end = Number(endHour);
    if (!Number.isInteger(start) || !Number.isInteger(end) || end <= start) {
      throw new Error("時段範圍設定不正確");
    }

    const segments = [];
    for (let hour = start; hour < end; hour += 1) {
      segments.push(`${pad(hour)}:00-${pad(hour + 1)}:00`);
    }
    return segments;
  }

  function calculateDurationHours(start, end) {
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    if (endMinutes <= startMinutes) {
      throw new Error("結束時間要晚於開始時間");
    }
    return (endMinutes - startMinutes) / 60;
  }

  function calculateUnits(hours) {
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) {
      return 0;
    }
    return Math.max(1, value / unitHours);
  }

  function segmentToRange(segment) {
    const parts = String(segment).split("-");
    if (parts.length !== 2) {
      throw new Error("時段格式不正確");
    }
    return {
      start: parts[0],
      end: parts[1],
    };
  }

  function formatShortDate(date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
    if (!match) {
      return date || "";
    }
    return `${match[2]}/${match[3]}`;
  }

  function formatDuration(value) {
    const rounded = Math.round(Number(value) * 100) / 100;
    if (Number.isInteger(rounded)) {
      return String(rounded);
    }
    return String(rounded).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatMinuteDelta(minutes) {
    const absolute = Math.abs(minutes);
    const hours = Math.floor(absolute / 60);
    const mins = absolute % 60;
    const parts = [];
    if (hours) parts.push(`${hours}小時`);
    if (mins) parts.push(`${mins}分鐘`);
    return parts.join("") || "0分鐘";
  }

  function timeShiftText(label, diffMinutes) {
    if (diffMinutes > 0) return `${label}延後${formatMinuteDelta(diffMinutes)}`;
    if (diffMinutes < 0) return `${label}提前${formatMinuteDelta(diffMinutes)}`;
    return `${label}不變`;
  }

  function unitChangeText(originalHours, adjustedHours) {
    const originalUnits = calculateUnits(originalHours);
    const adjustedUnits = calculateUnits(adjustedHours);
    const diff = Math.round((adjustedUnits - originalUnits) * 100) / 100;
    if (diff > 0) return `單位增加${formatDuration(diff)}`;
    if (diff < 0) return `單位減少${formatDuration(Math.abs(diff))}`;
    return "單位不變";
  }

  function describeTimeChange(schedule) {
    const startDiff = parseTime(schedule.start) - parseTime(schedule.originalStart);
    const endDiff = parseTime(schedule.end) - parseTime(schedule.originalEnd);
    const originalHours = calculateDurationHours(schedule.originalStart, schedule.originalEnd);
    const adjustedHours = calculateDurationHours(schedule.start, schedule.end);
    return [
      timeShiftText("開始", startDiff),
      timeShiftText("結束", endDiff),
      unitChangeText(originalHours, adjustedHours),
    ].join("，");
  }

  function sortSchedules(schedules) {
    return [...schedules].sort((a, b) => {
      const byDate = String(a.date).localeCompare(String(b.date));
      if (byDate !== 0) return byDate;
      const byStart = String(a.start).localeCompare(String(b.start));
      if (byStart !== 0) return byStart;
      return String(a.end).localeCompare(String(b.end));
    });
  }

  function summarizeSchedules(schedules) {
    return schedules.reduce(
      (summary, schedule) => {
        const hours = calculateDurationHours(schedule.start, schedule.end);
        summary.count += 1;
        summary.hours += hours;
        summary.units += calculateUnits(hours);
        return summary;
      },
      { count: 0, hours: 0, units: 0 }
    );
  }

  function groupSchedulesByDate(schedules) {
    return sortSchedules(schedules).reduce((groups, schedule) => {
      const key = schedule.date;
      if (!groups[key]) {
        groups[key] = {
          date: schedule.date,
          weekday: schedule.weekday || "",
          items: [],
        };
      }
      groups[key].items.push(schedule);
      return groups;
    }, {});
  }

  function filterSchedulesByDate(schedules, date) {
    if (!date) {
      return sortSchedules(schedules || []);
    }
    return sortSchedules(schedules || []).filter((schedule) => schedule.date === date);
  }

  function timeText(start, end) {
    const hours = calculateDurationHours(start, end);
    return `${start}-${end}（${formatDuration(hours)}小時，${formatDuration(calculateUnits(hours))}單位）`;
  }

  function hasAdjustment(schedule) {
    return Boolean(
      schedule.adjustment &&
      schedule.originalStart &&
      schedule.originalEnd
    );
  }

  function buildApplicationText(options) {
    const schedules = sortSchedules(options.schedules || []);
    const summary = summarizeSchedules(schedules);
    const groups = groupSchedulesByDate(schedules);
    const lines = [
      `申請：${options.serviceType || "喘息"}`,
      `個案：${options.caseName || ""}`,
      `指定單位：${options.provider || ""}`,
      "單位換算：2小時 = 1單位，不足2小時以1單位計算",
      `合計：${formatDuration(summary.hours)}小時 / ${formatDuration(summary.units)}單位`,
      "",
      "服務時段：",
    ];

    Object.values(groups).forEach((group) => {
      const weekday = group.weekday ? ` (${group.weekday})` : "";
      lines.push(`${formatShortDate(group.date)}${weekday}`);
      group.items.forEach((item) => {
        if (hasAdjustment(item)) {
          lines.push("  已申請時段調整");
          lines.push(`    原申請：${timeText(item.originalStart, item.originalEnd)}`);
          lines.push(`    調整後：${timeText(item.start, item.end)}`);
          lines.push(`    調整說明：${describeTimeChange(item)}`);
        } else {
          lines.push(`  新增申請：${timeText(item.start, item.end)}`);
        }
      });
    });

    lines.push("", "謝謝");
    return lines.join("\n");
  }

  return {
    buildApplicationText,
    calculateDurationHours,
    calculateUnits,
    createHourlySegments,
    describeTimeChange,
    filterSchedulesByDate,
    formatDuration,
    formatShortDate,
    groupSchedulesByDate,
    segmentToRange,
    sortSchedules,
    summarizeSchedules,
  };
});
