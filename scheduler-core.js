(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SchedulerCore = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const timePattern = /^(\d{2}):(\d{2})$/;

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
    if (minutes % 15 !== 0) {
      throw new Error("時間請以 15 分鐘為單位");
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
        return summary;
      },
      { count: 0, hours: 0 }
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

  function buildApplicationText(options) {
    const schedules = sortSchedules(options.schedules || []);
    const summary = summarizeSchedules(schedules);
    const groups = groupSchedulesByDate(schedules);
    const lines = [
      `申請：${options.serviceType || "喘息"}`,
      `個案：${options.caseName || ""}`,
      `指定單位：${options.provider || ""}`,
      `合計：${formatDuration(summary.hours)}小時 / ${formatDuration(summary.hours)}單位`,
      "",
      "服務時段：",
    ];

    Object.values(groups).forEach((group) => {
      const weekday = group.weekday ? ` (${group.weekday})` : "";
      lines.push(`${formatShortDate(group.date)}${weekday}`);
      group.items.forEach((item) => {
        const hours = calculateDurationHours(item.start, item.end);
        lines.push(
          `  ${item.start}-${item.end}（${formatDuration(hours)}小時，${formatDuration(hours)}單位）`
        );
      });
    });

    lines.push("", "謝謝");
    return lines.join("\n");
  }

  return {
    buildApplicationText,
    calculateDurationHours,
    createHourlySegments,
    filterSchedulesByDate,
    formatDuration,
    formatShortDate,
    groupSchedulesByDate,
    segmentToRange,
    sortSchedules,
    summarizeSchedules,
  };
});
