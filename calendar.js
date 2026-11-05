/* Lightweight, timezone-safe RFC 5545 calendar downloads. No dependencies. */
(function () {
  "use strict";

  const encoder = new TextEncoder();

  function parseDate(value) {
    if (typeof value !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
    if (!match) return null;
    const [, yy, mm, dd, hh, mi, ss, zone, , oh, om] = match;
    const year = Number(yy), month = Number(mm), day = Number(dd);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
    if (Number(hh) > 23 || Number(mi) > 59 || Number(ss) > 59) return null;
    if (zone !== "Z" && (Number(oh) > 14 || Number(om) > 59 || (Number(oh) === 14 && Number(om) !== 0))) return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function stamp(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function escapeText(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  // RFC 5545 folds at 75 octets, preserving complete UTF-8 code points.
  function foldLine(value) {
    const result = [];
    let line = "", size = 0;
    for (const character of value) {
      const bytes = encoder.encode(character).length;
      if (size + bytes > 75) {
        result.push(line);
        line = " ";
        size = 1;
      }
      line += character;
      size += bytes;
    }
    result.push(line);
    return result.join("\r\n");
  }

  function uid(event, couple) {
    // Stable across repeated downloads and edits to an event's scheduled time.
    const identity = `${couple.partnerOne || ""}|${couple.partnerTwo || ""}|${event.id || event.name || "event"}`;
    let first = 2166136261, second = 5381;
    for (const character of identity) {
      first = Math.imul(first ^ character.codePointAt(0), 16777619);
      second = Math.imul(second, 33) ^ character.codePointAt(0);
    }
    return `wedding-${(first >>> 0).toString(16)}${(second >>> 0).toString(16)}@invitation.local`;
  }

  function createICS(event, couple = {}) {
    if (!event || !event.calendar?.start || !event.calendar?.end) {
      return { ok: false, content: "", error: "Calendar dates are not set yet. Add this event’s start and end dates, with a time zone offset, in content.js." };
    }
    const start = parseDate(event.calendar.start), end = parseDate(event.calendar.end);
    if (!start || !end) {
      return { ok: false, content: "", error: "Calendar dates need valid ISO dates and times with seconds and a time zone offset, such as YYYY-MM-DDTHH:MM:SS+HH:MM." };
    }
    if (end <= start) {
      return { ok: false, content: "", error: "This event’s calendar end must be after its start. Check the event’s calendar settings in content.js." };
    }
    const coupleNames = [couple.partnerOne, couple.partnerTwo].filter(Boolean).join(" & ");
    const title = [event.name || event.label || "Wedding celebration", coupleNames].filter(Boolean).join(" — ");
    const description = [event.notes, event.dressCode && `Dress code: ${event.dressCode}`, event.timeZone && `Event time zone: ${event.timeZone}`].filter(Boolean).join("\n");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Wedding Invitation//Calendar//EN",
      "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
      `UID:${uid(event, couple)}`, `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(title)}`,
      `LOCATION:${escapeText([event.venue, event.address].filter(Boolean).join(", "))}`,
      `DESCRIPTION:${escapeText(description)}`, "TRANSP:OPAQUE", "END:VEVENT", "END:VCALENDAR"
    ];
    return { ok: true, content: lines.map(foldLine).join("\r\n") + "\r\n", error: "" };
  }

  function download(event, couple = {}) {
    const result = createICS(event, couple);
    if (!result.ok) return { ok: false, error: result.error };
    const url = URL.createObjectURL(new Blob([result.content], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    const fileName = String(event.id || "wedding-event").replace(/[^a-z0-9_-]+/gi, "-");
    link.href = url;
    link.download = `${fileName}.ics`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Let the browser consume the object URL before revoking it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, error: "" };
  }

  function directionsUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch {
      return "";
    }
  }

  window.WeddingCalendar = Object.freeze({ createICS, download, directionsUrl });
})();
