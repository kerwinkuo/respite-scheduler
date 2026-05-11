const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildApplicationText,
  calculateDurationHours,
  calculateUnits,
  createHourlySegments,
  describeTimeChange,
  filterSchedulesByDate,
  formatDuration,
} = require("./scheduler-core.js");

test("creates one selectable segment for every hour in the service day", () => {
  assert.deepEqual(createHourlySegments(6, 21), [
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "12:00-13:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
  ]);
});

test("calculates flexible durations in five-minute increments", () => {
  assert.equal(calculateDurationHours("08:30", "10:00"), 1.5);
  assert.equal(calculateDurationHours("13:15", "14:00"), 0.75);
  assert.equal(calculateDurationHours("08:05", "10:10"), 125 / 60);
});

test("rejects time ranges that end before they start", () => {
  assert.throws(
    () => calculateDurationHours("15:00", "14:00"),
    /結束時間要晚於開始時間/
  );
});

test("calculates units with two hours as one unit", () => {
  assert.equal(calculateUnits(2), 1);
  assert.equal(calculateUnits(1), 0.5);
  assert.equal(formatDuration(calculateUnits(2.5)), "1.25");
});

test("describes adjustments from an already requested time range", () => {
  assert.equal(
    describeTimeChange({
      originalStart: "08:00",
      originalEnd: "10:00",
      start: "08:30",
      end: "10:30",
    }),
    "開始延後30分鐘，結束延後30分鐘，單位不變"
  );
});

test("builds a readable request with one date per line instead of packed dates", () => {
  const text = buildApplicationText({
    caseName: "張阿珍",
    serviceType: "喘息",
    provider: "樂安家",
    schedules: [
      { date: "2026-05-11", weekday: "一", start: "08:00", end: "10:00" },
      { date: "2026-05-12", weekday: "二", start: "09:30", end: "11:00" },
    ],
  });

  assert.match(text, /單位換算：2小時 = 1單位/);
  assert.match(text, /合計：3\.5小時 \/ 1\.75單位/);
  assert.match(text, /05\/11 \(一\)\n\s+新增申請：08:00-10:00/);
  assert.match(text, /05\/12 \(二\)\n\s+新增申請：09:30-11:00/);
  assert.doesNotMatch(text, /05\/11.*05\/12/);
});

test("builds clear adjustment text for supervisors", () => {
  const text = buildApplicationText({
    caseName: "張阿珍",
    serviceType: "喘息",
    provider: "樂安家",
    schedules: [
      {
        date: "2026-05-11",
        weekday: "一",
        start: "08:30",
        end: "10:30",
        adjustment: true,
        originalStart: "08:00",
        originalEnd: "10:00",
      },
    ],
  });

  assert.match(text, /已申請時段調整/);
  assert.match(text, /原申請：08:00-10:00（2小時，1單位）/);
  assert.match(text, /調整後：08:30-10:30（2小時，1單位）/);
  assert.match(text, /調整說明：開始延後30分鐘，結束延後30分鐘，單位不變/);
});

test("filters schedules by a specific date for schedule lookup", () => {
  const schedules = [
    { date: "2026-05-11", weekday: "一", start: "08:00", end: "09:00" },
    { date: "2026-05-12", weekday: "二", start: "09:00", end: "10:00" },
    { date: "2026-05-11", weekday: "一", start: "10:00", end: "11:00" },
  ];

  assert.deepEqual(filterSchedulesByDate(schedules, "2026-05-11"), [
    { date: "2026-05-11", weekday: "一", start: "08:00", end: "09:00" },
    { date: "2026-05-11", weekday: "一", start: "10:00", end: "11:00" },
  ]);
});
